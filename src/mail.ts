import site from '../engineering.config.json';
export const FROM_EMAIL = site.mail.sender;
type Message = {
  subject: string;
  text?: string;
  html?: string;
  reply_to?: string;
  to?: string[];
};

// One direct transport. Caller-supplied sender fields can never override identity.
export function sendMail(
  apiKey: string,
  idempotencyKey: string,
  message: Message,
): Promise<Response> {
  const to =
    site.mail.customerConfirmation && message.to
      ? message.to
      : [site.mail.recipient];
  return sendTo(apiKey, idempotencyKey, message, to);
}

function sendTo(
  apiKey: string,
  idempotencyKey: string,
  message: Omit<Message, 'to'>,
  to: string[],
): Promise<Response> {
  const token = apiKey.trim();
  if (!token) throw new Error('Mail credential missing');
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      subject: message.subject,
      text: message.text,
      html: message.html,
      reply_to: message.reply_to,
      from: FROM_EMAIL,
      to,
    }),
    signal: AbortSignal.timeout(site.mail.timeoutMs),
  });
}

// Business-only callers always use the fixed recipient, even if a
// structurally wider object unexpectedly supplies a to/from property at runtime.
export function sendProductionMail(
  apiKey: string,
  idempotencyKey: string,
  message: Omit<Message, 'to'>,
): Promise<Response> {
  return sendMail(apiKey, idempotencyKey, {
    ...message,
    to: [site.mail.recipient],
  });
}

// Operational heartbeats never inherit the business/customer destination.
export function sendHealthMail(
  apiKey: string,
  idempotencyKey: string,
  message: Omit<Message, 'to'>,
): Promise<Response> {
  const recipient = site.mail.healthRecipient?.trim();
  if (!recipient) throw new Error('Health recipient missing');
  return sendTo(apiKey, idempotencyKey, message, [recipient]);
}
