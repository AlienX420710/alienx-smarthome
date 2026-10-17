(() => {
  if (window.siteConfirmation) {
    window.siteConfirmation.render();
    return;
  }
  const key = 'site-confirmation-v1';
  const lifetime = 10 * 60 * 1000;
  let timer;
  let heading;
  const firstName = (value) => {
    if (typeof value !== 'string') return '';
    const name = value.trim().split(/\s+/u)[0] || '';
    return name.length <= 60 && /^[\p{L}\p{M}][\p{L}\p{M}'’.-]*$/u.test(name)
      ? name
      : '';
  };
  const route = (value) =>
    typeof value === 'string' && /^\/[a-z0-9/-]+$/i.test(value)
      ? value.replace(/\/+$/, '')
      : '';
  const clear = () => {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Personalization is optional when browser storage is unavailable.
    }
  };
  const reset = () => {
    window.clearTimeout(timer);
    if (heading) heading.textContent = heading.dataset.confirmationGeneric;
    heading = null;
  };
  const rememberAccepted = (name, destination) => {
    clear();
    const given = firstName(name);
    const path = route(destination);
    if (!given || !path) return;
    try {
      window.sessionStorage.setItem(
        key,
        JSON.stringify({
          firstName: given,
          route: path,
          expires: Date.now() + lifetime,
        }),
      );
    } catch {
      // Never let a storage failure change accepted-submission navigation.
    }
  };
  const render = () => {
    reset();
    heading = document.querySelector('[data-confirmation-heading]');
    if (!heading) return;
    heading.textContent = heading.dataset.confirmationGeneric;
    let saved;
    try {
      saved = JSON.parse(window.sessionStorage.getItem(key));
    } catch {
      clear();
      return;
    }
    const now = Date.now();
    if (
      !saved ||
      firstName(saved.firstName) !== saved.firstName ||
      !saved.firstName ||
      !Number.isFinite(saved.expires) ||
      saved.expires <= now ||
      saved.expires > now + lifetime ||
      route(saved.route) !== route(window.location.pathname)
    ) {
      clear();
      return;
    }
    heading.textContent = `Thank you, ${saved.firstName}!`;
    timer = window.setTimeout(() => {
      clear();
      reset();
    }, saved.expires - now);
  };
  window.siteConfirmation = { rememberAccepted, clear, render };
  document.addEventListener('astro:page-load', render);
  document.addEventListener('astro:before-swap', reset);
  window.addEventListener('pagehide', reset);
  window.addEventListener('pageshow', render);
  render();
})();
