# Security and CI closeout — 2026-09-20

## PR #36 evidence

GitHub inspection found PR #36 still open at
`86eb933079ce7c8587d0486f911ff88297403797`. Quality run
[35478798965](https://github.com/AlienX420710/alienx-smarthome/actions/runs/35478798965)
failed at formatting in `tests/release-gate.test.cjs`; later steps were skipped.
The pinned formatter corrected one ternary expression without changing behavior.

Corrected head `10b067077d0c0ce075414c80246111f834ab6c81` passed all five
mandatory PR workflows before the expected-head-SHA guarded merge:

| Gate          | Successful run |
| ------------- | -------------- |
| Quality       | 35479377249    |
| Responsive    | 35479377215    |
| Accessibility | 35479377227    |
| Lighthouse    | 35479377209    |
| Safari        | 35479377211    |

PR checks use GitHub's candidate merge checkout; their run metadata is associated
with the exact PR head above. They are not main-push approval evidence.
The resulting merge SHA is `f532099632ea0c093629ff08b1b46f4a645d6b45`.
Production verification for that exact merge SHA passed:

- Main-push Quality 35479617876, Responsive 35479617908, Accessibility
  35479617894, Lighthouse 35479617926, and Safari 35479617898 succeeded.
- Release Approval job 105995562233 logged publication of approval for the
  exact merge SHA at 2026-09-20T00:51:16Z.
- Cloudflare Workers build `efa7f4af-81be-4769-8f65-1d8d7d1bb25a` succeeded
  (GitHub check 105995645094).
- Production Smoke run 35479618014 verified the exact healthy revision,
  both production hosts and operational status at 00:51:55–56Z.
- Production Integrity run 35479886677 checked out that same SHA after Smoke,
  required three stable confirmations, and passed eight audited routes on both
  production hosts at 00:52:27–32Z. This is positive promotion evidence, not
  proof of a negative rejection or rollback drill.

## Architecture comparison

Compared AlienX main `f532099632ea0c093629ff08b1b46f4a645d6b45` with
Cassileigh/cleaning-by-cassi `24a28a8dfdc0af17acc3d3825305d24f6b552d7b`.

- Adopt Cassi's explicit read-only checkout credential policy and repository-origin
  check before a completed workflow can select the Integrity checkout.
- Adopt Cassi's real Playwright WebKit navigation/interaction execution alongside
  macOS SafariDriver. Preserve AlienX's committed tests and all existing gates.
- Preserve AlienX's exact-SHA approval/rejection refs, full reachable-history scan,
  dependency audit, CSP verification, fixed Lighthouse sampling/thresholds, and
  successful Smoke → Integrity sequencing.
- Shared suite commands are `test:browser`, `test:a11y`, and `test:webkit`.
  Existing gate display names remain stable because workflow triggers depend on
  them. Any cross-repository display-name migration must update consumers together.
- Scheduled Integrity monitors the observed deployed revision; it must not assume
  newest main was deployed when a release was rejected.

## Keyboard regressions

The new committed suite uses actual Tab/Shift+Tab and keyboard activation instead
of programmatic focus or pointer clicks to reach controls. It covers all nine
routes in light/dark, skip links, real URL navigation, command opening/closing,
focus containment/restoration, Tab-selected command activation, Technology layers,
Lab radios/range/disclosures, Contact submission/retry with mocked providers, and
Experience stages. This does not establish screen-reader or physical-device results.

The command palette previously intercepted Enter from result buttons and activated
its independent search selection. Enter handling now leaves native button activation
intact. Contact input styling no longer suppresses the global focus outline; custom
focusable Experience stages receive the shared visible-focus rule.

Local verification: locked install, formatting, unit tests, repository audit,
type checking, build, and Wrangler dry run were executed. The initial local build
failed because inspector port discovery invoked restricted network-interface APIs.
`ALIENX_DISABLE_INSPECTOR=1` uses the adapter's supported `inspectorPort: false`
option without changing production defaults or CI requirements. Browser installation
failed on repeated CDN timeouts; browser execution remains a CI verification gate.

## Operational evidence still required

The visible active ruleset protects default-branch deletion and non-fast-forward
updates, with no bypass actors. Its rules do not require status checks. The separate
branch-protection read returned HTTP 403 (`Resource not accessible by integration`);
do not infer that other protection is absent. Account policy is not verified.

AX-005 remains open until negative deployment rejection is actually demonstrated;
classifier unit tests alone do not prove the remote rejection ref was consumed.
AX-006 still needs monitored alert receipt and an authorized Cloudflare rollback
with before/after version and revision evidence. AX-008 needs real assistive-device
verification in addition to browser regression results. AX-010 stays last.

## Production email health check contract

The required daily schedule is 05:00 America/Chicago, including DST transitions.
An unrelated direct Resend send does not satisfy the production-path requirement.
The check must execute production-owned email handling, correlate the request ID
with the provider email ID and delivery result, and record CI failure for missing,
failed, or uncorrelated delivery evidence. Provider acceptance and delivery are
separate; provider delivery is not proof of inbox placement or a human reading it.

Keep public inquiry validation, Turnstile, rate limiting, and idempotency intact.
Do not use test Turnstile keys or a CI bypass in production. Any dedicated synthetic
entry point needs explicit authentication, bounded replay-safe fixed-recipient
behavior, and the same production mail implementation. Do not claim this schedule
is active until configuration and a real first delivery have been verified.
