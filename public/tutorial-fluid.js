(() => {
  'use strict';

  if (window.__hypermandalaTutorialInstalled) return;
  window.__hypermandalaTutorialInstalled = true;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GOLD = '#d8b662';
  const WHITE = 'rgba(244,246,249,.92)';
  const FAINT = 'rgba(244,246,249,.18)';
  const BLUE = '#6ca8ff';
  const GREEN = '#62d48b';
  const PINK = '#df7ab0';

  const modes = [
    { id: 'build', label: 'Build' },
    { id: 'elements', label: 'Elements' },
    { id: 'continuum', label: 'Continuum' },
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
      top: max(20px, env(safe-area-inset-top));
      left: 50%;
      z-index: 9;
      transform: translateX(-50%);
      max-width: min(760px, calc(100vw - 36px));
      color: rgba(244,246,249,.60);
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
      bottom: max(16px, env(safe-area-inset-bottom));
      z-index: 10;
      transform: translateX(-50%);
      display: grid;
      gap: 5px;
      width: min(760px, calc(100vw - 28px));
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

    .learn4d-modes,
    .learn4d-focus {
      display: flex;
      justify-content: center;
      gap: 3px;
      flex-wrap: wrap;
    }
    .learn4d-focus[hidden] { display: none; }
    .learn4d-focus { padding-top: 1px; }

    .learn4d-mode,
    .learn4d-focus-button,
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
    .learn4d-mode,
    .learn4d-focus-button { padding: 0 9px; }
    .learn4d-mode:hover,
    .learn4d-focus-button:hover,
    .learn4d-icon:hover { color: rgba(248,249,250,.84); }
    .learn4d-mode.is-active,
    .learn4d-focus-button.is-active {
      background: rgba(255,255,255,.065);
      color: rgba(248,249,250,.90);
    }
    .learn4d-focus-button.is-active { color: rgba(238,208,130,.96); }

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
      .learn4d-caption { top: max(15px, env(safe-area-inset-top)); font-size: 10px; }
      .learn4d-hud {
        bottom: max(7px, env(safe-area-inset-bottom));
        width: calc(100vw - 12px);
        padding: 6px 7px 7px;
      }
      .learn4d-mode,
      .learn4d-focus-button { padding: 0 7px; }
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
    <div class="learn4d-focus" aria-label="Element focus" hidden></div>
    <div class="learn4d-timeline-row">
      <button class="learn4d-icon learn4d-play" type="button" aria-label="Pause animation">Ⅱ</button>
      <input class="learn4d-timeline" type="range" min="0" max="1" step="0.001" value="0" aria-label="Animation timeline" />
      <button class="learn4d-icon learn4d-close" type="button" aria-label="Close Learn 4D">×</button>
    </div>
    <div class="learn4d-markers"><span>0D</span><span>1D</span><span>2D</span><span>3D</span><span>4D</span></div>
  `;
  document.body.appendChild(hud);

  const modesEl = hud.querySelector('.learn4d-modes');
  const focusEl = hud.querySelector('.learn4d-focus');
  const timeline = hud.querySelector('.learn4d-timeline');
  const playButton = hud.querySelector('.learn4d-play');
  const closeButton = hud.querySelector('.learn4d-close');
  const markers = hud.querySelector('.learn4d-markers');

  let active = false;
  let playing = !reduceMotion;
  let mode = 'build';
  let focus = 'all';
  let progress = 0;
  let direction = 1;
  let lastFrame = performance.now();
  let raf = 0;
  let scrubbing = false;

  const modeDurations = {
    build: 16,
    elements: 18,
    continuum: 16,
    freedom: 11,
    slices: 11,
  };

  const axisColors = [WHITE, GOLD, BLUE, GREEN];

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

  function dot(p, radius = 3.2, color = WHITE, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p[0], p[1], radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function polygon(points, fill = null, stroke = null, alpha = 1, width = 1) {
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

  function basis(width, height) {
    const scale = Math.min(width, height) * .285;
    return {
      center: [width * .5, height * .445],
      vectors: [
        [scale, 0],
        [0, scale],
        [scale * .34, -scale * .28],
        [-scale * .27, -scale * .22],
      ],
    };
  }

  function projectCoord(coord, width, height) {
    const { center, vectors } = basis(width, height);
    let x = center[0];
    let y = center[1];
    for (let i = 0; i < 4; i += 1) {
      x += (coord[i] - .5) * vectors[i][0];
      y += (coord[i] - .5) * vectors[i][1];
    }
    return [x, y];
  }

  function extentsForDimension(d) {
    return [0, 1, 2, 3].map((i) => ease(clamp(d - i)));
  }

  function hyperVertices(extents) {
    const varying = extents.map((e) => e > .0001);
    const axes = varying.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
    const count = 1 << axes.length;
    const vertices = [];
    for (let mask = 0; mask < count; mask += 1) {
      const coord = [.5, .5, .5, .5];
      const bits = [0, 0, 0, 0];
      axes.forEach((axis, k) => {
        const bit = (mask >> k) & 1;
        bits[axis] = bit;
        coord[axis] = .5 + (bit ? .5 : -.5) * extents[axis];
      });
      vertices.push({ coord, bits });
    }
    if (!vertices.length) vertices.push({ coord: [.5,.5,.5,.5], bits: [0,0,0,0] });
    return { vertices, axes };
  }

  function vertexKey(bits, axes) {
    return axes.map((axis) => bits[axis]).join('');
  }

  function drawHyperWire(width, height, extents, options = {}) {
    const { vertices, axes } = hyperVertices(extents);
    const projected = new Map();
    vertices.forEach((v) => projected.set(vertexKey(v.bits, axes), projectCoord(v.coord, width, height)));

    axes.forEach((axis) => {
      vertices.forEach((v) => {
        if (v.bits[axis]) return;
        const nextBits = [...v.bits];
        nextBits[axis] = 1;
        const aKey = vertexKey(v.bits, axes);
        const bKey = vertexKey(nextBits, axes);
        const a = projected.get(aKey);
        const b = projected.get(bKey);
        if (!a || !b) return;
        const isNewest = axis === options.newAxis;
        const color = isNewest ? GOLD : (options.colorByAxis ? axisColors[axis] : WHITE);
        line(a, b, color, isNewest ? 2.2 : 1.35, isNewest ? .92 : .58);
      });
    });

    if (options.points) projected.forEach((p) => dot(p, 2.8, WHITE, .75));
    return { vertices, axes, projected };
  }

  function captionForBuild(stage, u) {
    if (stage === 0) return u < .06 ? '0D · one point' : '0D → 1D · the point traces a line';
    if (stage === 1) return '1D → 2D · every point traces a line · the whole line sweeps a square';
    if (stage === 2) return '2D → 3D · points → edges · lines → faces · the square → cube';
    return '3D → 4D · vertices → edges · edges → faces · faces → cubic cells · cube → tesseract';
  }

  function drawBuild(width, height, t) {
    const d = clamp(t) * 4;
    const stage = Math.min(3, Math.floor(d));
    const u = d >= 4 ? 1 : ease(d - stage);
    const extents = extentsForDimension(d);
    drawHyperWire(width, height, extents, { newAxis: stage, points: true });
    caption.textContent = captionForBuild(stage, u);
  }

  function sourceCoordinates(stage) {
    const count = 1 << stage;
    const out = [];
    for (let mask = 0; mask < count; mask += 1) {
      const coord = [.5,.5,.5,.5];
      for (let axis = 0; axis < stage; axis += 1) coord[axis] = (mask >> axis) & 1;
      out.push(coord);
    }
    return out;
  }

  function edgePairs(stage) {
    const pairs = [];
    const coords = sourceCoordinates(stage);
    for (let i = 0; i < coords.length; i += 1) {
      for (let axis = 0; axis < stage; axis += 1) {
        if (coords[i][axis] !== 0) continue;
        const target = [...coords[i]];
        target[axis] = 1;
        const j = coords.findIndex((c) => c.every((v,k) => v === target[k]));
        if (j >= 0) pairs.push([i,j]);
      }
    }
    return { coords, pairs };
  }

  function facesForStage(stage) {
    if (stage < 2) return [];
    const faces = [];
    for (let a = 0; a < stage; a += 1) {
      for (let b = a + 1; b < stage; b += 1) {
        const other = [];
        for (let k = 0; k < stage; k += 1) if (k !== a && k !== b) other.push(k);
        const fixedCount = 1 << other.length;
        for (let mask = 0; mask < fixedCount; mask += 1) {
          const base = [.5,.5,.5,.5];
          other.forEach((axis, idx) => { base[axis] = (mask >> idx) & 1; });
          const coords = [];
          [[0,0],[1,0],[1,1],[0,1]].forEach(([va,vb]) => {
            const c = [...base];
            c[a] = va; c[b] = vb;
            coords.push(c);
          });
          faces.push(coords);
        }
      }
    }
    return faces;
  }

  function normalizedCoord(coord, stage, newAxisValue = 0) {
    const out = [.5,.5,.5,.5];
    for (let i = 0; i < stage; i += 1) out[i] = coord[i];
    if (stage < 4) out[stage] = newAxisValue;
    return out;
  }

  function drawPointPromotion(width, height, stage, u) {
    const coords = sourceCoordinates(stage);
    coords.forEach((coord) => {
      const a = projectCoord(normalizedCoord(coord, stage, 0), width, height);
      const b = projectCoord(normalizedCoord(coord, stage, u), width, height);
      line(a,b,GOLD,2.4,.88);
      dot(a,3.2,WHITE,.70);
      dot(b,3.4,GOLD,.95);
    });
  }

  function drawLinePromotion(width, height, stage, u) {
    const { coords, pairs } = edgePairs(stage);
    pairs.forEach(([i,j]) => {
      const a0 = projectCoord(normalizedCoord(coords[i],stage,0),width,height);
      const b0 = projectCoord(normalizedCoord(coords[j],stage,0),width,height);
      const a1 = projectCoord(normalizedCoord(coords[i],stage,u),width,height);
      const b1 = projectCoord(normalizedCoord(coords[j],stage,u),width,height);
      polygon([a0,b0,b1,a1],'rgba(108,168,255,.055)',BLUE,.44,1.1);
      line(a0,b0,WHITE,1.5,.52);
      line(a1,b1,BLUE,1.8,.85);
    });
  }

  function drawFacePromotion(width, height, stage, u) {
    const faces = facesForStage(stage);
    faces.forEach((face) => {
      const src = face.map((c) => projectCoord(normalizedCoord(c,stage,0),width,height));
      const dst = face.map((c) => projectCoord(normalizedCoord(c,stage,u),width,height));
      polygon(src,'rgba(98,212,139,.018)',GREEN,.30,1);
      polygon(dst,'rgba(98,212,139,.028)',GREEN,.72,1.3);
      for (let i = 0; i < 4; i += 1) line(src[i],dst[i],GREEN,1.4,.48);
    });
  }

  function drawCellPromotion(width, height, stage, u) {
    if (stage < 3) return;
    drawHyperWire(width,height,[1,1,1,0],{points:false});
    drawHyperWire(width,height,[1,1,1,u],{newAxis:3,points:false});
    const coords = sourceCoordinates(3);
    coords.forEach((coord) => {
      const a = projectCoord(normalizedCoord(coord,3,0),width,height);
      const b = projectCoord(normalizedCoord(coord,3,u),width,height);
      line(a,b,PINK,2,.56);
    });
  }

  function drawElements(width, height, t) {
    const d = clamp(t) * 4;
    const stage = Math.min(3, Math.floor(d));
    const u = d >= 4 ? 1 : ease(d - stage);
    const extents = extentsForDimension(d);
    drawHyperWire(width,height,extents,{newAxis:stage,points:false});

    const available = { points: true, lines: stage >= 1, faces: stage >= 2, cells: stage >= 3 };
    const selected = focus === 'all' ? ['points','lines','faces','cells'] : [focus];
    selected.forEach((kind) => {
      if (!available[kind]) return;
      if (kind === 'points') drawPointPromotion(width,height,stage,u);
      else if (kind === 'lines') drawLinePromotion(width,height,stage,u);
      else if (kind === 'faces') drawFacePromotion(width,height,stage,u);
      else drawCellPromotion(width,height,stage,u);
    });

    const names = {
      all: 'all levels at once',
      points: 'each point traces a new edge',
      lines: 'each source line sweeps a face',
      faces: 'each source face sweeps a 3D cell',
      cells: 'the cube sweeps the 4D body',
    };
    const unavailable = focus !== 'all' && !available[focus];
    caption.textContent = unavailable
      ? `${names[focus]} · becomes available at the next relevant dimension`
      : `${stage}D → ${stage + 1}D · ${names[focus]}`;
  }

  function drawContinuumLine(width,height,alpha) {
    const { center, vectors } = basis(width,height);
    const a = [center[0]-vectors[0][0]/2,center[1]-vectors[0][1]/2];
    const b = [center[0]+vectors[0][0]/2,center[1]+vectors[0][1]/2];
    line(a,b,WHITE,2,.70*alpha);
    const samples = 31;
    for(let i=0;i<samples;i+=1){
      const u=i/(samples-1);
      const p=[lerp(a[0],b[0],u),lerp(a[1],b[1],u)];
      dot(p, i%5===0?2.5:1.4, i===Math.floor(samples/2)?GOLD:WHITE, (i%5===0?.72:.32)*alpha);
    }
  }

  function drawContinuumSquare(width,height,alpha) {
    const samples = 21;
    for(let i=0;i<samples;i+=1){
      const y=i/(samples-1);
      const a=projectCoord([0,y,.5,.5],width,height);
      const b=projectCoord([1,y,.5,.5],width,height);
      const mid=Math.floor(samples/2);
      line(a,b,i===mid?GOLD:WHITE,i===mid?2:1,(i===mid?.88:.18)*alpha);
    }
    const corners=[[0,0],[1,0],[1,1],[0,1]].map(([x,y])=>projectCoord([x,y,.5,.5],width,height));
    polygon(corners,null,WHITE,.55*alpha,1.3);
  }

  function drawContinuumCube(width,height,alpha) {
    const samples=13;
    for(let i=0;i<samples;i+=1){
      const z=i/(samples-1);
      const corners=[[0,0],[1,0],[1,1],[0,1]].map(([x,y])=>projectCoord([x,y,z,.5],width,height));
      const mid=Math.floor(samples/2);
      polygon(corners,i===mid?'rgba(216,182,98,.025)':null,i===mid?GOLD:WHITE,(i===mid?.90:.13)*alpha,i===mid?1.8:.8);
    }
    drawHyperWire(width,height,[1,1,1,0],{points:false});
  }

  function drawContinuumTesseract(width,height,alpha) {
    const samples=11;
    for(let i=0;i<samples;i+=1){
      const w=i/(samples-1);
      const ext=[1,1,1,0];
      const { vertices, axes }=hyperVertices(ext);
      const p=new Map();
      vertices.forEach((v)=>{
        const c=[...v.coord]; c[3]=w;
        p.set(vertexKey(v.bits,axes),projectCoord(c,width,height));
      });
      const mid=Math.floor(samples/2);
      axes.forEach((axis)=>{
        vertices.forEach((v)=>{
          if(v.bits[axis])return;
          const bits=[...v.bits]; bits[axis]=1;
          const a=p.get(vertexKey(v.bits,axes));
          const b=p.get(vertexKey(bits,axes));
          line(a,b,i===mid?GOLD:WHITE,i===mid?1.8:.7,(i===mid?.88:.10)*alpha);
        });
      });
    }
    drawHyperWire(width,height,[1,1,1,1],{newAxis:3,points:false});
  }

  function drawContinuum(width,height,t){
    const x=clamp(t)*4;
    const stage=Math.min(3,Math.floor(x));
    const local=x>=4?1:x-stage;
    const alpha=(local<.15)?ease(local/.15):(local>.85?1-ease((local-.85)/.15):1);
    const a=Math.max(.22,alpha);
    if(stage===0){
      drawContinuumLine(width,height,a);
      caption.textContent='1D line = a continuum of points · dots are samples; infinitely many lie between them';
    } else if(stage===1){
      drawContinuumSquare(width,height,a);
      caption.textContent='2D square = a continuum of parallel line slices · only a few are drawn';
    } else if(stage===2){
      drawContinuumCube(width,height,a);
      caption.textContent='3D cube = a continuum of square slices · infinitely many squares fill the depth';
    } else {
      drawContinuumTesseract(width,height,a);
      caption.textContent='4D tesseract = a continuum of cubic slices along W · the drawn cubes are samples';
    }
  }

  function freedomParams(t) {
    const phase = t * Math.PI * 2;
    return {
      depth: .58 + .52 * (Math.sin(phase) * .5 + .5),
      taper: .42 * (Math.sin(phase * .73 + 1.2) * .5 + .5),
      twist: .92 * Math.sin(phase * .61),
    };
  }

  function project3([x,y,z], center, scale) {
    const yaw=-.68, pitch=.48;
    let xx=x,yy=y,zz=z;
    let c=Math.cos(yaw),s=Math.sin(yaw);
    [xx,zz]=[c*xx-s*zz,s*xx+c*zz];
    c=Math.cos(pitch);s=Math.sin(pitch);
    [yy,zz]=[c*yy-s*zz,s*yy+c*zz];
    const f=4.8/(4.8-zz);
    return [center[0]+xx*scale*f,center[1]+yy*scale*f];
  }

  function drawFreedom(width,height,t){
    const {depth,taper,twist}=freedomParams(t);
    const center=[width*.5,height*.445];
    const scale=Math.min(width,height)*.21;
    const rings=13;
    const all=[];
    for(let i=0;i<rings;i+=1){
      const u=i/(rings-1);
      const z=(u-.5)*2*depth;
      const s=1-taper*u;
      const angle=twist*u;
      const c=Math.cos(angle),sn=Math.sin(angle);
      all.push([[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>{
        const xx=(c*x-sn*y)*s;
        const yy=(sn*x+c*y)*s;
        return project3([xx,yy,z],center,scale);
      }));
    }
    all.forEach((ring,i)=>polygon(ring,i===0?'rgba(216,182,98,.035)':null,i===0?GOLD:WHITE,i===0?.88:.14,i===0?1.8:.8));
    for(let k=0;k<4;k+=1)for(let i=0;i<rings-1;i+=1)line(all[i][k],all[i+1][k],BLUE,.9,.16);
    caption.textContent='The higher-dimensional continuation is a choice · length, scale and twist can all vary';
  }

  function drawSlices(width,height,t){
    const phase=t*Math.PI*2;
    const amp=.16+.34*(Math.sin(phase)*.5+.5);
    const twist=.72*Math.sin(phase*.71);
    const center=[width*.5,height*.445];
    const scale=Math.min(width,height)*.21;
    const rings=15;
    const all=[];
    for(let i=0;i<rings;i+=1){
      const u=i/(rings-1)*2-1;
      const s=1-amp*Math.abs(u);
      const angle=twist*u;
      const c=Math.cos(angle),sn=Math.sin(angle);
      all.push([[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>{
        const xx=(c*x-sn*y)*s;
        const yy=(sn*x+c*y)*s;
        return project3([xx,yy,u*1.18],center,scale);
      }));
    }
    const middle=Math.floor(rings/2);
    all.forEach((ring,i)=>polygon(ring,i===middle?'rgba(216,182,98,.055)':null,i===middle?GOLD:WHITE,i===middle?.96:.11,i===middle?2.1:.75));
    for(let k=0;k<4;k+=1)for(let i=0;i<rings-1;i+=1)line(all[i][k],all[i+1][k],BLUE,.75,.12);
    caption.textContent='The highlighted square stays identical while the 3D object around it changes';
  }

  function render(){
    if(!active)return;
    const {width,height}=fitCanvas();
    ctx.clearRect(0,0,width,height);
    if(mode==='build')drawBuild(width,height,progress);
    else if(mode==='elements')drawElements(width,height,progress);
    else if(mode==='continuum')drawContinuum(width,height,progress);
    else if(mode==='freedom')drawFreedom(width,height,progress);
    else drawSlices(width,height,progress);
    timeline.value=String(progress);
  }

  function updateMarkers(){
    if(mode==='build'||mode==='elements'){
      markers.innerHTML='<span>0D</span><span>1D</span><span>2D</span><span>3D</span><span>4D</span>';
    } else if(mode==='continuum'){
      markers.innerHTML='<span>points</span><span>lines</span><span>squares</span><span>cubes</span><span>4D</span>';
    } else if(mode==='freedom'){
      markers.innerHTML='<span>same source</span><span></span><span>many continuations</span><span></span><span>same rule</span>';
    } else {
      markers.innerHTML='<span>different whole</span><span></span><span>same slice</span><span></span><span>different whole</span>';
    }
  }

  function syncPlayButton(){
    playButton.textContent=playing?'Ⅱ':'▶';
    playButton.setAttribute('aria-label',playing?'Pause animation':'Play animation');
  }

  function buildFocusButtons(){
    focusEl.replaceChildren();
    const items=[
      ['all','All'],
      ['points','Points → edges'],
      ['lines','Lines → faces'],
      ['faces','Faces → cells'],
      ['cells','Cube → 4D'],
    ];
    items.forEach(([id,label])=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='learn4d-focus-button'+(id===focus?' is-active':'');
      button.textContent=label;
      button.addEventListener('click',()=>{
        focus=id;
        focusEl.querySelectorAll('button').forEach((b)=>b.classList.toggle('is-active',b===button));
        render();
      });
      focusEl.appendChild(button);
    });
  }

  function setMode(next){
    mode=next;
    progress=0;
    direction=1;
    playing=!reduceMotion;
    modesEl.querySelectorAll('.learn4d-mode').forEach((button)=>button.classList.toggle('is-active',button.dataset.mode===mode));
    focusEl.hidden=mode!=='elements';
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
  buildFocusButtons();

  function open(){
    if(active)return;
    active=true;
    document.body.classList.add('learn4d-active');
    progress=0;
    direction=1;
    playing=!reduceMotion;
    lastFrame=performance.now();
    focusEl.hidden=mode!=='elements';
    syncPlayButton();
    updateMarkers();
    render();
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(tick);
  }

  function close(){
    if(!active)return;
    active=false;
    document.body.classList.remove('learn4d-active');
    cancelAnimationFrame(raf);
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  function tick(now){
    if(!active)return;
    const dt=Math.min(.05,Math.max(0,(now-lastFrame)/1000));
    lastFrame=now;
    if(playing&&!scrubbing){
      const duration=modeDurations[mode]||12;
      progress+=direction*dt/duration;
      if(progress>=1){progress=1;direction=-1;}
      else if(progress<=0){progress=0;direction=1;}
    }
    render();
    raf=requestAnimationFrame(tick);
  }

  launch.addEventListener('click',open);
  closeButton.addEventListener('click',close);
  playButton.addEventListener('click',()=>{playing=!playing;syncPlayButton();});

  timeline.addEventListener('pointerdown',()=>{scrubbing=true;playing=false;syncPlayButton();});
  timeline.addEventListener('input',()=>{progress=Number(timeline.value);render();});
  const stopScrub=()=>{scrubbing=false;};
  timeline.addEventListener('pointerup',stopScrub);
  timeline.addEventListener('pointercancel',stopScrub);

  window.addEventListener('resize',render,{passive:true});
  window.addEventListener('keydown',(event)=>{
    if(!active)return;
    if(event.key==='Escape'){close();return;}
    if(event.key===' '){event.preventDefault();playing=!playing;syncPlayButton();return;}
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      event.preventDefault();
      playing=false;
      progress=clamp(progress+(event.key==='ArrowRight'?.015:-.015));
      syncPlayButton();
      render();
    }
  });
})();