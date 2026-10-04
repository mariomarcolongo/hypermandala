(() => {
  'use strict';

  if (window.__hypermandalaTutorialInstalled) return;
  window.__hypermandalaTutorialInstalled = true;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GOLD = '#d8b662';
  const WHITE = 'rgba(244,246,249,.92)';
  const BLUE = '#6ca8ff';

  const modes = [
    { id: 'build', label: 'Build' },
    { id: 'freedom', label: 'Variations' },
    { id: 'slices', label: 'Slices' },
  ];

  const style = document.createElement('style');
  style.id = 'hypermandalaFluidLearn4DStyles';
  style.textContent = `
    .reference-view { display: none !important; }

    .control-panel__actions .learn-4d-launch {
      border: 0;
      padding: 2px 0;
      background: transparent;
      color: rgba(231,211,158,.78);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .08em;
      cursor: pointer;
    }
    .control-panel__actions .learn-4d-launch:hover { color: rgba(250,232,181,.98); }

    .learn4d-stage {
      position: fixed;
      inset: 0;
      z-index: 7;
      width: 100vw;
      height: 100dvh;
      pointer-events: none;
      opacity: 0;
      transition: opacity 180ms ease;
    }
    body.learn4d-active .learn4d-stage { opacity: 1; }

    .learn4d-caption {
      position: fixed;
      top: max(22px, env(safe-area-inset-top));
      left: 50%;
      z-index: 9;
      transform: translateX(-50%);
      max-width: min(620px, calc(100vw - 36px));
      color: rgba(244,246,249,.58);
      font-size: 11px;
      font-weight: 540;
      line-height: 1.35;
      letter-spacing: .012em;
      text-align: center;
      pointer-events: none;
      opacity: 0;
      transition: opacity 160ms ease;
    }
    body.learn4d-active .learn4d-caption { opacity: 1; }

    .learn4d-hud {
      position: fixed;
      left: 50%;
      bottom: max(18px, env(safe-area-inset-bottom));
      z-index: 10;
      transform: translateX(-50%);
      display: grid;
      gap: 6px;
      width: min(680px, calc(100vw - 28px));
      padding: 7px 9px 8px;
      border: 1px solid rgba(255,255,255,.075);
      border-radius: 12px;
      background: rgba(10,12,15,.62);
      backdrop-filter: blur(12px) saturate(110%);
      -webkit-backdrop-filter: blur(12px) saturate(110%);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 160ms ease, visibility 0s linear 160ms;
    }
    body.learn4d-active .learn4d-hud {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transition: opacity 160ms ease, visibility 0s;
    }

    .learn4d-modes {
      display: flex;
      justify-content: center;
      gap: 3px;
    }
    .learn4d-mode,
    .learn4d-icon {
      min-height: 27px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: rgba(238,239,242,.35);
      cursor: pointer;
      font-size: 8px;
      font-weight: 720;
      letter-spacing: .05em;
      text-transform: uppercase;
    }
    .learn4d-mode { padding: 0 10px; }
    .learn4d-mode:hover,
    .learn4d-icon:hover { color: rgba(248,249,250,.84); }
    .learn4d-mode.is-active {
      background: rgba(255,255,255,.065);
      color: rgba(248,249,250,.88);
    }

    .learn4d-timeline-row {
      display: grid;
      grid-template-columns: 32px minmax(0,1fr) 32px;
      align-items: center;
      gap: 7px;
    }
    .learn4d-icon {
      display: grid;
      place-items: center;
      width: 32px;
      min-width: 32px;
      padding: 0;
      font-size: 12px;
      text-transform: none;
    }
    .learn4d-timeline {
      width: 100%;
      height: 24px;
      margin: 0;
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      cursor: ew-resize;
    }
    .learn4d-timeline::-webkit-slider-runnable-track {
      height: 2px;
      border-radius: 99px;
      background: rgba(255,255,255,.20);
    }
    .learn4d-timeline::-moz-range-track {
      height: 2px;
      border-radius: 99px;
      background: rgba(255,255,255,.20);
    }
    .learn4d-timeline::-webkit-slider-thumb {
      width: 13px;
      height: 13px;
      margin-top: -5.5px;
      appearance: none;
      -webkit-appearance: none;
      border: 1px solid rgba(255,255,255,.70);
      border-radius: 50%;
      background: ${GOLD};
    }
    .learn4d-timeline::-moz-range-thumb {
      width: 12px;
      height: 12px;
      border: 1px solid rgba(255,255,255,.70);
      border-radius: 50%;
      background: ${GOLD};
    }

    .learn4d-markers {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      padding: 0 40px;
      color: rgba(225,229,235,.24);
      font-size: 7px;
      font-weight: 700;
      letter-spacing: .065em;
      text-align: center;
      text-transform: uppercase;
    }
    .learn4d-markers span:first-child { text-align: left; }
    .learn4d-markers span:last-child { text-align: right; }

    body.learn4d-active #solidLayer,
    body.learn4d-active #mandala { opacity: .045; transition: opacity 180ms ease; }
    body.learn4d-active .brand,
    body.learn4d-active .dimension-readout,
    body.learn4d-active .control-panel,
    body.learn4d-active .mandala-dock,
    body.learn4d-active .dimension-switcher,
    body.learn4d-active .mobile-panel-switcher,
    body.learn4d-active .basis-gizmo,
    body.learn4d-active .hint,
    body.learn4d-active .source,
    body.learn4d-active .about-panel {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      transition: opacity 140ms ease !important;
    }

    @media (max-width: 680px) {
      .learn4d-caption { top: max(16px, env(safe-area-inset-top)); font-size: 10px; }
      .learn4d-hud {
        bottom: max(8px, env(safe-area-inset-bottom));
        width: calc(100vw - 14px);
        padding: 6px 7px 7px;
      }
      .learn4d-mode { padding: 0 8px; }
      .learn4d-markers { padding: 0 39px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .learn4d-stage,
      .learn4d-caption,
      .learn4d-hud { transition: none !important; }
    }
  `;
  document.head.appendChild(style);

  let launch = document.querySelector('.learn-4d-launch');
  if (!launch) {
    launch = document.createElement('button');
    launch.type = 'button';
    launch.className = 'learn-4d-launch';
    launch.textContent = 'Learn 4D';
    launch.title = 'See how dimensions build on each other';
    document.querySelector('.control-panel__actions')?.prepend(launch);
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'learn4d-stage';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const caption = document.createElement('div');
  caption.className = 'learn4d-caption';
  caption.setAttribute('aria-live', 'polite');
  document.body.appendChild(caption);

  const hud = document.createElement('div');
  hud.className = 'learn4d-hud';
  hud.innerHTML = `
    <div class="learn4d-modes" aria-label="4D lesson view"></div>
    <div class="learn4d-timeline-row">
      <button class="learn4d-icon learn4d-play" type="button" aria-label="Pause animation">Ⅱ</button>
      <input class="learn4d-timeline" type="range" min="0" max="1" step="0.001" value="0" aria-label="Animation timeline" />
      <button class="learn4d-icon learn4d-close" type="button" aria-label="Close Learn 4D">×</button>
    </div>
    <div class="learn4d-markers"><span>0D</span><span>1D</span><span>2D</span><span>3D</span><span>4D</span></div>
  `;
  document.body.appendChild(hud);

  const modesEl = hud.querySelector('.learn4d-modes');
  const timeline = hud.querySelector('.learn4d-timeline');
  const playButton = hud.querySelector('.learn4d-play');
  const closeButton = hud.querySelector('.learn4d-close');
  const markers = hud.querySelector('.learn4d-markers');

  let active = false;
  let playing = !reduceMotion;
  let mode = 'build';
  let progress = 0;
  let direction = 1;
  let lastFrame = performance.now();
  let raf = 0;
  let scrubbing = false;

  const modeDurations = { build: 15, freedom: 11, slices: 11 };

  const cubeEdges = [
    [0,1],[1,2],[2,3],[3,0],
    [4,5],[5,6],[6,7],[7,4],
    [0,4],[1,5],[2,6],[3,7],
  ];

  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function ease(t) {
    const x = clamp(t);
    return x * x * (3 - 2 * x);
  }

  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width, height };
  }

  function line(a, b, color = WHITE, width = 1.5, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
    ctx.restore();
  }

  function dot(p, radius = 3.3, color = WHITE, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p[0], p[1], radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function polygon(points, fill, stroke = null, alpha = 1, width = 1) {
    if (!points.length) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
    ctx.restore();
  }

  function squarePoints(cx, cy, side) {
    const h = side / 2;
    return [[cx-h,cy-h],[cx+h,cy-h],[cx+h,cy+h],[cx-h,cy+h]];
  }

  function extrudedSquare(cx, cy, side, depth) {
    const dx = side * .28 * depth;
    const dy = -side * .22 * depth;
    const front = squarePoints(cx - dx / 2, cy - dy / 2, side);
    const back = front.map(([x,y]) => [x + dx, y + dy]);
    return [...front, ...back];
  }

  function drawCube(points, color = WHITE, alpha = .86, width = 1.5) {
    cubeEdges.forEach(([a,b]) => line(points[a], points[b], color, width, alpha));
  }

  function transformPoints(points, cx, cy, scale, dx, dy) {
    return points.map(([x,y]) => [cx + (x-cx)*scale + dx, cy + (y-cy)*scale + dy]);
  }

  function rotatePoint(p, center, angle) {
    const x = p[0] - center[0];
    const y = p[1] - center[1];
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [center[0] + c*x - s*y, center[1] + s*x + c*y];
  }

  function project3([x,y,z], center, scale) {
    const yaw = -.68;
    const pitch = .48;
    let xx=x, yy=y, zz=z;
    let c=Math.cos(yaw), s=Math.sin(yaw);
    [xx,zz]=[c*xx-s*zz,s*xx+c*zz];
    c=Math.cos(pitch); s=Math.sin(pitch);
    [yy,zz]=[c*yy-s*zz,s*yy+c*zz];
    const f = 4.8 / (4.8 - zz);
    return [center[0] + xx*scale*f, center[1] + yy*scale*f];
  }

  function drawBuild(width, height, t) {
    const stageFloat = clamp(t) * 4;
    const stage = Math.min(3, Math.floor(stageFloat));
    const u = ease(stageFloat - stage);
    const cx = width * .5;
    const cy = height * .44;
    const side = Math.min(width, height) * .30;

    if (stage === 0) {
      const half = side * .5 * u;
      const a = [cx, cy-half];
      const b = [cx, cy+half];
      line(a,b,GOLD,2.35,.92);
      dot(a,3.8,WHITE,.90);
      dot(b,3.8,WHITE,.90);
      caption.textContent = u < .05 ? '0D · point' : '0D → 1D · point → line';
      return;
    }

    if (stage === 1) {
      const halfH = side * .5;
      const halfW = side * .5 * u;
      const left = [[cx-halfW,cy-halfH],[cx-halfW,cy+halfH]];
      const right = [[cx+halfW,cy-halfH],[cx+halfW,cy+halfH]];
      if (u > .002) polygon([left[0],left[1],right[1],right[0]],'rgba(216,182,98,.045)',GOLD,.65,1.05);
      line(left[0],left[1],WHITE,1.65,.58);
      line(right[0],right[1],GOLD,2.1,.92);
      line(left[0],right[0],GOLD,1.35,.58*u);
      line(left[1],right[1],GOLD,1.35,.58*u);
      [...left,...right].forEach((p)=>dot(p,3.2,WHITE,.82));
      caption.textContent = '1D → 2D · line → face';
      return;
    }

    if (stage === 2) {
      const cube = extrudedSquare(cx,cy,side,u);
      const front = cube.slice(0,4);
      const back = cube.slice(4,8);
      polygon(front,'rgba(216,182,98,.018)',WHITE,.56,1.05);
      if (u > .002) polygon(back,'rgba(216,182,98,.038)',GOLD,.78*u+.12,1.25);
      for (let i=0;i<4;i+=1) {
        const j=(i+1)%4;
        if (u > .002) polygon([front[i],front[j],back[j],back[i]],'rgba(108,168,255,.018)',null,.60*u);
        line(front[i],back[i],GOLD,1.65,.70*u);
      }
      front.forEach((p)=>dot(p,2.8,WHITE,.72));
      back.forEach((p)=>dot(p,2.8,GOLD,.40+.48*u));
      caption.textContent = '2D → 3D · point → edge · edge → face · face → volume';
      return;
    }

    const source = extrudedSquare(cx,cy,side,1);
    const targetScale = lerp(1,.58,u);
    const target = transformPoints(source,cx,cy,targetScale,side*.09*u,-side*.065*u);

    drawCube(source,WHITE,.52,1.2);

    const ghostCount = 6;
    for (let g=1;g<=ghostCount;g+=1) {
      const q=(g/(ghostCount+1))*u;
      const ghost=transformPoints(source,cx,cy,lerp(1,.58,q),side*.09*q,-side*.065*q);
      drawCube(ghost,GOLD,.045+.055*q,.75);
    }

    if (u > .002) {
      cubeEdges.forEach(([a,b])=>polygon([source[a],source[b],target[b],target[a]],'rgba(108,168,255,.015)',null,.80*u));
      for (let i=0;i<8;i+=1) line(source[i],target[i],GOLD,1.75,.70*u);
      drawCube(target,GOLD,.18+.74*u,1.45);
      target.forEach((p)=>dot(p,2.7,GOLD,.22+.68*u));
    }
    source.forEach((p)=>dot(p,2.6,WHITE,.60));
    caption.textContent = '3D → 4D · vertex → edge · edge → face · face → cell';
  }

  function freedomParams(t) {
    const phase=t*Math.PI*2;
    return {
      depth:.66+.48*(Math.sin(phase)*.5+.5),
      taper:.36*(Math.sin(phase*.73+1.1)*.5+.5),
      twist:.86*Math.sin(phase*.61),
    };
  }

  function drawFreedom(width,height,t) {
    const {depth,taper,twist}=freedomParams(t);
    const center=[width*.5,height*.44];
    const scale=Math.min(width,height)*.20;
    const rings=12;
    const all=[];
    for (let i=0;i<rings;i+=1) {
      const q=i/(rings-1);
      const z=(q-.5)*2*depth;
      const s=1-taper*q;
      const a=twist*q;
      const c=Math.cos(a), sn=Math.sin(a);
      const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>{
        const xx=(c*x-sn*y)*s;
        const yy=(sn*x+c*y)*s;
        return project3([xx,yy,z],center,scale);
      });
      all.push(corners);
    }
    all.forEach((ring,i)=>polygon(ring,i===0?'rgba(216,182,98,.04)':null,i===0?GOLD:WHITE,i===0?.90:.14,i===0?1.7:.8));
    for (let k=0;k<4;k+=1) for (let i=0;i<rings-1;i+=1) line(all[i][k],all[i+1][k],BLUE,.9,.18);
    caption.textContent = 'Same source · different depth, taper or twist · the higher-dimensional continuation is a choice';
  }

  function drawSlices(width,height,t) {
    const phase=t*Math.PI*2;
    const amp=.16+.33*(Math.sin(phase)*.5+.5);
    const twist=.64*Math.sin(phase*.73);
    const center=[width*.5,height*.44];
    const scale=Math.min(width,height)*.20;
    const rings=13;
    const all=[];
    for (let i=0;i<rings;i+=1) {
      const q=i/(rings-1)*2-1;
      const s=1-amp*Math.abs(q);
      const a=twist*q;
      const c=Math.cos(a), sn=Math.sin(a);
      const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>{
        const xx=(c*x-sn*y)*s;
        const yy=(sn*x+c*y)*s;
        return project3([xx,yy,q*1.18],center,scale);
      });
      all.push(corners);
    }
    const mid=Math.floor(rings/2);
    all.forEach((ring,i)=>polygon(ring,i===mid?'rgba(216,182,98,.055)':null,i===mid?GOLD:WHITE,i===mid?.96:.12,i===mid?2:.75));
    for (let k=0;k<4;k+=1) for (let i=0;i<rings-1;i+=1) line(all[i][k],all[i+1][k],BLUE,.75,.13);
    caption.textContent = 'Same slice · different whole · a square does not tell you what exists beyond that slice';
  }

  function render() {
    if (!active) return;
    const {width,height}=fitCanvas();
    ctx.clearRect(0,0,width,height);
    if (mode==='build') drawBuild(width,height,progress);
    else if (mode==='freedom') drawFreedom(width,height,progress);
    else drawSlices(width,height,progress);
    timeline.value=String(progress);
  }

  function updateMarkers() {
    if (mode==='build') {
      markers.innerHTML='<span>0D</span><span>1D</span><span>2D</span><span>3D</span><span>4D</span>';
    } else if (mode==='freedom') {
      markers.innerHTML='<span>same source</span><span></span><span>continuation varies</span><span></span><span>same rule</span>';
    } else {
      markers.innerHTML='<span>one whole</span><span></span><span>same slice</span><span></span><span>another whole</span>';
    }
  }

  function syncPlayButton() {
    playButton.textContent=playing?'Ⅱ':'▶';
    playButton.setAttribute('aria-label',playing?'Pause animation':'Play animation');
  }

  function setMode(nextMode) {
    mode=nextMode;
    progress=0;
    direction=1;
    playing=!reduceMotion;
    modesEl.querySelectorAll('.learn4d-mode').forEach((button)=>button.classList.toggle('is-active',button.dataset.mode===mode));
    updateMarkers();
    syncPlayButton();
    render();
  }

  modes.forEach(({id,label})=>{
    const button=document.createElement('button');
    button.type='button';
    button.className='learn4d-mode'+(id===mode?' is-active':'');
    button.dataset.mode=id;
    button.textContent=label;
    button.addEventListener('click',()=>setMode(id));
    modesEl.appendChild(button);
  });

  function open() {
    if (active) return;
    active=true;
    document.body.classList.add('learn4d-active');
    progress=0;
    direction=1;
    playing=!reduceMotion;
    lastFrame=performance.now();
    syncPlayButton();
    updateMarkers();
    render();
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(tick);
  }

  function close() {
    if (!active) return;
    active=false;
    document.body.classList.remove('learn4d-active');
    cancelAnimationFrame(raf);
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  function tick(now) {
    if (!active) return;
    const dt=Math.min(.05,Math.max(0,(now-lastFrame)/1000));
    lastFrame=now;
    if (playing && !scrubbing) {
      const duration=modeDurations[mode]||10;
      progress+=direction*dt/duration;
      if (progress>=1) {
        progress=1;
        direction=-1;
      } else if (progress<=0) {
        progress=0;
        direction=1;
      }
    }
    render();
    raf=requestAnimationFrame(tick);
  }

  launch.addEventListener('click',open);
  closeButton.addEventListener('click',close);
  playButton.addEventListener('click',()=>{
    if (!playing) {
      if (progress>=.999) direction=-1;
      else if (progress<=.001) direction=1;
    }
    playing=!playing;
    syncPlayButton();
  });

  timeline.addEventListener('pointerdown',()=>{
    scrubbing=true;
    playing=false;
    syncPlayButton();
  });
  timeline.addEventListener('input',()=>{
    progress=Number(timeline.value);
    render();
  });
  const stopScrub=()=>{scrubbing=false;};
  timeline.addEventListener('pointerup',stopScrub);
  timeline.addEventListener('pointercancel',stopScrub);

  window.addEventListener('resize',render,{passive:true});
  window.addEventListener('keydown',(event)=>{
    if (!active) return;
    if (event.key==='Escape') {
      close();
      return;
    }
    if (event.key===' ') {
      event.preventDefault();
      playing=!playing;
      syncPlayButton();
      return;
    }
    if (event.key==='ArrowLeft'||event.key==='ArrowRight') {
      event.preventDefault();
      playing=false;
      progress=clamp(progress+(event.key==='ArrowRight'?.02:-.02));
      syncPlayButton();
      render();
    }
  });
})();
