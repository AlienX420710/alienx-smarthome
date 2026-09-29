import { execFileSync } from 'node:child_process';

export function runLighthouseCommand(args) {
  try {
    return execFileSync(process.execPath, args, {
      stdio: ['ignore', 'inherit', 'pipe'],
      timeout: 120000,
    });
  } catch (error) {
    // Inherited stderr appears in Actions logs but is absent from error.message.
    // Preserve it for the existing bounded trace-only retry decision.
    const diagnostic = String(error.stderr ?? '');
    if (diagnostic) process.stderr.write(diagnostic);
    error.message = [error.message, diagnostic].filter(Boolean).join('\n');
    throw error;
  }
}

export function isRetryableTraceError(error) {
  return /NO_NAVSTART|recording the trace over your page load/i.test(
    String(error?.message ?? error),
  );
}
