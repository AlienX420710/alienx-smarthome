export function assessReports(reports, thresholds, expectedRuns) {
  if (
    !Number.isInteger(expectedRuns) ||
    expectedRuns < 1 ||
    reports.length !== expectedRuns
  )
    throw new Error('Incomplete Lighthouse sample set');
  for (const report of reports) {
    if (!report || report.runtimeError)
      throw new Error('Lighthouse measurement failed');
  }
  return Object.entries(thresholds).map(([category, minimum]) => {
    const samples = reports.map(
      (report) => report.categories?.[category]?.score,
    );
    if (
      samples.some(
        (score) =>
          typeof score !== 'number' ||
          !Number.isFinite(score) ||
          score < 0 ||
          score > 1,
      )
    )
      throw new Error(`Invalid Lighthouse score: ${category}`);
    const sorted = [...samples].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const score =
      category === 'performance'
        ? sorted.length % 2
          ? sorted[middle]
          : (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[0];
    return { category, minimum, samples, score, passed: score >= minimum };
  });
}
