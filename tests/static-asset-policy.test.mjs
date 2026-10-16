import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('static header policy stays available to the Workers asset parser', () => {
  const ignored = readFileSync(
    new URL('../public/.assetsignore', import.meta.url),
    'utf8',
  )
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  assert.ok(!ignored.includes('_headers'));
  assert.ok(ignored.includes('_worker.js'));
  const policy = readFileSync(
    new URL('../public/_headers', import.meta.url),
    'utf8',
  );
  assert.match(policy, /X-Frame-Options: DENY/);
  assert.match(policy, /X-Content-Type-Options: nosniff/);
});
