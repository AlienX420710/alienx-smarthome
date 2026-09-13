const test = require('node:test');
const assert = require('node:assert/strict');

test('Lighthouse median tolerates one timing outlier but rejects repeated slow samples', async () => {
  const { assessReports } =
    await import('../scripts/lighthouse-assessment.mjs');
  const reports = (scores) =>
    scores.map((score) => ({ categories: { performance: { score } } }));
  assert.equal(
    assessReports(reports([0.82, 0.96, 0.95]), { performance: 0.85 }, 3)[0]
      .passed,
    true,
  );
  assert.equal(
    assessReports(reports([0.82, 0.83, 1]), { performance: 0.85 }, 3)[0].passed,
    false,
  );
});

test('Lighthouse never averages away accessibility defects or missing measurement evidence', async () => {
  const { assessReports } =
    await import('../scripts/lighthouse-assessment.mjs');
  const reports = [1, 0.9, 1].map((score) => ({
    categories: { accessibility: { score } },
  }));
  assert.equal(
    assessReports(reports, { accessibility: 0.95 }, 3)[0].passed,
    false,
  );
  assert.throws(() =>
    assessReports(reports.slice(1), { accessibility: 0.95 }, 3),
  );
  for (const bad of [null, NaN, Infinity, -1, 2, '1']) {
    assert.throws(() =>
      assessReports(
        [{ categories: { performance: { score: bad } } }],
        { performance: 0.85 },
        1,
      ),
    );
  }
  assert.throws(() =>
    assessReports(
      [{ runtimeError: { message: 'failed' } }],
      { performance: 0.85 },
      1,
    ),
  );
});
