import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const required = [
  'quality.yml',
  'responsive.yml',
  'accessibility.yml',
  'lighthouse.yml',
  'safari.yml',
];
export function assessRuns(runs, sha) {
  return required.map((file) => {
    const matches = runs.filter(
      (run) =>
        run.path === `.github/workflows/${file}` &&
        run.head_sha === sha &&
        run.head_branch === 'main' &&
        run.event === 'push',
    );
    const latest = matches.sort((a, b) => b.id - a.id)[0];
    return {
      file,
      state: !latest
        ? 'missing'
        : latest.status !== 'completed'
          ? 'pending'
          : latest.conclusion,
    };
  });
}

export async function verify() {
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  const buildSha =
    process.env.WORKERS_CI_COMMIT_SHA || process.env.GITHUB_SHA || sha;
  if (!/^[a-f0-9]{40}$/.test(sha) || buildSha !== sha)
    throw Error('Build revision differs from checkout');
  if (process.env.WORKERS_CI_BRANCH && process.env.WORKERS_CI_BRANCH !== 'main')
    throw Error('Only main may deploy');
  if (
    execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], {
      encoding: 'utf8',
    }).trim()
  )
    throw Error('Refusing a modified checkout');
  const api = 'https://api.github.com/repos/AlienX420710/alienx-smarthome';
  const get = async (path) => {
    const response = await fetch(api + path, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'AlienX-release-gate',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw Error(`GitHub verification unavailable: HTTP ${response.status}`);
    return response.json();
  };
  const current = async () => {
    if ((await get('/git/ref/heads/main')).object.sha !== sha)
      throw Error('A newer main revision exists; refusing stale deployment');
  };
  await current();
  const deadline = Date.now() + 12 * 60 * 1000;
  while (Date.now() < deadline) {
    const payload = await get(
      `/actions/runs?head_sha=${sha}&event=push&per_page=100`,
    );
    if (!Array.isArray(payload.workflow_runs) || payload.total_count > 100)
      throw Error('Incomplete workflow evidence');
    const checks = assessRuns(payload.workflow_runs, sha);
    console.log(
      checks.map((check) => `${check.file}: ${check.state}`).join('; '),
    );
    if (
      checks.some(
        (check) => !['missing', 'pending', 'success'].includes(check.state),
      )
    )
      throw Error('Required CI failed; deployment blocked');
    if (checks.every((check) => check.state === 'success')) {
      await current();
      console.log(`CI approved main ${sha}`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }
  throw Error('Timed out waiting for required CI; deployment blocked');
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  verify().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
