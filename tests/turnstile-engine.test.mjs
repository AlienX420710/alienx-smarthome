import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(
  new URL('../public/turnstile-engine.js', import.meta.url),
  'utf8',
);
function setup() {
  let node = { dataset: { sitekey: 'public-key' } };
  const events = {};
  const calls = { render: [], remove: [], reset: [], callbacks: [] };
  const window = {
    turnstile: {
      render(el, options) {
        calls.render.push({ el, options });
        return calls.render.length - 1;
      },
      remove(id) {
        calls.remove.push(id);
      },
      reset(id) {
        calls.reset.push(id);
      },
    },
  };
  const context = vm.createContext({
    window,
    document: {
      querySelector: () => node,
      addEventListener(name, fn) {
        (events[name] ??= []).push(fn);
      },
    },
  });
  vm.runInContext(source, context);
  const widget = window.createSiteTurnstile('#widget', () => ({
    action: 'quote',
    size: 'compact',
    'response-field-name': 'token',
    callback: () => calls.callbacks.push('success'),
    'expired-callback': () => calls.callbacks.push('expired'),
    'error-callback': () => calls.callbacks.push('error'),
  }));
  return {
    window,
    context,
    calls,
    widget,
    events,
    setNode(value) {
      node = value;
    },
    fire(name) {
      for (const fn of events[name] || []) fn();
    },
  };
}

test('duplicate scripts and provider callbacks reuse one widget, including zero ID', () => {
  const page = setup();
  page.widget.render();
  vm.runInContext(source, page.context);
  assert.equal(
    page.window.createSiteTurnstile('#widget', () => {
      throw Error('duplicate');
    }),
    page.widget,
  );
  page.widget.render();
  page.fire('astro:page-load');
  assert.equal(page.calls.render.length, 1);
  assert.equal(page.events['astro:before-swap'].length, 1);
  const options = page.calls.render[0].options;
  assert.equal(options.sitekey, 'public-key');
  assert.equal(options.action, 'quote');
  assert.equal(options['response-field-name'], 'token');
  assert.equal(options['refresh-expired'], 'auto');
  assert.equal(options['refresh-timeout'], 'auto');
  page.widget.reset();
  assert.deepEqual(page.calls.reset, [0]);
});

test('swaps dispose the old challenge and ignore its late callbacks', () => {
  const page = setup();
  page.widget.render();
  const old = page.calls.render[0].options;
  old.callback();
  page.fire('astro:before-swap');
  old.callback();
  old['expired-callback']();
  old['error-callback']();
  assert.deepEqual(page.calls.callbacks, ['success']);
  assert.deepEqual(page.calls.remove, [0]);
  page.widget.reset();
  assert.deepEqual(page.calls.reset, []);
  page.setNode({ dataset: { sitekey: 'next-key' } });
  page.fire('astro:page-load');
  page.calls.render[1].options['expired-callback']();
  assert.deepEqual(page.calls.callbacks, ['success', 'expired']);
  page.setNode(null);
  page.fire('astro:page-load');
  assert.deepEqual(page.calls.remove, [0, 1]);
});

test('provider absence and exceptions leave lifecycle retryable', () => {
  const page = setup();
  const provider = page.window.turnstile;
  delete page.window.turnstile;
  page.widget.render();
  assert.equal(page.calls.render.length, 0);
  page.window.turnstile = provider;
  const render = provider.render;
  provider.render = () => {
    throw Error('provider unavailable');
  };
  page.widget.render();
  assert.deepEqual(page.calls.callbacks, ['error']);
  provider.render = render;
  page.widget.render();
  provider.reset = provider.remove = () => {
    throw Error('detached widget');
  };
  assert.doesNotThrow(() => page.widget.reset());
  assert.doesNotThrow(() => page.fire('astro:before-swap'));
  page.widget.render();
  assert.equal(page.calls.render.length, 2);
});
