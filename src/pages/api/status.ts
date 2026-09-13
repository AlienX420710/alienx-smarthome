import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

type CheckStatus = 'operational' | 'configured' | 'degraded';

type Check = {
  status: CheckStatus;
  detail: string;
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

export const GET: APIRoute = async ({ request }) => {
  const bindings = env as unknown as {
    TURNSTILE_SECRET?: string;
    TURNSTILE_HOSTNAMES?: string;
    RESEND_API_KEY?: string;
    INQUIRY_RATE_LIMITER?: unknown;
  };
  const turnstileConfigured = Boolean(
    bindings.TURNSTILE_SECRET &&
    bindings.TURNSTILE_HOSTNAMES?.split(',').some((host) => host.trim()),
  );

  const checks: Record<string, Check> = {
    worker: {
      status: 'operational',
      detail: 'Production Worker is responding',
    },
    inquiry: {
      status:
        turnstileConfigured && bindings.RESEND_API_KEY
          ? 'configured'
          : 'degraded',
      detail:
        'Configuration check only; no inquiry or provider delivery test is performed',
    },
    turnstile: {
      status: turnstileConfigured ? 'configured' : 'degraded',
      detail: turnstileConfigured
        ? 'Turnstile protection is configured'
        : 'Turnstile protection is not configured',
    },
    resend: {
      status: bindings.RESEND_API_KEY ? 'configured' : 'degraded',
      detail: bindings.RESEND_API_KEY
        ? 'Resend delivery integration is configured'
        : 'Resend delivery integration is not configured',
    },
  };

  const values = Object.values(checks);
  const degraded = values.some((check) => check.status === 'degraded');
  const operational = values.filter(
    (check) => check.status === 'operational',
  ).length;
  const configured = values.filter(
    (check) => check.status === 'configured',
  ).length;

  return json(
    {
      ok: !degraded,
      buildRevision: __ALIENX_BUILD_SHA__,
      status: degraded ? 'degraded' : 'operational',
      generatedAt: new Date().toISOString(),
      requestId: request.headers.get('cf-ray') ?? crypto.randomUUID(),
      checks,
      rateLimiting: bindings.INQUIRY_RATE_LIMITER
        ? 'edge-location'
        : 'isolate-fallback',
      summary: `${operational} live · ${configured} configured`,
      runtime: 'Cloudflare Workers',
    },
    degraded ? 503 : 200,
  );
};
