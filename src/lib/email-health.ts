import { sendProductionMail } from './mail';

import { healthDate, deliverHealth } from '../email-health-engine';
export { healthDate } from '../email-health-engine';

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
    subject: `AlienX SmartHome — email transport healthy — ${date}`,
    text: `Automated production mail-transport heartbeat for ${date}.\n\nNo action is required. This message verifies that the production Worker can send through the configured AlienX mail transport to the business mailbox. Contact-form health is monitored separately.`,
  };
  await deliverHealth(date, () =>
    sendProductionMail(
      env.RESEND_API_KEY!,
      `alienx-daily-email-health/${date}`,
      message,
    ),
  );
}
