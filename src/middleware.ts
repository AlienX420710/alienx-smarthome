import { defineMiddleware } from 'astro:middleware';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const EXPECTED_ACTION = 'contact';
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 8;
const MAX_TRACKED_IPS = 5000;
const attempts = new Map<string, number[]>();

const securityHeaders = {
	'Content-Security-Policy': "frame-ancestors 'none'",
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

export const onRequest = defineMiddleware(async ({ request, locals }, next) => {
	if (request.method !== 'POST' || !/^\/api\/inquiry\/?$/.test(new URL(request.url).pathname)) return secure(await next());

	const retryKey = request.headers.get('Idempotency-Key');
	if (retryKey && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(retryKey)) return json({ error: 'Invalid retry key.' }, 400);
	const requestId = `AX-${(retryKey ?? crypto.randomUUID()).replaceAll('-', '').toUpperCase()}`;
	// Bound the stream before parsing or calling either external provider.
	if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
		return json({ error: 'Unsupported content type.', requestId }, 415, requestId);
	}
	const origin = request.headers.get('origin');
	if (origin && origin !== new URL(request.url).origin) return json({ error: 'Invalid request origin.', requestId }, 403, requestId);
	const maxBytes = 16_384;
	if (Number(request.headers.get('content-length')) > maxBytes) return json({ error: 'Request is too large.', requestId }, 413, requestId);
	let payload: Record<string, unknown>;
	try {
		const reader = request.body?.getReader();
		if (!reader) return json({ error: 'Invalid request.', requestId }, 400, requestId);
		const chunks: Uint8Array[] = [];
		let length = 0;
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			length += value.byteLength;
			if (length > maxBytes) {
				await reader.cancel();
				return json({ error: 'Request is too large.', requestId }, 413, requestId);
			}
			chunks.push(value);
		}
		const bytes = new Uint8Array(length);
		let offset = 0;
		for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
		const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected an object');
		payload = parsed as Record<string, unknown>;
	} catch {
		return json({ error: 'Invalid request.', requestId }, 400, requestId);
	}

	const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
	const now = Date.now();
	const recent = (attempts.get(ip) ?? []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
	if (attempts.size >= MAX_TRACKED_IPS) pruneAttempts(now);
	// Fail closed at capacity instead of growing the isolate's map without bound.
	if (recent.length >= RATE_LIMIT || (!attempts.has(ip) && attempts.size >= MAX_TRACKED_IPS)) {
		return json({ error: 'Too many inquiries. Please try again later.', code: 'rate-limited', requestId }, 429, requestId);
	}
	recent.push(now);
	attempts.set(ip, recent);

	const { env } = await import('cloudflare:workers');
	const bindings = env as unknown as { TURNSTILE_SECRET?: string; TURNSTILE_HOSTNAMES?: string; INQUIRY_RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> } };
	if (bindings.INQUIRY_RATE_LIMITER) {
		try {
			const result = await bindings.INQUIRY_RATE_LIMITER.limit({ key: `alienx-inquiry:${ip}` });
			if (!result.success) return json({ error: 'Too many inquiries. Please try again later.', code: 'rate-limited', requestId }, 429, requestId);
		} catch {
			return json({ error: 'Inquiry protection is unavailable. Please try again later.', requestId }, 503, requestId);
		}
	}
	const secret = bindings.TURNSTILE_SECRET;
	const expectedHostnames = new Set((bindings.TURNSTILE_HOSTNAMES ?? '').split(',').map((h) => h.trim()).filter(Boolean));
	if (!secret || expectedHostnames.size === 0) {
		console.error('Turnstile is not configured.', { requestId });
		return json({ error: 'Security verification is not configured.', code: 'turnstile-not-configured', requestId }, 503, requestId);
	}

	if (typeof payload.faxNumber === 'string' && payload.faxNumber.trim() !== '') {
		return json({ error: 'We could not verify this inquiry. Please try again.', code: 'inquiry-rejected', requestId }, 403, requestId);
	}

	const token = typeof payload.website === 'string' ? payload.website.trim() : '';
	if (!token || token.length > 2048) return json({ error: 'Please complete the security verification.', code: 'turnstile-missing', requestId }, 403, requestId);

	try {
		const response = await fetch(SITEVERIFY_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ secret, response: token, remoteip: ip }),
			signal: AbortSignal.timeout(10000),
		});
		if (!response.ok) throw new Error(`Turnstile Siteverify returned ${response.status}.`);
		const result = await response.json() as { success?: boolean; action?: string; hostname?: string; 'error-codes'?: string[] };
		const errorCodes = result['error-codes'] ?? [];
		if (!result.success || result.action !== EXPECTED_ACTION || !result.hostname || !expectedHostnames.has(result.hostname)) {
			console.warn('Turnstile validation rejected inquiry.', { requestId, action: result.action, hostname: result.hostname, errorCodes });
			if (errorCodes.includes('timeout-or-duplicate') || errorCodes.includes('invalid-input-response')) {
				return json({ error: 'The security check expired. Please complete it again and submit the form.', code: 'turnstile-expired', requestId }, 403, requestId);
			}
			return json({ error: 'Security verification failed. Please try again.', code: 'turnstile-failed', requestId }, 403, requestId);
		}
	} catch (error) {
		console.error('Turnstile validation failed:', error instanceof Error ? error.message : 'Unknown error', { requestId });
		return json({ error: 'Security verification could not be completed.', code: 'turnstile-unavailable', requestId }, 403, requestId);
	}

	// Locals cannot be forged with a client header, and avoid parsing the body twice.
	locals.verifiedInquiry = { payload: { ...payload, website: '' }, requestId };
	return secure(await next());
});
