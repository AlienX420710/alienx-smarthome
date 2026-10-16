import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

// Read objects only: never check out, import, or execute reference code.
export function inventory(reference, date, options) {
  const {
    referenceRepository,
    referenceTitle,
    siteTitle,
    requestContract,
    wrapper,
    outputFile,
    mirrorName,
  } = options;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(referenceRepository))
    throw new Error('Invalid reference repository');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    throw new Error('Use a YYYY-MM-DD UTC date');
  function git(...args) {
    try {
      return execFileSync(
        'git',
        ['--no-replace-objects', '--git-dir', resolve(reference), ...args],
        {
          maxBuffer: 128 * 1024 * 1024,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: {
            ...process.env,
            GIT_NO_LAZY_FETCH: '1',
            GIT_TERMINAL_PROMPT: '0',
          },
        },
      );
    } catch {
      throw new Error('Reference history read failed; output suppressed');
    }
  }
  const lines = (...args) =>
    git(...args)
      .toString('utf8')
      .trim()
      .split('\n')
      .filter(Boolean);
  if (lines('rev-parse', '--is-shallow-repository')[0] !== 'false')
    throw new Error('A complete, non-shallow mirror is required');
  const refs = lines('for-each-ref', '--format=%(refname) %(objectname)');
  if (refs.some((ref) => ref.startsWith('refs/replace/')))
    throw new Error('Replacement refs are not supported');
  const main = lines('rev-parse', '--verify', 'refs/heads/main^{commit}')[0];
  const commits = lines('rev-list', '--all', '--topo-order');
  const mainHistory = new Set(lines('rev-list', main));
  const branches = new Set(lines('rev-list', '--branches'));
  const pulls = refs
    .filter((ref) => ref.startsWith('refs/pull/'))
    .map((ref) => ref.split(' ')[0]);
  const pullHistory = new Set(pulls.length ? lines('rev-list', ...pulls) : []);
  const clean = (value) =>
    value
      .replace(/[&<>|`\[\]\\]/g, (c) => `&#${c.charCodeAt(0)};`)
      .replace(/[\x00-\x1f\x7f]/g, ' ');
  const rows = commits.map((sha) => {
    const parents =
      lines('show', '-s', '--format=%P', sha)[0]?.split(' ') ?? [];
    const comparison = parents.length ? [parents[0], sha] : [sha];
    const options = [
      'diff-tree',
      '--root',
      '-r',
      '--no-commit-id',
      '--no-ext-diff',
      '--no-textconv',
      '--no-renames',
    ];
    const paths = git(...options, '--name-only', '-z', ...comparison)
      .toString('utf8')
      .split('\0')
      .filter(Boolean);
    const patch = git(
      ...options,
      '-p',
      '--full-index',
      '--no-color',
      '--diff-algorithm=myers',
      '--no-indent-heuristic',
      '--src-prefix=a/',
      '--dst-prefix=b/',
      ...comparison,
    );
    const digest = createHash('sha256').update(patch).digest('hex');
    const areas = [];
    if (paths.some((p) => /email|mail|cron|scheduled/i.test(p)))
      areas.push('[Mail acceptance](project-state.md)');
    if (paths.some((p) => /quote|middleware|pages\/api|lib\/status/.test(p)))
      areas.push(`[Request contract](${requestContract})`);
    if (paths.some((p) => /workflows|release|verify-ci|integrity/.test(p)))
      areas.push('[Release controls](release-runbook.md)');
    if (
      paths.some((p) =>
        /tests\/|security|audit|package|lock|astro.config|wrangler/.test(p),
      )
    )
      areas.push(
        '[Security/test parity](project-state.md#historical-evidence-and-consolidation-map)',
      );
    if (paths.some((p) => /docs\/|README|AGENTS/.test(p)))
      areas.push('[Local evidence](project-state.md)');
    if (!areas.length)
      areas.push('Site-specific UI/assets; applicability not established');
    const scope = mainHistory.has(sha)
      ? 'main'
      : branches.has(sha)
        ? 'branch-only'
        : pullHistory.has(sha)
          ? 'retained PR ref'
          : 'tag/other ref';
    const subject = git('show', '-s', '--format=%s', sha)
      .toString('utf8')
      .trim();
    return `| [${sha.slice(0, 9)}](https://github.com/${referenceRepository}/commit/${sha}) | ${scope} | ${clean(subject)} | ${paths.length} | ${areas.join('; ')} | \`${digest}\` |`;
  });
  return `# ${referenceTitle} reachable-history inventory

Snapshot date (UTC): ${date}. Reference main: \`${main}\`.

${commits.length} unique commits reachable from the observed mirror refs; ${mainHistory.size} reachable from main.

This is ${siteTitle} reference review of ${referenceTitle} [reference evidence](https://github.com/${referenceRepository}/blob/${main}/docs/project-state.md).
The mirror includes advertised branches, tags and retained pull-request refs where available.
Deleted/unreachable objects and private refs are outside this inventory. Branch/PR-only work is not main or production evidence.

Every row reads a complete first-parent diff locally (root commits compare with the empty tree), counts changed paths, and hashes the exact raw diff bytes with SHA-256. Merge parents also appear independently when reachable. Binary changes are represented by Git diff metadata, not decoded asset inspection. No diff content, email addresses, or credential matches are published. Read failures abort generation rather than silently truncate a patch.

The review-area column is **automated path-based triage**, not a per-commit adoption verdict, secret scan, or manual review of every historical line. Current adoption decisions live in the [directory parity review](project-state.md#historical-evidence-and-consolidation-map); exact ${siteTitle} verification and open findings live in [project state](project-state.md). Current mail acceptance belongs to the register, not this generated report. Neither this inventory nor reference CI certifies ${siteTitle} production.

## Regeneration

Use a fresh public mirror (do not execute reference code):

\`\`\`bash
git clone --mirror https://github.com/${referenceRepository}.git /tmp/${mirrorName}
node scripts/${wrapper} /tmp/${mirrorName} ${date}
npx prettier --write docs/${outputFile}
\`\`\`

Use a new destination if the mirror directory already exists. Supply the actual UTC snapshot date, compare new refs/commits, inspect applicable current source changes, and update project-state.md separately. The generator does not fetch or attest that an existing mirror is fresh. It requires non-shallow history and rejects replacement refs. The output does not enumerate paths per commit; follow each full-SHA link for its changed-file detail. Digest reproduction requires the same Git diff behavior/options; formatting the Markdown does not change patch digests.

## Observed refs

${refs.map((ref) => '- ' + clean(ref)).join('\n')}

## Every reachable commit

| Commit | Scope | Subject | Changed files | ${siteTitle} review area (not adoption evidence) | Patch digest (SHA-256) |
| --- | --- | --- | ---: | --- | --- |
${rows.join('\n')}
`;
}

export async function runInventoryCli(moduleUrl, options) {
  const { pathToFileURL } = await import('node:url');
  if (
    !process.argv[1] ||
    moduleUrl !== pathToFileURL(resolve(process.argv[1])).href
  )
    return;
  try {
    const date =
      process.argv[3] ||
      (options.defaultDate ? new Date().toISOString().slice(0, 10) : '');
    if (!process.argv[2] || !date)
      throw new Error('Provide a fresh mirror and UTC snapshot date');
    const report = inventory(process.argv[2], date, options);
    const { writeFileSync } = await import('node:fs');
    writeFileSync(new URL(`../docs/${options.outputFile}`, moduleUrl), report);
    console.log(
      'Reference inventory generated; reference code was not executed.',
    );
  } catch {
    console.error(
      'Reference inventory failed; no successful inventory claimed. Check mirror completeness and arguments.',
    );
    process.exitCode = 1;
  }
}
