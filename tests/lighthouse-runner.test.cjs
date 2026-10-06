const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

function fixture(t) {
  const directory = fs.mkdtempSync(join(tmpdir(), 'lighthouse-runner-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(join(directory, 'scripts'));
  fs.mkdirSync(join(directory, 'node_modules/lighthouse/cli'), {
    recursive: true,
  });
  for (const name of [
    'lighthouse',
    'lighthouse-runner',
    'lighthouse-assessment',
  ]) {
    fs.copyFileSync(
      `scripts/${name}.mjs`,
      join(directory, `scripts/${name}.mjs`),
    );
  }
  const config = structuredClone(require('../lighthouse.config.cjs'));
  config.origin = 'http://example.test';
  config.routes = ['/'];
  fs.writeFileSync(
    join(directory, 'lighthouse.config.cjs'),
    `module.exports = ${JSON.stringify(config)};`,
  );
  fs.writeFileSync(
    join(directory, 'node_modules/lighthouse/cli/index.js'),
    `
    const fs = require('node:fs');
    const output = process.argv.find(arg => arg.startsWith('--output-path=')).slice(14);
    fs.appendFileSync('calls.txt', output + '\\n');
    const scenario = process.env.LIGHTHOUSE_FIXTURE;
    const attempt = Number(output.match(/attempt-(\\d+)\\.json$/)?.[1]);
    if (scenario === 'missing') process.exit(0);
    if (scenario === 'cli-trace' || scenario === 'unrelated') {
      process.stderr.write(scenario === 'cli-trace' ? 'NO_NAVSTART' : 'Chrome unavailable');
      process.exit(1);
    }
    const report = { categories: Object.fromEntries(
      ['performance', 'accessibility', 'best-practices', 'seo'].map(key => [key, { score: scenario === 'low' ? 0.5 : 1 }])
    ) };
    if (scenario === 'retry' && attempt === 1) report.runtimeError = { message: 'NO_NAVSTART' };
    if (scenario === 'retry-twice' && attempt < 3) report.runtimeError = { message: 'NO_NAVSTART' };
    fs.writeFileSync(output, JSON.stringify(report));
  `,
  );
  return {
    directory,
    run(scenario, ...args) {
      return spawnSync(process.execPath, ['scripts/lighthouse.mjs', ...args], {
        cwd: directory,
        env: { ...process.env, LIGHTHOUSE_FIXTURE: scenario },
        encoding: 'utf8',
      });
    },
    calls() {
      return fs
        .readFileSync(join(directory, 'calls.txt'), 'utf8')
        .trim()
        .split('\n');
    },
    read(path) {
      return fs.readFileSync(join(directory, path), 'utf8');
    },
  };
}

test('trace retry retains both attempt reports and first-attempt errors for every fixed sample', (t) => {
  const f = fixture(t);
  const result = f.run('retry');
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(calls.length, 6);
  assert.equal(new Set(calls).size, 6);
  for (let index = 0; index < calls.length; index += 2) {
    assert.match(f.read(calls[index]), /NO_NAVSTART/);
    assert.match(f.read(`${calls[index]}.error.txt`), /NO_NAVSTART/);
    assert.equal(JSON.parse(f.read(calls[index + 1])).runtimeError, undefined);
  }
  assert.match(result.stderr, /NO_NAVSTART/);
});

test('trace capture can recover after two consecutive transient failures without changing sample count', (t) => {
  const f = fixture(t);
  const result = f.run('retry-twice');
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(calls.length, 9);
  assert.equal(new Set(calls).size, 9);
  for (let index = 0; index < calls.length; index += 3) {
    assert.match(f.read(calls[index]), /NO_NAVSTART/);
    assert.match(f.read(`${calls[index]}.error.txt`), /NO_NAVSTART/);
    assert.match(f.read(calls[index + 1]), /NO_NAVSTART/);
    assert.match(f.read(`${calls[index + 1]}.error.txt`), /NO_NAVSTART/);
    assert.equal(JSON.parse(f.read(calls[index + 2])).runtimeError, undefined);
  }
});

test('missing reports cannot reuse successful prior-invocation evidence', (t) => {
  const f = fixture(t);
  assert.equal(f.run('success').status, 0);
  const original = f.calls();
  const result = f.run('missing');
  assert.equal(result.status, 1);
  const calls = f.calls();
  assert.equal(calls.length, 6);
  assert.equal(new Set(calls).size, 6);
  for (const path of original)
    assert.equal(JSON.parse(f.read(path)).categories.performance.score, 1);
  for (const path of calls.slice(3))
    assert.match(f.read(`${path}.error.txt`), /ENOENT/);
});

test('CLI trace errors retain stderr artifacts and stop after two retries per sample', (t) => {
  const f = fixture(t);
  assert.equal(f.run('cli-trace').status, 1);
  assert.equal(f.calls().length, 9);
  for (const path of f.calls())
    assert.match(f.read(`${path}.error.txt`), /NO_NAVSTART/);
});

test('unrelated errors and low scores fail without retries or reduced sample counts', (t) => {
  for (const scenario of ['unrelated', 'low']) {
    const f = fixture(t);
    assert.equal(f.run(scenario).status, 1);
    assert.equal(f.calls().length, 3);
  }
});

test('accessibility keeps three samples and invocation-specific summary evidence', (t) => {
  const f = fixture(t);
  assert.equal(f.run('success', '--accessibility').status, 0);
  assert.equal(f.calls().length, 3);
  assert.match(f.calls()[0], /accessibility-.*sample-1-attempt-1/);
  const folder = fs.readdirSync(join(f.directory, '.lighthouseci'))[0];
  const summary = JSON.parse(f.read(`.lighthouseci/${folder}/summary.json`));
  assert.equal(summary.length, 3);
  assert.deepEqual(
    summary[0].results.map((result) => result.category),
    ['accessibility'],
  );
});
