(() => {
  if (window.__alienxContactSecurityBound) return;
  window.__alienxContactSecurityBound = true;
  let container;
  const remove = () => {
    const id = window.__alienxTurnstileWidgetId;
    if (id != null && window.turnstile) {
      try { window.turnstile.remove(id); } catch {}
    }
    window.__alienxTurnstileWidgetId = null;
    container = null;
  };
  const render = () => {
    const next = document.getElementById('alienx-turnstile');
    if (!next || !window.turnstile || next === container) return;
    remove();
    container = next;
    window.__alienxTurnstileWidgetId = window.turnstile.render(next, {
      sitekey: next.dataset.sitekey, action: 'contact', theme: 'auto', size: 'flexible',
      'response-field-name': 'website', 'refresh-expired': 'auto', 'refresh-timeout': 'auto',
      callback: () => { next.dataset.state = 'success'; },
      'expired-callback': () => { next.dataset.state = 'expired'; },
      'error-callback': () => { next.dataset.state = 'error'; }
    });
  };
  window.__alienxTurnstileReset = () => {
    const id = window.__alienxTurnstileWidgetId;
    if (id != null && window.turnstile) window.turnstile.reset(id);
  };
  window.alienxTurnstileLoad = render;
  document.addEventListener('astro:before-swap', remove);
  document.addEventListener('astro:page-load', render);
  if (window.turnstile) render();
  else {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=alienxTurnstileLoad';
    script.async = true;
    document.head.appendChild(script);
  }
})();
