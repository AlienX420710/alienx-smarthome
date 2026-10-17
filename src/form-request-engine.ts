import type { MiddlewareHandler } from 'astro';
import {
  createAttemptLimiter,
  RATE_WINDOW_MS,
  readBoundedBody,
  verifyChallenge,
} from './form-engine';
import { secure } from './security';

type Failure = { error: string; code?: string };
type Protection = {
  limiter?: { limit(options: { key: string }): Promise<{ success: boolean }> };
  secret?: string;
  hostnames?: string;
};
type Options = {
  endpoint: string;
  requestPrefix: string;
  requestIdLength?: number;
  limiterPrefix: string;
  protection: () => Protection | Promise<Protection>;
  limited: Failure;
  capacity?: Failure;
  unavailable: Failure;
  json?: {
    maxBytes: number;
    action: string;
    tokenField: string;
    trapField: string;
    retryHeader: string;
    errors: Record<
      | 'retry'
      | 'media'
      | 'origin'
      | 'size'
      | 'parse'
      | 'configuration'
      | 'trap'
      | 'token'
      | 'expired'
      | 'failed'
      | 'verificationUnavailable',
      Failure
    >;
    verified: (
      locals: App.Locals,
      payload: Record<string, unknown>,
      requestId: string,
    ) => void;
  };
};

export function createFormRequestMiddleware(
  options: Options,
): MiddlewareHandler {
  const attempt = createAttemptLimiter();
  const respond = (failure: Failure, status: number, requestId?: string) =>
    secure(
      new Response(
        JSON.stringify({ ...failure, ...(requestId ? { requestId } : {}) }),
        {
          status,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...(requestId ? { 'X-Request-ID': requestId } : {}),
            ...(status === 429
              ? { 'Retry-After': String(Math.ceil(RATE_WINDOW_MS / 1000)) }
              : {}),
          },
        },
      ),
    );
  return async ({ request, locals }, next) => {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, '');
    const finish = async () =>
      secure(
        await next(),
        pathname === '/api/status',
        url.protocol === 'http:' &&
          ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
      );
    if (request.method !== 'POST' || pathname !== options.endpoint)
      return finish();

    const jsonPolicy = options.json;
    const retryKey = jsonPolicy
      ? request.headers.get(jsonPolicy.retryHeader)
      : null;
    if (
      retryKey &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        retryKey,
      )
    )
      return respond(jsonPolicy!.errors.retry, 400);
    const id = (retryKey ?? crypto.randomUUID()).replaceAll('-', '');
    const requestId =
      options.requestPrefix +
      (options.requestIdLength
        ? id.slice(0, options.requestIdLength)
        : id
      ).toUpperCase();
    let payload: Record<string, unknown> | undefined;
    if (jsonPolicy) {
      const errors = jsonPolicy.errors;
      if (
        request.headers
          .get('content-type')
          ?.split(';')[0]
          .trim()
          .toLowerCase() !== 'application/json'
      )
        return respond(errors.media, 415, requestId);
      const origin = request.headers.get('origin');
      if (origin && origin !== url.origin)
        return respond(errors.origin, 403, requestId);
      if (Number(request.headers.get('content-length')) > jsonPolicy.maxBytes)
        return respond(errors.size, 413, requestId);
      try {
        const bytes = await readBoundedBody(request, jsonPolicy.maxBytes);
        if (bytes === null) return respond(errors.size, 413, requestId);
        const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
          throw new Error('Expected an object');
        payload = parsed as Record<string, unknown>;
      } catch {
        return respond(errors.parse, 400, requestId);
      }
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const decision = attempt(ip);
    if (decision !== 'allowed')
      return respond(
        decision === 'capacity'
          ? (options.capacity ?? options.limited)
          : options.limited,
        429,
        requestId,
      );
    let protection: Protection;
    try {
      protection = await options.protection();
      if (!protection.limiter || typeof protection.limiter.limit !== 'function')
        throw new Error('Missing rate limiter');
      const result = await protection.limiter.limit({
        key: options.limiterPrefix + ip,
      });
      if (result.success !== true)
        return respond(options.limited, 429, requestId);
    } catch {
      return respond(options.unavailable, 503, requestId);
    }

    if (jsonPolicy && payload) {
      const errors = jsonPolicy.errors;
      const secret = protection.secret?.trim();
      const hostnames = new Set(
        (protection.hostnames ?? '')
          .split(',')
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean),
      );
      if (!secret || !hostnames.size) {
        console.error('Turnstile is not configured.', { requestId });
        return respond(errors.configuration, 503, requestId);
      }
      if (
        Object.hasOwn(payload, jsonPolicy.trapField) &&
        payload[jsonPolicy.trapField] !== ''
      )
        return respond(errors.trap, 403, requestId);
      const rawToken = payload[jsonPolicy.tokenField];
      const token = typeof rawToken === 'string' ? rawToken.trim() : '';
      if (!token || token.length > 2048)
        return respond(errors.token, 403, requestId);
      const verified = await verifyChallenge(
        secret,
        token,
        hostnames,
        jsonPolicy.action,
        ip,
      );
      if (verified !== 'passed')
        return respond(
          verified === 'unavailable'
            ? errors.verificationUnavailable
            : errors[verified],
          403,
          requestId,
        );
      jsonPolicy.verified(
        locals,
        { ...payload, [jsonPolicy.tokenField]: '' },
        requestId,
      );
    }
    return finish();
  };
}

export type FormRequestResult =
  | { ok: true; data: FormData }
  | {
      ok: false;
      status: number;
      kind: 'size' | 'origin' | 'media' | 'parse' | 'trap' | 'controls';
      field?: string;
    };

// Preserve form transport checks before any schema validation or provider access.
export async function parseFormRequest(
  request: Request,
  options: {
    maxBytes: number;
    trapField: string;
    repeatableFields: ReadonlySet<string>;
    multilineFields: ReadonlySet<string>;
  },
): Promise<FormRequestResult> {
  const length = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(length) && length > options.maxBytes)
    return { ok: false, status: 413, kind: 'size' };
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    return { ok: false, status: 403, kind: 'origin' };
  const type = request.headers
    .get('content-type')
    ?.split(';')[0]
    .trim()
    .toLowerCase();
  if (
    !['application/x-www-form-urlencoded', 'multipart/form-data'].includes(
      type || '',
    )
  )
    return { ok: false, status: 415, kind: 'media' };
  const bytes = await readBoundedBody(request, options.maxBytes);
  if (bytes === null) return { ok: false, status: 413, kind: 'size' };
  let data: FormData;
  try {
    data = await new Response(bytes, {
      headers: { 'Content-Type': request.headers.get('content-type')! },
    }).formData();
  } catch {
    return { ok: false, status: 400, kind: 'parse' };
  }
  if (
    data
      .getAll(options.trapField)
      .some((value) => typeof value !== 'string' || value.length > 0)
  )
    return { ok: false, status: 403, kind: 'trap' };
  const seen = new Set<string>();
  for (const [key, value] of data) {
    if (
      typeof value !== 'string' ||
      (!options.repeatableFields.has(key) && seen.has(key))
    )
      return { ok: false, status: 400, kind: 'parse' };
    seen.add(key);
    const controls = options.multilineFields.has(key)
      ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/
      : /[\u0000-\u001f\u007f]/;
    if (controls.test(value))
      return { ok: false, status: 400, kind: 'controls', field: key };
  }
  return { ok: true, data };
}
