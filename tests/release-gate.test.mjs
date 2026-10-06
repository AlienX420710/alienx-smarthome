import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  required,
  assessRuns,
  classifyApproval,
  getGitHubJson,
} from '../scripts/verify-ci.mjs';
import { site } from '../scripts/site-config.mjs';
const sha = 'a'.repeat(40);

test('GitHub evidence requests support read-only build authentication and reject redirects', async () => {
  for (const token of ['', 'test-only-placeholder']) {
    const result = await getGitHubJson('/git/ref/heads/main', {
      token,
      fetchImpl: async (url, init) => {
        assert.equal(
          url,
          `https://api.github.com/repos/${site.repository}/git/ref/heads/main`,
        );
        assert.equal(
          init.headers.Authorization,
          token ? `Bearer ${token}` : undefined,
        );
        assert.equal(init.redirect, 'error');
        assert.ok(init.signal instanceof AbortSignal);
        return Response.json({ object: { sha } });
      },
    });
    assert.equal(result.object.sha, sha);
  }
});

test('GitHub failures remain blocked with safe, specific diagnostics and no credential exposure', async () => {
  for (const [status, headers, expected] of [
    [403, { 'x-ratelimit-remaining': '0' }, /rate limit reached/],
    [403, { 'retry-after': '60' }, /rate limit reached/],
    [429, {}, /rate limit reached/],
    [403, {}, /denied verification access/],
    [401, {}, /denied verification access/],
    [404, {}, /denied verification access/],
    [500, {}, /could not supply release evidence/],
  ]) {
    for (const token of ['', 'test-only-placeholder']) {
      let calls = 0;
      await assert.rejects(
        getGitHubJson('/actions/runs', {
          token,
          fetchImpl: async () => {
            calls++;
            return new Response('unsafe-provider-detail', { status, headers });
          },
        }),
        (error) => {
          assert.match(error.message, expected);
          assert.match(
            error.message,
            token
              ? /configured \(value withheld\)/
              : /Request was unauthenticated/,
          );
          assert.ok(!error.message.includes('test-only-placeholder'));
          assert.ok(!error.message.includes('unsafe-provider-detail'));
          return true;
        },
      );
      assert.equal(calls, 1);
    }
  }
});

test('GitHub transport and malformed JSON errors do not expose arbitrary details', async () => {
  for (const fetchImpl of [
    async () => {
      throw Error('unsafe-request-detail');
    },
    async () => new Response('unsafe-provider-detail'),
  ]) {
    await assert.rejects(
      getGitHubJson('/actions/runs', { token: '', fetchImpl }),
      (error) => {
        assert.match(error.message, /deployment blocked/);
        assert.ok(!error.message.includes('unsafe-'));
        return true;
      },
    );
  }
});
const passed = () =>
  required.map((file, id) => ({
    id,
    path: `.github/workflows/${file}`,
    head_sha: sha,
    head_branch: 'main',
    event: 'push',
    status: 'completed',
    conclusion: 'success',
  }));
test('final approval fails closed on malformed, incomplete or unsuccessful evidence', () => {
  const checks = assessRuns(passed(), sha);
  assert.equal(classifyApproval(checks), 'approved');
  for (const state of ['missing', 'pending'])
    assert.equal(
      classifyApproval([{ ...checks[0], state }, ...checks.slice(1)]),
      'pending',
    );
  for (const state of [
    'failure',
    'cancelled',
    'skipped',
    'timed_out',
    null,
    'unknown',
  ])
    assert.equal(
      classifyApproval([{ ...checks[0], state }, ...checks.slice(1)]),
      'rejected',
    );
  for (const malformed of [
    null,
    [],
    checks.slice(1),
    [null, ...checks.slice(1)],
    checks.map(() => checks[0]),
  ])
    assert.equal(classifyApproval(malformed), 'rejected');
});
test('release gate accepts only successful required workflows for the exact main push', () => {
  assert.ok(assessRuns(passed(), sha).every((c) => c.state === 'success'));
  for (const change of [
    { head_sha: 'b'.repeat(40) },
    { head_branch: 'other' },
    { event: 'pull_request' },
    { path: '.github/workflows/unrelated.yml' },
  ]) {
    const runs = passed();
    Object.assign(runs[0], change);
    assert.equal(assessRuns(runs, sha)[0].state, 'missing');
  }
});
test('release gate uses the latest run and rejects pending, skipped and failed checks', () => {
  for (const conclusion of ['failure', 'cancelled', 'skipped', 'timed_out']) {
    const runs = passed();
    runs.push({ ...runs[0], id: 100, conclusion });
    assert.equal(assessRuns(runs, sha)[0].state, conclusion);
  }
  const runs = passed();
  runs[0].status = 'in_progress';
  assert.equal(assessRuns(runs, sha)[0].state, 'pending');
});
