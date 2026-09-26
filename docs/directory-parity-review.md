# Directory parity review — September 26, 2026

Reference snapshots: AlienX `f67c91c0022a231dc0fd6764f129dbef710b993e` and
Cleaning by Cassi `ee9f3e8898fcab7d250983d7ca733a29e87dc946`. Cleaning was
inspected read-only. This is a security/reliability comparison of the four
requested directories, not a requirement that their files or business features
be identical, nor a claim of a complete line-by-line audit of both applications.

| Directory  | Applicable gap                                                                                                                   | Disposition in this change                                                                                                                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/docs`    | Cleaning has explicit request and physical-device validation contracts.                                                          | Add AlienX-specific contracts/protocol and link them from the engineering index. Record PR #46's verified production evidence. Keep operational unknowns visible.                                                                                     |
| `/scripts` | Cleaning rejects CodeQL analysis warnings and sanitizes transport/JSON errors; AlienX only checked analysis errors.              | Reject warnings and malformed records, redact transport/parser exceptions, preserve exact-main checks and complete alert pagination. Extend shared candidate/live integrity checks to additional headers and static/API responses.                    |
| `/src`     | Cleaning denies unused browser capabilities and adds COOP/CORP/legacy policy headers; rate-limit responses carry retry guidance. | Apply those controls in Worker responses and static `_headers`; preserve AlienX's generated CSP hashes, frame policy, JSON API, mandatory edge limiter and idempotency. Redact mail transport exception messages.                                     |
| `/tests`   | Cleaning rehearses the real npm deploy command with a safe Wrangler sentinel.                                                    | Add an isolated offline command-chain rehearsal adapted to AlienX's Git approval refs, plus warning/error-redaction, header-removal, weakened-permission and retry-response regressions. Preserve existing committed Chromium/WebKit/keyboard suites. |

## Compatibility and boundaries

- Current AlienX source uses no camera, microphone, screen capture, USB, payment
  or geolocation API. Its command-palette external link already uses
  `noopener,noreferrer`; there is no cross-origin opener-dependent login/payment
  flow to preserve. COOP separates cross-origin opener relationships; CORP
  restricts cross-origin no-CORS use of AlienX resources. Neither is COEP.
- Do not enable blanket COEP, remove CSP hashes, adopt unsafe-inline, or replace
  the generated resource CSP with Cleaning's host-only policy. The existing
  Turnstile script/frame allowlists remain unchanged. Browser CI still must pass;
  a mocked form test is not proof of a successful real challenge.
- Static assets can bypass middleware, so `_headers` is also updated. Integrity
  validates page headers, `/api/status`, robots and sitemap responses on the
  built candidate and both production hosts. Header-removal regressions ensure
  these controls cannot disappear unnoticed.
- The offline rehearsal uses the committed npm deploy command and verifier,
  mocked remote Git evidence, a real temporary checkout, and a non-deploying
  Wrangler sentinel. Rejected (even simultaneously approved), missing, stale,
  inaccessible, wrong-branch and wrong-SHA evidence must never reach Wrangler.
  This does **not** close AX-005's real Cloudflare rejection drill or AX-006's
  live rollback drill.

## Deliberate differences and remaining work

Local validation: 78 committed tests passed, including the seven-scenario
offline command-chain rehearsal; Astro/TypeScript reported zero diagnostics;
build and Worker deployment dry run passed. The local preview cannot start in
this execution environment (`uv_interface_addresses`); consequently no local
browser/candidate-integrity pass is claimed. Required GitHub browser and
candidate-integrity gates must validate the built runtime before auto-merge.
This note records implementation/preflight, not the new release's deployment.

Keep AlienX's approval/rejection refs and ephemeral publisher; do not import
Cleaning's alternative REST/token gate. Keep the broader multipage navigation,
active-link clipping tests, fixed three-sample Lighthouse policy, history scans,
all-severity audit and workflow mutation tests. Existing `.test.cjs` and
`.spec.cjs` naming remains consistent within AlienX; changing module extensions
to match Cleaning's `.mjs` tests offers no security benefit.

Cleaning's quote fields, pricing/catalog, customer confirmation, testimonials,
and native-form encoding are business-specific, not missing AlienX features.
Its generic public status design differs from AlienX's intentional technical
showcase; no private credentials or provider responses should be disclosed by
either. A shared page layout is an optional maintainability change, not a
security requirement; avoid a wholesale frontend rewrite during closeout.

Cleaning's shared mail transport and DST-safe scheduled Worker are applicable
patterns, but copying its cron alone would not satisfy AlienX's requirement.
Still required: an AlienX production-path sender, fixed authorized business
recipient, 05:00 America/Chicago guard, stable daily idempotency, bounded retry,
CI success/failure evidence, and independently correlated delivery events.
No replacement email, scheduler, new credential, or public bypass endpoint was
created by this comparison. Notification receipt, account controls, live rollback
and real-device results remain separately unverified.

References: [Cloudflare static headers](https://developers.cloudflare.com/workers/static-assets/headers/),
[MDN COOP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy),
[MDN CORP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Resource-Policy).
Header changes are not a promised Observatory score; rescan after exact-SHA
deployment and retain the observed result separately.
