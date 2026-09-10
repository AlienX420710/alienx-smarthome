# Audit remediation

Source: AlienX-SmartHome-Audit.md, baseline d55378c.

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
