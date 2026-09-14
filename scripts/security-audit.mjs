import { execFile } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const failures = [];
const workflowDirectory = join(root, '.github', 'workflows');
const allowedWritePermissions = new Map([
  ['release-approval.yml', new Set(['contents'])],
]);

const fail = (message) => failures.push(message);
const indentOf = (line) => line.match(/^\s*/)?.[0].length ?? 0;

const { stdout } = await execFileAsync('git', ['ls-files', '-z'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});
const trackedFiles = stdout.split('\0').filter(Boolean);
const workflowFiles = trackedFiles.filter((file) =>
  /^\.github\/workflows\/[^/]+\.ya?ml$/i.test(file),
);

if (workflowFiles.length === 0) fail('No GitHub Actions workflows found.');

for (const file of workflowFiles) {
  const text = await readFile(join(root, file), 'utf8');
  const name = basename(file);

  if (!/^permissions:\s*$/m.test(text))
    fail(`${file}: missing explicit top-level permissions block`);
  if (/^\s*pull_request_target\s*:/m.test(text))
    fail(`${file}: pull_request_target is prohibited`);
  if (/^\s*permissions:\s*write-all\s*$/m.test(text))
    fail(`${file}: write-all permissions are prohibited`);

  for (const match of text.matchAll(/^\s*uses:\s*['"]?([^\s#'"]+)/gm)) {
    const action = match[1];
    if (action.startsWith('./') || action.startsWith('docker://')) continue;
    const separator = action.lastIndexOf('@');
    const ref = separator >= 0 ? action.slice(separator + 1) : '';
    if (!/^[a-f0-9]{40}$/i.test(ref))
      fail(`${file}: action must be pinned to a full commit SHA: ${action}`);
  }

  const lines = text.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const permissions = lines[index].match(/^(\s*)permissions:\s*$/);
    if (!permissions) continue;
    const parentIndent = permissions[1].length;
    for (let child = index + 1; child < lines.length; child += 1) {
      const line = lines[child];
      if (!line.trim()) continue;
      const indent = indentOf(line);
      if (indent <= parentIndent) break;
      if (indent !== parentIndent + 2) continue;
      const scope = line.trim().match(/^([\w-]+):\s*(read|write|none)\s*$/);
      if (!scope || scope[2] !== 'write') continue;
      const allowed = allowedWritePermissions.get(name);
      if (!allowed?.has(scope[1]))
        fail(`${file}: unexpected write permission for ${scope[1]}`);
    }
  }
}

for (const file of trackedFiles) {
  if (/(^|\/)\.env(?:\.|$)/i.test(file) && !/(^|\/)\.env\.example$/i.test(file))
    fail(`${file}: tracked environment file is prohibited`);
  if (/\.(?:pem|key|p12|pfx)$/i.test(file))
    fail(`${file}: tracked key/certificate container is prohibited`);
  if (/(^|\/)(?:id_rsa|id_ed25519|credentials\.json)$/i.test(file))
    fail(`${file}: tracked credential file is prohibited`);

  let info;
  try {
    info = await stat(join(root, file));
  } catch {
    continue;
  }
  if (info.size > 2 * 1024 * 1024) continue;

  let text;
  try {
    text = await readFile(join(root, file), 'utf8');
  } catch {
    continue;
  }
  if (text.includes('\u0000')) continue;

  const secretPatterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
    /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
    /\bsk_live_[A-Za-z0-9]{16,}\b/,
  ];
  if (secretPatterns.some((pattern) => pattern.test(text)))
    fail(`${file}: credential-like material detected`);
}

const packageJson = JSON.parse(
  await readFile(join(root, 'package.json'), 'utf8'),
);
const packageLock = JSON.parse(
  await readFile(join(root, 'package-lock.json'), 'utf8'),
);
if (packageLock.lockfileVersion !== 3)
  fail(
    `package-lock.json: expected lockfileVersion 3, got ${packageLock.lockfileVersion}`,
  );

const dependencies = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
};
for (const [name, version] of Object.entries(dependencies)) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version))
    fail(`package.json: ${name} must use an exact version, got ${version}`);
}

const rootLock = packageLock.packages?.[''] ?? {};
for (const section of ['dependencies', 'devDependencies']) {
  const declared = packageJson[section] ?? {};
  const locked = rootLock[section] ?? {};
  if (JSON.stringify(declared) !== JSON.stringify(locked))
    fail(`package-lock.json: root ${section} does not match package.json`);
}

const dependabot = await readFile(
  join(root, '.github', 'dependabot.yml'),
  'utf8',
);
for (const ecosystem of ['npm', 'github-actions']) {
  if (!new RegExp(`package-ecosystem:\\s*${ecosystem}`).test(dependabot))
    fail(`.github/dependabot.yml: missing ${ecosystem} updates`);
}

const qualityWorkflow = await readFile(
  join(workflowDirectory, 'quality.yml'),
  'utf8',
);
if (!/npm audit --audit-level=high/.test(qualityWorkflow))
  fail('.github/workflows/quality.yml: high-severity npm audit is required');

if (failures.length) {
  console.error('Repository security audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Repository security audit passed: ${workflowFiles.length} workflows, ${trackedFiles.length} tracked files, exact dependency pins, lockfile sync, Dependabot coverage, and secret-pattern checks.`,
);
