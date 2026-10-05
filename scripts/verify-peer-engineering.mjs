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
  'scripts/site-config.mjs',
  'scripts/verify-ci.mjs',
  'scripts/publish-ci-approval.mjs',
  'scripts/verify-code-scanning.mjs',
  'scripts/security-audit.mjs',
  'scripts/workflow-policy.mjs',
  'tests/release-gate.test.mjs',
  'tests/release-refs.test.cjs',
  'tests/deployment-rehearsal.test.cjs',
  '.github/dependabot.yml',
  'scripts/test-browser.mjs',
  'scripts/lighthouse.mjs',
  'scripts/lighthouse-runner.mjs',
  'scripts/lighthouse-assessment.mjs',
  'scripts/verify-contact-form-health.mjs',
  'scripts/verify-email-health.mjs',
  'lighthouse.config.cjs',
  'tests/accessibility.spec.cjs',
  'tests/responsive.spec.cjs',
  'tests/safari.cjs',
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
for (const workflow of [
  'quality.yml',
  'responsive.yml',
  'accessibility.yml',
  'safari.yml',
  'lighthouse.yml',
  'contact-form-health.yml',
]) {
  assert.equal(
    normalizeWorkflow(read(root, '.github/workflows/' + workflow)),
    normalizeWorkflow(read(peer, '.github/workflows/' + workflow)),
    'Shared workflow drift: ' + workflow,
  );
}
console.log(
  'Migrated release, monitoring, browser and preflight components match. Remaining application/CSP/integrity differences and deployment evidence are tracked separately; full parity is not certified.',
);
