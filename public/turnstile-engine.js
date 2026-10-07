(() => {
  if (window.createSiteTurnstile) return;
  const widgets = new Map();
  window.createSiteTurnstile = (selector, options) => {
    if (widgets.has(selector)) return widgets.get(selector);
    let container = null;
    let widgetId = null;
    let generation = 0;
    const remove = () => {
      generation++;
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
      if (!window.turnstile || next === container) return;
      remove();
      container = next;
      const current = generation;
      const settings = options(next);
      for (const name of ['callback', 'expired-callback', 'error-callback']) {
        const callback = settings[name];
        if (callback)
          settings[name] = (...args) => {
            if (current === generation && container === next) callback(...args);
          };
      }
      next.innerHTML = '';
      try {
        widgetId = window.turnstile.render(next, {
          sitekey: next.dataset.sitekey,
          theme: 'auto',
          'refresh-expired': 'auto',
          'refresh-timeout': 'auto',
          ...settings,
        });
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
    return widget;
  };
})();
