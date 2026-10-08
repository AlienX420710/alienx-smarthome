const { test, expect } = require('@playwright/test');
const site = require('../engineering.config.json');
const routes = [
  ...new Set([
    ...site.routes,
    site.browser.missingRoute,
    ...(site.browser.errorRoutes || []),
  ]),
];
const states = [
  { name: 'system light', system: 'light' },
  { name: 'system dark', system: 'dark' },
  ...(site.browser.themeKey
    ? [
        {
          name: 'saved light over dark system',
          system: 'dark',
          saved: 'light',
        },
        {
          name: 'saved dark over light system',
          system: 'light',
          saved: 'dark',
        },
      ]
    : []),
];

for (const width of [320, 820, 1280]) {
  for (const state of states) {
    // Saved-theme precedence uses the tablet viewport; system themes cover all widths.
    if (state.saved && width !== 820) continue;
    for (const route of routes) {
      test(`opaque full-page canvas: ${route} / ${width} / ${state.name}`, async ({
        page,
      }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({
          colorScheme: state.system,
          reducedMotion: 'reduce',
        });
        await page.addInitScript(
          ({ key, value }) => {
            if (!key) return;
            if (value) localStorage.setItem(key, value);
            else localStorage.removeItem(key);
          },
          { key: site.browser.themeKey, value: state.saved },
        );
        await page.route('https://challenges.cloudflare.com/**', (route) =>
          route.abort(),
        );
        await page.route('**/api/quote*', (route) => route.abort());
        await page.route('**/api/inquiry*', (route) => route.abort());
        await page.goto('http://127.0.0.1:4321' + route, {
          waitUntil: 'domcontentloaded',
        });
        await page.evaluate(() => document.fonts.ready);
        // Real scrolling loads below-the-fold images before the full-page capture.
        const height = await page.evaluate(
          () => document.documentElement.scrollHeight,
        );
        for (let y = 0; y < height; y += 800) {
          await page.evaluate((y) => scrollTo(0, y), y);
          await page.waitForTimeout(60);
        }
        await page.evaluate(async () => {
          await Promise.all(
            [...document.images].map((image) => image.decode().catch(() => {})),
          );
          scrollTo(0, 0);
        });
        const canvas = await page.evaluate(() => {
          const root = getComputedStyle(document.documentElement);
          const body = getComputedStyle(document.body);
          return {
            rootImage: root.backgroundImage,
            bodyImage: body.backgroundImage,
            rootColor: root.backgroundColor,
            bodyColor: body.backgroundColor,
            rootScheme: root.colorScheme,
            bodyScheme: body.colorScheme,
            rootPalette: root.getPropertyValue('--site-canvas'),
            bodyPalette: body.getPropertyValue('--site-canvas'),
            bodyParent: document.body.parentElement?.tagName,
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            bodyHeight: document.body.getBoundingClientRect().height,
            missingImages: [...document.images]
              .filter((image) => image.currentSrc && !image.naturalWidth)
              .map((image) => image.getAttribute('src')),
          };
        });
        expect(canvas.rootImage).toBe('none');
        expect(canvas.bodyImage).toBe('none');
        expect(canvas.rootColor, JSON.stringify(canvas)).toBe(canvas.bodyColor);
        expect(canvas.bodyColor).toMatch(/^rgb\(/);
        expect(canvas.bodyHeight).toBeGreaterThanOrEqual(899);
        expect(canvas.overflow).toBe(false);
        expect(canvas.missingImages).toEqual([]);
        if (site.browser.themeAttribute && state.saved) {
          await expect(page.locator('html')).toHaveAttribute(
            site.browser.themeAttribute,
            state.saved,
          );
        } else if (site.browser.themeAttribute) {
          await expect(page.locator('html')).not.toHaveAttribute(
            site.browser.themeAttribute,
            /.+/,
          );
        }
        await page.screenshot({
          path: testInfo.outputPath('full-page-canvas.png'),
          fullPage: true,
        });
      });
    }
  }
}
