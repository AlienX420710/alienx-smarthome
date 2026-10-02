const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('contact success page uses only current consolidated destinations', () => {
  const source = fs.readFileSync('src/pages/contact/success.astro', 'utf8');
  for (const retired of ['/experience', '/technology', '/lab', '/work']) {
    assert.equal(
      source.includes(`href="${retired}`),
      false,
      `retired success-page link returned: ${retired}`,
    );
  }
  for (const current of [
    '/#why-alienx',
    '/#portfolio-title',
    '/#engineering-title',
    '/about',
  ]) {
    assert.equal(
      source.includes(`href="${current}"`),
      true,
      `expected success-page destination missing: ${current}`,
    );
  }
});

test('repository keeps mandatory documentation closeout policy', () => {
  const agents = fs.readFileSync('AGENTS.md', 'utf8');
  const template = fs.readFileSync('.github/pull_request_template.md', 'utf8');
  assert.match(agents, /## Documentation closeout — mandatory/);
  assert.match(agents, /Docs: updated <owners>/);
  assert.match(template, /## Documentation closeout — required/);
  assert.match(template, /Docs result:/);
});
