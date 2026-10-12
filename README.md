# AlienX SmartHome

![AlienX SmartHome](docs/readme-banner.svg)

<p align="center">
  <a href="https://alienxsmarthome.com"><img alt="Live website: alienxsmarthome.com" src="https://img.shields.io/badge/Live_website-alienxsmarthome.com-16803b?style=for-the-badge&logo=googlechrome&logoColor=white" /></a>
  <a href="https://alienxsmarthome.com/contact/"><img alt="Start a project" src="https://img.shields.io/badge/Get_in_touch-Start_a_project-f24bb5?style=for-the-badge&logo=maildotru&logoColor=white" /></a>
</p>

<p align="center">
  <a href="https://github.com/AlienX420710/alienx-smarthome/actions/workflows/quality.yml"><img alt="AlienX Quality" src="https://github.com/AlienX420710/alienx-smarthome/actions/workflows/quality.yml/badge.svg?branch=main" /></a>
  <a href="https://github.com/AlienX420710/alienx-smarthome/actions/workflows/production-smoke.yml"><img alt="AlienX Production Smoke" src="https://github.com/AlienX420710/alienx-smarthome/actions/workflows/production-smoke.yml/badge.svg?branch=main" /></a>
  <a href="https://github.com/AlienX420710/alienx-smarthome/actions/workflows/responsive.yml"><img alt="Responsive Compatibility" src="https://github.com/AlienX420710/alienx-smarthome/actions/workflows/responsive.yml/badge.svg?branch=main" /></a>
  <a href="https://github.com/AlienX420710/alienx-smarthome/actions/workflows/accessibility.yml"><img alt="Accessibility & Theme Compatibility" src="https://github.com/AlienX420710/alienx-smarthome/actions/workflows/accessibility.yml/badge.svg?branch=main" /></a>
  <a href="https://github.com/AlienX420710/alienx-smarthome/actions/workflows/safari.yml"><img alt="Safari Compatibility" src="https://github.com/AlienX420710/alienx-smarthome/actions/workflows/safari.yml/badge.svg?branch=main" /></a>
  <a href="https://github.com/AlienX420710/alienx-smarthome/actions/workflows/lighthouse.yml"><img alt="Lighthouse Quality" src="https://github.com/AlienX420710/alienx-smarthome/actions/workflows/lighthouse.yml/badge.svg?branch=main" /></a>
  <a href="https://github.com/AlienX420710/alienx-smarthome/actions/workflows/production-integrity.yml"><img alt="Production Integrity" src="https://github.com/AlienX420710/alienx-smarthome/actions/workflows/production-integrity.yml/badge.svg?branch=main" /></a>
  <a href="https://github.com/AlienX420710/alienx-smarthome/blob/main/package.json"><img alt="Astro dependency version" src="https://img.shields.io/github/package-json/dependency-version/AlienX420710/alienx-smarthome/astro/main?label=Astro&logo=astro&logoColor=white&color=1548f5" /></a>
  <a href="https://developers.cloudflare.com/workers/"><img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare-Workers-a7df24?logo=cloudflare&logoColor=white" /></a>
</p>

[alienxsmarthome.com](https://alienxsmarthome.com) · [Current state](docs/project-state.md) ·
[Quality](QUALITY.md) · [Security reporting](SECURITY.md)

Technology showcase and automation portfolio; no invented clients or results.

## Maintainer map

| Need                                           | Read                                                                               |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| Findings, blockers and dated release evidence  | [Project state](docs/project-state.md)                                             |
| Architecture and request guarantees            | [Architecture](docs/ai-context.md)                                                 |
| Release, recovery, email and device procedures | [Operations](docs/release-runbook.md)                                              |
| Assistant working rules                        | [AGENTS.md](AGENTS.md)                                                             |
| Cross-project coordination                     | [Local working agreement](AGENTS.md#cross-project-coordination); linked issues/PRs |
| Prior audits and comparisons                   | [Pinned history](docs/project-state.md#historical-evidence-and-consolidation-map)  |

## Development

Node >=22, npm and committed lockfile. Versions live in package.json.

```bash
npm ci
npm run dev
```

Local validation: npm run format:check, npm run check and npm run audit. Browser
suites and production verification are separate; follow operations. Never deploy
with a direct Wrangler command that bypasses the gate.

Astro/TypeScript runs on Cloudflare Workers, using Turnstile and Resend. src owns
the app; public serves assets; scripts/tests own verification; .github owns CI.
docs/brand artwork remains where needed for builds; licenses stay beside fonts.
Secrets belong in provider stores or ignored local Worker bindings, never the repo.
Form success means provider acceptance, not inbox delivery. Mocked tests send no
email. Read the local contract before changing validation, recipients or retries.
Shared lessons do not substitute for independent project acceptance.
