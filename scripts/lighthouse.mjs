import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import config from '../lighthouse.config.cjs';
import { assessReports } from './lighthouse-assessment.mjs';

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
const runs = accessibilityOnly ? 1 : config.ci.collect.numberOfRuns;
if (!Number.isInteger(runs) || runs < 1)
  throw new Error('Invalid sample count');
const summary = [];
let failed = false;
for (const [index, url] of config.ci.collect.url.entries()) {
  const reports = [];
  const errors = [];
  // Always collect the fixed set, never stop at the first passing score.
  for (let sample = 1; sample <= runs; sample++) {
    const output = `.lighthouseci/route-${index}-sample-${sample}.json`;
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
      reports.push(report);
      for (const metric of [
        'first-contentful-paint',
        'largest-contentful-paint',
        'total-blocking-time',
        'cumulative-layout-shift',
      ]) {
        const audit = report.audits?.[metric];
        if (audit)
          console.log(
            `${url} sample ${sample} ${metric}: ${audit.numericValue} ${audit.numericUnit}`,
          );
      }
    } catch (error) {
      errors.push(`sample ${sample}: ${error.message}`);
      console.error(`${url} ${errors.at(-1)}`);
    }
  }
  try {
    if (errors.length) throw new Error(errors.join('; '));
    const results = assessReports(reports, thresholds, runs);
    summary.push({ url, runs, results });
    for (const { category, minimum, score, samples, passed } of results) {
      console.log(
        `${url} ${category}: ${score} (${category === 'performance' ? 'median' : 'minimum'} of ${samples.join(', ')}; required ${minimum})`,
      );
      if (!passed) {
        failed = true;
        for (const report of reports) {
          for (const ref of report.categories?.[category]?.auditRefs ?? []) {
            const audit = report.audits?.[ref.id];
            if (audit && typeof audit.score === 'number' && audit.score < 1)
              console.error(`${ref.id}: ${audit.title}`);
          }
        }
      }
    }
  } catch (error) {
    failed = true;
    summary.push({ url, runs, error: error.message });
    console.error(`${url}: ${error.message}`);
  }
}
writeFileSync('.lighthouseci/summary.json', JSON.stringify(summary, null, 2));
if (failed) process.exitCode = 1;
