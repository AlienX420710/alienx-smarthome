const site = require('../engineering.config.json');
const { Builder } = require('selenium-webdriver');
const safari = require('selenium-webdriver/safari');
const assert = require('node:assert/strict');
const { mkdirSync, writeFileSync } = require('node:fs');

(async () => {
  const deadline = setTimeout(() => {
    console.error('Safari exceeded its five-minute deadline');
    process.exit(1);
  }, 300000);
  console.log('Starting the macOS bundled Safari driver');
  const service = new safari.ServiceBuilder('/usr/bin/safaridriver').build();
  const server = await service.start();
  console.log('Creating Safari session');
  const driver = await new Builder()
    .withCapabilities({ pageLoadStrategy: 'eager' })
    .forBrowser('safari')
    .usingServer(server)
    .build();
  console.log('Safari session ready');
  await driver.manage().setTimeouts({ pageLoad: 30000, script: 10000 });
  try {
    for (const width of [768, 1280]) {
      await driver.manage().window().setRect({ width, height: 900 });
      for (const route of site.routes) {
        console.log(`Checking Safari ${width}px /${route}`);
        await driver.get(`http://127.0.0.1:4321${route}`);
        await driver.executeScript(() => {
          for (const image of document.images) image.loading = 'eager';
        });
        await driver.wait(
          () =>
            driver.executeScript(() =>
              Array.from(document.images).every(
                (image) => image.complete && image.naturalWidth > 0,
              ),
            ),
          10000,
        );
        // Eager navigation ends at DOMContentLoaded; cached images alone do not
        // establish stylesheet/font/transition readiness on the next route.
        await driver.wait(
          () => driver.executeScript(() => document.readyState === 'complete'),
          10000,
          `${route}: document did not finish loading`,
        );
        await driver.executeAsyncScript(function () {
          const done = arguments[arguments.length - 1];
          const transition = document.activeViewTransition?.finished;
          Promise.all([document.fonts.ready, transition?.catch(() => {})]).then(
            () => requestAnimationFrame(() => requestAnimationFrame(done)),
          );
        });
        if (route === site.browser.statusRoute) {
          await driver.wait(
            () =>
              driver.executeScript(
                () => document.querySelectorAll('#checks .check').length === 4,
              ),
            10000,
            'Expected four status checks',
          );
        }
        for (const theme of site.browser.themeSetter ? ['light', 'dark'] : []) {
          const applied = await driver.executeAsyncScript(
            (config, selected, done) => {
              if (typeof window[config.themeSetter] !== 'function')
                return done(false);
              window[config.themeSetter](selected);
              requestAnimationFrame(() =>
                requestAnimationFrame(() =>
                  done(
                    document.documentElement.getAttribute(
                      config.themeAttribute,
                    ) === selected &&
                      localStorage.getItem(config.themeKey) === selected &&
                      Boolean(
                        getComputedStyle(document.body).backgroundColor,
                      ) &&
                      Boolean(getComputedStyle(document.body).color),
                  ),
                ),
              );
            },
            site.browser,
            theme,
          );
          assert.ok(applied, `${route}: native Safari theme ${theme}`);
        }
        const state = await driver.executeScript((config) => {
          const box = (selector) =>
            document.querySelector(selector).getBoundingClientRect();
          const logo = box(config.logoSelector);
          const facebook = box(config.externalSelector);
          const nav = box('.internal-links');
          const active = document
            .querySelector('.internal-links [aria-current="page"]')
            ?.getBoundingClientRect();
          return {
            title: document.title,
            geometry: {
              logo: logo.toJSON(),
              nav: nav.toJSON(),
              facebook: facebook.toJSON(),
            },
            readyState: document.readyState,
            fonts: document.fonts.status,
            navDisplay: getComputedStyle(document.querySelector('header nav'))
              .display,
            main: Boolean(document.querySelector('main')),
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            logoVisible:
              logo.width > 0 && logo.left >= 0 && logo.right <= innerWidth,
            facebookVisible:
              facebook.width > 0 &&
              facebook.left >= 0 &&
              facebook.right <= innerWidth,
            navigationLayout:
              innerWidth <= config.navigationRowBreakpoint
                ? nav.top >= Math.max(logo.bottom, facebook.bottom) - 1
                : logo.top < nav.bottom && nav.top < logo.bottom,
            activeVisible:
              !active ||
              (active.left >= nav.left - 1 && active.right <= nav.right + 1),
          };
        }, site.browser);
        mkdirSync('safari-diagnostics', { recursive: true });
        writeFileSync(
          `safari-diagnostics/${width}-${route.replaceAll('/', '_') || 'home'}.json`,
          JSON.stringify(state, null, 2),
        );
        assert.ok(state.title && state.main, `${route}: page structure`);
        assert.equal(state.overflow, false, `${route}: overflow`);
        for (const key of [
          'logoVisible',
          'facebookVisible',
          'navigationLayout',
          'activeVisible',
        ])
          assert.ok(state[key], `${route}: ${key}`);
        console.log(`Safari ${width}px /${route}: passed`);
      }
    }
  } catch (error) {
    mkdirSync('safari-diagnostics', { recursive: true });
    writeFileSync(
      'safari-diagnostics/safari.png',
      await driver.takeScreenshot(),
      'base64',
    );
    throw error;
  } finally {
    try {
      await driver.quit();
    } finally {
      service.kill();
      clearTimeout(deadline);
    }
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
