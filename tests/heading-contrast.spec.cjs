const { test, expect } = require('@playwright/test');
const { headingContrast } = require('./heading-contrast.cjs');

test('measures child text against painted gradients rather than ancestor colors', async ({
  page,
}) => {
  await page.route('https://contrast.test/**', (route) => {
    if (route.request().url().endsWith('/fixture.css'))
      return route.fulfill({
        contentType: 'text/css',
        body: `
        body { background: white; }
        section { background: linear-gradient(135deg,#6f14d9,#1548f5,#f24bb5); }
        h1 { color: #211631; font-size: 40px; }
        h1 span, h2 { color: white; }
        h2 { font-size: 32px; }
      `,
      });
    return route.fulfill({
      contentType: 'text/html',
      headers: {
        'Content-Security-Policy': "default-src 'self'; style-src 'self'",
      },
      body: '<link rel="stylesheet" href="/fixture.css"><section><h1><span>Visible child color</span></h1><h2>Gradient backdrop</h2></section>',
    });
  });
  await page.goto('https://contrast.test/');
  const results = await headingContrast(page);
  expect(results).toHaveLength(2);
  expect(results.filter((run) => run.ratio < run.required)).toEqual([]);
  // Screenshot-only text masking must not alter the page used by axe.
  expect(
    await page
      .locator('h1 span')
      .evaluate((el) => getComputedStyle(el).webkitTextFillColor),
  ).toBe('rgb(255, 255, 255)');
});

test('rejects low-contrast child text and low-contrast gradient regions', async ({
  page,
}) => {
  await page.setContent(`<style>
    h1,h2 { font-size: 32px; color:white; }
    h1 { background: #43108f; }
    h1 span { color:#211631; }
    h2 { background: linear-gradient(90deg,#111,white 40%); }
  </style><h1><span>Unreadable child</span></h1><h2>Unreadable gradient region across this heading</h2>`);
  const results = await headingContrast(page);
  expect(results.filter((run) => run.ratio < run.required)).toHaveLength(2);
});

test('centers a fractional viewport-edge heading below a sticky banner before measuring its gradient', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setContent(`<style>
    html { scroll-behavior: smooth; }
    body { margin: 0; background: #fffafe; }
    header { position: sticky; top: 0; height: 103px; background: #111; z-index: 2; }
    .before { height: 1200px; }
    section { padding: 64px; background: linear-gradient(135deg,#6f14d9,#1548f5,#f24bb5); }
    h2 { margin: 0; width: 922px; color: white; font: 64px/1.1 serif; }
    .after { height: 1200px; }
  </style><header></header><div class="before"></div><section><h2>Ready to come home to a cleaner space?</h2></section><div class="after"></div>`);
  const initial = await page.evaluate(() => {
    const heading = document.querySelector('h2');
    const box = heading.getBoundingClientRect();
    scrollTo({
      top: scrollY + box.bottom - (innerHeight - 0.25),
      behavior: 'instant',
    });
    window.headingCapturePositions = [];
    addEventListener('scroll', () => {
      const rect = heading.getBoundingClientRect();
      window.headingCapturePositions.push({
        top: rect.top,
        bottom: rect.bottom,
        headerBottom: document.querySelector('header').getBoundingClientRect()
          .bottom,
      });
    });
    return heading.getBoundingClientRect().bottom;
  });
  expect(Math.abs(initial - 719.75)).toBeLessThan(1);
  const results = await headingContrast(page);
  expect(results).toHaveLength(1);
  expect(results[0].ratio).toBeGreaterThanOrEqual(results[0].required);
  expect(
    await page.evaluate(() =>
      window.headingCapturePositions.some(
        (position) =>
          position.top > position.headerBottom + 8 &&
          position.bottom < innerHeight - 8,
      ),
    ),
  ).toBe(true);
});
