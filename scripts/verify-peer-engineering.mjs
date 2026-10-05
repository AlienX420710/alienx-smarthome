import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const peer = process.argv[2];
if (!peer)
  throw new Error('Usage: npm run verify:peer -- /path/to/peer-checkout');
const read = (directory, file) =>
  readFileSync(resolve(directory, file), 'utf8');
const files = [
  'AGENTS.md',
  '.github/copilot-instructions.md',
  '.prettierrc.json',
  '.prettierignore',
  'scripts/verify-deploy-target.mjs',
  'scripts/security-history-audit.mjs',
  'scripts/scope-worker-types.mjs',
  'scripts/verify-peer-engineering.mjs',
  'tests/deploy-target.test.cjs',
  'tests/preflight-contract.test.cjs',
];
for (const file of files) {
  assert.equal(
    read(root, file),
    read(peer, file),
    `Shared engineering drift: ${file}`,
  );
}
const localPackage = JSON.parse(read(root, 'package.json'));
const peerPackage = JSON.parse(read(peer, 'package.json'));
for (const field of [
  'dependencies',
  'devDependencies',
  'overrides',
  'engines',
]) {
  assert.deepEqual(
    localPackage[field],
    peerPackage[field],
    `Shared engineering drift: ${field}`,
  );
}
for (const command of [
  'format',
  'format:check',
  'check',
  'preflight',
  'audit',
  'security:audit',
  'security:history',
  'verify:target',
  'verify:peer',
  'test',
]) {
  assert.equal(
    localPackage.scripts[command],
    peerPackage.scripts[command],
    `Shared engineering drift: ${command}`,
  );
}
const normalizeLock = (directory) => {
  const lock = JSON.parse(read(directory, 'package-lock.json'));
  delete lock.name;
  delete lock.packages[''].name;
  return lock;
};
assert.deepEqual(
  normalizeLock(root),
  normalizeLock(peer),
  'Shared engineering drift: dependency lock',
);
const normalizeWorkflow = (text) =>
  text.replace(/^name: .*\n/, 'name: SITE Quality\n');
assert.equal(
  normalizeWorkflow(read(root, '.github/workflows/quality.yml')),
  normalizeWorkflow(read(peer, '.github/workflows/quality.yml')),
  'Shared engineering drift: Quality workflow',
);
console.log(
  'Shared preflight baseline matches. This does not certify full application/release parity.',
);
