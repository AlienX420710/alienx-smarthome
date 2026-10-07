# AlienX — current state

Updated October 7, 2026. This file alone owns findings and dated release
evidence. AGENTS.md owns working rules, [architecture](ai-context.md) owns contracts,
and [operations](release-runbook.md) owns procedures. Do not duplicate status.

## October 7 shared challenge widget — candidate

The common Turnstile lifecycle now handles duplicate loads, page-swap cleanup,
stale callbacks and provider reset/remove errors. Site actions, response fields,
widget presentation and security feedback remain explicit adapter inputs. Shared
unit and browser regressions are included in the existing mandatory gates and
peer comparison. This candidate is not yet production verified; the verified
navigation release below remains the implementation baseline. Broader form/UI
parity (#122 / Cleaning #39) and all owner/device/account/recovery gaps remain open.
No live form submission, replacement heartbeat or private account operation was run.

## October 6 shared navigation release — verified

Both sites now use the same navigation-rail and command-trigger implementation.
It reveals the active link after layout/font/page lifecycle changes without moving
document scroll or keyboard focus, disconnects stale observers during page swaps,
and binds global listeners once. Unit coverage includes stale callbacks, manual
scroll preservation and command-opener focus. PR #129 passed all five exact-head
gates and merged as `9dcf7086f252eb2a2852d3f329b177a5411a1fc2`.
All five main gates, fresh CodeQL and zero-open-alert policy passed. The release
approval ref matched this SHA and Workers Build 112626314168 succeeded.
[Smoke](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37569473142)
and [Integrity](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37570048440)
verified this exact revision on both production hosts, including TLS protocol
acceptance. The expanded migrated-component peer comparison also passed locally.
This is the latest verified implementation release; broader UI/schema parity in
#122 / Cleaning #39 and owner-dependent acceptance remain open. CBC/static-RSA
cipher observations are not closed by TLS protocol success. No real inquiry,
replacement heartbeat, private account inspection or recovery drill was performed.
This evidence-only documentation follow-up needs no recursive state update.

## October 6 shared application engine — verified

The paired application changes consolidate Worker/mail/heartbeat adapters, status
readiness and method handling, and common form stream/abuse/verification/retry
primitives. AlienX now rejects malformed limiter bindings as unready; both status
routes preserve restrictive API headers through middleware. Site forms, recipients,
confirmation permissions and retry identities remain separate explicit inputs.
PR #127 merged as `8797051da822f3adbcc1101341436d006d36f59c`.
All five exact-main gates, fresh CodeQL and zero-open-alert policy passed;
the approved-main ref matched this SHA and Workers Build 112622039338 succeeded.
[Smoke](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37568068540)
and [Integrity](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37568661820)
verified this revision on both hosts, including TLS protocol acceptance.
Parent #122 stays open for UI behavior, remaining route/schema extraction and
full parity inventory beyond the migrated-component allowlist. All existing
owner/device/account/recovery acceptance gaps remain open; no real mail test or
private account operation was performed.

## Requested website policies — released

The owner confirms personal operation in Wisconsin and no marketing use of
inquiries. The requested Privacy Policy and Terms of Service add contact-form
and footer links using Cleaning's notice placement as a reference. Copy describes
the actual form fields, Cloudflare/Turnstile, Resend, saved preferences and
mailbox retention without inventing a deletion deadline or delivery guarantee.
Existing inquiry consent, validation, security and recipients are unchanged.
These are website terms, not a paid-project agreement or attorney-reviewed legal
advice. PR #128's policies are included in the fully verified #129 release above,
including route, link, browser and production integrity coverage. This scoped
owner request does not close #62's broader editorial acceptance or other
unresolved closeout findings.

## October 6 diagnostic parity follow-up — verified

The manual WebKit runner and workflow now share one implementation, retaining
traces, screenshots, preview logs and baseline failure semantics in both repos.
Regression coverage blocks external requests/local writes and verifies altered
modes cannot count as release acceptance. The peer verifier now covers this
previously omitted tool and workflow. PR #125 passed all five exact-head gates and
real macOS WebKit diagnostics, then merged as
`a2f3d1cf2a0883112748f8adb123502c71583c41`. All five main gates, fresh CodeQL and
zero-open-alert policy passed. Release approval published this exact SHA and
Workers Build 112467491484 succeeded. [Smoke](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37520714103)
and [Integrity](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37521448579)
verified this revision on both hosts, including TLS protocol acceptance. Full
application parity and owner-dependent checklist items stay open. No real mail or
account/recovery operation was performed. This evidence-only follow-up needs no
recursive state update.

## October 6 shared infrastructure release — verified

PR #123 merged as `c192e08bb22b662f6a79c866369016a570492ff2`.
All five exact PR-head and main checks passed, including native Safari, WebKit,
rendered-text contrast and all three Lighthouse samples. Main's fresh CodeQL
analysis and zero-open-alert policy passed. [Release Approval](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37473354502)
published the approved-main ref for this SHA. [Workers Build](https://github.com/AlienX420710/alienx-smarthome/runs/112302626579)
succeeded; [Smoke](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37472612533)
and [Integrity](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37473492323)
verified the exact revision on both production hosts. Integrity also passed the
live TLS protocol checks. This supersedes the earlier release evidence below.

The release shares framework configuration, revision metadata, security headers,
release approval, security/code-scanning checks, integrity/SEO, production
Smoke/TLS, image processing, monitoring, browser tooling and normalized dependency
locks with Cleaning #41. Explicit site inputs retain business identity, routes,
form schemas, recipients and rendering requirements. The peer comparison passes
for the migrated components; it does not prove that every application file is
identical. #122 / Cleaning #39 remain open for remaining application-level
implementation differences (including form middleware/status handlers and manual
browser diagnostics), plus each site's independent release acceptance.

The initial migration exposed incorrect Safari layout and heading-contrast test
assumptions. The shared tests now enforce the configured responsive layout and
measure rendered text against painted backgrounds under the actual CSP. They
also found a real low-contrast light-theme status accent, fixed using the existing
dark brand green with sufficient selector specificity. Browser fixtures cover
readable/unreadable text and gradients. No quality threshold or CSP was weakened.
Dependency audit findings were patched with smol-toml 1.9.0 and source-map-js 1.2.2;
no audit exceptions were added. Local browser installation remained unavailable;
passing browser evidence comes from exact-revision CI, not a local claim.

Shared scheduled-mail cleanup cancels failed response bodies best-effort without
changing retry disposition, recipients, timing or stable keys. Mocked error-path
coverage sends no mail. Cleaning's field-error work and release acceptance remain
owned by its #35/#36; peer deployment is not transferable evidence.

#59 isolated recovery, #60 physical-device acceptance,
#61 account/TLS-cipher disposition, and AX-010 / #62 owner editorial
acceptance remain open. Production TLS protocol success is not private account
or exhaustive cipher evidence. No real inquiry, replacement heartbeat, mailbox
inspection or production recovery drill was performed during this continuation.
This evidence-only documentation closeout needs no recursive state update.

## October 5 engineering alignment — released, full parity still open

The owner requires identical engineering except for site content/configuration.
The first paired preflight repair is merged. Earlier main
`3dbf0542be8082a4973996ab35b2fe4786ad3505` passed all five gates and
code-scanning policy, [Release Approval](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37362119608),
Workers Build, [Smoke](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37361587769),
and [Integrity](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37362184149).
The latter verified that exact revision on both production hosts and TLS protocol
acceptance. This supersedes the October 3 release below. Full non-content parity
is still open in #122; the later verified #123 release is recorded above.

## Previous verified release

October 3, 2026: main `81e219fc0e9e13dad669e77d5d2508c32eb75908`
(PR #119) was the fully verified production release on that date. All five required main
gates and current code-scanning policy passed. Release Approval run
[37146953634](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37146953634)
succeeded for this exact SHA. Cloudflare Workers Build
`487c0a70-295b-4581-adb3-83f670b7c681` succeeded and published Version ID
`8126be09-38da-45f2-b06a-32a210cea9bd`.
[Push Smoke 37146883118](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37146883118)
verified that exact pushed revision live, checked both production hosts and the public
status endpoint, and completed successfully. It was followed by
[Integrity 37147118752](https://github.com/AlienX420710/alienx-smarthome/actions/runs/37147118752),
which also completed successfully for the same main revision. Skipped Operator Alert
invocations after successful workflows are expected; the controller creates an issue
only when a watched workflow actually fails.

PR #94 replaced private ChatGPT/provider-history monitoring with a trusted
GitHub-native operator-alert controller. The controller validates same-repository
workflow origin, has only `contents: read` and `issues: write`, and does not execute
event-supplied source code. Controlled PR #95 changed only `.github/alert-canary`;
`AlienX Alert Canary` run 37083084058 failed intentionally and trusted controller
run 37083095061 automatically created operator-alert issue #96 with the exact run
ID and SHA. The canary did not access production, mailbox contents, Resend/provider
history, credentials or customer data. #96 and the unmerged canary PR were closed
after evidence capture. Together with the previously recorded natural heartbeat,
provider delivery, inbox receipt and authorized full inquiry evidence, this closes
#58 / AX-017. The privacy boundary is explicit in the release runbook.

## October 3 production recovery incident — resolved

PR #99 / main `9bc53a6c7aa421faf4e49ca11a78f39357940e07`
added an account-level recovery drill that was intended to remain isolated from
production. That isolation failed. Scheduled Production Smoke run `37088364101`
requested `https://alienxsmarthome.com/` at 2026-10-03 02:02:26Z and received
HTTP 200 `application/json` containing the recovery-drill baseline payload instead
of the AlienX HTML application. The trusted Operator Alert controller opened #100.
This remains failed safety evidence for #59, not successful negative-promotion
acceptance.

PR #105 removed the recovery drill from the production deploy command, removed its
enable marker, Worker, executor, regression test and Wrangler config, and restored
the pre-#99 fail-closed deployment rehearsal. It merged as main
`35471a63ffeed3883a4c94b893091c3b1b4fa58b`. All five exact-main gates passed and
Release Approval run `37089458826` published `alienx-ci-approved-main` for that exact
SHA, but Production Smoke run `37089212686` exhausted its 15-minute exact-revision
poll without observing the remediation revision. The repository repair was correct,
but the Cloudflare deployment had not completed.

The site was restored by an authorized Cloudflare rollback to known-good Version ID
`6533994e-f989-4677-885f-e4b63252d2b0` from PR #94. Subsequent failed Workers Builds
were traced to a separate deployment blocker rather than the removed recovery drill:
Astro's Cloudflare adapter automatically enabled an unused `SESSION` KV binding, and
Wrangler attempted to create `alienx-smarthome-session`. Cloudflare rejected that
provisioning request because a namespace with that account/title already existed
(API code 10014).

PR #119 set `session: false` in `astro.config.mjs` and added regression coverage so
the unused session binding cannot silently return. Its PR-head Cloudflare build
`bdb59ef7-cc7b-453c-82f5-7fa362817f4a` succeeded as Version ID
`2bf401ae-8f94-4377-b456-e8c0d3a94daa`. After merge, production build
`487c0a70-295b-4581-adb3-83f670b7c681` succeeded as Version ID
`8126be09-38da-45f2-b06a-32a210cea9bd`; push Smoke verified exact live revision
`81e219fc0e9e13dad669e77d5d2508c32eb75908`, and Production Integrity passed.
Incident #102 and the stale incident/recovery Operator Alert issues were closed after
that proof chain completed.

The acceptance audit keeps #58 and #63 closed with their existing evidence. #59 was
explicitly reopened because PR #99 violated its safety constraint and cannot satisfy
the required isolated negative-promotion exercise. #60, #61 and #62 also remain open;
#61 retains private account-side MFA/recovery, credential/API-token scope, applicable
WAF/security controls and private security/failure alert receipt. #62 remains
intentionally last.

## October 2 fresh review and scoped engineering closeout

Base main `adb8d5d9f5af7a0bfd074e44eaf119ecd5bcff1d` (documentation closeout
PR #90) passed all five current push workflows, CodeQL/current-alert policy,
Release Approval 37060481928, Workers Build
`527d3078-ae65-4751-bb65-bf4fef611d97` (version
`9f5872cf-210c-4a78-aeac-23fc02254284`), Smoke 37059979712 and
Integrity 37060590181; scheduled Integrity 37071337299 also passed.
The initial fresh review found review-thread resolution disabled. After the
owner's October 2 settings change (saved at 18:26:41 America/Chicago), the
connector independently verified ruleset 23059349 with
`required_review_thread_resolution: true`.
The rule remains active on the default branch and still requires PRs, all five
existing checks attributed to GitHub Actions (integration 15368), strict freshness,
no deletion/force-push, an empty bypass list and `current_user_can_bypass: never`.
This satisfies #63 / AX-011's live-setting acceptance; #63 is closed. The owner's
standing no-interactive-GitHub-login instruction is maintained in AGENTS.md.
Fresh local baseline checks passed: locked install, formatting, 94 unit tests,
source and reachable-history audits (988 text blobs), zero dependency findings,
zero type errors/warnings, build and Worker dry run. Direct live inspection from
this environment was blocked by DNS resolution; CI evidence is separate.

PR #91 completed the scoped engineering work for #64/#65, with all five PR
gates and its exact-main production chain. Updated local checks passed
103 unit tests, formatting, source audit, zero type errors/warnings, build and
Worker dry run. Local browser installation failed with a truncated archive;
actual browser coverage passed in CI and is not presented as local execution:

- Removed 76 selector entries used only by retired Work/Experience/Technology
  page identities (7,275 source CSS bytes), plus three obsolete preference route
  mappings. Active components, theme overrides and reduced-motion rules remain.
  Obsolete mappings could overwrite the server error identity for those URLs;
  unit and four-theme browser coverage now include the retired routes.
- Retained Lighthouse reports by invocation and attempt, including error text when
  the CLI writes no report. Fixed sample counts and score budgets remain unchanged.
  PR #93's initial Lighthouse run 37078004491 then hit two consecutive
  `NO_NAVSTART` trace-recording errors on `/about/` sample 2 while Wrangler served
  the route with HTTP 200 and every completed score met its committed budget. The
  runner therefore allows at most two retries (three total attempts) only for
  recognized trace-capture errors. Score failures, missing reports and unrelated
  errors still fail without retry; executable runner tests cover single-retry
  recovery, two-retry recovery and the bounded ceiling.

This engineering tranche does not certify all CSS as unused or close account,
physical-device, owner-content or rollback/recovery acceptance. #58 and #63 are
closed; Beta Closeout issues #59, #60, #61 and #62 remain open. #62 remains
intentionally last.

## Beta acceptance — incomplete

September 30 local comparison (historical baseline): npm ci, all-severity npm audit (zero findings),
88 unit tests and repository/reachable-history scans passed locally. fast-uri
3.1.8 remains in the lockfile; its previous advisory is remediated, not open work.
Build/browser evidence above is exact-main CI, not a new local browser run.

Do not publish the first GitHub release or claim beta completion while required
acceptance is unresolved. Do not invent a version. Local tests, CI, live revision,
provider acceptance/delivery, inbox receipt and human/device acceptance differ.

| ID     | Disposition                                           | Evidence or remaining acceptance                                                                                                                                                                                 |
| ------ | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AX-001 | Verified at d8bf0d3                                   | Parsed frame/resource CSP checks reject missing and weakened policy.                                                                                                                                             |
| AX-002 | Verified at d8bf0d3 / 4a51a7e                         | Candidate and exact-revision post-Smoke Integrity remain separate.                                                                                                                                               |
| AX-003 | Verified; PR #53 repair deployed                      | Three fixed Lighthouse samples, median performance, minimum other scores; no retry-until-green.                                                                                                                  |
| AX-004 | Verified at e69c280                                   | Three obsolete manual CSP hashes removed after emitted-byte mapping.                                                                                                                                             |
| AX-005 | Recovery drill failed isolation; acceptance open      | PR #99 replaced the production response with drill JSON. Incident #102 is resolved, but a genuinely isolated negative-promotion test with retained rejection evidence is still required.                         |
| AX-006 | Compatible recovery proven; #59 still open            | Authorized rollback restored production; PR #119 then deployed exact main `81e219fc` with successful Cloudflare build, exact-revision Smoke and Integrity.                                                       |
| AX-007 | Verified at e69c280                                   | Required sanitized reachable-history scan; heuristic, not exhaustive certification.                                                                                                                              |
| AX-008 | Physical-device evidence open                         | Actual screen reader, keyboard, touch, zoom and theme outcomes; resolve discovered defects.                                                                                                                      |
| AX-009 | Scoped cleanup verified in PR #91                     | PR #77 consolidated routes; PR #91 removed 76 exclusive retired-route selectors and obsolete mappings. Active/dynamic theme and component behavior remains covered.                                              |
| AX-010 | Owner editorial acceptance open; last                 | Factual consolidated homepage/About copy is deployed; explicit owner editorial/public-contact acceptance remains intentionally last.                                                                             |
| AX-011 | Verified and closed October 2                         | Ruleset 23059349 requires PR/five Actions checks, strict freshness, no bypass. Required review-thread resolution is enabled; owner save at 18:26:41 America/Chicago subsequently verified through the connector. |
| AX-012 | Repository controls verified; account acceptance open | Security/quality policies, all-severity audit, workflow/history gates remain verified; #61 is reopened for private MFA/recovery, credential scope, WAF/security controls and private alert receipt.              |
| AX-013 | Verified at e3b8e89                                   | Exact-main fresh Actions/JS/TS analyses and zero open code-scanning alerts; private Dependabot/secret inventory is separate.                                                                                     |
| AX-014 | Repository tranche verified in PR #47                 | Headers/static checks, sanitized analysis errors/warnings and offline deployment rehearsal; account scope remains open.                                                                                          |
| AX-015 | Verified at f67c91c                                   | Mandatory edge limiter, strict honeypot/Turnstile success and safe logs; live email evidence is recorded separately.                                                                                             |
| AX-016 | Live TLS verified; account acceptance open            | PR #98 continuously verifies TLS 1.0/1.1 rejection and TLS 1.2/1.3 acceptance. CBC/static-RSA compatibility remains observational; #61 retains the private account-security work.                                |
| AX-017 | Verified and closed October 3                         | Natural heartbeat and authorized inquiry delivery/receipt are proven; the GitHub-native controlled canary proved independent operator-alert creation without mailbox/provider-history access.                    |

Branch cleanup is unverified. Re-enumerate remotes, confirm each temporary head is
merged before deleting it, and retain active PRs and alienx-ci-approved-main /
alienx-ci-rejected-main tags. Future releases need their own five exact-head gates
and exact-main approval/build/Smoke/Integrity chain.

## Production-readiness priorities

This is a source/CI comparison, not an account-security certification. Finish the
following acceptance before calling beta closed; no generic rewrite is required.

| Priority / finding  | Next action and completion evidence                                                                                                                                                            | Responsible role                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| P1 — AX-005, AX-006 | Production is healthy. Execute the negative-promotion drill only on a verified isolated test Worker; retain exact rejected/recovered version evidence.                                         | Cloudflare operator + engineering |
| P1 — AX-008         | Execute the existing real-device/VoiceOver/keyboard/touch/zoom protocol and fix actual failures.                                                                                               | Human tester + engineering        |
| P1 — AX-016, AX-012 | Reassess TLS cipher findings and privately verify MFA/recovery, credential scope, WAF and private alerts. Record fixes or justified acceptance; scanner heuristics are not confirmed exploits. | Account owner/operator            |
| P1 — AX-010, final  | Owner accepts factual Work/About content and public contact/privacy expectations only after the other Beta Closeout issues are resolved.                                                       | Jordan                            |

AlienX adopted the coordination protocol through [PR #55](https://github.com/AlienX420710/alienx-smarthome/pull/55)
on September 30. The linked Cleaning PR #28 remains independently owned;
this review does not certify the peer project's current release state.
Branch cleanup is housekeeping after confirmed merge, not a production blocker.

## Historical comparison with Cleaning

Peer baseline: Cleaning main `6b154ec319d6728c0764df9f0301c0910fbc4eba`.
Its [local register](https://github.com/Cassileigh/cleaning-by-cassi/blob/main/docs/project-state.md)
owns its remaining work; this table records AlienX's adoption decisions.

| Concern      | Comparison and AlienX disposition                                                                                                                                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release      | AlienX's latest verified production release is PR #119 / main `81e219fc`, with successful Cloudflare publish, exact-revision Smoke and Integrity. Incident #102 is closed. Cleaning's release state remains independently owned.                                       |
| Forms        | Both enforce Turnstile, edge limits, bounded payloads, validation and idempotency. AlienX's JSON inquiry and Cleaning's multipart quote/customer confirmation serve different needs; retain both contracts.                                                            |
| Lighthouse   | AlienX captures CLI stderr; Cleaning's missing-report path was reproduced as ENOENT before retry. Share PR #53 as evidence, leave the repair to independent Cleaning validation. Fixed three-sample versus single-sample policies remain local.                        |
| Mail         | Both schedule 05:00 Chicago using two UTC candidates and bounded retry. Both use a direct Resend request with the platform's default redirect behavior; sender, recipient, payload and confirmation contracts remain project-local. No live test permission transfers. |
| CSP/status   | AlienX uses generated CSP hashes and a richer status view; Cleaning uses external same-origin styles and generic readiness. Neither architecture difference alone proves a vulnerability. Keep local integrity contracts.                                              |
| Dependencies | Runtime dependency pins match. Wrangler/Prettier versions, parse5 usage and Undici override scope differ; both current audits are clean. No upgrade solely to make versions identical.                                                                                 |
| Operations   | Both lack complete current owner/account/device evidence in this review. Shared procedures cannot substitute for each site's receipt/recovery records.                                                                                                                 |

Review limits: the October 3 alert-canary closeout used GitHub/repository/CI evidence
only. No mailbox or provider-history access was used for that proof. No private
account inspection, physical-device test or complete penetration test was performed
in that closeout pass. Historical provider/mailbox evidence below remains attributed
to the previously authorized October 2 checks; it is not permission for future access.

## External evidence boundaries

September 29 SSL.org browser scans on both hosts showed trusted matching
certificates, complete chains and old-protocol rejection. CBC/RSA results remain
heuristics, not confirmed timing attacks. See the pinned scan record below.
Cloudflare account inspection remains separate from public/repository evidence. A
compatible production rollback and subsequent exact-main recovery are now proven by
the October 3 #119 chain, but no successful isolated negative-promotion exercise has
been certified for #59. September 29 provider inspection found no natural heartbeat.
October 1 provider inspection confirmed the sending domain is verified and historical
inquiry delivery through September 26. On October 2, the natural 05:00 America/Chicago
heartbeat produced a provider event at 10:01:06.243Z marked delivered, and the site
owner confirmed inbox receipt. An authorized production inquiry produced a provider
event at 03:48:49.978Z marked delivered, and the site owner confirmed receipt of that
same customer-facing message. The heartbeat was not replaced by a manual send.

On October 3, controlled PR #95 supplied the final AX-017 failure condition without
email or provider access. `AlienX Alert Canary` run 37083084058 failed intentionally;
trusted default-branch `AlienX Operator Alert` run 37083095061 succeeded and created
issue #96 containing the failed workflow/run/SHA evidence. The canary changed only
`.github/alert-canary`, was closed without merge, and did not modify production.
Provider and mailbox data are private operator evidence: do not enumerate connected
Resend metadata, mailbox contents or customer messages through ChatGPT/GitHub Actions.
Any future private provider/account inspection requires explicit case-specific owner
authorization.

## Next work and coordination

The latest verified release is recorded at the top of this register; the October 3
`81e219fc0e9e13dad669e77d5d2508c32eb75908` release is historical evidence.
Next complete #59's genuinely isolated negative-promotion acceptance, then the
TLS/account and physical-device evidence. Modernize components only for concrete
semantics, responsiveness, lifecycle or measured performance. Work, Experience, Lab
and Technology are consolidated into the homepage; do not recreate standalone
destinations without a concrete customer/navigation need. AlienX is a showcase and
possible future business, not an established LLC. #62's owner editorial/public-contact
acceptance remains the final Beta Closeout step.

Both owners' chat sessions can work on either repo under the local
[coordination agreement](../AGENTS.md#cross-project-coordination). Each project
owns its own decisions and acceptance; use linked local issues/PRs for tasks.

The former central log is retired. Historical IDs and dispositions remain in the
[final log snapshot](https://github.com/AlienX420710/alienx-smarthome/blob/640062d13e9de63b1160137cc01bfd8f3b2d23bf/docs/chatgpt-communications.md). AX-20260929-shared-brain-01's central-log design is
superseded by equal-repo coordination. AX-20260929-closeout-boundaries-01 remains
covered by local email rules. AX-20260930-cassi-review-received-01 records receipt
of Cleaning PR #26's review, not a fabricated reply; CBC-20260929-handoff-01
remains historically unsent (write 403).

AX-20260929-lighthouse-stderr-01 is reproduced offline as CBC-12; repair and
independent verification remain pending
in [Cleaning's register](https://github.com/Cassileigh/cleaning-by-cassi/blob/main/docs/project-state.md#cross-project-coordination).
AlienX's repair does not prove Cleaning needs or has adopted it. The September 30
Cleaning homepage score failure is separate from the stderr investigation.
Consolidation does not close external, runtime or device acceptance.

## Historical evidence and consolidation map

The pre-cleanup snapshot is pinned to `152abcf087f13628bb31c224edd1c73db49cdacc`. These are historical documents,
not current instructions. Git history is unchanged; every removed file is
recoverable. Read the relevant evidence instead of restoring whole audits to
startup context. The current register retains unresolved findings and failures.

| Previous document                   | Preserved snapshot                                                                                                                            | Current owner                                           |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `README.md`                         | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/README.md)                         | [Repository index](../README.md)                        |
| `ai-audit.md`                       | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/ai-audit.md)                       | This register; detailed history remains in the snapshot |
| `ai-context.md`                     | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/ai-context.md)                     | [ai-context.md](ai-context.md)                          |
| `audit-remediation.md`              | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/audit-remediation.md)              | This register; detailed history remains in the snapshot |
| `beta-closeout.md`                  | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/beta-closeout.md)                  | This register; detailed history remains in the snapshot |
| `cassi-commit-inventory.md`         | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/cassi-commit-inventory.md)         | This register; detailed history remains in the snapshot |
| `chatgpt-communications.md`         | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/chatgpt-communications.md)         | [Coordination](../AGENTS.md#cross-project-coordination) |
| `closeout-2026-09-29.md`            | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/closeout-2026-09-29.md)            | This register; detailed history remains in the snapshot |
| `device-validation.md`              | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/device-validation.md)              | [Operations](release-runbook.md)                        |
| `directory-parity-review.md`        | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/directory-parity-review.md)        | This register; detailed history remains in the snapshot |
| `email-health.md`                   | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/email-health.md)                   | [Operations](release-runbook.md)                        |
| `frontend-pattern-notes.md`         | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/frontend-pattern-notes.md)         | [Contract](ai-context.md)                               |
| `frontend-runtime-audit.md`         | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/frontend-runtime-audit.md)         | [Contract](ai-context.md)                               |
| `inquiry-security-contract.md`      | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/inquiry-security-contract.md)      | [Contract](ai-context.md)                               |
| `media-audit.md`                    | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/media-audit.md)                    | [Contract](ai-context.md)                               |
| `project-state.md`                  | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/project-state.md)                  | [project-state.md](project-state.md)                    |
| `release-runbook.md`                | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/release-runbook.md)                | [release-runbook.md](release-runbook.md)                |
| `security-audit.md`                 | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/security-audit.md)                 | This register; detailed history remains in the snapshot |
| `security-closeout-2026-09-20.md`   | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/security-closeout-2026-09-20.md)   | This register; detailed history remains in the snapshot |
| `security-comparison-2026-09-26.md` | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/security-comparison-2026-09-26.md) | This register; detailed history remains in the snapshot |
| `shared-brain.md`                   | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/shared-brain.md)                   | [Coordination](../AGENTS.md#cross-project-coordination) |
| `shared-lessons.md`                 | [Read](https://github.com/AlienX420710/alienx-smarthome/blob/152abcf087f13628bb31c224edd1c73db49cdacc/docs/shared-lessons.md)                 | [Coordination](../AGENTS.md#cross-project-coordination) |

Generated commit inventories are optional research output, not current status or
manual certification. Comparison scripts remain available; use a fresh mirror
and their documented arguments, inspect applicable current changes, and record
only adoption decisions here. Generated ledgers are now gitignored.
