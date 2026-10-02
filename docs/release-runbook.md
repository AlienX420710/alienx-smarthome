# Release and incident runbook

Use scoped PRs for authorized changes. The owner has granted standing permission
to open/update them and merge after all five mandatory exact-head gates pass.
Keep main as the production branch and verify the resulting deployed main SHA.

## Safe auto-merge

In repository **Settings → General → Pull Requests**, enable **Allow auto-merge**.
This permits native auto-merge; it does not enroll every existing or future PR.
Enable auto-merge on each eligible PR while its required checks are pending.
Automatic enrollment for all future PRs is separate work, not an effect of the
checkbox. Do not substitute a custom merge script that bypasses protections.

Keep the main ruleset active with PRs required, an empty bypass list, no force
pushes/deletions, strict up-to-date branches, and these five checks attributed
to GitHub Actions:

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

Reference: [GitHub native auto-merge](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository).

## Before release

Run `npm ci`, `npm test`, `npm run check`, and `npm run audit` on Node 22.
For browser checks, start the built Cloudflare preview on port 4321, install the
Playwright Chromium browser, and run `npm run test:browser` and `npm run test:a11y`.
`node tests/safari.cjs` requires macOS Safari WebDriver. Lighthouse configuration
is committed in `lighthouse.config.cjs`; `scripts/lighthouse.mjs` runs the locked
Lighthouse CLI, with `--accessibility` for the accessibility-only job. Keep both
Lighthouse workflows green when changing tooling. Do not use `npm audit fix --force`.

The quality audit collects three fixed samples per route and compares median
performance against the unchanged 0.85 threshold. Accessibility, best practices,
and SEO must meet 0.95 in every sample. Measurement errors or missing scores
fail closed. The accessibility-only job runs one sample per route. All raw
reports and `summary.json` are retained in the Lighthouse diagnostics artifact;
inspect timing metrics before assuming a failure is transient. This is not an
automatic retry-until-pass policy.

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

- Verify failure notifications reach a monitored recipient. A scheduled job
  without a recipient is not an alerting system.
- Verify Turnstile production hostname configuration, Resend sender/domain
  authentication, and actual delivery using the respective dashboards.
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

## Email health

The Worker schedules one fixed-recipient email at 05:00 America/Chicago through
src/worker.ts and shared src/lib/mail.ts with the production RESEND_API_KEY.
Preserve the HTTP handler, 10:00/11:00 UTC candidates, local-time guard and rejection
of events over 15 minutes late or one minute early. Scheduling is best effort.
Sender: AlienX SmartHome <contact@alienxsmarthome.com>; sole destination:
alienx@alienxsmarthome.com. No public trigger, caller-selected recipient or exemption.

Date-only payloads/keys deduplicate within the provider's 24-hour retention, even
across deployments. At most three bounded transient-error attempts; permanent
errors stop. Use one direct request to the fixed Resend endpoint with the platform's
default redirect handling, a 15-second timeout, and a nonempty provider ID; fail on
missing config/exhaustion. No body/provider-error logs.

The existing 05:30 Chicago ChatGPT health monitor checks connected Resend metadata:
exact dated subject, sender name/address, sole recipient, today's timestamp after
05:00 and delivered status; paginate as needed. Missing/pending/bounced/wrong-identity
or inaccessible evidence fails acceptance. Never backfill mail to conceal failure.
The 06:00 heartbeat watch is already configured; inspect before changing schedules.
Configuration is not execution or actual notification receipt.

The separate full-form acceptance must fill legitimate required/optional fields,
leave the honeypot empty, retain real Turnstile/rate limits, confirm success and
correlate a unique synthetic marker with delivery. Use authorized synthetic business
mailbox data; no token injection, challenge bypass, fictional customer or direct
provider substitute. Prior tool approval rejections remain binding. The heartbeat
does not exercise this path; a configured daily browser attempt is not success.

For missing mail inspect deployed crons, invocation logs, revision, provider metadata
and domain status through authorized access. Never extract secrets or weaken form
validation. Provider delivery is receiving-server acceptance, not inbox placement.
Independent notifications use ChatGPT; record actual receipt separately. Mocked
tests cover DST, staleness, identity, deduplication and provider failures. Current
live evidence/gaps belong only in project-state.md, not this procedural document.

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
4. Exercise command palette, theme/motion controls, technology controls and
   Experience exhibits without a pointer. Repeat navigation to detect stale
   handlers or lost focus. Keep experimental `/lab` results separately labeled.
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
