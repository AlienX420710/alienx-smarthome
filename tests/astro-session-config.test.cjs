const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

test('unused Astro sessions stay disabled for Cloudflare builds', () => {
  const config = readFileSync(join(__dirname, '../astro.config.mjs'), 'utf8');
  assert.match(config, /\bsession:\s*false\b/);
});
