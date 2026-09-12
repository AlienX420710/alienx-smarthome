# Main-only release and incident runbook

All changes stay on `main`; this project does not require a feature branch or PR.

## Before release

Run `npm ci`, `npm test`, `npm run check`, and `npm run audit` on Node 22.
For browser checks, start the built Cloudflare preview on port 4321, install the
Playwright Chromium browser, and run `npm run test:browser` and `npm run test:a11y`.
`node tests/safari.cjs` requires macOS Safari WebDriver. Lighthouse configuration
is committed in `lighthouse.config.cjs`; `scripts/lighthouse.mjs` runs the locked
Lighthouse CLI, with `--accessibility` for the accessibility-only job. Keep both
Lighthouse workflows green when changing tooling. Do not use `npm audit fix --force`.

## Release acceptance

1. Record the full commit SHA on `main` and inspect every check for that SHA.
2. Confirm the Cloudflare deployment itself succeeded. GitHub's dynamic
   "Push on main" CodeQL workflow is **not** deployment evidence.
3. Run `EXPECTED_REVISION=<full-sha> node scripts/verify-release.mjs`. Push smoke
   checks do this automatically and wait at most about five minutes for rollout.
   An old healthy build cannot satisfy the check. Scheduled smoke checks monitor
   current service health without assuming the newest main commit is deployed.
4. Check both production hostnames, browser navigation, keyboard dialogs,
   narrow-screen scrolling, and the Status configuration details.

Configuration status does not prove that an API key authenticates, that a
Turnstile challenge succeeds, or that email reaches an inbox. Perform one
explicitly approved real inquiry and correlate its request/email IDs with the
provider dashboard. Do not put real inquiry contents or credentials in CI logs.

## Account-owner actions still required

- Configure release gating so Cloudflare cannot promote a failing main revision.
  Repository workflows alone do not enforce this against an independent
  Cloudflare Git integration. Preserve the requested main-only workflow.
- Configure GitHub/Cloudflare failure notifications and confirm a monitored
  recipient. A scheduled job without a recipient is not an alerting system.
- Verify Turnstile production hostname configuration, Resend sender/domain
  authentication, and actual delivery using the respective dashboards.
- Check that rate-limit namespace `2107100911` does not collide with another
  Worker owned by this account. It is this site's documented namespace.

These settings require account administration/provider access not supplied to
the repository connection. They have not been changed or declared verified.

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
