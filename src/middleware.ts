import {
  createAttemptLimiter,
  RATE_WINDOW_MS,
  readBoundedBody,
  verifyChallenge,
} from './form-engine';
import { secure } from './security';
import { defineMiddleware } from 'astro:middleware';

const attempt = createAttemptLimiter();

const json = (
  body: Record<string, unknown>,
  status = 403,
  requestId?: string,
) =>
  secure(
    new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        ...(status === 429
          ? { 'Retry-After': String(RATE_WINDOW_MS / 1000) }
          : {}),
        ...(requestId ? { 'X-Request-ID': requestId } : {}),
      },
    }),
  );

export const onRequest = defineMiddleware(async ({ request, locals }, next) => {
  if (
    request.method !== 'POST' ||
    !/^\/api\/inquiry\/?$/.test(new URL(request.url).pathname)
  )
    return secure(await next());

  const retryKey = request.headers.get('Idempotency-Key');
  if (
    retryKey &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      retryKey,
    )
  )
    return json({ error: 'Invalid retry key.' }, 400);
  const requestId = `AX-${(retryKey ?? crypto.randomUUID()).replaceAll('-', '').toUpperCase()}`;
  // Bound the stream before parsing or calling either external provider.
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  ) {
    return json(
      { error: 'Unsupported content type.', requestId },
      415,
      requestId,
    );
  }
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    return json(
      { error: 'Invalid request origin.', requestId },
      403,
      requestId,
    );
  const maxBytes = 16_384;
  if (Number(request.headers.get('content-length')) > maxBytes)
    return json({ error: 'Request is too large.', requestId }, 413, requestId);
  let payload: Record<string, unknown>;
  try {
    const bytes = await readBoundedBody(request, maxBytes);
    if (bytes === null)
      return json(
        { error: 'Request is too large.', requestId },
        413,
        requestId,
      );
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      throw new Error('Expected an object');
    payload = parsed as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid request.', requestId }, 400, requestId);
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (attempt(ip) !== 'allowed') {
    return json(
      {
        error: 'Too many inquiries. Please try again later.',
        code: 'rate-limited',
        requestId,
      },
      429,
      requestId,
    );
  }

  const { env } = await import('cloudflare:workers');
  const bindings = env as unknown as {
    TURNSTILE_SECRET?: string;
    TURNSTILE_HOSTNAMES?: string;
    INQUIRY_RATE_LIMITER?: {
      limit(options: { key: string }): Promise<{ success: boolean }>;
    };
  };
  if (!bindings.INQUIRY_RATE_LIMITER) {
    return json(
      {
        error: 'Inquiry protection is unavailable. Please try again later.',
        requestId,
      },
      503,
      requestId,
    );
  }
  {
    try {
      const result = await bindings.INQUIRY_RATE_LIMITER.limit({
        key: `alienx-inquiry:${ip}`,
      });
      if (result.success !== true)
        return json(
          {
            error: 'Too many inquiries. Please try again later.',
            code: 'rate-limited',
            requestId,
          },
          429,
          requestId,
        );
    } catch {
      return json(
        {
          error: 'Inquiry protection is unavailable. Please try again later.',
          requestId,
        },
        503,
        requestId,
      );
    }
  }
  const secret = bindings.TURNSTILE_SECRET?.trim();
  const expectedHostnames = new Set(
    (bindings.TURNSTILE_HOSTNAMES ?? '')
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean),
  );
  if (!secret || expectedHostnames.size === 0) {
    console.error('Turnstile is not configured.', { requestId });
    return json(
      {
        error: 'Security verification is not configured.',
        code: 'turnstile-not-configured',
        requestId,
      },
      503,
      requestId,
    );
  }

  if (Object.hasOwn(payload, 'faxNumber') && payload.faxNumber !== '') {
    return json(
      {
        error: 'We could not verify this inquiry. Please try again.',
        code: 'inquiry-rejected',
        requestId,
      },
      403,
      requestId,
    );
  }

  const token =
    typeof payload.website === 'string' ? payload.website.trim() : '';
  if (!token || token.length > 2048)
    return json(
      {
        error: 'Please complete the security verification.',
        code: 'turnstile-missing',
        requestId,
      },
      403,
      requestId,
    );

  const verification = await verifyChallenge(
    secret,
    token,
    expectedHostnames,
    'contact',
    ip,
  );
  if (verification !== 'passed') {
    const failure = {
      expired: [
        'The security check expired. Please complete it again and submit the form.',
        'turnstile-expired',
      ],
      failed: [
        'Security verification failed. Please try again.',
        'turnstile-failed',
      ],
      unavailable: [
        'Security verification could not be completed.',
        'turnstile-unavailable',
      ],
    }[verification];
    return json(
      { error: failure[0], code: failure[1], requestId },
      403,
      requestId,
    );
  }

  // Locals cannot be forged with a client header, and avoid parsing the body twice.
  locals.verifiedInquiry = { payload: { ...payload, website: '' }, requestId };
  return secure(await next());
});
