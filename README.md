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
[![Astro](https://img.shields.io/badge/Astro-SSR-2563EB?logo=astro&logoColor=white)](https://astro.build)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=211631)](https://workers.cloudflare.com)

### Technology built to do something.

Web engineering, automation, infrastructure, and interactive browser experiences.

[Explore the museum](https://alienxsmarthome.com/experience/) · [Technology](https://alienxsmarthome.com/technology/) · [System status](https://alienxsmarthome.com/status/) · [Contact](https://alienxsmarthome.com/contact/)

</div>

---

## ✨ Welcome

AlienX SmartHome is an engineering showcase and technical proof-of-concept for a future smart-home/automation business, not a Home Assistant dashboard or a home-control application. AlienX LLC is not represented as an established company. The site combines browser experiments, an interactive stack explanation, a public configuration-status endpoint, and a protected project inquiry form.

| Explore the experience                  | Built with safeguards                                   |
| :-------------------------------------- | :------------------------------------------------------ |
| Seven interactive browser exhibits      | Turnstile and independent server validation             |
| A readable view of the technology stack | Bounded requests, rate limits, and safe retries         |
| System, light, and dark themes          | Keyboard navigation and reduced-motion support          |
| Live runtime/configuration status       | Exact-revision release checks and production monitoring |

Only **`main`** is maintained and deployed. Start with the Codex-maintained [project state and findings register](docs/project-state.md); assistants must also read [AGENTS.md](AGENTS.md). [Audit progress](docs/audit-remediation.md) records repair history. The [release runbook](docs/release-runbook.md) covers acceptance checks, incident triage, and rollback.

GitHub requires five up-to-date PR checks. Release Approval publishes exact-main
evidence consumed by `npm run deploy` before Wrangler can deploy. Production Smoke
then proves the live SHA; Production Integrity follows successful Smoke. See the
[safe auto-merge setup](docs/release-runbook.md#safe-auto-merge) and the canonical
register for dated evidence and remaining operational verification.

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
- Edge rate counters are shared within each Cloudflare location, not a strict global quota. A bounded isolate-local limit supplements them. A missing or unavailable edge binding rejects submissions; it cannot silently disable that layer.
- Honeypots must be absent or exactly empty. Verification must return boolean `true`, the expected hostname, and the expected action. Provider rejection details and transport exception messages are not logged by the verification boundary.
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

| Workflow              | When                                             | Scope                                                                                                                                                                                  |
| :-------------------- | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quality               | Push / PR to main                                | Clean install, formatting, committed tests, build/type checks, Worker dry run, all-severity dependency audit, history credential scan; main requires fresh CodeQL and zero open alerts |
| Responsive            | Push / PR; manual                                | Candidate security/SEO contract; 84 route/viewport combinations plus interaction regressions                                                                                           |
| Accessibility & Theme | Push / PR; manual                                | Built local preview: 48 route/theme/OS cases, axe WCAG checks, Lighthouse accessibility ≥95                                                                                            |
| Lighthouse            | Push / PR; manual                                | Built local preview: accessibility, best practices, SEO ≥95; performance ≥85                                                                                                           |
| Safari                | Push / PR; manual                                | Actual macOS Safari WebDriver plus real Playwright WebKit navigation, interactions and keyboard regressions                                                                            |
| Release Approval      | Required workflow completion                     | Publishes approval/rejection only for the current exact main SHA                                                                                                                       |
| Production Integrity  | Successful push Smoke; six-hour schedule; manual | Both live hosts: separate frame/resource CSP, headers, redirects, SEO and exact revision; trusted controller with repository-origin validation                                         |
| Production Smoke      | Push, hourly; manual                             | Live host/API health; pushes also require the exact Git revision                                                                                                                       |
| Browser Diagnostics   | Manual only                                      | Isolated local WebKit loads, CSS/JS/header comparisons, screenshots and traces; not a release gate                                                                                     |
| CodeQL                | GitHub security analysis                         | JavaScript/TypeScript and workflow analysis                                                                                                                                            |
| Workers Build         | Cloudflare Git integration                       | Production build and deployment                                                                                                                                                        |

The five pre-deployment gates remain Quality, Responsive, Accessibility,
Lighthouse, and Safari. Lighthouse collects three fixed samples per route:
median performance must meet 85, while every sample must meet 95 for the other
categories. Measurement errors fail closed; reports retain every sample.

Browser Diagnostics is adapted from Cleaning by Cassi's manual workflow. It
uses an unconfigured local preview, never sends inquiries, and deliberately
alters isolated browser responses to investigate loading failures. Its results
do not replace production security, Safari, or accessibility acceptance.

GitHub CodeQL is separate security analysis; Quality additionally checks the live main alert inventory. Cloudflare Builds is a separate deployment integration: neither a passing CodeQL run nor a healthy old deployment proves a new release succeeded. Monitored notification receipt, a live rollback drill, and daily production email delivery verification remain acceptance work. An A+ header score is not a complete security audit. See the runbook before declaring a release accepted.

## 🚀 Local development

Use **Node 22.19+** (or a newer supported LTS) and npm. CI uses Node 22; verify lockfile changes with a clean install, not only an existing `node_modules` tree.

```bash
npm ci
npm run dev
```

Open [localhost:4321](http://localhost:4321). Static pages and mocked tests need no live provider secrets. Without local bindings, `/api/status` intentionally reports degraded configuration with HTTP 503.

For an explicitly approved real integration test, copy `.dev.vars.example` to `.dev.vars` and `.env.example` to `.env`. Supply dedicated test credentials and a matching public `PUBLIC_TURNSTILE_SITE_KEY`, then configure the hostname policy consistently. The public key is injected at build time; an empty value preserves the existing production widget. Never put secrets in `PUBLIC_*` variables or use production mail credentials for automated tests. Cloudflare production secrets are `TURNSTILE_SECRET` and `RESEND_API_KEY`; `TURNSTILE_HOSTNAMES` is a non-secret Worker variable.

| Command                                   | Purpose                                                       |
| :---------------------------------------- | :------------------------------------------------------------ |
| `npm run dev`                             | Generate optimized assets and start Astro                     |
| `npm test`                                | Mocked handlers, status contracts, and preference regressions |
| `npm run typecheck`                       | Astro diagnostics and TypeScript                              |
| `npm run build`                           | Validate/optimize images and build the Worker site            |
| `npm run check`                           | Tests, type checks, build, and Worker deploy dry run          |
| `npm run audit`                           | Audit the full dependency tree, including test tools          |
| `npm run preview`                         | Build and start the local Cloudflare runtime                  |
| `npm run test:browser`                    | Responsive and interactive Chromium checks                    |
| `npm run test:webkit`                     | WebKit navigation, interaction and keyboard regressions       |
| `npm run test:a11y`                       | Theme/OS and accessibility matrix                             |
| `npm run test:lighthouse`                 | Existing Lighthouse score gates against local preview         |
| `npm run format` / `npm run format:check` | Format maintained source / check formatting                   |
| `npm run cf-typegen`                      | Regenerate and scope Worker declarations                      |
| `npm run deploy`                          | Deploy through configured Wrangler; follow the runbook first  |

Browser checks require a running preview on port 4321:

```bash
npx playwright install chromium
npm run preview
# In another terminal:
npm run test:browser
npm run test:a11y
```

Lighthouse needs Chrome/Chromium. `node tests/safari.cjs` needs macOS and enabled Safari WebDriver. Browser tests do not replace physical-device, screen-reader, or actual provider-delivery verification.

## 🔧 Maintenance and operations

Start with the [canonical project state](docs/project-state.md) for dated
verification and outstanding findings. The [release runbook](docs/release-runbook.md)
covers promotion, incident triage, and rollback. Historical audits are evidence
for their recorded revisions, not blanket claims about current main.

For focused WebKit loading diagnostics, run the **AlienX Browser Diagnostics**
workflow manually from GitHub Actions. Download its `webkit-diagnostics`
artifact for per-mode screenshots, traces, and `summary.json`.

---

<div align="center">

### AlienX SmartHome

_Technology built to do something._

[Website](https://alienxsmarthome.com) · [Explore](https://alienxsmarthome.com/experience/) · [Start a project](https://alienxsmarthome.com/contact/)

</div>
