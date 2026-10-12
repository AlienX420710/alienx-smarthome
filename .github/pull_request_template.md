## Problem and scope

Related local issue: #
Session (if known):
Base SHA:
Describe the problem, change, and resulting behavior.

## Verification and handoff

- Local preparation: `npm run prepare:pr`; record the validated source fingerprint.
- Before publishing: `npm run verify:prepared`; after fetching the published SHA,
  `npm run verify:prepared -- <full-sha>` must match the same bytes.
- Link the paired engineering PR and report `verify:peer` with both revisions.
- List checks actually run; local, browser CI, deployment, provider acceptance,
  delivery, inbox receipt and human/device evidence remain distinct.
- Main approval/build/Smoke/Integrity are required after merge.
- Remaining blockers and next action:
- Peer adoption decision: adopted/adapted/declined/pending, with reason.

## Documentation closeout — required

- [ ] Re-read AGENTS.md and the relevant durable owner docs after implementation.
- [ ] Updated the application contract for architecture/route/contract changes,
      or gave a concrete reason it was not required.
- [ ] Updated docs/release-runbook.md for operational/procedural changes,
      or gave a concrete reason it was not required.
- [ ] Updated docs/project-state.md for durable findings/acceptance/release evidence,
      or recorded the required post-merge follow-up because evidence does not exist yet.
- [ ] Searched durable docs and follow-up UX for removed/renamed routes and contracts.
- [ ] Preserved unresolved findings, prior failures and one owner per subject.

**Docs result:** <!-- "updated: ..." or "no durable update required — ..." -->

A task is not complete after merge if new production evidence makes project-state
stale. Finish the post-merge documentation update or record the explicit blocker.
Do not include credentials, customer details, or private provider records.
