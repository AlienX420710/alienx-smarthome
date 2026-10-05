import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

// Each attempt owns its files. Never interpret an old report as this run's result.
export function runLighthouse({
  command = process.execPath,
  args,
  outputBase,
}) {
  mkdirSync(dirname(outputBase), { recursive: true });
  for (let attempt = 1; attempt <= 3; attempt++) {
    for (const suffix of ['', '.stderr.log', '.stdout.log'])
      rmSync(`${outputBase}-attempt-${attempt}.json${suffix}`, { force: true });
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const output = `${outputBase}-attempt-${attempt + 1}.json`;
    const result = spawnSync(command, [...args, `--output-path=${output}`], {
      encoding: 'utf8',
      timeout: 120000,
      maxBuffer: 8 * 1024 * 1024,
    });
    const stderr = result.stderr ?? '';
    writeFileSync(output + '.stderr.log', stderr);
    writeFileSync(output + '.stdout.log', result.stdout ?? '');
    let report;
    let reportError;
    try {
      report = JSON.parse(readFileSync(output, 'utf8'));
    } catch (error) {
      reportError = error;
    }
    if (
      reportError ||
      report?.runtimeError ||
      result.error ||
      result.signal ||
      result.status !== 0
    )
      writeFileSync(
        output + '.error.txt',
        [
          reportError?.message,
          report?.runtimeError?.message,
          result.error?.message,
          stderr,
        ]
          .filter(Boolean)
          .join('\n'),
      );
    const missing = reportError?.code === 'ENOENT';
    const traceFailure =
      report?.runtimeError?.code === 'NO_NAVSTART' ||
      /NO_NAVSTART|recording the trace over your page load/i.test(
        report?.runtimeError?.message ?? '',
      ) ||
      (missing && /\bNO_NAVSTART\b/.test(stderr));
    // Spawn/timeouts/signals and malformed reports are not retryable. A report
    // with scores must never retry merely because stderr contains a trace token.
    if (!result.error && !result.signal && traceFailure && attempt < 2) {
      console.warn(
        'Retrying NO_NAVSTART trace collection within the two-retry limit; retaining diagnostics',
      );
      continue;
    }
    if (result.error || result.signal || result.status !== 0)
      throw Error(`Lighthouse process failed; see ${output}.stderr.log`);
    if (reportError)
      throw Error(`Lighthouse report missing or malformed: ${output}`);
    if (report?.runtimeError)
      throw Error(`Lighthouse measurement failed: ${output}`);
    return report;
  }
}
