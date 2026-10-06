import { site } from './site-config.mjs';
const expected = process.env.EXPECTED_REVISION;
if (!/^[a-f0-9]{40}$/.test(expected ?? ''))
  throw Error('EXPECTED_REVISION must be a full Git SHA');
const deadline = Date.now() + 15 * 60 * 1000;
while (Date.now() < deadline) {
  try {
    const response = await fetch(
      new URL(`/api/release?_revision=${expected}-${Date.now()}`, site.origin),
      {
        redirect: 'error',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache' },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (response.ok && (await response.json()).revision === expected) {
      console.log(`Verified production revision ${expected}`);
      process.exit(0);
    }
  } catch {}
  console.log(`Waiting for exact production revision ${expected}`);
  await new Promise((resolve) => setTimeout(resolve, 10000));
}
throw Error('Production did not reach the expected revision');
