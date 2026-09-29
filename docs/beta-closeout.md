# Beta closeout — first release acceptance

Status on September 29, 2026: **acceptance remains incomplete; do not publish the first release**.
The canonical finding IDs and current deployment evidence live in
[project state](project-state.md). This checklist distinguishes completed code,
observed live behavior and external acceptance still needed.

## Current verification

Production baseline `9eae3c893bd66dcceb615792f618f883d0ed3402` passed the five
mandatory main gates, Release Approval, Smoke and Integrity. PR #50/#51 are merged.
The September 29 browser scans confirm TLS 1.0/1.1 disabled on both hosts;
cipher heuristics remain open. See [the September 29 evidence](closeout-2026-09-29.md).

PR #52 head `917d1142c2887bf15179737c87b755cef61cd362` passed four required
workflows, but Lighthouse run `36604881957` failed because Chrome could not
connect for the first homepage sample. Other completed route assessments passed;
the homepage lacked the three required valid samples. The failure remains evidence.
The subsequent cleanup needs fresh exact-head checks; no threshold is weakened.

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

PR #50 is now merged. Its temporary branch is eligible for verified cleanup.
Retain the active PR #52 branch until its changes merge safely.
Do not remove `alienx-ci-approved-main` or `alienx-ci-rejected-main`: these are
deployment-control tags, not leftover branches. Main's active ruleset still
requires a PR and five checks, strict up-to-date status, and no bypass actors.
Do not disable it to achieve a literal main-only editing workflow.

## Exit evidence required

- [ ] Final PR head passes all five mandatory gates and merges without bypass.
- [ ] Merged SHA passes Release Approval, Workers Build, Smoke and Integrity.
- [ ] Remote branch enumeration confirms only main remains after merged-head cleanup.
- [ ] AX-017: real full-form production submission, Turnstile verification and
      correlated provider delivery. The prepared September 29 submission was
      blocked by automatic approval review; it was not sent.
- [ ] AX-017: first natural daily heartbeat delivered, missing September 29 event
      investigated through Cloudflare logs, and delivery-monitor notification received.
      The configured full-form daily attempt has no verified success; the heartbeat does not replace it.
- [x] AX-016 protocol portion: SSL.org browser scans report TLS 1.0/1.1 disabled
      on both production hosts on September 29.
- [ ] AX-016 remaining scope: CBC/RSA heuristics resolved or explicitly dispositioned.
- [ ] AX-005: real Cloudflare rejection-path evidence, separate from offline mocks.
- [ ] AX-006: monitored failure-notification receipt and live rollback/recovery evidence.
- [ ] AX-008: actual assistive-technology and physical-device results recorded.
- [ ] AX-009: scoped duplicate/style-ownership cleanup passes required browser gates
      and is verified in production; retain unreviewed scope explicitly.
- [ ] AX-010: owner editorial acceptance of factual Work/About copy. No clients,
      business incorporation, results, dates or biography details are invented.

The next natural 05:00 Chicago event is September 30. Neither a replacement send
nor a future schedule establishes that it has already delivered. Cloudflare's
bot-verification screen blocked dashboard access in this session; account settings,
scheduled invocation logs, rollback and negative deployment drills were not changed.

Only after all required acceptance has evidence should beta completion be reported
and the first GitHub release proposed. Do not invent a version or publish early.
