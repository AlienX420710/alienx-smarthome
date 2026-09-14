import { assertCsp, assertSeo } from './integrity-contract.mjs';

const candidate = process.argv.includes('--candidate');
const origins = candidate
  ? ['http://127.0.0.1:4321']
  : ['https://alienxsmarthome.com', 'https://www.alienxsmarthome.com'];
const expected = process.env.EXPECTED_REVISION;
if (expected && !/^[a-f0-9]{40}$/.test(expected))
  throw new Error('Invalid expected revision');

const request = (url, options = {}) =>
  fetch(url, { ...options, signal: AbortSignal.timeout(15000) });

const revision = async (origin) => {
  const status = new URL(origin + '/api/status');
  if (!candidate)
    status.searchParams.set(
      '_alienx_revision',
      `${expected ?? 'current'}-${Date.now()}`,
    );
  const response = await request(status, {
    cache: 'no-store',
    headers: candidate
      ? undefined
      : {
          'Cache-Control': 'no-cache, no-store, max-age=0',
          Pragma: 'no-cache',
        },
  });
  const data = await response.json();
  if (
    !candidate &&
    (!response.ok || data.ok !== true || data.status !== 'operational')
  )
    throw new Error(`${origin}: unhealthy production status`);
  if (!/^[a-f0-9]{40}$/.test(data.buildRevision ?? ''))
    throw new Error(`${origin}: invalid revision ${data.buildRevision}`);
  return data.buildRevision;
};

const waitForExpectedRevision = async (origin) => {
  if (candidate || !expected) return revision(origin);

  const deadline = Date.now() + 2 * 60 * 1000;
  let consecutive = 0;
  let last = 'No response';
  while (Date.now() < deadline) {
    try {
      const actual = await revision(origin);
      last = `revision ${actual}`;
      if (actual === expected) {
        consecutive += 1;
        if (consecutive >= 3) return actual;
      } else {
        consecutive = 0;
      }
    } catch (error) {
      consecutive = 0;
      last = error.message;
    }
    console.log(
      `Waiting for stable production revision ${expected} at ${origin}: ${last}; ${consecutive}/3 confirmations`,
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(
    `${origin}: production revision did not stabilize at ${expected}: ${last}`,
  );
};

const productionUrl = (origin, route) => {
  const url = new URL(route, origin);
  if (!candidate)
    url.searchParams.set(
      '_alienx_integrity',
      `${expected ?? 'current'}-${Date.now()}`,
    );
  return url;
};

const routes = [
  '/',
  '/work/',
  '/experience/',
  '/technology/',
  '/status/',
  '/about/',
  '/contact/',
  '/contact/success/',
];
for (const origin of origins) {
  const before = await waitForExpectedRevision(origin);
  for (const route of routes) {
    const response = await request(productionUrl(origin, route), {
      cache: candidate ? undefined : 'no-store',
      headers: candidate
        ? undefined
        : {
            'Cache-Control': 'no-cache, no-store, max-age=0',
            Pragma: 'no-cache',
          },
    });
    if (
      !response.ok ||
      !response.headers.get('content-type')?.includes('text/html')
    )
      throw new Error(`${origin}${route}: expected HTML 200`);
    const html = await response.text();
    try {
      assertCsp(response.headers.get('content-security-policy'), html);
      assertSeo(html, route);
    } catch (error) {
      throw new Error(`${origin}${route}: ${error.message}`);
    }
    const required = {
      'strict-transport-security': /max-age=31536000.*includeSubDomains/i,
      'x-content-type-options': /^nosniff$/i,
      'x-frame-options': /^DENY$/i,
      'referrer-policy': /^strict-origin-when-cross-origin$/i,
      'permissions-policy': /geolocation=\(\).*payment=\(\)/i,
    };
    for (const [name, pattern] of Object.entries(required)) {
      if (!pattern.test(response.headers.get(name) ?? ''))
        throw new Error(`${route}: missing/incorrect ${name}`);
    }
    if (/localhost|127\.0\.0\.1|workers\.dev/i.test(html))
      throw new Error(`${route}: development hostname leaked`);
  }
  for (const path of ['/robots.txt', '/sitemap-index.xml']) {
    if (!(await request(productionUrl(origin, path))).ok)
      throw new Error(`${origin}${path}: unavailable`);
  }
  if (!candidate) {
    const response = await request(origin.replace('https:', 'http:') + '/', {
      redirect: 'manual',
    });
    const location = response.headers.get('location');
    if (
      ![301, 302, 307, 308].includes(response.status) ||
      !location ||
      !origins.some((allowed) => location === allowed + '/')
    )
      throw new Error(`${origin}: incorrect HTTPS redirect`);
  }
  const after = await revision(origin);
  if (expected && after !== expected)
    throw new Error(`${origin}: revision changed during verification to ${after}`);
  if (before !== after)
    throw new Error(`${origin}: revision changed during verification`);
  console.log(
    `${candidate ? 'Candidate' : 'Production'} integrity passed: ${origin}; revision ${after}; ${routes.length} routes`,
  );
}
