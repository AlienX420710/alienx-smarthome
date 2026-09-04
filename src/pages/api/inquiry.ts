import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const MAX_REQUEST_BYTES = 16_384;
const MAX_NAME_LENGTH = 100;
const MIN_NAME_LENGTH = 2;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 30;
const MAX_COMPANY_LENGTH = 120;
const MAX_URL_LENGTH = 2048;
const MAX_TIMEZONE_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 4000;
const MIN_MESSAGE_LENGTH = 10;

const TO_ADDRESS = 'alienx@alienxsmarthome.com';
const FROM_ADDRESS = 'AlienX SmartHome <alienx@alienxsmarthome.com>';

const CONTACT_METHODS = new Set(['email', 'phone', 'text', 'either']);
const CONTACT_TIMES = new Set(['morning', 'afternoon', 'evening', 'anytime']);
const PROJECT_TYPES = new Set(['website-design', 'website-redesign', 'ecommerce', 'smart-home', 'interactive-web', 'web-app', 'seo-performance', 'other']);
const CURRENT_WEBSITES = new Set(['none', 'existing', 'redesign', 'other']);
const TIMELINES = new Set(['asap', 'under-30-days', '1-3-months', '3-6-months', 'exploring']);
const BUDGETS = new Set(['under-1000', '1000-2500', '2500-5000', '5000-10000', '10000-plus', 'not-sure']);
const SOURCES = new Set(['google', 'social', 'referral', 'experience', 'other']);

interface InquiryPayload {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  websiteUrl?: unknown;
  contactMethod?: unknown;
  contactTime?: unknown;
  timezone?: unknown;
  projectType?: unknown;
  currentWebsite?: unknown;
  timeline?: unknown;
  budget?: unknown;
  source?: unknown;
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

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const allowed = (value: string, values: Set<string>) => values.has(value);
const cleanSingleLine = (value: string) => value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
const cleanMessage = (value: string) => value.replace(/[\u0000\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);

const label = (value: string) => value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

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

  if (typeof payload.website === 'string' && payload.website.trim() !== '') {
    return json({ ok: true });
  }

  const name = typeof payload.name === 'string' ? cleanSingleLine(payload.name) : '';
  const email = typeof payload.email === 'string' ? cleanSingleLine(payload.email).toLowerCase() : '';
  const phone = typeof payload.phone === 'string' ? cleanSingleLine(payload.phone) : '';
  const company = typeof payload.company === 'string' ? cleanSingleLine(payload.company) : '';
  const websiteUrl = typeof payload.websiteUrl === 'string' ? cleanSingleLine(payload.websiteUrl) : '';
  const contactMethod = text(payload.contactMethod);
  const contactTime = text(payload.contactTime);
  const timezone = typeof payload.timezone === 'string' ? cleanSingleLine(payload.timezone) : '';
  const projectType = text(payload.projectType);
  const currentWebsite = text(payload.currentWebsite);
  const timeline = text(payload.timeline);
  const budget = text(payload.budget);
  const source = text(payload.source);
  const message = typeof payload.message === 'string' ? cleanMessage(payload.message) : '';

  if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
    return json({ error: 'Please provide a valid name.' }, 400);
  }

  if (!email || email.length > MAX_EMAIL_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Please provide a valid email address.' }, 400);
  }

  if (phone && (phone.length > MAX_PHONE_LENGTH || !/^[+()\d\s.-]+$/.test(phone))) {
    return json({ error: 'Please provide a valid phone number.' }, 400);
  }

  if (company.length > MAX_COMPANY_LENGTH) {
    return json({ error: 'Please provide a valid company name.' }, 400);
  }

  if (websiteUrl) {
    if (websiteUrl.length > MAX_URL_LENGTH) return json({ error: 'Please provide a valid website URL.' }, 400);
    try {
      const url = new URL(websiteUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol.');
    } catch {
      return json({ error: 'Please provide a valid website URL.' }, 400);
    }
  }

  if (!allowed(contactMethod, CONTACT_METHODS)) {
    return json({ error: 'Please choose a contact method.' }, 400);
  }

  if ((contactMethod === 'phone' || contactMethod === 'text') && !phone) {
    return json({ error: 'A phone number is required for phone or text contact.' }, 400);
  }

  if (contactTime && !allowed(contactTime, CONTACT_TIMES)) {
    return json({ error: 'Please choose a valid contact time.' }, 400);
  }

  if (timezone.length > MAX_TIMEZONE_LENGTH) {
    return json({ error: 'Please provide a valid time zone.' }, 400);
  }

  if (!allowed(projectType, PROJECT_TYPES)) {
    return json({ error: 'Please choose what you are interested in.' }, 400);
  }

  if (currentWebsite && !allowed(currentWebsite, CURRENT_WEBSITES)) {
    return json({ error: 'Please choose a valid website status.' }, 400);
  }

  if (timeline && !allowed(timeline, TIMELINES)) {
    return json({ error: 'Please choose a valid timeline.' }, 400);
  }

  if (budget && !allowed(budget, BUDGETS)) {
    return json({ error: 'Please choose a valid budget range.' }, 400);
  }

  if (source && !allowed(source, SOURCES)) {
    return json({ error: 'Please choose a valid referral source.' }, 400);
  }

  if (message.length < MIN_MESSAGE_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
    return json({ error: 'Please provide a little more detail about your inquiry.' }, 400);
  }

  const resendApiKey = (env as unknown as { RESEND_API_KEY?: string }).RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not configured.');
    return json({ error: 'Email service is not configured.' }, 503);
  }

  const details = [
    ['Name', name],
    ['Email', email],
    ['Phone', phone || 'Not provided'],
    ['Company', company || 'Not provided'],
    ['Website', websiteUrl || 'Not provided'],
    ['Best contact method', label(contactMethod)],
    ['Best time', contactTime ? label(contactTime) : 'Not provided'],
    ['Time zone', timezone || 'Not provided'],
    ['Project', label(projectType)],
    ['Current website', currentWebsite ? label(currentWebsite) : 'Not provided'],
    ['Timeline', timeline ? label(timeline) : 'Not provided'],
    ['Budget', budget ? label(budget) : 'Not sure / not provided'],
    ['Source', source ? label(source) : 'Not provided'],
  ] as const;

  const plainText = [
    'ALIENX SMARTHOME — NEW INQUIRY',
    '',
    ...details.map(([key, value]) => `${key}: ${value}`),
    '',
    'PROJECT DETAILS',
    message,
  ].join('\n');

  const htmlDetails = details.map(([key, value]) =>
    `<tr><td style="padding:9px 0;color:#667085;width:180px;vertical-align:top;">${escapeHtml(key)}</td><td style="padding:9px 0;color:#101828;vertical-align:top;font-weight:600;">${escapeHtml(value)}</td></tr>`,
  ).join('');

  const safeMessage = escapeHtml(message).replaceAll('\n', '<br />');
  const safeEmail = escapeHtml(email);
  const safeName = escapeHtml(name);
  const safeWebsite = websiteUrl ? escapeHtml(websiteUrl) : '';

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
      subject: `New AlienX inquiry — ${name}${company ? ` / ${company}` : ''}`,
      html: `<!doctype html><html><body style="margin:0;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;color:#172033;"><div style="max-width:700px;margin:32px auto;padding:0 16px;"><div style="overflow:hidden;border:1px solid #dfe4ec;border-radius:18px;background:#fff;box-shadow:0 8px 30px rgba(16,24,40,.08);"><div style="padding:24px 28px;background:#080d18;color:#fff;"><div style="font-size:12px;letter-spacing:2px;font-weight:700;color:#9eabc4;">ALIENX / INQUIRY</div><h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;color:#fff;">New conversation started</h1></div><div style="padding:26px 28px;"><table role="presentation" style="width:100%;border-collapse:collapse;">${htmlDetails}</table><div style="margin:18px 0 22px;border-top:1px solid #e7eaf0;"></div><div style="font-size:12px;letter-spacing:1.5px;font-weight:700;color:#667085;margin-bottom:10px;">PROJECT DETAILS</div><div style="font-size:16px;line-height:1.7;color:#344054;">${safeMessage}</div>${safeWebsite ? `<div style="margin-top:20px;font-size:13px;"><a href="${safeWebsite}" style="color:#315bdc;text-decoration:none;">Open submitted website →</a></div>` : ''}</div></div><p style="margin:16px 0;text-align:center;font-size:12px;color:#98a2b3;">Submitted through alienxsmarthome.com</p></div></body></html>`,
      text: plainText,
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
