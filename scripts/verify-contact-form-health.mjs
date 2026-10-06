import { site } from './site-config.mjs';
import { chromium } from '@playwright/test';

const origin = site.origin;
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  const response = await page.goto(new URL(site.form.route, origin).href, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  if (!response?.ok())
    throw new Error(`Contact page HTTP ${response?.status()}`);

  const form = page.locator(site.form.selector);
  const submit = page.locator(site.form.submit);
  const turnstile = page.locator(site.form.turnstile);
  const securityScript = page.locator(`script[src="${site.form.script}"]`);

  if ((await form.count()) !== 1 || !(await form.isVisible()))
    throw new Error('Production inquiry form is missing or hidden');
  if ((await submit.count()) !== 1 || !(await submit.isVisible()))
    throw new Error('Production inquiry submit control is missing or hidden');
  if ((await turnstile.count()) !== 1)
    throw new Error('Production Turnstile container is missing');
  if ((await securityScript.count()) !== 1)
    throw new Error('Production Turnstile bootstrap is missing');

  await page.route(`**${site.form.endpoint}`, (route) => route.abort());
  await submit.click();
  if (site.form.error) {
    const nameError = page.locator(site.form.error);
    await nameError.waitFor({ state: 'visible', timeout: 5000 });
    if (!/enter your name/i.test((await nameError.textContent()) ?? ''))
      throw Error('Client validation did not execute');
  } else if (
    !(await page
      .locator('[name="name"]')
      .evaluate((field) => !field.validity.valid))
  )
    throw Error('Native required validation did not execute');
  if ((await page.locator(':focus').getAttribute('name')) !== 'name')
    throw new Error('Invalid inquiry did not focus the first invalid field');

  const api = await page.request.post(
    new URL(site.form.endpoint, origin).href,
    {
      headers: { origin, Accept: 'application/json' },
      ...(site.form.encoding === 'json'
        ? { data: site.form.invalid }
        : { form: site.form.invalid }),
    },
  );
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
