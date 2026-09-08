import { defineMiddleware } from 'astro:middleware';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const EXPECTED_ACTION = 'contact';
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 8;
const MAX_TRACKED_IPS = 5000;
const attempts = new Map<string, number[]>();

const securityHeaders = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'geolocation=(), payment=()',
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

const secure = (response: Response) => {
	const headers = new Headers(response.headers);
	for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value);
	return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

const json = (body: Record<string, unknown>, status = 403, requestId?: string) =>
	secure(new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'no-store',
			...(requestId ? { 'X-Request-ID': requestId } : {}),
		},
	}));

const pruneAttempts = (now: number) => {
	for (const [ip, timestamps] of attempts) {
		const recent = timestamps.filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
		if (recent.length === 0) attempts.delete(ip);
		else attempts.set(ip, recent);
	}
};

export const onRequest = defineMiddleware(async ({ request }, next) => {
	if (request.method !== 'POST' || new URL(request.url).pathname !== '/api/inquiry') return secure(await next());

	const requestId = `AX-${crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
	const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
	const now = Date.now();
	const recent = (attempts.get(ip) ?? []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);

	if (attempts.size > MAX_TRACKED_IPS) pruneAttempts(now);
	if (recent.length >= RATE_LIMIT) return json({ error: 'Too many inquiries. Please try again later.', requestId }, 429, requestId);
	recent.push(now);
	attempts.set(ip, recent);

	const { env } = await import('cloudflare:workers');
	const bindings = env as unknown as { TURNSTILE_SECRET?: string; TURNSTILE_HOSTNAMES?: string };
	const secret = bindings.TURNSTILE_SECRET;
	const expectedHostnames = new Set((bindings.TURNSTILE_HOSTNAMES ?? '').split(',').map((h) => h.trim()).filter(Boolean));
	if (!secret || expectedHostnames.size === 0) {
		console.error('Turnstile is not configured.', { requestId });
		return json({ error: 'Security verification is not configured.', requestId }, 503, requestId);
	}

	let payload: Record<string, unknown>;
	try {
		payload = await request.clone().json() as Record<string, unknown>;
	} catch {
		return json({ error: 'Invalid request.', requestId }, 400, requestId);
	}

	if (typeof payload.websiteTrap === 'string' && payload.websiteTrap.trim() !== '') {
		return json({ ok: true, requestId }, 200, requestId);
	}

	const token = typeof payload.website === 'string' ? payload.website.trim() : '';
	if (!token || token.length > 2048) return json({ error: 'Please complete the security verification.', requestId }, 403, requestId);

	try {
		const response = await fetch(SITEVERIFY_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ secret, response: token, remoteip: ip }),
			signal: AbortSignal.timeout(10000),
		});
		if (!response.ok) throw new Error(`Turnstile Siteverify returned ${response.status}.`);
		const result = await response.json() as { success?: boolean; action?: string; hostname?: string };
		if (!result.success || result.action !== EXPECTED_ACTION || !result.hostname || !expectedHostnames.has(result.hostname)) {
			return json({ error: 'Security verification failed. Please try again.', requestId }, 403, requestId);
		}
	} catch (error) {
		console.error('Turnstile validation failed:', error instanceof Error ? error.message : 'Unknown error', { requestId });
		return json({ error: 'Security verification could not be completed.', requestId }, 403, requestId);
	}

	const sanitizedPayload = { ...payload, website: '' };
	const headers = new Headers(request.headers);
	headers.set('X-Request-ID', requestId);
	headers.set('Content-Type', 'application/json');
	return secure(await next(new Request(request.url, {
		method: request.method,
		headers,
		body: JSON.stringify(sanitizedPayload),
	})));
});
