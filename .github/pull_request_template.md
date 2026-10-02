## Scope

Describe the user-visible or operational change and link the tracking issue.

## Validation

List only checks/evidence that actually ran. Keep local, CI, deployment, provider
acceptance/delivery, inbox receipt and human/device evidence distinct.

## Documentation closeout — required

- [ ] Re-read AGENTS.md and the relevant durable owner docs after implementation.
- [ ] Updated `docs/ai-context.md` for durable architecture/route/contract changes, or gave a concrete reason it was not required.
- [ ] Updated `docs/release-runbook.md` for durable operational/procedural changes, or gave a concrete reason it was not required.
- [ ] Updated `docs/project-state.md` for durable findings/acceptance/release evidence, or recorded the required post-merge follow-up because that evidence does not exist yet.
- [ ] Searched durable docs and follow-up UX for removed/renamed routes, assets, controls and contracts.
- [ ] Preserved one owner per subject; no duplicate audit/closeout document was added.

**Docs result:** <!-- "updated: ..." or "no durable update required — ..." -->

A task is not complete after merge if new production evidence makes project-state
stale. Finish the post-merge documentation update or record the explicit blocker.
