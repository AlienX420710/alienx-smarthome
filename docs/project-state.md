# AlienX SmartHome — canonical project state

Maintained by Codex at the owner's direction. Last editorial update: 2026-09-12.
This is the authoritative repository index for recorded status and outstanding
work. It is not a claim that every current deployment or audit item is verified.
Owner decisions govern intent; code and dated evidence establish technical facts.
New evidence can correct this record regardless of which assistant found it.

## Document ownership

| Document                                     | Owns                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| [AGENTS.md](../AGENTS.md)                    | Assistant working rules and evidence precedence                                 |
| This file                                    | Recorded verification, decisions, and current findings register                 |
| [ai-context.md](ai-context.md)               | Architecture, commands, implementation cautions                                 |
| [release-runbook.md](release-runbook.md)     | Release, incident, and rollback procedures                                      |
| [audit-remediation.md](audit-remediation.md) | Chronological remediation evidence; earlier open statements may be superseded   |
| [ai-audit.md](ai-audit.md)                   | Claude-authored historical audit of `1fa56cc`, with later editorial corrections |

## Last recorded runtime verification

Evidence recorded on 2026-09-12 for
`dfeffab4c826a45041780769b7472ada099ff22b`:

- All seven repository workflows passed: 30 unit tests, 92 browser
  interaction/layout cases, 48 accessibility/theme cases, Safari, Lighthouse,
  and production checks. [Workflow evidence](https://github.com/AlienX420710/alienx-smarthome/actions?query=sha%3Adfeffab4c826a45041780769b7472ada099ff22b).
- Lighthouse passed on attempt two, not attempt one. The first run missed
  homepage and Status performance thresholds; the cause is not established.
- Production `/api/status` reported that exact revision as operational.
  Configuration presence is not an email-delivery test.
- After retrying the Cloudflare build, the owner reported that a real test
  email worked. This is owner-confirmed production submission/delivery evidence,
  not a new provider-record correlation or an automated live-email check.

These results apply to that revision and observation, not every later commit.
The older audit's 29-test count remains historical. Account gate enforcement
is not established merely by a successful build. No audit-wide completion is claimed.

## Findings register

Priorities: P1 = significant verification gap; P2 = reliability or maintenance
work; P3 = longer-term cleanup. Open means not implemented/verified here;
owner-needed requires evidence or action outside repository editing. This is
the currently triaged backlog, not a replacement inventory of every baseline
audit finding. Reconcile newly revisited baseline items before claiming closure.

| ID     | Priority / status | Finding and source                                                                                                    | Acceptance evidence                                                                                                                           |
| ------ | ----------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| AX-001 | P1 / open         | `production-integrity.yml` accepts any CSP header; middleware's frame-only header can hide a missing resource policy. | Separate frame and resource-policy checks; regressions reject missing script policy, weakened directives, and frame-only policy.              |
| AX-002 | P2 / open         | Integrity checks live production immediately, unlike exact-revision push smoke.                                       | Candidate checks and live monitoring are clearly separated; release evidence names and verifies the deployed SHA.                             |
| AX-003 | P2 / open         | `scripts/lighthouse.mjs` measures each route once; latest recorded release needed a rerun.                            | Fixed sample count and documented aggregation, all reports retained, unchanged thresholds; inspect variability rather than rerun until green. |
| AX-004 | P2 / open         | Three manual CSP hashes in `astro.config.mjs` have no documented source mapping.                                      | Map allowances to exact emitted bytes or prove an allowance obsolete; built-browser verification shows no required script blocked.            |
| AX-005 | P1 / owner-needed | `scripts/verify-ci.mjs` prepares a deployment gate; account enforcement is not independently recorded.                | Account configuration and build log show the gate runs; isolated non-production test proves failed required evidence blocks promotion.        |
| AX-006 | P2 / owner-needed | Alert recipients and rollback recovery remain unverified.                                                             | Confirm monitored failure notification receipt and record an authorized rollback drill with revision/version evidence.                        |
| AX-007 | P2 / open         | Historical secret scan is not recorded.                                                                               | Full-history scan with tool/version, scope, date, and sanitized outcome; any confirmed exposed secrets rotated by owner.                      |
| AX-008 | P2 / owner-needed | Automated accessibility and an owner email test do not establish assistive-technology coverage.                       | Record actual screen-reader, keyboard, and touch-device test scope and outcomes; resolve resulting defects.                                   |
| AX-009 | P3 / open         | Remaining style ownership/dead-CSS cleanup is not closed by formatting.                                               | Identify specific redundant rules/components and verify affected routes/themes after scoped cleanup.                                          |
| AX-010 | P3 / owner-needed | Work/About need authentic owner-supplied material.                                                                    | Owner-approved factual content; no invented clients, results, or biography.                                                                   |

The previous honeypot rejection was addressed in `dfeffab4`: the neutral,
read-only DOM trap still forwards injected values to the server for rejection.
Unit/browser regressions passed and the owner later confirmed a successful
email test. Autofill remains a plausible original cause, not an observed fact.

## Decisions to preserve

- **Main only:** owner requirement, not a suggestion to create a PR workflow.
- **Two rate limits:** isolate-local state bounds local abuse/memory; the
  Cloudflare binding adds edge-location counters. Both currently apply when
  configured. Neither promises a strict global quota. A global counter requires
  a separate justified design decision, not a documentation-only claim.
- **Verification before promotion:** five exact-SHA push workflows feed the
  gate. Production smoke and integrity are post-deployment checks and must not
  become gate dependencies that require the pending release to be live first.
- **Evidence levels stay separate:** local checks, CI results, deployed revision,
  provider acceptance, and owner-confirmed receipt are distinct observations.

## Maintaining the record

Keep finding IDs stable. Add revision and dated evidence when moving an item
to implemented or verified; retain remaining limits. A historical report or
assistant suggestion is input for review, not automatic closure or authority.
Record new release observations here and detailed repair history in the
remediation log. Do not copy live status lists into every onboarding document.
