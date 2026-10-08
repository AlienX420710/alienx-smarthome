# AlienX — architecture and maintenance contract

Read AGENTS.md and [current state](project-state.md). Exact versions belong to
package.json and the lockfile. Node >=22, npm ci, Astro/TypeScript and Cloudflare
Workers remain the stack. This is a technology showcase, not a home-control system.

## Ownership

- src/pages/components own routes/UI; middleware owns headers and inquiry abuse
  prevention; api/inquiry.ts independently revalidates fields. Defense in depth
  is intentional, not duplicate code to remove.
- src/mail.ts owns shared mail transport; src/worker.ts preserves HTTP and
  adds scheduling. ASSETS, IMAGES, SESSION and mandatory INQUIRY_RATE_LIMITER
  bindings remain separate; namespace 2107100911 is reserved for this site.
- public/site-preferences.js applies theme/motion before paint and page swaps;
  contact-security.js supplies site-specific Turnstile options and bootstrap to
  the shared public/turnstile-engine.js lifecycle.
- The homepage owns the consolidated Work, Experience, Lab and Technology customer
  journey; those former standalone routes, route classifications and exclusive
  theme selectors are retired. Requests to retired routes keep the server-declared
  error identity, including after preference application.
- src/styles/site-canvas.css owns the opaque root canvas on every page; global.css
  supplies the theme palette. Branded error pages keep their terminal treatment.
  src/styles/page-themes.css
  owns shared route theme overrides. Explicit saved themes override OS preference;
  system mode still works.
- Scripts own audits, candidate/live verification, bounded Lighthouse and the
  Git-ref deployment gate. Tests follow .test.cjs / .spec.cjs concern-based naming.

## Inquiry security contract

`/privacy/` and `/terms/` own the public website policies, presented by
`src/layouts/PolicyLayout.astro`. The contact form links both below its submit
controls, and the footer links them site-wide. Policy copy reflects personal
operation in Wisconsin and no marketing use of inquiry information. The existing
required contact permission remains inquiry-specific, not marketing consent or a
paid-service contract. Project terms require a separate agreement. Both routes
are configured for the existing shared browser, accessibility and integrity gates.

`POST /api/inquiry` and `/api/inquiry/` share the same middleware boundary.
Origin (when supplied) must match; Origin is not authentication. JSON only,
16,384 streamed bytes maximum regardless of Content-Length, object payloads,
and valid bounded retry-key format are enforced before provider verification.

The bounded isolate limiter supplements the mandatory Cloudflare edge-location
binding. Missing/failing edge protection rejects requests; neither counter
claims a strict worldwide quota. Exhaustion returns 429 with Retry-After.
The status API reports missing required edge configuration as degraded.

The honeypot must be absent or exactly an empty string. Turnstile requires
configured secrets/hostnames, a bounded token, boolean success, an allowed
hostname and action `contact`. A ten-second verification timeout fails closed.
Only server-owned locals pass verified data to the handler; client headers
cannot substitute for verification. The handler independently validates fields,
allowlists and consent and escapes submitted HTML content.

Mail goes from the fixed configured sender to the fixed business recipient;
the submitted email is a reply-to, not a caller-selected business destination.
The request identity and canonical submitted content determine a stable
idempotency key, independent of refreshed Turnstile tokens. Provider HTTP
success and a nonempty email ID are required before application success. The shared
transport performs one direct POST to https://api.resend.com/emails using the
platform's normal fetch redirect behavior and a 15-second timeout; do not add custom
redirect policy without concrete provider evidence. Logs must not contain arbitrary
transport exceptions, verification payloads, credentials or inquiry contents.

Acceptance is not delivery; neither a success-page visit nor public status proves
mail reached the receiving server or inbox. Unit/browser tests mock providers
and send no email. A real inquiry, scheduled production email, delivery event,
notification receipt and rollback drill require their own evidence. See
[project state](project-state.md) and [directory comparison](project-state.md#historical-evidence-and-consolidation-map).

## CSP and source conventions

Validate CSP against built/deployed output, not astro dev. Astro generates script
hashes; manual allowances require exact emitted-byte mapping. AX-004 removed
obsolete hashes; do not restore them speculatively. Preserve separate frame/resource
policies and Turnstile allowances. Static assets may bypass middleware: _headers
and dynamic responses both need validation. No blanket COEP/unsafe-inline or blind
replacement by Cleaning's host-only policy.

Use explicit field allowlists, pinned Prettier/Astro formatting, exact dependencies
and synchronized lockfile, SHA-pinned Actions, minimal explicit permissions,
read-only checkouts and trusted workflow origins. No pull_request_target, write-all
or casually widened scopes. Only the audited approval publisher needs ref writes.
Keep all-severity dependency audit, sanitized repository/history scans and main's
fresh-analysis/zero-alert policy. Scans are heuristic, not proof no secret existed;
never print credential matches or rewrite history to hide them.

## Frontend and media

The contact intro sits above a full-width form within the responsive content
container. Fieldset rows own vertical spacing; grid children do not receive
sibling margins. Text/select controls share a minimum height and grid labels
reserve wrap space. Every route uses the shared opaque theme canvas to avoid
transparent root-gradient artifacts in full-page capture; real iOS capture remains
device evidence. The homepage call-to-action uses an opaque linear gradient.

Prefer native HTML/CSS, semantic controls and progressive enhancement before JS
or dependencies. Verify current browser support and licenses before adapting ideas.
Require keyboard/touch, both themes, reduced motion and Safari behavior; device
acceptance stays separate. Native dialog/disclosure/form semantics, event delegation
where helpful, and cleanup on Astro swaps remain the default.
Derive timers from timestamps; use requestAnimationFrame for animation and pause
when hidden/disconnected. Keep navigation usable without enhancements and preserve
ordinary touch scrolling. Status has bounded requests and hidden-page pauses;
visible and physical palette Escape controls dismiss and restore focus correctly;
contact retries preserve request identity without reusing verification tokens.

The image script decodes raster assets before build. Preserve originals and only
generate derivatives that serve real requests. Do not lazy-load LCP/hero imagery
by default. Use below-fold native lazy loading, intrinsic dimensions/aspect ratio,
responsive sources where needed and video posters. Keep CSS/SVG/canvas primitives
rather than unnecessary raster downloads. Detailed idea sources remain in history.

## Local work

Run npm ci, npm run format, npm run preflight and affected browser suites.
Preflight includes formatting, security scans, tests, build, generated deployment
target validation, types, Worker dry run and dependency audit.
npm run cf-typegen regenerates scoped Worker types. ALIENX_DISABLE_INSPECTOR=1
is the existing local restricted-interface workaround, not a production relaxation.
Unavailable browser execution is blocked, not passed. Release steps live only in
[operations](release-runbook.md).

## Shared engineering ownership

`engineering.config.json` owns explicit non-secret site inputs for migrated
release/monitoring/browser tooling. `scripts/site-config.mjs` validates repository
and release-ref identity. Release verification uses the shared Git-ref verifier
and trusted approval publisher; the production target guard also runs at deploy.
The shared browser runner selects committed site interaction suites without
changing business forms or recipients. The shared form monitor uses empty-token
rejection only. Shared framework/CSP/integrity implementation is described below; exact-revision
release acceptance stays in the existing findings register.

## Shared release and validation implementation

Smoke requests use unique query identifiers and explicit no-cache/no-store request
headers, matching the freshness intent of release and integrity verification.
The final exact-revision assertion still fails on a changed or stale response;
there is no retry that converts a mismatch into acceptance.

`engineering.config.json` supplies site identity, routes, selectors, rendering/CSP
inputs and image transformations. `astro.config.mjs`, `src/security.ts`, release
metadata generation, integrity/SEO verification and production smoke use the same
implementation in both repositories. `/api/release` exposes only the generated
40-character revision with no-store caching. Site-specific status schemas remain
explicit inputs to verification. Shared heartbeat retries cancel failed response
bodies best-effort; cancellation errors never convert permanent errors into retries.
The 05:00 Chicago schedule, fixed recipients and stable daily keys are unchanged.

## Shared navigation behavior

`public/navigation.js` owns active-link rail visibility and optional
`data-command-trigger` activation. It moves only the rail, reveals after font,
resize and page lifecycle changes, and disconnects observers before Astro swaps.
Re-executing the script does not duplicate handlers. Site markup and styles stay
separate; neither a command button nor an extra navigation item is added to a site.

## Shared application primitives

`src/worker.ts`, `src/mail.ts` and `src/email-health.ts` are identical across both
repositories. Mail identity, timeout, daily message/key and permission to send a
customer confirmation are explicit non-secret configuration. Scheduled/business
mail always uses the fixed recipient; only Cleaning's existing confirmation path
can use its validated customer address. The scheduled time and retry contract are
unchanged.

`src/status.ts` and `/api/status` share configuration-only readiness evaluation,
strict nonblank credentials/hostnames, callable limiter checks, bodyless HEAD and
405 responses with Allow. All status responses are no-store with a restrictive
CSP and no-referrer policy, preserved through middleware. Cleaning retains its
generic private schema; AlienX retains its existing configured-check metadata.
No status request calls a provider or consumes a limiter counter.

`src/form-engine.ts` owns bounded stream reads with reader cleanup, the bounded
isolate limiter, Turnstile verification, HTML escaping, email syntax and content
digests. Site routes still own their field schemas, limits, response copy and
retry payloads. Mandatory edge bindings and independent handler validation remain.
The peer verifier compares these engines and their shared regression tests. UI
behavior and remaining route/schema extraction are still open parity work.

## Shared challenge widget lifecycle

`public/turnstile-engine.js` owns single-instance rendering, reset, cleanup before
Astro swaps and rendering on page load. Duplicate initialization preserves the
current challenge; callbacks from a removed widget cannot update the next page.
Provider reset/remove exceptions do not interrupt form recovery. Failed render
attempts retain the site's error notification and can be retried on the next load.
Container resizes and root preference changes reevaluate adapter presentation;
only a changed size class/theme replaces the challenge. Adapters choose flexible
at 300px of available width and compact below it. AlienX uses its saved theme
when selected, otherwise the provider's automatic theme.
Site adapters retain their action, response-field name, size, callbacks and provider
bootstrap. The engine loads before those adapters; no challenge bypass or change
to server verification is introduced. Unit and mocked Chromium/WebKit cases cover
this lifecycle; they do not establish live challenge completion or mail delivery.

## Shared full-page canvas

`src/styles/site-canvas.css` owns opaque, matching html/body backgrounds and a
viewport-height minimum on every HTML route. BaseHead imports it on normal,
policy, receipt and error pages. Site foundations supply `--site-canvas` from
their own theme palette; page styles do not override root backgrounds. Brand
surfaces, artwork and content remain local. Shared Chromium/WebKit coverage visits
all configured public routes and error pages at phone, tablet and desktop widths
in light/dark mode, plus explicit saved-theme precedence where supported. It
scrolls to load images before full-page capture and checks opacity, overflow and
image loading. Automated capture is separate from physical iOS Full Page acceptance.
