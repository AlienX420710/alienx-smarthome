<div align="center">

<a href="https://alienxsmarthome.com"><img src="./docs/readme-banner.svg" alt="AlienX SmartHome — technology built to do something" width="100%" /></a>

<br />

[![Live Website](https://img.shields.io/badge/LIVE_WEBSITE-alienxsmarthome.com-2563EB?style=for-the-badge&logo=googlechrome&logoColor=white)](https://alienxsmarthome.com)
[![Start a Project](https://img.shields.io/badge/START_A-PROJECT-39FF5A?style=for-the-badge&logo=maildotru&logoColor=14161E)](https://alienxsmarthome.com/contact/)

[![Quality](https://github.com/AlienX420710/alienx-smarthome/actions/workflows/quality.yml/badge.svg?branch=main)](https://github.com/AlienX420710/alienx-smarthome/actions/workflows/quality.yml)
[![Production Smoke](https://github.com/AlienX420710/alienx-smarthome/actions/workflows/production-smoke.yml/badge.svg?branch=main)](https://github.com/AlienX420710/alienx-smarthome/actions/workflows/production-smoke.yml)
[![Responsive](https://github.com/AlienX420710/alienx-smarthome/actions/workflows/responsive.yml/badge.svg?branch=main)](https://github.com/AlienX420710/alienx-smarthome/actions/workflows/responsive.yml)
[![Accessibility](https://github.com/AlienX420710/alienx-smarthome/actions/workflows/accessibility.yml/badge.svg?branch=main)](https://github.com/AlienX420710/alienx-smarthome/actions/workflows/accessibility.yml)
[![Safari](https://github.com/AlienX420710/alienx-smarthome/actions/workflows/safari.yml/badge.svg?branch=main)](https://github.com/AlienX420710/alienx-smarthome/actions/workflows/safari.yml)
[![Lighthouse](https://github.com/AlienX420710/alienx-smarthome/actions/workflows/lighthouse.yml/badge.svg?branch=main)](https://github.com/AlienX420710/alienx-smarthome/actions/workflows/lighthouse.yml)
[![Production Integrity](https://github.com/AlienX420710/alienx-smarthome/actions/workflows/production-integrity.yml/badge.svg?branch=main)](https://github.com/AlienX420710/alienx-smarthome/actions/workflows/production-integrity.yml)
[![Astro 7.3.2](https://img.shields.io/badge/Astro-7.3.2-2563EB?logo=astro&logoColor=white)](https://astro.build)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=211631)](https://workers.cloudflare.com)

### Technology built to do something.

Web engineering, automation, infrastructure, and interactive browser experiences.

[Explore the museum](https://alienxsmarthome.com/experience/) · [Technology](https://alienxsmarthome.com/technology/) · [System status](https://alienxsmarthome.com/status/) · [Contact](https://alienxsmarthome.com/contact/)

</div>

---

## ✨ Welcome

AlienX SmartHome is an engineering showcase, not a Home Assistant dashboard or a home-control application. The site combines browser experiments, an interactive stack explanation, a public configuration-status endpoint, and a protected project inquiry form.

| Explore the experience                  | Built with safeguards                                   |
| :-------------------------------------- | :------------------------------------------------------ |
| Seven interactive browser exhibits      | Turnstile and independent server validation             |
| A readable view of the technology stack | Bounded requests, rate limits, and safe retries         |
| System, light, and dark themes          | Keyboard navigation and reduced-motion support          |
| Live runtime/configuration status       | Exact-revision release checks and production monitoring |

Only **`main`** is maintained and deployed. Start with the Codex-maintained [project state and findings register](docs/project-state.md); assistants must also read [AGENTS.md](AGENTS.md). [Audit progress](docs/audit-remediation.md) records repair history. The [release runbook](docs/release-runbook.md) covers acceptance checks, incident triage, and rollback.

`npm run deploy` now checks five required CI workflows for the exact current main
revision before invoking Wrangler. Cloudflare must use this deploy command for
the gate to apply; the account-level setting still needs operator confirmation.

## 🧭 Explore AlienX

| Area         | Current implementation                                                                                  |
| :----------- | :------------------------------------------------------------------------------------------------------ |
| Experience   | Seven browser exhibits with keyboard controls and motion preferences                                    |
| Technology   | Interactive architecture layers and implementation explanations                                         |
| Status       | Worker reachability, integration configuration, and deployed Git revision—not an email-delivery monitor |
| Contact      | Validated, Turnstile-protected inquiry submission with retry recovery                                   |
| Work / About | Placeholder content awaiting genuine case studies and owner biography                                   |

## 🛡️ Inquiry handling and security

Requests pass origin/content-type/body-size checks, honeypot and rate controls, Turnstile verification, and field validation before contacting Resend. The endpoint requires server-owned verification state; direct calls cannot skip middleware protection.

- Turnstile tokens are checked for hostname and the `contact` action.
- Requests have bounded sizes and timeouts. Failed submissions preserve entered values and refresh verification.
- Unchanged retries retain a payload-bound idempotency key. Resend retains idempotency records for 24 hours.
- Edge rate counters are shared within each Cloudflare location, not a strict global quota. A bounded isolate-local limit supplements them.
- Success requires provider acceptance with an email ID. **Acceptance is not proof of inbox delivery.** Visiting the noindex follow-up page directly is not a receipt.
- Browser and API regression tests mock verification/email delivery; they send no email.

Security headers include a response-level frame-ancestor policy and an Astro-generated script CSP. Never put provider secrets in browser code or commit local credentials. Report vulnerabilities through [SECURITY.md](SECURITY.md).

## 🎨 Brand and accessibility

The existing identity stays blue, green, and neutral. These values describe the shared foundation; page-specific systems retain scoped tokens.

| Token / role           | Light                                                                     | Dark      |
| :--------------------- | :------------------------------------------------------------------------ | :-------- |
| Primary accent         | `#2563EB`                                                                 | `#6F82FF` |
| Accent interaction     | `#1D4ED8`                                                                 | `#A5B0FF` |
| Shared page background | `#FFFFFF`                                                                 | `#14161E` |
| Shared body text       | `#222939`                                                                 | `#DCE0E8` |
| Identity green         | `#39FF5A` decorative accent; darker variants for small light-surface text | `#39FF5A` |

Body type is locally hosted **Atkinson**, regular and bold. Technical readouts use system monospace fonts. Neon accents are not blanket approval for text contrast.

System, explicit light, and explicit dark themes are supported. Saved choices must win over OS preferences before paint and after navigation. Focus visibility, skip navigation, modal focus containment, keyboard alternatives, and reduced-motion behavior are tested requirements—not a claim of complete assistive-technology certification.

## ⚙️ Technology

Astro, TypeScript, Cloudflare Workers, Turnstile, and Resend power the application. Cloudflare Images and KV support the adapter. Exact application and test-tool versions are pinned in [package.json](package.json) and the committed lockfile.

| Layer        | Technology                                                             | Purpose                                                     |
| :----------- | :--------------------------------------------------------------------- | :---------------------------------------------------------- |
| Framework    | [Astro](https://astro.build)                                           | Page routing and rendering                                  |
| Runtime      | [Cloudflare Workers](https://workers.cloudflare.com)                   | Hosting and API execution                                   |
| Language     | [TypeScript](https://www.typescriptlang.org)                           | Application and contract checking                           |
| Verification | [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) | Server-verified bot protection                              |
| Email        | [Resend](https://resend.com)                                           | Inquiry notification delivery                               |
| Validation   | GitHub Actions                                                         | Build, browser, accessibility, security, and release checks |

## 📁 Project map

| Path                 | Responsibility                                                          |
| :------------------- | :---------------------------------------------------------------------- |
| `src/pages/`         | Page documents and API endpoints                                        |
| `src/components/`    | Navigation, metadata, dialogs, and shared controls                      |
| `src/lib/`           | Shared runtime response validation                                      |
| `src/styles/`        | Shared foundation and theme styles                                      |
| `public/`            | Visitor assets, fonts, and lifecycle-managed browser scripts            |
| `tests/`             | Mocked API, preference, browser, and Safari regressions                 |
| `scripts/`           | Image validation/optimization, Lighthouse, type scoping, release checks |
| `docs/`              | Audit evidence, operations, and README-only artwork                     |
| `.github/workflows/` | Local-build quality gates and production monitoring                     |

There is no shared `src/layouts/` directory. Some legacy page overrides remain in BaseHead/global styles; formatting makes them reviewable but does not eliminate that ownership debt. Original social artwork is preserved; the build generates a smaller WebP and decodes public raster images to detect corruption.

## ✅ Automated checks

| Workflow              | When                            | Scope                                                                                                  |
| :-------------------- | :------------------------------ | :----------------------------------------------------------------------------------------------------- |
| Quality               | Push / PR to main               | Clean install, formatting, API tests, build, Astro/TypeScript, Worker dry run, dependency audit        |
| Responsive            | Push / PR; manual               | Candidate security/SEO contract; 84 route/viewport combinations plus interaction regressions           |
| Accessibility & Theme | Push / PR; manual               | Built local preview: 48 route/theme/OS cases, axe WCAG checks, Lighthouse accessibility ≥95            |
| Lighthouse            | Push / PR; manual               | Built local preview: accessibility, best practices, SEO ≥95; performance ≥85                           |
| Safari                | Push / PR; manual               | Built local preview in Safari WebDriver                                                               |
| Production Smoke      | Push / schedule / manual        | Exact deployed revision on push; scheduled live service and inquiry/configuration details              |
| Production Integrity  | Push / 6-hour schedule / manual | Exact deployed revision on push, then security-header and SEO contract on both production hostnames    |

For browser workflows, one preview server is reused within that workflow only. Test files are committed; CI does not generate test source dynamically. The responsive matrix records runtime errors, document overflow, navigation containment, hit-target sizes, heading visibility, modal focus behavior, reduced-motion semantics, and key interaction state. Production checks run after deployment; they do not replace candidate verification.

`npm run check` runs unit tests, Astro/TypeScript checks, a production build, and a Wrangler dry run. Quality additionally checks formatting and high-severity npm advisories.

## 🚀 Local development

Requirements: Node **22+**, npm, and local copies of required secrets. Copy the examples; never commit the filled files.

```bash
cp .dev.vars.example .dev.vars
cp .env.example .env
npm ci
npm run dev
```

Before pushing application changes:

```bash
npm run format:check
npm run check
npm run audit
```

Browser suites are separate from `npm run check`:

```bash
npm run preview
npm run test:browser
npm run test:a11y
```

Safari uses `tests/safari.cjs` on macOS with Safari WebDriver enabled. Lighthouse uses the built preview and the committed configuration. See [docs/release-runbook.md](docs/release-runbook.md) for release acceptance and rollback.

## 🔐 Deployment and runtime configuration

Cloudflare Workers Builds is expected to build `main` with `npm run build` and deploy with `npm run deploy`. The deploy command verifies the exact current revision's required CI evidence before running Wrangler. Keep production bindings and secrets in Cloudflare, not in GitHub or source control.

Required runtime configuration includes:

- `TURNSTILE_SECRET`
- `TURNSTILE_HOSTNAMES`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `CONTACT_EMAIL`
- `IMAGES`
- `SESSION`
- `INQUIRY_RATE_LIMITER`

The Worker also exposes `/api/status`, which reports configured integration state and the deployed Git revision. It does not expose secret values.

## 🧪 Evidence and project status

The durable status record is [docs/project-state.md](docs/project-state.md). Historical repair detail lives in [docs/audit-remediation.md](docs/audit-remediation.md). Assistants should not treat an older audit paragraph, workflow badge, or memory as stronger evidence than current code plus revision-specific verification.

A successful workflow run proves that workflow passed at that revision. A successful deployment proves Cloudflare accepted a deployment. A healthy `/api/status` revision proves which revision was observed live. Provider acceptance and owner-confirmed inbox delivery remain separate evidence levels.

## 📚 Documentation

- [Project state and findings](docs/project-state.md)
- [Assistant context](docs/ai-context.md)
- [Audit remediation history](docs/audit-remediation.md)
- [Release / rollback runbook](docs/release-runbook.md)
- [Security policy](SECURITY.md)
- [Historical AI audit](docs/ai-audit.md)

## 📜 License

This repository is currently all-rights-reserved unless a file says otherwise. Do not assume tutorial/demo code from external sources is licensed for reuse; review its license before importing anything.
