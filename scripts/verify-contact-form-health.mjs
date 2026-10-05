import { chromium } from '@playwright/test';

const origin = 'https://alienxsmarthome.com';
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  const response = await page.goto(`${origin}/contact`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  if (!response?.ok())
    throw new Error(`Contact page HTTP ${response?.status()}`);

  const form = page.locator('#inquiry-form');
  const submit = page.locator('#submit-button');
  const turnstile = page.locator('#alienx-turnstile');
  const securityScript = page.locator('script[src="/contact-security.js"]');

  if ((await form.count()) !== 1 || !(await form.isVisible()))
    throw new Error('Production inquiry form is missing or hidden');
  if ((await submit.count()) !== 1 || !(await submit.isVisible()))
    throw new Error('Production inquiry submit control is missing or hidden');
  if ((await turnstile.count()) !== 1)
    throw new Error('Production Turnstile container is missing');
  if ((await securityScript.count()) !== 1)
    throw new Error('Production Turnstile bootstrap is missing');

  await submit.click();
  const nameError = page.locator('[data-error="name"]');
  await nameError.waitFor({ state: 'visible', timeout: 5_000 });
  if (!/enter your name/i.test((await nameError.textContent()) ?? ''))
    throw new Error('Client-side inquiry validation did not execute');
  if ((await page.locator(':focus').getAttribute('name')) !== 'name')
    throw new Error('Invalid inquiry did not focus the first invalid field');

  const api = await page.request.post(`${origin}/api/inquiry`, {
    headers: {
      'content-type': 'application/json',
      origin,
    },
    data: {
      consent: true,
      name: 'AlienX Health Monitor',
      email: 'alienx@alienxsmarthome.com',
      contactMethod: 'email',
      projectType: 'other',
      message: 'Automated security-boundary health probe.',
      faxNumber: '',
      website: '',
    },
  });
  if (api.status() !== 403)
    throw new Error(
      `Unverified inquiry returned HTTP ${api.status()}, expected 403`,
    );
  const body = await api.json().catch(() => null);
  if (!body || typeof body.error !== 'string')
    throw new Error(
      'Unverified inquiry rejection returned an invalid response',
    );

  console.log(
    'PASS: production Contact UI, validation, Turnstile wiring, and fail-closed API boundary',
  );
} finally {
  await browser.close();
}
