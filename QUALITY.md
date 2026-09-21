# Quality and release policy

Changes use scoped pull requests under the standing authorization in
[AGENTS.md](AGENTS.md). `main` remains the production branch. Review the complete
diff and current PR head before merging; use the expected head SHA so a changed
PR cannot be merged using older evidence. Never force-push main.

## Mandatory acceptance

All five repository workflows must succeed for the exact current PR head:

| Workflow                                   | Required coverage                                                                                                                             |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| AlienX Quality                             | Locked install, source and history security audits, formatting, unit tests, build, type checks, Worker dry run, all-severity dependency audit |
| AlienX Responsive Compatibility            | Candidate security/SEO contract, viewport matrix, navigation, interactions and keyboard regression tests                                      |
| AlienX Accessibility & Theme Compatibility | Light/dark accessibility and Lighthouse accessibility                                                                                         |
| AlienX Lighthouse Quality                  | Committed performance, accessibility, best-practices and SEO thresholds                                                                       |
| AlienX Safari Compatibility                | Native SafariDriver and real Playwright WebKit navigation and keyboard interactions                                                           |

Missing, pending, skipped, cancelled, timed-out or failed required evidence is
not approval. Investigate the actual cause of failures. Do not skip tests, lower
thresholds, remove required checks or rerun repeatedly to manufacture a pass.
Keep fixed Lighthouse sample aggregation and retained diagnostic artifacts.

Keyboard tests use actual Tab, Shift+Tab, Enter, Space and Escape. Controls must
be reachable, visibly focused and operable. Preserve semantic controls, real
URLs and the multi-page architecture. Explicit zero tab indices on links keep
them in document order even when macOS WebKit does not tab to ordinary links;
do not introduce positive tab indices or synthetic focus to make tests pass.

## Production acceptance

After merge, verify the resulting full main SHA through Release Approval,
Cloudflare Workers Build, Production Smoke, then Production Integrity.
Successful PR checks or a healthy older deployment do not prove the new release.
Integrity remains a post-Smoke check, never a pre-deploy circular dependency.
Release approval must validate exact-SHA evidence and trusted repository origin.

Preserve CSP, inquiry validation, Turnstile, rate limits, idempotency, exact
dependency/action pins, read-only checkouts and fail-closed deployment. Quality
audits include development dependencies at the low-severity threshold. Keep
full reachable-history scanning; never print credential values in diagnostics.

## Findings and evidence

[docs/project-state.md](docs/project-state.md) owns finding status. Record the
full revision, dated evidence and remaining limits before closing a finding.
Distinguish local tests, CI, deployment, provider delivery, recipient receipt,
account settings and real-device accessibility. A written policy, passing mock,
or enabled configuration alone does not establish operational verification.

[SECURITY.md](SECURITY.md) owns private vulnerability reporting. Account-level
required PR/check protection, alert delivery, recovery drills and real email
delivery require their own evidence; keep unavailable verification explicitly
open. Hold AX-010 content work until the security/reliability closeout is complete.
