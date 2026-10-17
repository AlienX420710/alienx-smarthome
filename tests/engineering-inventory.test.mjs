import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateInventory } from '../scripts/engineering-inventory.mjs';

function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), 'engineering-inventory-'));
  const local = join(directory, 'local');
  const peer = join(directory, 'peer');
  mkdirSync(local);
  mkdirSync(peer);
  const put = (root, file, text) => {
    mkdirSync(join(root, file, '..'), { recursive: true });
    writeFileSync(join(root, file), text);
  };
  try {
    run({ local, peer, put });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
const manifest = (files) => ({ version: 1, files });

test('inventory fails on omitted new implementation and stale classifications', () =>
  fixture(({ local, peer }) => {
    const result = validateInventory(
      local,
      peer,
      manifest({ 'deleted.ts': { kind: 'pending', reason: 'removed' } }),
      ['new.ts'],
    );
    assert.match(result.problems.join('\n'), /Unclassified.*new.ts/);
    assert.match(result.problems.join('\n'), /Stale.*deleted.ts/);
  }));

test('shared classification compares exact bytes and requires peer file', () =>
  fixture(({ local, peer, put }) => {
    put(local, 'engine.js', 'same');
    put(peer, 'engine.js', 'different');
    const result = validateInventory(
      local,
      peer,
      manifest({ 'engine.js': { kind: 'shared', reason: 'engine' } }),
      ['engine.js'],
    );
    assert.match(result.problems.join('\n'), /Shared implementation drift/);
  }));

test('templates cannot hide inline client behavior under content', () =>
  fixture(({ local, peer, put }) => {
    put(
      local,
      'page.astro',
      '<script>document.addEventListener("click",()=>{})</script>',
    );
    const result = validateInventory(
      local,
      peer,
      manifest({ 'page.astro': { kind: 'site-template', reason: 'copy' } }),
      ['page.astro'],
    );
    assert.match(result.problems.join('\n'), /Inline behavior remains/);
  }));

test('adapters require named engine and reject independently managed lifecycle', () =>
  fixture(({ local, peer, put }) => {
    put(local, 'adapter.js', 'createEngine(); setTimeout(()=>{},100);');
    const result = validateInventory(
      local,
      peer,
      manifest({
        'adapter.js': {
          kind: 'adapter',
          reason: 'config',
          engines: ['createEngine'],
        },
      }),
      ['adapter.js'],
    );
    assert.match(result.problems.join('\n'), /Unextracted runtime behavior/);
  }));

test('known mixed-code gaps remain explicit and prevent complete parity claim', () =>
  fixture(({ local, peer }) => {
    const inventory = manifest({
      'route.ts': {
        kind: 'pending',
        reason: 'HTTP response orchestration remains',
      },
    });
    assert.equal(
      validateInventory(local, peer, inventory, ['route.ts']).pending.length,
      1,
    );
    assert.match(
      validateInventory(
        local,
        peer,
        inventory,
        ['route.ts'],
        true,
      ).problems.join('\n'),
      /Unresolved engineering extraction/,
    );
  }));

test('executable files cannot be relabeled as assets', () =>
  fixture(({ local, peer }) => {
    const result = validateInventory(
      local,
      peer,
      manifest({ 'engine.js': { kind: 'site-asset', reason: 'image' } }),
      ['engine.js'],
    );
    assert.match(
      result.problems.join('\n'),
      /Executable\/config file marked asset/,
    );
  }));

for (const closing of [
  '</script >',
  '</script\n>',
  '</script\t>',
  '</script/>',
  '</script data-ignored>',
  '</ScRiPt >',
  '',
]) {
  for (const kind of ['site-template', 'adapter']) {
    test(`${kind} rejects inline script with browser-parsed closing ${JSON.stringify(closing)}`, () =>
      fixture(({ local, peer, put }) => {
        put(
          local,
          'page.astro',
          `<script data-label="quoted > character">window.independent = true;${closing}`,
        );
        const result = validateInventory(
          local,
          peer,
          manifest({
            'page.astro': {
              kind,
              reason: 'site view',
              ...(kind === 'adapter' ? { engines: ['independent'] } : {}),
            },
          }),
          ['page.astro'],
        );
        assert.match(result.problems.join('\n'), /Inline behavior remains/);
      }));
  }
}

test('HTML parsing permits inert JSON data and external scripts without mistaking comments for behavior', () =>
  fixture(({ local, peer, put }) => {
    put(
      local,
      'page.astro',
      '<!-- <script>window.fake = true;</script > --><script src="/shared-engine.js"></script ><script type="application/ld+json">{"name":"Site"}</script >',
    );
    const result = validateInventory(
      local,
      peer,
      manifest({
        'page.astro': {
          kind: 'site-template',
          reason: 'site data and common engine imports',
        },
      }),
      ['page.astro'],
    );
    assert.deepEqual(result.problems, []);
  }));

test('nested template content is inspected for independent script behavior', () =>
  fixture(({ local, peer, put }) => {
    put(
      local,
      'page.astro',
      '<template><script>window.independent = true;</script ></template>',
    );
    const result = validateInventory(
      local,
      peer,
      manifest({
        'page.astro': { kind: 'site-template', reason: 'site template' },
      }),
      ['page.astro'],
    );
    assert.match(result.problems.join('\n'), /Inline behavior remains/);
  }));
