import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(
  new URL('../public/navigation.js', import.meta.url),
  'utf8',
);
function events() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    dispatchEvent(event) {
      for (const fn of listeners.get(event.type) ?? []) fn(event);
    },
    count(type) {
      return listeners.get(type)?.size ?? 0;
    },
  };
}
function fixture() {
  const intersections = [],
    resizes = [],
    scrolls = [];
  const current = {};
  const rail = {
    querySelector: () => current,
    scrollBy: (value) => scrolls.push(value),
  };
  const document = {
    ...events(),
    fonts: { ...events(), ready: Promise.resolve() },
    querySelector: () => rail,
  };
  const window = events();
  class Element {
    closest() {
      return this.trigger;
    }
  }
  const context = vm.createContext({
    document,
    window,
    Element,
    KeyboardEvent: class {
      constructor(type, options) {
        Object.assign(this, { type }, options);
      }
    },
    IntersectionObserver: class {
      constructor(callback) {
        this.callback = callback;
        this.disconnected = 0;
        this.observed = 0;
        intersections.push(this);
      }
      disconnect() {
        this.disconnected++;
      }
      observe() {
        this.observed++;
      }
    },
    ResizeObserver: class {
      constructor(callback) {
        this.callback = callback;
        this.disconnected = 0;
        resizes.push(this);
      }
      observe() {}
      disconnect() {
        this.disconnected++;
      }
    },
  });
  const run = () => vm.runInContext(source, context);
  run();
  return { document, window, Element, intersections, resizes, scrolls, run };
}
const clipped = {
  intersectionRatio: 0.2,
  rootBounds: { left: 0, width: 100 },
  boundingClientRect: { left: 110, width: 40 },
};

test('navigation reveals only its rail and does not retain an observer that fights manual scrolling', async () => {
  const f = fixture();
  await Promise.resolve();
  const observer = f.intersections[0];
  const before = observer.disconnected;
  observer.callback([clipped]);
  assert.equal(observer.disconnected, before + 1);
  assert.equal(f.scrolls.length, 1);
  assert.equal(f.scrolls[0].left, 80);
  assert.equal(f.scrolls[0].behavior, 'auto');
  observer.callback([{ ...clipped, intersectionRatio: 1 }]);
  assert.equal(f.scrolls.length, 1);
  const observed = observer.observed;
  f.document.fonts.dispatchEvent({ type: 'loadingdone' });
  f.resizes[0].callback();
  assert.equal(observer.observed, observed + 2);
});

test('navigation binds once and cleans old observers/listeners across swaps', async () => {
  const f = fixture();
  f.run();
  assert.equal(f.document.count('click'), 1);
  assert.equal(f.intersections.length, 1);
  f.document.dispatchEvent({ type: 'astro:before-swap' });
  await Promise.resolve();
  f.intersections[0].callback([clipped]);
  assert.equal(f.scrolls.length, 0);
  assert.equal(f.resizes[0].disconnected, 1);
  assert.equal(f.document.fonts.count('loadingdone'), 0);
  f.document.dispatchEvent({ type: 'astro:page-load' });
  assert.equal(f.intersections.length, 2);
  assert.equal(f.document.fonts.count('loadingdone'), 1);
  f.window.dispatchEvent({ type: 'pageshow' });
  assert.equal(f.resizes[1].disconnected, 1);
  assert.equal(f.document.fonts.count('loadingdone'), 1);
});

test('command triggers preserve opener focus without scrolling and dispatch once', () => {
  const f = fixture();
  let focused = 0,
    opened = 0;
  const target = new f.Element();
  target.trigger = {
    focus(options) {
      assert.equal(options.preventScroll, true);
      focused++;
    },
  };
  f.document.addEventListener('keydown', (event) => {
    assert.equal(event.key, 'k');
    assert.equal(event.metaKey, true);
    opened++;
  });
  f.document.dispatchEvent({ type: 'click', target: {} });
  f.document.dispatchEvent({ type: 'click', target });
  assert.equal(focused, 1);
  assert.equal(opened, 1);
});
