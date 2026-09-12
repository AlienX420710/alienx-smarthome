# AlienX SmartHome — Full Audit & Analysis

**Purpose of this document:** a neutral, model-agnostic technical audit of the
`alienx-smarthome` repository, written so that any AI assistant (Claude,
ChatGPT, or otherwise) can pick it up and have accurate, verified context
without re-deriving it from scratch. Nothing here is tuned for one assistant
over another — it's plain findings, verified against the actual code.

- **Repo:** github.com/AlienX420710/alienx-smarthome
- **Live site:** alienxsmarthome.com
- **Audited commit:** `1fa56cc` — "feat: gate main deployment on exact-revision CI evidence"
- **Audit date:** 2026-09-12
- **Method:** full clone, dependency install, live execution of the test
  suite and type checker, manual read-through of every security-relevant
  file (middleware, API routes, CSP config, client scripts).

---

## 1. Executive summary

This is a small, single-maintainer Astro site deployed to Cloudflare Workers,
built explicitly as a **skills showcase**, not a client product. The
engineering quality is notably high for a solo/portfolio project:

- Zero dependency vulnerabilities (`npm audit`: 0 across 584 packages).
- Zero TypeScript/Astro diagnostics (`astro check` + `tsc --noEmit`: clean).
- 29/29 unit tests passing locally, matching CI.
- A genuinely defense-in-depth contact form pipeline (see §3).
- A strict Content-Security-Policy with no `unsafe-inline`/`unsafe-eval`.
- CI Actions pinned to full commit SHAs (supply-chain hardening most
  projects skip).
- Honest content: the Work page explicitly states "No invented client
  list. No fake case studies" rather than filling empty sections with
  fabricated portfolio pieces.

The repository also **self-documents its own audit history** in
`docs/audit-remediation.md`, tracking a prior remediation pass against a
baseline audit (`AlienX-SmartHome-Audit.md`, commit `d55378c`). That file is
worth reading before assuming any finding below is new — cross-reference
against it to avoid re-reporting already-fixed issues.

Nothing found in this pass rises to "high" severity. Findings are mostly
around single points of failure inherent to a single-Worker-isolate
architecture, a couple of minor CSP/header gaps, and things that cannot be
verified from source alone (live provider delivery, Cloudflare account-level
settings).

---

## 2. Architecture map

```
Astro 7 (SSR) ──build──> Cloudflare Worker ──serves──> alienxsmarthome.com
                                │
                                ├── @astrojs/cloudflare adapter
                                │     - ASSETS binding (static files)
                                │     - IMAGES binding (Cloudflare Images)
                                │     - SESSION binding (KV, session support)
                                │     - INQUIRY_RATE_LIMITER (Rate Limiting API)
                                │
                                ├── src/middleware.ts
                                │     - runs on every request
                                │     - full security pipeline only for
                                │       POST /api/inquiry (see §3)
                                │
                                ├── src/pages/api/inquiry.ts   (POST)
                                ├── src/pages/api/status.ts    (GET)
                                │
                                └── src/pages/*.astro           (SSR/prerendered)
                                      index, about, work, contact,
                                      contact/success, experience,
                                      technology, status
```

**Key files:**

| Path | Role |
|---|---|
| `src/middleware.ts` | Turnstile verification, rate limiting, body-size bounding, honeypot check — scoped to `/api/inquiry` only |
| `src/pages/api/inquiry.ts` | Field validation allow-lists, HTML escaping, Resend email dispatch |
| `src/pages/api/status.ts` | Public config-presence health check (not a delivery test) |
| `src/lib/status.ts` | Client-side runtime validation of the status API's own response shape |
| `astro.config.mjs` | CSP directives + 3 pinned script hashes, Cloudflare adapter config |
| `wrangler.json` | Worker bindings, custom domain routes, rate-limiter namespace |
| `public/contact-security.js` | Turnstile widget lifecycle (render/remove on navigation) |
| `public/site-preferences.js` | Theme/motion preference persistence via `localStorage` |
| `public/experience.js` | "Museum" page animation controller |
| `src/components/CommandPalette.astro` | Cmd-K style command palette (uses `innerHTML`, see §5) |

**Stack:** Astro 7.3.1 + TypeScript 5.9.3, `@astrojs/cloudflare` 14.3.0,
Wrangler 4.129.1, Node ≥22, `type: module`. Test tooling: native
`node --test`, Playwright 1.63.0, axe-core 4.10.3, Lighthouse 13.4.1.

---

## 3. Security review

### 3.1 Contact form pipeline (`middleware.ts` → `inquiry.ts`)

This is the only endpoint that accepts untrusted input and sends external
requests on the user's behalf, so it's the highest-value attack surface —
and it's the most carefully built part of the codebase. Layers, in order:

1. **Route scoping** — the entire security pipeline in `middleware.ts` only
   activates for `POST /api/inquiry` (matched by regex against the pathname).
   Everything else just gets security headers applied and passes through.
2. **Idempotency-Key format validation** — must be a UUIDv4 or the request
   is rejected before any other work happens.
3. **Content-Type enforcement** — must be exactly `application/json`
   (parameters like charset are stripped before comparison); anything else
   is `415`.
4. **Origin check** — if an `Origin` header is present, it must match the
   request's own origin.
5. **Streamed body-size bounding** — the body is read via
   `request.body.getReader()` in a loop that aborts and cancels the stream
   the moment cumulative bytes exceed 16 KB, *before* `JSON.parse` ever
   runs. This avoids buffering attacker-controlled data unbounded in
   memory — a real (if easy to miss) DoS vector many hand-rolled parsers get
   wrong.
6. **Strict JSON shape check** — parsed value must be a plain object (not
   an array, not a primitive) or it's rejected.
7. **In-memory rate limiting** — a `Map<ip, timestamp[]>` keyed by
   `CF-Connecting-IP`, 8 requests / 10 minutes, with an explicit
   `MAX_TRACKED_IPS = 5000` cap. Critically, it **fails closed**: once the
   map is at capacity, a *new* IP is rejected rather than allowed to grow
   the map unbounded. This is a legitimate, explicitly-chosen tradeoff
   (see the inline comment), not an oversight.
8. **Cloudflare Rate Limiting binding** (if configured) — a second,
   edge-location-scoped limiter, used in addition to (not instead of) the
   isolate-local one.
9. **Honeypot field** (`faxNumber`) — any non-empty value silently rejects
   as if verification failed, without revealing which check caught it.
10. **Turnstile token**, disguised under the field name `website` (a
    plausible-looking form field name, intended to blend in for scripted
    scrapers) — validated server-side against Cloudflare's `siteverify`
    endpoint, checking `success`, expected `action`, and expected
    `hostname` against an allow-list — not just `success` alone, which is
    the most common Turnstile integration mistake.
11. Only after all of the above does `locals.verifiedInquiry` get set —
    and the honeypot's `website` field is explicitly zeroed out before
    being handed to the next stage, so it can't leak into the email body.

Downstream, `inquiry.ts`:

- Re-derives every field from `locals.verifiedInquiry.payload` — it does
  **not** trust `locals` blindly across boundaries; every field is
  re-validated against explicit allow-lists (`Set` objects) for enumerated
  fields (contact method, project type, timeline, budget, source, etc.),
  and length/regex bounds for free-text fields.
- Strips control characters before validation (`cleanSingleLine`,
  `cleanMessage`) — distinct handling for single-line vs. multi-line fields.
- Escapes all interpolated values before building the HTML email
  (`escapeHtml`), and separately builds a plaintext version.
- Validates `websiteUrl` by actually constructing a `URL` object and
  checking the protocol is `http:`/`https:` — not just a regex.
- Derives the Resend `Idempotency-Key` from a SHA-256 digest of
  `[requestId, details, message]`, so retries of the *same* logical
  submission are deduplicated by the provider (Resend keeps idempotency
  keys for 24h) without needing a database.
- Times out the Resend fetch at 15s via `AbortSignal.timeout`.
- Treats "Resend returned `ok`, but with no email `id` in the body" as a
  failure, not a success — a subtle correctness point most integrations
  miss (a 200 with a malformed body is not proof of delivery).

**This is a well-built pipeline.** The one architectural limitation, which
the project's own docs already call out, is that the in-memory rate limiter
is **per-isolate**: Cloudflare Workers can spin up multiple isolates across
edge locations, so a distributed attacker can get more than 8 requests
globally in 10 minutes even though any single isolate enforces the limit.
The Cloudflare Rate Limiting binding mitigates this but is documented
upstream as eventually consistent per-location, not a strict global quota
— which the project's own `docs/audit-remediation.md` already states
plainly rather than overclaiming.

### 3.2 Content-Security-Policy (`astro.config.mjs`)

```
default-src 'self'
base-uri 'self'
object-src 'none'
form-action 'self'
img-src 'self' data: blob:
font-src 'self'
connect-src 'self' https://challenges.cloudflare.com
frame-src https://challenges.cloudflare.com
script-src 'self' https://challenges.cloudflare.com
           + 3 pinned sha256 hashes (no 'unsafe-inline', no 'unsafe-eval')
```

This is a strong policy. No `unsafe-inline` or `unsafe-eval` anywhere,
hash-pinned inline scripts, and a tight `connect-src`/`frame-src` scoped
only to Turnstile. `frame-ancestors 'none'` is also set separately in
`middleware.ts`'s response headers, backed up by `X-Frame-Options: DENY`
(redundant with `frame-ancestors`, but harmless — the double coverage
protects older browsers that don't support CSP frame-ancestors).

**Minor gaps, not urgent:**
- No `upgrade-insecure-requests` directive (low impact since the site is
  HTTPS-only via custom domain routing, but cheap to add).
- `Strict-Transport-Security` has no `preload` directive — fine unless
  there's an intent to submit to the HSTS preload list.
- `Permissions-Policy` only disables `geolocation` and `payment`. Consider
  whether `camera`, `microphone`, `usb`, and `interest-cohort` should also
  be explicitly denied for defense-in-depth, even though nothing in the
  app currently uses them (a future dependency or ad/analytics script
  added later would otherwise inherit default-allow).

### 3.3 `/api/status`

Deliberately conservative in what it claims: statuses are
`operational | configured | degraded`, and the endpoint text explicitly
says *"Configuration check only; no inquiry or provider delivery test is
performed"*. It returns HTTP 503 when any check is degraded (so uptime
monitors correctly see it as unhealthy), and exposes the build's git SHA
via a build-time-injected `__ALIENX_BUILD_SHA__` constant for release
verification. The client-side `src/lib/status.ts` independently validates
the shape of whatever the API returns before using it — defensive even
against its own backend, which is a good pattern given both sides of that
contract live in the same repo and typically get maintained together
(the more common failure mode is trusting your own API blindly and only
finding shape drift in production).

### 3.4 Client-side scripts

- `public/contact-security.js`, `public/site-preferences.js`: no
  `eval`, no dynamic script injection beyond the one intentional Turnstile
  `<script>` tag creation (pointed at a fixed, hardcoded Cloudflare URL).
  Both guard against double-initialization (`window.__alienx*Bound` flags)
  and clean up on Astro's `astro:before-swap` client-navigation event.
- `innerHTML` usage exists in `CommandPalette.astro` and `status.astro`,
  but in every case the interpolated dynamic values are either (a) drawn
  from a static, developer-authored array (command names/descriptions),
  or (b) explicitly HTML-escaped before interpolation (the `status.astro`
  `detail` field). No user-controlled or externally-fetched unescaped
  string reaches `innerHTML` anywhere found in this pass. Still, prefer
  `textContent`/DOM APIs over `innerHTML` where practical — not because
  there's a live vulnerability today, but because it removes an entire
  class of future regression risk if someone later pipes a new dynamic
  field through the same code path without re-checking escaping.

### 3.5 Dependencies & supply chain

- `npm audit`: **0 vulnerabilities** (225 prod / 193 dev / 167 optional /
  584 total packages).
- `sharp` is pinned via `overrides` — a reasonable move given `sharp`'s
  history of native-binding-related breakage across versions.
- GitHub Actions are pinned to **full commit SHAs**, not tags
  (`actions/checkout@fbc6f39...`) — this defeats tag-mutation supply-chain
  attacks that pinning to `@v5` does not. Uncommon rigor for a project this
  size.
- `.github/dependabot.yml` covers both npm and Actions ecosystems per the
  project's own changelog notes in `docs/audit-remediation.md`.

---

## 4. Code quality

- **TypeScript/Astro diagnostics:** 0 errors, 0 warnings, 0 hints across
  41 files (`astro check`), confirmed by re-running it live during this
  audit, not just taken from CI history.
- **Tests:** 29/29 `node --test` unit tests passing, covering inquiry
  payload validation (mocked at the handler level, no real email sent)
  and `status.ts` contract parsing (including adversarial/malformed
  inputs — null, arrays, `<script>` injected into enum fields, missing
  keys). Separate Playwright suites exist for accessibility (axe-core),
  responsive/interaction behavior, and Safari-specific checks, run in CI
  rather than locally in this pass (they require a browser + built site).
- **Formatting:** Prettier + `prettier-plugin-astro`, enforced in CI via
  `format:check`, pinned versions in `package.json` (not floating).
- **File sizes:** several `.astro` pages are large (`technology.astro`
  ~1,009 lines, `experience.astro` ~964, `contact.astro` ~852,
  `CommandPalette.astro` ~727). None of this is inherently wrong for
  content-heavy marketing/portfolio pages that intentionally keep styles
  and behavior co-located per component, but it's worth knowing before
  diving in — expect long single files rather than a deeply split
  component tree.
- **Honesty of content:** `work.astro` explicitly states there are no
  fabricated case studies or invented clients, and frames the page as
  "placeholders" pending real project write-ups. This matters for anyone
  drafting copy for this project — don't invent portfolio content to fill
  the page; that would contradict the site's own stated policy.

---

## 5. Explicitly open / unverifiable items

These aren't judgment calls — they're things that genuinely can't be
confirmed by reading source code, and the project's own
`docs/audit-remediation.md` already flags most of them rather than
claiming false completeness. Listed here so no assistant re-litigates or
falsely "resolves" them from source alone:

1. **Cloudflare account-level configuration** — deployment gating,
   required status checks, alert recipients, rollback drills. These live
   in the Cloudflare dashboard, not the repo, and cannot be verified or
   changed by reading/editing code.
2. **Live email delivery** — `npm test` mocks the Resend call; no test in
   this repo sends a real email. Confirming actual inbox delivery requires
   an end-to-end submission against production plus checking the Resend
   dashboard.
3. **Real Turnstile verification round-trip** — same caveat; the
   middleware logic is sound, but "logic is sound" and "verified against
   live Cloudflare Turnstile in production" are different claims.
4. **Distributed rate-limit ceiling** — as discussed in §3.1, the true
   global request ceiling under a distributed attack depends on
   Cloudflare's Rate Limiting binding behavior in practice, which isn't
   something a source read can confirm.
5. **Historical secret exposure** — this audit only examined the current
   working tree via a shallow (`--depth 1`) clone. It does **not** rule out
   secrets having existed in earlier, unpruned git history. A full-history
   scan (e.g., `gitleaks`/`trufflehog` against the complete history, not a
   shallow clone) would be needed to close this out with confidence.
6. **Physical device / assistive technology testing** — Playwright +
   axe-core cover a lot, but automated accessibility testing does not
   replace testing with actual screen readers/switch devices.

---

## 6. Suggested next steps (priority order)

These are suggestions, not fixes already applied — flagged as such so
whichever assistant picks this up next knows to actually verify before
marking anything done, per the project's own established convention of
never claiming closure without validation.

1. **Low effort, worth doing:** add `upgrade-insecure-requests` to the CSP
   and expand `Permissions-Policy` to explicitly deny unused browser
   capabilities (camera, microphone, usb).
2. **Low effort:** run a full-history secret scan (not shallow-clone) once,
   to close out item §5.5 with actual evidence either way.
3. **Medium effort:** if traffic/abuse ever becomes a real concern, consider
   whether Cloudflare's Rate Limiting binding alone is sufficient or
   whether a Durable Object–backed counter is warranted for a hard global
   ceiling — the current isolate-local + edge-location combination is a
   reasonable pragmatic choice for a low-traffic showcase site, but
   wouldn't necessarily hold up at higher volume.
4. **No action needed:** the inquiry pipeline, CSP script-src, dependency
   posture, and CI supply-chain pinning are all in good shape as audited.
   Don't "fix" these without a concrete new finding — re-litigating
   working security code without a reason to distrust it is itself a risk
   (introducing regressions to something that already passes 29 tests and
   a live audit).

---

## 7. How to reproduce this audit

```bash
git clone --depth 1 https://github.com/AlienX420710/alienx-smarthome.git
cd alienx-smarthome
npm ci
npm test                       # unit tests — expect 29 passing
npm run cf-typegen && npm run typecheck   # expect 0 errors/warnings/hints
npm audit --audit-level=high   # expect 0 vulnerabilities
```

Browser-dependent suites (`test:browser`, `test:a11y`, `test:lighthouse`)
require a built site and a browser runtime; they weren't run in this pass
because it was a source/static audit, and running them from a fresh clone
is straightforward if that verification is later needed.
