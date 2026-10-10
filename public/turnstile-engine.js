(() => {
  if (window.createSiteTurnstile) return;
  const widgets = new Map();
  window.createSiteTurnstile = (selector, options) => {
    if (widgets.has(selector)) return widgets.get(selector);
    let container = null;
    let widgetId = null;
    let generation = 0;
    let presentation = '';
    let resizeObserver = null;
    const remove = () => {
      generation++;
      resizeObserver?.disconnect();
      resizeObserver = null;
      const id = widgetId;
      widgetId = null;
      container = null;
      if (id != null && window.turnstile) {
        try {
          window.turnstile.remove(id);
        } catch {}
      }
    };
    const render = () => {
      const next = document.querySelector(selector);
      if (!next) {
        remove();
        return;
      }
      if (!window.turnstile) return;
      const settings = options(next);
      const nextPresentation = JSON.stringify([settings.size, settings.theme]);
      if (next === container && nextPresentation === presentation) return;
      remove();
      container = next;
      presentation = nextPresentation;
      const current = generation;
      for (const name of ['callback', 'expired-callback', 'error-callback']) {
        const callback = settings[name];
        if (callback)
          settings[name] = (...args) => {
            if (current === generation && container === next) callback(...args);
          };
      }
      next.innerHTML = '';
      next.dataset.state = 'loading';
      try {
        widgetId = window.turnstile.render(next, {
          sitekey: next.dataset.sitekey,
          theme: 'auto',
          'refresh-expired': 'auto',
          'refresh-timeout': 'auto',
          ...settings,
        });
        if (window.ResizeObserver) {
          resizeObserver = new window.ResizeObserver(render);
          resizeObserver.observe(next);
        }
      } catch {
        settings['error-callback']?.();
        remove();
      }
    };
    const reset = () => {
      if (widgetId == null || !window.turnstile) return;
      try {
        window.turnstile.reset(widgetId);
      } catch {}
    };
    const widget = { render, reset };
    widgets.set(selector, widget);
    document.addEventListener('astro:before-swap', remove);
    document.addEventListener('astro:page-load', render);
    if (window.MutationObserver) {
      new window.MutationObserver(render).observe(document.documentElement, {
        attributes: true,
      });
    }
    return widget;
  };
})();
