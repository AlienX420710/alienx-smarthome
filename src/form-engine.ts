// Shared bounded primitives; routes retain their field schema and response copy.
export async function readBoundedBody(request: Request, maximum: number) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > maximum) {
        try {
          await reader.cancel();
        } catch {
          /* Oversize remains oversize. */
        }
        return null;
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export const RATE_WINDOW_MS = 10 * 60 * 1000;
export function createAttemptLimiter(
  limit = 8,
  capacity = 5000,
  windowMs = RATE_WINDOW_MS,
) {
  const attempts = new Map<string, number[]>();
  return (ip: string, now = Date.now()): 'allowed' | 'limited' | 'capacity' => {
    const recent = (attempts.get(ip) ?? []).filter(
      (time) => now - time < windowMs,
    );
    if (attempts.size >= capacity) {
      for (const [address, times] of attempts) {
        const active = times.filter((time) => now - time < windowMs);
        if (active.length) attempts.set(address, active);
        else attempts.delete(address);
      }
    }
    if (recent.length >= limit) return 'limited';
    // Never evict an active address to admit another one.
    if (!attempts.has(ip) && attempts.size >= capacity) return 'capacity';
    recent.push(now);
    attempts.set(ip, recent);
    return 'allowed';
  };
}

export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character] ?? character,
  );
}
export function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
export async function contentDigest(value: unknown) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export async function verifyChallenge(
  secret: string,
  token: string,
  hostnames: Set<string>,
  action: string,
  ip?: string | null,
): Promise<'passed' | 'expired' | 'failed' | 'unavailable'> {
  if (!secret.trim() || !token || token.length > 2048 || !hostnames.size)
    return 'failed';
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) {
      try {
        await response.body?.cancel();
      } catch {
        /* Preserve failure. */
      }
      return 'unavailable';
    }
    const result: unknown = await response.json();
    if (!result || typeof result !== 'object') return 'failed';
    const data = result as {
      success?: unknown;
      hostname?: unknown;
      action?: unknown;
      'error-codes'?: unknown;
    };
    if (
      data.success === true &&
      typeof data.hostname === 'string' &&
      hostnames.has(data.hostname) &&
      data.action === action
    )
      return 'passed';
    const codes = Array.isArray(data['error-codes']) ? data['error-codes'] : [];
    return codes.includes('timeout-or-duplicate') ||
      codes.includes('invalid-input-response')
      ? 'expired'
      : 'failed';
  } catch {
    return 'unavailable';
  }
}
