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
  matrix: () => startMatrix(),
  konami: () => {
    const enabled =
      document.documentElement.getAttribute(config.konamiAttribute) !== 'true';
    if (enabled) {
      document.documentElement.setAttribute(config.konamiAttribute, 'true');
      overlay('KONAMI // ORIGINS', config.konamiStory, config.konamiLinks);
    } else {
      document.documentElement.removeAttribute(config.konamiAttribute);
      notify('KONAMI // RETRO MODE OFF');
    }
    try {
      sessionStorage.setItem(
        config.konamiAttribute,
        enabled ? 'true' : 'false',
      );
    } catch {
      // The effect still works for this page when storage is unavailable.
    }
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
let matrix = null;
let konamiProgress = 0;
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
const overlay = (title, content, destinations = []) => {
  stopMatrix();
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
  el.classList.remove('palette__overlay--matrix');
  el.innerHTML =
    '<div class="palette__overlay-backdrop" data-command-overlay-close></div><section class="palette__overlay-panel"><div class="palette__overlay-head"><strong id="command-overlay-title"></strong><button type="button" data-command-overlay-close aria-label="Close">ESC</button></div><div class="palette__overlay-content"></div></section>';
  el.querySelector('#command-overlay-title').textContent = title;
  el.querySelector('.palette__overlay-content').textContent = content;
  if (Array.isArray(destinations) && destinations.length) {
    const nav = document.createElement('nav');
    nav.className = 'palette__overlay-links';
    nav.setAttribute('aria-label', 'Explore pages');
    for (const destination of destinations) {
      if (
        typeof destination?.label !== 'string' ||
        typeof destination?.href !== 'string' ||
        !/^\/[a-z0-9/-]*$/i.test(destination.href) ||
        destination.href.includes('//')
      )
        continue;
      const link = document.createElement('a');
      link.href = destination.href;
      link.textContent = destination.label;
      nav.append(link);
    }
    el.querySelector('.palette__overlay-panel').append(nav);
  }
  el.hidden = false;
  if (!el.open) el.showModal();
  el.querySelector('button[data-command-overlay-close]')?.focus();
};
const stopMatrix = () => {
  if (!matrix) return;
  window.clearTimeout(matrix.timeout);
  window.cancelAnimationFrame(matrix.frame);
  window.removeEventListener('resize', matrix.resize);
  matrix = null;
};
const startMatrix = () => {
  overlay(
    'MATRIX',
    'Follow the white rabbit. The code rain ends in 10 seconds.',
  );
  const dialog = document.querySelector(`#${config.overlayId}`);
  const content = dialog?.querySelector('.palette__overlay-content');
  if (!dialog || !content) return;
  dialog.classList.add('palette__overlay--matrix');
  const canvas = document.createElement('canvas');
  canvas.className = 'palette__matrix-rain';
  canvas.setAttribute('aria-hidden', 'true');
  content.prepend(canvas);
  const context = canvas.getContext('2d');
  const reduced =
    matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.getAttribute(config.motionAttribute) === 'off';
  let columns = [];
  const glyphs = 'アイウエオカキクケコサシスセソ012345789';
  const resize = () => {
    const width = Math.max(1, Math.round(canvas.clientWidth));
    const height = Math.max(1, Math.round(canvas.clientHeight));
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    columns = Array.from({ length: Math.ceil(width / 18) }, () =>
      Math.floor(Math.random() * (height / 18)),
    );
  };
  resize();
  window.addEventListener('resize', resize);
  const draw = () => {
    if (!context || !matrix || !dialog.open) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    context.fillStyle = 'rgba(0, 5, 1, 0.14)';
    context.fillRect(0, 0, width, height);
    context.font = '16px monospace';
    context.fillStyle = '#58ff7a';
    columns.forEach((position, index) => {
      context.fillText(
        glyphs[Math.floor(Math.random() * glyphs.length)],
        index * 18,
        position * 18,
      );
      columns[index] =
        position * 18 > height && Math.random() > 0.975 ? 0 : position + 1;
    });
    matrix.frame = window.requestAnimationFrame(draw);
  };
  matrix = {
    frame: 0,
    timeout: window.setTimeout(closeOverlay, 10000),
    resize,
  };
  if (!reduced) matrix.frame = window.requestAnimationFrame(draw);
};
const closeOverlay = () => {
  if (!config) return;
  const el = document.querySelector(`#${config.overlayId}`);
  if (el?.open) {
    stopMatrix();
    el.classList.remove('palette__overlay--matrix');
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
  if (config.konamiAttribute) {
    try {
      if (sessionStorage.getItem(config.konamiAttribute) === 'true')
        document.documentElement.setAttribute(config.konamiAttribute, 'true');
    } catch {
      // Session storage is optional.
    }
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
  const sequence = [
    'arrowup',
    'arrowup',
    'arrowdown',
    'arrowdown',
    'arrowleft',
    'arrowright',
    'arrowleft',
    'arrowright',
    'b',
    'a',
  ];
  if (
    root().hidden &&
    !overlay?.open &&
    !e.altKey &&
    !e.ctrlKey &&
    !e.metaKey &&
    !(
      e.target instanceof Element &&
      e.target.closest('input, textarea, select, [contenteditable]')
    )
  ) {
    const pressed = e.key.toLowerCase();
    konamiProgress =
      pressed === sequence[konamiProgress]
        ? konamiProgress + 1
        : pressed === sequence[0]
          ? 1
          : 0;
    if (konamiProgress === sequence.length) {
      konamiProgress = 0;
      e.preventDefault();
      commands.find((command) => command.action === 'konami')?.run();
      return;
    }
  }
  if (e.key === 'Tab' && overlay?.open) {
    const controls = [...overlay.querySelectorAll('button, a[href]')];
    const current = controls.indexOf(document.activeElement);
    const step = e.shiftKey ? -1 : 1;
    e.preventDefault();
    const next =
      current < 0
        ? e.shiftKey
          ? controls.length - 1
          : 0
        : (current + step + controls.length) % controls.length;
    controls[next]?.focus();
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
