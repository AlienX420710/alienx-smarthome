// Shared by validated inquiries and the fixed-recipient production cron.
// Callers cannot select another sender or destination.
const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const RESEND_ORIGIN = 'https://api.resend.com';
const SAFE_REDIRECTS = new Set([301, 302, 307, 308]);

const requestMail = (
  url: string,
  apiKey: string,
  idempotencyKey: string,
  body: string,
) =>
  fetch(url, {
    method: 'POST',
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body,
  });

export async function sendProductionMail(
  apiKey: string,
  idempotencyKey: string,
  message: { subject: string; text: string; html?: string; reply_to?: string },
) {
  const token = apiKey.trim();
  if (!token) throw new Error('Mail configuration is missing');

  const body = JSON.stringify({
    ...message,
    from: 'AlienX SmartHome <contact@alienxsmarthome.com>',
    to: ['alienx@alienxsmarthome.com'],
  });

  let response = await requestMail(RESEND_ENDPOINT, token, idempotencyKey, body);
  if (!SAFE_REDIRECTS.has(response.status)) return response;

  const location = response.headers.get('location');
  if (!location) return response;

  const redirect = new URL(location, RESEND_ENDPOINT);
  if (redirect.origin !== RESEND_ORIGIN) {
    await response.body?.cancel();
    throw new Error('Mail provider redirect was rejected');
  }

  await response.body?.cancel();
  response = await requestMail(redirect.toString(), token, idempotencyKey, body);

  // One same-origin canonicalization hop is enough. Never chase a redirect loop
  // or forward the bearer credential to another origin.
  if (SAFE_REDIRECTS.has(response.status)) {
    await response.body?.cancel();
    throw new Error('Mail provider redirect limit exceeded');
  }

  return response;
}
