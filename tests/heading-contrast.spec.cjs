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
    h2 { background: linear-gradient(90deg,#111,white); }
  </style><h1><span>Unreadable child</span></h1><h2>Unreadable gradient region across this heading</h2>`);
  const results = await headingContrast(page);
  expect(results.filter((run) => run.ratio < run.required)).toHaveLength(2);
});
