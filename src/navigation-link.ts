// Shared navigation semantics; each site supplies its own labels and styling.
export function isNavigationActive(
  pathname: string,
  baseUrl: string,
  href: string | URL | null | undefined,
) {
  const path = pathname.replace(baseUrl, '');
  const section = path.match(/[^/]+/g)?.[0] || '';
  return href === path || href === '/' + section;
}
