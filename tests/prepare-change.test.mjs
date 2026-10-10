import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  chmodSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  prepareChange,
  verifyPrepared,
  sourceFingerprint,
} from '../scripts/prepare-change.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'prepare-change-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  git('init');
  writeFileSync(join(root, '.gitignore'), 'dist/\n');
  writeFileSync(join(root, 'source.txt'), 'source');
  git('add', '.');
  git(
    '-c',
    'user.name=Test',
    '-c',
    'user.email=test@example.invalid',
    'commit',
    '-m',
    'fixture',
  );
  return { root, git };
}

test('preparation formats before checking final bytes, without staging changes', (t) => {
  const { root, git } = fixture(t);
  const commands = [];
  const result = prepareChange(root, (args) => {
    commands.push(args.join(' '));
    if (args.join(' ') === 'run format')
      writeFileSync(join(root, 'source.txt'), 'formatted');
  });
  assert.deepEqual(commands, ['ci', 'run format', 'run preflight']);
  assert.equal(verifyPrepared(root).fingerprint, result.fingerprint);
  assert.equal(git('diff', '--cached', '--name-only').toString(), '');
  git('add', '.');
  git(
    '-c',
    'user.name=Test',
    '-c',
    'user.email=test@example.invalid',
    'commit',
    '-m',
    'formatted',
  );
  const sha = git('rev-parse', 'HEAD').toString().trim();
  assert.equal(verifyPrepared(root, sha).fingerprint, result.fingerprint);
  const previous = git('rev-parse', 'HEAD^').toString().trim();
  assert.throws(
    () => verifyPrepared(root, previous),
    /differs from validated source/,
  );
});

test('every publishable source change invalidates evidence, ignored output does not', (t) => {
  const { root } = fixture(t);
  prepareChange(root, () => {});
  mkdirSync(join(root, 'dist'));
  writeFileSync(join(root, 'dist', 'generated'), 'build output');
  verifyPrepared(root);
  for (const path of ['source.txt', 'notes.md', 'package-lock.json']) {
    prepareChange(root, () => {});
    writeFileSync(join(root, path), 'changed');
    assert.throws(() => verifyPrepared(root), /Source changed/);
  }
  prepareChange(root, () => {});
  rmSync(join(root, 'source.txt'));
  assert.throws(() => verifyPrepared(root), /Source changed/);
});

test('failed or source-mutating checks remove old passing evidence', (t) => {
  const { root } = fixture(t);
  for (const failed of ['ci', 'run format', 'run preflight']) {
    prepareChange(root, () => {});
    assert.throws(
      () =>
        prepareChange(root, (args) => {
          if (args.join(' ') === failed) throw Error('failed stage');
        }),
      /failed stage/,
    );
    assert.throws(() => verifyPrepared(root), /No successful/);
  }
  assert.throws(
    () =>
      prepareChange(root, (args) => {
        if (args.join(' ') === 'run preflight')
          writeFileSync(join(root, 'source.txt'), 'concurrent edit');
      }),
    /changed during preflight/,
  );
  assert.throws(() => verifyPrepared(root), /No successful/);
});

test('fingerprint includes modes and symlink targets without reading their contents', (t) => {
  const { root } = fixture(t);
  const original = sourceFingerprint(root);
  chmodSync(join(root, 'source.txt'), 0o755);
  assert.notEqual(sourceFingerprint(root), original);
  symlinkSync('source.txt', join(root, 'link'));
  const linked = sourceFingerprint(root);
  rmSync(join(root, 'link'));
  symlinkSync('missing.txt', join(root, 'link'));
  assert.notEqual(sourceFingerprint(root), linked);
});
