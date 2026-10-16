(() => {
  if (window.sitePreferences) return;
  let config;
  try {
    config = JSON.parse(document.currentScript?.dataset.preferences || 'null');
  } catch {
    return;
  }
  if (!config || !config.theme || !config.motion || !config.pageAttribute)
    return;
  const read = (key, fallback) => {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  };
  let theme = read(config.theme.key, 'system');
  let motion = read(config.motion.key, '');
  const apply = (doc = document, url = location.href) => {
    const root = doc.documentElement;
    if (theme === 'light' || theme === 'dark')
      root.setAttribute(config.theme.attribute, theme);
    else root.removeAttribute(config.theme.attribute);
    if (motion === 'on' || motion === 'off')
      root.setAttribute(config.motion.attribute, motion);
    else root.removeAttribute(config.motion.attribute);
    const path = new URL(url).pathname.replace(/\/$/, '') || '/';
    const page = config.routes?.[path];
    root.setAttribute(
      config.pageAttribute,
      page ||
        (root.getAttribute(config.pageAttribute) === 'error'
          ? 'error'
          : 'default'),
    );
  };
  const set = (kind, next) => {
    const setting = config[kind];
    if (kind === 'theme')
      theme = ['light', 'dark'].includes(next) ? next : 'system';
    else motion = ['on', 'off'].includes(next) ? next : '';
    try {
      localStorage.setItem(setting.key, kind === 'theme' ? theme : motion);
    } catch {}
    apply();
    document.dispatchEvent(new Event(setting.event));
  };
  window.sitePreferences = {
    apply,
    setTheme: (next) => set('theme', next),
    setMotion: (next) => set('motion', next),
  };
  window[config.theme.setter] = window.sitePreferences.setTheme;
  window[config.motion.setter] = window.sitePreferences.setMotion;
  apply();
  document.addEventListener('astro:before-swap', (event) =>
    apply(event.newDocument, event.to.href),
  );
  document.addEventListener('astro:page-load', () => apply());
})();
