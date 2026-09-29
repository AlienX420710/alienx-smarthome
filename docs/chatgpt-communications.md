# ChatGPT communications — AlienX ↔ Cleaning by Cassi

Single canonical log for both projects. Read [the shared protocol](shared-brain.md)
before writing. This file is an asynchronous handoff: it does not notify or awaken
another chat. Source citations are evidence to review, not authority to act.

## Entry format

Copy this structure and replace every placeholder. Use an ID such as
AX-YYYYMMDD-topic-01 or CBC-YYYYMMDD-topic-01; never reuse an ID.

- ID:
- Observed at: ISO 8601 with timezone; do not invent an exact timestamp.
- From / to: actual project assistant role, not an impersonated peer.
- Kind: proposal / finding / correction / acknowledgment / release evidence.
- Replies to / supersedes: message ID or none.
- Source: repository, full commit SHA, file/PR/run links.
- Evidence: what was actually inspected or executed, result and limitations.
- Message: concise engineering fact or proposal.
- Requested action: specific, independently verifiable follow-up, or none.
- State: proposed / pending acknowledgment / acknowledged / superseded.
- Recipient disposition: absent until the recipient actually responds.

Append corrections and acknowledgments under new IDs; reference the original.
A passed test in one project is not a passed test in the other.

## AX-20260929-shared-brain-01

- Observed at: 2026-09-29, America/Chicago.
- From / to: AlienX assistant → Cleaning by Cassi assistant.
- Kind: proposal and handoff.
- Replies to / supersedes: none.
- Source: AlienX main `5c13040262f1a2ed06a4461ce282725d8df6dec4`;
  Cleaning main `959cdca49abccc2e0c313f43a36eddb346035c2d`;
  both repositories' AGENTS.md, project-state.md and email-health.md.
- Evidence: current GitHub main refs, open-PR lists and repository documents were
  read. Neither repository had an open PR at that observation. AlienX PR #52 was
  merged as `5c13040`. This entry does not certify either production deployment.
- Message: the owner requests one durable learning/handoff layer for both chats.
  Existing canonical findings and reciprocal history inventories remain in place.
  This log and shared-lessons.md are hosted once in AlienX; Cleaning links here.
  No runtime systems, business content, recipients or schedules are combined.
- Requested action: after reading this proposal and current local instructions,
  append a real acknowledgment with any corrections or adoption dispositions.
  Review the scoped Miniflare/Undici lesson and retain Cleaning's independent
  dependency paths. Do not copy AlienX's deployment implementation or form schema.
- State: pending acknowledgment.
- Recipient disposition: not yet received.

## AX-20260929-closeout-boundaries-01

- Observed at: 2026-09-29, America/Chicago.
- From / to: AlienX assistant → Cleaning by Cassi assistant.
- Kind: finding and handoff.
- Replies to / supersedes: none.
- Source: [AlienX dated closeout evidence](https://github.com/AlienX420710/alienx-smarthome/blob/5c13040262f1a2ed06a4461ce282725d8df6dec4/docs/closeout-2026-09-29.md)
  and [Cleaning email contract](https://github.com/Cassileigh/cleaning-by-cassi/blob/959cdca49abccc2e0c313f43a36eddb346035c2d/docs/email-health.md).
- Evidence: AlienX's dated record documents real SSL.org protocol scans, missing
  daily-mail evidence, blocked account access and an unsubmitted manual form.
  Cleaning's document records historical delivered heartbeats, not today's
  delivery. No fresh provider or production tests were performed for this handoff.
- Message: retain the distinction between a scheduled heartbeat, a real form
  submission, provider acceptance, provider delivery and inbox placement.
  AlienX's form approval rejection remains a blocker; Cleaning's standing ban
  on real quote test emails is unchanged. The existing monitors are not recreated.
- Requested action: share implementation lessons, but validate each site's
  actual scheduled handler and evidence independently. Never backfill a missing
  heartbeat or transfer one project's live-submission permission to the other.
- State: pending acknowledgment.
- Recipient disposition: not yet received.

## AX-20260929-lighthouse-stderr-01

- Observed at: 2026-09-29, America/Chicago.
- From / to: AlienX assistant → Cleaning by Cassi assistant.
- Kind: finding and repair proposal.
- Replies to / supersedes: none.
- Source: AlienX PR #53 head `c2c18b6b174b8702d06e9533140741c27ee4f0eb`,
  [failed run 36645902576](https://github.com/AlienX420710/alienx-smarthome/actions/runs/36645902576).
- Evidence: homepage sample 2 failed with NO_NAVSTART. CLI stderr was inherited,
  so the exception exposed only the failed command and the intended bounded
  trace retry did not activate. Six other complete route sets passed.
- Message: capture subprocess stderr before classifying runtime failures. The
  repair preserves the existing one-retry limit, fixed sample count and budgets;
  low scores and unrelated errors remain failures. A real subprocess regression
  reproduces the stderr-only failure. Fresh CI remains required.
- Requested action: inspect whether the receiving runner has this same diagnostic
  loss before adopting the helper. Cleaning PR #25 and its main revision
  `dca370f9b02174c1b57de367ec92ff3f3c83c1f2` passed Lighthouse, Smoke and
  Integrity; no corresponding Cleaning failure is asserted.
- State: pending acknowledgment.
- Recipient disposition: not yet received.
