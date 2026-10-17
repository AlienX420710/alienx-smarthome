const { test, expect } = require('@playwright/test');
const site = require('../engineering.config.json');
const success = site.noindexRoutes.find((route) => route.includes('success'));
const origin = 'http://127.0.0.1:4321';
const key = 'site-confirmation-v1';

async function prepare(page, blocked = false) {
  if (blocked) {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new Error('Storage unavailable');
        },
      });
    });
  }
  // Both the challenge and submission boundary are mocked; no provider is contacted.
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.turnstile = {
      render(el, options) {
        const field = document.createElement('input');
        field.type = 'hidden'; field.name = options['response-field-name']; field.value = 'mock-token';
        el.append(field); return 'mock-widget';
      }, reset() {}, remove() {}
    }; window[${JSON.stringify(site.browser.turnstileCallback)}]();`,
    }),
  );
  await page.goto(origin + site.form.route);
  await page.locator('[name="name"]').fill('Zoë PrivateSurname');
  await page.locator('[name="email"]').fill('person@example.invalid');
  if (site.form.encoding === 'form') {
    await page.locator('[name="phone"]').fill('9205550123');
  } else {
    await page.locator('[name="contactMethod"]').selectOption('email');
    await page.locator('[name="projectType"]').selectOption('other');
    await page
      .locator('[name="message"]')
      .fill('A synthetic project inquiry for a mocked test.');
    await page.locator('[name="consent"]').check();
  }
  const token =
    site.form.encoding === 'form' ? 'cf-turnstile-response' : 'website';
  await expect(page.locator(`[name="${token}"]`)).toHaveValue('mock-token');
}

test('accepted submission personalizes only this tab with the first name', async ({
  page,
  context,
}) => {
  await page.route('**' + site.form.endpoint, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"ok":true}',
    }),
  );
  await prepare(page);
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), key),
  ).toBeNull();
  await page.locator(site.form.submit).click();
  await expect(page).toHaveURL(origin + success);
  await expect(page.locator('[data-confirmation-heading]')).toHaveText(
    'Thank you, Zoë!',
  );
  expect(page.url()).not.toMatch(/Zo|PrivateSurname|\?/);
  const stored = await page.evaluate((key) => sessionStorage.getItem(key), key);
  expect(JSON.parse(stored).firstName).toBe('Zoë');
  expect(stored).not.toContain('PrivateSurname');
  await page.reload();
  await expect(page.locator('[data-confirmation-heading]')).toHaveText(
    'Thank you, Zoë!',
  );
  const other = await context.newPage();
  await other.goto(origin + success);
  await expect(other.locator('[data-confirmation-heading]')).not.toContainText(
    'Zoë',
  );
  await other.close();
});

test('failed and malformed submissions retain no confirmation name', async ({
  page,
}) => {
  let attempts = 0;
  await page.route('**' + site.form.endpoint, (route) =>
    route.fulfill({
      status: ++attempts === 1 ? 502 : 200,
      contentType: 'application/json',
      body: attempts === 1 ? '{"error":"Mock rejection"}' : 'null',
    }),
  );
  await prepare(page);
  for (let index = 0; index < 2; index++) {
    await page.locator(site.form.submit).click();
    await expect(page.locator('#form-status')).not.toHaveText('');
    await expect(page.locator(site.form.submit)).toBeEnabled();
    expect(
      await page.evaluate((key) => sessionStorage.getItem(key), key),
    ).toBeNull();
    expect(page.url()).not.toContain('success');
  }
});

test('blocked storage still permits accepted navigation with a generic heading', async ({
  page,
}) => {
  await page.route('**' + site.form.endpoint, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"ok":true}',
    }),
  );
  await prepare(page, true);
  await page.locator(site.form.submit).click();
  await expect(page).toHaveURL(origin + success);
  await expect(page.locator('[data-confirmation-heading]')).not.toContainText(
    'Zoë',
  );
});

test('expired and hostile storage retain the generic success heading', async ({
  page,
}) => {
  await page.goto(origin + success);
  const heading = page.locator('[data-confirmation-heading]');
  const generic = await heading.getAttribute('data-confirmation-generic');
  for (const value of [
    { firstName: 'Expired', expires: Date.now() - 1 },
    { firstName: '<img src=x onerror=alert(1)>', expires: Date.now() + 60000 },
  ]) {
    await page.evaluate(
      ({ key, value, success }) => {
        sessionStorage.setItem(
          key,
          JSON.stringify({ ...value, route: success.replace(/\/+$/, '') }),
        );
      },
      { key, value, success },
    );
    await page.reload();
    await expect(heading).toHaveText(generic);
    expect(
      await page.evaluate((key) => sessionStorage.getItem(key), key),
    ).toBeNull();
  }
});
