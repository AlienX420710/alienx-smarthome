import { site } from './site-config.mjs';
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
  approved: `refs/tags/${site.releaseRefPrefix}-ci-approved-main`,
  rejected: `refs/tags/${site.releaseRefPrefix}-ci-rejected-main`,
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
  if (
    !Array.isArray(checks) ||
    checks.length !== required.length ||
    new Set(checks.map((check) => check?.file)).size !== required.length ||
    checks.some(
      (check) =>
        !required.includes(check?.file) ||
        !['missing', 'pending', 'success'].includes(check?.state),
    )
  )
    return 'rejected';
  return checks.every((check) => check.state === 'success')
    ? 'approved'
    : 'pending';
}
export function classifyReleaseRefs(refs, sha) {
  const approved = refs.get(approvalRefs.approved) === sha;
  const rejected = refs.get(approvalRefs.rejected) === sha;
  if (approved && !rejected) return 'approved';
  if (rejected) return 'rejected';
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

export async function getGitHubJson(
  path,
  { token = process.env.GITHUB_READ_TOKEN?.trim(), fetchImpl = fetch } = {},
) {
  const api = `https://api.github.com/repos/${site.repository}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Cleaning-by-Cassi-release-gate',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let response;
  try {
    response = await fetchImpl(api + path, {
      headers,
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    // Never print request headers, token values, or arbitrary provider errors.
    throw Error('GitHub verification request failed; deployment blocked');
  }
  if (!response.ok) {
    const rateLimited =
      response.status === 429 ||
      (response.status === 403 &&
        (response.headers.get('x-ratelimit-remaining') === '0' ||
          response.headers.has('retry-after')));
    const guidance = rateLimited
      ? 'GitHub API rate limit reached. Wait for the limit to reset before retrying.'
      : response.status === 401 ||
          response.status === 403 ||
          response.status === 404
        ? 'GitHub denied verification access. Check token expiry and repository read permissions.'
        : 'GitHub could not supply release evidence.';
    const auth = token
      ? 'GITHUB_READ_TOKEN is configured (value withheld).'
      : 'Request was unauthenticated. Configure GITHUB_READ_TOKEN as a Cloudflare Build secret with Actions and Contents read access to this repository.';
    throw Error(
      `GitHub verification unavailable: HTTP ${response.status}. ${guidance} ${auth} Deployment blocked.`,
    );
  }
  try {
    return await response.json();
  } catch {
    throw Error('GitHub returned invalid release evidence; deployment blocked');
  }
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

  const remote = `https://github.com/${site.repository}.git`;
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

    const releaseState = classifyReleaseRefs(refs, sha);

    if (releaseState === 'approved') {
      current();
      console.log(`CI approved main ${sha}`);
      return;
    }

    console.log(
      releaseState === 'rejected'
        ? `Exact-revision CI is currently rejected for ${sha}; waiting for corrected rerun evidence`
        : `Waiting for exact-revision CI approval for ${sha}`,
    );
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
