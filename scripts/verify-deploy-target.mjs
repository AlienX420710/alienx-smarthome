import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const productionWorker = 'alienx-smarthome';
export const generatedConfigPath = 'dist/server/wrangler.json';

export const forbiddenProductionArtifacts = [
  'ops/recovery-drill.enabled',
  'ops/recovery-drill-worker.mjs',
  'scripts/recovery-drill.mjs',
  'wrangler.recovery-drill.json',
];

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function assertWorkerName(value, label) {
  if (value !== productionWorker) {
    throw new Error(
      `${label} targets ${JSON.stringify(value)}; expected ${productionWorker}`,
    );
  }
}

export function verifyDeployTarget(root = process.cwd(), env = process.env) {
  for (const artifact of forbiddenProductionArtifacts) {
    if (existsSync(resolve(root, artifact))) {
      throw new Error(
        `Production deployment blocked: forbidden recovery-drill artifact exists: ${artifact}`,
      );
    }
  }

  const sourceConfigPath = resolve(root, 'wrangler.json');
  if (!existsSync(sourceConfigPath)) {
    throw new Error('Production deployment requires wrangler.json');
  }

  const sourceConfig = readJson(sourceConfigPath, 'wrangler.json');
  assertWorkerName(sourceConfig.name, 'wrangler.json');

  const overrideName = env.WRANGLER_CI_OVERRIDE_NAME;
  if (overrideName !== undefined) {
    assertWorkerName(overrideName, 'WRANGLER_CI_OVERRIDE_NAME');
  }

  const redirectPath = resolve(root, '.wrangler/deploy/config.json');
  if (!existsSync(redirectPath)) {
    console.log(`Verified production deploy target: ${productionWorker}`);
    return { worker: productionWorker, redirected: false };
  }

  const redirect = readJson(redirectPath, '.wrangler/deploy/config.json');
  if (
    !redirect ||
    typeof redirect !== 'object' ||
    Array.isArray(redirect) ||
    typeof redirect.configPath !== 'string' ||
    !redirect.configPath.trim()
  ) {
    throw new Error(
      '.wrangler/deploy/config.json must contain a non-empty configPath',
    );
  }

  const effectiveConfigPath = resolve(
    dirname(redirectPath),
    redirect.configPath,
  );
  const fromRoot = relative(root, effectiveConfigPath);
  if (fromRoot.startsWith('..') || isAbsolute(fromRoot)) {
    throw new Error(
      `Redirected Wrangler configuration escapes the repository: ${effectiveConfigPath}`,
    );
  }
  if (fromRoot !== generatedConfigPath) {
    throw new Error(
      `Unexpected Wrangler redirect target: ${fromRoot}; expected ${generatedConfigPath}`,
    );
  }
  if (!existsSync(effectiveConfigPath)) {
    throw new Error(
      `Redirected Wrangler configuration does not exist: ${effectiveConfigPath}`,
    );
  }

  const effectiveConfig = readJson(
    effectiveConfigPath,
    'redirected Wrangler configuration',
  );
  if (Object.hasOwn(effectiveConfig, 'name')) {
    assertWorkerName(effectiveConfig.name, 'redirected Wrangler configuration');
  }

  console.log(
    `Verified production deploy target: ${productionWorker} via ${fromRoot}`,
  );
  return {
    worker: productionWorker,
    redirected: true,
    configPath: effectiveConfigPath,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    verifyDeployTarget();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
