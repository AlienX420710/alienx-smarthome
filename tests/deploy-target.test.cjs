const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { dirname, join } = require('node:path');
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

function writeGeneratedRedirect(root, relativeConfigPath, generatedConfig) {
  const redirectDir = join(root, '.wrangler', 'deploy');
  const generatedPath = join(root, relativeConfigPath);
  mkdirSync(redirectDir, { recursive: true });
  mkdirSync(dirname(generatedPath), { recursive: true });
  writeFileSync(
    join(redirectDir, 'config.json'),
    JSON.stringify({
      configPath: `../../${relativeConfigPath}`,
    }),
  );
  writeFileSync(generatedPath, JSON.stringify(generatedConfig));
  return generatedPath;
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
          WORKERS_CI: '1',
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
    const generatedPath = writeGeneratedRedirect(
      root,
      'dist/server/wrangler.json',
      { main: 'entry.mjs' },
    );
    const { verifyDeployTarget } = await loadGuard();
    const result = verifyDeployTarget(root, {
      WRANGLER_CI_OVERRIDE_NAME: 'alienx-smarthome',
    });
    assert.equal(result.worker, 'alienx-smarthome');
    assert.equal(result.redirected, true);
    assert.equal(result.configPath, generatedPath);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('accepts another framework-generated in-repository config path', async () => {
  const root = fixture();
  try {
    const generatedPath = writeGeneratedRedirect(
      root,
      '.output/cloudflare/wrangler.json',
      { main: 'worker.mjs' },
    );
    const { verifyDeployTarget } = await loadGuard();
    const result = verifyDeployTarget(root, {
      WRANGLER_CI_OVERRIDE_NAME: 'alienx-smarthome',
    });
    assert.equal(result.worker, 'alienx-smarthome');
    assert.equal(result.redirected, true);
    assert.equal(result.configPath, generatedPath);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejects a generated Wrangler config that declares another Worker without a Workers Build override', async () => {
  const root = fixture();
  try {
    writeGeneratedRedirect(root, 'dist/server/wrangler.json', {
      name: 'alienx-smarthome-recovery-drill',
    });
    const { verifyDeployTarget } = await loadGuard();
    assert.throws(
      () => verifyDeployTarget(root, {}),
      /redirected Wrangler configuration targets/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('accepts a generated name when Workers Builds supplies the validated production override', async () => {
  const root = fixture();
  try {
    const generatedPath = writeGeneratedRedirect(
      root,
      'dist/server/wrangler.json',
      { name: 'framework-generated-name', main: 'entry.mjs' },
    );
    const { verifyDeployTarget } = await loadGuard();
    const result = verifyDeployTarget(root, {
      WORKERS_CI: '1',
      WRANGLER_CI_OVERRIDE_NAME: 'alienx-smarthome',
    });
    assert.equal(result.worker, 'alienx-smarthome');
    assert.equal(result.redirected, true);
    assert.equal(result.configPath, generatedPath);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('does not treat a manual override as authoritative outside Workers Builds', async () => {
  const root = fixture();
  try {
    writeGeneratedRedirect(root, 'dist/server/wrangler.json', {
      name: 'framework-generated-name',
    });
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

test('rejects a Wrangler redirect outside the repository', async () => {
  const root = fixture();
  try {
    mkdirSync(join(root, '.wrangler', 'deploy'), { recursive: true });
    writeFileSync(
      join(root, '.wrangler', 'deploy', 'config.json'),
      JSON.stringify({ configPath: '../../../outside-wrangler.json' }),
    );
    const { verifyDeployTarget } = await loadGuard();
    assert.throws(
      () => verifyDeployTarget(root, {}),
      /Redirected Wrangler configuration escapes the repository/,
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
