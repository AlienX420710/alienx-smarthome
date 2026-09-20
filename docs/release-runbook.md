# Release and incident runbook

Use scoped PRs for authorized changes. The owner has granted standing permission
to open/update them and merge after all five mandatory exact-head gates pass.
Keep main as the production branch and verify the resulting deployed main SHA.

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
current `main` immediately before deployment. A rejection ref blocks immediately;
missing approval waits up to twelve minutes and then fails closed. A newer `main`
revision blocks a stale deployment.

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
