(() => {
  const boot = () => {
    if (window.location.pathname.replace(/\/$/, '') !== '/experience') return;

    const museum = document.querySelector('#museum');
    if (!(museum instanceof HTMLElement)) return;

    // Exhibit 07 is intentionally removed: it did not provide useful visitor value.
    document.querySelector('#dom-observatory')?.remove();

    const replaceExhibit = (selector) => {
      const current = document.querySelector(selector);
      if (!(current instanceof HTMLElement)) return null;
      const fresh = current.cloneNode(true);
      current.replaceWith(fresh);
      return fresh;
    };

    const generated = replaceExhibit('#generative');
    if (generated) {
      const stage = generated.querySelector('[data-generation-stage]');
      const button = generated.querySelector('[data-generate]');
      if (stage instanceof HTMLElement && button instanceof HTMLButtonElement) {
        let seed = 0;
        const render = () => {
          seed += 1;
          stage.replaceChildren();
          const count = 24;
          for (let i = 0; i < count; i += 1) {
            const block = document.createElement('button');
            block.type = 'button';
            block.className = 'generated-block';
            block.setAttribute('aria-label', `Generated element ${i + 1}`);
            block.style.setProperty('--x', `${8 + ((i * 37 + seed * 11) % 84)}%`);
            block.style.setProperty('--y', `${8 + ((i * 61 + seed * 17) % 76)}%`);
            block.style.setProperty('--s', `${0.45 + ((i * 19 + seed * 7) % 100) / 100}`);
            block.style.setProperty('--r', `${-70 + ((i * 29 + seed * 13) % 140)}deg`);
            block.textContent = i % 4 === 0 ? 'AX' : '';
            block.addEventListener('pointermove', (event) => {
              const rect = block.getBoundingClientRect();
              const x = (event.clientX - rect.left) / rect.width - 0.5;
              const y = (event.clientY - rect.top) / rect.height - 0.5;
              block.style.setProperty('--hover-x', `${x * 16}px`);
              block.style.setProperty('--hover-y', `${y * 16}px`);
            });
            block.addEventListener('pointerleave', () => {
              block.style.removeProperty('--hover-x');
              block.style.removeProperty('--hover-y');
            });
            block.addEventListener('click', () => {
              block.style.setProperty('--s', '1.55');
              block.style.setProperty('--r', '0deg');
            });
            stage.appendChild(block);
          }
        };
        button.addEventListener('click', render);
        render();
      }
    }

    const network = replaceExhibit('#network');
    if (network) {
      const stage = network.querySelector('[data-network-stage]');
      const svg = network.querySelector('[data-network-svg]');
      if (stage instanceof HTMLElement && svg instanceof SVGSVGElement) {
        const ns = 'http://www.w3.org/2000/svg';
        const nodes = Array.from({ length: 16 }, (_, i) => ({
          x: 42 + ((i * 83) % 430),
          y: 40 + ((i * 127) % 280),
          vx: 0,
          vy: 0,
        }));
        const circles = [];
        const lines = [];
        let selected = null;
        let pointer = { x: -1000, y: -1000 };

        svg.replaceChildren();
        for (let i = 0; i < nodes.length; i += 1) {
          for (let j = i + 1; j < nodes.length; j += 1) {
            if (Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) < 145) {
              const line = document.createElementNS(ns, 'line');
              line.setAttribute('class', 'network-line');
              svg.appendChild(line);
              lines.push({ line, a: i, b: j });
            }
          }
        }
        nodes.forEach((node, i) => {
          const circle = document.createElementNS(ns, 'circle');
          circle.setAttribute('class', 'network-node');
          circle.setAttribute('r', i % 4 === 0 ? '6' : '4');
          svg.appendChild(circle);
          circles.push(circle);
        });

        const render = () => {
          nodes.forEach((node, i) => {
            if (selected !== i) {
              node.x += node.vx;
              node.y += node.vy;
              node.vx *= 0.94;
              node.vy *= 0.94;
              node.vx += (pointer.x - node.x) * 0.0009;
              node.vy += (pointer.y - node.y) * 0.0009;
              node.x = Math.max(18, Math.min(502, node.x));
              node.y = Math.max(18, Math.min(342, node.y));
            }
            circles[i].setAttribute('cx', String(node.x));
            circles[i].setAttribute('cy', String(node.y));
          });
          lines.forEach(({ line, a, b }) => {
            const A = nodes[a];
            const B = nodes[b];
            line.setAttribute('x1', String(A.x));
            line.setAttribute('y1', String(A.y));
            line.setAttribute('x2', String(B.x));
            line.setAttribute('y2', String(B.y));
            const hot = Math.min(Math.hypot(A.x - pointer.x, A.y - pointer.y), Math.hypot(B.x - pointer.x, B.y - pointer.y)) < 105;
            line.classList.toggle('network-hot', hot || selected === a || selected === b);
          });
          circles.forEach((circle, i) => {
            const d = Math.hypot(nodes[i].x - pointer.x, nodes[i].y - pointer.y);
            circle.setAttribute('r', selected === i ? '9' : d < 80 ? '7' : i % 4 === 0 ? '6' : '4');
            circle.classList.toggle('network-selected', selected === i);
          });
          requestAnimationFrame(render);
        };

        stage.addEventListener('pointermove', (event) => {
          const rect = stage.getBoundingClientRect();
          pointer = { x: ((event.clientX - rect.left) / rect.width) * 520, y: ((event.clientY - rect.top) / rect.height) * 360 };
          if (selected !== null) {
            nodes[selected].x = pointer.x;
            nodes[selected].y = pointer.y;
          }
        });
        stage.addEventListener('pointerleave', () => { pointer = { x: -1000, y: -1000 }; });
        stage.addEventListener('pointerdown', (event) => {
          const rect = stage.getBoundingClientRect();
          const point = { x: ((event.clientX - rect.left) / rect.width) * 520, y: ((event.clientY - rect.top) / rect.height) * 360 };
          let nearest = null;
          let distance = 30;
          nodes.forEach((node, i) => {
            const d = Math.hypot(node.x - point.x, node.y - point.y);
            if (d < distance) { distance = d; nearest = i; }
          });
          selected = nearest;
          if (selected !== null) stage.setPointerCapture(event.pointerId);
        });
        stage.addEventListener('pointerup', (event) => {
          if (selected !== null) stage.releasePointerCapture(event.pointerId);
          selected = null;
        });
        render();
      }
    }

    const algorithms = replaceExhibit('#algorithms');
    if (algorithms) {
      const bars = algorithms.querySelector('[data-bars]');
      const sort = algorithms.querySelector('[data-sort]');
      const shuffle = algorithms.querySelector('[data-shuffle]');
      const select = algorithms.querySelector('[data-algorithm]');
      const comparisonsReadout = algorithms.querySelector('[data-comparisons]');
      const swapsReadout = algorithms.querySelector('[data-swaps]');
      if (bars instanceof HTMLElement && sort instanceof HTMLButtonElement && shuffle instanceof HTMLButtonElement && select instanceof HTMLSelectElement) {
        let values = Array.from({ length: 24 }, () => Math.round(18 + Math.random() * 82));
        let running = false;
        let comparisons = 0;
        let swaps = 0;

        const draw = (active = []) => {
          bars.replaceChildren();
          values.forEach((value, index) => {
            const bar = document.createElement('i');
            bar.style.height = `${value}%`;
            if (active.includes(index)) bar.classList.add('is-active');
            bars.appendChild(bar);
          });
          if (comparisonsReadout) comparisonsReadout.textContent = `${comparisons} comparisons`;
          if (swapsReadout) swapsReadout.textContent = `${swaps} swaps`;
        };
        const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const compare = async (a, b) => {
          comparisons += 1;
          draw([a, b]);
          await pause(45);
        };
        const run = async () => {
          if (running) return;
          running = true;
          sort.disabled = true;
          shuffle.disabled = true;
          comparisons = 0;
          swaps = 0;
          const algorithm = select.value;
          if (algorithm === 'bubble') {
            for (let end = values.length - 1; end > 0; end -= 1) {
              for (let i = 0; i < end; i += 1) {
                await compare(i, i + 1);
                if (values[i] > values[i + 1]) {
                  [values[i], values[i + 1]] = [values[i + 1], values[i]];
                  swaps += 1;
                }
              }
            }
          } else if (algorithm === 'selection') {
            for (let i = 0; i < values.length - 1; i += 1) {
              let min = i;
              for (let j = i + 1; j < values.length; j += 1) {
                await compare(min, j);
                if (values[j] < values[min]) min = j;
              }
              if (min !== i) {
                [values[i], values[min]] = [values[min], values[i]];
                swaps += 1;
              }
            }
          } else {
            for (let i = 1; i < values.length; i += 1) {
              let j = i;
              while (j > 0) {
                await compare(j - 1, j);
                if (values[j - 1] <= values[j]) break;
                [values[j - 1], values[j]] = [values[j], values[j - 1]];
                swaps += 1;
                j -= 1;
              }
            }
          }
          draw();
          running = false;
          sort.disabled = false;
          shuffle.disabled = false;
        };

        sort.addEventListener('click', run);
        shuffle.addEventListener('click', () => {
          if (running) return;
          values = values.map(() => Math.round(18 + Math.random() * 82));
          comparisons = 0;
          swaps = 0;
          draw();
        });
        draw();
      }
    }
  };

  boot();
  document.addEventListener('astro:page-load', boot);
})();
