import site from '../engineering.config.json';

type Bindings = {
  TURNSTILE_SECRET?: unknown;
  TURNSTILE_HOSTNAMES?: unknown;
  RESEND_API_KEY?: unknown;
  [key: string]: unknown;
};
const hasValue = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0;
const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
  'Content-Security-Policy':
    "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

// Read configuration only: never contact providers or invoke the limiter.
export function statusResponse(
  environment: object,
  method: string,
  revision: string,
  request?: Request,
) {
  if (method !== 'GET' && method !== 'HEAD')
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
      status: 405,
      headers: { ...headers, Allow: 'GET, HEAD' },
    });
  const bindings = environment as Bindings;
  const limiter = bindings[site.status.limiterBinding] as
    { limit?: unknown } | undefined;
  const signals: Record<string, boolean> = {
    verification:
      hasValue(bindings.TURNSTILE_SECRET) &&
      typeof bindings.TURNSTILE_HOSTNAMES === 'string' &&
      bindings.TURNSTILE_HOSTNAMES.split(',').some(
        (host) => host.trim().length > 0,
      ),
    delivery: hasValue(bindings.RESEND_API_KEY),
    limiter: typeof limiter?.limit === 'function',
  };
  const checks = Object.fromEntries(
    site.status.checks.map((check) => {
      const ready = check.requires.every((signal) => signals[signal] === true);
      return [
        check.key,
        {
          status: ready ? check.ready : 'degraded',
          detail: ready ? check.detail : check.failure,
        },
      ];
    }),
  );
  const values = Object.values(checks);
  const ok = values.every((check) => check.status !== 'degraded');
  const operational = values.filter(
    (check) => check.status === 'operational',
  ).length;
  const configured = values.filter(
    (check) => check.status === 'configured',
  ).length;
  const body = {
    ok,
    status: ok ? 'operational' : 'degraded',
    checks,
    ...(site.privateStatus
      ? {
          scope: 'configuration-readiness',
          summary: `${operational} of ${values.length} configuration checks passed`,
        }
      : {
          buildRevision: revision,
          generatedAt: new Date().toISOString(),
          requestId: request?.headers.get('cf-ray') ?? crypto.randomUUID(),
          rateLimiting: signals.limiter ? 'edge-location' : 'unavailable',
          summary: `${operational} live · ${configured} configured`,
          runtime: 'Cloudflare Workers',
        }),
  };
  return new Response(method === 'HEAD' ? null : JSON.stringify(body), {
    status: ok ? 200 : 503,
    headers,
  });
}
