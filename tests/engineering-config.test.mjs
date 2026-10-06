import { test } from 'node:test';
import assert from 'node:assert/strict';
import { site } from '../scripts/site-config.mjs';
import { readFileSync } from 'node:fs';

test('shared browser runner retains real WebKit keyboard and interaction coverage', () => {
  assert.ok(site.browser.suites.webkit.includes('tests/keyboard.spec.cjs'));
  assert.ok(
    site.browser.suites.webkit.some((file) =>
      /(?:interactions|navigation)\.spec\.cjs$/.test(file),
    ),
  );
  const runner = readFileSync(
    new URL('../scripts/test-browser.mjs', import.meta.url),
    'utf8',
  );
  assert.match(runner, /--browser=webkit/);
  assert.match(runner, /result.status/);
});

test('production monitor fixture cannot contain a usable security token or populated honeypot', () => {
  assert.ok(['json', 'form'].includes(site.form.encoding));
  const token =
    site.form.encoding === 'json' ? 'website' : 'cf-turnstile-response';
  assert.equal(site.form.invalid[token], '');
  assert.equal(site.form.invalid.faxNumber, '');
  assert.equal(new URL(site.form.endpoint, site.origin).origin, site.origin);
  assert.ok(site.form.endpoint.startsWith('/api/'));
});

test('release approval and rejection refs stay separate and scoped to site identity', async () => {
  const { approvalRefs } = await import('../scripts/verify-ci.mjs');
  assert.notEqual(approvalRefs.approved, approvalRefs.rejected);
  assert.equal(
    approvalRefs.approved,
    `refs/tags/${site.releaseRefPrefix}-ci-approved-main`,
  );
  assert.equal(
    approvalRefs.rejected,
    `refs/tags/${site.releaseRefPrefix}-ci-rejected-main`,
  );
});

test('native Safari layout contract has an explicit valid breakpoint', () => {
  assert.ok(Number.isInteger(site.browser.navigationRowBreakpoint));
  assert.ok(site.browser.navigationRowBreakpoint >= 0);
  assert.ok(
    site.browser.suites.accessibility.includes(
      'tests/heading-contrast.spec.cjs',
    ),
  );
});
