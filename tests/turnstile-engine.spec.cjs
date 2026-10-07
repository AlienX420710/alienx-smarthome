const { test, expect } = require('@playwright/test');
const site = require('../engineering.config.json');

test('Turnstile loads once, survives swaps, and preserves the site contract', async ({
  page,
}) => {
  await page.route(
    'https://challenges.cloudflare.com/turnstile/v0/api.js*',
    (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `window.widgetCalls = []; window.removedWidgets = [];
      window.turnstile = {
        render(el, options) { window.widgetCalls.push({el, options}); return window.widgetCalls.length - 1; },
        remove(id) { window.removedWidgets.push(id); }, reset() {}
      };
      window.${site.browser.turnstileCallback}();`,
      }),
  );
  await page.goto('http://127.0.0.1:4321' + site.form.route, {
    waitUntil: 'networkidle',
  });
  await expect
    .poll(() => page.evaluate(() => window.widgetCalls?.length))
    .toBe(1);
  const result = await page.evaluate(
    ({ selector, callback, encoding }) => {
      window[callback]();
      document.dispatchEvent(new Event('astro:page-load'));
      const first = window.widgetCalls[0];
      const countBeforeSwap = window.widgetCalls.length;
      document.dispatchEvent(new Event('astro:before-swap'));
      const old = document.querySelector(selector);
      const next = old.cloneNode(false);
      old.replaceWith(next);
      document.dispatchEvent(new Event('astro:page-load'));
      const current = window.widgetCalls[1];
      current.options.callback();
      const status = document.querySelector('#form-status');
      const before = status?.textContent;
      first.options['error-callback']();
      const staleIgnored =
        next.dataset.state !== 'error' && status?.textContent === before;
      current.options['expired-callback']();
      return {
        countBeforeSwap,
        countAfterSwap: window.widgetCalls.length,
        removed: window.removedWidgets,
        staleIgnored,
        action: current.options.action,
        field: current.options['response-field-name'],
        size: current.options.size,
        expiryVisible:
          encoding === 'json'
            ? next.dataset.state === 'expired'
            : status.textContent.includes('expired'),
      };
    },
    {
      selector: site.form.turnstile,
      callback: site.browser.turnstileCallback,
      encoding: site.form.encoding,
    },
  );
  expect(result.countBeforeSwap).toBe(1);
  expect(result.countAfterSwap).toBe(2);
  expect(result.removed).toEqual([0]);
  expect(result.staleIgnored).toBe(true);
  expect(result.action).toBe(
    site.form.encoding === 'json' ? 'contact' : 'quote',
  );
  expect(result.field).toBe(
    site.form.encoding === 'json' ? 'website' : 'cf-turnstile-response',
  );
  expect(result.size).toBe(
    site.form.encoding === 'json' ? 'compact' : 'flexible',
  );
  expect(result.expiryVisible).toBe(true);
});
