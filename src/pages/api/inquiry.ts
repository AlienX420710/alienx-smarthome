import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const MAX_NAME_LENGTH = 100;
const MIN_NAME_LENGTH = 2;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 4000;
const MIN_MESSAGE_LENGTH = 10;
const MAX_REQUEST_BYTES = 8_192;
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

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character,
  );

const cleanName = (value: string) => value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
const cleanMessage = (value: string) => value.replace(/[\u0000\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    return json({ error: 'Unsupported content type.' }, 415);
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return json({ error: 'Request is too large.' }, 413);
  }

  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: 'Invalid request origin.' }, 403);
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

  const name = typeof payload.name === 'string' ? cleanName(payload.name) : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const message = typeof payload.message === 'string' ? cleanMessage(payload.message) : '';

  if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
    return json({ error: 'Please provide a valid name.' }, 400);
  }

  if (!email || email.length > MAX_EMAIL_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Please provide a valid email address.' }, 400);
  }

  if (message.length < MIN_MESSAGE_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
    return json({ error: 'Please provide a little more detail about your inquiry.' }, 400);
  }

  const resendApiKey = (env as unknown as { RESEND_API_KEY?: string }).RESEND_API_KEY;

  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not configured.');
    return json({ error: 'Email service is not configured.' }, 503);
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');
  const submittedAt = new Date().toISOString();

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
      subject: `New AlienX inquiry — ${name}`,
      html: `
        <div style="margin:0;padding:32px;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;color:#172033;">
          <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dfe4ec;border-radius:16px;overflow:hidden;">
            <div style="padding:24px 28px;background:#080d18;color:#ffffff;">
              <div style="font-size:12px;letter-spacing:2px;font-weight:700;color:#9eabc4;">ALIENX / INQUIRY</div>
              <h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;color:#ffffff;">New conversation started</h1>
            </div>
            <div style="padding:28px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:0 0 18px;width:110px;font-size:12px;font-weight:700;letter-spacing:1px;color:#6d7890;vertical-align:top;">NAME</td>
                  <td style="padding:0 0 18px;font-size:16px;color:#172033;vertical-align:top;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding:0 0 18px;font-size:12px;font-weight:700;letter-spacing:1px;color:#6d7890;vertical-align:top;">EMAIL</td>
                  <td style="padding:0 0 18px;font-size:16px;vertical-align:top;"><a href="mailto:${safeEmail}" style="color:#315bdc;text-decoration:none;">${safeEmail}</a></td>
                </tr>
                <tr>
                  <td style="padding:0;font-size:12px;font-weight:700;letter-spacing:1px;color:#6d7890;vertical-align:top;">MESSAGE</td>
                  <td style="padding:0;font-size:16px;line-height:1.7;color:#172033;vertical-align:top;">${safeMessage}</td>
                </tr>
              </table>
              <div style="margin-top:28px;padding-top:18px;border-top:1px solid #e7eaf0;font-size:12px;color:#7b8496;">Received ${submittedAt}</div>
            </div>
          </div>
        </div>
      `,
      text: [
        'ALIENX / INQUIRY',
        'New conversation started',
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        '',
        'Message:',
        message,
        '',
        `Received: ${submittedAt}`,
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
