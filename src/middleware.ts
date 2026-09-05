import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const EXPECTED_ACTION = 'contact';

const json = (body: Record<string, unknown>, status = 403) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

export const onRequest = defineMiddleware(async (context, next) => {
  const { request } = context;

  if (request.method !== 'POST' || new URL(request.url).pathname !== '/api/inquiry') {
    return next();
  }

  const secret = (env as unknown as { TURNSTILE_SECRET?: string }).TURNSTILE_SECRET;
  const expectedHostnames = new Set(
    ((env as unknown as { TURNSTILE_HOSTNAMES?: string }).TURNSTILE_HOSTNAMES ?? '')
      .split(',')
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  );

  if (!secret || expectedHostnames.size === 0) {
    console.error('Turnstile is not configured.');
    return json({ error: 'Security verification is not configured.' }, 503);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.clone().json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const token = typeof payload.website === 'string' ? payload.website.trim() : '';
  if (!token || token.length > 2048) {
    return json({ error: 'Please complete the security verification.' });
  }

  let result: {
    success?: boolean;
    action?: string;
    hostname?: string;
  };

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: request.headers.get('CF-Connecting-IP') ?? '',
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Turnstile Siteverify returned ${response.status}.`);
    }

    result = (await response.json()) as typeof result;
  } catch (error) {
    console.error('Turnstile validation failed:', error instanceof Error ? error.message : 'Unknown error');
    return json({ error: 'Security verification could not be completed.' }, 403);
  }

  if (!result.success || result.action !== EXPECTED_ACTION || !result.hostname || !expectedHostnames.has(result.hostname)) {
    return json({ error: 'Security verification failed. Please try again.' }, 403);
  }

  // The existing inquiry endpoint uses `website` as its honeypot field.
  // Remove the Turnstile token before handing the request to that handler.
  const sanitizedPayload = { ...payload, website: '' };
  const headers = new Headers(request.headers);

  return next(
    new Request(request.url, {
      method: request.method,
      headers,
      body: JSON.stringify(sanitizedPayload),
    }),
  );
});
