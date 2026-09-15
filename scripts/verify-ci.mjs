import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const required = [
  'quality.yml',
  'responsive.yml',
  'accessibility.yml',
  'lighthouse.yml',
  'safari.yml',
];

export const approvalRefs = {
  approved: 'refs/tags/alienx-ci-approved-main',
  rejected: 'refs/tags/alienx-ci-rejected-main',
};

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

export function classifyApproval(checks) {
  const failed = checks.some(
    (check) => !['missing', 'pending', 'success'].includes(check.state),
  );
  if (failed) return 'rejected';
  if (checks.every((check) => check.state === 'success')) return 'approved';
  return 'pending';
}

export function parseRemoteRefs(output) {
  const refs = new Map();
  for (const line of output.trim().split('\n')) {
    if (!line) continue;
    const [sha, ref] = line.trim().split(/\s+/, 2);
    if (/^[a-f0-9]{40}$/.test(sha) && ref) refs.set(ref, sha);
  }
  return refs;
}

export async function verify() {
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  const buildSha =
    process.env.WORKERS_CI_COMMIT_SHA || process.env.GITHUB_SHA || sha;

  if (!/^[a-f0-9]{40}$/.test(sha) || buildSha !== sha) {
    throw Error('Build revision differs from checkout');
  }
  if (
    process.env.WORKERS_CI_BRANCH &&
    process.env.WORKERS_CI_BRANCH !== 'main'
  ) {
    throw Error('Only main may deploy');
  }
  if (
    execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], {
      encoding: 'utf8',
    }).trim()
  ) {
    throw Error('Refusing a modified checkout');
  }

  const remote = 'https://github.com/AlienX420710/alienx-smarthome.git';
  const readRefs = (...refs) =>
    parseRemoteRefs(
      execFileSync('git', ['ls-remote', '--refs', remote, ...refs], {
        encoding: 'utf8',
        timeout: 15000,
      }),
    );

  const current = () => {
    const refs = readRefs('refs/heads/main');
    if (refs.get('refs/heads/main') !== sha) {
      throw Error('A newer main revision exists; refusing stale deployment');
    }
  };

  current();

  const deadline = Date.now() + 12 * 60 * 1000;
  while (Date.now() < deadline) {
    const refs = readRefs(approvalRefs.approved, approvalRefs.rejected);

    if (refs.get(approvalRefs.rejected) === sha) {
      throw Error('Required CI failed; deployment blocked');
    }

    if (refs.get(approvalRefs.approved) === sha) {
      current();
      console.log(`CI approved main ${sha}`);
      return;
    }

    console.log(`Waiting for exact-revision CI approval for ${sha}`);
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
