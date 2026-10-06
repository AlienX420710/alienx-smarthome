# Release and incident runbook

Use scoped PRs for authorized changes. The owner has granted standing permission
to open/update them and merge after all five mandatory exact-head gates pass.
Keep main as the production branch and verify the resulting deployed main SHA.

## Shared preflight

Use Node 22 and `npm ci`. After the final edit, run `npm run format` and
`npm run preflight`. Preflight runs formatting, repository and history security
scans, regression tests, production build, generated deployment-target validation,
type checks, Worker dry run and all-severity dependency audit. Quality CI invokes
those same `check` and `audit` commands. Browser and post-deployment gates remain
separate and mandatory. Formatting includes instructions and package.json.
Do not commit temporary diagnostic replacements for format:check.

## Safe auto-merge

In repository **Settings → General → Pull Requests**, enable **Allow auto-merge**.
This permits native auto-merge; it does not enroll every existing or future PR.
Enable auto-merge on each eligible PR while its required checks are pending.
Automatic enrollment for all future PRs is separate work, not an effect of the
checkbox. Do not substitute a custom merge script that bypasses protections.

Keep the main ruleset active with PRs required, an empty bypass list, no force
pushes/deletions, strict up-to-date branches, required conversation resolution,
and these five checks attributed to GitHub Actions:

- `Build, type check, audit`
- `Safari / WebKit compatibility`
- `Light, dark, and accessibility checks`
- `Responsive viewport matrix`
- `Performance, accessibility, best practices, and SEO`

Do not enable a merge queue without implementing and validating `merge_group`
checks. A merge is not production acceptance: the merged SHA must still pass
Release Approval → Workers Build → Production Smoke → Production Integrity.
Rebase/update a stale PR and let its checks run again; never bypass the strict
branch requirement. Unresolved conflicts or required reviews must block merging.
The observed ruleset on 2026-09-26 requires zero human approvals; CI success is
not a claim of independent human review. For future automated enrollment, keep
privileged automation isolated from PR code and prove push workflows still run.

For unsupported GitHub administration operations, follow the no-interactive-login
rule in AGENTS.md: give the owner the exact settings steps and verify the saved
result through the connector. Do not initiate browser authentication.

Reference: [GitHub native auto-merge](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository).

## Before release

Run `npm ci`, `npm run format`, and `npm run preflight` on Node 22.
For browser checks, start the built Cloudflare preview on port 4321, install the
Playwright Chromium browser, and run `npm run test:browser` and `npm run test:a11y`.
`node tests/safari.cjs` requires macOS Safari WebDriver. Lighthouse configuration
is committed in `lighthouse.config.cjs`; `scripts/lighthouse.mjs` runs the locked
Lighthouse CLI, with `--accessibility` for the accessibility-only job. Keep both
Lighthouse workflows green when changing tooling. Do not use `npm audit fix --force`.

The quality audit collects three fixed samples per route; every performance
score must meet the unchanged 0.85 threshold. Accessibility, best practices,
and SEO must meet 0.95 in every sample. Measurement errors or missing scores
fail closed. The accessibility-only job also runs three fixed samples per route. All raw
reports and `summary.json` are retained under a unique `quality-*` or
`accessibility-*` invocation directory in the Lighthouse diagnostics artifact.
Each report names its route, sample and attempt. Only recognized trace-capture
errors (`NO_NAVSTART` or the matching trace-recording failure) may retry, with at
most three total attempts per sample (two retries). Every retry preserves the
prior report; each failed attempt also retains an adjacent `.json.error.txt`, even
when no report was produced. Score failures, missing reports and unrelated errors
are never retried. Both workflows upload the full directory on failure. Inspect
timing metrics and attempt errors before assuming a failure is transient. This is
not an automatic retry-until-pass policy.

## Release acceptance

1. Record the full commit SHA on `main` and inspect every check for that SHA.
2. Confirm the Cloudflare deployment itself succeeded. GitHub's dynamic
   "Push on main" CodeQL workflow is **not** deployment evidence.
3. Run `EXPECTED_REVISION=<full-sha> node scripts/verify-release.mjs`. Push smoke
   checks do this automatically and wait at most about fifteen minutes for rollout.
   An old healthy build cannot satisfy the check. Scheduled smoke checks monitor
   current service health without assuming the newest main commit is deployed.
4. Check both production hostnames, browser navigation, keyboard dialogs,
   narrow-screen scrolling, and the Status configuration details.

Responsive CI validates the built candidate's security headers, separate frame
and resource CSP policies, and SEO contract using
`EXPECTED_REVISION=<full-sha> node scripts/verify-integrity.mjs --candidate`.
It includes the noindex success page. Production Integrity is a separate
post-deployment workflow: push runs wait for the pushed revision and validate
both hosts against it before and after the audit. Scheduled/manual runs record
the observed revision. Use `node scripts/verify-integrity.mjs` for a read-only
live check. Do not add this post-deployment workflow to the deployment gate.

Configuration status does not prove that an API key authenticates, that a
Turnstile challenge succeeds, or that email reaches an inbox. Perform one
explicitly approved real inquiry and correlate its request/email IDs with the
provider dashboard. Do not put real inquiry contents or credentials in CI logs.

## Deployment gate

Cloudflare Workers Builds remains the deployment executor. Keep the production
branch `main`, the build command `npm run build`, and the production deploy command
`npm run deploy`.

The deploy command runs `scripts/verify-ci.mjs` before Wrangler. The verifier no
longer calls the GitHub REST API from Cloudflare and does not require a GitHub PAT.
Instead, `.github/workflows/release-approval.yml` runs inside GitHub after any of
the five required workflows completes. With GitHub's short-lived `GITHUB_TOKEN`,
that workflow checks Quality, Responsive, Accessibility, Lighthouse, and Safari
for the exact current `main` SHA. It publishes one lightweight Git tag ref:

- `alienx-ci-approved-main` when all five exact-SHA push workflows succeeded.
- `alienx-ci-rejected-main` when the latest exact-SHA evidence contains a failure.

If some checks are still missing or pending, no release ref is published.
Obsolete workflow results cannot move either release ref because the publisher
first confirms that its SHA is still current `main`.

Cloudflare verifies those refs using normal Git smart-HTTP (`git ls-remote`) and
still checks that its checkout SHA matches the Workers build SHA, that the build
branch is `main`, that the checkout is clean, and that the same SHA remains the
current `main` immediately before deployment. A rejection ref never authorizes deployment. Cloudflare keeps polling within the
existing twelve-minute window so a legitimate exact-SHA rerun can replace a
temporary rejection with approval; without that approval the build times out and
fails closed. A newer `main` revision still blocks a stale deployment immediately.

This removes the shared unauthenticated GitHub REST rate-limit dependency that
previously produced HTTP 403 failures in Cloudflare while preserving exact-SHA,
fail-closed promotion. The GitHub release-approval workflow needs `actions: read`
and `contents: write` only so its ephemeral repository token can read workflow
evidence and move the two dedicated release refs. No long-lived GitHub token is
stored in Cloudflare.

After any gate change, inspect the GitHub Release Approval run and the Cloudflare
build log. A successful release should show `CI approved main <sha>` immediately
before Wrangler publishes. Do not weaken or bypass this gate to make a failed
release green.

- Production/release workflow failures are surfaced by the trusted
  `.github/workflows/operator-alert.yml` controller as GitHub issues. It validates
  same-repository workflow origin, uses only `issues: write`, and never reads
  mailbox contents or provider message history. The controlled canary validates
  actual issue creation without breaking production.
- Verify Turnstile production hostname configuration, Resend sender/domain
  authentication, and actual delivery using the respective dashboards only when
  the owner explicitly authorizes that private account inspection.
- Check that rate-limit namespace `2107100911` does not collide with another
  Worker owned by this account. It is this site's documented namespace.

## Rollback

Keep the last known-good full SHA and Cloudflare deployment version in the
release record. If the new deployment fails, an authorized operator should
restore that known-good Cloudflare version, then verify its expected revision and
both hostnames. Revert the offending commit on `main` with a new revert commit;
do not force-reset main. Re-run all checks before another promotion.

A rollback drill has not been performed: it changes live service and requires
the Cloudflare operator. Do not mark recovery proven without such a drill.

## Incident triage

- Wrong/missing revision: investigate deployment, not the status dashboard label.
- HTTP 503 status: inspect which configuration is absent; do not weaken the check.
- HTTP 409/5xx from Cloudflare: retain timestamp and Ray ID, recheck, inspect edge
  deployment/security events if it persists. Never assume a transient is harmless.
- Inquiry 429: edge limit or bounded isolate fallback; retry after the stated delay.
- Inquiry 502/503: preserve entered data and use a fresh verification token. The
  client retains the same inquiry key while content is unchanged; provider
  idempotency prevents duplicate accepted retries within its retention window.

## Trusted workflow controllers

Release Approval and Production Integrity check out the immutable
`github.workflow_sha` that defines their trusted workflow, not an event-supplied
source revision. The candidate/deployment revision stays in `APPROVAL_SHA` or
`EXPECTED_REVISION` and must still pass exact-SHA checks. Integrity disables both
explicit and automatic setup-node package caching. Do not reintroduce a cache
or event-supplied code execution into these workflow-run controllers.

Operator Alert is also a privileged `workflow_run` controller. It does not check
out or execute the completed workflow's source revision. It accepts only failed
runs originating from this repository and may write GitHub issues only. Keep the
canary isolated from production and keep alert evidence in GitHub.

## Email health

The Worker schedules one fixed-recipient email at 05:00 America/Chicago through
src/worker.ts and shared src/mail.ts with the production RESEND_API_KEY.
Preserve the HTTP handler, 10:00/11:00 UTC candidates, local-time guard and rejection
of events over 15 minutes late or one minute early. Scheduling is best effort.
Sender: AlienX SmartHome <contact@alienxsmarthome.com>; sole destination:
alienx@alienxsmarthome.com. No public trigger, caller-selected recipient or exemption.

Date-only payloads/keys deduplicate within the provider's 24-hour retention, even
across deployments. At most three bounded transient-error attempts; permanent
errors stop. Use one direct request to the fixed Resend endpoint with the platform's
default redirect handling, a 15-second timeout, and a nonempty provider ID; fail on
missing config/exhaustion. No body/provider-error logs.

Provider and mailbox history are private operator data. Do not enumerate connected
Resend metadata, mailbox contents, or customer messages through ChatGPT or GitHub
Actions. `scripts/verify-email-health.mjs` remains an optional evidence validator
for an explicitly authorized operator invocation only; it is not an automated
monitor and must not be used without case-specific authorization. Historical live
heartbeat/inquiry evidence remains recorded in `docs/project-state.md`.

Operational failure alerting is independent of provider delivery verification.
The GitHub-native Operator Alert workflow watches Release Approval, Production
Smoke, Production Integrity, and the controlled Alert Canary. A failed trusted run
creates an operator issue using GitHub evidence only. The canary exists solely to
prove this alert path without inducing a production or email failure.

The separate full-form acceptance must fill legitimate required/optional fields,
leave the honeypot empty, retain real Turnstile/rate limits, confirm success and
correlate a unique synthetic marker with delivery. Use authorized synthetic business
mailbox data; no token injection, challenge bypass, fictional customer or direct
provider substitute. Prior tool approval rejections remain binding. The heartbeat
does not exercise this path; a configured daily browser attempt is not success.

For missing mail inspect deployed crons, invocation logs and revision first.
Provider metadata, domain status, or mailbox evidence may be inspected only with
explicit owner authorization for that specific investigation. Never extract secrets
or weaken form validation. Provider delivery is receiving-server acceptance, not
inbox placement. Mocked tests cover DST, staleness, identity, deduplication and
provider failures. Current live evidence/gaps belong only in project-state.md, not
this procedural document.

## Physical-device acceptance

Protocol prepared; no physical-device results are asserted. Automated Chromium,
WebKit, SafariDriver and axe coverage remain separate evidence for AX-008.

Record the full revision from `/api/status`, date, tester, device, OS/browser,
assistive technology, theme, text scale and reduced-motion setting. Mark each
case pass/fail/not-tested and attach sanitized evidence; not-tested is not pass.

1. Traverse all public routes with VoiceOver or another actual screen reader.
   Check headings, landmarks, meaningful names, active navigation and reading
   order; decorative artwork must not obscure essential content.
2. With a physical keyboard, use Tab and Shift+Tab in both directions, Enter
   for links/buttons, Space for appropriate controls, and Escape for overlays.
   Check visible focus, skip-to-content, modal containment and focus restoration.
3. On narrow screens, ensure the current navigation link is visible after direct
   load, page navigation, reload and Back/Forward. Scrolling the navigation rail
   must not unexpectedly move document focus or trap page scrolling.
4. Exercise command palette, theme/motion controls, homepage section navigation
   and form controls without a pointer. Repeat navigation to detect stale handlers
   or lost focus.
5. On Contact, verify labels, grouped choices, errors, consent and status
   announcements. Submit only an empty form for required-field validation;
   do not send a populated real inquiry without authorization. Leave the hidden
   honeypot untouched. CI mocks provider success/retry cases.
6. Test 200% zoom, large text, 320 CSS-pixel equivalent width and rotation in
   both themes. Confirm readable content, operable controls and unobscured focus.
7. Repeat with reduced motion. Record exact reproduction steps and route for
   every defect. Do not include customer data, tokens or private account screens.

Closing AX-008 requires actual results and resolution of discovered defects,
not merely committing this protocol.

## Shared engineering configuration and verification

The shared Browser Diagnostics workflow runs manually and on diagnostic/configuration
pull-request changes, only against the local preview.
It retains screenshots, traces, preview logs and a JSON summary. Homepage and the
configured public status page are checked. Baseline failures fail the diagnostic
run; deliberately altered CSS/JS/header modes are observations, never release
acceptance. External requests, local writes and service workers are blocked;
header experiments do not follow redirects. No provider or form delivery is tested.

`engineering.config.json` supplies explicit repository/release-ref identity,
public routes, form selectors/encoding, theme capability and fixed mail identity.
The migrated scripts and browser workflows are shared; site interaction suites
remain selected explicitly and must not be dropped. Run `npm run verify:peer --
/path/to/peer-checkout` after final formatting. It compares migrated components
and normalized lockfiles, not unimplemented application parity or deployments.
Use `SITE_DISABLE_INSPECTOR=1` only for restricted local preflight environments;
production defaults are unchanged. Native Safari still requires macOS CI.

The common Lighthouse runner uses the locked Playwright Chromium, three samples
for quality and accessibility, and requires every applicable score to meet the
unchanged threshold. At most two retries apply solely to trace-capture failures;
missing/malformed reports, process failures and score failures never retry.
All samples, attempts, assets and process diagnostics remain under `.lighthouseci`.
Historical single-sample/median results remain evidence for their recorded revisions only.

The shared form-health monitor checks visible UI, empty-form validation, security
bootstrap and unverified API rejection; it cannot prove successful delivery.
Operator Alert watches failed trusted production, release and form-health runs.
Its canary changes only `.github/alert-canary` and never touches production or
mail. Actual alert creation/owner receipt requires separate evidence.
The optional provider-evidence validator remains operator-authorized and is not
called by Actions. Mailbox receipt, MFA, credential scope and recovery evidence
remain distinct from source checks; no real quote test is authorized here.

The shared production Smoke workflow installs locked verification dependencies,
waits for its exact Git SHA at `/api/release`, verifies both hosts and configured
readiness/content markers, and sends only a deliberately unverified rejection
probe. Integrity follows a successful same-repository main push Smoke run using
the trusted controller revision; it checks that exact deployed SHA, headers, SEO,
assets, redirects and TLS. Scheduled/manual runs also pin their expected revision.
A source comparison (`npm run verify:peer -- /path/to/peer`) checks migrated shared
implementation; it never substitutes for each site's exact-head gates or deployment.
