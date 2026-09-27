# Production email health

The Worker schedules a fixed-recipient email for **05:00 America/Chicago**.
Two UTC cron candidates (10:00 and 11:00) cover daylight and standard time; the
scheduled-time timezone guard sends only at local 05:00. Events over 15 minutes
late or implausibly in the future do not send. Cloudflare cron timing is best
effort, not a guarantee of exact arrival time.

## Production path and safety

`src/worker.ts` keeps Astro's normal fetch handler and adds only a scheduled
handler. `src/lib/mail.ts` is the shared production transport used by both the
validated inquiry endpoint and the scheduler. Both use the existing Worker
`RESEND_API_KEY`, sender and business destination. The caller cannot override the
sender/destination; redirects are rejected and requests time out after 15 seconds.
There is no public send trigger or Turnstile exemption. The scheduled message
creates no customer inquiry and tests no visitor challenge or browser submission.

A stable date-only payload and idempotency key deduplicate same-day retries,
including across deployments within Resend's 24-hour retention. There are at most
three attempts, retrying transient/provider-acceptance uncertainty and stopping on
permanent HTTP errors. Missing configuration, exhausted attempts and missing or
blank provider IDs fail the scheduled invocation. Logs omit message bodies and
provider-controlled errors. Provider acceptance is not delivery.

## Independent CI delivery evidence

`AlienX Email Delivery Health` runs at 10:25 and 11:25 UTC and can be dispatched
manually on main. The pre-05:00 winter run explicitly reports not-due; it is not
delivery evidence. A due run requires today's exact health subject, fixed sender,
single business destination, a valid timestamp after local 05:00, nonempty email
ID and provider `delivered` status. Missing mail, only `sent`, bounce, malformed
evidence, exhausted pagination, unavailable API or missing credential fails CI.
Reports publish the date/result, not private mail records. No mail is sent by CI.

The monitor uses only GET requests, but **do not assume its credential is
read-only**: provider key permissions must be inspected. Configure a dedicated
credential capable of listing sent-email delivery evidence in the repository's
Actions secret `RESEND_MONITOR_API_KEY`. Use the minimum supported provider scope;
if the provider requires broader access, account for that scope and rotation in
the operational review. Never copy a key into chat, source or workflow YAML.
The existing Worker sending key is not extracted or widened for this purpose.

Secret use is confined to scheduled/manual main runs with an immutable trusted
controller checkout, read-only GitHub permissions and no dependency installation
or package cache. It is never exposed to PR code. GitHub Actions can delay
scheduled jobs; a missing run is not a green delivery check.

## Activation and acceptance

1. Merge through all five exact-head gates and verify the merged SHA through
   Release Approval, Workers Build, Smoke and Integrity. Confirm both cron
   triggers in the deployed Worker configuration.
2. Configure the dedicated Actions monitor secret and GitHub/Cloudflare failure
   notifications to a monitored recipient. These are account operations, not
   settings certified by committing this file.
3. After the first 05:00 Chicago invocation, correlate scheduled-event success,
   the provider delivery event and a due CI run. Record mailbox receipt separately;
   provider delivery does not establish inbox placement or human reading.
4. Prove a controlled monitor failure produces a received notification. Retain
   the failure and recovery evidence. Do not suppress failures to close the audit.

Current implementation has mocked schedule/transport/monitor regressions, including
both DST transitions. First live scheduled delivery, the monitor credential,
alert receipt and live rollback are not yet verified. Historical delivered
inquiries are separate evidence and cannot certify this new scheduler.

References: [Cloudflare scheduled handlers](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/),
[Astro custom entrypoint](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#changed-custom-entrypoint-api),
[Resend delivery records](https://resend.com/docs/api-reference/emails/list-emails).
