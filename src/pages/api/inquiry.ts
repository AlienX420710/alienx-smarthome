import { jsonFormResponse as json } from '../../form-response';
import { escapeHtml, contentDigest, isValidEmail } from '../../form-engine';
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { sendProductionMail } from '../../mail';
import { acceptMail } from '../../form-delivery';
import {
  validateString,
  trimmedText,
  singleLineText,
  multilineText,
  validPhone,
  validHttpUrl,
} from '../../form-schema';
export const prerender = false;
const MAX_NAME_LENGTH = 100,
  MIN_NAME_LENGTH = 2,
  MAX_EMAIL_LENGTH = 254,
  MAX_PHONE_LENGTH = 30,
  MAX_COMPANY_LENGTH = 120,
  MAX_URL_LENGTH = 2048,
  MAX_TIMEZONE_LENGTH = 80,
  MAX_MESSAGE_LENGTH = 4000,
  MIN_MESSAGE_LENGTH = 10;
const STRING_SCHEMA = {
  name: { min: MIN_NAME_LENGTH, max: MAX_NAME_LENGTH },
  email: { min: 1, max: MAX_EMAIL_LENGTH, validate: isValidEmail },
  company: { max: MAX_COMPANY_LENGTH },
  timezone: { max: MAX_TIMEZONE_LENGTH },
  message: { min: MIN_MESSAGE_LENGTH, max: MAX_MESSAGE_LENGTH },
};
const CONTACT_METHODS = new Set(['email', 'phone', 'text', 'either']),
  CONTACT_TIMES = new Set(['morning', 'afternoon', 'evening', 'anytime']),
  PROJECT_TYPES = new Set([
    'website-design',
    'website-redesign',
    'ecommerce',
    'smart-home',
    'interactive-web',
    'web-app',
    'seo-performance',
    'other',
  ]),
  CURRENT_WEBSITES = new Set(['none', 'existing', 'redesign', 'other']),
  TIMELINES = new Set([
    'asap',
    'under-30-days',
    '1-3-months',
    '3-6-months',
    'exploring',
  ]),
  BUDGETS = new Set([
    'under-1000',
    '1000-2500',
    '2500-5000',
    '5000-10000',
    '10000-plus',
    'not-sure',
  ]),
  SOURCES = new Set(['google', 'social', 'referral', 'experience', 'other']);
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
  turnstileToken?: unknown;
}
const text = trimmedText,
  allowed = (value: string, values: Set<string>) =>
    validateString(value, { allowed: values }),
  cleanSingleLine = singleLineText,
  cleanMessage = multilineText;
const label = (value: string) =>
  value.replaceAll('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
export const POST: APIRoute = async ({ locals }) => {
  const verified = locals.verifiedInquiry;
  if (!verified)
    return json({ error: 'Security verification is required.' }, 403);
  const { requestId } = verified;
  const payload: InquiryPayload = verified.payload;
  const name =
      typeof payload.name === 'string' ? cleanSingleLine(payload.name) : '',
    email =
      typeof payload.email === 'string'
        ? cleanSingleLine(payload.email).toLowerCase()
        : '',
    phone =
      typeof payload.phone === 'string' ? cleanSingleLine(payload.phone) : '',
    company =
      typeof payload.company === 'string'
        ? cleanSingleLine(payload.company)
        : '',
    websiteUrl =
      typeof payload.websiteUrl === 'string'
        ? cleanSingleLine(payload.websiteUrl)
        : '',
    contactMethod = text(payload.contactMethod),
    contactTime = text(payload.contactTime),
    timezone =
      typeof payload.timezone === 'string'
        ? cleanSingleLine(payload.timezone)
        : '',
    projectType = text(payload.projectType),
    currentWebsite = text(payload.currentWebsite),
    timeline = text(payload.timeline),
    budget = text(payload.budget),
    source = text(payload.source),
    message =
      typeof payload.message === 'string' ? cleanMessage(payload.message) : '';
  if (!validateString(name, STRING_SCHEMA.name))
    return json(
      { error: 'Please provide a valid name.', requestId },
      400,
      requestId,
    );
  if (!validateString(email, STRING_SCHEMA.email))
    return json(
      { error: 'Please provide a valid email address.', requestId },
      400,
      requestId,
    );
  if (phone && !validPhone(phone, MAX_PHONE_LENGTH, /^[+()\d\s.-]+$/))
    return json(
      { error: 'Please provide a valid phone number.', requestId },
      400,
      requestId,
    );
  if (!validateString(company, STRING_SCHEMA.company))
    return json(
      { error: 'Please provide a valid company name.', requestId },
      400,
      requestId,
    );
  if (websiteUrl && !validHttpUrl(websiteUrl, MAX_URL_LENGTH)) {
    return json(
      { error: 'Please provide a valid website URL.', requestId },
      400,
      requestId,
    );
  }
  if (!allowed(contactMethod, CONTACT_METHODS))
    return json(
      { error: 'Please choose a contact method.', requestId },
      400,
      requestId,
    );
  if ((contactMethod === 'phone' || contactMethod === 'text') && !phone)
    return json(
      {
        error: 'A phone number is required for phone or text contact.',
        requestId,
      },
      400,
      requestId,
    );
  if (contactTime && !allowed(contactTime, CONTACT_TIMES))
    return json(
      { error: 'Please choose a valid contact time.', requestId },
      400,
      requestId,
    );
  if (!validateString(timezone, STRING_SCHEMA.timezone))
    return json(
      { error: 'Please provide a valid time zone.', requestId },
      400,
      requestId,
    );
  if (!allowed(projectType, PROJECT_TYPES))
    return json(
      { error: 'Please choose what you are interested in.', requestId },
      400,
      requestId,
    );
  if (currentWebsite && !allowed(currentWebsite, CURRENT_WEBSITES))
    return json(
      { error: 'Please choose a valid website status.', requestId },
      400,
      requestId,
    );
  if (timeline && !allowed(timeline, TIMELINES))
    return json(
      { error: 'Please choose a valid timeline.', requestId },
      400,
      requestId,
    );
  if (budget && !allowed(budget, BUDGETS))
    return json(
      { error: 'Please choose a valid budget range.', requestId },
      400,
      requestId,
    );
  if (source && !allowed(source, SOURCES))
    return json(
      { error: 'Please choose a valid referral source.', requestId },
      400,
      requestId,
    );
  if (!validateString(message, STRING_SCHEMA.message))
    return json(
      {
        error: 'Please provide a little more detail about your inquiry.',
        requestId,
      },
      400,
      requestId,
    );
  const resendApiKey = (env as unknown as { RESEND_API_KEY?: string })
    .RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not configured.', { requestId });
    return json(
      { error: 'Email service is not configured.', requestId },
      503,
      requestId,
    );
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
    [
      'Current website',
      currentWebsite ? label(currentWebsite) : 'Not provided',
    ],
    ['Timeline', timeline ? label(timeline) : 'Not provided'],
    ['Budget', budget ? label(budget) : 'Not sure / not provided'],
    ['Source', source ? label(source) : 'Not provided'],
    ['Request ID', requestId],
  ] as const;
  const plainText = [
    'ALIENX SMARTHOME — NEW INQUIRY',
    '',
    ...details.map(([key, value]) => `${key}: ${value}`),
    '',
    'PROJECT DETAILS',
    message,
  ].join('\n');
  const htmlDetails = details
    .map(
      ([key, value]) =>
        `<tr><td style="padding:9px 0;color:#667085;width:180px;vertical-align:top;">${escapeHtml(key)}</td><td style="padding:9px 0;color:#101828;vertical-align:top;font-weight:600;">${escapeHtml(value)}</td></tr>`,
    )
    .join('');
  const safeMessage = escapeHtml(message).replaceAll('\n', '<br />'),
    safeWebsite = websiteUrl ? escapeHtml(websiteUrl) : '';
  const idempotencyKey =
    'alienx-' + (await contentDigest([requestId, details, message]));
  const acceptance = await acceptMail(() =>
    sendProductionMail(resendApiKey, idempotencyKey, {
      reply_to: email,
      subject: `New AlienX inquiry — ${name}${company ? ` / ${company}` : ''}`,
      html: `<!doctype html><html><body style="margin:0;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;color:#172033;"><div style="max-width:700px;margin:32px auto;padding:0 16px;"><div style="overflow:hidden;border:1px solid #dfe4ec;border-radius:18px;background:#fff;box-shadow:0 8px 30px rgba(16,24,40,.08);"><div style="padding:24px 28px;background:#080d18;color:#fff;"><div style="font-size:12px;letter-spacing:2px;font-weight:700;color:#9eabc4;">ALIENX / INQUIRY</div><h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;color:#fff;">New conversation started</h1></div><div style="padding:26px 28px;"><table role="presentation" style="width:100%;border-collapse:collapse;">${htmlDetails}</table><div style="margin:18px 0 22px;border-top:1px solid #e7eaf0;"></div><div style="font-size:12px;letter-spacing:1.5px;font-weight:700;color:#667085;margin-bottom:10px;">PROJECT DETAILS</div><div style="font-size:16px;line-height:1.7;color:#344054;">${safeMessage}</div>${safeWebsite ? `<div style="margin-top:20px;font-size:13px;"><a href="${safeWebsite}" style="color:#315bdc;text-decoration:none;">Open submitted website →</a></div>` : ''}</div></div><p style="margin:16px 0;text-align:center;font-size:12px;color:#98a2b3;">Submitted through alienxsmarthome.com · ${escapeHtml(requestId)}</p></div></body></html>`,
      text: plainText,
    }),
  );
  if (
    acceptance.outcome === 'request-failed' ||
    acceptance.outcome === 'rejected'
  ) {
    console.error('Resend email request failed.', {
      requestId,
      ...(acceptance.outcome === 'rejected'
        ? { status: acceptance.status }
        : {}),
    });
    return json(
      { error: 'We could not send your message. Please try again.', requestId },
      502,
      requestId,
    );
  }
  if (acceptance.outcome === 'unconfirmed') {
    console.error('Resend returned success without an email ID.', {
      requestId,
    });
    return json(
      {
        error:
          'We could not confirm that your message was accepted. Please try again.',
        requestId,
      },
      502,
      requestId,
    );
  }
  console.info('Inquiry email accepted by Resend.', {
    requestId,
    emailId: acceptance.id,
  });
  return json({ ok: true, requestId }, 200, requestId);
};
export const ALL: APIRoute = async () =>
  json({ error: 'Method not allowed.' }, 405);
