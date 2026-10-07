import assert from 'node:assert/strict';
import { site } from './site-config.mjs';
import { verifyIntegrity } from './verify-integrity.mjs';
let requestId = 0;
const request = (origin, path, options = {}) => {
  const url = new URL(path, origin);
  url.searchParams.set('_smoke', Date.now() + '-' + requestId++);
  return fetch(url, {
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
    ...options,
    headers: {
      ...options.headers,
      'Cache-Control': 'no-cache, no-store',
      Pragma: 'no-cache',
    },
  });
};
let expected = process.env.EXPECTED_REVISION;
if (!expected) {
  const release = await request(site.origin, '/api/release');
  assert.ok(release.ok, 'Release metadata unavailable');
  expected = (await release.json()).revision;
}
await verifyIntegrity({ expected });
for (const origin of [
  site.origin,
  site.origin.replace('https://', 'https://www.'),
]) {
  for (const [path, marker] of Object.entries(site.smoke.markers)) {
    const response = await request(origin, path);
    assert.ok(
      response.ok &&
        response.headers.get('content-type')?.includes('text/html'),
      'Expected HTML: ' + path,
    );
    const body = await response.text();
    assert.ok(body.includes(marker), 'Missing content marker: ' + path);
    assert.ok(
      !body.includes('[object Object]'),
      'Malformed rendered content: ' + path,
    );
  }
  const status = await request(origin, '/api/status');
  const value = await status.json();
  assert.equal(value.ok, true);
  assert.equal(value.status, 'operational');
  assert.equal(typeof value.summary, 'string');
  for (const key of site.smoke.statusChecks) {
    assert.ok(
      ['operational', 'configured'].includes(value.checks?.[key]?.status),
      'Readiness check: ' + key,
    );
    if (!site.privateStatus)
      assert.equal(typeof value.checks[key].detail, 'string');
  }
  if (site.privateStatus) {
    assert.equal(value.scope, 'configuration-readiness');
    for (const key of [
      'turnstile',
      'resend',
      'generatedAt',
      'requestId',
      'runtime',
    ])
      assert.ok(
        !(key in value) && !(key in value.checks),
        'Private status leaked ' + key,
      );
  } else {
    assert.equal(value.runtime, 'Cloudflare Workers');
    assert.equal(typeof value.generatedAt, 'string');
  }
}
// Deliberately invalid, secret-free requests cannot reach the mail provider.
const origin = site.origin;
const invalid = site.form.invalid;
assert.equal(
  invalid['cf-turnstile-response'] ?? invalid.turnstileToken ?? '',
  '',
);
const response = await request(origin, site.form.endpoint, {
  method: 'POST',
  headers: {
    Origin: origin,
    Accept: 'application/json',
    'Content-Type':
      site.form.encoding === 'json'
        ? 'application/json'
        : 'application/x-www-form-urlencoded',
  },
  body:
    site.form.encoding === 'json'
      ? JSON.stringify(invalid)
      : new URLSearchParams(invalid),
});
assert.equal(response.status, 403);
const rejection = await response.json();
assert.equal(typeof rejection.error, 'string');
if (site.smoke.rejectionCode) {
  assert.equal(rejection.code, site.smoke.rejectionCode);
  assert.equal(typeof rejection.requestId, 'string');
}
if (site.privateStatus) {
  const method = await request(origin, '/api/status', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
  });
  assert.equal(method.status, 405);
}
const final = await request(origin, '/api/release');
assert.equal(
  (await final.json()).revision,
  expected,
  'Revision changed during smoke',
);
console.log('Production smoke passed for exact revision ' + expected);
