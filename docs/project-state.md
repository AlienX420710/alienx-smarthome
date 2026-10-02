# AlienX — current state

Updated October 1, 2026. This file alone owns findings and dated release
evidence. AGENTS.md owns working rules, [architecture](ai-context.md) owns contracts,
and [operations](release-runbook.md) owns procedures. Do not duplicate status.

## Last verified release

October 1, 2026: main `86c73d6e6fb1b28bdbeffdf0aeab98d180ccd720`
(PR #78) is the last fully verified production release. Exact-main
[Quality 36960633071](https://github.com/AlienX420710/alienx-smarthome/actions/runs/36960633071),
[Responsive 36960633091](https://github.com/AlienX420710/alienx-smarthome/actions/runs/36960633091),
[Accessibility 36960633093](https://github.com/AlienX420710/alienx-smarthome/actions/runs/36960633093),
[Lighthouse 36960633095](https://github.com/AlienX420710/alienx-smarthome/actions/runs/36960633095)
and [Safari 36960633072](https://github.com/AlienX420710/alienx-smarthome/actions/runs/36960633072)
passed. [Push on main 36960632570](https://github.com/AlienX420710/alienx-smarthome/actions/runs/36960632570)
passed CodeQL/current-alert checks; Release Approval 36960918928, Workers Build
`b1cad122-7124-47ae-950e-76a2b72fac2b`,
[Smoke 36960633045](https://github.com/AlienX420710/alienx-smarthome/actions/runs/36960633045)
and [Integrity 36960952839](https://github.com/AlienX420710/alienx-smarthome/actions/runs/36960952839)
passed.

Current main `abeb11c81707a902f8f6f025467b85d45cb24fce` (PR #79)
simplifies the shared Resend transport to one direct provider POST. During this
documentation audit its Workers Build
`2fd87190-5f38-4273-a519-da6fd47e50e2` failed before production verification
completed. Do not count PR #79 as deployed evidence unless a later exact-main
release chain succeeds. The fail-closed deployment result is evidence, not a
reason to weaken the release gate.

## Beta acceptance — incomplete

September 30 local comparison (historical baseline): npm ci, all-severity npm audit (zero findings),
88 unit tests and repository/reachable-history scans passed locally. fast-uri
3.1.8 remains in the lockfile; its previous advisory is remediated, not open work.
Build/browser evidence above is exact-main CI, not a new local browser run.

Do not publish the first GitHub release or claim beta completion while required
acceptance is unresolved. Do not invent a version. Local tests, CI, live revision,
provider acceptance/delivery, inbox receipt and human/device acceptance differ.

| ID     | Disposition                                                | Evidence or remaining acceptance                                                                                                                           |
| ------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AX-001 | Verified at d8bf0d3                                        | Parsed frame/resource CSP checks reject missing and weakened policy.                                                                                       |
| AX-002 | Verified at d8bf0d3 / 4a51a7e                              | Candidate and exact-revision post-Smoke Integrity remain separate.                                                                                         |
| AX-003 | Verified; PR #53 repair deployed                           | Three fixed Lighthouse samples, median performance, minimum other scores; no retry-until-green.                                                            |
| AX-004 | Verified at e69c280                                        | Three obsolete manual CSP hashes removed after emitted-byte mapping.                                                                                       |
| AX-005 | Positive promotion verified; negative drill open           | Real Cloudflare rejection evidence still needed; offline mocks are not account execution.                                                                  |
| AX-006 | Owner/account evidence open                                | Monitored failure-notification receipt and authorized compatible rollback/recovery evidence.                                                               |
| AX-007 | Verified at e69c280                                        | Required sanitized reachable-history scan; heuristic, not exhaustive certification.                                                                        |
| AX-008 | Physical-device evidence open                              | Actual screen reader, keyboard, touch, zoom and theme outcomes; resolve discovered defects.                                                                |
| AX-009 | Partial cleanup plus route consolidation deployed          | PR #77 retired standalone Work/Experience/Lab/Technology routes and owned assets; unreviewed measured dead-CSS/style scope remains open.                    |
| AX-010 | Owner editorial acceptance open; last                      | Factual consolidated homepage/About copy is deployed; no invented clients, results, incorporation or biography.                                            |
| AX-011 | Enforcement verified September 26                          | Ruleset 23059349 requires PR/five Actions checks, strict freshness, no bypass. Desired review-thread setting not confirmed live.                           |
| AX-012 | Verified at e3b8e89                                        | Security/quality policies, all-severity audit, workflow/history gates; operational exceptions remain.                                                      |
| AX-013 | Verified at e3b8e89                                        | Exact-main fresh Actions/JS/TS analyses and zero open code-scanning alerts; private Dependabot/secret inventory is separate.                               |
| AX-014 | Repository tranche verified in PR #47                      | Headers/static checks, sanitized analysis errors/warnings and offline deployment rehearsal; account scope remains open.                                    |
| AX-015 | Verified at f67c91c                                        | Mandatory edge limiter, strict honeypot/Turnstile success and safe logs; not live email proof.                                                             |
| AX-016 | Protocol rejection verified September 29; cipher work open | Both hosts reject TLS 1.0/1.1 and accept 1.2/1.3. Reassess/disposition CBC/RSA heuristics; static-homepage BREACH heuristic is not confirmed exploitation. |
| AX-017 | Transport repaired; live acceptance open                   | PR #78 repaired the pre-provider inquiry failure and PR #79 simplified transport on main; natural heartbeat plus genuine full-form delivery/receipt remain unproved. |

Branch cleanup is unverified. Re-enumerate remotes, confirm each temporary head is
merged before deleting it, and retain active PRs and alienx-ci-approved-main /
alienx-ci-rejected-main tags. Future releases need their own five exact-head gates
and exact-main approval/build/Smoke/Integrity chain.

## Production-readiness priorities

This is a source/CI comparison, not an account-security certification. Finish the
following acceptance before calling beta closed; no generic rewrite is required.

| Priority / finding             | Next action and completion evidence                                                                                                                                                                                                            | Responsible role                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| P1 — AX-017, AX-006            | Correlate a natural scheduled heartbeat with provider delivery and recipient confirmation; verify independent failure-alert receipt. Separately prove the authorized full-form path without bypassing Turnstile or the prior tool rejection.   | Operator/owner with provider access; engineering investigates failures |
| P1 — AX-005, AX-006            | Exercise fail-closed promotion and compatible recovery on an isolated Worker first; retain deployment versions, SHA/bindings/secret compatibility and notification evidence. A documented runbook or mocked rehearsal alone does not close it. | Cloudflare operator + engineering                                      |
| P1 — AX-008                    | Execute the existing real-device/VoiceOver/keyboard/touch/zoom protocol and fix actual failures.                                                                                                                                               | Human tester + engineering                                             |
| P1 — AX-016, AX-012            | Reassess TLS cipher findings and privately verify MFA/recovery, credential scope, WAF and private alerts. Record fixes or justified acceptance; scanner heuristics are not confirmed exploits.                                                 | Account owner/operator                                                 |
| P1 — AX-010, after reliability | Owner accepts factual Work/About content and public contact/privacy expectations.                                                                                                                                                              | Jordan                                                                 |
| P2 — AX-011                    | Live ruleset 23059349 still requires strict five-check PRs and forbids bypass for this connection; review-thread resolution is false. Explicitly accept that choice or enable the desired setting through authorized administration.           | Repo maintainer                                                        |
| P2 — AX-009                    | Limit further CSS/component cleanup to measured defects or dead code; do not treat visual modernization as a security release prerequisite.                                                                                                    | Engineering                                                            |
| P2 — diagnostics               | Retain attempt-specific Lighthouse reports if improving diagnostics: current rmSync/output reuse discards a first-attempt report. Keep trace failures visible and the one-retry ceiling; this does not invalidate passed main checks.          | Engineering                                                            |

Merge/adopt the coordination protocol through [PR #55](https://github.com/AlienX420710/alienx-smarthome/pull/55)
and linked Cleaning PR #28 independently. Both were still open at this review.
Branch cleanup is housekeeping after confirmed merge, not a production blocker.

## Comparison with Cleaning

Peer baseline: Cleaning main `6b154ec319d6728c0764df9f0301c0910fbc4eba`.
Its [local register](https://github.com/Cassileigh/cleaning-by-cassi/blob/main/docs/project-state.md)
owns its remaining work; this table records AlienX's adoption decisions.

| Concern      | Comparison and AlienX disposition                                                                                                                                                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release      | AlienX exact-main deployment is verified; Cleaning main's performance/promotion chain is blocked. Do not copy Cleaning's REST gate or transfer either repo's passing checks.                                                                          |
| Forms        | Both enforce Turnstile, edge limits, bounded payloads, validation and idempotency. AlienX's JSON inquiry and Cleaning's multipart quote/customer confirmation serve different needs; retain both contracts.                                           |
| Lighthouse   | AlienX captures CLI stderr; Cleaning's missing-report path was reproduced as ENOENT before retry. Share PR #53 as evidence, leave the repair to independent Cleaning validation. Fixed three-sample versus single-sample policies remain local.       |
| Mail         | Both schedule 05:00 Chicago using two UTC candidates and bounded retry. AlienX rejects mail redirects and cancels failed response bodies; Cleaning lacks those two explicit behaviors. No automatic transport merge or live test permission transfer. |
| CSP/status   | AlienX uses generated CSP hashes and a richer status view; Cleaning uses external same-origin styles and generic readiness. Neither architecture difference alone proves a vulnerability. Keep local integrity contracts.                             |
| Dependencies | Runtime dependency pins match. Wrangler/Prettier versions, parse5 usage and Undici override scope differ; both current audits are clean. No upgrade solely to make versions identical.                                                                |
| Operations   | Both lack complete current owner/account/device evidence in this review. Shared procedures cannot substitute for each site's receipt/recovery records.                                                                                                |

Review limits: direct read-only requests to both sites' release/status endpoints
returned HTTP 403 from this execution environment, so no fresh live revision is
asserted from those requests. CI/provider checks above are separately attributed.
No provider/mailbox, account, physical-device or complete penetration test was
performed. No new message, schedule, quote or inquiry was sent.

## External evidence boundaries

September 29 SSL.org browser scans on both hosts showed trusted matching
certificates, complete chains and old-protocol rejection. CBC/RSA results remain
heuristics, not confirmed timing attacks. See the pinned scan record below.
Cloudflare bot verification blocked account inspection; no cron activation,
negative deployment or rollback was certified. The prepared manual inquiry was
rejected by automatic approval review and was not sent. Cleanup does not override
that rejection. September 29 provider inspection found no natural heartbeat. October 1 provider
inspection confirmed the sending domain is verified and historical inquiry delivery
through September 26, but found no genuine post-repair production form send during
the verification window. The existing 05:30 health/full-form and 06:00 heartbeat-watch
monitors were observed enabled; configured prompts are not successful execution.
Do not duplicate them.

## Next work and coordination

Resolve live TLS/mail and operational/device evidence first. Modernize components
only for concrete semantics, responsiveness, lifecycle or measured performance.
Work, Experience, Lab and Technology are consolidated into the homepage; do not
recreate standalone destinations without a concrete customer/navigation need.
AlienX is a showcase and possible future business, not an established LLC.

Both owners' chat sessions can work on either repo under the local
[coordination agreement](../AGENTS.md#cross-project-coordination). Each project
owns its own decisions and acceptance; use linked local issues/PRs for tasks.

The former central log is retired. Historical IDs and dispositions remain in the
[final log snapshot](https://github.com/AlienX420710/alienx-smarthome/blob/640062d13e9de63b1160137cc01bfd8f3b2d23bf/docs/chatgpt-communications.md). AX-20260929-shared-brain-01's central-log design is
superseded by equal-repo coordination. AX-20260929-closeout-boundaries-01 remains
covered by local email rules. AX-20260930-cassi-review-received-01 records receipt
of Cleaning PR #26's review, not a fabricated reply; CBC-20260929-handoff-01
remains historically unsent (write 403).

AX-20260929-lighthouse-stderr-01 is reproduced offline as CBC-12; repair and
independent verification remain pending
in [Cleaning's register](https://github.com/Cassileigh/cleaning-by-cassi/blob/main/docs/project-state.md#cross-project-coordination).
AlienX's repair does not prove Cleaning needs or has adopted it. The September 30
Cleaning homepage score failure is separate from the stderr investigation.
Consolidation does not close external, runtime or device acceptance.

## Historical evidence and consolidation map

The pre-cleanup snapshot is pinned to `152abcf087f13628bb31c224edd1c73db49cdacc`. These are historical documents,
not current instructions. Git history is unchanged; every removed file is
recoverable. Read the relevant evidence instead of restoring whole audits to
startup context. The current register retains unresolved findings and failures.

| Previous document                   | Preserved snapshot                                                                                                                            | Current owner                                           |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `README.md`                         | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/README.md)                         | [Repository index](../README.md)                        |
| `ai-audit.md`                       | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/ai-audit.md)                       | This register; detailed history remains in the snapshot |
| `ai-context.md`                     | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/ai-context.md)                     | [ai-context.md](ai-context.md)                          |
| `audit-remediation.md`              | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/audit-remediation.md)              | This register; detailed history remains in the snapshot |
| `beta-closeout.md`                  | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/beta-closeout.md)                  | This register; detailed history remains in the snapshot |
| `cassi-commit-inventory.md`         | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/cassi-commit-inventory.md)         | This register; detailed history remains in the snapshot |
| `chatgpt-communications.md`         | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/chatgpt-communications.md)         | [Coordination](../AGENTS.md#cross-project-coordination) |
| `closeout-2026-09-29.md`            | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/closeout-2026-09-29.md)            | This register; detailed history remains in the snapshot |
| `device-validation.md`              | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/device-validation.md)              | [Operations](release-runbook.md)                        |
| `directory-parity-review.md`        | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/directory-parity-review.md)        | This register; detailed history remains in the snapshot |
| `email-health.md`                   | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/email-health.md)                   | [Operations](release-runbook.md)                        |
| `frontend-pattern-notes.md`         | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/frontend-pattern-notes.md)         | [Contract](ai-context.md)                               |
| `frontend-runtime-audit.md`         | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/frontend-runtime-audit.md)         | [Contract](ai-context.md)                               |
| `inquiry-security-contract.md`      | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/inquiry-security-contract.md)      | [Contract](ai-context.md)                               |
| `media-audit.md`                    | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/media-audit.md)                    | [Contract](ai-context.md)                               |
| `project-state.md`                  | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/project-state.md)                  | [project-state.md](project-state.md)                    |
| `release-runbook.md`                | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/release-runbook.md)                | [release-runbook.md](release-runbook.md)                |
| `security-audit.md`                 | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/security-audit.md)                 | This register; detailed history remains in the snapshot |
| `security-closeout-2026-09-20.md`   | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/security-closeout-2026-09-20.md)   | This register; detailed history remains in the snapshot |
| `security-comparison-2026-09-26.md` | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/security-comparison-2026-09-26.md) | This register; detailed history remains in the snapshot |
| `shared-brain.md`                   | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/shared-brain.md)                   | [Coordination](../AGENTS.md#cross-project-coordination) |
| `shared-lessons.md`                 | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/shared-lessons.md)                 | [Coordination](../AGENTS.md#cross-project-coordination) |

Generated commit inventories are optional research output, not current status or
manual certification. Comparison scripts remain available; use a fresh mirror
and their documented arguments, inspect applicable current changes, and record
only adoption decisions here. Generated ledgers are now gitignored.
