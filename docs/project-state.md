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

Verified on 2026-09-13 at `d8bf0d3de9682f96e0c059accb63e7be25b824fb`:

- All seven automatic push workflows, both CodeQL checks, and Cloudflare Builds
  succeeded. [Exact-revision checks](https://github.com/AlienX420710/alienx-smarthome/commit/d8bf0d3de9682f96e0c059accb63e7be25b824fb/checks).
- [Responsive CI](https://github.com/AlienX420710/alienx-smarthome/actions/runs/34773767198)
  passed the eight-route candidate security/SEO contract and 92 browser cases.
- [Production Integrity](https://github.com/AlienX420710/alienx-smarthome/actions/runs/34773767173)
  waited for the exact deployed revision, then passed eight routes on each of
  the apex and www hosts. A separate read-only local execution of
  `verify-integrity.mjs` with that full `EXPECTED_REVISION` passed both hosts
  again; `/api/status` also reported that revision as operational.
- [Lighthouse](https://github.com/AlienX420710/alienx-smarthome/actions/runs/34773767221)
  passed all seven routes with median performance 1 at the unchanged 0.85
  threshold. Homepage samples were 0.99, 1, 1; Status samples were 0.95, 1, 1;
  all other performance samples were 1.
- A fresh local rerun passed all 35 unit tests and formatting checks. This
  rerun did not rebuild the application or repeat the browser suites locally;
  the full build and browser evidence above comes from CI.

AX-001 and AX-002 meet their recorded acceptance criteria at this revision.
AX-003 was reverified. The manual Browser Diagnostics workflow was not run.
No fresh real inquiry, account rejection exercise, alert receipt test, or
rollback drill was performed. AX-004 through AX-010 remain open or owner-needed.
This documentation update does not itself establish a newer verified deployment.

### Earlier dependency release

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

| ID     | Priority / status        | Finding and source                                                                                                                                | Acceptance evidence                                                                                                                           |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| AX-001 | P1 / verified at d8bf0d3 | Former integrity check accepted any CSP header, allowing a frame-only header to hide a missing resource policy; repaired and verified.            | Separate frame and resource-policy checks; regressions reject missing script policy, weakened directives, and frame-only policy.              |
| AX-002 | P2 / verified at d8bf0d3 | Former integrity workflow checked unrelated live code immediately; candidate and exact-revision production checks are now separated and verified. | Candidate checks and live monitoring are clearly separated; release evidence names and verifies the deployed SHA.                             |
| AX-003 | P2 / verified at d8bf0d3 | Fixed three-sample Lighthouse measurement implemented and reverified; see dated evidence above and below.                                         | Fixed sample count and documented aggregation, all reports retained, unchanged thresholds; inspect variability rather than rerun until green. |
| AX-004 | P2 / open                | Three manual CSP hashes in `astro.config.mjs` have no documented source mapping.                                                                  | Map allowances to exact emitted bytes or prove an allowance obsolete; built-browser verification shows no required script blocked.            |
| AX-005 | P1 / implementation changed, verification pending | The release gate no longer polls the unauthenticated GitHub REST API from Cloudflare. GitHub now publishes exact-SHA approved/rejected refs after the five required workflows, and Cloudflare verifies those refs over Git before Wrangler deploys. | Required workflows create correct approval/rejection refs, the Cloudflare build consumes the exact ref for the same SHA, failed evidence blocks promotion, and successful evidence deploys that revision. |
| AX-006 | P2 / owner-needed        | Alert recipients and rollback recovery remain unverified.                                                                                         | Confirm monitored failure notification receipt and record an authorized rollback drill with revision/version evidence.                        |
| AX-007 | P2 / open                | Historical secret scan is not recorded.                                                                                                           | Full-history scan with tool/version, scope, date, and sanitized outcome; any confirmed exposed secrets rotated by owner.                      |
| AX-008 | P2 / owner-needed        | Automated accessibility and an owner email test do not establish assistive-technology coverage.                                                   | Record actual screen-reader, keyboard, and touch-device test scope and outcomes; resolve resulting defects.                                   |
| AX-009 | P3 / open                | Remaining style ownership/dead-CSS cleanup is not closed by formatting.                                                                           | Identify specific redundant rules/components and verify affected routes/themes after scoped cleanup.                                          |
| AX-010 | P3 / owner-needed        | Work/About need authentic owner-supplied material.                                                                                                | Owner-approved factual content; no invented clients, results, or biography.                                                                   |

The previous honeypot rejection was addressed in `dfeffab4`: the neutral,
read-only DOM trap still forwards injected values to the server for rejection.
Unit/browser regressions passed and the owner later confirmed a successful
email test. Autofill remains a plausible original cause, not an observed fact.

## Post-security roadmap — frontend research

Queued by the owner on 2026-09-13. Start this research after the outstanding
security work: CSP hash mapping (AX-004), account-level deployment enforcement
(AX-005), and historical secret scanning (AX-007). Keep alerting and recovery
(AX-006) ahead of optional visual enhancements. These references do not change
the status or acceptance criteria of any existing finding.

The following are owner-supplied resources to investigate, not reviewed or
approved implementations. Preserve all eight references for the research pass:

- [ ] [Marko Denic — HTML tips](https://markodenic.com/html-tips/)
- [ ] [Marko Denic — markodenic.tech](https://markodenic.tech)
- [ ] [DNXEMPIRE-1 — 50-cool-html-css-Projects](https://github.com/DNXEMPIRE-1/50-cool-html-css-Projects)
- [ ] [Brad Traversy — 50projects50days](https://github.com/bradtraversy/50projects50days)
- [ ] [Solygambas — html-css-javascript-projects](https://github.com/solygambas/html-css-javascript-projects)
- [ ] [Solygambas — CodePen](https://codepen.io/solygambas)
- [ ] [Diego Card — awesome-html5](https://github.com/diegocard/awesome-html5)
- [ ] [CSS-Tricks](https://css-tricks.com)

Research output: a prioritized shortlist of specific HTML, CSS, and interaction
ideas that solve an identifiable AlienX usability or presentation need. Record
the source/demo, proposed route or component, expected benefit, effort, and an
adopt/adapt/skip decision with reasons. Check each resource only after reviewing
it and recording that decision; checking it does not mean its code was imported.

Before adopting any example, verify its license and attribution requirements,
current browser support (including Safari), semantic HTML, keyboard and touch
access, light/dark contrast, and reduced-motion behavior. Evaluate Astro
navigation lifecycle compatibility, CSP requirements, third-party requests,
dependency cost, and performance. Prefer small, reusable changes consistent
with AlienX's existing design and style ownership (AX-009); do not bulk-import
demos, weaken security, or present tutorial projects as authentic client work
(AX-010). Any later implementation needs the affected build, browser,
accessibility, security-integrity, and Lighthouse checks.

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

### Integrity contract repair — 2026-09-13 (verified at d8bf0d3)

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
outside the pre-deployment gate to avoid a circular dependency. Both
implementations passed candidate CI and exact-revision production verification
at d8bf0d3, followed by the independent live rerun recorded above. This closes
AX-001 and AX-002 for that revision, not the separate manual hash mapping or
account-level deployment enforcement findings.

Keep finding IDs stable. Add revision and dated evidence when moving an item
to implemented or verified; retain remaining limits. A historical report or
assistant suggestion is input for review, not automatic closure or authority.
Record new release observations here and detailed repair history in the
remediation log. Do not copy live status lists into every onboarding document.
