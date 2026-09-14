# Front-End Pattern Notes for Future AlienX Work

> Maintainer note: this is a distilled research notebook, not a copy/paste catalog. Revisit the linked sources when implementing a pattern, verify current browser support, and adapt the idea to AlienX's accessibility, performance, security, responsive, Safari/WebKit, and Lighthouse gates.

Last research pass: 2026-09-13.

## Why this exists

The source set below is useful less as a collection of complete applications and more as a pattern library: native HTML capabilities, small CSS/JS interactions, interaction design ideas, and broader HTML platform references. AlienX should borrow the *smallest sound primitive* behind an effect rather than import demo code wholesale.

## Rules for future self

1. Prefer the platform before JavaScript. Native HTML controls and semantics usually provide better keyboard behavior, accessibility, mobile behavior, and less client code.
2. Treat demo repositories as idea mines, not production dependencies. Reimplement only the relevant behavior in AlienX's architecture.
3. Preserve progressive enhancement: useful content and navigation should remain available when animation or JavaScript fails.
4. Every visual interaction must survive keyboard, touch, reduced-motion, narrow viewport, Safari/WebKit, and accessibility testing.
5. Use animation to communicate state or hierarchy, not merely to add motion. Prefer transform/opacity for animation and avoid layout-thrashing effects.
6. Keep interactive surfaces explicit about gesture ownership. Two-dimensional drag/draw experiences need `touch-action: none`; ordinary content should retain normal scrolling.
7. Prefer component/container responsiveness over page-wide breakpoint assumptions when a component can appear in multiple contexts.
8. Do not add a library for an interaction that the platform can express clearly in a few maintainable lines.
9. Verify licensing before copying source code or assets. Ideas/patterns can be reimplemented; source licenses still matter.
10. Browser support and standards evolve. Old "HTML5" resource lists are discovery indexes, not current compatibility truth. Verify against current standards/MDN/Can I Use before shipping.

## 1. Marko Denic — HTML Tips

Source: https://markodenic.com/html-tips/

The strongest lesson is to exhaust native HTML before inventing a custom widget.

Useful primitives and AlienX applications:

- `loading="lazy"` for below-the-fold images. Keep above-the-fold/LCP imagery intentional rather than lazily loading everything.
- `mailto:`, `tel:`, and `sms:` links for actions that genuinely belong to the user's device rather than custom JavaScript handlers.
- `<datalist>` can provide lightweight native suggestions where a full combobox is unnecessary.
- `<fieldset>` + `<legend>` should be the default for semantically grouped form controls.
- External `target="_blank"` links should be treated deliberately; `rel="noopener"` remains a clear defensive declaration.
- Native `<input type="range">` is a strong base for sliders because keyboard/input semantics come for free. This is particularly relevant to interactive demos.
- `<details>`/`<summary>` is the first choice for disclosure/FAQ UI. Modern HTML can eliminate entire accordion scripts.
- `<mark>` is semantic highlighting, not just a styled `<span>`.
- The `download` attribute can express download intent directly for same-origin/eligible resources.
- `<picture>` and modern image formats support format/resolution selection without JavaScript. AlienX's image optimization pipeline should remain the primary production mechanism.
- `<video poster>` avoids an empty/black pre-playback video surface.
- `input[type="search"]` provides search-specific semantics and browser affordances.
- `<pre>` is the right semantic primitive for preserved whitespace/code-like output.

Future-self filter: before writing a custom component, ask whether `<details>`, `<dialog>`, `<datalist>`, `<progress>`, `<meter>`, `<output>`, `<picture>`, `<template>`, a semantic input type, or another native primitive already owns the problem.

## 2. MarkoDenic.tech — modern small-feature engineering

Source: https://markodenic.tech

The 2026 issue catalog reinforces a useful engineering style: solve UI problems with the smallest web-platform primitive that preserves product quality. Current examples include a tag input, background-tab-safe countdown, sticky table header/column, pure-HTML accordion, small inline SVG chart, keyboard-capable before/after slider, auto-resizing textarea, and Cmd+K UI.

Patterns worth carrying forward:

- Timers should derive remaining time from an absolute deadline rather than trusting `setInterval()` tick counts. Background tabs throttle timers.
- Sticky table headers/columns are often CSS problems, not JavaScript scroll problems.
- Inline SVG is often enough for compact data visualization and inherits the site's styling model without a charting dependency.
- A before/after comparison can be built around a native range input, preserving keyboard access instead of implementing pointer-only dragging.
- Prefer native/modern CSS layout behavior over resize scripts where possible.
- A command palette can be useful when the information architecture genuinely benefits from fast keyboard navigation, but it must complement rather than replace normal navigation.

Future self: use this source as a periodic "can the platform do this now?" check before introducing new JavaScript or dependencies.

## 3. DNXEMPIRE-1 — 50 Cool HTML/CSS Projects

Source: https://github.com/DNXEMPIRE-1/50-cool-html-css-Projects

The repository contains small patterns such as 3D boxes, animated countdown/navigation, background sliders, blurry loading, ripple effects, placeholders, range sliders, double-click feedback, toast notifications, scrolling effects, sticky navigation, theme clocks, carousels, hoverboards, mobile navigation, loaders, drag/drop, drawing, and feedback UI.

Best use for AlienX: isolate visual/interaction mechanics for the Experience page and micro-interactions elsewhere. Particularly relevant candidates are 3D transforms, kinetic loaders, content placeholders, range controls, drag/draw behavior, toast state, carousel mechanics, sticky navigation, and theme transitions.

Do not import these demos wholesale. Many teaching demos optimize for clarity or spectacle rather than semantic markup, accessibility, reduced motion, touch conflict handling, CSP, or production performance.

## 4. Brad Traversy / Florin Pop — 50 Projects in 50 Days

Source: https://github.com/bradtraversy/50projects50days

This is a broad interaction-pattern vocabulary. Useful examples include expanding cards, progress steps, rotating navigation, hidden search, blurry loading, scroll animation, split landing pages, form animation, FAQ collapse, drag/drop, drawing, kinetic loaders, content placeholders, sticky navigation, toasts, live filtering, mobile navigation, password UI, 3D boxes, sliders, quiz/feedback patterns, and timers.

The important takeaway is compositional: sophisticated-feeling interfaces are usually assembled from a small number of primitives — state, transforms, transitions, pointer/keyboard input, observers, and semantic controls. AlienX can produce a distinctive experience without a heavy UI framework if those primitives are implemented carefully.

Future self: when a requested effect sounds novel, search this catalog for the interaction family, understand the state machine/mechanic, then rebuild it with current semantic HTML, accessibility, touch, and reduced-motion requirements.

## 5. Solygambas — 100+ HTML/CSS/JavaScript Projects + CodePen

Sources:
- https://github.com/solygambas/html-css-javascript-projects
- https://codepen.io/solygambas

This collection expands the same micro-project approach beyond the original 50-project set. The visible catalog includes touch sliders, CSS loaders, glass dashboards, image-comparison sliders, portfolio grids, video backgrounds, drawing, drag/drop, navigation, filters, carousels, and numerous compact UI interactions.

The strongest AlienX-specific value is breadth: use it to compare multiple implementations of the same interaction rather than assuming the first demo is the best architecture. The CodePen profile is useful for quickly inspecting isolated visual experiments and understanding which CSS/DOM primitive creates an effect.

Future self: CodePen is a prototype/reference environment, not a production CDN. Recreate accepted patterns locally; do not make production behavior depend on a Pen.

## 6. Diego Cardoso — Awesome HTML5

Source: https://github.com/diegocard/awesome-html5

This is best treated as a map of the web platform rather than a list of implementation recipes. Its categories cover multimedia/audio/media capture/Picture-in-Picture/speech/VR/animation; canvas and semantic elements; forms; permissions, geolocation, cryptography, files, frame timing, `requestIdleCallback`, `requestAnimationFrame`, and payments; accessibility and semantics; Shadow DOM/Web Components; service workers/offline/push; storage; performance/mobile; WebSockets/WebRTC; workers; WebGL; and browser compatibility.

AlienX implications:

- Keep animation work synchronized with rendering via `requestAnimationFrame` where continuous visual updates are actually needed.
- Consider workers only for genuinely expensive CPU work that would otherwise block interaction; do not add complexity preemptively.
- Canvas/WebGL are appropriate for Experience exhibits when DOM/CSS is the wrong rendering model, but accessibility/fallback semantics still need separate design.
- Web Components/Shadow DOM can provide encapsulation, but Astro components and existing architecture should remain the default unless runtime encapsulation is specifically valuable.
- Service workers/offline behavior are product decisions with caching/update complexity, not automatic "PWA upgrades."
- Permissions/geolocation/media capture must be user-initiated, purpose-driven, and designed for denial/failure.

Caution: this repository contains historical links and concepts from the HTML5 era. Some entries are obsolete or superseded (for example HTML Imports). Use it to discover areas to investigate, then validate against current platform documentation before implementation.

## 7. CSS-Tricks — CSS as an interaction/layout system

Source: https://css-tricks.com

CSS-Tricks is most valuable as a deep pattern/reference archive. Concepts especially relevant to AlienX:

- `:has()` enables relational styling and can remove JavaScript whose only job is to add a parent class based on descendant state.
- Container queries let components adapt to their available container instead of assuming viewport width. This is a better fit for reusable cards/panels/exhibits.
- Grid and Flexbox should express layout relationships before absolute positioning or JS measurements.
- Custom properties should carry design/state tokens through CSS rather than duplicating magic values.
- Modern selectors, logical properties, intrinsic sizing, `clamp()`, `min()`, `max()`, and aspect-ratio can reduce breakpoint and measurement code.
- View Transitions can add continuity, but transition pseudo-elements can intercept input; if interaction must remain live, explicitly reason about pointer hit-testing. Always honor reduced motion.
- CSS effects must still be evaluated for paint/compositing cost. Visual novelty is not permission to regress Lighthouse or interaction latency.

Future self: CSS should own presentation and layout state whenever it can express the rule declaratively. JavaScript should own application state/behavior, not compensate for CSS that was never asked to solve the problem.

## Cross-source patterns worth applying to AlienX

### A. Native-first interaction hierarchy

Before adding JavaScript, evaluate in this order:

1. Semantic/native HTML control.
2. HTML + CSS state/selector.
3. Small progressive-enhancement JavaScript.
4. Custom canvas/SVG interaction.
5. Third-party dependency only when its capability materially exceeds a maintainable native implementation.

### B. Experience-page idea bank

Good candidates to adapt — not clone — for AlienX's interactive museum:

- expanding/stacked spatial cards;
- 3D transform planes/boxes;
- range-driven image or parameter comparison;
- pointer/touch drawing or particle field;
- kinetic typography/loaders;
- light/background sliders;
- scroll-triggered reveals where scrolling is actually the intended gesture;
- compact SVG visualizations;
- drag/drop or physics surfaces with explicit gesture ownership;
- progressive steps/state-machine demonstrations.

Any adopted exhibit must define keyboard/fallback behavior, mobile touch policy, reduced-motion behavior, cleanup lifecycle, and performance budget before being considered complete.

### C. Performance rules

- Optimize and correctly size images; lazy-load only content that is actually offscreen/non-critical.
- Prefer CSS transforms/opacity for motion.
- Use `requestAnimationFrame` for rendering loops and stop loops when not visible/needed.
- Avoid unnecessary libraries for micro-interactions.
- Derive timers from timestamps, not interval counts.
- Keep client JavaScript proportional to actual interactivity.
- Test visual effects under Lighthouse and real Safari/iOS, not just Chromium desktop.

### D. Accessibility rules

- Native semantics first.
- Every pointer interaction needs a keyboard-accessible equivalent or a meaningful non-pointer fallback when feasible.
- Never encode essential state solely by animation/color.
- Respect `prefers-reduced-motion`.
- Maintain visible focus and predictable tab order.
- Preserve labels, legends, headings, landmarks, and control names.
- Custom sliders/drag controls should be avoided when native range/input semantics can represent the task.

### E. Research hygiene

When using any of these references in future work:

1. Identify the underlying primitive, not just the visual result.
2. Check whether the technique is still current and interoperable.
3. Check source licensing before copying implementation code.
4. Reimplement to AlienX conventions rather than accumulating foreign CSS/JS structure.
5. Run the complete quality matrix afterward: formatting/tests/typecheck/build, accessibility, responsive, Lighthouse, Safari/WebKit, release integrity.

## Source index

- Marko Denic HTML Tips — https://markodenic.com/html-tips/
- Marko Denic Tech — https://markodenic.tech
- DNXEMPIRE-1 50 Cool HTML/CSS Projects — https://github.com/DNXEMPIRE-1/50-cool-html-css-Projects
- Brad Traversy 50 Projects in 50 Days — https://github.com/bradtraversy/50projects50days
- Solygambas HTML/CSS/JavaScript Projects — https://github.com/solygambas/html-css-javascript-projects
- Solygambas CodePen — https://codepen.io/solygambas
- Awesome HTML5 — https://github.com/diegocard/awesome-html5
- CSS-Tricks — https://css-tricks.com
