const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

test('static assets retain frame protection independently of Worker middleware', () => {
  const headers = readFileSync(
    path.join(__dirname, '../public/_headers'),
    'utf8',
  );
  assert.match(headers, /Content-Security-Policy: frame-ancestors 'none'/);
  assert.match(
    headers,
    /Strict-Transport-Security: max-age=31536000; includeSubDomains/,
  );
});
const policy =
  "default-src 'self';base-uri 'self';object-src 'none';form-action 'self';img-src 'self' data: blob:;font-src 'self';connect-src 'self' https://challenges.cloudflare.com;frame-src https://challenges.cloudflare.com;script-src 'self' https://challenges.cloudflare.com 'sha256-YWJj';style-src 'self' 'sha256-YWJj'";
const header = "frame-ancestors 'none'";
const html = (value) =>
  `<html><head><meta content="${value}" http-equiv="content-security-policy"></head><body></body></html>`;

test('CSP requires effective frame header and a complete resource policy', async () => {
  const { assertCsp } = await import('../scripts/integrity-contract.mjs');
  assert.doesNotThrow(() => assertCsp(header, html(policy)));
  assert.doesNotThrow(() => assertCsp(`${header}, ${policy}`, '<head></head>'));
  assert.doesNotThrow(() =>
    assertCsp(header, html(policy.replaceAll("'", '&#39;'))),
  );
  assert.throws(() => assertCsp(header, '<head></head>'));
  assert.throws(() => assertCsp(null, html(`${header};${policy}`)));
  for (const weakened of [
    policy.replace("object-src 'none'", 'object-src *'),
    policy.replace("script-src 'self'", "script-src 'unsafe-inline'"),
    policy.replace(
      'https://challenges.cloudflare.com;',
      'https://evil.example;',
    ),
    policy + ";script-src-elem 'unsafe-inline'",
    policy + ';default-src *',
  ])
    assert.throws(() => assertCsp(header, html(weakened)));
});

test('CSP-looking text outside active head metadata cannot satisfy integrity', async () => {
  const { assertCsp } = await import('../scripts/integrity-contract.mjs');
  for (const source of [
    `<head><!--${html(policy)}--></head>`,
    `<head><script>${html(policy)}</script></head>`,
    `<head></head><body><template>${html(policy)}</template></body>`,
    `<head><meta http-equiv="content-security-policy-report-only" content="${policy}"></head>`,
  ])
    assert.throws(() => assertCsp(header, source));
});
