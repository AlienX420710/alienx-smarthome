# Inquiry security contract

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
success and a nonempty email ID are required before application success.
Transport is bounded to 15 seconds. Logs must not contain arbitrary transport
exceptions, verification payloads, credentials or inquiry contents.

Acceptance is not delivery; neither a success-page visit nor public status proves
mail reached the receiving server or inbox. Unit/browser tests mock providers
and send no email. A real inquiry, scheduled production email, delivery event,
notification receipt and rollback drill require their own evidence. See
[project state](project-state.md) and [directory comparison](directory-parity-review.md).
