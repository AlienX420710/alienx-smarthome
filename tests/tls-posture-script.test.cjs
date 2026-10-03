const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const scriptPath = 'scripts/verify-tls-posture.sh';

test('TLS posture verifier is valid bash and covers both production hosts', () => {
  const syntax = spawnSync('bash', ['-n', scriptPath], { encoding: 'utf8' });
  assert.equal(
    syntax.status,
    0,
    `bash syntax failed:\n${syntax.stdout}\n${syntax.stderr}`,
  );

  const source = fs.readFileSync(scriptPath, 'utf8');
  for (const host of ['alienxsmarthome.com', 'www.alienxsmarthome.com']) {
    assert.ok(source.includes(`"${host}"`), `missing production host ${host}`);
  }

  for (const flag of ['-tls1', '-tls1_1', '-tls1_2', '-tls1_3']) {
    assert.ok(source.includes(flag), `missing protocol probe ${flag}`);
  }

  assert.ok(source.includes('CBC cipher'));
  assert.ok(source.includes('static-RSA key exchange'));
});
