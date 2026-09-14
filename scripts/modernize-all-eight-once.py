from pathlib import Path


def read(path):
    return Path(path).read_text()


def write(path, content):
    Path(path).write_text(content)


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

# 2. Command palette/navigation consistency.
p = 'src/components/CommandPalette.astro'
s = read(p)
needle = """    {\n      name: 'Experience',\n      description: 'Open browser experiments',\n      keywords: 'experience experiments /experience',\n      run: () => go('/experience'),\n    },\n"""
addition = needle + """    {\n      name: 'Lab',\n      description: 'Open native-first interaction lab',\n      keywords: 'lab native css html experiments /lab',\n      run: () => go('/lab'),\n    },\n"""
s = replace_once(s, needle, addition, 'command palette Lab entry')
write(p, s)

# 3. About: semantic ordered journey + component responsiveness.
p = 'src/pages/about.astro'
s = read(p)
s = replace_once(s, '<div class="timeline">', '<ol class="timeline">', 'about timeline open')
s = replace_once(s, '</div>\n      </section>\n      <section class="story"', '</ol>\n      </section>\n      <section class="story"', 'about timeline close')
s = s.replace('<article>\n            <span class="number">', '<li class="timeline-item">\n            <span class="number">')
s = s.replace('</div>\n          </article>', '</div>\n          </li>')
s = replace_once(s, """  .timeline {\n    display: grid;\n    gap: 1rem;\n    margin-top: 3rem;\n  }\n  article {\n""", """  .timeline {\n    display: grid;\n    gap: 1rem;\n    margin: 3rem 0 0;\n    padding: 0;\n    list-style: none;\n  }\n  .timeline-item {\n    container-type: inline-size;\n""", 'about timeline css')
s = s.replace('  article:hover {', '  .timeline-item:hover {')
s = s.replace('  article h3 {', '  .timeline-item h3 {')
s = s.replace('  article p {', '  .timeline-item p {')
s = s.replace(' article {\n', ' .timeline-item {\n')
s = s.replace(' article:hover {\n', ' .timeline-item:hover {\n')
insert = """\n  @container (max-width: 420px) {\n    .timeline-item {\n      grid-template-columns: 1fr;\n      gap: 0.75rem;\n    }\n  }\n"""
s = replace_once(s, '  .story {\n', insert + '  .story {\n', 'about container query')
write(p, s)

# 3/5/6. Technology: intrinsic grids + lifecycle-safe delegated interaction.
p = 'src/pages/technology.astro'
s = read(p)
old_script = """      function initializeLayers() {\n        const detail = document.querySelector('[data-layer-detail]');\n        document\n          .querySelectorAll<HTMLButtonElement>('[data-layer]')\n          .forEach((button) => {\n            if (button.dataset.bound) return;\n            button.dataset.bound = 'true';\n            button.addEventListener('click', () => {\n              document\n                .querySelectorAll<HTMLButtonElement>('[data-layer]')\n                .forEach((item) => {\n                  const selected = item === button;\n                  item.classList.toggle('is-selected', selected);\n                  item.setAttribute('aria-pressed', String(selected));\n                });\n              if (detail)\n                detail.textContent = details[button.dataset.layer ?? ''] ?? '';\n            });\n          });\n      }\n      document.addEventListener('astro:page-load', initializeLayers);\n      initializeLayers();\n"""
new_script = """      let layerCleanup: (() => void) | undefined;\n      function initializeLayers() {\n        layerCleanup?.();\n        const table = document.querySelector<HTMLElement>('.layer-table');\n        const detail = document.querySelector<HTMLElement>('[data-layer-detail]');\n        if (!table || !detail) return;\n        const lifecycle = new AbortController();\n        table.addEventListener(\n          'click',\n          (event) => {\n            const button =\n              event.target instanceof Element\n                ? event.target.closest<HTMLButtonElement>('[data-layer]')\n                : null;\n            if (!button || !table.contains(button)) return;\n            table.querySelectorAll<HTMLButtonElement>('[data-layer]').forEach((item) => {\n              const selected = item === button;\n              item.classList.toggle('is-selected', selected);\n              item.setAttribute('aria-pressed', String(selected));\n            });\n            detail.textContent = details[button.dataset.layer ?? ''] ?? '';\n          },\n          { signal: lifecycle.signal },\n        );\n        layerCleanup = () => lifecycle.abort();\n      }\n      document.addEventListener('astro:before-swap', () => layerCleanup?.());\n      document.addEventListener('astro:page-load', initializeLayers);\n      initializeLayers();\n"""
s = replace_once(s, old_script, new_script, 'technology lifecycle script')
s = s.replace('grid-template-columns: repeat(2, 1fr);\n        gap: 16px;', 'grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));\n        gap: 16px;', 1)
s = replace_once(s, '      .capability {\n        position: relative;', '      .capability {\n        container-type: inline-size;\n        position: relative;', 'technology capability container')
s = replace_once(s, '      .capability--wide {\n        grid-column: span 2;\n      }', '      .capability--wide {\n        grid-column: 1 / -1;\n      }', 'technology wide span')
s = replace_once(s, 'grid-template-columns: repeat(3, 1fr);\n        gap: 12px;\n        margin-top: 30px;', 'grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));\n        gap: 12px;\n        margin-top: 30px;', 'technology quality grid')
s = replace_once(s, 'grid-template-columns: repeat(4, 1fr);\n        gap: 8px;', 'grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));\n        gap: 8px;', 'technology layer grid')
s = replace_once(s, 'grid-template-columns: repeat(3, 1fr);\n        gap: 1px;', 'grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));\n        gap: 1px;', 'technology toolbox grid')
s = replace_once(s, 'grid-template-columns: repeat(3, 1fr);\n        gap: 12px;\n      }\n      .principle-grid article', 'grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));\n        gap: 12px;\n      }\n      .principle-grid article', 'technology principle grid')
s = s.replace('        .capability-grid,\n        .layer-table,\n        .toolbox-grid,\n        .principle-grid {\n          grid-template-columns: 1fr;\n        }\n', '')
write(p, s)

# 3. Status: native disclosure for explanatory content.
p = 'src/pages/status.astro'
s = read(p)
old = """        <div class=\"explanation\">\n          <p>\n            <strong>Operational</strong> means the production Worker answered\n            the live check.\n          </p>\n          <p>\n            <strong>Configured</strong> means a required integration is present.\n            It does not prove authentication or delivery succeeds.\n          </p>\n          <p>\n            The public check never exposes secrets or sends a test message.\n            Smoke tests verify HTTP responses and configuration, not end-to-end\n            inquiry delivery.\n          </p>\n        </div>\n"""
new = """        <div class=\"explanation\">\n          <details open>\n            <summary>What does Operational mean?</summary>\n            <p>The production Worker answered the live check.</p>\n          </details>\n          <details>\n            <summary>What does Configured mean?</summary>\n            <p>\n              A required integration is present. It does not prove\n              authentication or delivery succeeds.\n            </p>\n          </details>\n          <details>\n            <summary>What does the public check expose?</summary>\n            <p>\n              It never exposes secrets or sends a test message. Smoke tests\n              verify HTTP responses and configuration, not end-to-end inquiry\n              delivery.\n            </p>\n          </details>\n        </div>\n"""
s = replace_once(s, old, new, 'status disclosures')
css_anchor = '  .runtime {\n'
details_css = """  .explanation details {\n    border-top: 1px solid #1b2537;\n  }\n  .explanation details:last-child {\n    border-bottom: 1px solid #1b2537;\n  }\n  .explanation summary {\n    padding: 1rem 2rem 1rem 0;\n    color: #dfe6f2;\n    font-weight: 700;\n    cursor: pointer;\n  }\n  .explanation summary::marker {\n    color: #39ff5a;\n  }\n  .explanation details p {\n    margin: 0 0 1rem;\n  }\n"""
s = replace_once(s, css_anchor, details_css + css_anchor, 'status details css')
write(p, s)

# 4. Expand Lab via isolated component.
p = 'src/pages/lab.astro'
s = read(p)
s = replace_once(s, "import Footer from '../components/Footer.astro';", "import Footer from '../components/Footer.astro';\nimport LabAdvanced from '../components/LabAdvanced.astro';", 'lab advanced import')
s = replace_once(s, '      <section class="manifesto" aria-labelledby="manifesto-title">\n        <p class="eyebrow">05 // RULE</p>', '      <LabAdvanced />\n\n      <section class="manifesto" aria-labelledby="manifesto-title">\n        <p class="eyebrow">06 // RULE</p>', 'lab advanced insertion')
write(p, s)

# 8. Work becomes a data-driven portfolio of real internal builds.
p = 'src/pages/work.astro'
s = read(p)
s = replace_once(s, "import Footer from '../components/Footer.astro';", "import Footer from '../components/Footer.astro';\nimport ProjectCard from '../components/ProjectCard.astro';", 'work project import')
front = """import { SITE_TITLE } from '../consts';\n---\n"""
projects = """import { SITE_TITLE } from '../consts';\n\nconst projects = [\n  {\n    eyebrow: 'WEB PLATFORM',\n    title: 'AlienX SmartHome',\n    summary:\n      'The production Astro and Cloudflare platform behind this site: responsive UI, theme support, accessibility gates, security headers, and exact-revision deployment.',\n    href: '/',\n    tags: ['Astro', 'Cloudflare', 'TypeScript', 'Accessibility'],\n    outcome: 'A production site whose own engineering is part of the portfolio.',\n  },\n  {\n    eyebrow: 'INTERACTION',\n    title: 'Experience Museum',\n    summary:\n      'Seven browser exhibits spanning canvas, pointer input, physics, kinetic typography, native APIs, CSS depth, and gesture drawing.',\n    href: '/experience',\n    tags: ['Canvas', 'Pointer Events', 'CSS 3D', 'Progressive enhancement'],\n    outcome: 'A touch, keyboard, and reduced-motion-aware interactive browser exhibition.',\n  },\n  {\n    eyebrow: 'RELEASE ENGINEERING',\n    title: 'Exact-revision release gate',\n    summary:\n      'A fail-closed release architecture that publishes approval for the exact main SHA only after Quality, Responsive, Accessibility, Lighthouse, and Safari gates succeed.',\n    href: '/status',\n    tags: ['GitHub Actions', 'Cloudflare Workers', 'Git refs', 'Smoke tests'],\n    outcome: 'Production cannot intentionally deploy a revision that the required CI matrix rejected.',\n  },\n];\n---\n"""
s = replace_once(s, front, projects, 'work project data')
insert_before = '      <section class="note" aria-labelledby="note-title">'
portfolio = """      <section class=\"portfolio\" aria-labelledby=\"portfolio-title\">\n        <div class=\"section-heading\">\n          <p class=\"eyebrow\">REAL BUILDS</p>\n          <h2 id=\"portfolio-title\">The portfolio starts with systems that already exist.</h2>\n          <p class=\"section-copy\">\n            No invented clients and no placeholder metrics. These are real AlienX\n            builds with inspectable behavior and production constraints.\n          </p>\n        </div>\n        <div class=\"portfolio-grid\">\n          {projects.map((project) => <ProjectCard {...project} />)}\n        </div>\n      </section>\n\n"""
s = replace_once(s, insert_before, portfolio + insert_before, 'work portfolio section')
portfolio_css = """  .portfolio {\n    margin-top: 6rem;\n    padding-top: 5rem;\n    border-top: 1px solid var(--page-border);\n  }\n  .portfolio-grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));\n    gap: 1rem;\n    margin-top: 3rem;\n  }\n"""
s = replace_once(s, '  .note {\n', portfolio_css + '  .note {\n', 'work portfolio css')
write(p, s)

# 7. Turn the image validator into an explicit media audit in every build.
p = 'scripts/optimize-images.mjs'
s = read(p)
old = """async function validate(directory) {\n  for (const entry of await readdir(directory, { withFileTypes: true })) {\n    const path = join(directory, entry.name);\n    if (entry.isDirectory()) await validate(path);\n    else if (/\\.(png|jpe?g|webp|avif)$/i.test(entry.name)) {\n      await sharp(path, { failOn: 'error' }).raw().toBuffer();\n    }\n  }\n}\nawait validate('public');\nconsole.log(\n  'Social image generated; public raster images decoded successfully.',\n);\n"""
new = """async function validate(directory, assets = []) {\n  for (const entry of await readdir(directory, { withFileTypes: true })) {\n    const path = join(directory, entry.name);\n    if (entry.isDirectory()) await validate(path, assets);\n    else if (/\\.(png|jpe?g|webp|avif)$/i.test(entry.name)) {\n      const image = sharp(path, { failOn: 'error' });\n      const metadata = await image.metadata();\n      await image.raw().toBuffer();\n      assets.push({\n        path,\n        width: metadata.width ?? 0,\n        height: metadata.height ?? 0,\n        format: metadata.format ?? 'unknown',\n        bytes: (await stat(path)).size,\n      });\n    }\n  }\n  return assets;\n}\nconst assets = await validate('public');\nconsole.log('Media audit: public raster assets decode successfully.');\nfor (const asset of assets.sort((a, b) => a.path.localeCompare(b.path))) {\n  console.log(\n    `  ${asset.path}: ${asset.width}x${asset.height} ${asset.format} ${Math.round(asset.bytes / 1024)} KiB`,\n  );\n}\n"""
s = replace_once(s, old, new, 'media audit build output')
write(p, s)

# 5. Production micro-interactions: native pressed feedback and disclosure focus.
p = 'src/styles/global.css'
s = read(p)
anchor = """button {\n  cursor: pointer;\n}\n"""
addition = anchor + """:where(a, button, summary) {\n  -webkit-tap-highlight-color: rgba(57, 255, 90, 0.14);\n}\n:where(button, [role='button'], a[class*='button']):active {\n  transform: translateY(1px);\n}\nsummary:focus-visible {\n  outline: 3px solid currentColor;\n  outline-offset: 3px;\n}\n"""
s = replace_once(s, anchor, addition, 'global micro interactions')
write(p, s)

# 6/7 documentation: record the audits and what remains intentional.
Path('docs/frontend-runtime-audit.md').write_text("""# Front-End Runtime Audit\n\nLast audited: 2026-09-13.\n\n## Scope\n\nThis audit applies the rules in `frontend-pattern-notes.md` to production JavaScript. The goal is not zero JavaScript; it is JavaScript proportional to behavior that HTML/CSS cannot own cleanly.\n\n## Current runtime ownership\n\n- `CommandPalette.astro`: justified client behavior for Cmd/Ctrl+K discovery, keyboard navigation, status commands, overlays, and theme commands. Normal navigation remains available without it.\n- `technology.astro`: one delegated click listener owns the system-layer selector. It uses an `AbortController` lifecycle and is cleaned up before Astro page swaps.\n- `status.astro`: network refresh logic is justified because it represents live state. Refresh pauses while the document is hidden, uses an absolute request timeout, and cleans timers/listeners during navigation.\n- `contact.astro`: client validation, idempotency, Turnstile integration, and submission feedback are security/product behavior, not decorative JS.\n- `lab.astro`: comparison synchronization is progressive enhancement. The default comparison remains meaningful without script.\n- `experience.js`: canvas, physics, pointer fields, spatial input, and gesture drawing are intentionally custom runtime exhibits. Those interactions remain isolated to the Experience surface.\n- `site-preferences.js`: theme/preference persistence is justified global behavior.\n\n## Changes from this pass\n\n- Replaced per-button Technology listeners and `data-bound` mutation with one delegated listener and explicit lifecycle cleanup.\n- Kept new Lab telemetry, meters, progress, and perspective deck script-free.\n- Kept advanced effects out of production content pages.\n- Preserved reduced-motion policies for animated/3D surfaces.\n\n## Rules going forward\n\n1. No interval-count timers; derive elapsed/remaining state from timestamps.\n2. Any continuous rendering loop must use `requestAnimationFrame`, stop when hidden or disconnected, and have cleanup.\n3. Prefer event delegation for repeated controls when it simplifies lifecycle management.\n4. No dependency for a micro-interaction that semantic HTML/CSS can express maintainably.\n5. Production pages must remain navigable and readable if enhancement JavaScript fails.\n""")

Path('docs/media-audit.md').write_text("""# Media Audit\n\nLast audited: 2026-09-13.\n\n## Current pipeline\n\n`scripts/optimize-images.mjs` runs before every Astro build. It now decodes every public raster asset with Sharp and prints dimensions, format, and byte size into the build log. A corrupt image therefore fails before deployment.\n\nThe social preview source remains preserved as JPEG artwork, while the reproducible build generates `public/alienx-social-preview.webp` at a maximum width of 1600 px and WebP quality 85.\n\n## Production rules\n\n- Do not lazy-load LCP/hero imagery by default.\n- Below-the-fold content imagery should use native lazy loading when added.\n- Rendered media must carry intrinsic dimensions or an explicit aspect ratio to prevent layout shift.\n- Prefer responsive image selection (`picture`/`srcset` or Astro image tooling) when a page actually needs multiple source sizes.\n- Video surfaces require a useful poster rather than an empty pre-play state.\n- Decorative experiments should prefer CSS/SVG/canvas when that is the actual rendering primitive instead of shipping raster screenshots.\n- Do not add image transformations merely to increase format count; each derivative must serve a production request.\n\n## Current asset note\n\nThe repository includes brand/favicon assets, social artwork, and historical JPEG artwork. The site currently relies heavily on CSS/SVG/canvas rather than content photography, so this pass does not force unused JPEGs into production UI. New media should be introduced only where it improves the content.\n""")

print('All-eight modernization transform applied.')
