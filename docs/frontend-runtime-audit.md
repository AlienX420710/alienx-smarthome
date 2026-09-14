# Front-End Runtime Audit

Last audited: 2026-09-13.

## Scope

This audit applies the rules in `frontend-pattern-notes.md` to production JavaScript. The goal is not zero JavaScript; it is JavaScript proportional to behavior that HTML/CSS cannot own cleanly.

## Current runtime ownership

- `CommandPalette.astro`: justified client behavior for Cmd/Ctrl+K discovery, keyboard navigation, status commands, overlays, and theme commands. Normal navigation remains available without it.
- `technology.astro`: one delegated click listener owns the system-layer selector. It uses an `AbortController` lifecycle and is cleaned up before Astro page swaps.
- `status.astro`: network refresh logic is justified because it represents live state. Refresh pauses while the document is hidden, uses an absolute request timeout, and cleans timers/listeners during navigation.
- `contact.astro`: client validation, idempotency, Turnstile integration, and submission feedback are security/product behavior, not decorative JS.
- `lab.astro`: comparison synchronization is progressive enhancement. The default comparison remains meaningful without script.
- `experience.js`: canvas, physics, pointer fields, spatial input, and gesture drawing are intentionally custom runtime exhibits. Those interactions remain isolated to the Experience surface.
- `site-preferences.js`: theme/preference persistence is justified global behavior.

## Changes from this pass

- Replaced per-button Technology listeners and `data-bound` mutation with one delegated listener and explicit lifecycle cleanup.
- Kept new Lab telemetry, meters, progress, and perspective deck script-free.
- Kept advanced effects out of production content pages.
- Preserved reduced-motion policies for animated/3D surfaces.

## Rules going forward

1. No interval-count timers; derive elapsed/remaining state from timestamps.
2. Any continuous rendering loop must use `requestAnimationFrame`, stop when hidden or disconnected, and have cleanup.
3. Prefer event delegation for repeated controls when it simplifies lifecycle management.
4. No dependency for a micro-interaction that semantic HTML/CSS can express maintainably.
5. Production pages must remain navigable and readable if enhancement JavaScript fails.
