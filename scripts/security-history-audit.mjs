import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

// Scan every reachable text blob while suppressing any matched credential value.
const execFileAsync = promisify(execFile);
const root = process.cwd();
const maxBytes = 2 * 1024 * 1024;

const detectors = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['aws-access-key', /\bAKIA[0-9A-Z]{16}\b/],
  ['github-token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ['github-pat', /\bgithub_pat_[A-Za-z0-9_]{20,}\b/],
  ['slack-token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ['stripe-live-key', /\bsk_live_[A-Za-z0-9]{16,}\b/],
  ['resend-key', /\bre_[A-Za-z0-9_]{20,}\b/],
  [
    'credential-assignment',
    /\b(?:password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token)\b\s*[:=]\s*['"](?!\$\{|process\.env|import\.meta\.env|example|placeholder|changeme|test|dummy)[^'"\r\n]{12,}['"]/i,
  ],
];

const { stdout } = await execFileAsync(
  'git',
  ['rev-list', '--objects', '--all'],
  { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
);

const objects = new Map();
for (const line of stdout.split('\n')) {
  if (!line) continue;
  const space = line.indexOf(' ');
  if (space < 0) continue;
  const object = line.slice(0, space);
  const path = line.slice(space + 1);
  if (!objects.has(object)) objects.set(object, path);
}

const findings = [];
let scanned = 0;
for (const [object, path] of objects) {
  let type;
  try {
    ({ stdout: type } = await execFileAsync('git', ['cat-file', '-t', object], {
      cwd: root,
      encoding: 'utf8',
    }));
  } catch {
    continue;
  }
  if (type.trim() !== 'blob') continue;

  const { stdout: sizeText } = await execFileAsync(
    'git',
    ['cat-file', '-s', object],
    { cwd: root, encoding: 'utf8' },
  );
  const size = Number(sizeText.trim());
  if (!Number.isFinite(size) || size > maxBytes) continue;

  const { stdout: text } = await execFileAsync(
    'git',
    ['cat-file', '-p', object],
    {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: maxBytes + 1024,
    },
  );
  if (text.includes('\u0000')) continue;
  scanned += 1;

  for (const [label, pattern] of detectors) {
    if (pattern.test(text)) findings.push({ label, path });
  }
}

if (findings.length) {
  console.error(
    `Historical secret audit found ${findings.length} credential-like match(es) across ${scanned} unique text blobs. Values are intentionally suppressed.`,
  );
  for (const finding of findings) {
    console.error(`- ${finding.label}: ${finding.path}`);
  }
  process.exit(1);
}

console.log(
  `Historical secret audit passed: ${scanned} unique text blobs across all reachable refs; ${detectors.length} sanitized detector classes; no credential-like values found.`,
);
