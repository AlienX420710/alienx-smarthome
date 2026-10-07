import { handle } from '@astrojs/cloudflare/handler';
import { sendDailyHealth } from './email-health';
export default {
  fetch: handle,
  async scheduled(
    controller: { scheduledTime: number },
    env: { RESEND_API_KEY?: string },
  ) {
    await sendDailyHealth(controller.scheduledTime, env);
  },
};
