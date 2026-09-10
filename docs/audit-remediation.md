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
