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
