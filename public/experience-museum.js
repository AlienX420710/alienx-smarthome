(() => {
  const boot = () => {
    if (window.location.pathname.replace(/\/$/, '') !== '/experience') return;

    const museum = document.querySelector('#museum');
    if (!(museum instanceof HTMLElement)) return;

    document.querySelector('#generative')?.remove();
    document.querySelector('#network')?.remove();
    document.querySelector('#algorithms')?.remove();
    document.querySelector('#dom-observatory')?.remove();

    const title = document.querySelector('#museum-title');
    if (title) title.innerHTML = 'Seven ways to make a browser <span>do something.</span>';

    const browserLab = document.querySelector('#browser-lab');
    browserLab?.querySelector('.exhibit-meta span:first-child')?.replaceChildren(document.createTextNode('04'));

    if (document.querySelector('#alienx-new-exhibits')) return;

    const shell = document.createElement('div');
    shell.id = 'alienx-new-exhibits';
    shell.innerHTML = `
      <div class="exhibit-pair alienx-exhibit-pair">
        <article class="exhibit alienx-exhibit" id="light-field">
          <div class="exhibit-meta"><span>05</span><span>CANVAS / LIGHT / GEOMETRY</span></div>
          <p class="eyebrow">LIGHT FIELD</p>
          <h3>Move the light. Reveal the system.</h3>
          <p>A canvas scene hides its structure until your pointer becomes a moving light source. Click to send a pulse through the field.</p>
          <div class="alienx-light-stage" data-light-stage><canvas data-light-canvas></canvas><span class="alienx-light-readout">LIGHT / LIVE</span></div>
        </article>

        <article class="exhibit alienx-exhibit" id="spatial-ui">
          <div class="exhibit-meta"><span>06</span><span>CSS 3D / POINTER / DEPTH</span></div>
          <p class="eyebrow">SPATIAL UI</p>
          <h3>The interface has depth.</h3>
          <p>Move around the scene and change its perspective. The browser is rendering a layered interface in three dimensions.</p>
          <div class="alienx-spatial-stage" data-spatial-stage>
            <div class="alienx-space" data-space>
              <div class="alienx-space-plane alienx-space-plane--back">SYSTEM / 03</div>
              <div class="alienx-space-plane alienx-space-plane--mid">SIGNAL / 02</div>
              <div class="alienx-space-plane alienx-space-plane--front"><strong>ALIENX</strong><span>DEPTH / 01</span></div>
              <i class="alienx-space-axis alienx-space-axis--x"></i><i class="alienx-space-axis alienx-space-axis--y"></i>
            </div>
            <span class="alienx-space-readout" data-space-readout>X +00° / Y +00°</span>
          </div>
        </article>
      </div>

      <article class="exhibit exhibit--wide alienx-exhibit alienx-signal-exhibit" id="signal-trace">
        <div class="exhibit-meta"><span>07</span><span>POINTER / CANVAS / GESTURE</span></div>
        <div class="exhibit-split">
          <div class="exhibit-copy">
            <p class="eyebrow">SIGNAL TRACE</p>
            <h3>Your movement becomes data.</h3>
            <p>Draw across the field. Pointer velocity changes the trace, while intersections leave temporary energy behind.</p>
            <button type="button" class="exhibit-button" data-signal-clear>Clear trace <span>×</span></button>
          </div>
          <div class="alienx-signal-stage" data-signal-stage><canvas data-signal-canvas></canvas><span>PRESS / DRAG</span></div>
        </div>
      </article>
    </div>`;
    museum.appendChild(shell);

    const style = document.createElement('style');
    style.dataset.alienxMuseum = 'new-exhibits';
    style.textContent = `
      #alienx-new-exhibits { display:grid; gap:1.5rem; margin-top:1.5rem; }
      .alienx-exhibit { overflow:hidden; }
      .alienx-light-stage,.alienx-spatial-stage,.alienx-signal-stage { position:relative; min-height:280px; margin-top:1.5rem; overflow:hidden; border:1px solid rgba(110,150,210,.28); border-radius:18px; background:radial-gradient(circle at 50% 50%,rgba(30,55,95,.28),rgba(4,7,13,.96) 70%); touch-action:none; overscroll-behavior:contain; }
      .alienx-light-stage canvas,.alienx-signal-stage canvas { display:block; width:100%; height:280px; touch-action:none; }
      .alienx-light-readout,.alienx-space-readout,.alienx-signal-stage > span { position:absolute; left:1rem; bottom:1rem; font:600 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.16em; color:rgba(180,205,235,.72); pointer-events:none; }
      .alienx-spatial-stage { perspective:900px; display:grid; place-items:center; background:radial-gradient(circle at 50% 50%,rgba(44,73,122,.24),rgba(3,6,12,.98) 72%); }
      .alienx-space { width:min(78%,420px); height:210px; position:relative; transform-style:preserve-3d; transition:transform 90ms linear; }
      .alienx-space-plane { position:absolute; inset:20% 10%; display:flex; align-items:center; justify-content:center; flex-direction:column; border:1px solid rgba(90,135,205,.45); border-radius:14px; background:rgba(7,14,26,.8); color:rgba(155,190,235,.72); font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.16em; box-shadow:0 0 30px rgba(40,90,160,.12); backface-visibility:hidden; }
      .alienx-space-plane--back { transform:translateZ(-70px) scale(.88); opacity:.36; }
      .alienx-space-plane--mid { transform:translateZ(0); opacity:.6; }
      .alienx-space-plane--front { transform:translateZ(75px); color:rgba(57,255,90,.8); border-color:rgba(57,255,90,.5); box-shadow:0 0 35px rgba(57,255,90,.12); }
      .alienx-space-plane--front strong { font:800 clamp(25px,5vw,42px)/1 system-ui,sans-serif; letter-spacing:.08em; color:white; }
      .alienx-space-plane--front span { margin-top:.55rem; color:rgba(57,255,90,.7); }
      .alienx-space-axis { position:absolute; display:block; transform-style:preserve-3d; opacity:.25; }
      .alienx-space-axis--x { left:0; right:0; top:50%; border-top:1px solid rgba(90,160,255,.7); transform:translateZ(-90px); }
      .alienx-space-axis--y { top:0; bottom:0; left:50%; border-left:1px solid rgba(90,160,255,.7); transform:translateZ(-90px); }
      .alienx-signal-exhibit .exhibit-split { align-items:stretch; }
      .alienx-signal-stage { margin-top:0; min-height:330px; }
      .alienx-signal-stage canvas { height:330px; }
      .alienx-signal-stage.is-active { border-color:rgba(57,255,90,.5); box-shadow:0 0 35px rgba(57,255,90,.08) inset; }
      #pointer-field .pointer-lab,#pointer-field .pointer-lab canvas,#physics .physics-stage,#physics .physics-stage canvas,#kinetic-type .type-stage,#kinetic-type [data-kinetic] { touch-action:none; overscroll-behavior:contain; }
      @media (max-width:800px) { .alienx-exhibit-pair { display:grid; } .alienx-signal-stage,.alienx-signal-stage canvas { min-height:260px; height:260px; } }
      @media (prefers-reduced-motion:reduce) { .alienx-space { transition:none; } }
    `;
    document.head.appendChild(style);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lightStage = shell.querySelector('[data-light-stage]');
    const lightCanvas = shell.querySelector('[data-light-canvas]');
    if (lightStage instanceof HTMLElement && lightCanvas instanceof HTMLCanvasElement) {
      const ctx = lightCanvas.getContext('2d');
      let pointer = { x: lightStage.clientWidth / 2, y: lightStage.clientHeight / 2 };
      let pulse = 0;
      const resize = () => { const dpr = Math.min(window.devicePixelRatio || 1, 2); lightCanvas.width = lightStage.clientWidth * dpr; lightCanvas.height = lightStage.clientHeight * dpr; ctx?.setTransform(dpr,0,0,dpr,0,0); };
      const draw = () => {
        if (!ctx) return;
        const w = lightStage.clientWidth, h = lightStage.clientHeight;
        ctx.clearRect(0,0,w,h);
        ctx.strokeStyle='rgba(90,140,205,.13)'; ctx.lineWidth=1;
        for(let x=0;x<w;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
        for(let y=0;y<h;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
        for(let i=0;i<7;i++){
          const yy=h*.2+i*h*.1, skew=(pointer.x-w/2)*(i-3)*.035;
          ctx.strokeStyle=`rgba(90,145,220,${.08+i*.012})`; ctx.beginPath(); ctx.moveTo(w*.08,yy); ctx.lineTo(w*.92,yy+skew); ctx.stroke();
        }
        const radius=145+Math.sin(pulse)*18;
        const glow=ctx.createRadialGradient(pointer.x,pointer.y,0,pointer.x,pointer.y,radius);
        glow.addColorStop(0,'rgba(57,255,90,.32)'); glow.addColorStop(.35,'rgba(57,255,90,.09)'); glow.addColorStop(1,'rgba(57,255,90,0)');
        ctx.fillStyle=glow; ctx.fillRect(0,0,w,h);
        ctx.strokeStyle='rgba(57,255,90,.7)'; ctx.beginPath(); ctx.arc(pointer.x,pointer.y,5+Math.sin(pulse)*1.5,0,Math.PI*2); ctx.stroke();
        if(!reducedMotion){pulse+=.035;requestAnimationFrame(draw);}
      };
      resize(); window.addEventListener('resize',resize);
      lightStage.addEventListener('pointermove',e=>{const r=lightStage.getBoundingClientRect();pointer={x:e.clientX-r.left,y:e.clientY-r.top};if(reducedMotion)draw();});
      lightStage.addEventListener('pointerleave',()=>{pointer={x:lightStage.clientWidth/2,y:lightStage.clientHeight/2};if(reducedMotion)draw();});
      lightStage.addEventListener('click',()=>{pulse=0; for(let i=0;i<3;i++) setTimeout(()=>pulse+=2, i*90);}); draw();
    }

    const spatialStage = shell.querySelector('[data-spatial-stage]');
    const space = shell.querySelector('[data-space]');
    const spaceReadout = shell.querySelector('[data-space-readout]');
    if (spatialStage instanceof HTMLElement && space instanceof HTMLElement) {
      const move = (e) => { if(reducedMotion)return; const r=spatialStage.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5; const rx=-y*18, ry=x*24; space.style.transform=`rotateX(${rx}deg) rotateY(${ry}deg)`; if(spaceReadout)spaceReadout.textContent=`X ${ry>=0?'+':''}${ry.toFixed(0)}° / Y ${rx>=0?'+':''}${rx.toFixed(0)}°`; };
      spatialStage.addEventListener('pointermove',move); spatialStage.addEventListener('pointerleave',()=>{space.style.transform='rotateX(0deg) rotateY(0deg)';if(spaceReadout)spaceReadout.textContent='X +00° / Y +00°';});
    }

    const signalStage = shell.querySelector('[data-signal-stage]');
    const signalCanvas = shell.querySelector('[data-signal-canvas]');
    const clearButton = shell.querySelector('[data-signal-clear]');
    if (signalStage instanceof HTMLElement && signalCanvas instanceof HTMLCanvasElement) {
      const ctx=signalCanvas.getContext('2d'); let drawing=false,last=null,points=[];
      const resize=()=>{const dpr=Math.min(window.devicePixelRatio||1,2);signalCanvas.width=signalStage.clientWidth*dpr;signalCanvas.height=signalStage.clientHeight*dpr;ctx?.setTransform(dpr,0,0,dpr,0,0);};
      const clear=()=>{points=[];last=null;if(ctx)ctx.clearRect(0,0,signalStage.clientWidth,signalStage.clientHeight);signalStage.classList.remove('is-active');};
      const start=e=>{drawing=true;signalStage.classList.add('is-active');const r=signalStage.getBoundingClientRect();last={x:e.clientX-r.left,y:e.clientY-r.top,t:performance.now()};points.push(last);signalCanvas.setPointerCapture?.(e.pointerId);};
      const move=e=>{if(!drawing||!ctx||!last)return;const r=signalStage.getBoundingClientRect(),p={x:e.clientX-r.left,y:e.clientY-r.top,t:performance.now()},dt=Math.max(1,p.t-last.t),speed=Math.hypot(p.x-last.x,p.y-last.y)/dt,width=Math.min(8,1.5+speed*1.8);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.lineWidth=width;ctx.lineCap='round';ctx.strokeStyle=`rgba(57,255,90,${Math.min(.9,.28+speed*1.8)})`;ctx.shadowBlur=width*3;ctx.shadowColor='rgba(57,255,90,.7)';ctx.stroke();ctx.shadowBlur=0;if(speed>.25){ctx.beginPath();ctx.arc(p.x,p.y,2+speed*5,0,Math.PI*2);ctx.fillStyle=`rgba(130,190,255,${Math.min(.6,speed)})`;ctx.fill();}last=p;points.push(p);if(points.length>900)points.shift();};
      const end=()=>{drawing=false;last=null;signalStage.classList.remove('is-active');};
      resize();window.addEventListener('resize',resize);signalStage.addEventListener('pointerdown',start);signalStage.addEventListener('pointermove',move);signalStage.addEventListener('pointerup',end);signalStage.addEventListener('pointercancel',end);signalStage.addEventListener('pointerleave',()=>{if(drawing)end();});clearButton?.addEventListener('click',clear);
    }
  };

  boot();
  document.addEventListener('astro:page-load', boot);
})();
