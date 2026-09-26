const test = require('node:test');
const assert = require('node:assert/strict');
const sha = 'a'.repeat(40);
const analysis = (language, id = 1) => ({
  id,
  category: `/language:${language}`,
  ref: 'refs/heads/main',
  commit_sha: sha,
  error: '',
  results_count: 0,
  tool: { name: 'CodeQL' },
});
test('code-scanning policy requires both fresh language analyses', async () => {
  const { assessAnalyses } =
    await import('../scripts/verify-code-scanning.mjs');
  const valid = [analysis('actions'), analysis('javascript-typescript', 2)];
  assert.equal(assessAnalyses(valid, sha).ready, true);
  assert.equal(assessAnalyses(valid.slice(1), sha).ready, false);
  assert.equal(assessAnalyses(valid, 'b'.repeat(40)).ready, false);
  assert.equal(
    assessAnalyses(
      valid.map((a) => ({ ...a, ref: 'refs/pull/38/head' })),
      sha,
    ).ready,
    false,
  );
  assert.throws(() => assessAnalyses({}, sha));
  assert.throws(() =>
    assessAnalyses([{ ...valid[0], error: 'analysis failed' }], sha),
  );
  assert.throws(() =>
    assessAnalyses([{ ...valid[0], results_count: undefined }], sha),
  );
  assert.throws(() =>
    assessAnalyses(
      [...valid, { ...analysis('actions', 3), error: 'newer failure' }],
      sha,
    ),
  );
});
test('any open alert blocks approval regardless of severity or original revision', async () => {
  const { assertNoOpenAlerts } =
    await import('../scripts/verify-code-scanning.mjs');
  assert.doesNotThrow(() => assertNoOpenAlerts([]));
  assert.throws(() =>
    assertNoOpenAlerts([
      { number: 4, state: 'open', rule: { severity: 'note' } },
    ]),
  );
  assert.throws(() => assertNoOpenAlerts({}));
});
test('API failures and a changed main fail closed; token is never forwarded to redirects', async () => {
  const { verifyCodeScanning } =
    await import('../scripts/verify-code-scanning.mjs');
  await assert.rejects(
    verifyCodeScanning({
      sha,
      token: 'fixture',
      fetcher: async (_url, options) => {
        assert.equal(options.redirect, 'error');
        return { ok: false, status: 403 };
      },
    }),
    /HTTP 403/,
  );
  await assert.rejects(
    verifyCodeScanning({
      sha,
      token: 'fixture',
      fetcher: async () => ({
        ok: true,
        json: async () => ({ object: { sha: 'b'.repeat(40) } }),
      }),
    }),
    /Main changed/,
  );
});
test('missing scans time out; old successful scans cannot satisfy the gate', async () => {
  const { verifyCodeScanning } =
    await import('../scripts/verify-code-scanning.mjs');
  let clock = 0;
  await assert.rejects(
    verifyCodeScanning({
      sha,
      token: 'fixture',
      now: () => clock,
      wait: async (ms) => {
        assert.equal(ms, 10000);
        clock += 600000;
      },
      fetcher: async (url) => ({
        ok: true,
        json: async () =>
          url.includes('/git/ref/') ? { object: { sha } } : [],
      }),
    }),
    /Missing exact-revision/,
  );
});

test('fresh analyses still require complete alert pagination and a final main check', async () => {
  const { verifyCodeScanning } =
    await import('../scripts/verify-code-scanning.mjs');
  let mainReads = 0;
  const fetcher = async (url) => ({
    ok: true,
    json: async () => {
      if (url.includes('/git/ref/')) {
        mainReads++;
        return { object: { sha } };
      }
      if (url.includes('/analyses?'))
        return [analysis('actions'), analysis('javascript-typescript', 2)];
      assert.ok(url.includes('state=open'));
      assert.ok(url.includes('ref=refs%2Fheads%2Fmain'));
      return [];
    },
  });
  await verifyCodeScanning({ sha, token: 'fixture', fetcher });
  assert.equal(mainReads, 2);
  let alertPages = 0;
  await assert.rejects(
    verifyCodeScanning({
      sha,
      token: 'fixture',
      fetcher: async (url) => {
        if (!url.includes('/alerts?')) return fetcher(url);
        alertPages++;
        return {
          ok: true,
          json: async () =>
            alertPages === 1
              ? Array.from({ length: 100 }, (_, i) => ({
                  number: i,
                  state: 'open',
                }))
              : [{ number: 101, state: 'open' }],
        };
      },
    }),
    /101 open alerts/,
  );
  assert.equal(alertPages, 2);
});
