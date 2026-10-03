import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const accepted = Object.freeze({
  advisory: 'GHSA-ch52-4w7c-c8xp',
  cve: 'CVE-2026-93748',
  url: 'https://github.com/advisories/GHSA-ch52-4w7c-c8xp',
  package: 'http-cache-semantics',
  version: '4.2.0',
  astroVersion: '7.3.4',
  cloudflareVersion: '14.3.3',
});

const expectedVulnerableNodes = new Set([
  'http-cache-semantics',
  'astro',
  '@astrojs/cloudflare',
]);

function fail(message) {
  throw new Error(`Dependency audit failed closed: ${message}`);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function walkTextFiles(directory) {
  const files = [];
  if (!fs.existsSync(directory)) return files;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkTextFiles(absolute));
    } else if (/\.(?:c?js|mjs)$/u.test(entry.name)) {
      files.push(absolute);
    }
  }
  return files;
}

export function assertAcceptedAuditShape(audit) {
  if (!audit || typeof audit !== 'object' || Array.isArray(audit)) {
    fail('npm audit did not return an object');
  }

  const vulnerabilities = audit.vulnerabilities;
  if (!vulnerabilities || typeof vulnerabilities !== 'object') {
    fail('npm audit response has no vulnerability map');
  }

  const names = Object.keys(vulnerabilities);
  if (names.length === 0) return { acceptedException: false };

  for (const name of names) {
    if (!expectedVulnerableNodes.has(name)) {
      fail(`unexpected vulnerable package ${name}`);
    }
  }
  for (const name of expectedVulnerableNodes) {
    if (!(name in vulnerabilities)) {
      fail(`expected advisory chain changed; missing ${name}`);
    }
  }

  const leaf = vulnerabilities[accepted.package];
  const leafAdvisories = Array.isArray(leaf?.via)
    ? leaf.via.filter((entry) => entry && typeof entry === 'object')
    : [];

  if (leafAdvisories.length !== 1) {
    fail('http-cache-semantics advisory set changed');
  }

  const advisory = leafAdvisories[0];
  if (
    advisory.url !== accepted.url ||
    advisory.severity !== 'high' ||
    advisory.name !== accepted.package
  ) {
    fail('the only allowed advisory no longer matches the pinned VEX statement');
  }

  const astroVia = vulnerabilities.astro?.via;
  const cloudflareVia = vulnerabilities['@astrojs/cloudflare']?.via;
  if (!Array.isArray(astroVia) || !astroVia.includes(accepted.package)) {
    fail('Astro advisory path changed');
  }
  if (!Array.isArray(cloudflareVia) || !cloudflareVia.includes('astro')) {
    fail('Cloudflare adapter advisory path changed');
  }

  const counts = audit.metadata?.vulnerabilities;
  if (
    !counts ||
    counts.high !== 3 ||
    counts.critical !== 0 ||
    counts.moderate !== 0 ||
    counts.low !== 0 ||
    counts.info !== 0 ||
    counts.total !== 3
  ) {
    fail('vulnerability counts changed from the single accepted advisory chain');
  }

  return { acceptedException: true };
}

export function assertVexReachability() {
  const packageManifest = readJson('node_modules/http-cache-semantics/package.json');
  const astroManifest = readJson('node_modules/astro/package.json');
  const cloudflareManifest = readJson('node_modules/@astrojs/cloudflare/package.json');

  if (packageManifest.version !== accepted.version) {
    fail(`http-cache-semantics version changed to ${packageManifest.version}`);
  }
  if (astroManifest.version !== accepted.astroVersion) {
    fail(`Astro version changed to ${astroManifest.version}`);
  }
  if (cloudflareManifest.version !== accepted.cloudflareVersion) {
    fail(`Cloudflare adapter version changed to ${cloudflareManifest.version}`);
  }

  const astroDist = path.join(root, 'node_modules/astro/dist');
  const importingFiles = walkTextFiles(astroDist).filter((file) =>
    fs.readFileSync(file, 'utf8').includes('http-cache-semantics'),
  );

  if (importingFiles.length !== 1) {
    fail(`Astro http-cache-semantics usage changed (${importingFiles.length} importing files)`);
  }

  const astroUsage = fs.readFileSync(importingFiles[0], 'utf8');
  if (!astroUsage.includes('.storable()') || !astroUsage.includes('.timeToLive()')) {
    fail('known Astro remote-image TTL usage changed');
  }
  if (
    astroUsage.includes('.evaluateRequest(') ||
    astroUsage.includes('.satisfiesWithoutRevalidation(')
  ) {
    fail('Astro now reaches the vulnerable stale-response reuse API');
  }

  const deployedServer = path.join(root, 'dist/server');
  if (!fs.existsSync(deployedServer)) {
    fail('deployed server build is unavailable for reachability verification');
  }

  for (const file of walkTextFiles(deployedServer)) {
    const source = fs.readFileSync(file, 'utf8');
    if (
      source.includes('http-cache-semantics') ||
      source.includes('satisfiesWithoutRevalidation')
    ) {
      fail(`vulnerable cache implementation reached deployed server output: ${path.relative(root, file)}`);
    }
  }
}

export function evaluateAudit(audit) {
  const classification = assertAcceptedAuditShape(audit);
  if (!classification.acceptedException) return classification;
  assertVexReachability();
  return classification;
}

function main() {
  const result = spawnSync('npm', ['audit', '--audit-level=low', '--json'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.error) fail('npm audit could not execute');

  let audit;
  try {
    audit = JSON.parse(result.stdout);
  } catch {
    fail('npm audit returned malformed JSON');
  }

  const classification = evaluateAudit(audit);
  if (!classification.acceptedException) {
    if (result.status !== 0) fail('npm audit exited nonzero without a classified finding');
    console.log('Dependency audit passed: zero known vulnerabilities.');
    return;
  }

  console.log(
    `Dependency audit passed with VEX ${accepted.cve} / ${accepted.advisory}: ` +
      `${accepted.package}@${accepted.version} is present only behind Astro's build-time remote-image TTL path; ` +
      'the vulnerable stale-response reuse API is not reached and is absent from deployed server output.',
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Dependency audit failed closed');
    process.exitCode = 1;
  }
}
