import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import config from '../lighthouse.config.cjs';
import { assessReport } from './lighthouse-assessment.mjs';
import { runLighthouse } from './lighthouse-runner.mjs';
const accessibilityOnly = process.argv.includes('--accessibility');
const thresholds = accessibilityOnly
  ? { accessibility: config.thresholds.accessibility }
  : config.thresholds;
mkdirSync('.lighthouseci', { recursive: true });
const output = mkdtempSync(
  `.lighthouseci/${accessibilityOnly ? 'accessibility' : 'quality'}-`,
);
let failed = false;
const summary = [];
for (const [index, route] of config.routes.entries()) {
  const url = new URL(route, config.origin).href;
  for (let sample = 1; sample <= config.samples; sample++) {
    try {
      const report = runLighthouse({
        outputBase: `${output}/route-${index}-sample-${sample}`,
        args: [
          'node_modules/lighthouse/cli/index.js',
          url,
          `--only-categories=${Object.keys(thresholds).join(',')}`,
          '--output=json',
          '--save-assets',
          '--chrome-flags=--headless --no-sandbox',
          '--quiet',
        ],
      });
      const results = assessReport(report, thresholds, {
        noindex: config.noindexRoutes.includes(route),
      });
      summary.push({ url, sample, results });
      for (const result of results) {
        console.log(
          `${url} sample ${sample} ${result.category}: ${result.score} (minimum ${result.minimum})`,
        );
        if (!result.passed) failed = true;
      }
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
      failed = true;
      summary.push({ url, sample, error: error.message });
      console.error(`${url} sample ${sample}: ${error.message}`);
    }
  }
}
writeFileSync(`${output}/summary.json`, JSON.stringify(summary, null, 2));
if (failed) process.exitCode = 1;
