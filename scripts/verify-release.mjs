// Read-only release verification. A healthy older deployment is not a successful release.
const expected = process.env.EXPECTED_REVISION;
if (!/^[a-f0-9]{40}$/.test(expected ?? ''))
  throw new Error('EXPECTED_REVISION must be a full Git SHA');
const deadline = Date.now() + 5 * 60 * 1000;
let last = 'No response';
while (Date.now() < deadline) {
  try {
    const response = await fetch('https://alienxsmarthome.com/api/status', {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    if (
      response.ok &&
      data.ok === true &&
      data.status === 'operational' &&
      data.buildRevision === expected
    ) {
      console.log(
        `Verified healthy production revision ${expected}; rate limiting: ${data.rateLimiting}`,
      );
      process.exit(0);
    }
    last = `HTTP ${response.status}; revision ${data.buildRevision ?? 'missing'}; status ${data.status ?? 'missing'}`;
  } catch (error) {
    last = error.message;
  }
  console.log(`Waiting for production: ${last}`);
  await new Promise((resolve) => setTimeout(resolve, 10000));
}
throw new Error(`Production did not become healthy at ${expected}: ${last}`);
