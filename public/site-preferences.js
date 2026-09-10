(() => {
  if (window.__alienxPreferencesBound) return;
  window.__alienxPreferencesBound = true;
  let theme = 'system';
  let motion = '';
  try {
    theme = localStorage.getItem('alienx-theme') || 'system';
    motion = localStorage.getItem('alienx-motion') || '';
  } catch { /* Keep system preferences when storage is unavailable. */ }
  const apply = (doc = document, url = location.href) => {
    const root = doc.documentElement;
    if (theme === 'light' || theme === 'dark') root.dataset.alienxTheme = theme;
    else delete root.dataset.alienxTheme;
    if (motion === 'on' || motion === 'off') root.dataset.alienxMotion = motion;
    const path = new URL(url).pathname.replace(/\/$/, '') || '/';
    root.dataset.alienxPage = ({ '/': 'home', '/work': 'work', '/experience': 'experience', '/technology': 'technology', '/status': 'status', '/about': 'about', '/contact': 'contact', '/contact/success': 'contact-success' })[path] || 'default';
  };
  window.__alienxSetTheme = (next) => {
    theme = ['light', 'dark'].includes(next) ? next : 'system';
    try { localStorage.setItem('alienx-theme', theme); } catch {}
    apply();
    document.dispatchEvent(new Event('alienx:theme-change'));
  };
  window.__alienxSetMotion = (next) => {
    motion = next;
    try { localStorage.setItem('alienx-motion', next); } catch {}
    apply();
    document.dispatchEvent(new Event('alienx:motion-change'));
  };
  apply();
  document.addEventListener('astro:before-swap', event => apply(event.newDocument, event.to.href));
  document.addEventListener('astro:page-load', () => apply());
})();
