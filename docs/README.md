# Documentation index

This directory contains the repository's operating guidance, current status,
release procedures, remediation history, and historical audit material.

## Current sources of truth

- [Project state](project-state.md) — canonical findings register, verified
  evidence, owner-required work, and current decisions.
- [Assistant context](ai-context.md) — architecture, repository layout,
  security-sensitive files, commands, and implementation cautions.
- [Release runbook](release-runbook.md) — release acceptance, deployment gates,
  rollback, and incident procedures.
- [Audit remediation](audit-remediation.md) — chronological remediation history.
  It is evidence history, not the current acceptance checklist.
- [Security audit](security-audit.md) — current security and quality policy
  context. Revision-specific closure belongs in `project-state.md`.

## Research and implementation notes

- [Production email health](email-health.md) — DST-safe production-path schedule,
  CI delivery evidence, account activation and acceptance boundaries.
- [Cassi commit inventory](cassi-commit-inventory.md) — reciprocal reachable-history
  ledger: exact reference main, observed refs, main/branch/PR scope, file counts,
  raw patch digests and automated review areas. Not a manual security certification.
- [Directory parity review](directory-parity-review.md) — applicable differences
  across Cleaning's docs, scripts, source and tests; adoption and evidence limits.
- [Inquiry security contract](inquiry-security-contract.md) — request boundary,
  abuse controls, retries and mail acceptance semantics.
- [Real-device validation](device-validation.md) — physical keyboard, screen reader
  and touch acceptance protocol; not a claim of completed device testing.

- [Security comparison — September 26](security-comparison-2026-09-26.md) —
  current Cleaning-by-Cassi comparison, external header observations and scoped
  follow-up acceptance.

- [Front-end pattern notes](frontend-pattern-notes.md) — research guidance and
  the Lab-versus-production adoption rules.
- [Front-end runtime audit](frontend-runtime-audit.md) — JavaScript ownership,
  lifecycle, and progressive-enhancement guidance.
- [Media audit](media-audit.md) — image/media pipeline and asset rules.

## Historical audit records

- [AI audit](ai-audit.md) — historical snapshot audit. Its findings and test
  counts apply to the commit and date stated in that document, not necessarily
  to current `main`.
- [Security closeout — 2026-09-20](security-closeout-2026-09-20.md) — dated
  closeout evidence for the revision identified in the document.

Historical documents must not be used as current release approval. Reconcile
their findings with [project state](project-state.md) and the relevant
revision-specific CI or production evidence.

## Maintaining the cross-repository record

1. Regenerate the Cassi inventory from a fresh mirror using its documented command.
2. Inspect applicable current source changes; record adopt/retain/defer decisions
   in the directory parity review, not as automatic conclusions from file names.
3. Validate AlienX changes independently. Record exact-SHA acceptance and remaining
   operational limits in project state; link that record from the README.

Never replace AlienX's security controls merely to match reference naming or scores.
