const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
// Load the actual handlers with provider bindings replaced; no network or email.
function load(file, extra = {}) {
  const source = fs
    .readFileSync(file, 'utf8')
    .replace(/^import .*;\n/gm, '')
    .replace("await import('cloudflare:workers')", '({env:mockBindings})');
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const context = {
    exports: {},
    Response,
    Request,
    Headers,
    URL,
    URLSearchParams,
    TextDecoder,
    TextEncoder,
    Uint8Array,
    AbortSignal,
    crypto,
    console,
    defineMiddleware: (f) => f,
    ...extra,
  };
  vm.runInNewContext(code, context);
  return context.exports;
}
const valid = {
  consent: true,
  name: 'Test Person',
  email: 'test@example.test',
  contactMethod: 'email',
  projectType: 'other',
  message: 'A local regression test.',
  website: 'test-token',
};
function harness(provider = { id: 'mock-id' }, bindings = {}) {
  let verifies = 0,
    emails = 0;
  const sent = [];
  const middleware = load('src/middleware.ts', {
    mockBindings: {
      TURNSTILE_SECRET: 'test',
      TURNSTILE_HOSTNAMES: 'example.test',
      ...bindings,
    },
    fetch: async () => {
      verifies++;
      return Response.json({
        success: true,
        action: 'contact',
        hostname: 'example.test',
      });
    },
  }).onRequest;
  const endpoint = load('src/pages/api/inquiry.ts', {
    env: { RESEND_API_KEY: 'test' },
    fetch: async (_url, options) => {
      emails++;
      sent.push(options);
      return Response.json(provider);
    },
  }).POST;
  return {
    counts: () => ({ verifies, emails }),
    sent,
    endpoint,
    async send(body, path = '/api/inquiry', headers = {}) {
      const request = new Request('https://example.test' + path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      });
      const locals = {};
      return middleware({ request, locals }, () =>
        endpoint({ request, locals }),
      );
    },
  };
}
for (const path of ['/api/inquiry', '/api/inquiry/']) {
  test(`${path} rejects missing verification and accepts verified inquiries`, async () => {
    const h = harness();
    assert.equal((await h.send({ ...valid, website: '' }, path)).status, 403);
    assert.equal((await h.send(valid, path)).status, 200);
    assert.deepEqual(h.counts(), { verifies: 1, emails: 1 });
  });
}
for (const body of ['null', '[]', 'true', '"string"', '{']) {
  test(`invalid JSON shape ${body} fails before provider calls`, async () => {
    const h = harness();
    assert.equal((await h.send(body)).status, 400);
    assert.deepEqual(h.counts(), { verifies: 0, emails: 0 });
  });
}
test('size, origin, content type and honeypot checks precede providers', async () => {
  const h = harness();
  assert.equal(
    (await h.send({ ...valid, message: 'x'.repeat(17000) })).status,
    413,
  );
  assert.equal(
    (await h.send(valid, undefined, { origin: 'https://other.test' })).status,
    403,
  );
  assert.equal(
    (await h.send(valid, undefined, { 'content-type': 'text/plain' })).status,
    415,
  );
  assert.equal((await h.send({ ...valid, faxNumber: 'bot' })).status, 403);
  assert.deepEqual(h.counts(), { verifies: 0, emails: 0 });
});
test('provider retry key and email body stay stable across retries', async () => {
  const h = harness();
  const headers = { 'Idempotency-Key': '12345678-1234-4123-8123-123456789abc' };
  await h.send(valid, undefined, headers);
  await h.send({ ...valid, website: 'fresh-token' }, undefined, headers);
  assert.equal(
    h.sent[0].headers['Idempotency-Key'],
    h.sent[1].headers['Idempotency-Key'],
  );
  assert.equal(h.sent[0].body, h.sent[1].body);
  await h.send(
    { ...valid, message: 'A different valid inquiry.' },
    undefined,
    headers,
  );
  assert.notEqual(
    h.sent[0].headers['Idempotency-Key'],
    h.sent[2].headers['Idempotency-Key'],
  );
});
test('edge limiter rejection and outage fail closed before providers', async () => {
  for (const [limit, expected] of [
    [async () => ({ success: false }), 429],
    [
      async () => {
        throw Error('Unavailable');
      },
      503,
    ],
  ]) {
    const h = harness(undefined, { INQUIRY_RATE_LIMITER: { limit } });
    assert.equal((await h.send(valid)).status, expected);
    assert.deepEqual(h.counts(), { verifies: 0, emails: 0 });
  }
});
test('retry key shape is bounded and validated', async () => {
  const h = harness();
  assert.equal(
    (await h.send(valid, undefined, { 'Idempotency-Key': 'bad' })).status,
    400,
  );
  assert.deepEqual(h.counts(), { verifies: 0, emails: 0 });
});
test('endpoint fails closed without middleware locals', async () => {
  const h = harness();
  assert.equal((await h.endpoint({ locals: {} })).status, 403);
  assert.equal(h.counts().emails, 0);
});
test('punctuation-only phone rejected without sending email', async () => {
  const h = harness();
  assert.equal(
    (await h.send({ ...valid, phone: '---', contactMethod: 'phone' })).status,
    400,
  );
  assert.equal(h.counts().emails, 0);
});
test('null provider response is a controlled failure', async () => {
  assert.equal((await harness(null).send(valid)).status, 502);
});
test('rate limit blocks the ninth attempt', async () => {
  const h = harness();
  for (let i = 0; i < 8; i++)
    assert.equal((await h.send({ ...valid, website: '' })).status, 403);
  assert.equal((await h.send(valid)).status, 429);
  assert.deepEqual(h.counts(), { verifies: 0, emails: 0 });
});
