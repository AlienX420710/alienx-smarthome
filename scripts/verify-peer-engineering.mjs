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
  'astro.config.mjs',
  'src/security.ts',
  'src/email-health-engine.ts',
  'src/pages/api/release.ts',
  'public/_headers',
  'scripts/write-release.mjs',
  'scripts/verify-release.mjs',
  'scripts/verify-smoke.mjs',
  'scripts/verify-integrity.mjs',
  'scripts/integrity-contract.mjs',
  'scripts/verify-tls-posture.sh',
  'scripts/optimize-images.mjs',
  'tests/email-health-cleanup.test.mjs',
  'tests/tls-posture-script.test.cjs',
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
  'tests/heading-contrast.cjs',
  'tests/heading-contrast.test.cjs',
  'tests/heading-contrast.spec.cjs',
  'tests/engineering-config.test.mjs',
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
  'build',
  'dev',
  'preview',
  'typecheck',
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
// Normalize only declared workflow display names/references, never script bodies.
const workflowNames = (directory) =>
  Object.fromEntries(
    [
      'quality.yml',
      'responsive.yml',
      'accessibility.yml',
      'safari.yml',
      'lighthouse.yml',
      'contact-form-health.yml',
      'production-smoke.yml',
      'production-integrity.yml',
      'operator-alert.yml',
      'operator-alert-canary.yml',
      'release-approval.yml',
    ].map((file) => [
      read(directory, '.github/workflows/' + file).match(/^name: (.*)$/m)[1],
      file,
    ]),
  );
const normalizeWorkflow = (text, directory) => {
  const names = workflowNames(directory);
  return text
    .split('\n')
    .map((line) => {
      if (line.startsWith('name: ')) return 'name: SITE Workflow';
      const match = line.match(/^(\s+- )(.*)$/);
      return match && names[match[2]] ? match[1] + names[match[2]] : line;
    })
    .join('\n');
};
for (const workflow of [
  'quality.yml',
  'responsive.yml',
  'accessibility.yml',
  'safari.yml',
  'lighthouse.yml',
  'contact-form-health.yml',
  'production-smoke.yml',
  'production-integrity.yml',
  'operator-alert.yml',
  'operator-alert-canary.yml',
  'release-approval.yml',
]) {
  assert.equal(
    normalizeWorkflow(read(root, '.github/workflows/' + workflow), root),
    normalizeWorkflow(read(peer, '.github/workflows/' + workflow), peer),
    'Shared workflow drift: ' + workflow,
  );
}
console.log(
  'Shared framework, revision, security, integrity, release, monitoring, image, browser and preflight implementations match; site configuration and application-specific content are separate. This source comparison does not certify deployment or private acceptance.',
);
