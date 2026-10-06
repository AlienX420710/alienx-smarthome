import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function engine() {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(readFileSync('src/email-health-engine.ts', 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    { exports, console: { info() {} }, setTimeout: (fn) => fn() },
  );
  return exports;
}
for (const status of [400, 401, 403, 422, 429, 500, 503]) {
  for (const cleanup of ['success', 'reject', 'absent']) {
    test(`health HTTP ${status}: ${cleanup} body cleanup preserves retry disposition`, async () => {
      let calls = 0,
        cancellations = 0;
      const { deliverHealth } = engine();
      await assert.rejects(
        deliverHealth('2026-07-15', async () => {
          calls++;
          return {
            ok: false,
            status,
            body:
              cleanup === 'absent'
                ? null
                : {
                    cancel: async () => {
                      cancellations++;
                      if (cleanup === 'reject')
                        throw Error('private cleanup failure');
                    },
                  },
          };
        }),
        /^Error: Daily email health not confirmed by provider$/,
      );
      assert.equal(calls, status === 429 || status >= 500 ? 3 : 1);
      assert.equal(cancellations, cleanup === 'absent' ? 0 : calls);
    });
  }
}
test('invalid current time cannot authorize a scheduled send', () => {
  assert.equal(
    engine().healthDate(Date.parse('2026-07-15T10:00:00Z'), NaN),
    null,
  );
});
