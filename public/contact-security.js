(() => {
  if (window.__alienxContactSecurityBound) return;
  window.__alienxContactSecurityBound = true;
  const widget = window.createSiteTurnstile('#alienx-turnstile', (next) => ({
    action: 'contact',
    size: 'compact',
    'response-field-name': 'website',
    callback: () => {
      next.dataset.state = 'success';
    },
    'expired-callback': () => {
      next.dataset.state = 'expired';
    },
    'error-callback': () => {
      next.dataset.state = 'error';
    },
  }));
  window.__alienxTurnstileReset = widget.reset;
  window.alienxTurnstileLoad = widget.render;
  if (window.turnstile) widget.render();
  else {
    const script = document.createElement('script');
    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=alienxTurnstileLoad';
    script.async = true;
    document.head.appendChild(script);
  }
})();
