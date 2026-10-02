// Shared by validated inquiries and the fixed-recipient production cron.
// Callers cannot select another sender or destination.
export function sendProductionMail(
  apiKey: string,
  idempotencyKey: string,
  message: { subject: string; text: string; html?: string; reply_to?: string },
): Promise<Response> {
  const token = apiKey.trim();
  if (!token) throw new Error('Mail configuration is missing');

  // Intentionally use Fetch's default redirect behavior here. This matches the
  // proven direct Resend transport used by Cleaning By Cassi; do not reintroduce
  // a custom redirect policy around this provider endpoint.
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      ...message,
      from: 'AlienX SmartHome <contact@alienxsmarthome.com>',
      to: ['alienx@alienxsmarthome.com'],
    }),
  });
}
