const { Builder } = require('selenium-webdriver');
const safari = require('selenium-webdriver/safari');

const baseURL = 'http://127.0.0.1:4321';
const routes = [
  '/',
  '/work/',
  '/experience/',
  '/technology/',
  '/status/',
  '/about/',
  '/contact/',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const options = new safari.Options();
  const driver = await new Builder()
    .forBrowser('safari')
    .setSafariOptions(options)
    .build();

  try {
    await driver.manage().window().setRect({ width: 1280, height: 800 });

    for (const route of routes) {
      await driver.get(`${baseURL}${route}`);
      await sleep(route === '/status/' ? 1500 : 500);

      const result = await driver.executeScript(() => {
        const root = document.documentElement;
        const body = document.body;
        const width = Math.max(root.scrollWidth, body?.scrollWidth ?? 0);
        return {
          title: document.title,
          readyState: document.readyState,
          viewportWidth: window.innerWidth,
          documentWidth: width,
          hasBody: Boolean(body),
          hasMain: Boolean(document.querySelector('main')),
          statusChecks: document.querySelectorAll('#checks .check').length,
        };
      });

      if (!result.title) throw new Error(`${route}: missing document title`);
      if (!['interactive', 'complete'].includes(result.readyState)) {
        throw new Error(
          `${route}: document did not reach an interactive state`,
        );
      }
      if (!result.hasBody || !result.hasMain) {
        throw new Error(`${route}: missing body/main`);
      }
      if (result.documentWidth > result.viewportWidth + 1) {
        throw new Error(
          `${route}: horizontal overflow (${result.documentWidth}px > ${result.viewportWidth}px)`,
        );
      }
      if (route === '/status/' && result.statusChecks !== 4) {
        throw new Error(
          `${route}: expected 4 status checks, found ${result.statusChecks}`,
        );
      }

      for (const theme of ['light', 'dark']) {
        const themeState = await driver.executeAsyncScript(
          (selectedTheme, done) => {
            if (typeof window.__alienxSetTheme !== 'function') {
              done({ error: 'theme controller unavailable' });
              return;
            }

            window.__alienxSetTheme(selectedTheme);

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                const root = document.documentElement;
                const body = document.body;
                let storedTheme = null;
                try {
                  storedTheme = localStorage.getItem('alienx-theme');
                } catch {}
                done({
                  theme: root.dataset.alienxTheme ?? null,
                  storedTheme,
                  bodyBackground: getComputedStyle(body).backgroundColor,
                  bodyColor: getComputedStyle(body).color,
                });
              });
            });
          },
          theme,
        );

        if (themeState.error) {
          throw new Error(`${route}: ${themeState.error}`);
        }
        if (themeState.theme !== theme || themeState.storedTheme !== theme) {
          throw new Error(
            `${route}: failed to apply ${theme} theme (DOM=${String(themeState.theme)}, storage=${String(themeState.storedTheme)})`,
          );
        }
        if (!themeState.bodyBackground || !themeState.bodyColor) {
          throw new Error(`${route}: invalid ${theme} computed styles`);
        }
      }
    }
  } finally {
    await driver.quit();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
