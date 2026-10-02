# AlienX — current state

Updated October 2, 2026. This file alone owns findings and dated release
evidence. AGENTS.md owns working rules, [architecture](ai-context.md) owns contracts,
and [operations](release-runbook.md) owns procedures. Do not duplicate status.

## Last verified release

October 2, 2026: main `fea0fdff4797a77afed6dd8e0d9521fa4b80c0ee`
(PR #91) is the latest fully verified production application release. Exact-main
[Quality 37075217968](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37075217968),
[Responsive 37075217941](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37075217941),
[Accessibility 37075217977](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37075217977),
[Lighthouse 37075217955](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37075217955)
and [Safari 37075217920](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37075217920)
passed. [Push on main 37075217613](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37075217613)
passed CodeQL, and Quality passed the current-alert policy. Release Approval
37075477543 and Workers Build `62a334e2-f73d-4bc8-a9a1-3831ff519bea`
(version `112241cf-cd9b-41b1-b7af-f10c6b90bcec`) succeeded.
[Push Smoke 37075217950](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37075217950)
verified this exact healthy revision at 23:01:20Z, followed by
[Integrity 37075529551](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37075529551).
The separate skipped integrity invocation from scheduled smoke is not release evidence.

This release includes the working customer inquiry transport with natural heartbeat
and recipient receipt evidence, the functional command-palette Escape control from
PR #88, and PR #89's error-shell correction. Error routes now retain their
server-declared `data-alienx-page="error"` state through preference application and
use the same outer site background as the primary experience in explicit light,
explicit dark, system light and system dark. The branded error terminal, noindex
policy, reduced-motion behavior and recovery semantics remain unchanged.
PR #91 extends the correct error identity to retired route URLs, removes their
obsolete themes, and preserves Lighthouse diagnostics across attempts/invocations.

## October 2 fresh review and scoped engineering closeout

Base main `adb8d5d9f5af7a0bfd074e44eaf119ecd5bcff1d` (documentation closeout
PR #90) passed all five current push workflows, CodeQL/current-alert policy,
Release Approval 37060481928, Workers Build
`527d3078-ae65-4751-bb65-bf4fef611d97` (version
`9f5872cf-210c-4a78-aeac-23fc02254284`), Smoke 37059979712 and
Integrity 37060590181; scheduled Integrity 37071337299 also passed.
The initial fresh review found review-thread resolution disabled. After the
owner's October 2 settings change (saved at 18:26:41 America/Chicago), the
connector independently verified ruleset 23059349 with
`required_review_thread_resolution: true`.
The rule remains active on the default branch and still requires PRs, all five
existing checks attributed to GitHub Actions (integration 15368), strict freshness,
no deletion/force-push, an empty bypass list and `current_user_can_bypass: never`.
This satisfies #63 / AX-011's live-setting acceptance. The owner's standing
no-interactive-GitHub-login instruction is now maintained in AGENTS.md.
Fresh local baseline checks passed: locked install, formatting, 94 unit tests,
source and reachable-history audits (988 text blobs), zero dependency findings,
zero type errors/warnings, build and Worker dry run. Direct live inspection from
this environment was blocked by DNS resolution; CI evidence is separate.

PR #91 completed the scoped engineering work for #64/#65, with all five PR
gates and the exact-main production chain above. Updated local checks passed
103 unit tests, formatting, source audit, zero type errors/warnings, build and
Worker dry run. Local browser installation failed with a truncated archive;
actual browser coverage passed in CI and is not presented as local execution:

- Removed 76 selector entries used only by retired Work/Experience/Technology
  page identities (7,275 source CSS bytes), plus three obsolete preference route
  mappings. Active components, theme overrides and reduced-motion rules remain.
  Obsolete mappings could overwrite the server error identity for those URLs;
  unit and four-theme browser coverage now include the retired routes.
- Retained Lighthouse reports by invocation and attempt, including error text when
  the CLI writes no report. Fixed sample counts and score budgets remain unchanged.
  PR #93's initial Lighthouse run 37078004491 then hit two consecutive
  `NO_NAVSTART` trace-recording errors on `/about/` sample 2 while Wrangler served
  the route with HTTP 200 and every completed score met its committed budget. The
  runner therefore allows at most two retries (three total attempts) only for
  recognized trace-capture errors. Score failures, missing reports and unrelated
  errors still fail without retry; executable runner tests cover single-retry
  recovery, two-retry recovery and the bounded ceiling.

This tranche does not certify all CSS as unused or close account, physical-device,
owner-content, recovery or alert-receipt acceptance. Issues #58–#62 remain open.

## Beta acceptance — incomplete

September 30 local comparison (historical baseline): npm ci, all-severity npm audit (zero findings),
88 unit tests and repository/reachable-history scans passed locally. fast-uri
3.1.8 remains in the lockfile; its previous advisory is remediated, not open work.
Build/browser evidence above is exact-main CI, not a new local browser run.

Do not publish the first GitHub release or claim beta completion while required
acceptance is unresolved. Do not invent a version. Local tests, CI, live revision,
provider acceptance/delivery, inbox receipt and human/device acceptance differ.

| ID     | Disposition                                                | Evidence or remaining acceptance                                                                                                                                                                                 |
| ------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AX-001 | Verified at d8bf0d3                                        | Parsed frame/resource CSP checks reject missing and weakened policy.                                                                                                                                             |
| AX-002 | Verified at d8bf0d3 / 4a51a7e                              | Candidate and exact-revision post-Smoke Integrity remain separate.                                                                                                                                               |
| AX-003 | Verified; PR #53 repair deployed                           | Three fixed Lighthouse samples, median performance, minimum other scores; no retry-until-green.                                                                                                                  |
| AX-004 | Verified at e69c280                                        | Three obsolete manual CSP hashes removed after emitted-byte mapping.                                                                                                                                             |
| AX-005 | Positive promotion verified; negative drill open           | Real Cloudflare rejection evidence still needed; offline mocks are not account execution.                                                                                                                        |
| AX-006 | Owner/account evidence open                                | Mail receipt is now proven; failure-notification receipt and authorized compatible rollback/recovery evidence remain open.                                                                                       |
| AX-007 | Verified at e69c280                                        | Required sanitized reachable-history scan; heuristic, not exhaustive certification.                                                                                                                              |
| AX-008 | Physical-device evidence open                              | Actual screen reader, keyboard, touch, zoom and theme outcomes; resolve discovered defects.                                                                                                                      |
| AX-009 | Scoped cleanup verified in PR #91                          | PR #77 consolidated routes; PR #91 removed 76 exclusive retired-route selectors and obsolete mappings. Active/dynamic theme and component behavior remains covered.                                              |
| AX-010 | Owner editorial acceptance open; last                      | Factual consolidated homepage/About copy is deployed; no invented clients, results, incorporation or biography.                                                                                                  |
| AX-011 | Enforcement reverified October 2                           | Ruleset 23059349 requires PR/five Actions checks, strict freshness, no bypass. Required review-thread resolution is enabled; owner save at 18:26:41 America/Chicago subsequently verified through the connector. |
| AX-012 | Verified at e3b8e89                                        | Security/quality policies, all-severity audit, workflow/history gates; operational exceptions remain.                                                                                                            |
| AX-013 | Verified at e3b8e89                                        | Exact-main fresh Actions/JS/TS analyses and zero open code-scanning alerts; private Dependabot/secret inventory is separate.                                                                                     |
| AX-014 | Repository tranche verified in PR #47                      | Headers/static checks, sanitized analysis errors/warnings and offline deployment rehearsal; account scope remains open.                                                                                          |
| AX-015 | Verified at f67c91c                                        | Mandatory edge limiter, strict honeypot/Turnstile success and safe logs; not live email proof.                                                                                                                   |
| AX-016 | Protocol rejection verified September 29; cipher work open | Both hosts reject TLS 1.0/1.1 and accept 1.2/1.3. Reassess/disposition CBC/RSA heuristics; static-homepage BREACH heuristic is not confirmed exploitation.                                                       |
| AX-017 | Mail path proven; failure alert open                       | Natural heartbeat and authorized full-form provider delivery plus recipient receipt are proven; independent failure-alert receipt remains open.                                                                  |

Branch cleanup is unverified. Re-enumerate remotes, confirm each temporary head is
merged before deleting it, and retain active PRs and alienx-ci-approved-main /
alienx-ci-rejected-main tags. Future releases need their own five exact-head gates
and exact-main approval/build/Smoke/Integrity chain.

## Production-readiness priorities

This is a source/CI comparison, not an account-security certification. Finish the
following acceptance before calling beta closed; no generic rewrite is required.

| Priority / finding             | Next action and completion evidence                                                                                                                                                                                                            | Responsible role                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| P1 — AX-017, AX-006            | Verify an independent safe failure condition produces the expected ChatGPT/operator alert; heartbeat and authorized full-form delivery/receipt are now proven.                                                                                 | Operator/owner with provider access; engineering investigates failures |
| P1 — AX-005, AX-006            | Exercise fail-closed promotion and compatible recovery on an isolated Worker first; retain deployment versions, SHA/bindings/secret compatibility and notification evidence. A documented runbook or mocked rehearsal alone does not close it. | Cloudflare operator + engineering                                      |
| P1 — AX-008                    | Execute the existing real-device/VoiceOver/keyboard/touch/zoom protocol and fix actual failures.                                                                                                                                               | Human tester + engineering                                             |
| P1 — AX-016, AX-012            | Reassess TLS cipher findings and privately verify MFA/recovery, credential scope, WAF and private alerts. Record fixes or justified acceptance; scanner heuristics are not confirmed exploits.                                                 | Account owner/operator                                                 |
| P1 — AX-010, after reliability | Owner accepts factual Work/About content and public contact/privacy expectations.                                                                                                                                                              | Jordan                                                                 |

AlienX adopted the coordination protocol through [PR #55](https://github.com/AlienX420710/alienx-smarthome/pull/55)
on September 30. The linked Cleaning PR #28 remains independently owned;
this review does not certify the peer project's current release state.
Branch cleanup is housekeeping after confirmed merge, not a production blocker.

## Comparison with Cleaning

Peer baseline: Cleaning main `6b154ec319d6728c0764df9f0301c0910fbc4eba`.
Its [local register](https://github.com/Cassileigh/cleaning-by-cassi/blob/main/docs/project-state.md)
owns its remaining work; this table records AlienX's adoption decisions.

| Concern      | Comparison and AlienX disposition                                                                                                                                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release      | AlienX exact-main deployment is verified; Cleaning main's performance/promotion chain is blocked. Do not copy Cleaning's REST gate or transfer either repo's passing checks.                                                                                           |
| Forms        | Both enforce Turnstile, edge limits, bounded payloads, validation and idempotency. AlienX's JSON inquiry and Cleaning's multipart quote/customer confirmation serve different needs; retain both contracts.                                                            |
| Lighthouse   | AlienX captures CLI stderr; Cleaning's missing-report path was reproduced as ENOENT before retry. Share PR #53 as evidence, leave the repair to independent Cleaning validation. Fixed three-sample versus single-sample policies remain local.                        |
| Mail         | Both schedule 05:00 Chicago using two UTC candidates and bounded retry. Both use a direct Resend request with the platform's default redirect behavior; sender, recipient, payload and confirmation contracts remain project-local. No live test permission transfers. |
| CSP/status   | AlienX uses generated CSP hashes and a richer status view; Cleaning uses external same-origin styles and generic readiness. Neither architecture difference alone proves a vulnerability. Keep local integrity contracts.                                              |
| Dependencies | Runtime dependency pins match. Wrangler/Prettier versions, parse5 usage and Undici override scope differ; both current audits are clean. No upgrade solely to make versions identical.                                                                                 |
| Operations   | Both lack complete current owner/account/device evidence in this review. Shared procedures cannot substitute for each site's receipt/recovery records.                                                                                                                 |

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
through September 26. On October 2, the natural 05:00 America/Chicago heartbeat
produced a provider event at 10:01:06.243Z marked delivered, and the site owner
confirmed inbox receipt. An authorized production inquiry produced a provider event
at 03:48:49.978Z marked delivered, and the site owner confirmed receipt of that same
customer-facing message. The heartbeat was not replaced by a manual send. The
remaining AX-017 evidence gap is an independently observed safe failure condition
producing the expected ChatGPT/operator alert. The existing 05:30 health/full-form
and 06:00 heartbeat-watch monitors were observed enabled; configured prompts are not
successful execution. Do not duplicate them.

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
