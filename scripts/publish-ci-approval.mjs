import { assessRuns, approvalRefs, classifyApproval } from './verify-ci.mjs';

const sha = process.env.APPROVAL_SHA ?? '';
const token = process.env.GITHUB_TOKEN ?? '';
const repository = process.env.GITHUB_REPOSITORY ?? '';

if (!/^[a-f0-9]{40}$/.test(sha))
  throw Error('APPROVAL_SHA must be a full Git SHA');
if (!token) throw Error('GITHUB_TOKEN is required');
if (repository !== 'AlienX420710/alienx-smarthome') {
  throw Error(`Unexpected repository: ${repository || '(missing)'}`);
}

const api = `https://api.github.com/repos/${repository}`;
const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'User-Agent': 'AlienX-release-approval',
  'X-GitHub-Api-Version': '2022-11-28',
};

const request = async (path, options = {}) => {
  const response = await fetch(api + path, {
    ...options,
    headers: {
      ...headers,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    signal: AbortSignal.timeout(15000),
  });

  if (response.status === 404 && options.allow404) return null;
  if (!response.ok) {
    throw Error(
      `GitHub approval API failed: ${options.method ?? 'GET'} ${path} HTTP ${response.status}`,
    );
  }
  if (response.status === 204) return null;
  return response.json();
};

const currentMain = (await request('/git/ref/heads/main')).object.sha;
if (currentMain !== sha) {
  console.log(`Skipping obsolete CI result for ${sha}; main is ${currentMain}`);
  process.exit(0);
}

const payload = await request(
  `/actions/runs?head_sha=${sha}&event=push&per_page=100`,
);
if (!Array.isArray(payload.workflow_runs) || payload.total_count > 100) {
  throw Error('Incomplete workflow evidence');
}

const checks = assessRuns(payload.workflow_runs, sha);
console.log(checks.map((check) => `${check.file}: ${check.state}`).join('; '));
const decision = classifyApproval(checks);

const shortRef = (fullRef) => fullRef.replace(/^refs\//, '');

const readRef = async (fullRef) =>
  request(`/git/ref/${shortRef(fullRef)}`, { allow404: true });

const deleteRef = async (fullRef) => {
  if (!(await readRef(fullRef))) return;
  await request(`/git/refs/${shortRef(fullRef)}`, {
    method: 'DELETE',
  });
};

const setRef = async (fullRef, targetSha) => {
  const existing = await readRef(fullRef);
  if (existing?.object?.sha === targetSha) return;
  if (existing) {
    await request(`/git/refs/${shortRef(fullRef)}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: targetSha, force: true }),
    });
    return;
  }
  await request('/git/refs', {
    method: 'POST',
    body: JSON.stringify({ ref: fullRef, sha: targetSha }),
  });
};

if (decision === 'rejected') {
  await deleteRef(approvalRefs.approved);
  await setRef(approvalRefs.rejected, sha);
  console.log(`Published CI rejection for ${sha}`);
} else if (decision === 'approved') {
  await deleteRef(approvalRefs.rejected);
  await setRef(approvalRefs.approved, sha);
  console.log(`Published CI approval for ${sha}`);
} else {
  console.log(
    `CI evidence for ${sha} is still pending; no release ref published`,
  );
}
