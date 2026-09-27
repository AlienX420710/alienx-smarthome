const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { createHash } = require('node:crypto');

test('Cassi inventory covers roots, merges, branch/PR/tag refs and deterministic raw digests', async () => {
  const { inventory } = await import('../scripts/compare-cassi-history.mjs');
  const dir = mkdtempSync(join(tmpdir(), 'cassi-inventory-test-'));
  const git = (...args) =>
    execFileSync('git', ['-C', dir, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
      .toString()
      .trim();
  try {
    git('init', '-b', 'main');
    git('config', 'user.name', 'Fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    const commit = (file, subject) => {
      writeFileSync(join(dir, file), subject + '\n');
      git('add', file);
      git('commit', '-m', subject);
      return git('rev-parse', 'HEAD');
    };
    const root = commit('root.txt', 'root | [label] <tag>');
    git('switch', '-c', 'feature');
    commit('feature.txt', 'feature');
    git('switch', 'main');
    commit('main.txt', 'main');
    git('merge', '--no-ff', 'feature', '-m', 'merge');
    git('switch', '-c', 'unmerged');
    commit('branch.txt', 'branch only');
    git('checkout', '--detach', root);
    const pr = commit('pr.txt', 'PR only');
    git('update-ref', 'refs/pull/1/head', pr);
    git('checkout', '--detach', root);
    const tag = commit('tag.txt', 'tag only');
    git('tag', 'retained', tag);
    git('switch', 'main');
    const report = inventory(join(dir, '.git'), '2026-09-27');
    assert.equal(report, inventory(join(dir, '.git'), '2026-09-27'));
    assert.match(report, /7 unique commits.*4 reachable from main/);
    for (const scope of ['branch-only', 'retained PR ref', 'tag/other ref'])
      assert.ok(report.includes(`| ${scope} |`));
    assert.ok(report.includes('root &#124; &#91;label&#93; &#60;tag&#62;'));
    const patch = execFileSync('git', [
      '-C',
      dir,
      'diff-tree',
      '--root',
      '-r',
      '--no-commit-id',
      '--no-ext-diff',
      '--no-textconv',
      '--no-renames',
      '-p',
      '--full-index',
      '--no-color',
      '--diff-algorithm=myers',
      '--no-indent-heuristic',
      '--src-prefix=a/',
      '--dst-prefix=b/',
      root,
    ]);
    assert.ok(
      report.includes(createHash('sha256').update(patch).digest('hex')),
    );
    writeFileSync(join(dir, '.git', 'shallow'), root + '\n');
    assert.throws(
      () => inventory(join(dir, '.git'), '2026-09-27'),
      /non-shallow/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Cassi inventory sanitizes Git failures and validates date input', async () => {
  const { inventory } = await import('../scripts/compare-cassi-history.mjs');
  assert.throws(
    () => inventory('/nonexistent/cassi-private-fixture', '2026-09-27'),
    /^Error: Reference history read failed; output suppressed$/,
  );
  assert.throws(() => inventory('.', 'invalid'), /YYYY-MM-DD/);
});
