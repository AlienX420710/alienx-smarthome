const { test } = require('node:test');
const assert = require('node:assert/strict');

test('release gate requires exact main push evidence and the latest run', async () => {
  const { required, assessRuns } = await import('../scripts/verify-ci.mjs');
  const runs = required.map((file, id) => ({
    id,
    path: `.github/workflows/${file}`,
    head_sha: 'target',
    head_branch: 'main',
    event: 'push',
    status: 'completed',
    conclusion: 'success',
  }));
  assert.ok(
    assessRuns(runs, 'target').every((check) => check.state === 'success'),
  );
  assert.ok(
    assessRuns(runs, 'other').every((check) => check.state === 'missing'),
  );
  const retry = { ...runs[0], id: 100, conclusion: 'failure' };
  assert.equal(assessRuns([...runs, retry], 'target')[0].state, 'failure');
  assert.equal(
    assessRuns([{ ...retry, event: 'pull_request' }], 'target')[0].state,
    'missing',
  );
  assert.equal(
    assessRuns([{ ...retry, head_branch: 'other' }], 'target')[0].state,
    'missing',
  );
  assert.equal(
    assessRuns(
      [{ ...retry, status: 'in_progress', conclusion: null }],
      'target',
    )[0].state,
    'pending',
  );
});

test('release gate parses only exact Git refs', async () => {
  const { approvalRefs, parseRemoteRefs } = await import('../scripts/verify-ci.mjs');
  const approved = 'a'.repeat(40);
  const rejected = 'b'.repeat(40);
  const refs = parseRemoteRefs(
    `${approved}\t${approvalRefs.approved}\n${rejected}\t${approvalRefs.rejected}\n`,
  );

  assert.equal(refs.get(approvalRefs.approved), approved);
  assert.equal(refs.get(approvalRefs.rejected), rejected);
  assert.equal(parseRemoteRefs('').size, 0);
  assert.equal(parseRemoteRefs(`not-a-sha\t${approvalRefs.approved}\n`).size, 0);
});
