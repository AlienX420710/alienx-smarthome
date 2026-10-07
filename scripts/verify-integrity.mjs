import { site } from './site-config.mjs';
import { pathToFileURL } from 'node:url';
import {
  assertCsp,
  assertSeo,
  assertHeaders,
  assertSecurityHeaders,
} from './integrity-contract.mjs';

export async function verifyIntegrity({
  expected,
  candidate = false,
  fetcher = fetch,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = Date.now,
  log = console.log,
} = {}) {
  if (!/^[a-f0-9]{40}$/.test(expected ?? ''))
    throw Error('An exact expected revision is required');
  const origins = candidate
    ? ['http://127.0.0.1:4321']
    : [site.origin, site.origin.replace('https://', 'https://www.')];
  const routes = site.routes;
  const request = (origin, path, options = {}) => {
    const url = new URL(path, origin);
    url.searchParams.set('_integrity', expected + '-' + now());
    return fetcher(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache' },
      signal: AbortSignal.timeout(15000),
      redirect: 'error',
      ...options,
    });
  };
  const revision = async (origin) => {
    const response = await request(origin, '/api/release');
    if (!response.ok || (await response.json()).revision !== expected)
      throw Error('Production revision differs from expected main');
  };
  for (const origin of origins) {
    let consecutive = 0;
    const required = candidate ? 1 : 3;
    const deadline = now() + 120000;
    while (consecutive < required && now() < deadline) {
      try {
        await revision(origin);
        consecutive++;
      } catch {
        consecutive = 0;
      }
      if (candidate && consecutive === 0)
        throw Error('Candidate revision mismatch');
      if (consecutive < required) await wait(2000);
    }
    if (consecutive < required)
      throw Error('Production revision did not stabilize');
    for (const route of routes) {
      const response = await request(origin, route);
      if (
        !response.ok ||
        !response.headers.get('content-type')?.includes('text/html')
      )
        throw Error(route + ': expected successful HTML response');
      const html = await response.text();
      if (site.csp.headerResources)
        assertHeaders(response.headers, { candidate });
      else {
        assertSecurityHeaders(response.headers);
        assertCsp(response.headers.get('content-security-policy'), html);
      }
      assertSeo(html, route);
      if (!candidate && /localhost|127\.0\.0\.1|workers\.dev/i.test(html))
        throw Error(route + ': development host leakage');
      if (
        route === site.form.route &&
        site.form.widget &&
        !html.includes(site.form.widget)
      )
        throw Error('Wrong Turnstile widget');
      if (
        site.noindexRoutes.includes(route) &&
        !/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(
          html,
        )
      )
        throw Error('Receipt must not be indexed');
    }
    const status = await request(origin, '/api/status');
    assertHeaders(status.headers, { status: true });
    const release = await request(origin, '/api/release');
    if (site.csp.headerResources) assertHeaders(release.headers, { candidate });
    else assertSecurityHeaders(release.headers);
    // Read-only error path: never submit a quote or send mail.
    const missing = await request(origin, '/__integrity_missing_page');
    if (missing.status !== 404) throw Error('Missing route must return 404');
    if (site.csp.headerResources) assertHeaders(missing.headers, { candidate });
    else assertSecurityHeaders(missing.headers);
    for (const path of site.assets) {
      const asset = await request(origin, path);
      if (!asset.ok) throw Error(path + ': asset unavailable');
      assertSecurityHeaders(asset.headers);
    }
    const data = await status.json();
    if (
      !(candidate
        ? (status.status === 503 && data.ok === false) ||
          (status.status === 200 && data.ok === true)
        : status.status === 200 && data.ok === true) ||
      (site.privateStatus
        ? data.scope !== 'configuration-readiness'
        : !['operational', 'degraded'].includes(data.status))
    )
      throw Error('Readiness degraded');
    if (!candidate) {
      const redirect = await fetcher(origin.replace('https:', 'http:') + '/', {
        redirect: 'manual',
        signal: AbortSignal.timeout(15000),
      });
      if (
        ![301, 302, 307, 308].includes(redirect.status) ||
        !origins.some(
          (allowed) => redirect.headers.get('location') === allowed + '/',
        )
      )
        throw Error('Invalid HTTPS redirect');
    }
    await revision(origin);
    log(
      `${candidate ? 'Candidate' : 'Production'} integrity passed: ` +
        origin +
        '; revision ' +
        expected,
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const args = process.argv.slice(2);
  if (args.length > 1 || args.some((arg) => arg !== '--candidate'))
    throw Error('Only --candidate is supported; production is the default');
  let expected = process.env.EXPECTED_REVISION;
  if (!expected && !args.includes('--candidate')) {
    const response = await fetch(new URL('/api/release', site.origin), {
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw Error('Release metadata unavailable');
    expected = (await response.json()).revision;
  }
  await verifyIntegrity({
    expected,
    candidate: args.includes('--candidate'),
  });
}
