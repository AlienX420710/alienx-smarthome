const { test, expect } = require('@playwright/test');
const axe = require('axe-core');

const base = 'http://127.0.0.1:4321';
const localOrigin = new URL(base).origin;

test.use({
  screenshot: 'only-on-failure',
  trace: 'retain-on-failure',
  reducedMotion: 'reduce',
});

for (const [path, code, directStatus, title] of [
  ['/__alienx_missing_error_test__/', 404, 404, 'Signal not found'],
  // Astro promotes 500.astro to HTTP 500 only when a runtime rendering error
  // invokes the special error page. A direct /500/ visit is a normal preview.
  ['/500/', 500, 200, 'System fault'],
]) {
  test(`${code} error page is branded, private from indexing, and self-contained`, async ({
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
    expect(response.status()).toBe(directStatus);
    await expect(page.locator('main h1')).toHaveText(
      new RegExp(`ERROR\\s*${code}`, 'i'),
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

const background = (page) =>
  page.evaluate(() => {
    const style = getComputedStyle(document.body);
    return {
      image: style.backgroundImage,
      color: style.backgroundColor,
      size: style.backgroundSize,
    };
  });

for (const mode of [
  { name: 'explicit light', saved: 'light', system: 'dark' },
  { name: 'explicit dark', saved: 'dark', system: 'light' },
  { name: 'system light', saved: null, system: 'light' },
  { name: 'system dark', saved: null, system: 'dark' },
]) {
  test(`error shell matches the primary site background in ${mode.name}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: mode.system });
    await page.addInitScript((saved) => {
      if (saved) localStorage.setItem('alienx-theme', saved);
      else localStorage.removeItem('alienx-theme');
    }, mode.saved);

    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    const expected = await background(page);

    for (const path of ['/__alienx_missing_error_test__/', '/500/']) {
      await page.goto(base + path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute(
        'data-alienx-page',
        'error',
      );
      expect(await background(page)).toEqual(expected);
    }
  });
}
