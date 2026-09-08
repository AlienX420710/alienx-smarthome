# AlienX SmartHome

![AlienX SmartHome](./public/alienx-social-preview.jpg)

AlienX SmartHome is the public-facing technology site for AlienX — a modern web engineering and interactive technology project.

The project started around smart-home technology and expanded into a broader demonstration of frontend, backend, automation, infrastructure, and browser engineering.

**Production:** https://alienxsmarthome.com

## What AlienX demonstrates

- **Web development** — responsive websites and polished interfaces
- **Web applications** — interactive, stateful browser experiences
- **Automation & integrations** — connecting systems and reducing manual work
- **Infrastructure** — deployment, networking, hosting, and operational tooling
- **Smart technology** — connected technology and home-automation experimentation
- **Interactive experiments** — browser-native interfaces designed to be explored rather than simply viewed

The website itself is part of the demonstration. It intentionally does not recreate a conventional smart-home dashboard or home-automation management interface.

## Technology

The production stack includes:

- **Astro 7** — server-first web framework
- **TypeScript** — application logic and type safety
- **CSS** — responsive layout, visual effects, transitions, and interaction states
- **Cloudflare Workers** — production deployment and server-side functionality
- **Cloudflare Turnstile** — server-validated protection for the project inquiry form
- **Resend** — transactional inquiry email delivery
- **GitHub Actions** — build, type-check, dependency-audit, and production smoke checks

## Architecture

The project uses Astro's page and component model with focused browser-side JavaScript for interactions that benefit from client-side state.

Server-side inquiry handling lives at `/api/inquiry` and includes request-size enforcement, field validation, honeypot protection, Turnstile verification, rate limiting, and email delivery through Resend.

The public `/api/status` endpoint exposes high-level service health without exposing secret values.

Sensitive credentials are kept outside the repository as Cloudflare Worker secrets. They should never be committed to source control.

## Project structure

```text
src/
├── components/       Shared interface components
├── layouts/          Shared page layouts
├── pages/            Routes and server endpoints
├── styles/           Global styling and design tokens
├── icons/            Site icon components
└── consts.ts         Site-wide metadata and content constants

public/               Static assets, fonts, scripts, and site metadata
.github/workflows/    CI quality and production smoke checks
wrangler.json         Cloudflare Workers configuration
astro.config.mjs      Astro configuration
package.json          Dependencies and development commands
```

## Local development

Requirements:

- Node.js 22 or newer
- npm

Install dependencies:

```bash
npm install
```

Start the Astro development server:

```bash
npm run dev
```

Build the production site:

```bash
npm run build
```

Run the full project check:

```bash
npm run check
```

Preview the Cloudflare Workers build locally:

```bash
npm run preview
```

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## Contact protection

The project inquiry form uses Cloudflare Turnstile plus server-side validation, a honeypot field, request-size limits, and rate limiting.

The public Turnstile site key may be present in frontend source. The corresponding secret must remain a Cloudflare Worker secret under the name:

```text
TURNSTILE_SECRET
```

The Worker also uses the `TURNSTILE_HOSTNAMES` environment variable to restrict successful verification to the approved production hostnames.

The Resend API credential must remain a Cloudflare Worker secret under the name:

```text
RESEND_API_KEY
```

## SEO and social metadata

The site includes:

- Canonical URLs
- Open Graph metadata
- Twitter/X large-image metadata
- XML sitemap support
- `robots.txt`
- A branded 1200×630 social preview image
- Site and page metadata through the shared head component

## Production verification

GitHub Actions periodically verifies both production hostnames:

- `https://alienxsmarthome.com/`
- `https://www.alienxsmarthome.com/`

The smoke test checks for a successful HTML response, the AlienX site marker, and the absence of the known `[object Object]` Worker failure. It also validates the public status endpoint.

## Design direction

AlienX uses a mixed visual system rather than a single-color interface:

- **Blue** provides the primary interface and structural accent
- **Green** identifies AlienX branding, active states, system/core visuals, and important calls to action
- **Neutral dark and light surfaces** provide hierarchy and readable content

The design favors interaction, motion, browser-native effects, and inspectable frontend techniques while retaining responsive and reduced-motion behavior.

## Status

This is an actively evolving project. Real projects, technical stories, and interactive experiments will continue to replace placeholders as the work develops.

## License

No open-source license is currently declared. Unless otherwise stated, the source and original project assets remain the property of AlienX.
