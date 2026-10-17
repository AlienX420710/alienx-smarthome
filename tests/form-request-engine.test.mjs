import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function boundary(json = false, overrides = {}) {
  const exports = {};
  const calls = { limiter: 0, verify: 0, next: 0 };
  const source = ['form-engine.ts', 'form-request-engine.ts']
    .map((file) =>
      readFileSync(new URL('../src/' + file, import.meta.url), 'utf8').replace(
        /^import [\s\S]*?;\r?\n/gm,
        '',
      ),
    )
    .join('\n');
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      exports,
      Response,
      Headers,
      URL,
      crypto,
      TextDecoder,
      TextEncoder,
      Uint8Array,
      URLSearchParams,
      AbortSignal,
      secure: (response) => response,
      console: { error() {} },
      fetch: async () => {
        calls.verify++;
        return Response.json({
          success: true,
          hostname: 'example.test',
          action: 'contact',
        });
      },
    },
  );
  const errors = Object.fromEntries(
    [
      'retry',
      'media',
      'origin',
      'size',
      'parse',
      'configuration',
      'trap',
      'token',
      'expired',
      'failed',
      'verificationUnavailable',
    ].map((key) => [key, { error: key }]),
  );
  const handler = exports.createFormRequestMiddleware({
    endpoint: '/api/form',
    requestPrefix: 'TEST-',
    limiterPrefix: 'form:',
    limited: { error: 'limited' },
    unavailable: { error: 'unavailable' },
    protection: () => ({
      limiter: {
        limit: async () => {
          calls.limiter++;
          return { success: true };
        },
      },
      secret: 'test',
      hostnames: ' EXAMPLE.TEST ',
    }),
    ...(json
      ? {
          json: {
            maxBytes: 100,
            action: 'contact',
            tokenField: 'token',
            trapField: 'trap',
            retryHeader: 'Idempotency-Key',
            errors,
            verified: (locals, payload, requestId) => {
              locals.verified = { payload, requestId };
            },
          },
        }
      : {}),
    ...overrides,
  });
  return {
    calls,
    async send(body, headers = {}, method = 'POST') {
      const locals = {};
      const request = new Request('https://example.test/api/form/', {
        method,
        ...(method === 'POST' ? { body } : {}),
        headers: { 'content-type': 'application/json', ...headers },
      });
      const response = await handler({ request, locals }, async () => {
        calls.next++;
        return new Response('next');
      });
      return { response, locals, request };
    },
  };
}

test('form transport remains unread for route validation; only limiter runs', async () => {
  const h = boundary();
  const { response, request } = await h.send('not JSON', {
    'content-type': 'multipart/form-data; boundary=test',
  });
  assert.equal(response.status, 200);
  assert.equal(request.bodyUsed, false);
  assert.deepEqual(h.calls, { limiter: 1, verify: 0, next: 1 });
});

test('JSON protection normalizes configured hostnames and passes only verified locals', async () => {
  const h = boundary(true);
  const { response, locals } = await h.send('{"token":"ok","trap":""}');
  assert.equal(response.status, 200);
  assert.equal(locals.verified.payload.token, '');
  assert.match(locals.verified.requestId, /^TEST-[A-F0-9]{32}$/);
  assert.deepEqual(h.calls, { limiter: 1, verify: 1, next: 1 });
});

for (const [name, body, headers, status] of [
  ['malformed', '[]', {}, 400],
  ['oversized stream', 'x'.repeat(101), {}, 413],
  ['origin', '{}', { origin: 'https://other.test' }, 403],
  ['media', '{}', { 'content-type': 'text/plain' }, 415],
  ['retry key', '{}', { 'Idempotency-Key': 'malformed' }, 400],
])
  test(`JSON ${name} rejects before limiter, verification and route`, async () => {
    const h = boundary(true);
    const { response, locals } = await h.send(body, headers);
    assert.equal(response.status, status);
    assert.equal(locals.verified, undefined);
    assert.deepEqual(h.calls, { limiter: 0, verify: 0, next: 0 });
  });

test('populated JSON trap rejects before challenge and route', async () => {
  const h = boundary(true);
  const { response } = await h.send('{"token":"ok","trap":" "}');
  assert.equal(response.status, 403);
  assert.deepEqual(h.calls, { limiter: 1, verify: 0, next: 0 });
});

test('missing or malformed mandatory limiter fails closed', async () => {
  for (const limiter of [undefined, {}, { limit: 1 }]) {
    const h = boundary(true, { protection: () => ({ limiter }) });
    const { response, locals } = await h.send('{"token":"ok"}');
    assert.equal(response.status, 503);
    assert.equal(locals.verified, undefined);
    assert.equal(h.calls.verify, 0);
    assert.equal(h.calls.next, 0);
  }
});
