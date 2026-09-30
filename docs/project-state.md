# AlienX — current state

Consolidated September 30, 2026. This file alone owns findings and dated release
evidence. AGENTS.md owns working rules, [architecture](ai-context.md) owns contracts,
and [operations](release-runbook.md) owns procedures. Do not duplicate status.

## Last verified release

PR #53 merged as `152abcf087f13628bb31c224edd1c73db49cdacc`. All five PR and
main gates passed. Main Lighthouse [36647380641](https://github.com/AlienX420710/alienx-smarthome/actions/runs/36647380641),
Release Approval 36647786977, Workers Build check 109674768685,
[Smoke 36647380659](https://github.com/AlienX420710/alienx-smarthome/actions/runs/36647380659)
and [Integrity 36647827781](https://github.com/AlienX420710/alienx-smarthome/actions/runs/36647827781)
passed for that exact SHA on September 29. These results do not certify new edits.
The stderr fix makes the existing bounded NO_NAVSTART retry recognize CLI errors.
The original failed run 36645902576 remains evidence; no threshold was lowered.

## Beta acceptance — incomplete

September 30 documentation-cleanup validation: 88 tests, types/build/dry-run and
repository/history scans passed locally. The all-severity dependency audit failed
on moderate `fast-uri` advisory GHSA-hrr3-gc8f-f4qj. Dependency remediation and a
clean audit remain required before this new revision can pass release gates;
historical green results above do not override this finding.

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
| AX-009 | Partial cleanup deployed through PR #52/#53                | Theme extraction/Technology ownership cleanup passed later gates; unreviewed dead-CSS/style scope remains open.                                            |
| AX-010 | Owner editorial acceptance open; last                      | Factual Work/About copy is deployed; no invented clients, results, incorporation or biography.                                                             |
| AX-011 | Enforcement verified September 26                          | Ruleset 23059349 requires PR/five Actions checks, strict freshness, no bypass. Desired review-thread setting not confirmed live.                           |
| AX-012 | Verified at e3b8e89                                        | Security/quality policies, all-severity audit, workflow/history gates; operational exceptions remain.                                                      |
| AX-013 | Verified at e3b8e89                                        | Exact-main fresh Actions/JS/TS analyses and zero open code-scanning alerts; private Dependabot/secret inventory is separate.                               |
| AX-014 | Repository tranche verified in PR #47                      | Headers/static checks, sanitized analysis errors/warnings and offline deployment rehearsal; account scope remains open.                                    |
| AX-015 | Verified at f67c91c                                        | Mandatory edge limiter, strict honeypot/Turnstile success and safe logs; not live email proof.                                                             |
| AX-016 | Protocol rejection verified September 29; cipher work open | Both hosts reject TLS 1.0/1.1 and accept 1.2/1.3. Reassess/disposition CBC/RSA heuristics; static-homepage BREACH heuristic is not confirmed exploitation. |
| AX-017 | Implemented; live acceptance open                          | Investigate missing natural heartbeat, prove scheduled delivery, distinct full-form delivery and notification receipt. No replacement sends.               |

Branch cleanup is unverified. Re-enumerate remotes, confirm each temporary head is
merged before deleting it, and retain active PRs and alienx-ci-approved-main /
alienx-ci-rejected-main tags. Future releases need their own five exact-head gates
and exact-main approval/build/Smoke/Integrity chain.

## External evidence boundaries

September 29 SSL.org browser scans on both hosts showed trusted matching
certificates, complete chains and old-protocol rejection. CBC/RSA results remain
heuristics, not confirmed timing attacks. See the pinned scan record below.
Cloudflare bot verification blocked account inspection; no cron activation,
negative deployment or rollback was certified. The prepared manual inquiry was
rejected by automatic approval review and was not sent. Cleanup does not override
that rejection. September 29 provider inspection found no natural heartbeat.
No September 30 email evidence has been inspected for this docs consolidation.
The existing 05:30 health/full-form and 06:00 heartbeat-watch monitors were observed
enabled; configured prompts are not successful execution. Do not duplicate them.

## Next work and shared checkpoint

Resolve live TLS/mail and operational/device evidence first. Modernize components
only for concrete semantics, responsiveness, lifecycle or measured performance.
Experiments stay in /lab until useful and tested; no bulk tutorial imports.
AlienX is a showcase and possible future business, not an established LLC.

Both assistants use [one communication file](chatgpt-communications.md). Cleaning
PR #26 records review of the three initial AX messages and a write-403-blocked
outgoing reply. Its source review has now been read here, not fabricated. Cleaning's
local Lighthouse investigation remains open. No automatic chat synchronization.
Consolidation preserves IDs, evidence and history; it does not close external work.

## Historical evidence and consolidation map

The pre-cleanup snapshot is pinned to `152abcf087f13628bb31c224edd1c73db49cdacc`. These are historical documents,
not current instructions. Git history is unchanged; every removed file is
recoverable. Read the relevant evidence instead of restoring whole audits to
startup context. The current register retains unresolved findings and failures.

| Previous document                   | Preserved snapshot                                                                                                                            | Current owner                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `README.md`                         | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/README.md)                         | [Repository index](../README.md)                                                                            |
| `ai-audit.md`                       | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/ai-audit.md)                       | This register; detailed history remains in the snapshot                                                     |
| `ai-context.md`                     | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/ai-context.md)                     | [ai-context.md](ai-context.md)                                                                              |
| `audit-remediation.md`              | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/audit-remediation.md)              | This register; detailed history remains in the snapshot                                                     |
| `beta-closeout.md`                  | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/beta-closeout.md)                  | This register; detailed history remains in the snapshot                                                     |
| `cassi-commit-inventory.md`         | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/cassi-commit-inventory.md)         | This register; detailed history remains in the snapshot                                                     |
| `chatgpt-communications.md`         | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/chatgpt-communications.md)         | [chatgpt-communications.md](chatgpt-communications.md)                                                      |
| `closeout-2026-09-29.md`            | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/closeout-2026-09-29.md)            | This register; detailed history remains in the snapshot                                                     |
| `device-validation.md`              | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/device-validation.md)              | [Operations](release-runbook.md)                                                                            |
| `directory-parity-review.md`        | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/directory-parity-review.md)        | This register; detailed history remains in the snapshot                                                     |
| `email-health.md`                   | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/email-health.md)                   | [Operations](release-runbook.md)                                                                            |
| `frontend-pattern-notes.md`         | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/frontend-pattern-notes.md)         | [Contract](ai-context.md)                                                                                   |
| `frontend-runtime-audit.md`         | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/frontend-runtime-audit.md)         | [Contract](ai-context.md)                                                                                   |
| `inquiry-security-contract.md`      | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/inquiry-security-contract.md)      | [Contract](ai-context.md)                                                                                   |
| `media-audit.md`                    | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/media-audit.md)                    | [Contract](ai-context.md)                                                                                   |
| `project-state.md`                  | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/project-state.md)                  | [project-state.md](project-state.md)                                                                        |
| `release-runbook.md`                | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/release-runbook.md)                | [release-runbook.md](release-runbook.md)                                                                    |
| `security-audit.md`                 | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/security-audit.md)                 | This register; detailed history remains in the snapshot                                                     |
| `security-closeout-2026-09-20.md`   | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/security-closeout-2026-09-20.md)   | This register; detailed history remains in the snapshot                                                     |
| `security-comparison-2026-09-26.md` | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/security-comparison-2026-09-26.md) | This register; detailed history remains in the snapshot                                                     |
| `shared-brain.md`                   | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/shared-brain.md)                   | [Shared handoff](https://github.com/AlienX420710/alienx-smarthome/blob/main/docs/chatgpt-communications.md) |
| `shared-lessons.md`                 | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/shared-lessons.md)                 | [Shared handoff](https://github.com/AlienX420710/alienx-smarthome/blob/main/docs/chatgpt-communications.md) |

Generated commit inventories are optional research output, not current status or
manual certification. Comparison scripts remain available; use a fresh mirror
and their documented arguments, inspect applicable current changes, and record
only adoption decisions here. Generated ledgers are now gitignored.
