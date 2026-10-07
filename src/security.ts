import site from '../engineering.config.json';
const resourcePolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `img-src ${site.csp.imageSources.join(' ')}`,
  "font-src 'self'",
  "style-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  'frame-src https://challenges.cloudflare.com',
  "connect-src 'self' https://challenges.cloudflare.com",
].join('; ');
const securityHeaders = {
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), display-capture=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};
export function secure(
  response: Response,
  statusRoute = false,
  localHttpPreview = false,
) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders))
    headers.set(name, value);
  headers.set(
    'Content-Security-Policy',
    site.csp.headerResources
      ? resourcePolicy + (localHttpPreview ? '' : '; upgrade-insecure-requests')
      : "frame-ancestors 'none'",
  );
  if (
    (statusRoute && site.privateStatus) ||
    response.headers.get('Content-Security-Policy') ===
      "default-src 'none'; base-uri 'none'; frame-ancestors 'none'"
  ) {
    headers.set(
      'Content-Security-Policy',
      "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    );
    headers.set('Referrer-Policy', 'no-referrer');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
