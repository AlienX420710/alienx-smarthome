import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const marker = join(root, 'ops', 'recovery-drill.enabled');
const evidencePath = join(root, 'dist', 'recovery-drill.json');
const config = join(root, 'wrangler.recovery-drill.json');
const workerName = 'alienx-smarthome-recovery-drill';
const wrangler = join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler',
);

const sha = execFileSync('git', ['rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim();
const shortSha = sha.slice(0, 8);

function command(args) {
  const output = execFileSync(wrangler, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      WRANGLER_SEND_METRICS: 'false',
    },
  });
  process.stdout.write(output);
  return output;
}

function workerUrls(output) {
  return [
    ...output.matchAll(/https:\/\/[^\s)]+\.workers\.dev(?:\/[^\s)]*)?/g),
  ].map((match) => match[0].replace(/[,.]+$/, ''));
}

function requireUrl(output, label) {
  const urls = workerUrls(output);
  const url = urls.at(-1);
  if (!url) throw new Error(`${label} did not return a workers.dev URL`);
  return url;
}

async function requestJson(url, expectedStatus) {
  const response = await fetch(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
    headers: { 'cache-control': 'no-cache' },
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Recovery drill endpoint returned invalid JSON: ${url}`);
  }
  if (response.status !== expectedStatus) {
    throw new Error(
      `Recovery drill endpoint ${url} returned HTTP ${response.status}; expected ${expectedStatus}`,
    );
  }
  if (!body || typeof body !== 'object') {
    throw new Error(`Recovery drill endpoint returned an invalid payload: ${url}`);
  }
  return body;
}

async function pollLive(url, predicate, label) {
  let last;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      last = await requestJson(url, 200);
      if (predicate(last)) return last;
    } catch (error) {
      last = { error: error.message };
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  throw new Error(`${label} did not become live: ${JSON.stringify(last)}`);
}

function deployArgs(state, tag, message) {
  return [
    'deploy',
    '--config',
    config,
    '--var',
    `DRILL_STATE:${state}`,
    '--var',
    `SOURCE_SHA:${sha}`,
    '--tag',
    tag,
    '--message',
    message,
  ];
}

function uploadArgs(state, tag, alias, message) {
  return [
    'versions',
    'upload',
    '--config',
    config,
    '--var',
    `DRILL_STATE:${state}`,
    '--var',
    `SOURCE_SHA:${sha}`,
    '--tag',
    tag,
    '--preview-alias',
    alias,
    '--message',
    message,
  ];
}

async function main() {
  if (!existsSync(marker)) {
    console.log('Recovery drill marker absent; skipping isolated drill.');
    return;
  }
  if (!existsSync(join(root, 'dist'))) {
    throw new Error('Recovery drill requires an existing production build in dist');
  }
  if (!/^[a-f0-9]{40}$/.test(sha)) {
    throw new Error('Recovery drill requires a full source SHA');
  }
  if (
    process.env.WORKERS_CI_BRANCH &&
    process.env.WORKERS_CI_BRANCH !== 'main'
  ) {
    throw new Error('Recovery drill may run only from the approved main build');
  }

  const startedAt = new Date().toISOString();
  const baselineTag = `baseline-${shortSha}`;
  const rejectedTag = `rejected-${shortSha}`;
  const changedTag = `changed-${shortSha}`;

  console.log(`Starting isolated recovery drill for ${sha}`);

  const baselineOutput = command(
    deployArgs(
      'baseline',
      baselineTag,
      `#59 isolated recovery baseline ${sha}`,
    ),
  );
  const workerUrl = requireUrl(baselineOutput, 'Baseline deployment');
  const baseline = await pollLive(
    workerUrl,
    (value) =>
      value.state === 'baseline' &&
      value.sourceSha === sha &&
      typeof value.versionId === 'string' &&
      value.versionId.length > 0,
    'Baseline deployment',
  );

  const rejectedOutput = command(
    uploadArgs(
      'rejected-candidate',
      rejectedTag,
      `rejected-${shortSha}`,
      `#59 intentionally unhealthy candidate ${sha}`,
    ),
  );
  const rejectedUrl = requireUrl(rejectedOutput, 'Rejected candidate upload');
  const rejected = await requestJson(rejectedUrl, 503);
  if (
    rejected.state !== 'rejected-candidate' ||
    rejected.sourceSha !== sha ||
    typeof rejected.versionId !== 'string' ||
    !rejected.versionId
  ) {
    throw new Error('Rejected candidate metadata is incomplete');
  }

  const afterRejected = await pollLive(
    workerUrl,
    (value) => value.versionId === baseline.versionId && value.state === 'baseline',
    'Fail-closed negative promotion check',
  );
  if (afterRejected.versionId === rejected.versionId) {
    throw new Error('Unhealthy candidate was unexpectedly promoted');
  }

  const changedOutput = command(
    uploadArgs(
      'changed',
      changedTag,
      `changed-${shortSha}`,
      `#59 compatible recovery candidate ${sha}`,
    ),
  );
  const changedUrl = requireUrl(changedOutput, 'Changed candidate upload');
  const changedPreview = await requestJson(changedUrl, 200);
  if (
    changedPreview.state !== 'changed' ||
    changedPreview.sourceSha !== sha ||
    typeof changedPreview.versionId !== 'string' ||
    !changedPreview.versionId
  ) {
    throw new Error('Changed candidate metadata is incomplete');
  }

  command([
    'versions',
    'deploy',
    changedPreview.versionId,
    '--config',
    config,
    '--yes',
    '--message',
    `#59 deploy compatible changed version ${sha}`,
  ]);
  const changedLive = await pollLive(
    workerUrl,
    (value) =>
      value.versionId === changedPreview.versionId && value.state === 'changed',
    'Changed deployment',
  );

  command([
    'rollback',
    baseline.versionId,
    '--config',
    config,
    '--message',
    `#59 rollback to isolated baseline ${sha}`,
  ]);
  const recovered = await pollLive(
    workerUrl,
    (value) =>
      value.versionId === baseline.versionId && value.state === 'baseline',
    'Rollback recovery',
  );

  const versions = JSON.parse(
    command(['versions', 'list', '--config', config, '--json']),
  );
  if (!Array.isArray(versions)) {
    throw new Error('Wrangler versions list returned an unexpected payload');
  }
  const serializedVersions = JSON.stringify(versions);
  for (const versionId of [
    baseline.versionId,
    rejected.versionId,
    changedPreview.versionId,
  ]) {
    if (!serializedVersions.includes(versionId)) {
      throw new Error(`Cloudflare version inventory is missing ${versionId}`);
    }
  }

  const evidence = {
    schemaVersion: 1,
    issue: 59,
    sourceSha: sha,
    startedAt,
    completedAt: new Date().toISOString(),
    isolatedWorker: workerName,
    workerUrl,
    productionRoutesTouched: false,
    productionBindingsUsed: false,
    bindingContract: ['CF_VERSION_METADATA'],
    baseline: {
      state: baseline.state,
      versionId: baseline.versionId,
      versionTag: baseline.versionTag,
    },
    negativePromotion: {
      candidateState: rejected.state,
      candidateVersionId: rejected.versionId,
      candidateVersionTag: rejected.versionTag,
      candidateUrl: rejectedUrl,
      candidateHttpStatus: 503,
      promoted: false,
      liveVersionAfterRejection: afterRejected.versionId,
      failClosed: afterRejected.versionId === baseline.versionId,
    },
    compatibleChange: {
      versionId: changedLive.versionId,
      versionTag: changedLive.versionTag,
      liveState: changedLive.state,
    },
    recovery: {
      action: 'wrangler rollback',
      targetVersionId: baseline.versionId,
      recoveredVersionId: recovered.versionId,
      recoveredState: recovered.state,
      verified: recovered.versionId === baseline.versionId,
    },
  };

  await mkdir(join(root, 'dist'), { recursive: true });
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`Recovery drill passed; evidence staged at ${evidencePath}`);
}

main().catch((error) => {
  console.error(`Recovery drill failed: ${error.message}`);
  process.exitCode = 1;
});
