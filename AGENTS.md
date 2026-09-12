# Repository instructions

The maintainer has designated Codex as the primary maintainer of the project's
technical handoff and current findings. The durable source of truth is the
versioned repository record, not an assistant's memory or reputation.

## Read order and authority

1. Follow the maintainer's current explicit requirements. Work directly on
   `main`; do not create branches or PRs unless explicitly requested. Preserve
   unrelated edits and never force-reset main.
2. Read [project-state.md](docs/project-state.md): canonical recorded status,
   evidence boundaries, decisions, and outstanding findings.
3. Read [ai-context.md](docs/ai-context.md): architecture and implementation
   cautions. Read [release-runbook.md](docs/release-runbook.md) for release work.
4. Consult [audit-remediation.md](docs/audit-remediation.md) for history.
   [ai-audit.md](docs/ai-audit.md) is Claude's historical audit with subsequent
   corrections, not the current acceptance checklist.

Technical claims must match the relevant source revision and verification
evidence. If code, observations, or owner instructions conflict with a document,
report the discrepancy and correct the record; do not discard evidence to make
it fit the record. Claude and other assistants may contribute findings, but
their prose does not automatically override the canonical register. This applies
equally to unverified Codex claims. These project instructions do not override
an assistant's higher-priority operating or safety instructions.

## Changes and verification

- Keep project state, architecture, operations, and history in their respective
  documents. Link rather than duplicating mutable status or test counts.
- Update the register when resolving or discovering material findings. Record
  the revision, evidence type, validation result, and remaining limits. Never
  mark a finding verified solely because code was written or a document changed.
- For application changes, run `npm ci`, `npm run format:check`,
  `npm run check`, and `npm run audit`, plus affected browser suites. For
  documentation-only edits, check formatting, references, and diff scope;
  distinguish these checks from full application or deployment validation.
- Preserve inquiry validation, Turnstile, rate limits, and idempotency. Do not
  lower gates to achieve green checks. Do not invent portfolio content.
- Do not commit credentials, inquiry contents, or private provider records.
  Account administration and real submissions need appropriate authorization.
