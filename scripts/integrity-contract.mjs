import { parse } from 'parse5';
import { site } from './site-config.mjs';
import assert from 'node:assert/strict';

export function assertPermissionsPolicy(value) {
  const permissions = new Map();
  for (const entry of (value ?? '').split(',')) {
    const match = /^\s*([a-z-]+)\s*=\s*(\([^)]*\))\s*$/.exec(entry);
    assert.ok(match, 'Malformed Permissions-Policy directive');
    assert.ok(
      !permissions.has(match[1]),
      'Duplicate Permissions-Policy directive',
    );
    permissions.set(match[1], match[2]);
  }
  for (const name of [
    'camera',
    'microphone',
    'geolocation',
    'payment',
    'usb',
    'browsing-topics',
    'display-capture',
  ])
    assert.equal(permissions.get(name), '()', `Permissions-Policy ${name}`);
}

export function assertSecurityHeaders(headers, { status = false } = {}) {
  for (const [name, pattern] of Object.entries({
    'x-permitted-cross-domain-policies': /^none$/i,
    'cross-origin-opener-policy': /^same-origin$/i,
    'x-content-type-options': /^nosniff$/i,
    'x-frame-options': /^DENY$/i,
    'strict-transport-security': /max-age=31536000.*includeSubDomains/i,
    'cross-origin-resource-policy': /^same-origin$/i,
    'referrer-policy': status
      ? /^no-referrer$/
      : /^strict-origin-when-cross-origin$/,
  }))
    assert.match(headers.get(name) ?? '', pattern, name);
  assertPermissionsPolicy(headers.get('permissions-policy'));
  assert.ok(
    (headers.get('content-security-policy') ?? '')
      .split(',')
      .some(
        (policy) =>
          directives(policy).get('frame-ancestors')?.join(' ') === "'none'",
      ),
    'Missing frame-ancestors header protection',
  );
}

export function assertHeaders(
  headers,
  { status = false, candidate = false } = {},
) {
  assertSecurityHeaders(headers, { status });
  const directives = new Map();
  for (const entry of (headers.get('content-security-policy') ?? '').split(
    ';',
  )) {
    const [name, ...values] = entry.trim().split(/\s+/);
    if (!name) continue;
    assert.ok(!directives.has(name), 'Duplicate CSP directive');
    directives.set(name, values);
  }
  const expect = (name, values) =>
    assert.deepEqual(directives.get(name), values, name);
  expect('frame-ancestors', ["'none'"]);
  if (status) {
    expect('default-src', ["'none'"]);
    assert.match(headers.get('cache-control') ?? '', /no-store/);
    return;
  }
  expect('default-src', ["'self'"]);
  expect('base-uri', ["'self'"]);
  expect('object-src', ["'none'"]);
  expect('form-action', ["'self'"]);
  expect('style-src', ["'self'"]);
  expect('font-src', ["'self'"]);
  expect('img-src', ["'self'", 'data:']);
  expect('script-src', ["'self'", 'https://challenges.cloudflare.com']);
  expect('frame-src', ['https://challenges.cloudflare.com']);
  expect('connect-src', ["'self'", 'https://challenges.cloudflare.com']);
  if (candidate)
    assert.ok(
      !directives.has('upgrade-insecure-requests'),
      'HTTP loopback must not upgrade assets',
    );
  else expect('upgrade-insecure-requests', []);
  for (const name of [
    'script-src-elem',
    'script-src-attr',
    'style-src-elem',
    'style-src-attr',
  ])
    assert.ok(!directives.has(name), 'Unexpected script policy override');
}

export function headElements(html) {
  const document = parse(html);
  const root = document.childNodes.find((node) => node.tagName === 'html');
  const head = root?.childNodes.find((node) => node.tagName === 'head');
  return (head?.childNodes ?? [])
    .filter((node) => node.tagName)
    .map((node) => ({
      tag: node.tagName,
      attrs: Object.fromEntries(
        node.attrs.map(({ name, value }) => [name, value]),
      ),
      text: (node.childNodes ?? [])
        .filter((child) => child.nodeName === '#text')
        .map((child) => child.value)
        .join(''),
    }));
}

function directives(policy) {
  const result = new Map();
  for (const part of policy.split(';')) {
    const [name, ...values] = part.trim().split(/\s+/);
    if (!name) continue;
    const key = name.toLowerCase();
    if (result.has(key)) throw new Error(`Duplicate CSP directive: ${key}`);
    result.set(key, values);
  }
  return result;
}

export function assertCsp(header, html) {
  // Header policies are comma-separated; frame-ancestors in a meta is ineffective.
  const headers = (header ?? '')
    .split(',')
    .filter((value) => value.trim())
    .map(directives);
  if (
    !headers.some(
      (policy) => policy.get('frame-ancestors')?.join(' ') === "'none'",
    )
  )
    throw new Error('Missing frame-ancestors header protection');
  const metas = headElements(html)
    .filter(
      ({ tag, attrs }) =>
        tag === 'meta' &&
        attrs['http-equiv']?.toLowerCase() === 'content-security-policy',
    )
    .map(({ attrs }) => directives(attrs.content ?? ''));
  const required = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'form-action': ["'self'"],
    'img-src': site.csp.imageSources,
    'font-src': ["'self'"],
    'connect-src': ["'self'", 'https://challenges.cloudflare.com'],
    'frame-src': ['https://challenges.cloudflare.com'],
  };
  const policies = [...headers, ...metas];
  const isResourcePolicy = (policy) => {
    for (const [name, allowed] of Object.entries(required)) {
      const actual = policy.get(name);
      if (
        !actual ||
        actual.length !== allowed.length ||
        allowed.some((value) => !actual.includes(value))
      )
        return false;
    }
    const scripts = policy.get('script-src');
    const scriptSources = new Set(scripts ?? []);
    const styles = policy.get('style-src');
    const hash = /^'sha(?:256|384|512)-[A-Za-z0-9+/]+={0,2}'$/;
    if (
      !scriptSources.has("'self'") ||
      !scriptSources.has('https://challenges.cloudflare.com') ||
      (site.csp.generatedHashes && !scripts.some((value) => hash.test(value)))
    )
      return false;
    if (
      scripts.some(
        (value) =>
          value !== "'self'" &&
          value !== 'https://challenges.cloudflare.com' &&
          !hash.test(value),
      )
    )
      return false;
    if (
      !styles?.includes("'self'") ||
      styles.some((value) => value !== "'self'" && !hash.test(value))
    )
      return false;
    // These override the general directive; require an explicit contract review.
    if (
      [
        'script-src-elem',
        'script-src-attr',
        'style-src-elem',
        'style-src-attr',
      ].some((name) => policy.has(name))
    )
      return false;
    return true;
  };
  if (!policies.some(isResourcePolicy))
    throw new Error('Missing or weakened resource CSP');
}

export function assertSeo(html, route) {
  const origin = site.origin;
  const elements = headElements(html);
  const meta = (name, attr = 'name') =>
    elements.find(({ tag, attrs }) => tag === 'meta' && attrs[attr] === name)
      ?.attrs.content;
  const canonical = elements.find(
    ({ tag, attrs }) => tag === 'link' && attrs.rel === 'canonical',
  )?.attrs.href;
  const title = elements.find(({ tag }) => tag === 'title')?.text.trim();
  if (!title || !meta('description'))
    throw new Error(`${route}: missing title/description`);
  if (
    canonical !== origin + route ||
    meta('og:url', 'property') !== origin + route
  )
    throw new Error(`${route}: incorrect canonical/og:url`);
  const robots = site.noindexRoutes.includes(route)
    ? 'noindex, follow'
    : 'index, follow';
  if ((meta('robots') || 'index, follow') !== robots)
    throw new Error(`${route}: incorrect robots policy`);
  if (!meta('og:image', 'property')?.startsWith(origin + '/'))
    throw new Error(`${route}: incorrect social image URL`);
}
