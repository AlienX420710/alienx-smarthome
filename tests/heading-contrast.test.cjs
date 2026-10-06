const { test } = require('node:test');
const assert = require('node:assert/strict');
const { contrast } = require('./heading-contrast.cjs');

test('contrast retains WCAG black/white and low-contrast boundaries', () => {
  assert.equal(contrast([0, 0, 0], [255, 255, 255]), 21);
  assert.equal(contrast([255, 255, 255], [255, 255, 255]), 1);
  assert.ok(contrast([255, 255, 255], [242, 75, 181]) >= 3);
  assert.ok(contrast([33, 22, 49], [67, 16, 143]) < 3);
});
