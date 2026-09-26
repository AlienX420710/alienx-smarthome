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
At that time AlienX's inspected ruleset only protected deletion and
non-fast-forward updates. A fresh API inspection on 2026-09-26 verified that
ruleset `23059349` now also requires PRs and all five checks on an up-to-date
branch, with no bypass. See AX-011 in the canonical register for enforcement
evidence. This records an observed setting change, not a Codex administration action.

## Live code-scanning policy

The follow-up Quality job queries GitHub with only `contents: read` and
`security-events: read` on main pushes. It requires current Actions and
JavaScript/TypeScript analyses for the exact main SHA, complete open-alert
pagination across every tool/severity, and an unchanged main revision before
and after inspection. Missing analysis, API errors and any open alert fail
Quality and therefore prevent release approval. The job has no dependency
install, cache, persisted checkout token, or alert-write permission.

The five PR workflows remain mandatory. The live inventory job is main-only
because it audits the default-branch Security tab; a skipped PR instance is
not represented as live inventory verification. Regression tests cover stale
and missing analyses, errors, pagination, any-severity findings, and main changes.

The desired main ruleset is in `.github/rulesets/main.json`. Its Lighthouse
context is normalized to Cleaning-by-Cassi's `Performance, accessibility, best
practices, and SEO`. Repository rules must be applied through authorized account
administration; committing this file alone does not enable protection.
