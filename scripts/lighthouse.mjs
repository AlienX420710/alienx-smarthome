import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import config from '../lighthouse.config.cjs';

// Keep the existing score gates; use the locked Lighthouse CLI directly.
const accessibilityOnly = process.argv.includes('--accessibility');
const thresholds = accessibilityOnly
  ? { accessibility: 0.95 }
  : Object.fromEntries(
      Object.entries(config.ci.assert.assertions).map(([key, [, value]]) => [
        key.replace('categories:', ''),
        value.minScore,
      ]),
    );
mkdirSync('.lighthouseci', { recursive: true });
let failed = false;
for (const [index, url] of config.ci.collect.url.entries()) {
  const output = `.lighthouseci/route-${index}.json`;
  try {
    execFileSync(
      process.execPath,
      [
        'node_modules/lighthouse/cli/index.js',
        url,
        `--only-categories=${Object.keys(thresholds).join(',')}`,
        '--output=json',
        `--output-path=${output}`,
        '--chrome-flags=--headless --no-sandbox',
        '--quiet',
      ],
      { stdio: 'inherit', timeout: 120000 },
    );
    const report = JSON.parse(readFileSync(output, 'utf8'));
    if (report.runtimeError) throw new Error(report.runtimeError.message);
    for (const [category, minimum] of Object.entries(thresholds)) {
      const score = report.categories?.[category]?.score;
      console.log(`${url} ${category}: ${score} (minimum ${minimum})`);
      if (typeof score !== 'number' || score < minimum) {
        failed = true;
        for (const ref of report.categories?.[category]?.auditRefs ?? []) {
          const audit = report.audits?.[ref.id];
          if (audit && typeof audit.score === 'number' && audit.score < 1)
            console.error(`${ref.id}: ${audit.title}`);
        }
      }
    }
  } catch (error) {
    failed = true;
    console.error(`${url}: ${error.message}`);
  }
}
if (failed) process.exitCode = 1;
