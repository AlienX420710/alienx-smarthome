# Audit remediation

Source: AlienX-SmartHome-Audit.md, baseline d55378c.
See also: [ai-audit.md](ai-audit.md) for a point-in-time full audit and
[ai-context.md](ai-context.md) for assistant onboarding — this file is the
running remediation log against the baseline above, not a fresh audit.

## Inquiry boundary and contact flow

Implemented on main:

- Protect canonical and trailing-slash inquiry routes; require server-owned verified locals in the endpoint.
- Check content type and origin, bound streamed bytes, and reject non-object JSON before external verification.
- Forward the honeypot; cap the isolate rate-limit map. The limit remains isolate-local, not a distributed abuse control.
- Handle null email-provider responses, bound email fetch duration, and reject punctuation-only phone numbers.
- Load security initialization from a same-origin external script with navigation cleanup; remove the redundant interval.
- Rebind contact handlers after client navigation; use POST for native fallback, preserve phone input, reset single-use verification after failures, and bound client requests.
- Replace the CSP-blocked header inline click handler with an event listener.
- Associate displayed form errors with their controls.
- Run inquiry regression tests in the Quality workflow.

Validation: 12 mocked handler regression tests pass; TypeScript noEmit passes. These tests do not send email. Astro checking still reports 23 pre-existing errors outside this patch's security boundary; full browser/deployment validation remains outstanding. Provider delivery and dashboard configuration are not verified.

Next: fix remaining Astro diagnostics and navigation interaction tests, then theme consistency, status refresh/overflow, museum animation lifecycle, accessibility and workflow/deployment gates. No audit-wide completion is claimed. Distributed rate limiting and idempotent inquiry retries also remain open.

## Astro checks and navigation behavior

Implemented in the next main commit:

- Add pinned @astrojs/check tooling and run Astro plus TypeScript checks in Quality and the local check command.
- Isolate generated Worker runtime declarations from browser globals. Run `npm run cf-typegen` to regenerate and scope them together.
- Validate status API payloads before rendering or using command diagnostics; bound command diagnostic fetches.
- Repeat Status refresh after every completed request; abort pending work and remove listeners on navigation. Reinitialize on return, pause polling while hidden, and avoid the refresh shortcut in editable controls/dialogs.
- Rebind Technology layer controls after navigation and expose selected state and live detail text.
- Replace command links with buttons; keep `/clear` open and handle unavailable preference storage.
- Add navigation `aria-current`, correct component reload props, and remove stale compiler hints.
- Fix narrow Status heading/grid sizing and Contact grid/fieldset sizing; use compact Turnstile so the widget fits narrow forms.
- Add four browser interaction regressions to the responsive workflow, covering Technology revisits, the command button and clear, recurring Status refresh/cleanup, and Contact retry after navigation.

Local validation: 20 unit/handler tests pass; Astro and TypeScript report zero errors, warnings, or hints. The build compiles all bundles but local Cloudflare prerendering still stops at the environment's `uv_interface_addresses` restriction. Full build and the new browser tests must be verified by GitHub Actions. Theme consistency, remaining accessibility work, museum lifecycle, distributed rate limiting, idempotency, and release gating remain open.

## Theme precedence and accessibility coverage

- Saved explicit themes now override OS-color CSS throughout the pages, with system-mode CSS retained when no explicit preference is present.
- A same-origin head script applies preferences and page identity before paint and to the incoming document before client navigation swaps. Theme changes remain usable when storage is unavailable.
- Technology owns its light stylesheet; its small green/blue labels use darker, contrasting colors while the dark system diagram keeps its own palette. System light mode receives the same styles as explicit light mode.
- Contact error and placeholder colors have light/dark variants.
- Accessibility tests now live in a maintained test file and cover eight routes in six preference/OS combinations, including the success page and opposite OS/explicit settings. Explicit-theme colors are checked for invariance when the OS changes. Corrected the large-bold-text contrast threshold and included WCAG 2.1 checks.
- Browser failure reports retain screenshots/traces, and hidden Lighthouse reports are uploaded.

Local verification: 23 unit tests pass and Astro/TypeScript remain clean. CI validates the expanded accessibility and interaction matrix. Earlier lifecycle/overflow repairs passed all 88 browser checks, Lighthouse, Safari, Quality and production checks at 8599c5c.

## Completed theme correction and remaining runtime repairs

The follow-up theme correction at 0fd34b7 passed every workflow, including the expanded 48-case accessibility matrix and Lighthouse. The previous theme migration had copied only the first rule of each media block; the complete explicit rule sets are now present.

The next runtime repair renders the seven intended museum exhibits on the server, replaces both older museum scripts with one lifecycle-managed controller, pauses offscreen/background/reduced-motion animation, supplies keyboard alternatives, and permits vertical touch scrolling. The old scripts and unused GlowCard component were removed; they remain recoverable in Git history.

Command surfaces now use native modal dialogs; pages include a keyboard skip link. The receipt page is noindex, excluded from the sitemap, and no longer claims that a direct visit proves delivery. Inquiry retries use stable, payload-bound Resend idempotency keys (the provider retains them for 24 hours). A Cloudflare rate-limiter binding shares counters within each edge location; it is eventually consistent, not a strict global quota. The existing bounded isolate limit remains a fallback. Namespace 2107100911 is reserved for this site's inquiry limiter; the key is namespaced to this site.

Status distinguishes reachability from configuration, reports degraded configuration with HTTP 503, exposes the built Git revision, and smoke checks fail on degraded state. It does not claim to verify provider delivery. Frame blocking now also uses a response CSP header. Production curl deadlines and smoke job timeouts are bounded, and Dependabot covers Actions.

Local validation: 26 unit tests pass, including stable retry payloads and edge-limiter rejection/outage handling. Astro/TypeScript remain clean. Browser/CI verification of the runtime repair is required before marking those findings verified.

References: [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [Cloudflare rate-limit locality](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/#locality).

## Workflow reproducibility and release verification

Runtime commit 2756767 passed Quality, all 48 accessibility/theme cases,
Lighthouse, Safari and production integrity. The museum keyboard/motion/revisit
test passed. Responsive CI identified an overlay initial-focus problem and
expected unconfigured-preview HTTP 503 responses being treated as layout errors;
the follow-up explicitly focuses the dialog close control, provides a layout
fixture, and separately tests degraded/malformed status responses.

Production was read back at revision 2756767 with HTTP 200, configured providers,
and the edge-location limiter present. The first smoke request had received a
Cloudflare HTTP 409; its cause is not established by repository logs. Do not
confuse successful CodeQL execution with a successful Cloudflare deployment.

The follow-up locks browser/Lighthouse/Safari tooling in package-lock, pins all
workflow action references to full SHAs, removes unused astro-icon, extracts
responsive/Safari tests and Lighthouse configs into maintained files, regenerates
Worker bindings, adds status-handler regressions, and verifies the exact deployed
revision on push. See [release-runbook.md](release-runbook.md) for release and
rollback procedures. The new dependency overrides must pass CI before acceptance.

Local follow-up validation: 28 unit tests pass, Astro/TypeScript diagnostics are
clean, and npm audit reports zero vulnerabilities including development tooling.

### Explicitly not closed

- Cloudflare promotion gating, required checks, alert recipients and a rollback
  drill require account-owner configuration; no administrative changes claimed.
- Real Turnstile and email delivery need an approved end-to-end inquiry and
  provider dashboard evidence. Configuration presence alone is not delivery.
- Genuine Work case studies and About biography need owner-supplied content;
  no fabricated projects, results or personal claims were added.
- Physical-device and assistive-technology testing, a historical credential
  scan, remaining source-formatting/dead-CSS cleanup, and social-image asset
  optimization are not represented as completed by automated browser checks.

The original audit is a baseline, not a claim that every item is now closed.

## Cleaning-by-Cassi practices adopted

Revision 224bec8 failed clean installation in CI because its lockfile lacked
transitive proxy dependencies. Local installation and audit success did not
establish reproducibility. The follow-up regenerates the dependency graph from
an empty directory using npm 10.9.8 and verifies `npm ci` with that same version.
It replaces LHCI and its override chain with locked Lighthouse 13.4.1 directly,
preserving every existing category threshold. No gate is reduced to obtain green.

The README now uses one small repository-only banner, describes the actual
feature status, lists all seven workflows, documents theme tokens/fonts and
complete local verification, and links the release runbook. Provider acceptance
is distinguished from inbox delivery. Public widget configuration and private
Worker configuration have separate, secret-free example files.

Maintained source is formatted with pinned Prettier and its Astro plugin; Quality
checks formatting. `npm run check` now includes unit regressions. The build
generates an optimized social WebP without altering the original artwork and
decodes public raster assets to detect corruption. Technology's title separator
now matches the other pages.

Local checks: clean npm 10.9.8 install, 28 unit tests, zero dependency audit
findings, and successful raster decoding. Full CI/deployment verification of this
follow-up is still required; formatting alone does not close style-ownership debt.

Verification at 55b6240 subsequently passed all seven workflows, including
28 unit tests at that revision, 92 browser interaction/layout cases,
48 accessibility/theme cases, Safari, Lighthouse and production smoke. Production
reported the exact revision as healthy. Formatting did not close style ownership debt.

## Prepared main deployment gate

The deployment command now waits for five successful pre-deployment workflows
for the exact current main revision and blocks failed/missing/stale evidence.
Post-deployment smoke allows fifteen minutes for a gated release to arrive.
Regression coverage rejects wrong-commit, wrong-branch, PR-only and superseded
successful-run evidence. The runbook gives the precise Cloudflare setting needed
to activate the command. No account-setting change is claimed.

Provider-account records can now be inspected through Resend. Historical delivery
evidence is separate from a fresh production-form verification of the current
release; neither provider configuration nor a direct API test proves that full path.
