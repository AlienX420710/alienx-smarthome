import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('scheduled/manual smoke cannot cancel push release evidence', () => {
  const smoke = readFileSync('.github/workflows/production-smoke.yml', 'utf8');
  const group = smoke.match(/^  group: (.+)$/m)?.[1];
  assert.equal(
    group,
    'production-smoke-${{ github.event_name }}-${{ github.sha }}',
  );
  const key = (event, sha) =>
    group
      .replace('${{ github.event_name }}', event)
      .replace('${{ github.sha }}', sha);
  assert.equal(
    new Set(
      ['push', 'schedule', 'workflow_dispatch'].map((event) =>
        key(event, 'same-sha'),
      ),
    ).size,
    3,
  );
  assert.notEqual(key('push', 'old-sha'), key('push', 'new-sha'));
  assert.match(smoke, /cancel-in-progress: true/);
  assert.match(smoke, /EXPECTED_REVISION: \$\{\{ github.sha \}\}/);
  const integrity = readFileSync(
    '.github/workflows/production-integrity.yml',
    'utf8',
  );
  assert.match(integrity, /github.event.workflow_run.event == 'push'/);
});

test('body inherits the root canvas instead of resolving a second palette', () => {
  const canvas = readFileSync('src/styles/site-canvas.css', 'utf8');
  assert.match(
    canvas,
    /html\s*\{[^}]*background: var\(--site-canvas, #ffffff\)/,
  );
  assert.match(canvas, /body\s*\{[^}]*background: inherit/);
});
