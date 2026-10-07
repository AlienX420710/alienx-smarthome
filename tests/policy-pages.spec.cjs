const { test, expect } = require('@playwright/test');
const base = 'http://127.0.0.1:4321';

test('contact notice links policies without changing inquiry consent', async ({
  page,
}) => {
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.abort(),
  );
  await page.goto(`${base}/contact/`);
  const notice = page.locator('#inquiry-privacy-note');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('not for marketing');
  await expect(page.locator('#consent')).toHaveAttribute('required', '');
  await expect(page.locator('#consent')).not.toBeChecked();
  expect(
    await page
      .locator('#submit-button')
      .evaluate((button) =>
        Boolean(
          button.compareDocumentPosition(
            document.querySelector('#inquiry-privacy-note'),
          ) & Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      ),
  ).toBe(true);
  for (const [path, title] of [
    ['privacy', 'Privacy Policy'],
    ['terms', 'Terms of Service'],
  ]) {
    await expect(notice.getByRole('link', { name: title })).toHaveAttribute(
      'href',
      `/${path}/`,
    );
    await notice.getByRole('link', { name: title }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: title, exact: true }),
    ).toBeVisible();
    await expect(page.locator('main')).toContainText('Wisconsin');
    await expect(
      page.locator('footer').getByRole('link', { name: title, exact: true }),
    ).toBeVisible();
    await page
      .getByRole('link', { name: 'Back to contact', exact: true })
      .click();
    await expect(notice).toBeVisible();
  }
});
