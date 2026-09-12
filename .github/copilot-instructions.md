# Copilot instructions for alienx-smarthome

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
npm test                  # unit tests — expect all passing
npm run typecheck         # astro check + tsc --noEmit — expect 0/0/0
npm run build
npm audit --audit-level=high
```

`npm run check` runs test + typecheck + build + a Cloudflare deploy dry run
in one command — that's what CI's Quality workflow runs, so it's the
closest local proxy to a passing PR.

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
- `astro.config.mjs` — CSP `scriptDirective.hashes` are sha256 hashes of
  specific inline `<script>` blocks. Editing any inline script's content
  anywhere in the codebase changes its hash; the hash array must be
  recomputed and updated or CSP will silently block it in production.
  Verify against a built/deployed output, not just `astro dev`.
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
