// Adapted from Cassileigh/cleaning-by-cassi's manual local diagnostics.
// Intentionally altered modes are observations, never release acceptance.
const { webkit } = require('@playwright/test');
const { mkdirSync, writeFileSync } = require('node:fs');
const origin = 'http://127.0.0.1:4321';
const output = 'test-results/webkit-diagnostics';
const deadline = setTimeout(() => {
  console.error('Diagnostics timed out');
  process.exit(1);
}, 240000);

(async () => {
  mkdirSync(output, { recursive: true });
  const results = [];
  const browser = await webkit.launch();
  try {
    for (const mode of [
      'baseline',
      'without-css',
      'without-js',
      'without-response-headers',
    ]) {
      const context = await browser.newContext();
      try {
        await context.tracing.start({ screenshots: true, snapshots: true });
        const page = await context.newPage();
        page.on('requestfailed', (request) =>
          console.log(mode, request.failure(), request.url()),
        );
        page.on('pageerror', (error) => console.log(mode, error.message));
        await page.route('**/*', async (route) => {
          // Local preview only; no provider calls or form submissions.
          if (
            !route
              .request()
              .url()
              .startsWith(origin + '/')
          )
            return route.abort();
          if (
            mode === 'without-css' &&
            route.request().resourceType() === 'stylesheet'
          )
            return route.fulfill({ contentType: 'text/css', body: '' });
          if (
            mode === 'without-js' &&
            route.request().resourceType() === 'script'
          )
            return route.fulfill({
              contentType: 'application/javascript',
              body: '',
            });
          if (
            mode === 'without-response-headers' &&
            route.request().resourceType() === 'document'
          ) {
            const response = await route.fetch();
            return route.fulfill({
              status: response.status(),
              headers: { 'content-type': 'text/html' },
              body: await response.body(),
            });
          }
          return route.continue();
        });
        for (const [index, route] of ['/', '/status/'].entries()) {
          try {
            const response = await page.goto(origin + route, {
              waitUntil: 'domcontentloaded',
              timeout: 15000,
            });
            if (!response?.ok() || !(await page.locator('main').count()))
              throw new Error('Missing successful main document');
            await page.screenshot({
              path: `${output}/${mode}-${index}.png`,
              fullPage: true,
              timeout: 10000,
            });
            results.push({ mode, route, interactive: true });
          } catch (error) {
            results.push({
              mode,
              route,
              interactive: false,
              error: error.message,
            });
            if (mode === 'baseline') process.exitCode = 1;
          }
        }
        await context.tracing.stop({ path: `${output}/${mode}.zip` });
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
    writeFileSync(`${output}/summary.json`, JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  }
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => clearTimeout(deadline));
