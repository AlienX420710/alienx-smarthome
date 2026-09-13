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

Configuration status does not prove that an API key authenticates, that a
Turnstile challenge succeeds, or that email reaches an inbox. Perform one
explicitly approved real inquiry and correlate its request/email IDs with the
provider dashboard. Do not put real inquiry contents or credentials in CI logs.

## Account-owner actions still required

### Activate the prepared deployment gate

In Cloudflare, open Workers & Pages → alienx-smarthome → Settings → Build.
Keep the production branch `main` and the build command `npm run build`.
Set the production deploy command to **`npm run deploy`**. Cloudflare's default
`npx wrangler deploy` bypasses the repository's new gate.

That script requires successful Quality, Responsive, Accessibility, Lighthouse,
and Safari push workflows for the exact checkout SHA. It refuses dirty checkouts,
non-main Workers builds, stale revisions, failed checks, incomplete API evidence,
and GitHub API errors. It waits up to twelve minutes for pending checks. The
public GitHub API requires no additional token for this public repository; a
rate-limit response blocks deployment rather than bypassing verification.

Cloudflare supplies `WORKERS_CI_COMMIT_SHA` and `WORKERS_CI_BRANCH`. The gate
compares that revision with Git HEAD and rechecks main before allowing Wrangler.
Production smoke and integrity remain post-deployment monitoring, avoiding a
circular dependency on a deployment that has not happened yet.

This gate is prepared in code, **not confirmed active in account settings**.
An administrator can still bypass it by changing the deploy command or deploying
manually. Restrict deployment credentials and settings access to trusted operators.
The main check reduces stale releases but is not an atomic deployment lock.
After saving the setting, retry a build and confirm its log contains
`CI approved main <sha>` before Wrangler publishes. Test a failing required check
in an isolated non-production environment before claiming rejection is proven
at account level; do not intentionally break production main for that exercise.

Reference: [Cloudflare build/deploy commands and injected variables](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

- Activate and verify release gating so Cloudflare cannot promote a failing main revision.
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
