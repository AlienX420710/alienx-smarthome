import { parseStatus } from './status-response.js';
let config;
let generation = 0;
let requests = new AbortController();
const createHandlers = (overlay, notify, signal) => ({
  help: () =>
    overlay(
      config.helpTitle,
      commands.map((c) => `${c.name} — ${c.description}`).join('\n'),
    ),
  build: async () => {
    try {
      const t = performance.now(),
        r = await fetch(config.statusEndpoint, {
          cache: 'no-store',
          signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
        }),
        d = parseStatus(await r.json(), config.statusChecks);
      overlay(
        'BUILD // PRODUCTION',
        `Site: ${config.siteName}\nRuntime: ${d.runtime ?? 'Cloudflare Workers'}\nEndpoint: ${config.statusEndpoint}\nStatus: ${d.status ?? 'unknown'}\nChecked: ${d.generatedAt ?? 'unknown'}\nRequest ID: ${d.requestId ?? 'unknown'}\nProbe: ${Math.round(performance.now() - t)} ms`,
      );
    } catch {
      overlay(
        'BUILD // PRODUCTION',
        'The production status endpoint could not be reached.',
      );
    }
  },
  version: () =>
    overlay(
      'VERSION // RUNTIME',
      `${config.siteName}\nRuntime: Cloudflare Workers\nBrowser: ${navigator.userAgent}\nLanguage: ${navigator.language}`,
    ),
  diagnostics: async () => {
    try {
      const t = performance.now(),
        r = await fetch(config.statusEndpoint, {
          cache: 'no-store',
          signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
        }),
        d = parseStatus(await r.json(), config.statusChecks),
        lines = Object.entries(d.checks ?? {}).map(
          ([n, c]) => `${n}: ${c.status ?? 'unknown'} — ${c.detail ?? ''}`,
        );
      overlay(
        'DIAGNOSTICS // LIVE',
        [
          `HTTP: ${r.status}`,
          `RTT: ${Math.round(performance.now() - t)} ms`,
          `Overall: ${d.status ?? 'unknown'}`,
          ...lines,
        ].join('\n'),
      );
    } catch {
      overlay(
        'DIAGNOSTICS // LIVE',
        `Production diagnostics failed: ${config.statusEndpoint} was unreachable.`,
      );
    }
  },
  security: async () => {
    try {
      const d = parseStatus(
        await (
          await fetch(config.statusEndpoint, {
            cache: 'no-store',
            signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
          })
        ).json(),
        config.statusChecks,
      );
      const lines = config.securityChecks.map(
        ([label, key]) => `${label}: ${d.checks[key]?.status ?? 'unknown'}`,
      );
      overlay(
        'SECURITY // SURFACE',
        `${lines.join('\n')}\nRequest protection: ${config.requestProtection}\nReporting: SECURITY.md\nNo secrets are exposed by this command.`,
      );
    } catch {
      overlay(
        'SECURITY // SURFACE',
        'Security status is currently unavailable.',
      );
    }
  },
  source: () => window.open(config.sourceUrl, '_blank', 'noopener,noreferrer'),
  ping: async () => {
    const t = performance.now();
    try {
      const r = await fetch(config.statusEndpoint, {
        cache: 'no-store',
        signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
      });
      notify(
        `PING ${r.ok ? 'OK' : 'HTTP ' + r.status} · ${Math.round(performance.now() - t)} ms`,
      );
    } catch {
      notify('PING FAILED · production endpoint unreachable');
    }
  },
  health: () => go(config.statusRoute),
  inspect: () => {
    const n = performance.getEntriesByType('navigation')[0];
    overlay(
      'INSPECT // PAGE',
      `Path: ${location.pathname}\nTitle: ${document.title}\nViewport: ${innerWidth} × ${innerHeight}\nDevice pixel ratio: ${devicePixelRatio}\nNavigation: ${n ? Math.round(n.duration) + ' ms' : 'n/a'}\nOnline: ${navigator.onLine ? 'yes' : 'no'}`,
    );
  },
  network: () => {
    const c = navigator.connection;
    overlay(
      'NETWORK // BROWSER',
      `Online: ${navigator.onLine ? 'yes' : 'no'}\nConnection: ${c?.effectiveType ?? 'unavailable'}\nDownlink: ${c?.downlink != null ? c.downlink + ' Mbps' : 'unavailable'}\nRTT hint: ${c?.rtt != null ? c.rtt + ' ms' : 'unavailable'}\nSave-data: ${c?.saveData ? 'on' : 'off'}`,
    );
  },
  technology_stack: () => overlay('TECHNOLOGY // STACK', config.stack),
  matrix: () => overlay('MATRIX // VISUAL', config.matrix),
  konami: () => {
    document.documentElement.setAttribute(config.konamiAttribute, 'true');
    notify(config.konamiNotice);
  },
  motion: () => {
    const off =
      document.documentElement.getAttribute(config.motionAttribute) === 'off';
    window[config.motionSetter]?.(off ? 'on' : 'off');
    notify(`MOTION // ${off ? 'ON' : 'OFF'}`);
  },
  theme: () => {
    const current =
        document.documentElement.getAttribute(config.themeAttribute) ??
        'system',
      next =
        current === 'system'
          ? 'light'
          : current === 'light'
            ? 'dark'
            : 'system';
    window[config.themeSetter]?.(next);
    notify(`THEME // ${next.toUpperCase()}`);
  },
  clear: () => {
    const i = input();
    if (i) {
      i.value = '';
      active = 0;
      render();
      i.focus();
    }
  },
  refresh: () => location.reload(),
});
const go = (href) => {
  window.location.href = href;
};
let overlayFocus = null;
let active = 0,
  previousFocus = null,
  commands = [];
const root = () => document.querySelector('[data-command-palette]');
const input = () => document.querySelector(`#${config.inputId}`);
const closeControl = () =>
  document.querySelector('[data-command-palette] button[data-palette-close]');
const results = () => document.querySelector(`#${config.resultsId}`);
const links = () =>
  results()
    ? [...results().querySelectorAll('button[data-command-index]')]
    : [];
const notify = (message) => {
  let toast = document.querySelector(`#${config.toastId}`);
  if (!toast) {
    toast = document.createElement('div');
    toast.id = config.toastId;
    toast.className = 'palette__toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.hidden = false;
  window.setTimeout(() => {
    if (toast) toast.hidden = true;
  }, 2400);
};
const overlay = (title, content) => {
  overlayFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  let el = document.querySelector(`#${config.overlayId}`);
  if (!el) {
    el = document.createElement('dialog');
    el.id = config.overlayId;
    el.setAttribute('aria-labelledby', 'command-overlay-title');
    el.className = 'palette__overlay';
    document.body.appendChild(el);
  }
  el.innerHTML =
    '<div class="palette__overlay-backdrop" data-command-overlay-close></div><section class="palette__overlay-panel"><div class="palette__overlay-head"><strong id="command-overlay-title"></strong><button type="button" data-command-overlay-close aria-label="Close">ESC</button></div><div class="palette__overlay-content"></div></section>';
  el.querySelector('#command-overlay-title').textContent = title;
  el.querySelector('.palette__overlay-content').textContent = content;
  el.hidden = false;
  if (!el.open) el.showModal();
  el.querySelector('button[data-command-overlay-close]')?.focus();
};
const closeOverlay = () => {
  if (!config) return;
  const el = document.querySelector(`#${config.overlayId}`);
  if (el?.open) {
    el.close();
    el.hidden = true;
    overlayFocus?.focus();
    overlayFocus = null;
  }
};
const render = () => {
  if (!root() || !config) return;
  const i = input(),
    r = results();
  if (!r) return;
  const q = i?.value.toLowerCase().trim() ?? '';
  const filtered = commands.filter((c) =>
    `${c.name} ${c.description} ${c.keywords}`.toLowerCase().includes(q),
  );
  active = Math.min(active, Math.max(0, filtered.length - 1));
  const nodes = filtered.map((command, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `palette-result-${index}`;
    button.dataset.commandIndex = String(commands.indexOf(command));
    button.className = `palette__item${index === active ? ' is-active' : ''}`;
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', String(index === active));
    const copy = document.createElement('span');
    const name = document.createElement('strong');
    const description = document.createElement('small');
    name.textContent = command.name;
    description.textContent = command.description;
    copy.append(name, description);
    const hint = document.createElement('kbd');
    hint.textContent = '↵';
    button.append(copy, hint);
    return button;
  });
  if (!nodes.length) {
    const empty = document.createElement('div');
    empty.className = 'palette__empty';
    empty.setAttribute('role', 'option');
    empty.setAttribute('aria-selected', 'false');
    empty.textContent = 'No matching command.';
    nodes.push(empty);
  }
  r.replaceChildren(...nodes);
  i?.setAttribute(
    'aria-activedescendant',
    filtered.length ? `palette-result-${active}` : '',
  );
};
const close = () => {
  const r = root();
  if (!r || r.hidden) return;
  r.close();
  r.hidden = true;
  closeOverlay();
  if (previousFocus instanceof HTMLElement) previousFocus.focus();
  previousFocus = null;
};
const open = () => {
  const r = root(),
    i = input();
  if (!r) return;
  previousFocus = document.activeElement;
  r.hidden = false;
  if (!r.open) r.showModal();
  active = 0;
  render();
  i?.focus();
  i?.select();
};
const refreshCommands = () => {
  const node = root();
  if (!node) {
    commands = [];
    config = undefined;
    return;
  }
  try {
    config = JSON.parse(node.dataset.commandPalette);
  } catch {
    commands = [];
    config = undefined;
    return;
  }
  if (!Array.isArray(config?.commands)) {
    config = undefined;
    commands = [];
    return;
  }
  requests = new AbortController();
  commands = config.commands.map((command) => ({
    ...command,
    run: () => {
      const attempt = generation;
      const guarded =
        (callback) =>
        (...args) => {
          if (attempt === generation) callback(...args);
        };
      const actions = createHandlers(
        guarded(overlay),
        guarded(notify),
        requests.signal,
      );
      return command.action === 'navigate'
        ? go(command.href)
        : actions[command.action]?.();
    },
  }));
};
const trap = (e) => {
  const r = root();
  if (r?.hidden || e.key !== 'Tab') return;
  const f = [closeControl(), input(), ...links()].filter((x) => x !== null);
  if (!f.length) {
    e.preventDefault();
    return;
  }
  const first = f[0],
    last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
};
const key = (e) => {
  if (!root()) return;
  const overlay = document.querySelector(`#${config.overlayId}`);
  if (e.key === 'Tab' && overlay?.open) {
    // This informational dialog has one control. Keep both tab directions
    // inside it rather than letting focus escape to browser chrome/body.
    e.preventDefault();
    overlay.querySelector('button[data-command-overlay-close]')?.focus();
    return;
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    open();
    return;
  }
  if (e.key === 'Escape') {
    if (!root()?.hidden) {
      e.preventDefault();
      close();
    }
    closeOverlay();
    return;
  }
  if (root()?.hidden) return;
  trap(e);
  const l = links();
  if (e.key === 'ArrowDown' && l.length) {
    e.preventDefault();
    active = Math.min(active + 1, l.length - 1);
    render();
    links()[active]?.scrollIntoView({ block: 'nearest' });
  }
  if (e.key === 'ArrowUp' && l.length) {
    e.preventDefault();
    active = Math.max(active - 1, 0);
    render();
    links()[active]?.scrollIntoView({ block: 'nearest' });
  }
  // Native result buttons must activate the button reached by Tab, not the
  // search input's independently tracked arrow-key selection.
  if (e.target !== input()) return;
  if (e.key === 'Enter' && l[active]) {
    e.preventDefault();
    l[active].click();
  }
};
const click = (e) => {
  if (!root()) return;
  if (!(e.target instanceof HTMLElement)) return;
  if (e.target.closest('[data-palette-close]')) {
    close();
    return;
  }
  if (e.target.closest('[data-command-overlay-close]')) {
    closeOverlay();
    return;
  }
  const l = e.target.closest('button[data-command-index]');
  if (!l) return;
  e.preventDefault();
  const c = commands[Number(l.dataset.commandIndex)];
  if (c) {
    if (c.action !== 'clear') close();
    void c.run();
  }
};
document.addEventListener('astro:before-swap', () => {
  generation++;
  requests.abort();
  close();
  closeOverlay();
});
window.addEventListener('pagehide', () => {
  generation++;
  requests.abort();
  close();
  closeOverlay();
});
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  refreshCommands();
  active = 0;
  render();
});
document.addEventListener('keydown', key);
document.addEventListener('input', () => {
  active = 0;
  render();
});
document.addEventListener('click', click);
document.addEventListener('astro:page-load', () => {
  refreshCommands();
  active = 0;
  render();
});
refreshCommands();
render();
