const { test, expect } = require('@playwright/test');
const base = 'http://127.0.0.1:4321';
test.use({ screenshot: 'only-on-failure', trace: 'retain-on-failure' });
const status = {
  status: 'operational',
  generatedAt: '2026-09-10T12:00:00Z',
  runtime: 'Cloudflare Workers',
  summary: 'Configured',
  requestId: 'test',
  checks: Object.fromEntries(
    ['worker', 'inquiry', 'turnstile', 'resend'].map((key) => [
      key,
      { status: 'configured', detail: 'Present' },
    ]),
  ),
};

test('Technology layers work after leaving and returning', async ({ page }) => {
  await page.goto(base + '/technology/');
  for (let visit = 0; visit < 2; visit++) {
    const application = page.locator('[data-layer=application]');
    await application.click();
    await expect(application).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-layer=interface]')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(page.locator('#layer-detail')).toContainText(
      'Request handling',
    );
    await page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name: 'About Me', exact: true })
      .click();
    await expect(page).toHaveURL(/\/about\/?$/);
    await page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name: 'Technology', exact: true })
      .first()
      .click();
    await expect(page.locator('[data-layer=interface]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  }
});

test('skip link and command dialogs retain keyboard focus', async ({
  page,
}) => {
  await page.goto(base);
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await page.getByRole('button', { name: 'Open command palette' }).click();
  const input = page.getByRole('searchbox', { name: 'Search AlienX commands' });
  await input.fill('/help');
  await input.press('Enter');
  await expect(page.locator('#alienx-command-overlay')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Close', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  await expect(page.locator('#alienx-command-overlay')).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Open command palette' }),
  ).toBeFocused();
});

test('museum renders seven exhibits, supports keyboard, and respects motion off', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('alienx-motion', 'off'));
  await page.goto(base + '/experience/');
  await expect(page.locator('#museum article')).toHaveCount(7);
  const light = page.locator('[data-light-stage]');
  await expect(light).toHaveAttribute('tabindex', '0');
  await light.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  const spatial = page.locator('[data-spatial-stage]');
  await spatial.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-space-readout]')).toHaveText('X 3° / Y 0°');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-space-readout]')).toHaveText('X 0° / Y 0°');
  const before = await page
    .locator('[data-physics-canvas]')
    .evaluate((canvas) => canvas.toDataURL());
  await page.waitForTimeout(150);
  expect(
    await page
      .locator('[data-physics-canvas]')
      .evaluate((canvas) => canvas.toDataURL()),
  ).toBe(before);
  await page
    .getByRole('navigation', { name: 'Footer navigation' })
    .getByRole('link', { name: 'About Me', exact: true })
    .click();
  await page
    .getByRole('navigation', { name: 'Footer navigation' })
    .getByRole('link', { name: 'Experience', exact: true })
    .click();
  await expect(page.locator('#museum article')).toHaveCount(7);
  await expect(page.locator('[data-capabilities] .capability-row')).toHaveCount(
    6,
  );
});

test('command button opens palette and clear keeps it usable', async ({
  page,
}) => {
  await page.goto(base);
  await page.getByRole('button', { name: 'Open command palette' }).click();
  const input = page.getByRole('searchbox', { name: 'Search AlienX commands' });
  await expect(input).toBeFocused();
  await input.fill('/clear');
  await input.press('Enter');
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('');
  await input.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Open command palette' }),
  ).toBeFocused();
});

test('Status refresh repeats and stops after navigation', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/status', (route) => {
    requests++;
    return route.fulfill({ json: status });
  });
  await page.clock.install();
  await page.goto(base + '/status/');
  await expect(page.locator('#overall-label')).toHaveText('Operational');
  const initial = requests;
  await page.clock.runFor(31000);
  await expect.poll(() => requests).toBeGreaterThan(initial);
  await expect(page.locator('#overall-label')).toHaveText('Operational');
  const second = requests;
  await page.clock.runFor(31000);
  await expect.poll(() => requests).toBeGreaterThan(second);
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'About Me', exact: true })
    .click();
  await expect(page).toHaveURL(/\/about\/?$/);
  const stopped = requests;
  await page.clock.runFor(65000);
  expect(requests).toBe(stopped);
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Status', exact: true })
    .first()
    .click();
  await expect(page.locator('#overall-label')).toHaveText('Operational');
  expect(requests).toBeGreaterThan(stopped);
});

test('Status renders degraded HTTP 503 and malformed responses honestly', async ({
  page,
}) => {
  await page.route('**/api/status', (route) =>
    route.fulfill({
      status: 503,
      json: {
        ...status,
        status: 'degraded',
        checks: {
          ...status.checks,
          resend: {
            status: 'degraded',
            detail: 'Email integration not configured',
          },
        },
      },
    }),
  );
  await page.goto(base + '/status/');
  await expect(page.locator('#overall-label')).toHaveText('Degraded');
  await expect(page.locator('.check')).toHaveCount(4);
  await expect(page.locator('.check--degraded')).toContainText(
    'Email integration not configured',
  );
  await page.unroute('**/api/status');
  await page.route('**/api/status', (route) =>
    route.fulfill({ status: 503, body: 'unavailable' }),
  );
  await page.reload();
  await expect(page.locator('.check--error')).toContainText('UNAVAILABLE');
});

test('Contact retries preserve input and submit the honeypot after navigation', async ({
  page,
}) => {
  let submissions = [];
  await page.route(
    'https://challenges.cloudflare.com/turnstile/v0/api.js*',
    (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `window.turnstile={render(el){const i=document.createElement('input');i.type='hidden';i.name='website';i.value='mock-token';el.appendChild(i);return 'mock-widget'},remove(){},reset(){document.querySelector('[name=website]').value='reset-token'}};window.alienxTurnstileLoad();`,
      }),
  );
  await page.route('**/api/inquiry', (route) => {
    submissions.push(route.request().postDataJSON());
    return route.fulfill({
      status: 502,
      json: { error: 'Mock provider unavailable' },
    });
  });
  await page.goto(base + '/contact/');
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'About Me', exact: true })
    .click();
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Start a project', exact: true })
    .first()
    .click();
  await page.locator('#name').fill('Test Person');
  await expect(page.locator('[name=faxNumber]')).toHaveCount(0);
  const trap = page.locator('[name=inquiryReference]');
  await expect(trap).toHaveAttribute('readonly', '');
  await expect(trap).toHaveAttribute('autocomplete', 'off');
  await expect(trap).toHaveValue('');
  await page.locator('#email').fill('test@example.test');
  await page.locator('#phone').fill('+44 20 7946 0958');
  await page.locator('#contact-method').selectOption('email');
  await page.locator('#project-type').selectOption('other');
  await page.locator('#message').fill('This is a mocked inquiry test.');
  await page.locator('#consent').check();
  await expect(page.locator('[name=website]')).toHaveValue('mock-token');
  await page.locator('#submit-button').click();
  await expect(page.locator('#form-status')).toHaveText(
    'Mock provider unavailable',
  );
  await expect(page.locator('[name=website]')).toHaveValue('reset-token');
  await page.locator('#submit-button').click();
  await expect.poll(() => submissions.length).toBe(2);
  expect(submissions[0].faxNumber).toBe('');
  expect(submissions[0].phone).toBe('+44 20 7946 0958');
  expect(submissions[1].website).toBe('reset-token');
  // Readonly prevents ordinary editing/autofill, not hostile script writes.
  // Such values must still reach server-side spam rejection, never be cleared.
  await trap.evaluate((input) => {
    input.value = 'injected-spam-value';
  });
  await page.locator('#submit-button').click();
  await expect.poll(() => submissions.length).toBe(3);
  expect(submissions[2].faxNumber).toBe('injected-spam-value');
});

test('theme commands persist across client navigation and reload', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('alienx-theme'))
      localStorage.setItem('alienx-theme', 'dark');
  });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto(base + '/contact/');
  await expect(page.locator('html')).toHaveAttribute(
    'data-alienx-theme',
    'dark',
  );
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Technology', exact: true })
    .click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-alienx-theme',
    'dark',
  );
  for (const next of ['system', 'light']) {
    await page.getByRole('button', { name: 'Open command palette' }).click();
    const input = page.getByRole('searchbox', {
      name: 'Search AlienX commands',
    });
    await input.fill('/theme');
    await input.press('Enter');
    if (next === 'system')
      await expect(page.locator('html')).not.toHaveAttribute(
        'data-alienx-theme',
      );
    else
      await expect(page.locator('html')).toHaveAttribute(
        'data-alienx-theme',
        next,
      );
  }
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute(
    'data-alienx-theme',
    'light',
  );
});
