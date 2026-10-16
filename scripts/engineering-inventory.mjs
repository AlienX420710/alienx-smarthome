import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const kinds = new Set([
  'shared',
  'shared-workflow',
  'site-config',
  'site-data',
  'site-template',
  'site-style',
  'site-asset',
  'site-test',
  'adapter',
  'generated',
  'pending',
]);
export function implementationFiles(directory) {
  return [
    ...new Set(
      execFileSync(
        'git',
        [
          'ls-files',
          '--cached',
          '--others',
          '--exclude-standard',
          '-z',
          '--',
          'src',
          'public',
          'scripts',
          'tests',
          '.github',
          '*.json',
          '*.mjs',
          '*.cjs',
          '.gitignore',
          '.prettierignore',
        ],
        { cwd: directory, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
      ).split('\0'),
    ),
  ]
    .filter(
      (file) =>
        file && existsSync(resolve(directory, file)) && !file.endsWith('.md'),
    )
    .sort();
}
const read = (directory, file) => readFileSync(resolve(directory, file));
export function validateInventory(
  directory,
  peer,
  inventory,
  files = implementationFiles(directory),
  complete = false,
) {
  const problems = [];
  const pending = [];
  if (
    inventory.version !== 1 ||
    !inventory.files ||
    Array.isArray(inventory.files)
  )
    throw new Error('Malformed engineering inventory');
  for (const file of files) {
    const entry = inventory.files[file];
    if (
      !entry ||
      !kinds.has(entry.kind) ||
      typeof entry.reason !== 'string' ||
      !entry.reason.trim()
    ) {
      problems.push(`Unclassified implementation: ${file}`);
      continue;
    }
    if (entry.kind === 'pending') {
      pending.push(`${file}: ${entry.reason}`);
      continue;
    }
    if (entry.kind === 'shared') {
      if (
        !existsSync(resolve(peer, file)) ||
        !read(directory, file).equals(read(peer, file))
      )
        problems.push(`Shared implementation drift: ${file}`);
      continue;
    }
    if (entry.kind === 'shared-workflow') {
      const normalize = (buffer, location) => {
        const names = Object.fromEntries(
          files
            .filter((path) => path.startsWith('.github/workflows/'))
            .map((path) => [
              read(location, path)
                .toString('utf8')
                .match(/^name: (.*)$/m)?.[1],
              path,
            ]),
        );
        return buffer
          .toString('utf8')
          .split('\n')
          .map((line) => {
            if (line.startsWith('name: ')) return 'name: SITE Workflow';
            const match = line.match(/^(\s+- )(.*)$/);
            return match && names[match[2]] ? match[1] + names[match[2]] : line;
          })
          .join('\n');
      };
      if (
        !existsSync(resolve(peer, file)) ||
        normalize(read(directory, file), directory) !==
          normalize(read(peer, file), peer)
      )
        problems.push(`Shared workflow drift: ${file}`);
      continue;
    }
    if (entry.kind === 'site-asset') {
      if (/\.(?:js|mjs|cjs|ts|astro|css|json|ya?ml|sh)$/.test(file))
        problems.push(`Executable/config file marked asset: ${file}`);
      continue;
    }
    const source = read(directory, file).toString('utf8');
    if (entry.kind === 'site-template') {
      const scripts = [
        ...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi),
      ];
      if (
        scripts.some(
          ([, attrs, body]) =>
            body.trim() && !/type=["']application\/ld\+json["']/.test(attrs),
        )
      )
        problems.push(`Inline behavior remains in template: ${file}`);
      if (
        /\b(?:addEventListener|fetch|AbortController|localStorage|sessionStorage)\b/.test(
          source,
        )
      )
        problems.push(`Runtime behavior remains in template: ${file}`);
    }
    if (
      entry.kind === 'site-data' &&
      /\b(?:function|async|await|fetch|addEventListener|setTimeout|setInterval|localStorage|sessionStorage)\b/.test(
        source,
      )
    )
      problems.push(`Runtime behavior remains in site data: ${file}`);
    if (entry.kind === 'adapter') {
      if (
        !Array.isArray(entry.engines) ||
        !entry.engines.length ||
        entry.engines.some(
          (engine) => typeof engine !== 'string' || !source.includes(engine),
        )
      )
        problems.push(`Adapter missing explicit engine dependency: ${file}`);
      if (
        /\b(?:fetch|addEventListener|AbortController|setTimeout|setInterval|localStorage|sessionStorage)\b/.test(
          source,
        )
      )
        problems.push(`Unextracted runtime behavior in adapter: ${file}`);
      if (
        file.endsWith('.astro') &&
        [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].some(
          ([, attrs, body]) =>
            body.trim() && !/type=["']application\/ld\+json["']/.test(attrs),
        )
      )
        problems.push(`Inline behavior remains in adapter: ${file}`);
    }
    if (entry.kind === 'site-config') {
      if (!/\.(?:json|webmanifest)$/.test(file))
        problems.push(`Site configuration must be JSON: ${file}`);
      else
        try {
          JSON.parse(source);
        } catch {
          problems.push(`Malformed site configuration: ${file}`);
        }
    }
    if (entry.kind === 'generated' && !Array.isArray(entry.generator))
      problems.push(`Generated file lacks explicit generator: ${file}`);
    if (entry.kind === 'site-test' && !file.startsWith('tests/'))
      problems.push(`Non-test classified as site test: ${file}`);
    if (entry.kind === 'site-style' && !file.endsWith('.css'))
      problems.push(`Non-CSS classified as site style: ${file}`);
  }
  for (const file of Object.keys(inventory.files))
    if (!files.includes(file))
      problems.push(`Stale engineering classification: ${file}`);
  if (complete && pending.length)
    problems.push(`Unresolved engineering extraction: ${pending.join('; ')}`);
  return { problems, pending, files: files.length };
}
export function checkEngineeringInventory(directory, peer, complete = false) {
  const inventory = JSON.parse(read(directory, 'engineering-inventory.json'));
  const result = validateInventory(
    directory,
    peer,
    inventory,
    undefined,
    complete,
  );
  if (result.problems.length) throw new Error(result.problems.join('\n'));
  return result;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const peer = process.argv[2];
  if (!peer)
    throw new Error(
      'Usage: node scripts/engineering-inventory.mjs <peer> [--complete]',
    );
  const result = checkEngineeringInventory(
    root,
    resolve(peer),
    process.argv.includes('--complete'),
  );
  console.log(
    `Engineering inventory: ${result.files} classified; ${result.pending.length} unresolved extraction files.`,
  );
  for (const pending of result.pending) console.log(`Pending: ${pending}`);
}
