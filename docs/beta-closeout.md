# Beta closeout — first release acceptance

Status on September 29, 2026: **deployed exact-SHA baseline verified; beta exit
acceptance remains incomplete**. The canonical finding IDs remain in
[project state](project-state.md). This is an acceptance checklist, not a claim
of zero vulnerabilities or completed operations.

## Current production baseline

Main `9eae3c893bd66dcceb615792f618f883d0ed3402` includes PR #51's
Undici security update and bounded Lighthouse runtime retry. All five mandatory
main gates passed. Production Smoke run
[36602529268](https://github.com/AlienX420710/alienx-smarthome/actions/runs/36602529268)
waited through the prior live revision and then verified this exact SHA in
production. Release Approval run
[36603112413](https://github.com/AlienX420710/alienx-smarthome/actions/runs/36603112413)
published approval for the same SHA. Production Integrity run
[36603223734](https://github.com/AlienX420710/alienx-smarthome/actions/runs/36603223734)
then obtained stable exact-revision confirmation on both production hosts and
passed all eight audited routes.

The Lighthouse repair does not lower score thresholds, reduce the required three
valid samples, or accept missing measurements. It only retries bounded transient
browser/runtime failures such as `NO_NAVSTART`; exhausted measurement failures
still fail closed.

Read-only Resend inspection on September 29 found neither the natural
`AlienX SmartHome — daily email health check — 2026-09-29` message nor a
daily full-form test marker for that date. No replacement heartbeat or direct
provider substitute was sent. The next natural scheduled heartbeat remains live
acceptance evidence; a real full-form test must still traverse production
Turnstile and be correlated separately.

## Branch cleanup inventory

The owner reaffirmed that `main` must be the only durable branch. The following
remote heads were verified against merged PRs on September 27; deletion has **not**
yet been verified. Commits remain recoverable through the recorded PR heads.

| Branch                                | Merged PR | Head SHA                                 |
| ------------------------------------- | --------- | ---------------------------------------- |
| security/close-release-evidence       | #36       | 10b067077d0c0ce075414c80246111f834ab6c81 |
| security/workflow-keyboard-closeout   | #38       | b625d27da78235fd091c0526036d7e3912931005 |
| security/live-code-scanning-policy    | #39       | 0fd014b0aef33a2efcb20c68ff7070eda470c7aa |
| docs-closeout-2026-09-21              | #40       | 47e29e1794cc1177b4ca66504cd71302ca2a644f |
| security/inquiry-fail-closed-closeout | #46       | 42e6dfe5d21cb2db6b1f50b2e3d185cc0cee14f3 |
| security/directory-parity-review      | #47       | 37741f4244bf33406744ac2eaad4a46037d5cafa |
| docs/cassi-commit-inventory           | #48       | e164b9c72ed869f3301c91a22f8808bcc7f587ba |
| security/operational-closeout         | #49       | ba880e9a7d9a7f76888a055a95e538d8f0516b13 |

Retain `fix/cassi-email-monitor` until PR #50 merges safely, then remove it too.
Do not remove `alienx-ci-approved-main` or `alienx-ci-rejected-main`: these are
deployment-control tags, not leftover branches. Main's active ruleset still
requires a PR and five checks, strict up-to-date status, and no bypass actors.
Do not disable it to achieve a literal main-only editing workflow.

## Exit evidence required

- [x] Current main SHA passes all five mandatory gates; merge verified.
- [x] Current main SHA passes exact-SHA Release Approval, Smoke and Integrity;
      Smoke observed the deployment transition before succeeding.
- [ ] Remote branch enumeration confirms only main remains after cleanup.
      September 29 enumeration still found ten stale merged heads besides main;
      no branch-deletion capability was available in the connected GitHub tool.
- [ ] AX-017: real manual and daily full-form submissions populate every legitimate
      field with the honeypot empty; production verification and delivery correlate.
      Direct-provider tests and the Worker heartbeat do not satisfy this criterion.
- [ ] AX-016: both production hosts reject TLS 1.0/1.1; retain a fresh scan.
- [ ] AX-005: actual deployment rejection evidence, separate from offline mocks.
- [ ] AX-006: failure-notification receipt and authorized live rollback/recovery.
- [ ] AX-008: actual assistive-technology and physical-device results recorded.
- [ ] AX-009/010: remaining style cleanup and authentic owner content resolved or
      explicitly dispositioned by the owner before a release-readiness claim.

Only after these criteria have evidence should beta completion be reported and
the owner asked to proceed with the first GitHub release. Do not invent a version,
publish a tag/release early, or describe configuration checks as delivery tests.
