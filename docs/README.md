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
