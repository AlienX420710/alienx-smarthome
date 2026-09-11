(() => {
  if (window.__alienxMuseumInstalled) return;
  window.__alienxMuseumInstalled = true;
  let dispose = () => {};
  const boot = () => {
    dispose();
    if (!document.querySelector('#museum')) return;
    const controller = new AbortController();
    const on = (target, event, handler) => target?.addEventListener(event, handler, { signal: controller.signal });
    const scenes = [];
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => document.documentElement.dataset.alienxMotion !== 'off' && !media.matches;
    let frame = 0, previous = 0;
    const schedule = () => {
      if (!frame && !document.hidden && motion() && scenes.some(s => s.visible && s.animate)) frame = requestAnimationFrame(tick);
    };
    const tick = time => {
      frame = 0;
      if (controller.signal.aborted || document.hidden || !motion()) return;
      if (time - previous >= 32) {
        previous = time;
        for (const scene of scenes) if (scene.visible && scene.animate) scene.draw(true);
      }
      schedule();
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const scene = scenes.find(s => s.stage === entry.target);
        if (scene) scene.visible = entry.isIntersecting;
      }
      schedule();
    });
    const canvasScene = (selector, label, draw, animate = false) => {
      const canvas = document.querySelector(selector);
      if (!(canvas instanceof HTMLCanvasElement)) return null;
      const stage = canvas.parentElement, ctx = canvas.getContext('2d');
      if (!ctx) return null;
      stage.tabIndex = 0;
      stage.setAttribute('role', 'group');
      stage.setAttribute('aria-label', label);
      canvas.setAttribute('aria-hidden', 'true');
      const scene = { stage, canvas, ctx, visible: false, animate, width: 1, height: 1, draw: advance => draw(scene, advance) };
      const resize = () => {
        scene.width = stage.clientWidth; scene.height = stage.clientHeight;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        canvas.width = scene.width * dpr; canvas.height = scene.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        scene.draw(false);
      };
      scenes.push(scene); observer.observe(stage); on(window, 'resize', resize); resize();
      return scene;
    };
    const color = stage => getComputedStyle(stage).getPropertyValue('--museum-green').trim() || '#39ff5a';
    const clear = s => { s.ctx.clearRect(0, 0, s.width, s.height); s.ctx.strokeStyle = color(s.stage); s.ctx.fillStyle = color(s.stage); };
    const position = (s, event) => { const r = s.stage.getBoundingClientRect(); return { x: event.clientX - r.left, y: event.clientY - r.top }; };
    const keyboardPoint = (s, point, event) => {
      const delta = { ArrowLeft: [-18, 0], ArrowRight: [18, 0], ArrowUp: [0, -18], ArrowDown: [0, 18] }[event.key];
      if (!delta) return false;
      event.preventDefault(); point.x = Math.max(0, Math.min(s.width, point.x + delta[0])); point.y = Math.max(0, Math.min(s.height, point.y + delta[1]));
      return true;
    };
    for (const [selector, count, animate] of [['[data-pointer-canvas]', 70, false], ['[data-particle-canvas]', 100, true]]) {
      const point = { x: 120, y: 100 }; let time = 0;
      const s = canvasScene(selector, 'Pointer field. Use arrow keys to move the point.', (s, advance) => {
        clear(s); if (advance) time += .35;
        for (let i = 0; i < count; i++) {
          const x = ((i * 97 + time) % s.width), y = (i * 53) % s.height;
          const dx = x - point.x, dy = y - point.y, force = Math.max(0, 1 - Math.hypot(dx, dy) / 170);
          s.ctx.globalAlpha = .3 + force * .7; s.ctx.beginPath(); s.ctx.arc(x + dx * force * .12, y + dy * force * .12, 1.5 + force * 2, 0, Math.PI * 2); s.ctx.fill();
        }
        s.ctx.globalAlpha = 1;
      }, animate);
      if (!s) continue;
      on(s.stage, 'pointermove', e => { Object.assign(point, position(s, e)); s.draw(false); });
      on(s.stage, 'keydown', e => { if (keyboardPoint(s, point, e)) s.draw(false); });
    }
    for (const button of document.querySelectorAll('[data-kinetic]')) {
      const reset = () => { for (const name of ['--tx', '--ty', '--rot']) button.style.removeProperty(name); };
      on(button, 'pointermove', e => { if (!motion()) return; const r = button.getBoundingClientRect(); button.style.setProperty('--rot', `${((e.clientX - r.left) / r.width - .5) * 12}deg`); });
      on(button, 'focus', () => { if (motion()) { button.style.setProperty('--ty', '-8px'); button.style.setProperty('--rot', '4deg'); } });
      on(button, 'blur', reset); on(button, 'pointerleave', reset); on(document, 'alienx:motion-change', reset); on(media, 'change', reset);
    }
    const balls = Array.from({ length: 7 }, (_, i) => ({ x: 45 + i * 32, y: 45 + i % 3 * 44, vx: 1, vy: 0, r: 13 + i % 3 * 4 }));
    let selected = 0, dragging = false;
    const physics = canvasScene('[data-physics-canvas]', 'Physics. Enter selects the next ball, arrows move it, Space throws it. Reset restores all balls.', (s, advance) => {
      clear(s);
      balls.forEach((ball, i) => {
        if (advance && !(dragging && i === selected)) { ball.vy += .1; ball.x += ball.vx; ball.y += ball.vy; }
        if (ball.x < ball.r || ball.x > s.width - ball.r) ball.vx *= -.86;
        if (ball.y < ball.r || ball.y > s.height - ball.r) ball.vy *= -.86;
        ball.x = Math.max(ball.r, Math.min(s.width - ball.r, ball.x)); ball.y = Math.max(ball.r, Math.min(s.height - ball.r, ball.y));
        s.ctx.lineWidth = i === selected ? 3 : 1; s.ctx.beginPath(); s.ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); s.ctx.stroke();
      });
    }, true);
    if (physics) {
      on(physics.canvas, 'pointerdown', e => { const p = position(physics, e); const hit = balls.findIndex(b => Math.hypot(b.x - p.x, b.y - p.y) < b.r + 10); if (hit >= 0) { selected = hit; dragging = true; physics.canvas.setPointerCapture(e.pointerId); } });
      on(physics.canvas, 'pointermove', e => { if (!dragging) return; const p = position(physics, e), b = balls[selected]; b.vx = Math.max(-10, Math.min(10, p.x - b.x)); b.vy = Math.max(-10, Math.min(10, p.y - b.y)); Object.assign(b, p); physics.draw(false); });
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) on(physics.canvas, event, () => { dragging = false; });
      on(physics.stage, 'keydown', e => { if (e.target !== physics.stage) return; if (e.key === 'Enter') { e.preventDefault(); selected = (selected + 1) % balls.length; } if (e.key === ' ') { e.preventDefault(); balls[selected].vx = 4; balls[selected].vy = -5; } keyboardPoint(physics, balls[selected], e); physics.draw(false); });
      on(document.querySelector('[data-physics-reset]'), 'click', () => { balls.forEach((b, i) => Object.assign(b, { x: 45 + i * 32, y: 45 + i % 3 * 44, vx: 1, vy: 0 })); physics.draw(false); });
    }
    const lightPoint = { x: 120, y: 130 }; let pulse = 0;
    const light = canvasScene('[data-light-canvas]', 'Light field. Arrows move the light; Space sends a pulse.', (s, advance) => {
      clear(s); if (advance) pulse = Math.max(0, pulse - .035);
      s.animate = pulse > 0;
      for (let x = 0; x < s.width; x += 32) for (let y = 0; y < s.height; y += 32) { const d = Math.hypot(x - lightPoint.x, y - lightPoint.y); s.ctx.globalAlpha = Math.max(.1, 1 - d / (160 + pulse * 180)); s.ctx.fillRect(x, y, 4, 4); }
      s.ctx.globalAlpha = 1;
    });
    if (light) {
      const flash = () => { pulse = 1; light.draw(false); schedule(); };
      on(light.stage, 'pointermove', e => { Object.assign(lightPoint, position(light, e)); light.draw(false); }); on(light.stage, 'click', flash);
      on(light.stage, 'keydown', e => { if (keyboardPoint(light, lightPoint, e)) light.draw(false); if (e.key === ' ') { e.preventDefault(); flash(); } });
    }
    const spatial = document.querySelector('[data-spatial-stage]'), space = document.querySelector('[data-space]'), readout = document.querySelector('[data-space-readout]');
    if (spatial && space) {
      spatial.tabIndex = 0; spatial.setAttribute('role', 'group'); spatial.setAttribute('aria-label', 'Spatial interface. Arrow keys rotate the scene; Escape resets.');
      let x = 0, y = 0;
      const render = () => { space.style.transform = `rotateX(${y}deg) rotateY(${x}deg)`; readout.textContent = `X ${x.toFixed(0)}° / Y ${y.toFixed(0)}°`; };
      on(spatial, 'pointermove', e => { if (!motion()) return; const r = spatial.getBoundingClientRect(); x = ((e.clientX - r.left) / r.width - .5) * 24; y = -((e.clientY - r.top) / r.height - .5) * 18; render(); });
      on(spatial, 'keydown', e => { if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape'].includes(e.key)) return; e.preventDefault(); if (e.key === 'Escape') x = y = 0; else { x += e.key === 'ArrowLeft' ? -3 : e.key === 'ArrowRight' ? 3 : 0; y += e.key === 'ArrowUp' ? -3 : e.key === 'ArrowDown' ? 3 : 0; } x = Math.max(-24, Math.min(24, x)); y = Math.max(-18, Math.min(18, y)); render(); });
    }
    let drawing = false, last = null; const cursor = { x: 100, y: 100 };
    const trace = canvasScene('[data-signal-canvas]', 'Signal trace. Drag to draw. Arrow keys draw with the keyboard. Use Clear trace to erase.', () => {});
    if (trace) {
      const drawTo = p => { if (last) { trace.ctx.strokeStyle = color(trace.stage); trace.ctx.lineWidth = Math.min(8, 2 + Math.hypot(p.x-last.x,p.y-last.y) / 10); trace.ctx.lineCap = 'round'; trace.ctx.beginPath(); trace.ctx.moveTo(last.x,last.y); trace.ctx.lineTo(p.x,p.y); trace.ctx.stroke(); } last = { ...p }; };
      on(trace.canvas, 'pointerdown', e => { drawing = true; last = position(trace, e); trace.canvas.setPointerCapture(e.pointerId); });
      on(trace.canvas, 'pointermove', e => { if (drawing) drawTo(position(trace, e)); });
      for (const event of ['pointerup','pointercancel','lostpointercapture']) on(trace.canvas, event, () => { drawing = false; last = null; });
      on(trace.stage, 'keydown', e => { if (!last) last = { ...cursor }; if (keyboardPoint(trace, cursor, e)) drawTo(cursor); });
      on(document.querySelector('[data-signal-clear]'), 'click', () => { trace.ctx.clearRect(0,0,trace.width,trace.height); last = null; drawing = false; });
    }
    const list = document.querySelector('[data-capabilities]');
    if (list) {
      list.replaceChildren();
      const capabilities = [['Canvas 2D', !!document.createElement('canvas').getContext('2d')], ['Web Workers', 'Worker' in window], ['IndexedDB', 'indexedDB' in window], ['Web Audio', 'AudioContext' in window], ['Clipboard API', !!navigator.clipboard], ['Touch Input', navigator.maxTouchPoints > 0]];
      for (const [name, available] of capabilities) { const row = document.createElement('div'), label = document.createElement('span'), value = document.createElement('strong'); row.className = 'capability-row'; label.textContent = name; value.textContent = available ? 'AVAILABLE' : 'UNAVAILABLE'; row.append(label, value); list.appendChild(row); }
    }
    const update = () => { cancelAnimationFrame(frame); frame = 0; for (const scene of scenes) scene.draw(false); schedule(); };
    on(document, 'alienx:motion-change', update); on(document, 'alienx:theme-change', update); on(document, 'visibilitychange', update); on(media, 'change', update);
    dispose = () => { controller.abort(); observer.disconnect(); cancelAnimationFrame(frame); };
    schedule();
  };
  document.addEventListener('astro:before-swap', () => dispose());
  document.addEventListener('astro:page-load', boot);
  boot();
})();
