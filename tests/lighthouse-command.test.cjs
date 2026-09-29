const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

function failingCommand(t, diagnostic) {
  const directory = mkdtempSync(join(tmpdir(), 'lighthouse-cli-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, 'fixture.cjs');
  writeFileSync(
    file,
    `process.stderr.write(${JSON.stringify(diagnostic)}); process.exit(1);`,
  );
  return [file];
}

test('nonzero CLI trace failure retains stderr for the bounded retry decision', async (t) => {
  const { runLighthouseCommand, isRetryableTraceError } =
    await import('../scripts/lighthouse-command.mjs');
  assert.throws(
    () =>
      runLighthouseCommand(
        failingCommand(t, 'Runtime error encountered: NO_NAVSTART'),
      ),
    (error) => {
      assert.equal(error.status, 1);
      assert.match(error.message, /Runtime error encountered: NO_NAVSTART/);
      assert.equal(isRetryableTraceError(error), true);
      return true;
    },
  );
});

test('unrelated CLI failures are not eligible for a trace retry', async (t) => {
  const { runLighthouseCommand, isRetryableTraceError } =
    await import('../scripts/lighthouse-command.mjs');
  assert.throws(
    () =>
      runLighthouseCommand(failingCommand(t, 'Unable to connect to Chrome')),
    (error) => {
      assert.equal(isRetryableTraceError(error), false);
      return true;
    },
  );
  assert.equal(
    isRetryableTraceError(new Error('Performance score 0.82 below 0.85')),
    false,
  );
});
