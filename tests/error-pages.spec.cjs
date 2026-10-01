const { test, expect } = require('@playwright/test');
const axe = require('axe-core');

const base = 'http://127.0.0.1:4321';
const localOrigin = new URL(base).origin;

test.use({
  screenshot: 'only-on-failure',
  trace: 'retain-on-failure',
  reducedMotion: 'reduce',
});

for (const [path, status, title] of [
  ['/__alienx_missing_error_test__/', 404, 'Signal not found'],
  ['/500/', 500, 'System fault'],
]) {
  test(`${status} error page is branded, private from indexing, and self-contained`, async ({
    page,
  }) => {
    const remoteRequests = [];
    const runtimeErrors = [];

    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.origin !== localOrigin) remoteRequests.push(request.url());
    });
    page.on('pageerror', (error) => runtimeErrors.push(error.message));

    await page.addInitScript({ content: axe.source });
    const response = await page.goto(base + path, {
      waitUntil: 'domcontentloaded',
    });

    expect(response).not.toBeNull();
    expect(response.status()).toBe(status);
    await expect(page.locator('main h1')).toHaveText(
      new RegExp(`ERROR\\s*${status}`, 'i'),
    );
    await expect(page.locator('[data-error-title]')).toHaveText(title);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow, noarchive',
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(
      page.getByRole('navigation', { name: 'Error recovery' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: '[ RETURN HOME ]' }),
    ).toHaveAttribute('href', '/');
    await expect(
      page.getByRole('link', { name: '[ CONTACT ALIENX ]' }),
    ).toHaveAttribute('href', '/contact');

    const results = await page.evaluate(async () =>
      window.axe.run(document, {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      }),
    );

    expect(results.violations).toEqual([]);
    expect(remoteRequests).toEqual([]);
    expect(runtimeErrors).toEqual([]);
  });
}
