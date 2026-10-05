import { pathToFileURL } from 'node:url';

import { site } from './site-config.mjs';
const repository = site.repository;
const ref = 'refs/heads/main';
const languages = ['actions', 'javascript-typescript'];

export function assessAnalyses(analyses, sha) {
  if (!Array.isArray(analyses))
    throw Error('Invalid code-scanning analysis response');
  const latest = new Map();
  for (const analysis of analyses) {
    if (!analysis || typeof analysis !== 'object' || Array.isArray(analysis))
      throw Error('Invalid CodeQL analysis record');
    if (analysis.tool?.name !== 'CodeQL' || analysis.ref !== ref) continue;
    if (
      typeof analysis.category !== 'string' ||
      !Number.isSafeInteger(analysis.id)
    )
      throw Error('Incomplete CodeQL analysis identity');
    if (
      !latest.has(analysis.category) ||
      latest.get(analysis.category).id < analysis.id
    )
      latest.set(analysis.category, analysis);
  }
  const current = [...latest.values()].filter(
    (analysis) => analysis.commit_sha === sha,
  );
  for (const analysis of current) {
    if (
      analysis.warning != null &&
      (typeof analysis.warning !== 'string' || analysis.warning.trim())
    )
      throw Error('CodeQL analysis reported a warning requiring review');
    if (typeof analysis.error !== 'string' || analysis.error.length)
      throw Error('CodeQL analysis reported an error or missing error status');
    if (
      !Number.isSafeInteger(analysis.results_count) ||
      analysis.results_count < 0
    )
      throw Error('CodeQL analysis is missing its result count');
  }
  const missing = languages.filter(
    (language) =>
      !current.some((analysis) =>
        analysis.category.endsWith(`/language:${language}`),
      ),
  );
  return { ready: missing.length === 0, missing };
}

export function assertNoOpenAlerts(alerts) {
  if (!Array.isArray(alerts))
    throw Error('Invalid code-scanning alert response');
  if (alerts.length)
    throw Error(`Code scanning has ${alerts.length} open alerts on main`);
}

export async function verifyCodeScanning({
  sha,
  token,
  fetcher = fetch,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = Date.now,
} = {}) {
  if (!/^[a-f0-9]{40}$/.test(sha ?? ''))
    throw Error('Expected a full main revision');
  if (!token) throw Error('Read-only code-scanning token is required');
  const api = `https://api.github.com/repos/${repository}`;
  const request = async (path) => {
    let response;
    try {
      response = await fetcher(api + path, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'Shared-security-policy',
        },
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw Error('Code-scanning evidence transport failed');
    }
    if (!response.ok)
      throw Error(
        `Code-scanning evidence request failed: HTTP ${response.status}`,
      );
    try {
      return await response.json();
    } catch {
      throw Error('Invalid code-scanning evidence JSON');
    }
  };
  const list = async (path) => {
    const result = [];
    for (let page = 1; page <= 10; page++) {
      const batch = await request(`${path}&per_page=100&page=${page}`);
      if (!Array.isArray(batch))
        throw Error('Invalid paginated code-scanning evidence');
      result.push(...batch);
      if (batch.length < 100) return result;
    }
    throw Error('Code-scanning evidence exceeds the pagination bound');
  };
  const assertCurrent = async () => {
    if ((await request('/git/ref/heads/main')).object?.sha !== sha)
      throw Error('Main changed; refusing stale security evidence');
  };
  const deadline = now() + 10 * 60 * 1000;
  while (now() < deadline) {
    await assertCurrent();
    // Only fresh analyses can satisfy this gate; older history need not be read.
    const analyses = await request(
      `/code-scanning/analyses?ref=${encodeURIComponent(ref)}&tool_name=CodeQL&sort=created&direction=desc&per_page=100`,
    );
    const evidence = assessAnalyses(analyses, sha);
    if (evidence.ready) {
      // Query all tools and severities. Do not dismiss alerts or filter out old findings.
      assertNoOpenAlerts(
        await list(
          `/code-scanning/alerts?ref=${encodeURIComponent(ref)}&state=open`,
        ),
      );
      await assertCurrent();
      console.log(
        `Code-scanning policy passed: ${sha}; current Actions and JavaScript/TypeScript analyses; 0 open alerts on main`,
      );
      return;
    }
    console.log(
      `Waiting for exact-revision CodeQL analysis: ${evidence.missing.join(', ')}`,
    );
    await wait(10000);
  }
  throw Error('Missing exact-revision CodeQL evidence after bounded wait');
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.env.GITHUB_REPOSITORY !== repository)
    throw Error('Unexpected repository');
  verifyCodeScanning({
    sha: process.env.GITHUB_SHA,
    token: process.env.GITHUB_TOKEN,
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
