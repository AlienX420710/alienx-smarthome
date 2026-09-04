import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 4000;
const TO_ADDRESS = 'alienx@alienxsmarthome.com';
const FROM_ADDRESS = 'AlienX SmartHome <alienx@alienxsmarthome.com>';

interface InquiryPayload {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown;
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    return json({ error: 'Unsupported content type.' }, 415);
  }

  let payload: InquiryPayload;

  try {
    payload = (await request.json()) as InquiryPayload;
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  // Honeypot: automated submissions should fill this hidden field; real users leave it empty.
  if (typeof payload.website === 'string' && payload.website.trim() !== '') {
    return json({ ok: true });
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';

  if (!name || name.length > MAX_NAME_LENGTH) {
    return json({ error: 'Please provide a valid name.' }, 400);
  }

  if (!email || email.length > MAX_EMAIL_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Please provide a valid email address.' }, 400);
  }

  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return json({ error: 'Please provide a message.' }, 400);
  }

  const resendApiKey = (env as unknown as { RESEND_API_KEY?: string }).RESEND_API_KEY;

  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not configured.');
    return json({ error: 'Email service is not configured.' }, 503);
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [TO_ADDRESS],
      reply_to: email,
      subject: `AlienX inquiry from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        '',
        message,
      ].join('\n'),
    }),
  });

  if (!response.ok) {
    console.error('Resend email request failed:', response.status);
    return json({ error: 'We could not send your message. Please try again.' }, 502);
  }

  return json({ ok: true });
};

export const ALL: APIRoute = async () =>
  json({ error: 'Method not allowed.' }, 405);
