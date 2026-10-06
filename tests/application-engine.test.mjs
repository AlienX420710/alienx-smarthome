import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const site = JSON.parse(
  readFileSync(new URL('../engineering.config.json', import.meta.url), 'utf8'),
);
function load(name, globals = {}) {
  const exports = {};
  const source = readFileSync(
    new URL(`../src/${name}.ts`, import.meta.url),
    'utf8',
  );
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
      Request,
      Headers,
      TextEncoder,
      Uint8Array,
      URLSearchParams,
      AbortSignal,
      crypto,
      fetch: () => {
        throw Error('Unexpected network call');
      },
      require: (specifier) => {
        if (specifier === 'cloudflare:workers')
          return { env: globals.bindings };
        if (specifier.endsWith('engineering.config.json'))
          return { __esModule: true, default: site };
        if (specifier.endsWith('release.json'))
          return { __esModule: true, default: { revision: 'test-revision' } };
        return load(
          specifier.replace(/^\.\.\/\.\.\//, '').replace(/^\.\//, ''),
          globals,
        );
      },
      ...globals,
    },
  );
  return exports;
}

test('actual status routes fail closed without provider calls and enforce methods/privacy', async () => {
  const bindings = {
    TURNSTILE_SECRET: 'fixture',
    TURNSTILE_HOSTNAMES: 'example.test',
    RESEND_API_KEY: 'fixture',
    [site.status.limiterBinding]: {
      limit() {
        throw Error('Status must not invoke limiter');
      },
    },
  };
  for (const change of [
    {},
    { TURNSTILE_SECRET: ' ' },
    { TURNSTILE_HOSTNAMES: ' , ' },
    { RESEND_API_KEY: ' ' },
    { [site.status.limiterBinding]: {} },
    { [site.status.limiterBinding]: { limit: true } },
  ]) {
    const api = load('pages/api/status', {
      bindings: { ...bindings, ...change },
    });
    const request = new Request('https://example.test/api/status');
    const get = await api.GET({ request });
    const head = await api.HEAD({ request });
    assert.equal(get.status, Object.keys(change).length ? 503 : 200);
    assert.equal(head.status, get.status);
    assert.equal(await head.text(), '');
    const body = await get.json();
    assert.equal(body.ok, get.status === 200);
    assert.equal('buildRevision' in body, !site.privateStatus);
    assert.equal('requestId' in body, !site.privateStatus);
    assert.ok(!JSON.stringify(body).includes('fixture'));
    const denied = await api.ALL({ request });
    assert.equal(denied.status, 405);
    assert.equal(denied.headers.get('allow'), 'GET, HEAD');
    const { secure } = load('security');
    for (const response of [get, head, denied]) {
      // Recreate a response after consuming its body to test middleware headers.
      const secured = secure(
        new Response(null, {
          status: response.status,
          headers: response.headers,
        }),
      );
      assert.match(secured.headers.get('cache-control'), /no-store/);
      assert.equal(secured.headers.get('referrer-policy'), 'no-referrer');
      assert.match(
        secured.headers.get('content-security-policy'),
        /default-src 'none'/,
      );
    }
  }
});

test('mail fixes production identity, trims credentials and preserves permitted confirmation policy', async () => {
  const calls = [];
  const timeouts = [];
  const { sendMail, sendProductionMail } = load('mail', {
    AbortSignal: {
      timeout: (ms) => {
        timeouts.push(ms);
        return undefined;
      },
    },
    fetch: async (url, init) => {
      calls.push({ url, ...init });
      return Response.json({ id: 'fixture' });
    },
  });
  assert.throws(
    () => sendMail(' ', 'key', { subject: 'Fixture' }),
    /credential/,
  );
  await sendProductionMail(' token ', 'stable', {
    subject: 'Fixture',
    from: 'attacker@example.test',
    to: ['attacker@example.test'],
  });
  await sendMail('token', 'confirmation', {
    subject: 'Fixture',
    to: ['customer@example.test'],
  });
  const production = JSON.parse(calls[0].body);
  assert.equal(production.from, site.mail.sender);
  assert.deepEqual(production.to, [site.mail.recipient]);
  assert.deepEqual(JSON.parse(calls[1].body).to, [
    site.mail.customerConfirmation
      ? 'customer@example.test'
      : site.mail.recipient,
  ]);
  assert.equal(calls[0].headers.Authorization, 'Bearer token');
  assert.equal(calls[0].headers['Idempotency-Key'], 'stable');
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.equal('redirect' in calls[0], false);
  assert.deepEqual(timeouts, [site.mail.timeoutMs, site.mail.timeoutMs]);
});

test('bounded body releases the reader on success, oversize and stream failures', async () => {
  const { readBoundedBody } = load('form-engine');
  for (const mode of ['ok', 'oversize', 'read-failure', 'cancel-failure']) {
    let count = 0,
      cancelled = 0,
      released = 0;
    const reader = {
      read: async () => {
        if (mode === 'read-failure') throw Error('stream');
        return ++count === 1
          ? { done: false, value: new Uint8Array(mode === 'ok' ? 3 : 5) }
          : { done: true };
      },
      cancel: async () => {
        cancelled++;
        if (mode === 'cancel-failure') throw Error('cleanup');
      },
      releaseLock: () => {
        released++;
      },
    };
    const result = readBoundedBody({ body: { getReader: () => reader } }, 4);
    if (mode === 'read-failure') await assert.rejects(result, /stream/);
    else if (mode === 'ok') assert.equal((await result).byteLength, 3);
    else assert.equal(await result, null);
    assert.equal(released, 1);
    assert.equal(
      cancelled,
      mode === 'oversize' || mode === 'cancel-failure' ? 1 : 0,
    );
  }
});

test('local limiter never evicts active clients at capacity and expires windows', () => {
  const { createAttemptLimiter } = load('form-engine');
  const attempt = createAttemptLimiter(2, 2, 100);
  assert.equal(attempt('a', 0), 'allowed');
  assert.equal(attempt('a', 1), 'allowed');
  assert.equal(attempt('a', 2), 'limited');
  assert.equal(attempt('b', 2), 'allowed');
  assert.equal(attempt('c', 3), 'capacity');
  assert.equal(attempt('a', 4), 'limited');
  assert.equal(attempt('c', 102), 'allowed');
  assert.equal(attempt('a', 102), 'allowed');
});

test('shared challenge verification rejects invalid provider types and binds hostname/action', async () => {
  for (const [result, expected] of [
    [{ success: true, hostname: 'example.test', action: 'form' }, 'passed'],
    [{ success: 'true', hostname: 'example.test', action: 'form' }, 'failed'],
    [{ success: true, hostname: 'evil.test', action: 'form' }, 'failed'],
    [{ success: true, hostname: 'example.test', action: 'other' }, 'failed'],
    [null, 'failed'],
    [{ 'error-codes': ['timeout-or-duplicate'] }, 'expired'],
  ]) {
    const { verifyChallenge } = load('form-engine', {
      fetch: async () => Response.json(result),
    });
    assert.equal(
      await verifyChallenge(
        'secret',
        'token',
        new Set(['example.test']),
        'form',
      ),
      expected,
    );
  }
  const { verifyChallenge } = load('form-engine', {
    fetch: async () => {
      throw Error('private');
    },
  });
  assert.equal(
    await verifyChallenge('secret', 'token', new Set(['example.test']), 'form'),
    'unavailable',
  );
});
