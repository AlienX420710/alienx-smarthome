// Intentionally altered modes are observations, never release acceptance.
const { mkdirSync, writeFileSync } = require('node:fs');
const origin = 'http://127.0.0.1:4321';

function diagnosticRoutes(site) {
  return [...new Set(['/', site.browser.statusRoute].filter(Boolean))];
}

async function intercept(route, mode) {
  const request = route.request();
  let requestOrigin;
  try {
    requestOrigin = new URL(request.url()).origin;
  } catch {
    return route.abort();
  }
  // Block provider traffic and all writes, even from local page scripts.
  if (requestOrigin !== origin || !['GET', 'HEAD'].includes(request.method()))
    return route.abort();
  if (mode === 'without-css' && request.resourceType() === 'stylesheet')
    return route.fulfill({ contentType: 'text/css', body: '' });
  if (mode === 'without-js' && request.resourceType() === 'script')
    return route.fulfill({ contentType: 'application/javascript', body: '' });
  if (
    mode === 'without-response-headers' &&
    request.resourceType() === 'document'
  ) {
    // Do not follow a local redirect to a provider outside the route guard.
    const response = await route.fetch({ maxRedirects: 0 });
    return route.fulfill({
      status: response.status(),
      headers: { 'content-type': 'text/html' },
      body: await response.body(),
    });
  }
  return route.continue();
}

async function runDiagnostics({
  webkit,
  routes,
  output = 'test-results/webkit-diagnostics',
}) {
  if (
    !Array.isArray(routes) ||
    !routes.length ||
    routes.some(
      (route) =>
        typeof route !== 'string' ||
        !route.startsWith('/') ||
        new URL(route, origin).origin !== origin,
    )
  )
    throw new Error('Diagnostics require local routes');
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
      const context = await browser.newContext({ serviceWorkers: 'block' });
      try {
        await context.tracing.start({ screenshots: true, snapshots: true });
        const page = await context.newPage();
        page.on('requestfailed', (request) =>
          console.log(mode, request.failure(), request.url()),
        );
        page.on('pageerror', (error) => console.log(mode, error.message));
        await context.route('**/*', (route) => intercept(route, mode));
        for (const [index, route] of routes.entries()) {
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
  return {
    results,
    passed: results
      .filter((result) => result.mode === 'baseline')
      .every((result) => result.interactive),
  };
}

module.exports = { diagnosticRoutes, intercept, runDiagnostics };

if (require.main === module) {
  const deadline = setTimeout(() => {
    console.error('Diagnostics timed out');
    process.exit(1);
  }, 240000);
  runDiagnostics({
    webkit: require('@playwright/test').webkit,
    routes: diagnosticRoutes(require('../engineering.config.json')),
  })
    .then(({ passed }) => {
      if (!passed) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => clearTimeout(deadline));
}
