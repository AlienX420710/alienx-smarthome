const { test, expect } = require('@playwright/test');
const axe = require('axe-core');

const baseURL = 'http://127.0.0.1:4321';
const routes = [
  '/',
  '/work/',
  '/experience/',
  '/technology/',
  '/status/',
  '/about/',
  '/contact/',
  '/contact/success/',
];
const themes = ['light', 'dark', 'system'];
const schemes = ['light', 'dark'];
test.use({ screenshot: 'only-on-failure', trace: 'retain-on-failure' });

for (const scheme of schemes) {
  for (const theme of themes) {
    for (const route of routes) {
      test(`${theme} theme on ${scheme} OS: ${route}`, async ({ page }) => {
        await page.addInitScript(
          ({ selectedTheme }) => {
            try {
              localStorage.setItem('alienx-theme', selectedTheme);
            } catch {}
          },
          { selectedTheme: theme },
        );

        await page.addInitScript({ content: axe.source });
        await page.emulateMedia({
          colorScheme: scheme,
          reducedMotion: 'reduce',
        });
        await page.goto(`${baseURL}${route}`, {
          waitUntil: 'domcontentloaded',
        });

        if (theme === 'system')
          await expect(page.locator('html')).not.toHaveAttribute(
            'data-alienx-theme',
          );
        else
          await expect(page.locator('html')).toHaveAttribute(
            'data-alienx-theme',
            theme,
          );

        if (route === '/status/') {
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

        if (theme !== 'system') {
          const colors = () =>
            page.evaluate(() =>
              [
                ...document.querySelectorAll(
                  'body,header a,main h1,main h2,main h3,main p,main article,main input,main select,main button,main label',
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
          const before = await colors();
          await page.emulateMedia({
            colorScheme: scheme === 'light' ? 'dark' : 'light',
            reducedMotion: 'reduce',
          });
          await page.waitForTimeout(50);
          expect(
            await colors(),
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

        const headingContrast = await page.evaluate(() => {
          const parse = (value) => {
            const match = value.match(/rgba?\(([^)]+)\)/);
            if (!match) return null;
            const parts = match[1].split(',').map(Number);
            return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
          };
          const luminance = ({ r, g, b }) => {
            const channel = (value) => {
              const normalized = value / 255;
              return normalized <= 0.03928
                ? normalized / 12.92
                : ((normalized + 0.055) / 1.055) ** 2.4;
            };
            return (
              0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
            );
          };
          const contrast = (foreground, background) => {
            const a = luminance(foreground);
            const b = luminance(background);
            return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
          };
          const findBackground = (element) => {
            let current = element.parentElement;
            while (current) {
              const background = parse(
                getComputedStyle(current).backgroundColor,
              );
              if (background && background.a >= 0.99) return background;
              current = current.parentElement;
            }
            return (
              parse(getComputedStyle(document.body).backgroundColor) || {
                r: 255,
                g: 255,
                b: 255,
                a: 1,
              }
            );
          };
          return [...document.querySelectorAll('h1,h2,h3')]
            .filter((heading) => heading.textContent?.trim())
            .map((heading) => {
              const style = getComputedStyle(heading);
              const foreground = parse(style.color);
              const background = findBackground(heading);
              if (!foreground || !background || foreground.a < 0.99)
                return null;
              const fontSize = parseFloat(style.fontSize);
              const fontWeight = Number(style.fontWeight) || 400;
              const required =
                fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700)
                  ? 3
                  : 4.5;
              return {
                text: heading.textContent.trim().slice(0, 100),
                foreground: style.color,
                background: `rgb(${background.r}, ${background.g}, ${background.b})`,
                ratio: Number(contrast(foreground, background).toFixed(2)),
                required,
              };
            })
            .filter(Boolean);
        });

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
