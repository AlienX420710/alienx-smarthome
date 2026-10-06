import { site } from './site-config.mjs';
// Optional provider-evidence validator for explicitly authorized operator use only.
// It is not an automated monitor, is not invoked by ChatGPT, and is not used by
// GitHub Actions. Production operator alerts are generated from GitHub workflow
// evidence without enumerating mailbox or provider message history.

export function expectedHealthDate(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map(({ type, value }) => [type, value]),
  );
  if (Number(parts.hour) < 5) return null;
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export async function verifyEmailHealth({
  token,
  now = new Date(),
  fetchImpl = fetch,
}) {
  const date = expectedHealthDate(now);
  if (!date) return { status: 'not-due' };
  if (typeof token !== 'string' || !token.trim())
    throw new Error('Email monitor credential is missing');
  const subject = `${site.mail.healthSubject}${date}`;
  let after;
  const seen = new Set();
  for (let page = 0; page < 20; page++) {
    const url = new URL('https://api.resend.com/emails');
    url.searchParams.set('limit', '100');
    if (after) url.searchParams.set('after', after);
    let body;
    try {
      const response = await fetchImpl(url, {
        headers: { Authorization: `Bearer ${token}` },
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error();
      body = await response.json();
    } catch {
      throw new Error(
        'Email delivery evidence unavailable; provider details suppressed',
      );
    }
    if (!Array.isArray(body?.data) || typeof body.has_more !== 'boolean')
      throw new Error('Malformed email delivery evidence');
    for (const mail of body.data) {
      if (!mail || typeof mail !== 'object')
        throw new Error('Malformed email delivery record');
      if (mail.subject !== subject) continue;
      const created = new Date(mail.created_at);
      if (
        !Number.isFinite(created.getTime()) ||
        created > now ||
        expectedHealthDate(created) !== date ||
        ![site.mail.address, site.mail.sender].includes(mail.from) ||
        !Array.isArray(mail.to) ||
        mail.to.length !== 1 ||
        mail.to[0] !== site.mail.recipient ||
        typeof mail.id !== 'string' ||
        !mail.id.trim()
      )
        throw new Error('Email health identity or timestamp mismatch');
      if (mail.last_event !== 'delivered')
        throw new Error('Daily health email has no confirmed delivery');
      return { status: 'delivered', date };
    }
    if (!body.has_more) break;
    const cursor = body.data.at(-1)?.id;
    if (typeof cursor !== 'string' || !cursor || seen.has(cursor))
      throw new Error('Invalid email evidence pagination');
    seen.add(cursor);
    after = cursor;
    // Stay below provider request-rate limits while walking older pages.
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  throw new Error('Daily health email delivery evidence is missing');
}
