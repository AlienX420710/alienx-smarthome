# Security Audit

Policy reconciled: 2026-09-20. Revision-specific results are in
[project-state.md](project-state.md); proposed PR changes are not production evidence.

## Scope

This audit covers tracked repository content, GitHub Actions workflow configuration, npm dependency declarations/lockfile state, Dependabot coverage, and production release verification behavior. It does not inspect secret values stored in GitHub or Cloudflare because those secret stores are intentionally not readable through the repository.

## Findings

- Production dependencies and development dependencies use exact versions rather than mutable ranges.
- `package-lock.json` is the locked install source used by CI through `npm ci`.
- The Quality workflow runs `npm run audit` (`npm audit --audit-level=low`), including development dependencies.
- Dependabot is configured for both npm and GitHub Actions on a weekly schedule.
- Repository workflows use explicit top-level permission blocks.
- Official actions inspected in the repository are pinned to full commit SHAs rather than tags.
- The only repository workflow that requires a write permission is `release-approval.yml`, which requires `contents: write` to move exact-revision approval/rejection refs. It keeps `actions: read` and checks out with `persist-credentials: false`.
- No tracked `password`, `api_key`, or private-key-header matches were found in the repository code search used for this audit.
- `pull_request_target` is not part of the release model and is prohibited by the automated audit.

## Permanent security gate

`scripts/security-audit.mjs` is now part of the Quality workflow and fails CI when it detects:

- third-party or official GitHub Actions referenced by mutable tags/branches instead of full 40-character commit SHAs;
- a workflow without an explicit top-level `permissions` block;
- `permissions: write-all`, `pull_request_target`, or an unexpected write permission;
- tracked environment/credential/key container files, including Worker `.dev.vars`;
- tracked files that cannot be inspected or read;
- read-only checkouts that retain Git credentials;
- missing repository-origin checks in Release Approval or Production Integrity;
- removal of the real Playwright WebKit suite;
- common private-key or high-confidence token formats in tracked text files;
- non-exact npm dependency versions;
- root dependency drift between `package.json` and `package-lock.json`;
- loss of npm or GitHub Actions Dependabot coverage;
- removal or lowering of the all-severity npm audit from the Quality workflow.

The write-permission allowlist is intentionally narrow. Adding another workflow write scope requires an explicit audit change rather than silently expanding repository privileges.

## Production Integrity sequencing

The previous push-triggered Production Integrity workflow could begin while Cloudflare was still propagating the newly approved Worker. A status request could observe the new revision and a following request could still reach an edge serving the previous revision, producing a temporary red Integrity result during an otherwise valid deployment.

Production Integrity now runs from the successful completion of `AlienX Production Smoke` for a `main` push. Production Smoke already fails closed until the exact pushed revision is healthy in production, so Integrity starts from deployment evidence rather than from the Git push timestamp.

`verify-integrity.mjs` also requires three consecutive confirmations of the expected production revision before beginning the route/security/SEO matrix and cache-busts production verification requests. If the expected SHA does not stabilize, the check still fails. This absorbs normal edge propagation without accepting a stale final deployment.

Scheduled and manual Integrity runs remain available for ongoing production verification and continue to enforce revision consistency, security headers, CSP, SEO contracts, HTTPS redirects, robots/sitemap availability, and development-host leakage checks.

## Residual controls

- GitHub and Cloudflare secret stores should remain the only locations for deployment/service credentials; secret values should never be committed to the repository.
- GitHub's managed code-scanning/CodeQL check remains a separate control from the repository-owned Quality workflow.
- Dependency upgrades should continue through reviewed changes with the full Quality, Responsive, Accessibility/Theme, Lighthouse, and Safari gates before release approval.

## Security and quality policy relationship

[SECURITY.md](../SECURITY.md) defines private vulnerability reporting and scope.
[QUALITY.md](../QUALITY.md) defines merge/release acceptance and evidence.
Neither policy authorizes a bypass or treats configuration presence as operational
verification. Regex-based source checks enforce the repository conventions but
are not a general YAML security parser.

The 2026-09-20 live ruleset comparison found that Cleaning-by-Cassi requires a
pull request and five successful GitHub Actions checks on an up-to-date branch.
AlienX's inspected ruleset only protects deletion and non-fast-forward updates.
Equivalent mandatory PR/check enforcement remains an account-administration gap;
repository CI and deployment rejection do not substitute for merge protection.
No account setting is recorded as changed or verified without an API/dashboard
result. Do not close this gap merely because a PR was voluntarily checked.
