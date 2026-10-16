import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStatus } from '../public/status-response.js';

const required = ['worker', 'inquiry', 'turnstile', 'resend'];
const valid = {
  status: 'operational',
  generatedAt: '2026-09-10T12:00:00Z',
  runtime: 'Cloudflare Workers',
  summary: 'Configured',
  requestId: 'test',
  checks: Object.fromEntries(
    required.map((key) => [key, { status: 'configured', detail: 'Present' }]),
  ),
};
test('configured UI check identities are validated without rewriting provider-safe data', () => {
  assert.equal(parseStatus(valid, required), valid);
  const alternate = {
    ...valid,
    checks: { delivery: { status: 'degraded', detail: '<img src=x>' } },
  };
  assert.equal(parseStatus(alternate, ['delivery']), alternate);
  assert.throws(() => parseStatus(alternate, required), /Missing status check/);
});
for (const value of [
  null,
  [],
  {},
  { ...valid, generatedAt: 'bad' },
  { ...valid, checks: {} },
  { ...valid, checks: { ...valid.checks, worker: null } },
  {
    ...valid,
    checks: { ...valid.checks, worker: { status: '<script>', detail: 'Bad' } },
  },
  {
    ...valid,
    checks: { ...valid.checks, worker: { status: 'operational', detail: 2 } },
  },
]) {
  test('invalid response fails closed: ' + JSON.stringify(value), () =>
    assert.throws(() => parseStatus(value, required)),
  );
}
