const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs
  .readFileSync('src/pages/api/status.ts', 'utf8')
  .replace(/^import .*;\n/gm, '');
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
for (const configured of [false, true]) {
  test(`status reports configuration honestly: ${configured}`, async () => {
    const context = {
      exports: {},
      Response,
      crypto,
      __ALIENX_BUILD_SHA__: 'test-revision',
      env: configured
        ? {
            TURNSTILE_SECRET: 'test',
            TURNSTILE_HOSTNAMES: 'example.test',
            RESEND_API_KEY: 'test',
            INQUIRY_RATE_LIMITER: {},
          }
        : {},
    };
    vm.runInNewContext(code, context);
    const response = await context.exports.GET({
      request: new Request('https://example.test/api/status'),
    });
    const data = await response.json();
    assert.equal(response.status, configured ? 200 : 503);
    assert.equal(data.ok, configured);
    assert.equal(
      data.checks.inquiry.status,
      configured ? 'configured' : 'degraded',
    );
    assert.equal(data.buildRevision, 'test-revision');
    assert.equal(
      data.rateLimiting,
      configured ? 'edge-location' : 'isolate-fallback',
    );
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(JSON.stringify(data).includes('TURNSTILE_SECRET'), false);
  });
}
