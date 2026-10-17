import { parseStatus } from './status-response.js';

let cleanup;
export function initializeStatus() {
  cleanup?.();
  cleanup = undefined;
  const root = document.querySelector('[data-status-dashboard]');
  if (!root) return;
  let config;
  try {
    config = JSON.parse(root.dataset.statusDashboard);
  } catch {
    return;
  }
  if (!config?.endpoint || !Array.isArray(config.checks)) return;
  const lifecycle = new AbortController();
  const { signal } = lifecycle;
  const find = (name) => root.querySelector(`[data-status-${name}]`);
  const checks = find('checks'),
    overall = find('overall'),
    overallLabel = find('label'),
    updated = find('updated'),
    button = find('refresh'),
    progress = find('progress');
  let timer;
  let refreshing = false;
  const setOverall = (state) => {
    if (overall) overall.dataset.state = state;
    if (overallLabel) overallLabel.textContent = config.states[state];
  };
  const renderCheck = (state, label, detail, error = false) => {
    const article = document.createElement('article');
    article.className = `check check--${state}${error ? ' check--error' : ''}`;
    const icon = document.createElement('div');
    icon.className = 'check-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.append(document.createElement('span'));
    const copy = document.createElement('div');
    copy.className = 'check-copy';
    const name = document.createElement('span');
    name.className = 'check-name';
    name.textContent = label;
    const status = document.createElement('strong');
    status.textContent = error
      ? config.error.state
      : config.states[state].toUpperCase();
    const description = document.createElement('small');
    description.textContent = detail;
    copy.append(name, status, description);
    article.append(icon, copy);
    return article;
  };
  const schedule = () => {
    window.clearTimeout(timer);
    if (!signal.aborted && !document.hidden)
      timer = window.setTimeout(refresh, 30000);
  };
  const refresh = async () => {
    if (refreshing || signal.aborted || document.hidden) return;
    window.clearTimeout(timer);
    refreshing = true;
    setOverall('checking');
    checks?.setAttribute('aria-busy', 'true');
    if (button) button.disabled = true;
    progress?.classList.add('loading');
    try {
      const response = await fetch(config.endpoint, {
        cache: 'no-store',
        signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
      });
      if (!response.ok && response.status !== 503)
        throw new Error('Unavailable status');
      const data = parseStatus(
        await response.json(),
        config.checks.map(([key]) => key),
      );
      if (signal.aborted) return;
      checks?.replaceChildren(
        ...config.checks.map(([key, label, fallback]) => {
          const check = data.checks[key];
          return renderCheck(
            check?.status ?? 'degraded',
            label,
            check?.detail ?? fallback,
          );
        }),
      );
      checks?.setAttribute('aria-busy', 'false');
      setOverall(data.status === 'operational' ? 'operational' : 'degraded');
      if (updated)
        updated.textContent = `${config.updatedPrefix} ${new Date(data.generatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}`;
    } catch {
      if (signal.aborted) return;
      checks?.replaceChildren(
        renderCheck('degraded', config.error.label, config.error.detail, true),
      );
      checks?.setAttribute('aria-busy', 'false');
      setOverall('degraded');
      if (updated) updated.textContent = config.error.updated;
    } finally {
      if (!signal.aborted) {
        progress?.classList.remove('loading');
        if (button) button.disabled = false;
        refreshing = false;
        schedule();
      }
    }
  };
  button?.addEventListener('click', refresh, { signal });
  document.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key.toLowerCase() === 'r' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !(
          event.target instanceof HTMLElement &&
          (event.target.isContentEditable ||
            event.target.closest(
              'input, textarea, select, [role=dialog], dialog',
            ))
        )
      ) {
        event.preventDefault();
        void refresh();
      }
    },
    { signal },
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) window.clearTimeout(timer);
      else void refresh();
    },
    { signal },
  );
  cleanup = () => {
    lifecycle.abort();
    window.clearTimeout(timer);
  };
  void refresh();
}
if (typeof document !== 'undefined') {
  document.addEventListener('astro:before-swap', () => cleanup?.());
  document.addEventListener('astro:page-load', initializeStatus);
  window.addEventListener('pagehide', () => cleanup?.());
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) initializeStatus();
  });
  initializeStatus();
}
