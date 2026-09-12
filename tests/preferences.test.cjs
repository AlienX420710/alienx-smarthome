const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function boot(saved = {}, blocked = false) {
  const handlers = {};
  const document = {
    documentElement: { dataset: {} },
    addEventListener: (event, handler) => {
      handlers[event] = handler;
    },
    dispatchEvent() {},
  };
  const window = {};
  vm.runInNewContext(fs.readFileSync('public/site-preferences.js', 'utf8'), {
    document,
    window,
    URL,
    Event,
    location: { href: 'https://example.test/contact/' },
    localStorage: {
      getItem: (key) => {
        if (blocked) throw Error();
        return saved[key];
      },
      setItem: (key, value) => {
        if (blocked) throw Error();
        saved[key] = value;
      },
    },
  });
  return { document, window, handlers };
}
test('saved theme and route apply before page-load', () => {
  const { document } = boot({ 'alienx-theme': 'dark' });
  assert.equal(document.documentElement.dataset.alienxTheme, 'dark');
  assert.equal(document.documentElement.dataset.alienxPage, 'contact');
});
test('system choice clears explicit theme before a navigation swap', () => {
  const { window, handlers } = boot({ 'alienx-theme': 'light' });
  window.__alienxSetTheme('system');
  const next = { documentElement: { dataset: { alienxTheme: 'light' } } };
  handlers['astro:before-swap']({
    newDocument: next,
    to: new URL('https://example.test/experience/'),
  });
  assert.equal(next.documentElement.dataset.alienxTheme, undefined);
  assert.equal(next.documentElement.dataset.alienxPage, 'experience');
});
test('explicit theme survives navigation even when preference storage is blocked', () => {
  const { window, handlers } = boot({}, true);
  window.__alienxSetTheme('dark');
  const next = { documentElement: { dataset: {} } };
  handlers['astro:before-swap']({
    newDocument: next,
    to: new URL('https://example.test/technology'),
  });
  assert.equal(next.documentElement.dataset.alienxTheme, 'dark');
});
