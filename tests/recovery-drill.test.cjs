const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

test('recovery drill configuration is isolated from production', () => {
  const config = JSON.parse(
    readFileSync(path.join(__dirname, '../wrangler.recovery-drill.json'), 'utf8'),
  );

  assert.equal(config.name, 'alienx-smarthome-recovery-drill');
  assert.equal(config.main, './ops/recovery-drill-worker.mjs');
  assert.equal(config.workers_dev, true);
  assert.equal(config.preview_urls, true);
  assert.deepEqual(config.version_metadata, { binding: 'CF_VERSION_METADATA' });

  for (const forbidden of [
    'routes',
    'route',
    'triggers',
    'assets',
    'vars',
    'ratelimits',
    'kv_namespaces',
    'r2_buckets',
    'd1_databases',
    'durable_objects',
    'services',
  ]) {
    assert.equal(
      Object.hasOwn(config, forbidden),
      false,
      `${forbidden} must not exist in the isolated drill config`,
    );
  }
});

test('recovery drill worker exposes version evidence and makes rejected candidate unhealthy', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '../ops/recovery-drill-worker.mjs'),
  ).href;
  const worker = (await import(moduleUrl)).default;
  const metadata = {
    id: '11111111-2222-3333-4444-555555555555',
    tag: 'baseline-deadbeef',
    timestamp: '2026-10-03T00:00:00.000Z',
  };

  const healthy = await worker.fetch(new Request('https://example.test/'), {
    DRILL_STATE: 'baseline',
    SOURCE_SHA: 'a'.repeat(40),
    CF_VERSION_METADATA: metadata,
  });
  assert.equal(healthy.status, 200);
  assert.equal(healthy.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await healthy.json(), {
    ok: true,
    state: 'baseline',
    sourceSha: 'a'.repeat(40),
    versionId: metadata.id,
    versionTag: metadata.tag,
    versionTimestamp: metadata.timestamp,
  });

  const rejected = await worker.fetch(new Request('https://example.test/'), {
    DRILL_STATE: 'rejected-candidate',
    SOURCE_SHA: 'b'.repeat(40),
    CF_VERSION_METADATA: {
      ...metadata,
      id: '66666666-7777-8888-9999-000000000000',
      tag: 'rejected-feedface',
    },
  });
  assert.equal(rejected.status, 503);
  assert.equal((await rejected.json()).ok, false);
});

test('production deploy keeps the exact-main gate before the recovery drill and production publish', () => {
  const { deploy } = JSON.parse(
    readFileSync(path.join(__dirname, '../package.json'), 'utf8'),
  ).scripts;
  assert.equal(
    deploy,
    'node scripts/verify-ci.mjs && node scripts/recovery-drill.mjs && wrangler deploy',
  );
});
