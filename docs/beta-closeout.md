# Beta closeout — first release acceptance

Status on September 27, 2026: **not complete; do not publish the first release**.
The canonical finding IDs remain in [project state](project-state.md). This is an
acceptance checklist, not a claim of zero vulnerabilities or completed operations.

## Current PR failure

PR #50 head `3d007efc0064119620fc318de565318dcdee8c27` passed Quality,
Responsive, Accessibility, Safari and CodeQL. Lighthouse run
[36320028388](https://github.com/AlienX420710/alienx-smarthome/actions/runs/36320028388)
failed because Chrome returned `NO_NAVSTART` for Status sample 1. All reported
completed route assessments met thresholds. Missing measurement correctly failed
the gate. One failed-job rerun was requested after inspecting the logs; no score
threshold, sample count, runtime-error rejection or browser assertion was weakened.
The original failure remains evidence. A new head requires fresh exact-head gates.

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

- [ ] PR #50's final head passes all five mandatory gates; merge verified.
- [ ] Merged SHA passes Release Approval, Workers Build, Smoke and Integrity.
- [ ] Remote branch enumeration confirms only main remains after cleanup.
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
