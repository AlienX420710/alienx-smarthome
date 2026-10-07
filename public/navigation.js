(() => {
  if (window.__sharedNavigationBound) return;
  window.__sharedNavigationBound = true;
  let cleanup = () => {};

  const bind = () => {
    cleanup();
    const rail = document.querySelector('header .internal-links');
    const current = rail?.querySelector('[aria-current="page"]');
    if (!rail || !current) return;
    let disposed = false;
    // Reveal only after layout/lifecycle changes, never in response to scrolling.
    const observer = new IntersectionObserver(
      (entries) => {
        observer.disconnect();
        if (disposed) return;
        for (const entry of entries) {
          if (entry.intersectionRatio >= 1 || !entry.rootBounds) continue;
          const item = entry.boundingClientRect;
          const container = entry.rootBounds;
          rail.scrollBy({
            left:
              item.left - container.left - (container.width - item.width) / 2,
            behavior: 'auto',
          });
        }
      },
      { root: rail, rootMargin: '0px -4px', threshold: 1 },
    );
    const reveal = () => {
      if (disposed) return;
      observer.disconnect();
      observer.observe(current);
    };
    const resize = new ResizeObserver(reveal);
    resize.observe(rail);
    document.fonts.ready.then(reveal);
    document.fonts.addEventListener('loadingdone', reveal);
    cleanup = () => {
      disposed = true;
      observer.disconnect();
      resize.disconnect();
      document.fonts.removeEventListener('loadingdone', reveal);
    };
    reveal();
  };

  document.addEventListener('astro:before-swap', () => cleanup());
  document.addEventListener('astro:page-load', bind);
  window.addEventListener('pageshow', bind);
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const trigger = event.target.closest('[data-command-trigger]');
    if (!trigger) return;
    // Safari pointer activation does not focus buttons. Retain a real opener.
    trigger.focus({ preventScroll: true });
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        ctrlKey: true,
      }),
    );
  });
  bind();
})();
