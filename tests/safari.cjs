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
      if (!['interactive', 'complete'].includes(result.readyState))
        throw new Error(
          `${route}: document did not reach an interactive state`,
        );
      if (!result.hasBody || !result.hasMain)
        throw new Error(`${route}: missing body/main`);
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
        await driver.executeScript((selectedTheme) => {
          document.documentElement.dataset.alienxTheme = selectedTheme;
        }, theme);
        const themeState = await driver.executeScript(() => ({
          theme: document.documentElement.dataset.alienxTheme,
          bodyBackground: getComputedStyle(document.body).backgroundColor,
          bodyColor: getComputedStyle(document.body).color,
        }));
        if (themeState.theme !== theme)
          throw new Error(`${route}: failed to apply ${theme} theme`);
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
