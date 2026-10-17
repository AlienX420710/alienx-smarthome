const { test, expect } = require('@playwright/test');
const site = require('../engineering.config.json');
const base = 'http://127.0.0.1:4321';
const meta = (page, key) =>
  page.locator(`meta[name="${key}"], meta[property="${key}"]`);

test('shared metadata preserves canonical identity, social fields and font assets', async ({
  page,
}) => {
  await page.goto(base + '/?preview=metadata');
  const title = await page.title();
  const description = await meta(page, 'description').getAttribute('content');
  const canonical = site.origin + '/';
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    canonical,
  );
  await expect(meta(page, 'og:url')).toHaveAttribute('content', canonical);
  for (const key of ['og:title', 'twitter:title'])
    await expect(meta(page, key)).toHaveAttribute('content', title);
  for (const key of ['og:description', 'twitter:description'])
    await expect(meta(page, key)).toHaveAttribute('content', description);
  const image = await meta(page, 'og:image').getAttribute('content');
  expect(new URL(image).origin).toBe(site.origin);
  await expect(meta(page, 'twitter:image')).toHaveAttribute('content', image);
  const alt = await meta(page, 'og:image:alt').getAttribute('content');
  expect(alt).toBeTruthy();
  await expect(meta(page, 'twitter:image:alt')).toHaveAttribute('content', alt);
  await expect(page.locator('link[rel="preload"][as="font"]')).toHaveCount(2);
  const fonts = await page
    .locator('link[rel="preload"][as="font"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        href: node.getAttribute('href'),
        crossorigin: node.hasAttribute('crossorigin'),
      })),
    );
  expect(
    fonts.every((font) => font.href.startsWith('/fonts/') && font.crossorigin),
  ).toBe(true);
  if (site.form.encoding === 'form') {
    await expect(meta(page, 'og:image:secure_url')).toHaveAttribute(
      'content',
      image,
    );
    await expect(meta(page, 'og:image:type')).toHaveAttribute(
      'content',
      'image/jpeg',
    );
    await expect(meta(page, 'og:image:width')).toHaveAttribute(
      'content',
      '1200',
    );
    await expect(meta(page, 'og:image:height')).toHaveAttribute(
      'content',
      '630',
    );
  } else {
    await expect(meta(page, 'referrer')).toHaveAttribute(
      'content',
      'strict-origin-when-cross-origin',
    );
    const data = JSON.parse(
      await page.locator('script[type="application/ld+json"]').textContent(),
    );
    expect(data['@type']).toBe('WebSite');
    expect(data.url).toBe(site.origin);
    expect(data.publisher.name).toBe(data.name);
  }
});

test('success routes remain noindex with site canonical URLs and no query details', async ({
  page,
}) => {
  const success = site.noindexRoutes.find((route) => route.includes('success'));
  await page.goto(base + success + '?name=NeverIncludeThis');
  await expect(meta(page, 'robots')).toHaveAttribute(
    'content',
    'noindex, follow',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    site.origin + success,
  );
  await expect(meta(page, 'og:url')).toHaveAttribute(
    'content',
    site.origin + success,
  );
  expect(await page.locator('head').textContent()).not.toContain(
    'NeverIncludeThis',
  );
});
