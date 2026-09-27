// Shared by validated inquiries and the fixed-recipient production cron.
// Callers cannot select another sender or destination.
export function sendProductionMail(
  apiKey: string,
  idempotencyKey: string,
  message: { subject: string; text: string; html?: string; reply_to?: string },
) {
  if (!apiKey.trim()) throw new Error('Mail configuration is missing');
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
