const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadGuard() {
  return import(
    `${pathToFileURL(join(__dirname, '../scripts/verify-deploy-target.mjs')).href}?test=${Date.now()}-${Math.random()}`
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

function writeAstroRedirect(root, generatedConfig) {
  mkdirSync(join(root, '.wrangler', 'deploy'), { recursive: true });
  mkdirSync(join(root, 'dist', 'server'), { recursive: true });
  writeFileSync(
    join(root, '.wrangler', 'deploy', 'config.json'),
    JSON.stringify({ configPath: '../../dist/server/wrangler.json' }),
  );
  writeFileSync(
    join(root, 'dist', 'server', 'wrangler.json'),
    JSON.stringify(generatedConfig),
  );
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

test('accepts Astro generated Wrangler config without its own Worker name', async () => {
  const root = fixture();
  try {
    writeAstroRedirect(root, { main: 'entry.mjs' });
    const { verifyDeployTarget } = await loadGuard();
    const result = verifyDeployTarget(root, {
      WRANGLER_CI_OVERRIDE_NAME: 'alienx-smarthome',
    });
    assert.equal(result.worker, 'alienx-smarthome');
    assert.equal(result.redirected, true);
    assert.equal(
      result.configPath,
      join(root, 'dist', 'server', 'wrangler.json'),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejects a generated Wrangler config that declares another Worker', async () => {
  const root = fixture();
  try {
    writeAstroRedirect(root, { name: 'alienx-smarthome-recovery-drill' });
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

test('rejects a Wrangler redirect outside the pinned Astro generated path', async () => {
  const root = fixture();
  try {
    mkdirSync(join(root, '.wrangler', 'deploy'), { recursive: true });
    mkdirSync(join(root, 'dist'), { recursive: true });
    writeFileSync(
      join(root, '.wrangler', 'deploy', 'config.json'),
      JSON.stringify({ configPath: '../../dist/wrangler.json' }),
    );
    writeFileSync(join(root, 'dist', 'wrangler.json'), JSON.stringify({}));
    const { verifyDeployTarget } = await loadGuard();
    assert.throws(
      () => verifyDeployTarget(root, {}),
      /Unexpected Wrangler redirect target/,
    );
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
