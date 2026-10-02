import { readFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import {
  runLighthouseCommand,
  isRetryableTraceError,
} from './lighthouse-command.mjs';
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
// Separate invocations as well as attempts, so no stale report can be consumed
// and a later run cannot overwrite earlier diagnostic evidence.
const outputDirectory = mkdtempSync(
  `.lighthouseci/${accessibilityOnly ? 'accessibility' : 'quality'}-`,
);
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
    // Trace capture can fail transiently before navigation begins. Allow two
    // bounded trace-only retries; scores and unrelated failures are never retried.
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const output = `${outputDirectory}/route-${index}-sample-${sample}-attempt-${attempt}.json`;
      try {
        runLighthouseCommand([
          'node_modules/lighthouse/cli/index.js',
          url,
          `--only-categories=${Object.keys(thresholds).join(',')}`,
          '--output=json',
          `--output-path=${output}`,
          '--chrome-flags=--headless --no-sandbox',
          '--quiet',
        ]);
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
        break;
      } catch (error) {
        const message = String(error?.message ?? error);
        // Preserve CLI/trace diagnostics even if Lighthouse produced no report.
        writeFileSync(`${output}.error.txt`, message);
        console.error(
          `${url} sample ${sample} attempt ${attempt}: ${message} (diagnostics: ${output})`,
        );
        const retryable = isRetryableTraceError(error);
        if (retryable && attempt < maxAttempts) {
          console.warn(
            `${url} sample ${sample}: transient Lighthouse runtime error; retrying trace capture (${attempt}/${maxAttempts - 1})`,
          );
          continue;
        }
        errors.push(`sample ${sample}: ${message}`);
        console.error(`${url} ${errors.at(-1)}`);
        break;
      }
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
writeFileSync(
  `${outputDirectory}/summary.json`,
  JSON.stringify(summary, null, 2),
);
if (failed) process.exitCode = 1;
