import { parse } from 'parse5';

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
    'img-src': ["'self'", 'data:', 'blob:'],
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
      !scripts.some((value) => hash.test(value))
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
  const origin = 'https://alienxsmarthome.com';
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
  const robots =
    route === '/contact/success/' ? 'noindex, follow' : 'index, follow';
  if (meta('robots') !== robots)
    throw new Error(`${route}: incorrect robots policy`);
  if (!meta('og:image', 'property')?.startsWith(origin + '/'))
    throw new Error(`${route}: incorrect social image URL`);
}
