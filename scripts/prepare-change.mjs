import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  lstatSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8' });

// Include unstaged, staged and new files, but not ignored build output. Never stage files.
export function sourceFingerprint(cwd) {
  const paths = [
    ...new Set(
      git(cwd, ['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
        .split('\0')
        .filter(Boolean),
    ),
  ].sort();
  const hash = createHash('sha256');
  for (const path of paths) {
    const absolute = resolve(cwd, path);
    let stat;
    try {
      stat = lstatSync(absolute);
    } catch (error) {
      if (error.code === 'ENOENT') continue; // A deletion is part of the candidate tree.
      throw error;
    }
    if (!stat.isFile() && !stat.isSymbolicLink())
      throw Error('Unsupported source entry');
    const mode = stat.isSymbolicLink()
      ? '120000'
      : stat.mode & 0o111
        ? '100755'
        : '100644';
    const bytes = stat.isSymbolicLink()
      ? Buffer.from(readlinkSync(absolute))
      : readFileSync(absolute);
    hash.update(JSON.stringify([path, mode, bytes.length]) + '\0');
    hash.update(bytes);
  }
  return hash.digest('hex');
}

export function commitFingerprint(cwd, revision) {
  if (!/^[a-f0-9]{40}$/.test(revision))
    throw Error('Expected a full commit SHA');
  const entries = git(cwd, ['ls-tree', '-rz', '--full-tree', revision])
    .split('\0')
    .filter(Boolean)
    .map((entry) => {
      const tab = entry.indexOf('\t');
      const [mode, type, oid] = entry.slice(0, tab).split(' ');
      if (type !== 'blob') throw Error('Unsupported committed source entry');
      return { path: entry.slice(tab + 1), mode, oid };
    })
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const hash = createHash('sha256');
  for (const { path, mode, oid } of entries) {
    const bytes = execFileSync('git', ['cat-file', 'blob', oid], {
      cwd,
      maxBuffer: 128 * 1024 * 1024,
    });
    hash.update(JSON.stringify([path, mode, bytes.length]) + '\0');
    hash.update(bytes);
  }
  return hash.digest('hex');
}

function receiptPath(cwd) {
  return resolve(
    cwd,
    git(cwd, ['rev-parse', '--git-path', 'validated-source.json']).trim(),
  );
}

export function verifyPrepared(cwd, revision) {
  let receipt;
  try {
    receipt = JSON.parse(readFileSync(receiptPath(cwd), 'utf8'));
  } catch {
    throw Error('No successful preparation receipt; run npm run prepare:pr');
  }
  if (
    receipt.version !== 1 ||
    receipt.nodeMajor !== 22 ||
    receipt.fingerprint !== sourceFingerprint(cwd)
  ) {
    throw Error(
      'Source changed after validation; run npm run prepare:pr again',
    );
  }
  if (revision && commitFingerprint(cwd, revision) !== receipt.fingerprint)
    throw Error('Published commit differs from validated source');
  return receipt;
}

export function prepareChange(
  cwd,
  run = (args) => execFileSync('npm', args, { cwd, stdio: 'inherit' }),
) {
  const receipt = receiptPath(cwd);
  // Never leave old passing evidence after an unsuccessful preparation.
  rmSync(receipt, { force: true });
  if (Number(process.versions.node.split('.')[0]) !== 22)
    throw Error('Preparation requires Node 22');
  run(['ci']);
  run(['run', 'format']);
  const fingerprint = sourceFingerprint(cwd);
  run(['run', 'preflight']);
  if (sourceFingerprint(cwd) !== fingerprint)
    throw Error('Source changed during preflight; prepare again');
  const result = {
    version: 1,
    nodeMajor: 22,
    fingerprint,
    validatedAt: new Date().toISOString(),
    baseSha: git(cwd, ['rev-parse', 'HEAD']).trim(),
  };
  writeFileSync(receipt, JSON.stringify(result) + '\n', { mode: 0o600 });
  return result;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const cwd = git(process.cwd(), ['rev-parse', '--show-toplevel']).trim();
    const args = process.argv.slice(2);
    if (args.length && (args.length > 2 || args[0] !== '--verify'))
      throw Error('Usage: prepare-change.mjs [--verify [full-commit-sha]]');
    const result = args.length
      ? verifyPrepared(cwd, args[1])
      : prepareChange(cwd);
    console.log(`Validated source SHA-256: ${result.fingerprint}`);
    console.log(
      'Local preflight only. Exact-head browser CI and production acceptance remain required.',
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
