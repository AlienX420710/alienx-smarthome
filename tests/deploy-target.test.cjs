const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadGuard() {
  return import(
    `${pathToFileURL(join(__dirname, '../scripts/verify-deploy-target.mjs')).href}?test=${Date.now()}-${Math.random()}`,
  );
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'alienx-deploy-target-'));
  writeFileSync(
    join(root, 'wrangler.json'),
    JSON.stringify({ name: 'alienx-smarthome' }),
  );
  return root;
}

test('accepts the production Worker target', async () => {
  const root = fixture();
  try {
    const { verifyDeployTarget } = await loadGuard();
    assert.deepEqual(
      verifyDeployTarget(root, {
        WRANGLER_CI_OVERRIDE_NAME: 'alienx-smarthome',
      }),
      { worker: 'alienx-smarthome', redirected: false },
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejects a Workers Build name override to another Worker', async () => {
  const root = fixture();
  try {
    const { verifyDeployTarget } = await loadGuard();
    assert.throws(
      () =>
        verifyDeployTarget(root, {
          WRANGLER_CI_OVERRIDE_NAME: 'alienx-smarthome-recovery-drill',
        }),
      /WRANGLER_CI_OVERRIDE_NAME targets/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejects a redirected Wrangler config for another Worker', async () => {
  const root = fixture();
  try {
    mkdirSync(join(root, '.wrangler', 'deploy'), { recursive: true });
    mkdirSync(join(root, 'dist'), { recursive: true });
    writeFileSync(
      join(root, '.wrangler', 'deploy', 'config.json'),
      JSON.stringify({ configPath: '../../dist/wrangler.json' }),
    );
    writeFileSync(
      join(root, 'dist', 'wrangler.json'),
      JSON.stringify({ name: 'alienx-smarthome-recovery-drill' }),
    );
    const { verifyDeployTarget } = await loadGuard();
    assert.throws(
      () =>
        verifyDeployTarget(root, {
          WRANGLER_CI_OVERRIDE_NAME: 'alienx-smarthome',
        }),
      /redirected Wrangler configuration targets/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('accepts a redirected Wrangler config only for production', async () => {
  const root = fixture();
  try {
    mkdirSync(join(root, '.wrangler', 'deploy'), { recursive: true });
    mkdirSync(join(root, 'dist'), { recursive: true });
    writeFileSync(
      join(root, '.wrangler', 'deploy', 'config.json'),
      JSON.stringify({ configPath: '../../dist/wrangler.json' }),
    );
    writeFileSync(
      join(root, 'dist', 'wrangler.json'),
      JSON.stringify({ name: 'alienx-smarthome' }),
    );
    const { verifyDeployTarget } = await loadGuard();
    const result = verifyDeployTarget(root, {
      WRANGLER_CI_OVERRIDE_NAME: 'alienx-smarthome',
    });
    assert.equal(result.worker, 'alienx-smarthome');
    assert.equal(result.redirected, true);
    assert.equal(result.configPath, join(root, 'dist', 'wrangler.json'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejects the retired recovery drill artifacts in a production checkout', async () => {
  const root = fixture();
  try {
    mkdirSync(join(root, 'ops'), { recursive: true });
    writeFileSync(join(root, 'ops', 'recovery-drill.enabled'), 'enabled\n');
    const { verifyDeployTarget } = await loadGuard();
    assert.throws(
      () => verifyDeployTarget(root, {}),
      /forbidden recovery-drill artifact exists/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
