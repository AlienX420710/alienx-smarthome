import site from '../engineering.config.json';
import { sendHealthMail } from './mail';
import { healthDate, deliverHealth } from './email-health-engine';
export { healthDate } from './email-health-engine';
export async function sendDailyHealth(
  scheduledTime: number,
  env: { RESEND_API_KEY?: string },
  now = Date.now(),
) {
  const date = healthDate(scheduledTime, now);
  if (!date) return;
  if (!env.RESEND_API_KEY?.trim())
    throw new Error('Email health: missing mail configuration');
  const message = {
    subject: site.mail.healthSubject + date,
    text: site.mail.healthText.replaceAll('{date}', date),
  };
  await deliverHealth(date, () =>
    sendHealthMail(
      env.RESEND_API_KEY!,
      site.mail.healthKeyPrefix + date,
      message,
    ),
  );
}
