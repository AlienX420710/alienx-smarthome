const { test, expect } = require('@playwright/test');
const origin = 'http://127.0.0.1:4321';
const attribute = (value) =>
  JSON.stringify(value).replace(
    /[&<>']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;' })[char],
  );
const status = {
  status: 'operational',
  generatedAt: '2026-10-14T12:00:00Z',
  runtime: 'Mock runtime',
  summary: 'Configured',
  requestId: 'mock',
  checks: {
    worker: { status: 'operational', detail: '<img src=x onerror=alert(1)>' },
  },
};
async function fixture(page, html) {
  await page.route('**/__shared-ui-fixture', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`,
    }),
  );
  await page.goto(origin + '/__shared-ui-fixture');
}

test('shared dashboard renders safe text, refreshes and stops on navigation', async ({
  page,
}) => {
  let requests = 0;
  await page.route('**/__mock-status', (route) => {
    requests++;
    return route.fulfill({
      status: 503,
      json: { ...status, status: 'degraded' },
    });
  });
  await page.clock.install();
  const config = {
    endpoint: '/__mock-status',
    checks: [['worker', 'WORKER', 'Fallback']],
    states: {
      checking: 'Checking',
      operational: 'Operational',
      configured: 'Configured',
      degraded: 'Degraded',
    },
    updatedPrefix: 'Last checked',
    error: {
      label: 'ENDPOINT',
      state: 'UNAVAILABLE',
      detail: 'Signal unavailable',
      updated: 'Unavailable',
    },
  };
  await fixture(
    page,
    `<main data-status-dashboard='${attribute(config)}'><div data-status-overall><span data-status-label></span></div><div data-status-checks></div><span data-status-updated></span><button data-status-refresh>Refresh</button><span data-status-progress></span><input></main><script type="module" src="/status-dashboard.js"></script>`,
  );
  await expect(page.locator('[data-status-label]')).toHaveText('Degraded');
  await expect(page.locator('small')).toHaveText(status.checks.worker.detail);
  await expect(page.locator('img')).toHaveCount(0);
  const initial = requests;
  await page.clock.runFor(31000);
  await expect.poll(() => requests).toBeGreaterThan(initial);
  await expect(page.locator('[data-status-refresh]')).toBeEnabled();
  await page.locator('input').focus();
  const typed = requests;
  await page.keyboard.press('r');
  expect(requests).toBe(typed);
  await page.evaluate(() =>
    document.dispatchEvent(new Event('astro:before-swap')),
  );
  const stopped = requests;
  await page.clock.runFor(65000);
  expect(requests).toBe(stopped);
});

const commands = {
  siteName: 'Sample',
  helpTitle: 'SAMPLE COMMANDS',
  statusEndpoint: '/__mock-status',
  statusChecks: ['worker'],
  inputId: 'sample-input',
  resultsId: 'sample-results',
  overlayId: 'sample-overlay',
  toastId: 'sample-toast',
  commands: [
    {
      name: '/help',
      description: 'Show help',
      keywords: 'help',
      action: 'help',
    },
    {
      name: '/build',
      description: 'Inspect build',
      keywords: 'build',
      action: 'build',
    },
    {
      name: '/clear',
      description: 'Clear input',
      keywords: 'clear',
      action: 'clear',
    },
    {
      name: '<img src=x>',
      description: '<script>unsafe()</script>',
      keywords: 'literal',
      action: 'help',
    },
  ],
};
const palette = () =>
  `<button id="previous">Previous focus</button><dialog data-command-palette='${attribute(commands)}' hidden><button data-palette-close>Close</button><input id="sample-input"><div id="sample-results"></div></dialog><script type="module" src="/command-palette.js"></script>`;

test('shared palette preserves search, native keyboard activation and focus restoration', async ({
  page,
}) => {
  await fixture(page, palette());
  await expect(page.locator('#sample-results button')).toHaveCount(4);
  await expect(
    page.locator('#sample-results img, #sample-results script'),
  ).toHaveCount(0);
  await page.locator('#previous').focus();
  await page.keyboard.press('Control+k');
  await expect(page.locator('#sample-input')).toBeFocused();
  await page.locator('#sample-input').fill('/clear');
  await page.keyboard.press('Enter');
  await expect(page.locator('#sample-input')).toHaveValue('');
  await expect(page.locator('[data-command-palette]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#previous')).toBeFocused();
  await page.keyboard.press('Control+k');
  await page.keyboard.press('Tab');
  await expect(page.locator('#sample-results button').first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#sample-overlay')).toBeVisible();
  await expect(page.locator('.palette__overlay-content')).toContainText(
    '/help — Show help',
  );
  await page.keyboard.press('Tab');
  await expect(page.locator('#sample-overlay button')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#previous')).toBeFocused();
});

test('a late command response cannot open a dialog after an Astro swap', async ({
  page,
}) => {
  let complete;
  await page.route(
    '**/__mock-status',
    (route) =>
      new Promise((resolve) => {
        complete = () => route.fulfill({ json: status }).then(resolve);
      }),
  );
  await fixture(page, palette());
  await page.keyboard.press('Control+k');
  await page.locator('#sample-input').fill('/build');
  await page.keyboard.press('Enter');
  await expect.poll(() => typeof complete).toBe('function');
  await page.evaluate(() =>
    document.dispatchEvent(new Event('astro:before-swap')),
  );
  await complete();
  // A following same-origin script runs after the released fetch response task.
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 50)));
  await expect(page.locator('#sample-overlay')).toHaveCount(0);
});

test('unconfigured copies add no controls or keyboard interception', async ({
  page,
}) => {
  await fixture(
    page,
    '<input id="ordinary"><script src="/site-preferences.js"></script><script type="module" src="/status-dashboard.js"></script><script type="module" src="/command-palette.js"></script>',
  );
  await page.locator('#ordinary').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('#ordinary')).toBeFocused();
  await expect(page.locator('dialog, [data-status-dashboard]')).toHaveCount(0);
});
