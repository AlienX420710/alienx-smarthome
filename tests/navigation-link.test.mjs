import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports = {};
vm.runInNewContext(
  ts.transpileModule(
    readFileSync(new URL('../src/navigation-link.ts', import.meta.url), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText,
  { exports },
);
const { isNavigationActive } = exports;
test('navigation selects its section without marking unrelated links active', () => {
  assert.equal(isNavigationActive('/', '/', '/'), true);
  assert.equal(isNavigationActive('/about/team', '/', '/about'), true);
  assert.equal(isNavigationActive('/about/team', '/', '/'), false);
  assert.equal(isNavigationActive('/about/team', '/', '/contact'), false);
  assert.equal(isNavigationActive('/about-team', '/', '/about'), false);
});
test('navigation preserves configured base paths and absent links', () => {
  assert.equal(
    isNavigationActive('/portfolio/about/team', '/portfolio/', '/about'),
    true,
  );
  assert.equal(isNavigationActive('/about', '/', undefined), false);
});
