# AlienX SmartHome — canonical project state

Maintained by Codex at the owner's direction. Last editorial update: 2026-09-13.
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

The dependency/Lighthouse release `44de4b9a8e769959f05b5ebb2aa1c99b784234d3`
passed all seven workflows, CodeQL, and Cloudflare Builds on 2026-09-13.
Production reported that exact revision as operational. It passed 32 unit
tests, responsive/Safari checks, and the 48-case accessibility matrix. Status
Lighthouse performance samples were 0.94, 1, and 1 (median 1, threshold 0.85).
No retry of that Lighthouse run was needed. All dependency PRs were closed and
only protected main remained. TypeScript 7 was excluded for checker compatibility.

Historical inquiry evidence follows; it is not a fresh email test of that release.

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

| ID     | Priority / status        | Finding and source                                                                                                    | Acceptance evidence                                                                                                                           |
| ------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| AX-001 | P1 / implemented         | `production-integrity.yml` accepts any CSP header; middleware's frame-only header can hide a missing resource policy. | Separate frame and resource-policy checks; regressions reject missing script policy, weakened directives, and frame-only policy.              |
| AX-002 | P2 / implemented         | Integrity checks live production immediately, unlike exact-revision push smoke.                                       | Candidate checks and live monitoring are clearly separated; release evidence names and verifies the deployed SHA.                             |
| AX-003 | P2 / verified at 44de4b9 | Fixed three-sample Lighthouse measurement implemented and verified; see dated evidence below.                         | Fixed sample count and documented aggregation, all reports retained, unchanged thresholds; inspect variability rather than rerun until green. |
| AX-004 | P2 / open                | Three manual CSP hashes in `astro.config.mjs` have no documented source mapping.                                      | Map allowances to exact emitted bytes or prove an allowance obsolete; built-browser verification shows no required script blocked.            |
| AX-005 | P1 / owner-needed        | `scripts/verify-ci.mjs` prepares a deployment gate; account enforcement is not independently recorded.                | Account configuration and build log show the gate runs; isolated non-production test proves failed required evidence blocks promotion.        |
| AX-006 | P2 / owner-needed        | Alert recipients and rollback recovery remain unverified.                                                             | Confirm monitored failure notification receipt and record an authorized rollback drill with revision/version evidence.                        |
| AX-007 | P2 / open                | Historical secret scan is not recorded.                                                                               | Full-history scan with tool/version, scope, date, and sanitized outcome; any confirmed exposed secrets rotated by owner.                      |
| AX-008 | P2 / owner-needed        | Automated accessibility and an owner email test do not establish assistive-technology coverage.                       | Record actual screen-reader, keyboard, and touch-device test scope and outcomes; resolve resulting defects.                                   |
| AX-009 | P3 / open                | Remaining style ownership/dead-CSS cleanup is not closed by formatting.                                               | Identify specific redundant rules/components and verify affected routes/themes after scoped cleanup.                                          |
| AX-010 | P3 / owner-needed        | Work/About need authentic owner-supplied material.                                                                    | Owner-approved factual content; no invented clients, results, or biography.                                                                   |

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

### Dependency and build maintenance — 2026-09-13 (verified at 44de4b9)

The maintenance change updated Astro to 7.3.2 and the Cloudflare adapter
to 14.3.1, with current compatible tooling and SHA-pinned Actions v7 releases.
TypeScript 7.0.2 is deliberately not adopted: @astrojs/check 0.9.10 declares
support for TypeScript 5/6 only. TypeScript 6.0.3 is the compatible upgrade.
Pinned dependencies explain why an open Dependabot PR does not automatically
update main. Dependency PRs may be superseded by the validated main change;
closing them is not evidence that their versions were merged unchanged.

AX-003 implementation now uses three fixed Lighthouse samples, median
performance at the existing threshold, and worst-sample checks for other
categories. Missing/invalid measurements fail closed. Raw reports and numeric
timing metrics are retained. Unit tests cover isolated outliers, repeated slow
samples, missing evidence, and accessibility regressions. Full CI and exact-SHA
Cloudflare rollout passed at 44de4b9 as recorded above; AX-003 is verified for
this change. This does not guarantee every future performance run will pass.

### Integrity contract repair — implementation pending CI

AX-001 now has a parsed-HTML contract requiring both a frame-ancestors response
header and a complete resource policy. Tests reject frame-only protection,
weakened sources, ineffective metadata, duplicate directives, and policy-like
text in comments/scripts/templates. Candidate and production use the same checks.
Live inspection also found that prerendered assets lacked the frame CSP header:
Worker middleware alone did not cover them. `public/_headers` now supplies
frame-ancestors and HSTS for static responses, retaining Astro's resource meta
policy. A regression checks this static/middleware coverage boundary.

AX-002 adds candidate security/SEO validation to the required Responsive push/PR
workflow. Production Integrity no longer runs against unrelated live code on
PRs; push runs wait for the expected deployed revision. Both production hosts
are checked before and after the eight-route audit, with request timeouts and
exact-SHA matching on pushes. Scheduled/manual monitoring reports the observed
revision without requiring an undeployed main commit. Production Integrity stays
outside the pre-deployment gate to avoid a circular dependency. These two
implementations require successful candidate CI and a production run before
being marked verified.

Keep finding IDs stable. Add revision and dated evidence when moving an item
to implemented or verified; retain remaining limits. A historical report or
assistant suggestion is input for review, not automatic closure or authority.
Record new release observations here and detailed repair history in the
remediation log. Do not copy live status lists into every onboarding document.
