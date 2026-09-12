# AlienX SmartHome — Assistant Context Primer

Read this before making changes. It's written to be usable by any AI
coding assistant — Claude, ChatGPT/Codex, or otherwise — and intentionally
contains no tool-specific instructions. Pair it with [ai-audit.md](ai-audit.md) for the
detailed findings; this file is the shorter "orient yourself fast" version.

## Main-only working rule

Work directly on `main`. Do not create branches or pull requests unless the
maintainer explicitly requests them. Preserve unrelated changes; never
force-reset `main`. See [release-runbook.md](release-runbook.md) for rollback.

## Latest recorded verification — 2026-09-12

At revision `dfeffab4c826a45041780769b7472ada099ff22b`, all seven repository
workflows passed, including 30 unit tests, 92 browser interaction/layout cases,
48 accessibility/theme cases, and Safari. Lighthouse passed on its second
attempt, not its first; repeatability remains an improvement item. Production
reported that exact revision with operational status.

After retrying the Cloudflare build, the maintainer reported that a real test
email worked. This is owner-confirmed production submission/delivery evidence,
not an automated live-email test or a new provider-record correlation. It
supersedes the earlier unknown outcome for that submission only. Account-level
gate enforcement, alerts, and rollback drills are not proven by this success.

This record describes that revision, not every future commit. The audit's
29-test count belongs to its older `1fa56cc` snapshot. Recheck current evidence
before making release claims; no audit-wide completion is claimed.

## What this project actually is

A public-facing **technology showcase**, not a client product and not a
functioning smart-home control system. Its purpose is to demonstrate the
maintainer's full-stack engineering ability. That framing matters for two
concrete reasons:

- The **Work** page (`src/pages/work.astro`) explicitly states there are no
  invented clients or fabricated case studies — it says real projects will
  replace placeholders as they're completed. Do not write fictional client
  work, testimonials, or metrics to "fill out" the site. If asked to draft
  portfolio copy, either wait for real project details or clearly label
  anything speculative as a draft/example.
- The engineering _is_ the product. Code quality, security posture, and
  test coverage aren't incidental — they're the point of the site. Treat
  changes to `src/middleware.ts`, `src/pages/api/inquiry.ts`, and
  `astro.config.mjs`'s CSP block as high-stakes even though the app itself
  is low-traffic.

## Tech stack

- **Framework:** Astro 7.3.1, SSR mode, TypeScript 5.9.3
- **Deploy target:** Cloudflare Workers via `@astrojs/cloudflare`
- **Bindings:** `ASSETS` (static files), `IMAGES` (Cloudflare Images),
  `SESSION` (KV), `INQUIRY_RATE_LIMITER` (Rate Limiting API)
- **Email:** Resend API (`RESEND_API_KEY` secret, not in repo)
- **Bot protection:** Cloudflare Turnstile (`TURNSTILE_SECRET`,
  `TURNSTILE_HOSTNAMES`)
- **Node:** `>=22` required (see `package.json` `engines`)
- **Package manager:** npm — lockfile is committed and CI uses `npm ci`.
  Workflows select Node 22 and use its bundled npm; npm itself is not pinned
  in CI. The npm 10.9.8 lockfile-repair validation in the remediation log
  is historical evidence, not a current workflow pin.

## Repository layout

```
src/
  pages/            → routes; *.astro are pages, api/*.ts are JSON endpoints
  components/        → shared Astro components (Header, Footer, BaseHead, CommandPalette, HoneypotField)
  middleware.ts       → request-level security gate, scoped to POST /api/inquiry
  lib/status.ts       → shared type + validator for the status API contract
  consts.ts           → site title/description constants
  env.d.ts            → ambient types: Locals, Window globals, cloudflare:workers module
public/
  contact-security.js → Turnstile widget lifecycle
  site-preferences.js → theme/motion prefs via localStorage, applied pre-paint
  experience.js        → animation controller for the /experience page
scripts/
  optimize-images.mjs  → runs before dev/build
  verify-ci.mjs         → runs before deploy
  verify-release.mjs, scope-worker-types.mjs, lighthouse.mjs
tests/
  *.test.cjs           → node:test unit tests (fast, no browser)
  *.spec.cjs            → Playwright Chromium tests (accessibility, responsive, interactions)
  safari.cjs           → Selenium with macOS Safari WebDriver
docs/
  audit-remediation.md  → running log of a prior third-party audit + fixes (read this first)
  release-runbook.md    → deploy/rollback procedure
wrangler.json           → Worker config: routes, bindings, rate-limiter namespace
astro.config.mjs        → CSP policy, Cloudflare adapter, sitemap config
```

## Before you touch anything: read `docs/audit-remediation.md`

This repo already has an extensive, self-documented remediation history
against a prior baseline audit (`AlienX-SmartHome-Audit.md` at commit
`d55378c`). It tracks, commit by commit, what was fixed, what was
explicitly validated (with test counts), and what remains open. Two
important conventions established there that any assistant should keep
following:

1. **Never claim something is "done" without stating what was actually
   run to verify it.** The existing log is scrupulous about distinguishing
   "local unit tests pass" from "CI passed" from "verified in production"
   — these are different claims and get stated as such, not blurred
   together.
2. **Don't claim audit-wide completion.** The log explicitly says "No
   audit-wide completion is claimed" and maintains an "Explicitly not
   closed" section. If you fix something, say what you fixed and how you
   verified it — don't imply everything is now resolved.

## Commands that matter

```bash
npm ci                    # reproducible install (CI parity)
npm test                  # unit tests; counts are revision-specific
npm run typecheck         # astro check + tsc --noEmit — must be 0/0/0
npm run build             # optimize-images.mjs then astro build
npm run check             # test + typecheck + build + wrangler deploy --dry-run
npm audit --audit-level=high
npm run format            # apply formatting
npm run format:check      # validate formatting without edits
```

For Quality's local equivalent, run `npm ci`, `npm run format:check`,
`npm run check`, and `npm run audit`. `check` alone omits formatting and
dependency auditing. Browser suites remain separate; report any environment
blocker and do not substitute a partial local result for successful CI.

## Security-sensitive files — treat changes here with extra scrutiny

- `src/middleware.ts` — the entire contact-form abuse-prevention pipeline
  lives here (content-type/origin/size checks, honeypot, Turnstile,
  rate limiting). It only activates for `POST /api/inquiry`; don't widen
  its scope without understanding why it's currently narrow (everything
  else just gets security headers applied).
- `src/pages/api/inquiry.ts` — every field is re-validated here even
  though middleware already ran; this defense-in-depth is intentional,
  not redundant cruft to be "simplified away."
- `astro.config.mjs` — Astro generates CSP hashes for processed scripts;
  `scriptDirective.hashes` adds manual allowances. A processed-script edit
  does not automatically require editing that array. For manually authorized
  content, match the exact emitted script bytes to its hash and update only
  the affected allowance. The three existing manual hashes lack a documented
  source mapping; establishing that mapping remains open, not assumed done.
  Inspect the generated CSP and test browser behavior using built output;
  Astro's CSP feature is not supported in dev mode. The main resource policy
  and the middleware's separate `frame-ancestors` header both need checking.
  Reference: [Astro CSP configuration](https://docs.astro.build/en/reference/configuration-reference/#securitycsp).
- `wrangler.json` — the `INQUIRY_RATE_LIMITER` namespace ID (`2107100911`)
  is reserved for this specific site. Don't reuse it elsewhere or
  regenerate it casually.

## Known, self-acknowledged open items (see [ai-audit.md](ai-audit.md) §5)

- Cloudflare account-level settings (deployment gating, alerting) require
  dashboard access, not code changes.
- Repository email/Turnstile tests are mocked. See the dated owner-confirmed
  live result above; it does not turn those tests into live verification.
  Future release records should correlate approved submissions with provider
  evidence without committing inquiry contents or credentials.
- The isolate-local rate limiter is a deliberate bounded fallback, not a
  strict global quota; the Cloudflare Rate Limiting binding supplements it
  but is itself eventually consistent per edge location.
- No full git-history secret scan has been performed in this audit pass
  (only the current shallow-cloned tree was reviewed).

## Working conventions observed in this codebase

- Prettier + `prettier-plugin-astro`, pinned versions — run `npm run
format` before committing, don't hand-format to "match style."
- GitHub Actions are pinned to full commit SHAs, not version tags. Follow
  this convention if adding new workflow steps.
- Tests are co-located by concern (`inquiry.test.cjs`, `status.test.cjs`,
  `status-api.test.cjs`, `preferences.test.cjs`, `release-gate.test.cjs`)
  rather than mirroring the `src/` tree 1:1. Follow the existing pattern
  when adding new unit tests rather than introducing a new organizing
  scheme.
- The project favors explicit allow-lists (`Set` objects) over permissive
  validation for enumerated form fields. Keep that pattern for any new
  form fields rather than switching to looser validation.
