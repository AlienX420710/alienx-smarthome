from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    if old not in text:
        raise SystemExit(f"Expected block not found in {path}: {old[:80]!r}")
    file.write_text(text.replace(old, new, 1))


def replace_all(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    if old not in text:
        raise SystemExit(f"Expected text not found in {path}: {old!r}")
    file.write_text(text.replace(old, new))


# Explicit external-link hardening: keep noreferrer while declaring noopener.
for path in ["src/components/Header.astro", "src/components/Footer.astro"]:
    replace_all(path, 'rel="noreferrer"', 'rel="noopener noreferrer"')

# Home: replace rigid two-column cards with intrinsic sizing and let each card
# adapt internally to the space it actually receives.
replace_once(
    "src/pages/index.astro",
    """  .capability-grid {\n    display: grid;\n    grid-template-columns: repeat(2, 1fr);\n    gap: 1rem;\n    margin-top: 3rem;\n  }\n""",
    """  .capability-grid {\n    display: grid;\n    grid-template-columns: repeat(\n      auto-fit,\n      minmax(min(100%, 22rem), 1fr)\n    );\n    gap: 1rem;\n    margin-top: 3rem;\n  }\n""",
)
replace_once(
    "src/pages/index.astro",
    """  .capability-card {\n    position: relative;\n    min-height: 250px;\n""",
    """  .capability-card {\n    container-type: inline-size;\n    position: relative;\n    min-height: 250px;\n""",
)
replace_once(
    "src/pages/index.astro",
    """  .proof {\n    display: grid;\n""",
    """  @container (max-width: 360px) {\n    .capability-card {\n      min-height: 230px;\n      padding: 1.5rem;\n    }\n    .capability-card h3 {\n      margin-top: 2.75rem;\n    }\n    .card-arrow {\n      right: 1.5rem;\n      bottom: 1.4rem;\n    }\n  }\n  .proof {\n    display: grid;\n""",
)
replace_once(
    "src/pages/index.astro",
    """    .capability-grid,\n    .proof {\n      grid-template-columns: 1fr;\n    }\n""",
    """    .proof {\n      grid-template-columns: 1fr;\n    }\n""",
)

# Work: intrinsic grids remove two page-wide breakpoint assumptions while
# keeping the same visual hierarchy.
replace_once(
    "src/pages/work.astro",
    """  .grid {\n    display: grid;\n    grid-template-columns: repeat(2, 1fr);\n    gap: 1rem;\n    margin-top: 3rem;\n  }\n""",
    """  .grid {\n    display: grid;\n    grid-template-columns: repeat(\n      auto-fit,\n      minmax(min(100%, 21rem), 1fr)\n    );\n    gap: 1rem;\n    margin-top: 3rem;\n  }\n""",
)
replace_once(
    "src/pages/work.astro",
    """  .principles {\n    display: grid;\n    grid-template-columns: repeat(3, 1fr);\n    gap: 2rem;\n    margin-top: 3rem;\n  }\n""",
    """  .principles {\n    display: grid;\n    grid-template-columns: repeat(\n      auto-fit,\n      minmax(min(100%, 16rem), 1fr)\n    );\n    gap: 2rem;\n    margin-top: 3rem;\n  }\n""",
)
replace_once(
    "src/pages/work.astro",
    """    .grid,\n    .principles {\n      grid-template-columns: 1fr;\n    }\n""",
    """""",
)

# Contact: the three-step process is ordered information, so make it an actual
# ordered list instead of presentation-only spans/b/i elements.
replace_once(
    "src/pages/contact.astro",
    """          <div class=\"signal\" aria-label=\"Inquiry process\">\n            <span>01</span>\n            <b>Tell us</b>\n            <i></i>\n            <span>02</span>\n            <b>We respond</b>\n            <i></i>\n            <span>03</span>\n            <b>Explore it</b>\n          </div>\n""",
    """          <ol class=\"signal\" aria-label=\"Inquiry process\">\n            <li><span>01</span><b>Tell us</b></li>\n            <li><span>02</span><b>We respond</b></li>\n            <li><span>03</span><b>Explore it</b></li>\n          </ol>\n""",
)
replace_once(
    "src/pages/contact.astro",
    """  .signal {\n    display: grid;\n    grid-template-columns: auto auto 1fr auto auto 1fr auto;\n    gap: 0.75rem;\n    align-items: center;\n    margin-top: 4rem;\n    color: var(--contact-soft);\n    font-size: 0.7rem;\n    letter-spacing: 0.12em;\n  }\n  .signal b {\n    color: #d8e0ef;\n    font-size: 0.68rem;\n    white-space: nowrap;\n  }\n  .signal i {\n    height: 1px;\n    background: var(--contact-divider);\n  }\n""",
    """  .signal {\n    display: grid;\n    grid-template-columns: repeat(3, minmax(0, 1fr));\n    gap: 1rem;\n    margin: 4rem 0 0;\n    padding: 0;\n    list-style: none;\n    color: var(--contact-soft);\n    font-size: 0.7rem;\n    letter-spacing: 0.12em;\n  }\n  .signal li {\n    position: relative;\n    display: grid;\n    grid-template-columns: auto minmax(0, 1fr);\n    gap: 0.55rem;\n    align-items: center;\n  }\n  .signal li:not(:last-child)::after {\n    content: '';\n    position: absolute;\n    top: 50%;\n    left: calc(100% + 0.15rem);\n    width: 0.7rem;\n    height: 1px;\n    background: var(--contact-divider);\n  }\n  .signal b {\n    color: #d8e0ef;\n    font-size: 0.68rem;\n    white-space: nowrap;\n  }\n""",
)
replace_once(
    "src/pages/contact.astro",
    """    .signal {\n      grid-template-columns: auto auto 1fr auto auto;\n    }\n    .signal i:last-of-type {\n      display: none;\n    }\n    .signal b:last-of-type {\n      display: none;\n    }\n""",
    """    .signal {\n      grid-template-columns: 1fr;\n      gap: 0.9rem;\n    }\n    .signal li {\n      grid-template-columns: 2.2rem 1fr;\n    }\n    .signal li:not(:last-child)::after {\n      top: auto;\n      bottom: -0.65rem;\n      left: 1rem;\n      width: 1px;\n      height: 0.4rem;\n    }\n""",
)

# Lab: add a keyboard/touch-capable comparison experiment driven by a native
# range control. The content remains meaningful at the default 50% split if JS
# does not run; JS only synchronizes the visual split and text output.
lab_section = r'''      <section class="comparison-section" aria-labelledby="comparison-title">
        <div class="section-copy">
          <p class="eyebrow">04 // COMPARISON FIELD</p>
          <h2 id="comparison-title">A before/after slider without a custom drag widget.</h2>
          <p>
            A native range input owns keyboard, touch, and pointer behavior. A
            few lines of progressive JavaScript only synchronize the visual
            split with the control value.
          </p>
        </div>

        <figure class="comparison-lab">
          <div class="comparison-stage" id="comparison-stage" style="--split: 50%">
            <div class="comparison-layer comparison-layer--baseline">
              <span>BASELINE</span>
              <strong>Static brochure</strong>
              <p>Content exists, but the interface mostly waits to be read.</p>
            </div>
            <div class="comparison-layer comparison-layer--enhanced">
              <span>ALIENX</span>
              <strong>Responsive system</strong>
              <p>Semantics, interaction, state, and layout work together.</p>
            </div>
            <div class="comparison-divider" aria-hidden="true"></div>
          </div>
          <figcaption>
            <label for="comparison-range">Reveal enhanced system</label>
            <div class="comparison-control">
              <input
                id="comparison-range"
                type="range"
                min="0"
                max="100"
                value="50"
                aria-describedby="comparison-output"
              />
              <output id="comparison-output" for="comparison-range">50%</output>
            </div>
          </figcaption>
        </figure>
      </section>

'''
replace_once(
    "src/pages/lab.astro",
    """      <section class=\"manifesto\" aria-labelledby=\"manifesto-title\">\n        <p class=\"eyebrow\">04 // RULE</p>\n""",
    lab_section
    + """      <section class=\"manifesto\" aria-labelledby=\"manifesto-title\">\n        <p class=\"eyebrow\">05 // RULE</p>\n""",
)

lab_script = r'''
<script>
  let comparisonCleanup: (() => void) | undefined;

  function initializeComparison() {
    comparisonCleanup?.();
    const range = document.querySelector<HTMLInputElement>('#comparison-range');
    const stage = document.querySelector<HTMLElement>('#comparison-stage');
    const output = document.querySelector<HTMLOutputElement>('#comparison-output');
    if (!range || !stage || !output) return;

    const lifecycle = new AbortController();
    const update = () => {
      const value = `${range.value}%`;
      stage.style.setProperty('--split', value);
      output.value = value;
    };

    range.addEventListener('input', update, { signal: lifecycle.signal });
    update();
    comparisonCleanup = () => lifecycle.abort();
  }

  document.addEventListener('astro:page-load', initializeComparison);
  initializeComparison();
</script>
'''
replace_once("src/pages/lab.astro", "\n<style>\n", lab_script + "\n<style>\n")

lab_css = r'''

  .comparison-section {
    padding: clamp(5rem, 10vw, 8rem) 0;
    border-bottom: 1px solid #171d2a;
  }

  .comparison-lab {
    margin: 0;
    padding: clamp(1rem, 3vw, 1.5rem);
    border: 1px solid #1d2536;
    border-radius: 28px;
    background: #080c13;
  }

  .comparison-stage {
    --split: 50%;
    position: relative;
    min-height: clamp(300px, 48vw, 520px);
    overflow: hidden;
    border: 1px solid #20283a;
    border-radius: 20px;
    background: #090d15;
  }

  .comparison-layer {
    position: absolute;
    inset: 0;
    display: grid;
    align-content: end;
    gap: 0.75rem;
    padding: clamp(1.5rem, 5vw, 4rem);
  }

  .comparison-layer span {
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.16em;
  }

  .comparison-layer strong {
    max-width: 700px;
    font-size: clamp(2rem, 6vw, 5rem);
    line-height: 0.95;
    letter-spacing: -0.05em;
  }

  .comparison-layer p {
    max-width: 540px;
    margin: 0;
    line-height: 1.65;
  }

  .comparison-layer--baseline {
    background:
      linear-gradient(145deg, rgb(255 255 255 / 0.03), transparent 60%),
      #111722;
    color: #aab4c5;
  }

  .comparison-layer--baseline strong {
    color: #d7deea;
  }

  .comparison-layer--enhanced {
    clip-path: inset(0 calc(100% - var(--split)) 0 0);
    background:
      radial-gradient(circle at 20% 20%, rgb(57 255 90 / 0.2), transparent 24rem),
      linear-gradient(145deg, #0a1710, #07100b 72%);
    color: #b7c9bd;
  }

  .comparison-layer--enhanced span,
  .comparison-layer--enhanced strong {
    color: var(--lab-accent);
  }

  .comparison-divider {
    position: absolute;
    inset-block: 0;
    left: var(--split);
    width: 2px;
    transform: translateX(-1px);
    background: #f5f8ff;
    box-shadow: 0 0 24px rgb(255 255 255 / 0.28);
    pointer-events: none;
  }

  .comparison-divider::after {
    content: '↔';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 1px solid #dce4ef;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: #f5f8ff;
    color: #0c1118;
    font-weight: 800;
  }

  .comparison-lab figcaption {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(240px, 1.3fr);
    gap: 1.5rem;
    align-items: center;
    padding: 1.25rem 0.25rem 0;
  }

  .comparison-lab label {
    color: #e8edf7;
    font-weight: 700;
  }

  .comparison-control {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.85rem;
    align-items: center;
  }

  .comparison-control output {
    min-width: 3.5rem;
    color: #9aa7bb;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  @media (max-width: 680px) {
    .comparison-lab figcaption {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-color-scheme: light) {
    :global(html:where(:not([data-alienx-theme]))) .comparison-section {
      border-color: #dfe5ee;
    }
    :global(html:where(:not([data-alienx-theme]))) .comparison-lab,
    :global(html:where(:not([data-alienx-theme]))) .comparison-stage {
      border-color: #d8e0ea;
      background: #fff;
    }
    :global(html:where(:not([data-alienx-theme]))) .comparison-lab label {
      color: #17202d;
    }
  }

  :global(html[data-alienx-theme='light']) .comparison-section {
    border-color: #dfe5ee;
  }
  :global(html[data-alienx-theme='light']) .comparison-lab,
  :global(html[data-alienx-theme='light']) .comparison-stage {
    border-color: #d8e0ea;
    background: #fff;
  }
  :global(html[data-alienx-theme='light']) .comparison-lab label {
    color: #17202d;
  }
'''
replace_once("src/pages/lab.astro", "\n</style>", lab_css + "\n</style>")

# Remove the one-shot machinery from the generated commit.
Path("scripts/modernize-frontend-once.py").unlink()
Path(".github/workflows/frontend-modernize-once.yml").unlink()
