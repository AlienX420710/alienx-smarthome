import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(
  new URL('../public/site-preferences.js', import.meta.url),
  'utf8',
);
const config = {
  theme: {
    key: 'sample-theme',
    attribute: 'data-sample-theme',
    setter: 'setSampleTheme',
    event: 'sample:theme',
  },
  motion: {
    key: 'sample-motion',
    attribute: 'data-sample-motion',
    setter: 'setSampleMotion',
    event: 'sample:motion',
  },
  pageAttribute: 'data-sample-page',
  routes: { '/': 'home', '/contact': 'contact', '/about': 'about' },
};
function root(attributes = {}) {
  return {
    attributes,
    setAttribute(key, value) {
      attributes[key] = value;
    },
    getAttribute: (key) => attributes[key] ?? null,
    removeAttribute(key) {
      delete attributes[key];
    },
  };
}
function boot(saved = {}, blocked = false, configured = true) {
  const handlers = {},
    events = [];
  const document = {
    documentElement: root(),
    currentScript: {
      dataset: { preferences: configured ? JSON.stringify(config) : '' },
    },
    addEventListener(name, handler) {
      handlers[name] = handler;
    },
    dispatchEvent(event) {
      events.push(event.type);
    },
  };
  const window = {};
  const context = vm.createContext({
    document,
    window,
    URL,
    Event,
    location: { href: 'https://example.test/contact/' },
    localStorage: {
      getItem(key) {
        if (blocked) throw Error();
        return saved[key];
      },
      setItem(key, value) {
        if (blocked) throw Error();
        saved[key] = value;
      },
    },
  });
  vm.runInContext(source, context);
  return {
    document,
    window,
    handlers,
    events,
    reload: () => vm.runInContext(source, context),
  };
}
test('an unconfigured copy stays inert', () => {
  const page = boot({}, false, false);
  assert.deepEqual(page.document.documentElement.attributes, {});
  assert.deepEqual(page.handlers, {});
  assert.equal(page.window.sitePreferences, undefined);
});
test('saved choices apply before navigation; system clears stale attributes', () => {
  const page = boot({ 'sample-theme': 'dark', 'sample-motion': 'off' });
  assert.deepEqual(page.document.documentElement.attributes, {
    'data-sample-theme': 'dark',
    'data-sample-motion': 'off',
    'data-sample-page': 'contact',
  });
  page.window.setSampleTheme('system');
  const next = {
    documentElement: root({
      'data-sample-theme': 'light',
      'data-sample-motion': 'on',
    }),
  };
  page.handlers['astro:before-swap']({
    newDocument: next,
    to: new URL('https://example.test/about/'),
  });
  assert.equal(next.documentElement.getAttribute('data-sample-theme'), null);
  assert.equal(next.documentElement.getAttribute('data-sample-motion'), 'off');
  assert.equal(next.documentElement.getAttribute('data-sample-page'), 'about');
  assert.deepEqual(page.events, ['sample:theme']);
});
test('blocked storage retains in-memory choices across swaps and one binding', () => {
  const page = boot({}, true);
  page.window.setSampleTheme('dark');
  page.window.setSampleMotion('off');
  page.reload();
  const next = { documentElement: root() };
  page.handlers['astro:before-swap']({
    newDocument: next,
    to: new URL('https://example.test/about'),
  });
  assert.equal(next.documentElement.getAttribute('data-sample-theme'), 'dark');
  assert.equal(next.documentElement.getAttribute('data-sample-motion'), 'off');
});
test('retired and unknown routes preserve server error identity; known routes override it', () => {
  const page = boot();
  for (const path of ['missing', 'work', 'experience', 'technology', 'lab']) {
    for (const suffix of ['', '/']) {
      const next = { documentElement: root({ 'data-sample-page': 'error' }) };
      page.handlers['astro:before-swap']({
        newDocument: next,
        to: new URL(`https://example.test/${path}${suffix}`),
      });
      assert.equal(
        next.documentElement.getAttribute('data-sample-page'),
        'error',
      );
    }
  }
  const next = { documentElement: root({ 'data-sample-page': 'error' }) };
  page.handlers['astro:before-swap']({
    newDocument: next,
    to: new URL('https://example.test/about/'),
  });
  assert.equal(next.documentElement.getAttribute('data-sample-page'), 'about');
});
test('invalid persisted or runtime choices cannot become arbitrary DOM attributes', () => {
  const page = boot({ 'sample-theme': 'other', 'sample-motion': 'other' });
  assert.equal(
    page.document.documentElement.getAttribute('data-sample-theme'),
    null,
  );
  assert.equal(
    page.document.documentElement.getAttribute('data-sample-motion'),
    null,
  );
  page.window.setSampleMotion('off');
  page.window.setSampleMotion('other');
  assert.equal(
    page.document.documentElement.getAttribute('data-sample-motion'),
    null,
  );
});
