const test = require('node:test');
const assert = require('node:assert/strict');
const {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

test('actual npm deploy command stops before Wrangler on rejected, missing, stale, unavailable or wrong-target evidence', () => {
  const root = mkdtempSync(join(tmpdir(), 'alienx-deploy-rehearsal-'));
  try {
    const git = (args) =>
      execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
    git(['init', '-q']);
    git(['config', 'user.name', 'Offline rehearsal']);
    git(['config', 'user.email', 'rehearsal@example.invalid']);
    mkdirSync(join(root, 'scripts'));
    writeFileSync(
      join(root, 'scripts/verify-ci.mjs'),
      readFileSync(join(__dirname, '../scripts/verify-ci.mjs')),
    );
    writeFileSync(
      join(root, 'scripts/verify-deploy-target.mjs'),
      readFileSync(join(__dirname, '../scripts/verify-deploy-target.mjs')),
    );
    writeFileSync(
      join(root, 'wrangler.json'),
      JSON.stringify({ name: 'alienx-smarthome' }),
    );
    const {
      scripts: { deploy },
    } = JSON.parse(readFileSync(join(__dirname, '../package.json')));
    assert.equal(
      deploy,
      'node scripts/verify-ci.mjs && node scripts/verify-deploy-target.mjs && wrangler deploy',
    );
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({
        name: 'alienx-smarthome',
        type: 'module',
        scripts: { deploy },
      }),
    );
    writeFileSync(
      join(root, 'wrangler'),
      '#!/bin/sh\necho OFFLINE_WRANGLER_SENTINEL\n',
      { mode: 0o755 },
    );
    // Only Git remote evidence is replaced. The real verifier, checkout checks,
    // deploy-target guard, npm command and shell short-circuit execute. No
    // network/deployment occurs.
    writeFileSync(
      join(root, 'evidence.mjs'),
      `
      import childProcess from 'node:child_process';
      import { syncBuiltinESMExports } from 'node:module';
      if (process.argv[1]?.endsWith('/scripts/verify-ci.mjs')) {
      const original = childProcess.execFileSync;
      const sha = original('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
      const scenario = process.env.REHEARSAL_CASE;
      let clock = 0;
      Date.now = () => clock;
      globalThis.setTimeout = callback => { clock += 13 * 60 * 1000; callback(); };
      childProcess.execFileSync = (file, args, options) => {
        if (file !== 'git' || args[0] !== 'ls-remote') return original(file, args, options);
        if (args[2] !== 'https://github.com/AlienX420710/alienx-smarthome.git') throw Error('Unexpected remote');
        if (scenario === 'unavailable') throw Error('Offline transport failure');
        if (args.includes('refs/heads/main')) return (scenario === 'stale' ? 'b'.repeat(40) : sha) + '\\trefs/heads/main\\n';
        if (scenario === 'rejected') return sha + '\\trefs/tags/alienx-ci-rejected-main\\n' + sha + '\\trefs/tags/alienx-ci-approved-main\\n';
        if (scenario === 'missing') return '';
        return sha + '\\trefs/tags/alienx-ci-approved-main\\n';
      };
      syncBuiltinESMExports();
      }
    `,
    );
    git(['add', '.']);
    git(['commit', '-qm', 'Offline deployment fixture']);
    const sha = git(['rev-parse', 'HEAD']);
    for (const scenario of [
      'rejected',
      'missing',
      'stale',
      'unavailable',
      'wrong-branch',
      'wrong-sha',
      'wrong-worker-override',
      'approved',
    ]) {
      const result = spawnSync('npm', ['run', 'deploy'], {
        cwd: root,
        encoding: 'utf8',
        timeout: 20000,
        env: {
          ...process.env,
          PATH: `${root}:${process.env.PATH}`,
          NODE_OPTIONS: `--import=${join(root, 'evidence.mjs')}`,
          REHEARSAL_CASE: scenario,
          WORKERS_CI_BRANCH: scenario === 'wrong-branch' ? 'feature' : 'main',
          WORKERS_CI_COMMIT_SHA:
            scenario === 'wrong-sha' ? 'b'.repeat(40) : sha,
          WRANGLER_CI_OVERRIDE_NAME:
            scenario === 'wrong-worker-override'
              ? 'alienx-smarthome-recovery-drill'
              : 'alienx-smarthome',
        },
      });
      const output = result.stdout + result.stderr;
      assert.equal(result.error, undefined, scenario);
      if (scenario === 'approved') {
        assert.equal(result.status, 0, output);
        assert.match(output, /Verified production deploy target/);
        assert.match(output, /OFFLINE_WRANGLER_SENTINEL/);
      } else {
        assert.notEqual(result.status, 0, scenario);
        assert.doesNotMatch(output, /OFFLINE_WRANGLER_SENTINEL/, scenario);
      }
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
