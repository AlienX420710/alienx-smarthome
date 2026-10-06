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
  const hostScript = source.match(/node --input-type=module -e '([^']+)'/)[1];
  const hosts = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', hostScript],
    { encoding: 'utf8' },
  );
  assert.equal(hosts.status, 0, hosts.stderr);
  const host = new URL(require('../engineering.config.json').origin).hostname;
  assert.deepEqual(hosts.stdout.trim().split('\n'), [host, 'www.' + host]);

  for (const flag of ['-tls1', '-tls1_1', '-tls1_2', '-tls1_3']) {
    assert.ok(source.includes(flag), `missing protocol probe ${flag}`);
  }

  assert.ok(source.includes('CBC cipher'));
  assert.ok(source.includes('static-RSA key exchange'));
});
