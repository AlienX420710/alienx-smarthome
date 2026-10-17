import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function page(fetch, timers = { setTimeout, clearTimeout }) {
  const events = {};
  const handlers = {};
  const errors = new Map();
  let destination;
  let remembered = 0;
  let reset = 0;
  let retry = 'same';
  const attributes = {};
  const field = {
    focused: false,
    name: 'name',
    getAttribute: (name) => attributes[name],
    setAttribute: (name, value) => {
      attributes[name] = value;
    },
    removeAttribute: (name) => {
      delete attributes[name];
    },
    focus: () => {
      field.focused = true;
    },
    closest: () => ({ append: (error) => errors.set(error.id, error) }),
  };
  const form = {
    dataset: {},
    isConnected: true,
    action: '/test',
    querySelector: () => null,
    querySelectorAll: (selector) =>
      selector === 'input,select,textarea' || selector === '[name="name"]'
        ? [field]
        : [],
    addEventListener: (name, callback) => {
      handlers[name] = callback;
    },
  };
  const button = { disabled: false, textContent: 'Send' };
  const status = { focus() {} };
  const window = {
    addEventListener: (name, callback) => {
      events[name] = callback;
    },
    ...timers,
    siteConfirmation: {
      clear() {},
      rememberAccepted() {
        remembered++;
      },
    },
    location: {
      assign: (url) => {
        destination = url;
      },
    },
  };
  vm.runInNewContext(
    readFileSync(
      new URL('../public/form-client-engine.js', import.meta.url),
      'utf8',
    ),
    {
      window,
      document: {
        addEventListener: (name, callback) => {
          events[name] = callback;
        },
        getElementById: (id) => errors.get(id),
        createElement: () => ({
          remove() {
            errors.delete(this.id);
          },
        }),
      },
      fetch,
      AbortController,
      Error,
      FormData: class {
        get() {
          return 'Test';
        }
      },
    },
  );
  const options = {
    form,
    button,
    status,
    fields: ['name'],
    destination: '/success',
    timeoutMessage: 'Timed out',
    failureMessage: 'Failed',
    resetChallenge: () => {
      reset++;
    },
    renewRetry: () => {
      retry = 'changed';
    },
    renewAcceptedRetry: () => {
      retry = 'accepted-again';
    },
    responseError: (body) => body.error,
    prepare: () => ({ body: retry }),
  };
  window.createSiteFormClient(options);
  return {
    events,
    handlers,
    errors,
    field,
    attributes,
    form,
    button,
    status,
    options,
    window,
    submit: () => handlers.submit({ preventDefault() {} }),
    outcome: () => ({ destination, remembered, reset, retry }),
  };
}

test('retries retain request identity, edits renew it, and accepted Back restores a fresh identity', async () => {
  const bodies = [];
  let success = false;
  const p = page(async (_, options) => {
    bodies.push(options.body);
    return Response.json(success ? { ok: true } : { error: 'Retry' }, {
      status: success ? 200 : 502,
    });
  });
  await p.submit();
  await p.submit();
  assert.deepEqual(bodies, ['same', 'same']);
  p.handlers.input({ target: p.field });
  success = true;
  await p.submit();
  assert.equal(bodies[2], 'changed');
  assert.equal(p.outcome().destination, '/success');
  p.events.pageshow({ persisted: true });
  assert.equal(p.outcome().retry, 'accepted-again');
  assert.equal(p.button.disabled, false);
});

test('departed or swapped forms ignore late accepted responses and clear their timers', async () => {
  for (const lifecycle of ['pagehide', 'astro:before-swap']) {
    let finish;
    let cleared = 0;
    const p = page(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
      {
        setTimeout: () => 1,
        clearTimeout: () => {
          cleared++;
        },
      },
    );
    const pending = p.submit();
    p.events[lifecycle]();
    finish(Response.json({ ok: true }));
    await pending;
    assert.equal(p.outcome().destination, undefined);
    assert.equal(p.outcome().remembered, 0);
    assert.equal(cleared, 1);
  }
});

test('server field messages are text, bounded, described and cleared on correction', async () => {
  const p = page(async () =>
    Response.json(
      {
        error: 'Fix name',
        fieldErrors: { name: '<img>'.repeat(100), malicious: 'Ignore' },
      },
      { status: 400 },
    ),
  );
  await p.submit();
  assert.equal(p.field.focused, true);
  assert.equal(p.attributes['aria-invalid'], 'true');
  assert.equal(p.errors.get('error-name').textContent.length, 300);
  assert.equal(p.errors.size, 1);
  p.handlers.change({ target: p.field });
  assert.equal(p.errors.size, 0);
  assert.equal(p.attributes['aria-describedby'], undefined);
});

test('timeouts recover independent of browser abort wording, without name storage', async () => {
  const p = page(
    async (_, { signal }) =>
      new Promise((_, reject) =>
        signal.addEventListener('abort', () =>
          reject(new Error('Fetch is aborted')),
        ),
      ),
    {
      setTimeout: (callback) => {
        queueMicrotask(callback);
        return 1;
      },
      clearTimeout() {},
    },
  );
  await p.submit();
  assert.equal(p.status.textContent, 'Timed out');
  assert.equal(p.outcome().reset, 1);
  assert.equal(p.outcome().remembered, 0);
  assert.equal(p.button.disabled, false);
});

test('duplicate initialization and in-flight submit cannot send duplicate requests', async () => {
  let requests = 0;
  let finish;
  const p = page(() => {
    requests++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  assert.equal(p.window.createSiteFormClient(p.options), undefined);
  const pending = p.submit();
  await p.submit();
  assert.equal(requests, 1);
  finish(Response.json({ ok: true }));
  await pending;
});

test('page-load initializer registration stays single across adapter reexecution', () => {
  const p = page(async () => Response.json({ ok: true }));
  let runs = 0;
  p.window.bindSiteFormInitializer('inquiry', () => {
    runs++;
  });
  p.window.bindSiteFormInitializer('inquiry', () => {
    runs += 100;
  });
  assert.equal(runs, 1);
  p.events['astro:page-load']();
  assert.equal(runs, 2);
  let changed;
  p.options.onChange = (event) => {
    changed = event.target.name;
  };
  p.handlers.change({ target: p.field });
  assert.equal(changed, 'name');
});
