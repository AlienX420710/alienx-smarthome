const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/status.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
const { parseStatus } = context.exports;
const valid = { status: 'operational', generatedAt: '2026-09-10T12:00:00Z', runtime: 'Cloudflare Workers', summary: 'Configured', requestId: 'test', checks: Object.fromEntries(['worker', 'inquiry', 'turnstile', 'resend'].map(key => [key, { status: 'configured', detail: 'Present' }])) };
test('valid status contract is accepted', () => assert.equal(parseStatus(valid), valid));
for (const value of [null, [], {}, { ...valid, generatedAt: 'bad' }, { ...valid, checks: {} }, { ...valid, checks: { ...valid.checks, worker: null } }, { ...valid, checks: { ...valid.checks, worker: { status: '<script>', detail: 'Bad' } } }]) {
  test('invalid status data fails closed: ' + JSON.stringify(value), () => assert.throws(() => parseStatus(value)));
}
