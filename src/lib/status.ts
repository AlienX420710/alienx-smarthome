export type Check = {
  status: 'operational' | 'configured' | 'degraded';
  detail: string;
};
export type StatusResponse = {
  status: 'operational' | 'degraded';
  generatedAt: string;
  checks: Record<string, Check>;
  runtime: string;
  summary: string;
  requestId: string;
};

export function parseStatus(value: unknown): StatusResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid status response');
  const data = value as Record<string, unknown>;
  if (
    !['operational', 'degraded'].includes(String(data.status)) ||
    typeof data.generatedAt !== 'string' ||
    !Number.isFinite(Date.parse(data.generatedAt)) ||
    typeof data.runtime !== 'string' ||
    typeof data.summary !== 'string' ||
    typeof data.requestId !== 'string' ||
    !data.checks ||
    typeof data.checks !== 'object' ||
    Array.isArray(data.checks)
  )
    throw new Error('Invalid status response');
  for (const check of Object.values(data.checks)) {
    if (
      !check ||
      typeof check !== 'object' ||
      !['operational', 'configured', 'degraded'].includes(check.status) ||
      typeof check.detail !== 'string'
    )
      throw new Error('Invalid status check');
  }
  for (const key of ['worker', 'inquiry', 'turnstile', 'resend']) {
    if (!Object.hasOwn(data.checks, key))
      throw new Error('Missing status check');
  }
  return data as StatusResponse;
}
