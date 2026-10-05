import { spawnSync } from 'node:child_process';
import { site } from './site-config.mjs';
const suite = process.argv[2];
const files = site.browser.suites[suite];
if (
  !Array.isArray(files) ||
  !files.length ||
  files.some((file) => !/^tests\/[a-z-]+\.spec\.cjs$/.test(file))
)
  throw Error('Invalid browser suite');
const result = spawnSync(
  process.execPath,
  [
    'node_modules/@playwright/test/cli.js',
    'test',
    ...files,
    ...(suite === 'webkit' ? ['--browser=webkit'] : []),
    '--reporter=line',
  ],
  { stdio: 'inherit' },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
