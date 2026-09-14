# AlienX SmartHome — canonical project state

Maintained by Codex at the owner's direction. Last editorial update: 2026-09-14.
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

Verified on 2026-09-14 at `4a51a7ef9cdad8a44f71bad157a13333809471c2`:

- All five required exact-SHA release gates passed on the merged `main` revision:
  Quality, Responsive Compatibility, Accessibility & Theme Compatibility,
  Lighthouse Quality, and Safari Compatibility.
- Quality included the permanent repository security audit and completed green.
  The locked install reported zero npm vulnerabilities for this revision.
- The dedicated `alienx-ci-approved-main` ref advanced to this exact SHA only
  after the required gates succeeded. Cloudflare Workers Builds then completed
  successfully and deployed Worker version
  `88813d39-79f3-45d6-8c73-27ea9f28270d`.
- Production Smoke waited until the pushed revision was actually live, then
  passed the exact-revision check, both production-host checks, and the public
  status endpoint.
- Production Integrity is now triggered by successful Production Smoke rather
  than independently racing the deployment. Its first run for this revision
  checked out the verified SHA, required three stable revision confirmations,
  and passed all eight audited routes on both `alienxsmarthome.com` and
  `www.alienxsmarthome.com`.
- The release therefore verifies the positive exact-SHA promotion path and the
  Smoke → Integrity production sequencing without weakening any quality gate.

AX-005's successful-promotion acceptance path is verified at this revision.
The architecture remains fail-closed, but a deliberately failed required-gate
release has not yet been staged solely to re-demonstrate rejection behavior.
AX-006 and AX-008 still require owner/device evidence. AX-004 and AX-007 remain
security follow-ups unless separately closed by newer evidence. AX-009 and
AX-010 remain longer-term work.

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
  and production checks.
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

| ID     | Priority / status               | Finding and source                                                                                                                     | Acceptance evidence                                                                                                                           |
| ------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| AX-001 | P1 / verified at d8bf0d3        | Former integrity check accepted any CSP header, allowing a frame-only header to hide a missing resource policy; repaired and verified. | Separate frame and resource-policy checks; regressions reject missing script policy, weakened directives, and frame-only policy.              |
| AX-002 | P2 / verified at d8bf0d3        | Candidate and exact-revision production checks are separated; production sequencing was hardened again at 4a51a7e.                     | Candidate checks stay pre-deploy; Smoke proves exact live SHA; Integrity runs after successful Smoke on that same SHA.                        |
| AX-003 | P2 / verified at d8bf0d3        | Fixed three-sample Lighthouse measurement implemented and reverified.                                                                  | Fixed sample count and documented aggregation, all reports retained, unchanged thresholds; inspect variability rather than rerun until green. |
| AX-004 | P2 / open                       | Three manual CSP hashes in `astro.config.mjs` have no documented source mapping.                                                       | Map allowances to exact emitted bytes or prove an allowance obsolete; built-browser verification shows no required script blocked.            |
| AX-005 | P1 / promotion verified 4a51a7e | Exact-SHA approval refs replace Cloudflare-side GitHub REST polling; successful promotion and consumption are now verified.            | Required workflows publish the approval ref and Cloudflare consumes the same SHA fail-closed; retain a negative rejection-path exercise.      |
| AX-006 | P2 / owner-needed               | Alert recipients and rollback recovery remain unverified.                                                                              | Confirm monitored failure notification receipt and record an authorized rollback drill with revision/version evidence.                        |
| AX-007 | P2 / open                       | Historical secret scan is not recorded.                                                                                                | Full-history scan with tool/version, scope, date, and sanitized outcome; any confirmed exposed secrets rotated by owner.                      |
| AX-008 | P2 / owner-needed               | Automated accessibility and an owner email test do not establish assistive-technology coverage.                                        | Record actual screen-reader, keyboard, and touch-device test scope and outcomes; resolve resulting defects.                                   |
| AX-009 | P3 / open                       | Remaining style ownership/dead-CSS cleanup is not closed by formatting.                                                                | Identify specific redundant rules/components and verify affected routes/themes after scoped cleanup.                                          |
| AX-010 | P3 / owner-needed               | Work/About need authentic owner-supplied material.                                                                                     | Owner-approved factual content; no invented clients, results, or biography.                                                                   |

AX-005 uses GitHub's short-lived workflow token to publish the dedicated
`alienx-ci-approved-main` or `alienx-ci-rejected-main` ref after the five
required workflows. Cloudflare checks those refs with `git ls-remote` before
Wrangler deploys; no long-lived GitHub token is stored in Cloudflare. The
successful approval/promotion path is verified at 4a51a7e. Preserve the
negative-path requirement rather than weakening or simulating it away.

## Post-security roadmap — frontend research

The owner-supplied research pass is now recorded in
[frontend-pattern-notes.md](frontend-pattern-notes.md). The eight references
were reviewed as pattern sources, with a native-first implementation hierarchy,
Safari/touch/accessibility/reduced-motion requirements, performance rules, and
an Experience-page idea bank. The research is not permission to bulk-import
teaching demos.

Current implementation order after the security pass:

1. Finish repository-only security follow-ups that can be proven without owner
   intervention: AX-004 CSP hash mapping and AX-007 historical secret scanning.
2. Keep AX-006 alert/rollback verification and AX-008 real assistive-technology
   testing visible as owner/device-required work; do not fabricate closure.
3. Audit existing production components against `frontend-pattern-notes.md` and
   apply only production-safe improvements that solve a concrete usability,
   semantics, responsiveness, lifecycle, or performance problem.
4. Keep experimental interaction ideas in `/lab` until their behavior earns a
   production role. Candidate families include native controls, container
   queries, `:has()` state, progressive effects, range-driven comparisons,
   compact SVG visualization, progress/state components, live filtering,
   carefully scoped View Transitions, and explicit drag/draw experiments.
5. Complete AX-009 style ownership/dead-CSS cleanup as part of scoped component
   modernization rather than a blind stylesheet purge.
6. AX-010 remains blocked on authentic owner-supplied Work/About material.

Before adopting any example, verify its license and attribution requirements,
current browser support (including Safari), semantic HTML, keyboard and touch
access, light/dark contrast, and reduced-motion behavior. Evaluate Astro
navigation lifecycle compatibility, CSP requirements, third-party requests,
dependency cost, and performance. Prefer small, reusable changes; do not weaken
security or present tutorial projects as authentic client work.

## Decisions to preserve

- **Main only as the durable branch:** temporary scoped preflight branches/PRs
  may be used to prove required gates before promotion, then should be cleaned
  up after merge. Do not accumulate long-lived feature branches.
- **Two rate limits:** isolate-local state bounds local abuse/memory; the
  Cloudflare binding adds edge-location counters. Both currently apply when
  configured. Neither promises a strict global quota. A global counter requires
  a separate justified design decision, not a documentation-only claim.
- **Verification before promotion:** five exact-SHA workflows feed the gate.
  Production Smoke and Integrity are post-deployment checks; Integrity follows
  successful Smoke and must not become a pre-deployment dependency.
- **Evidence levels stay separate:** local checks, CI results, deployed revision,
  provider acceptance, and owner-confirmed receipt are distinct observations.
- **Do not weaken gates for green:** format and preflight the final changed files,
  prove required checks on the scoped change, then promote and monitor the exact
  merged SHA through Cloudflare, Smoke, and Integrity.

## Maintaining the record

### Security hardening and production sequencing — 2026-09-14 (verified at 4a51a7e)

The security-hardening release added a permanent repository security audit and
changed Production Integrity from an independent push race to a successful
Production Smoke `workflow_run`. On the merged main SHA, all five required gates
passed; the exact approval ref advanced to the same SHA; Cloudflare deployed it;
Smoke verified the live revision and both hosts; only then did Integrity start.
Integrity required stable revision confirmation and passed all eight routes on
both production hosts on its first attempt. This is the current release-pipeline
baseline.

### Dependency and build maintenance — 2026-09-13 (verified at 44de4b9)

The maintenance change updated Astro to 7.3.2 and the Cloudflare adapter
to 14.3.1, with current compatible tooling and SHA-pinned Actions v7 releases.
TypeScript 7.0.2 is deliberately not adopted: @astrojs/check 0.9.10 declares
support for TypeScript 5/6 only. TypeScript 6.0.3 is the compatible upgrade.

### Integrity contract repair — 2026-09-13 (verified at d8bf0d3)

AX-001 has a parsed-HTML contract requiring both a frame-ancestors response
header and a complete resource policy. Candidate and production use the same
checks. AX-002 separates candidate security/SEO validation from live production
verification; the 2026-09-14 hardening further sequences Integrity after
successful exact-revision Smoke.

Keep finding IDs stable. Add revision and dated evidence when moving an item
to implemented or verified; retain remaining limits. A historical report or
assistant suggestion is input for review, not automatic closure or authority.
Record new release observations here and detailed repair history in the
remediation log. Do not copy live status lists into every onboarding document.
