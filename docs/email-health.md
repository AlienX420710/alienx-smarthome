# Production email health

The Worker schedules one fixed-recipient email at **05:00 America/Chicago**,
using the existing production `RESEND_API_KEY`. No new key, environment variable,
or GitHub Actions secret is required. At the owner's September 27 direction,
monitoring follows Cleaning by Cassi: ChatGPT checks the connected Resend account.

## Production path and safety

`src/worker.ts` preserves Astro's fetch handler and adds a scheduled handler.
Two UTC cron candidates (10:00 and 11:00) cover daylight and standard time;
the timezone guard sends only for local 05:00. Events over 15 minutes late or
over a minute in the future are ignored. Cloudflare scheduling is best effort.

The scheduler and validated inquiry endpoint share `src/lib/mail.ts`, the
existing Worker credential, sender `AlienX SmartHome <contact@alienxsmarthome.com>`
and sole destination `alienx@alienxsmarthome.com`. There is no public send trigger,
caller-selected destination or Turnstile exemption. No customer inquiry is created.

Date-only payloads and idempotency keys deduplicate retries across deployments
within the provider's 24-hour retention. Three bounded attempts retry transient
errors; permanent HTTP errors stop. Requests reject redirects and time out after
15 seconds. Success requires a nonempty provider ID; missing configuration and
exhausted attempts fail the invocation. Logs omit bodies and provider errors.
Provider acceptance is not delivery.

## Independent delivery monitoring

The enabled AlienX production-health monitor checks at 05:30 America/Chicago
through ChatGPT's existing Resend connection. It requires the exact dated subject,
sender display name/address, sole recipient, today's timestamp at or after 05:00,
and provider `delivered` status. Missing, sent-only, bounced, failed, wrong-identity
or inaccessible evidence is not success. It paginates when necessary and never
sends a replacement email that could conceal a failed scheduled invocation.

The monitor separately checks the current main SHA, five mandatory release gates,
Release Approval, Workers Build, Production Smoke and Production Integrity.
Those CI results do not prove delivery. The extra credential-dependent Actions
email workflow is removed, not reported as passing. The injectable evidence
validator in `scripts/verify-email-health.mjs` remains covered by mocked tests;
it has no environment-variable entrypoint and is not the active monitor.

Provider delivery confirms receiving-server acceptance, not inbox placement or
human receipt. Failure notifications arrive through ChatGPT independently of mail.
The monitor configuration was updated on September 27; this does not prove that
the owner received a failure notification.

## Missing-email response and acceptance

Read-only Resend inspection on September 27 at 07:38 Chicago found no matching
daily message. The sender's source follows Cassi's scheduled-handler design, but
source parity does not establish deployed cron activation or successful invocation.
Inspect Cloudflare's deployed cron triggers and scheduled-event logs for 10:00 UTC,
then correlate the invocation with provider metadata. Do not extract credentials,
weaken inquiry validation, or send an unrelated test to conceal the failure.

All five exact-head gates and the merged revision's approval/build/smoke/integrity
chain remain required. Mocked tests cover DST transitions, stale events, fixed
identity, duplicate prevention and provider failures. First real scheduled delivery,
failure-notification receipt and live rollback remain unverified.

Reference implementation: [Cleaning by Cassi email health](https://github.com/Cassileigh/cleaning-by-cassi/blob/ee9f3e8898fcab7d250983d7ca733a29e87dc946/docs/email-health.md).
