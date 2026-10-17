export function parseStatus(value, required = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid status response');
  if (
    !['operational', 'degraded'].includes(value.status) ||
    typeof value.generatedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.generatedAt)) ||
    typeof value.runtime !== 'string' ||
    typeof value.summary !== 'string' ||
    typeof value.requestId !== 'string' ||
    !value.checks ||
    typeof value.checks !== 'object' ||
    Array.isArray(value.checks)
  )
    throw new Error('Invalid status response');
  for (const check of Object.values(value.checks)) {
    if (
      !check ||
      typeof check !== 'object' ||
      Array.isArray(check) ||
      !['operational', 'configured', 'degraded'].includes(check.status) ||
      typeof check.detail !== 'string'
    )
      throw new Error('Invalid status check');
  }
  for (const key of required) {
    if (!Object.hasOwn(value.checks, key))
      throw new Error('Missing status check');
  }
  return value;
}
