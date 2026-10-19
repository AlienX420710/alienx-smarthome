const { test, expect } = require('@playwright/test');
const axe = require('axe-core');
const {
  headingContrast: measureHeadingContrast,
} = require('./heading-contrast.cjs');

const baseURL = 'http://127.0.0.1:4321';
const site = require('../engineering.config.json');
const routes = [...site.routes, site.browser.missingRoute];
const themes = site.browser.themeKey ? ['light', 'dark', 'system'] : ['system'];
const schemes = ['light', 'dark'];
test.use({ screenshot: 'only-on-failure', trace: 'retain-on-failure' });

const colors = (page) =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll(
        // Provider response inputs can appear asynchronously and have no visual theme.
        'body,header a,main h1,main h2,main h3,main p,main article,main input:not([type="hidden"]),main select,main button,main label',
      ),
    ].map((el) => {
      const style = getComputedStyle(el);
      return [
        style.color,
        style.backgroundColor,
        style.backgroundImage,
        style.borderColor,
      ];
    }),
  );

test('visual theme snapshot ignores late hidden controls but detects visible color changes', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.setContent(`<style>
    input { color: rgb(20, 30, 40); }
    @media (prefers-color-scheme: dark) { input { color: rgb(220, 230, 240); } }
  </style><main><input aria-label="Visible control"></main>`);
  const before = await colors(page);
  await page.evaluate(() => {
    const response = document.createElement('input');
    response.type = 'hidden';
    response.name = 'website';
    document.querySelector('main').prepend(response);
  });
  expect(await colors(page)).toEqual(before);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('input:not([type="hidden"])')).toHaveCSS(
    'color',
    'rgb(220, 230, 240)',
  );
  expect(await colors(page)).not.toEqual(before);
});

for (const scheme of schemes) {
  for (const theme of themes) {
    for (const route of routes) {
      test(`${theme} theme on ${scheme} OS: ${route}`, async ({ page }) => {
        await page.addInitScript(
          ({ selectedTheme, key }) => {
            try {
              if (key) localStorage.setItem(key, selectedTheme);
            } catch {}
          },
          { selectedTheme: theme, key: site.browser.themeKey },
        );

        await page.addInitScript({ content: axe.source });
        await page.emulateMedia({
          colorScheme: scheme,
          reducedMotion: 'reduce',
        });
        await page.goto(`${baseURL}${route}`, {
          waitUntil: 'domcontentloaded',
        });

        if (site.browser.themeAttribute && theme === 'system')
          await expect(page.locator('html')).not.toHaveAttribute(
            site.browser.themeAttribute,
          );
        else if (site.browser.themeAttribute)
          await expect(page.locator('html')).toHaveAttribute(
            site.browser.themeAttribute,
            theme,
          );

        if (route === site.browser.statusRoute) {
          await expect(page.locator('#checks')).toHaveAttribute(
            'aria-busy',
            'false',
            { timeout: 5000 },
          );
          await expect(page.locator('#checks .check')).toHaveCount(4, {
            timeout: 1000,
          });
        } else {
          await page.waitForTimeout(500);
        }

        // Expand optional service cards so every heading and its contrast is audited.
        const serviceDisclosure = page.locator('.addons-details > summary');
        for (const summary of await serviceDisclosure.all()) {
          if (
            !(await summary.evaluate((element) => element.parentElement.open))
          )
            await summary.click();
        }

        if (theme !== 'system') {
          const before = await colors(page);
          await page.emulateMedia({
            colorScheme: scheme === 'light' ? 'dark' : 'light',
            reducedMotion: 'reduce',
          });
          await page.waitForTimeout(50);
          expect(
            await colors(page),
            'Explicit theme must be independent of the OS preference',
          ).toEqual(before);
          await page.emulateMedia({
            colorScheme: scheme,
            reducedMotion: 'reduce',
          });
        }

        const visualHeadings = await page.evaluate(() =>
          [...document.querySelectorAll('h1,h2,h3')]
            .filter((heading) => heading.textContent?.trim())
            .map((heading) => {
              const rect = heading.getBoundingClientRect();
              const style = getComputedStyle(heading);
              return {
                text: heading.textContent.trim().slice(0, 100),
                width: rect.width,
                height: rect.height,
                visibility: style.visibility,
                display: style.display,
                opacity: Number(style.opacity),
                color: style.color,
              };
            }),
        );

        expect(
          visualHeadings.filter(
            (heading) =>
              heading.width <= 0 ||
              heading.height <= 0 ||
              heading.visibility === 'hidden' ||
              heading.display === 'none' ||
              heading.opacity === 0,
          ),
          `${theme} visually hidden headings on ${route}: ${JSON.stringify(visualHeadings)}`,
        ).toEqual([]);

        const headingContrast = await measureHeadingContrast(page);

        expect(
          headingContrast.filter((item) => item.ratio < item.required),
          `${theme} heading contrast failures on ${route}: ${JSON.stringify(headingContrast)}`,
        ).toEqual([]);

        const results = await page.evaluate(async () =>
          window.axe.run(document, {
            runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
          }),
        );

        expect(
          results.violations,
          `${theme} accessibility violations: ${JSON.stringify(results.violations)}`,
        ).toEqual([]);
      });
    }
  }
}
