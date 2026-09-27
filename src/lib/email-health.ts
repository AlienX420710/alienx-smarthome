import { sendProductionMail } from './mail';

export function healthDate(
  scheduledTime: number,
  now = Date.now(),
): string | null {
  if (
    !Number.isFinite(scheduledTime) ||
    !Number.isFinite(now) ||
    scheduledTime > now + 60_000 ||
    now - scheduledTime > 15 * 60_000
  )
    return null;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(scheduledTime))
      .map(({ type, value }) => [type, value]),
  );
  return parts.hour === '05' && parts.minute === '00'
    ? `${parts.year}-${parts.month}-${parts.day}`
    : null;
}

export async function sendDailyHealth(
  scheduledTime: number,
  env: { RESEND_API_KEY?: string },
  now = Date.now(),
) {
  const date = healthDate(scheduledTime, now);
  if (!date) return;
  if (!env.RESEND_API_KEY?.trim())
    throw new Error('Email health: missing mail configuration');
  // Stable payload/key across retries and deploys, within provider's 24h retention.
  const message = {
    subject: `AlienX SmartHome — daily email health check — ${date}`,
    text: `AlienX SmartHome production email health check for ${date}.\n\nThis scheduled 5:00 AM America/Chicago message uses the same production mail credential, sender, business destination and transport as inquiries. Receiving it confirms delivery of this message. It does not test a visitor's Turnstile challenge or form interaction, or guarantee delivery of every inquiry.\n\nNo customer inquiry was created. If missing, inspect the GitHub Email Delivery Health run and Cloudflare scheduled-event logs.`,
  };
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt)
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * 2 ** (attempt - 1)),
      );
    try {
      const response = await sendProductionMail(
        env.RESEND_API_KEY,
        `alienx-daily-email-health/${date}`,
        message,
      );
      if (!response.ok) {
        await response.body?.cancel();
        if (response.status !== 429 && response.status < 500) break;
        continue;
      }
      const result = (await response.json()) as { id?: unknown } | null;
      if (typeof result?.id === 'string' && result.id.trim()) {
        console.info('Daily email health accepted.', {
          date,
          emailId: result.id,
        });
        return;
      }
    } catch {
      // Never log provider-controlled bodies/errors or secrets. Same key on retry.
    }
  }
  throw new Error('Daily email health not confirmed by provider');
}
