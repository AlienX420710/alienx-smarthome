const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const {
  diagnosticRoutes,
  intercept,
  runDiagnostics,
} = require('../scripts/webkit-diagnostics.cjs');

function route(url, method = 'GET', type = 'document') {
  const calls = [];
  return {
    calls,
    request: () => ({
      url: () => url,
      method: () => method,
      resourceType: () => type,
    }),
    abort: async () => calls.push('abort'),
    continue: async () => calls.push('continue'),
    fulfill: async (data) => calls.push(data),
    fetch: async (options) => {
      calls.push(options);
      return { status: () => 302, body: async () => Buffer.from('redirect') };
    },
  };
}

test('diagnostic routes preserve home and optional public status coverage', () => {
  assert.deepEqual(diagnosticRoutes({ browser: { statusRoute: '/status/' } }), [
    '/',
    '/status/',
  ]);
  assert.deepEqual(diagnosticRoutes({ browser: { statusRoute: null } }), ['/']);
});

test('every diagnostic mode blocks external traffic and local writes', async () => {
  for (const mode of [
    'baseline',
    'without-css',
    'without-js',
    'without-response-headers',
  ]) {
    for (const request of [
      route('https://provider.invalid/'),
      route('http://127.0.0.1:4321.evil.invalid/'),
      route('http://127.0.0.1:4321/api/quote', 'POST'),
    ]) {
      await intercept(request, mode);
      assert.deepEqual(request.calls, ['abort']);
    }
  }
});

test('baseline is unchanged; altered documents never follow redirects', async () => {
  const baseline = route('http://127.0.0.1:4321/');
  await intercept(baseline, 'baseline');
  assert.deepEqual(baseline.calls, ['continue']);
  const document = route('http://127.0.0.1:4321/');
  await intercept(document, 'without-response-headers');
  assert.deepEqual(document.calls[0], { maxRedirects: 0 });
  assert.equal(document.calls[1].status, 302);
  assert.deepEqual(document.calls[1].headers, { 'content-type': 'text/html' });
  for (const [mode, type] of [
    ['without-css', 'stylesheet'],
    ['without-js', 'script'],
  ]) {
    const request = route('http://127.0.0.1:4321/asset', 'GET', type);
    await intercept(request, mode);
    assert.equal(request.calls[0].body, '');
  }
});

test('baseline failure fails diagnostics; altered failures remain observations and evidence is retained', async () => {
  for (const failBaseline of [false, true]) {
    let index = 0;
    let closed = 0;
    let traces = 0;
    let browserClosed = false;
    const output = mkdtempSync(join(tmpdir(), 'webkit-diagnostics-test-'));
    const webkit = {
      launch: async () => ({
        newContext: async (options) => {
          assert.equal(options.serviceWorkers, 'block');
          const modeIndex = index++;
          return {
            tracing: { start: async () => {}, stop: async () => traces++ },
            route: async () => {},
            close: async () => closed++,
            newPage: async () => ({
              on: () => {},
              goto: async () => ({
                ok: () => modeIndex === 0 && !failBaseline,
              }),
              locator: () => ({ count: async () => 1 }),
              screenshot: async () => {},
            }),
          };
        },
        close: async () => {
          browserClosed = true;
        },
      }),
    };
    const result = await runDiagnostics({ webkit, routes: ['/'], output });
    assert.equal(result.passed, !failBaseline);
    assert.equal(result.results.length, 4);
    assert.equal(closed, 4);
    assert.equal(traces, 4);
    assert.equal(browserClosed, true);
    assert.deepEqual(
      JSON.parse(readFileSync(join(output, 'summary.json'), 'utf8')),
      result.results,
    );
  }
});

test('invalid diagnostic destinations are rejected before browser launch', async () => {
  for (const routes of [
    [],
    ['//provider.invalid/'],
    ['https://provider.invalid/'],
  ]) {
    await assert.rejects(
      runDiagnostics({ webkit: {}, routes }),
      /local routes/,
    );
  }
});
