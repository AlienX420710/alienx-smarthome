// Conservative repository conventions, not a general YAML parser.
export function workflowFailures(name, text) {
  const active = text
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n');
  const failures = [];
  if (name === 'responsive.yml') {
    for (const control of [
      'EXPECTED_REVISION: ${{ github.sha }}',
      'run: node scripts/verify-integrity.mjs --candidate',
    ])
      if (!active.includes(control))
        failures.push(`Candidate verification requires ${control}`);
    if (/continue-on-error/.test(active))
      failures.push('Candidate verification cannot ignore failures');
  }
  if (
    name === 'production-integrity.yml' &&
    !/github\.event\.workflow_run\.head_repository\.full_name == github\.repository &&/.test(
      active,
    )
  )
    failures.push('workflow_run must verify the originating repository');
  if (
    name === 'safari.yml' &&
    !(
      /run: npm run test:webkit/.test(active) ||
      /^\s*run: npx playwright test [^\n]*tests\/keyboard\.spec\.cjs[^\n]*--browser=webkit/m.test(
        active,
      )
    )
  )
    failures.push(
      'Safari must execute the keyboard and interaction suite in WebKit; real WebKit interactions are required',
    );
  if (name === 'production-integrity.yml') {
    if (
      !active.includes(
        'EXPECTED_REVISION: ${{ github.event.workflow_run.head_sha || github.sha }}',
      ) &&
      !active.includes(
        "EXPECTED_REVISION: ${{ github.event_name == 'workflow_run' && github.event.workflow_run.head_sha || '' }}",
      )
    )
      failures.push('Integrity requires exact workflow-run revision');
    for (const control of [
      'ref: ${{ github.workflow_sha }}',
      'package-manager-cache: false',
      "github.event.workflow_run.head_branch == 'main'",
      "github.event.workflow_run.event == 'push'",
      "github.event.workflow_run.conclusion == 'success'",
    ])
      if (!active.includes(control))
        failures.push(`Integrity requires ${control}`);
    if (
      /^\s*cache:\s*\S/m.test(active) ||
      /uses:\s*actions\/cache/.test(active)
    )
      failures.push('Integrity controller cannot use package caches');
  }
  if (name === 'quality.yml') {
    const block = active.split(/^  code-scanning-policy:\s*$/m)[1] ?? '';
    for (const control of [
      "if: github.event_name == 'push' && github.ref == 'refs/heads/main'",
      'contents: read',
      'security-events: read',
      'ref: ${{ github.sha }}',
      'persist-credentials: false',
      'package-manager-cache: false',
      'GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}',
      'run: node scripts/verify-code-scanning.mjs',
    ])
      if (!block.includes(control))
        failures.push(`Code-scanning policy requires ${control}`);
    if (
      /^\s*cache:\s*\S/m.test(block) ||
      /uses:\s*actions\/cache/.test(block) ||
      /npm (?:ci|install)/.test(block) ||
      /continue-on-error/.test(block)
    )
      failures.push(
        'Code-scanning policy must run without cache, install or ignored failures',
      );
  }
  for (const controller of [
    'production-integrity.yml',
    'release-approval.yml',
    'operator-alert.yml',
  ]) {
    if (
      name === controller &&
      !active.includes(
        'github.event.workflow_run.head_repository.full_name == github.repository',
      )
    )
      failures.push('workflow-run repository origin validation is required');
  }
  if (['production-integrity.yml', 'release-approval.yml'].includes(name)) {
    if (!active.includes('ref: ${{ github.workflow_sha }}'))
      failures.push('trusted workflow controller checkout is required');
    if (/ref:.*github\.event\.workflow_run\./.test(active))
      failures.push('workflow-run source must not be executed');
    if (
      /^\s*cache:\s*\S/m.test(active) ||
      /uses:\s*actions\/cache/.test(active)
    )
      failures.push('privileged verification must not use package caches');
  }
  if (
    name === 'operator-alert.yml' &&
    /uses:|checkout|npm (ci|install)/.test(active)
  )
    failures.push('Operator alerts must not execute source or dependencies');
  if (/secrets\.RESEND_/.test(text))
    failures.push('email credentials belong in the Worker, not Actions');
  if (
    name === 'quality.yml' &&
    !active.includes('node scripts/verify-code-scanning.mjs')
  )
    failures.push('live code-scanning policy is required');
  return failures;
}
