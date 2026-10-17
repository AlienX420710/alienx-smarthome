import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(
  new URL('../public/confirmation-engine.js', import.meta.url),
  'utf8',
);
function setup(blocked = false) {
  const storage = new Map();
  const events = {};
  let now = 1000;
  let timeout;
  let heading = null;
  const listen = (name, handler) => (events[name] ??= []).push(handler);
  const window = {
    location: { pathname: '/success/' },
    sessionStorage: {
      getItem(key) {
        if (blocked) throw new Error('blocked');
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        if (blocked) throw new Error('blocked');
        storage.set(key, value);
      },
      removeItem(key) {
        if (blocked) throw new Error('blocked');
        storage.delete(key);
      },
    },
    addEventListener: listen,
    setTimeout(fn) {
      timeout = fn;
      return 1;
    },
    clearTimeout() {
      timeout = undefined;
    },
  };
  const context = vm.createContext({
    window,
    document: { querySelector: () => heading, addEventListener: listen },
    Date: { now: () => now },
  });
  vm.runInContext(source, context);
  return {
    api: window.siteConfirmation,
    storage,
    window,
    heading() {
      heading = {
        dataset: { confirmationGeneric: 'Thank you!' },
        textContent: 'Thank you!',
      };
      return heading;
    },
    event(name) {
      for (const handler of events[name] || []) handler();
    },
    advance(value) {
      now += value;
    },
    expire() {
      timeout?.();
    },
    reloadScript() {
      vm.runInContext(source, context);
    },
    listeners(name) {
      return events[name]?.length || 0;
    },
  };
}

test('only a bounded first name and destination are retained in tab storage', () => {
  const page = setup();
  page.api.rememberAccepted('  Zoë-Marie PrivateSurname  ', '/success/');
  const raw = [...page.storage.values()][0];
  assert.deepEqual(JSON.parse(raw), {
    firstName: 'Zoë-Marie',
    route: '/success',
    expires: 601000,
  });
  assert.doesNotMatch(raw, /PrivateSurname/);
  const heading = page.heading();
  page.api.render();
  assert.equal(heading.textContent, 'Thank you, Zoë-Marie!');
  page.expire();
  assert.equal(heading.textContent, 'Thank you!');
  assert.equal(page.storage.size, 0);
});

test('direct, expired, corrupt, wrong-route and future-dated visits stay generic', () => {
  for (const saved of [
    null,
    'broken',
    '{"firstName":"<img>"}',
    JSON.stringify({ firstName: 'Test', route: '/elsewhere', expires: 5000 }),
    JSON.stringify({ firstName: 'Test', route: '/success', expires: 900 }),
    JSON.stringify({ firstName: 'Test', route: '/success', expires: 9999999 }),
  ]) {
    const page = setup();
    if (saved !== null) page.storage.set('site-confirmation-v1', saved);
    const heading = page.heading();
    page.api.render();
    assert.equal(heading.textContent, 'Thank you!');
    assert.equal(page.storage.size, 0);
  }
});

test('markup, email addresses, overlong names and invalid routes are not retained', () => {
  const page = setup();
  for (const name of [
    '<script>alert(1)</script>',
    'test@example.invalid',
    'A'.repeat(61),
    '',
  ]) {
    page.api.rememberAccepted(name, '/success');
    assert.equal(page.storage.size, 0);
  }
  page.api.rememberAccepted('Test', '/success?name=Test');
  assert.equal(page.storage.size, 0);
});

test('blocked storage is optional and never breaks the generic page', () => {
  const page = setup(true);
  const heading = page.heading();
  assert.doesNotThrow(() =>
    page.api.rememberAccepted('Test Person', '/success'),
  );
  assert.doesNotThrow(() => page.api.render());
  assert.equal(heading.textContent, 'Thank you!');
});

test('navigation clears departing DOM, rehydrates current heading and binds once', () => {
  const page = setup();
  page.api.rememberAccepted('Test Person', '/success');
  const old = page.heading();
  page.event('astro:page-load');
  assert.equal(old.textContent, 'Thank you, Test!');
  page.event('astro:before-swap');
  assert.equal(old.textContent, 'Thank you!');
  const next = page.heading();
  page.event('astro:page-load');
  page.reloadScript();
  assert.equal(next.textContent, 'Thank you, Test!');
  assert.equal(page.listeners('astro:page-load'), 1);
  page.event('pagehide');
  assert.equal(next.textContent, 'Thank you!');
  page.advance(600001);
  page.event('pageshow');
  assert.equal(next.textContent, 'Thank you!');
});
