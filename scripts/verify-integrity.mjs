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
  const response = await request(origin + '/api/status');
  const data = await response.json();
  if (
    !candidate &&
    (!response.ok || data.ok !== true || data.status !== 'operational')
  )
    throw new Error(`${origin}: unhealthy production status`);
  if (
    !/^[a-f0-9]{40}$/.test(data.buildRevision ?? '') ||
    (expected && data.buildRevision !== expected)
  )
    throw new Error(`${origin}: unexpected revision ${data.buildRevision}`);
  return data.buildRevision;
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
  const before = await revision(origin);
  for (const route of routes) {
    const response = await request(origin + route);
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
    if (!(await request(origin + path)).ok)
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
  if (before !== after)
    throw new Error(`${origin}: revision changed during verification`);
  console.log(
    `${candidate ? 'Candidate' : 'Production'} integrity passed: ${origin}; revision ${after}; ${routes.length} routes`,
  );
}
