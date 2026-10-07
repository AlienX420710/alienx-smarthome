import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(
  new URL('../scripts/verify-smoke.mjs', import.meta.url),
  'utf8',
).replace(/^import .*;\n/gm, '');
const expected = 'a'.repeat(40);
async function run(finalRevision = expected) {
  const calls = [];
  const site = {
    origin: 'https://example.invalid',
    smoke: {
      markers: { '/': 'Example' },
      statusChecks: [],
      rejectionCode: null,
    },
    privateStatus: false,
    form: {
      endpoint: '/api/inquiry',
      encoding: 'json',
      invalid: { turnstileToken: '' },
    },
  };
  await vm.runInNewContext('(async () => {' + source + '})()', {
    assert,
    site,
    URL,
    URLSearchParams,
    AbortSignal,
    Date: { now: () => 1234 },
    process: { env: { EXPECTED_REVISION: expected } },
    console: { log() {} },
    verifyIntegrity: async (options) =>
      assert.equal(options.expected, expected),
    fetch: async (url, options) => {
      calls.push({ url, options });
      assert.equal(options.cache, 'no-store');
      assert.equal(options.redirect, 'error');
      assert.equal(options.headers['Cache-Control'], 'no-cache, no-store');
      assert.equal(options.headers.Pragma, 'no-cache');
      assert.ok(url.searchParams.has('_smoke'));
      if (options.method === 'POST') {
        assert.equal(options.headers['Content-Type'], 'application/json');
        assert.equal(JSON.parse(options.body).turnstileToken, '');
        return { status: 403, json: async () => ({ error: 'Rejected' }) };
      }
      if (url.pathname === '/api/release')
        return { json: async () => ({ revision: finalRevision }) };
      if (url.pathname === '/api/status')
        return {
          json: async () => ({
            ok: true,
            status: 'operational',
            summary: 'Ready',
            runtime: 'Cloudflare Workers',
            generatedAt: 'now',
          }),
        };
      return {
        ok: true,
        headers: new Headers({ 'Content-Type': 'text/html' }),
        text: async () => 'Example',
      };
    },
  });
  return calls;
}
test('smoke avoids cached responses, preserves rejection probe and uses unique requests', async () => {
  const calls = await run();
  assert.equal(
    new Set(calls.map(({ url }) => url.searchParams.get('_smoke'))).size,
    calls.length,
  );
  assert.equal(
    calls.filter(({ options }) => options.method === 'POST').length,
    1,
  );
  assert.equal(calls.at(-1).url.pathname, '/api/release');
});
test('smoke still rejects a revision change after integrity succeeds', async () => {
  await assert.rejects(run('b'.repeat(40)), /Revision changed during smoke/);
});
