# Copilot instructions for alienx-smarthome

Work directly on `main`. Do not create branches or pull requests unless the
maintainer explicitly requests them. Preserve unrelated changes and never
force-reset `main`; use a new revert commit when a code rollback is needed.

Read `docs/ai-context.md` first. It covers the stack, repo layout, which
files are security-sensitive and why, and the commands to run before
proposing any change as complete. `docs/ai-audit.md` has the detailed
security/quality findings behind those rules, and `docs/audit-remediation.md`
is the running log of a prior remediation pass — check it before reporting
something as a new finding; it may already be tracked there.

## Project framing

This is a public technology showcase, not a client product. The Work page
(`src/pages/work.astro`) explicitly states there are no invented clients or
fabricated case studies. Don't generate placeholder portfolio content,
testimonials, or metrics to fill out pages — leave real content for the
maintainer to supply, or clearly label anything speculative as a draft.

## Stack

Astro 7 (SSR) + TypeScript, deployed to Cloudflare Workers via
`@astrojs/cloudflare`. Node >=22. npm only — the lockfile is committed and
CI uses `npm ci`; don't switch package managers or let the lockfile drift.

## Before proposing a change as complete, run

```bash
npm ci
npm run format:check
npm test                  # unit tests — expect all passing
npm run typecheck         # astro check + tsc --noEmit — expect 0/0/0
npm run build
npm audit --audit-level=high
```

`npm run check` runs test + typecheck + build + a Cloudflare deploy dry run
in one command. Quality also runs formatting and dependency auditing: use
`npm ci`, `npm run format:check`, `npm run check`, and `npm run audit`
for its local equivalent. Browser suites are separate checks.

State plainly what you ran and what passed. Don't say something is "fixed"
or "verified" without saying how — this repo's existing audit log is
scrupulous about distinguishing "unit tests pass locally" from "CI passed"
from "verified in production," and that convention should continue.

## Security-sensitive files — extra scrutiny, don't simplify away

- `src/middleware.ts` — contact-form abuse pipeline (content-type/origin/
  size checks, honeypot, Turnstile, rate limiting). Scoped only to
  `POST /api/inquiry` by design.
- `src/pages/api/inquiry.ts` — re-validates every field independently of
  middleware. This duplication is intentional defense-in-depth, not
  redundant code to clean up.
- `astro.config.mjs` — Astro generates CSP hashes for processed scripts;
  `scriptDirective.hashes` supplies additional allowances. Do not assume
  every script edit needs a manual hash change. For manually authorized
  content, identify the exact emitted bytes and verify the matching hash
  before updating it. The existing three manual hashes have no documented
  source mapping; do not guess what they authorize or remove them blindly.
  Verify the emitted policy and browser behavior against built/deployed
  output, not `astro dev`. See the CSP guidance in `docs/ai-context.md`.
- `wrangler.json` — the `INQUIRY_RATE_LIMITER` namespace ID is reserved for
  this site specifically; don't regenerate or reuse it.

## Conventions to follow

- Prettier + `prettier-plugin-astro`, pinned versions. Run `npm run format`
  rather than hand-formatting.
- GitHub Actions are pinned to full commit SHAs, not version tags — match
  this if adding workflow steps.
- New form fields should use explicit allow-lists (`Set` objects), matching
  the existing pattern in `inquiry.ts`, rather than permissive validation.
- Unit tests are named by concern (`inquiry.test.cjs`, `status.test.cjs`,
  etc.), not mirrored 1:1 to `src/`. Follow that pattern for new tests.

## Known open items (don't re-report as new; see `docs/ai-audit.md` §5)

- Cloudflare account-level settings (deploy gating, alerts) live outside
  the repo and can't be verified or changed via code.
- No test in this repo sends a real email or performs a live Turnstile
  round-trip — both are mocked. Don't claim delivery is "verified" from
  test output alone.
- The isolate-local rate limiter is a deliberate bounded fallback, not a
  strict global quota.
