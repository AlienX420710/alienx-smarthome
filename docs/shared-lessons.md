# Shared engineering lessons

Read [the shared protocol](shared-brain.md). These are bounded transfer candidates,
not a claim that two different websites have identical controls or current passes.

## L-001 — Separate delivery layers

**Lesson:** configuration readiness, mocked form success, provider acceptance,
receiving-server delivery and inbox receipt establish different things. A natural
scheduled heartbeat does not exercise a real Turnstile form journey. Never send a
replacement to hide a missing scheduled result.

**Sources:** [AlienX email health](https://github.com/AlienX420710/alienx-smarthome/blob/5c13040262f1a2ed06a4461ce282725d8df6dec4/docs/email-health.md)
and [Cleaning email health](https://github.com/Cassileigh/cleaning-by-cassi/blob/959cdca49abccc2e0c313f43a36eddb346035c2d/docs/email-health.md).

**Transfer:** preserve separate sender, recipient, schedule authorization and
delivery evidence. Do not create duplicate schedules. Both existing contracts
already express these boundaries; today's successful delivery is not asserted.

## L-002 — Copy the security property, not the deployment mechanism

**Lesson:** both projects require five exact-revision gates, but AlienX publishes
approval/rejection Git refs and Cleaning verifies GitHub workflow evidence through
its own REST-based gate. Preserve each fail-closed implementation and reverify
after merge. PR success is not main or production success.

**Sources:** each repository's release-runbook.md at the source revisions in L-001.

**Transfer:** compare rejection behavior, freshness and provenance. Do not replace
working architecture merely to make filenames or scripts match.

## L-003 — Scope dependency repairs to the actual dependency graph

**Lesson:** Cleaning's September 29 repair scopes exact Undici 7.29.1 to Miniflare
while retaining Astro/unifont's separate 8.10.2 requirement. Its prior
version-qualified override failed clean installation. AlienX's broader override
is not automatically appropriate for Cleaning.

**Source:** [Cleaning recorded repair](https://github.com/Cassileigh/cleaning-by-cassi/blob/959cdca49abccc2e0c313f43a36eddb346035c2d/docs/project-state.md).

**Transfer:** inspect the receiving project's current package lock, reproduce with
npm ci, test affected paths and audit. These versions are historical repair
evidence, not evergreen recommended pins. Local evidence does not certify rollout.

## L-004 — Browser lifecycle failures need browser evidence

**Lesson:** both repositories record navigation/layout-related test failures.
Cleaning's active-link observer fix and AlienX's navigation-settling test fix
address different causes. Preserve visibility, keyboard and retry assertions.

**Sources:** each project's project-state.md at the revisions in L-001.

**Transfer:** inspect traces before changing production code or tests. Do not
delete assertions, repeatedly retry low performance scores, or count a missing
browser executable as a passing suite.

## L-005 — Shared history is not shared acceptance

**Lesson:** reciprocal commit inventories already exist. They help locate relevant
changes; they are not manual security certification or current deployment proof.

**Transfer workflow:** source finding → recipient applicability review → scoped
local change → local tests → exact-head CI → independent deployment evidence →
local register update → acknowledgment in the shared communication log.
A recipient may explicitly retain its stronger existing control instead.

## Contribution rules

Add a stable lesson ID, pinned source, failure/success evidence, applicability,
exceptions and a receiving-project disposition when available. Revise claims with
a dated correction; do not convert peer opinion into verified fact. Link current
project state rather than duplicating volatile test counts or open-item lists.
