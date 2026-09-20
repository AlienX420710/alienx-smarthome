const { test, expect } = require('@playwright/test');
const base = 'http://127.0.0.1:4321';
const routes = [
  '/',
  '/work/',
  '/experience/',
  '/lab/',
  '/technology/',
  '/status/',
  '/about/',
  '/contact/',
  '/contact/success/',
];
test.use({
  screenshot: 'only-on-failure',
  trace: 'retain-on-failure',
  reducedMotion: 'reduce',
});

// Reach controls using real sequential navigation, never locator.focus().
async function tabTo(page, target, key = 'Tab') {
  for (let index = 0; index < 100; index++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press(key);
  }
  throw new Error(
    `Control was not reachable with ${key}: ${await target.evaluate((el) => el.outerHTML.slice(0, 200))}`,
  );
}
async function visibleFocus(target) {
  await expect(target).toBeFocused();
  await expect(target).toBeInViewport();
  expect(
    await target.evaluate((el) => {
      const s = getComputedStyle(el);
      return (
        s.outlineStyle !== 'none' &&
        parseFloat(s.outlineWidth) >= 2 &&
        s.outlineColor !== 'rgba(0, 0, 0, 0)'
      );
    }),
  ).toBe(true);
}
for (const route of routes) {
  for (const theme of ['light', 'dark']) {
    test(`${route} ${theme}: skip, forward/reverse navigation and command access`, async ({
      page,
    }) => {
      await page.addInitScript(
        (theme) => localStorage.setItem('alienx-theme', theme),
        theme,
      );
      await page.goto(base + route);
      const skip = page.getByRole('link', { name: 'Skip to content' });
      await page.keyboard.press('Tab');
      await visibleFocus(skip);
      await page.keyboard.press('Enter');
      await expect(page.locator('#main-content')).toBeFocused();
      await page.goto(base + route);
      const nav = page.getByRole('navigation', { name: 'Primary navigation' });
      const links = nav.locator('.internal-links a');
      for (const link of await links.all()) {
        await tabTo(page, link);
        await visibleFocus(link);
      }
      for (const link of (await links.all()).reverse()) {
        await tabTo(page, link, 'Shift+Tab');
        await visibleFocus(link);
      }
      const trigger = page.getByRole('button', {
        name: 'Open command palette',
      });
      await tabTo(page, trigger);
      await visibleFocus(trigger);
      await page.keyboard.press('Space');
      await expect(page.locator('#palette-input')).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('#palette-input')).toBeFocused();
      await page.keyboard.press('Escape');
      const about = nav.getByRole('link', { name: 'About Me', exact: true });
      await tabTo(page, about, 'Shift+Tab');
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/about\/?$/);
    });
  }
}

test('Tab-focused command activates itself with Enter and Space; dialogs contain and restore focus', async ({
  page,
}) => {
  await page.goto(base);
  const trigger = page.getByRole('button', { name: 'Open command palette' });
  await tabTo(page, trigger);
  await page.keyboard.press('Enter');
  const input = page.locator('#palette-input');
  // /clear is deliberately not the initially indexed result.
  const clear = page
    .locator('button[data-command-index]')
    .filter({ hasText: '/clear' });
  await tabTo(page, clear);
  await page.keyboard.press('Enter');
  await expect(input).toBeFocused();
  await expect(page.locator('#alienx-command-overlay')).toHaveCount(0);
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('button[data-command-index]').last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();
  await tabTo(page, clear);
  await page.keyboard.press('Space');
  await expect(input).toBeFocused();
  await page.keyboard.type('/help');
  await page.keyboard.press('Enter');
  const overlay = page.locator('#alienx-command-overlay');
  await expect(overlay).toBeVisible();
  for (const key of ['Tab', 'Shift+Tab']) {
    await page.keyboard.press(key);
    expect(
      await overlay.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(overlay).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('Technology buttons can be reached and operated without a pointer', async ({
  page,
}) => {
  await page.goto(base + '/technology/');
  for (const button of await page.locator('[data-layer]').all()) {
    await tabTo(page, button);
    await visibleFocus(button);
    await page.keyboard.press('Space');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  }
});

test('Lab radio group, range and disclosures work with keyboard controls', async ({
  page,
}) => {
  await page.goto(base + '/lab/');
  await tabTo(page, page.locator('#mode-web'));
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#mode-auto')).toBeChecked();
  const range = page.locator('#signal-range');
  await tabTo(page, range);
  await page.keyboard.press('ArrowRight');
  await expect(range).toHaveValue('73');
  for (const summary of await page.locator('summary').all()) {
    await tabTo(page, summary);
    await visibleFocus(summary);
    await page.keyboard.press('Enter');
    await expect(summary.locator('..')).toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    await expect(summary.locator('..')).not.toHaveAttribute('open', '');
  }
});

test('Contact fields, consent, validation and retry are keyboard operable', async ({
  page,
}) => {
  await page.route(
    'https://challenges.cloudflare.com/turnstile/v0/api.js*',
    (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `window.turnstile={render(el){const i=document.createElement('input');i.type='hidden';i.name='website';i.value='mock-token';el.appendChild(i);return 'mock-widget'},remove(){},reset(){}};window.alienxTurnstileLoad();`,
      }),
  );
  let submissions = 0;
  await page.route('**/api/inquiry', (route) => {
    submissions++;
    return route.fulfill({
      status: 502,
      json: { error: 'Mock provider unavailable' },
    });
  });
  await page.goto(base + '/contact/');
  await expect(page.locator('[name=website]')).toHaveValue('mock-token');
  await tabTo(page, page.locator('#submit-button'));
  await page.keyboard.press('Enter');
  await expect(page.locator('#name')).toBeFocused();
  expect(submissions).toBe(0);
  for (const [id, value] of [
    ['name', 'Keyboard Test'],
    ['email', 'keyboard@example.test'],
    ['phone', '+1 920 555 0100'],
  ]) {
    const field = page.locator('#' + id);
    await tabTo(page, field);
    await visibleFocus(field);
    await page.keyboard.type(value);
  }
  for (const id of ['contact-method', 'project-type']) {
    const select = page.locator('#' + id);
    await tabTo(page, select);
    await visibleFocus(select);
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
  }
  await tabTo(page, page.locator('#message'));
  await page.keyboard.type(
    'This is a mocked keyboard inquiry regression test.',
  );
  const consent = page.locator('#consent');
  await tabTo(page, consent);
  await page.keyboard.press('Space');
  await expect(consent).toBeChecked();
  const submit = page.locator('#submit-button');
  await tabTo(page, submit);
  await page.keyboard.press('Enter');
  await expect(page.locator('#form-status')).toHaveText(
    'Mock provider unavailable',
  );
  await expect(page.locator('#name')).toHaveValue('Keyboard Test');
  await tabTo(page, submit);
  await page.keyboard.press('Space');
  await expect.poll(() => submissions).toBe(2);
});

test('Experience stages and reset controls are reachable and operable by keyboard', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('alienx-motion', 'off'));
  await page.goto(base + '/experience/');
  const physics = page.locator('[data-physics-stage]');
  await tabTo(page, physics);
  await visibleFocus(physics);
  const canvas = page.locator('[data-physics-canvas]');
  const before = await canvas.evaluate((el) => el.toDataURL());
  await page.keyboard.press('ArrowRight');
  expect(await canvas.evaluate((el) => el.toDataURL())).not.toBe(before);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  const reset = page.locator('[data-physics-reset]');
  await tabTo(page, reset);
  await page.keyboard.press('Enter');
  const light = page.locator('[data-light-stage]');
  await tabTo(page, light);
  await visibleFocus(light);
  await page.keyboard.press('Space');
  const spatial = page.locator('[data-spatial-stage]');
  await tabTo(page, spatial);
  await visibleFocus(spatial);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-space-readout]')).toHaveText('X 3° / Y 0°');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-space-readout]')).toHaveText('X 0° / Y 0°');
});

test('Keyboard navigation preserves real page URLs through header and footer', async ({
  page,
}) => {
  await page.goto(base);
  for (const [name, path] of [
    ['Work', '/work'],
    ['Experience', '/experience'],
    ['Lab', '/lab'],
    ['Technology', '/technology'],
    ['Status', '/status'],
    ['Start a project', '/contact'],
    ['About Me', '/about'],
    ['Home', '/'],
  ]) {
    const link = page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name, exact: true });
    await tabTo(page, link);
    await page.keyboard.press('Enter');
    await expect
      .poll(() => new URL(page.url()).pathname.replace(/\/$/, ''))
      .toBe(path.replace(/\/$/, ''));
  }
  const footer = page
    .getByRole('navigation', { name: 'Footer navigation' })
    .getByRole('link', { name: 'About Me', exact: true });
  await tabTo(page, footer);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/about\/?$/);
});
