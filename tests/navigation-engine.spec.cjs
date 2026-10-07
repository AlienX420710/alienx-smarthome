const { test, expect } = require('@playwright/test');
const site = require('../engineering.config.json');
test('navigation keeps the active tab visible without stealing scroll or focus', async ({
  page,
}) => {
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.abort(),
  );
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('http://127.0.0.1:4321' + site.form.route, {
    waitUntil: 'domcontentloaded',
  });
  await page.evaluate(() => document.fonts.ready);
  const rail = page.locator('header .internal-links');
  const current = rail.locator('[aria-current="page"]');
  await expect(current).toBeInViewport({ ratio: 1 });
  const before = await page.evaluate(() => ({
    scroll: window.scrollY,
    active: document.activeElement?.tagName,
  }));
  await page.setViewportSize({ width: 390, height: 700 });
  await expect(current).toBeInViewport({ ratio: 1 });
  await page.setViewportSize({ width: 320, height: 700 });
  await expect(current).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => window.scrollY)).toBe(before.scroll);
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
    before.active,
  );
  // Once revealed, the observer must not fight a user's deliberate rail scroll.
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const manual = await rail.evaluate((element) => {
    element.scrollLeft = 0;
    return element.scrollLeft;
  });
  await page.waitForTimeout(500);
  expect(await rail.evaluate((element) => element.scrollLeft)).toBe(manual);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(current).toBeInViewport({ ratio: 1 });
});
