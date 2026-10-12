const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const root = resolve(__dirname, '..');
const manifest = JSON.parse(
  readFileSync(resolve(root, 'package.json'), 'utf8'),
);

test('preflight includes formatting and all local Quality gates before dependency acceptance', () => {
  assert.equal(manifest.scripts.preflight, 'npm run check && npm run audit');
  const stages = manifest.scripts.check.split(' && ');
  assert.equal(stages[0], 'npm run format:check');
  for (const stage of [
    'npm run security:audit',
    'npm run security:history',
    'npm test',
    'npm run build',
    'npm run verify:target',
    'npm run typecheck',
    'wrangler deploy --dry-run',
  ]) {
    assert.ok(stages.includes(stage), `Missing Quality gate: ${stage}`);
  }
  assert.ok(
    stages.indexOf('npm run build') < stages.indexOf('npm run verify:target'),
  );
  assert.equal(manifest.scripts.audit, 'npm audit --audit-level=low');
});

test('format check uses the write formatter scope without diagnostic side effects', () => {
  assert.equal(
    manifest.scripts['format:check'],
    manifest.scripts.format.replace('--write', '--check'),
  );
  assert.ok(manifest.scripts['format:check'].includes('package.json'));
  assert.ok(manifest.scripts['format:check'].includes('"*.md"'));
  assert.doesNotMatch(manifest.scripts['format:check'], /&&|\|\||;|exit /);
  const workflow = readFileSync(
    resolve(root, '.github/workflows/quality.yml'),
    'utf8',
  );
  assert.match(workflow, /run: npm run check\s/);
  assert.match(workflow, /run: npm run audit\s/);
  assert.doesNotMatch(workflow, /prettier --|continue-on-error: true/);
});

test('publication preparation and verification use the shared implementation', () => {
  assert.equal(
    manifest.scripts['prepare:pr'],
    'node scripts/prepare-change.mjs',
  );
  assert.equal(
    manifest.scripts['verify:prepared'],
    'node scripts/prepare-change.mjs --verify',
  );
});
