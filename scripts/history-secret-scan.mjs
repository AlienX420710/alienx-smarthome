import { execFileSync, spawnSync } from 'node:child_process';

const TOOL = 'AlienX history-secret-scan v1';
const MAX_TEXT_BLOB = 2 * 1024 * 1024;
const failures = [];
const scanned = new Set();

const revList = execFileSync('git', ['rev-list', '--objects', '--all'], {
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024,
});

const batch = spawnSync(
  'git',
  ['cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize) %(rest)'],
  {
    input: revList,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  },
);
if (batch.status !== 0) {
  throw new Error(batch.stderr || 'git cat-file batch check failed');
}

const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\bsk_live_[A-Za-z0-9]{16,}\b/,
];

let blobCount = 0;
let textBlobCount = 0;
let skippedLarge = 0;
let skippedBinary = 0;

for (const line of batch.stdout.split('\n')) {
  if (!line) continue;
  const match = line.match(/^([a-f0-9]{40}) (\w+) (\d+)(?: (.*))?$/i);
  if (!match || match[2] !== 'blob') continue;
  const [, sha, , rawSize, path = '(unknown path)'] = match;
  if (scanned.has(sha)) continue;
  scanned.add(sha);
  blobCount += 1;

  if (/(^|\/)\.env(?:\.|$)/i.test(path) && !/(^|\/)\.env\.example$/i.test(path))
    failures.push(`${sha.slice(0, 12)} ${path}: historical environment file`);
  if (/\.(?:pem|key|p12|pfx)$/i.test(path))
    failures.push(`${sha.slice(0, 12)} ${path}: historical key/certificate container`);
  if (/(^|\/)(?:id_rsa|id_ed25519|credentials\.json)$/i.test(path))
    failures.push(`${sha.slice(0, 12)} ${path}: historical credential file`);

  const size = Number(rawSize);
  if (size > MAX_TEXT_BLOB) {
    skippedLarge += 1;
    continue;
  }

  const body = execFileSync('git', ['cat-file', 'blob', sha], {
    encoding: 'buffer',
    maxBuffer: MAX_TEXT_BLOB + 1024,
  });
  if (body.includes(0)) {
    skippedBinary += 1;
    continue;
  }

  textBlobCount += 1;
  const text = body.toString('utf8');
  if (secretPatterns.some((pattern) => pattern.test(text)))
    failures.push(`${sha.slice(0, 12)} ${path}: credential-like material detected`);
}

if (failures.length) {
  console.error(`${TOOL} failed with ${failures.length} finding(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('Potential secret values are intentionally not printed.');
  process.exit(1);
}

console.log(
  `${TOOL} passed: ${blobCount} unique historical blobs inspected; ${textBlobCount} text blobs scanned; ${skippedBinary} binary and ${skippedLarge} >2 MiB blobs skipped from content matching. Sensitive historical filenames were checked across all listed blobs.`,
);
