import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
let revision =
  process.env.WORKERS_CI_COMMIT_SHA ||
  process.env.CF_BUILD_COMMIT_SHA ||
  process.env.GITHUB_SHA;
if (!revision)
  revision = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
if (!/^[a-f0-9]{40}$/.test(revision))
  throw new Error('A full Git commit SHA is required for release metadata');
writeFileSync('src/release.json', JSON.stringify({ revision }) + '\n');
