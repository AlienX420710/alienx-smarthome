const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

function auditMutation(mutate) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alienx-workflow-audit-'));
  try {
    fs.cpSync('.github', path.join(root, '.github'), { recursive: true });
    for (const file of ['package.json', 'package-lock.json'])
      fs.copyFileSync(file, path.join(root, file));
    fs.writeFileSync(path.join(root, 'README.md'), 'Audit fixture');
    execFileSync('git', ['init', '-q', root]);
    execFileSync('git', ['add', '.'], { cwd: root });
    mutate(root);
    return spawnSync(
      process.execPath,
      [path.resolve('scripts/security-audit.mjs')],
      { cwd: root, encoding: 'utf8' },
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
function change(root, file, from, to) {
  const target = path.join(root, '.github/workflows', file);
  const source = fs.readFileSync(target, 'utf8');
  assert.ok(
    source.includes(from),
    'mutation must exercise a real configured protection',
  );
  fs.writeFileSync(target, source.replace(from, to));
}
test('workflow security audit accepts the committed policy', () => {
  const result = auditMutation(() => {});
  assert.equal(result.status, 0, result.stderr);
});
for (const [name, file, from, to, error] of [
  [
    'event-supplied approval controller',
    'release-approval.yml',
    'ref: ${{ github.workflow_sha }}',
    'ref: ${{ github.event.workflow_run.head_sha }}',
    /trusted workflow controller checkout is required/,
  ],
  [
    'event-supplied integrity controller',
    'production-integrity.yml',
    'ref: ${{ github.workflow_sha }}',
    'ref: ${{ github.event.workflow_run.head_sha }}',
    /trusted workflow controller checkout is required/,
  ],
  [
    'privileged package cache',
    'production-integrity.yml',
    'package-manager-cache: false',
    'cache: npm',
    /must not use package caches/,
  ],
  [
    'persisted checkout credentials',
    'quality.yml',
    'persist-credentials: false',
    'persist-credentials: true',
    /checkout must disable/,
  ],
  [
    'foreign workflow origin',
    'production-integrity.yml',
    'github.event.workflow_run.head_repository.full_name == github.repository &&',
    '',
    /origin validation is required/,
  ],
  [
    'SafariDriver without WebKit',
    'safari.yml',
    'npm run test:webkit',
    'node tests/safari.cjs',
    /real WebKit interactions are required/,
  ],
]) {
  test(`workflow security audit rejects ${name}`, () => {
    const result = auditMutation((root) => change(root, file, from, to));
    assert.equal(result.status, 1);
    assert.match(result.stderr, error);
  });
}

for (const [name, file, from, to, error] of [
  [
    'compact write permissions',
    'quality.yml',
    'permissions:\n  contents: read',
    'permissions: { contents: write }',
    /explicit block mapping/,
  ],
  [
    'commented write permission',
    'quality.yml',
    'contents: read',
    'contents: write # forbidden',
    /unexpected write permission/,
  ],
  [
    'compact privileged PR trigger',
    'quality.yml',
    'on:',
    'on: [pull_request_target]\nunused:',
    /pull_request_target is prohibited/,
  ],
  [
    'unreadable tracked file',
    'quality.yml',
    '',
    '',
    /tracked file could not be inspected/,
  ],
]) {
  test(`audit rejects ${name}`, () => {
    const result = auditMutation((root) => {
      if (name === 'unreadable tracked file')
        fs.unlinkSync(path.join(root, 'README.md'));
      else change(root, file, from, to);
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, error);
  });
}
test('audit rejects tracked Worker secrets', () => {
  const result = auditMutation((root) => {
    fs.writeFileSync(path.join(root, '.dev.vars'), 'EXAMPLE=value');
    execFileSync('git', ['add', '-f', '.dev.vars'], { cwd: root });
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /tracked Worker secret file is prohibited/);
});
