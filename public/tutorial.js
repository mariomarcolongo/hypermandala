(() => {
  'use strict';

  if (window.__hypermandalaTutorialInstalled) return;
  window.__hypermandalaTutorialInstalled = true;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;

  const lessons = [
    {
      id: 'build',
      title: 'Build a dimension',
      eyebrow: 'THE CORE RULE',
      body: 'Move an entire object in a new perpendicular direction. Every part of it moves too.',
    },
    {
      id: 'parts',
      title: 'Every part upgrades',
      eyebrow: 'NOT JUST THE OUTLINE',
      body: 'When a cube extends through W, its vertices trace edges, its edges trace faces, and its faces trace cubic cells.',
    },
    {
      id: 'choice',
      title: 'The upgrade is a choice',
      eyebrow: 'REGULAR IS ONLY ONE CASE',
      body: 'Equal extension gives the familiar regular shape. Change the new-axis length, scale, or twist and you get a different higher-dimensional object.',
    },
    {
      id: 'slice',
      title: 'A slice is not the whole',
      eyebrow: 'LOWER-DIMENSIONAL VIEWS ARE INCOMPLETE',
      body: 'The same square slice can belong to infinitely many different 3D bodies. The same is true for a cube inside 4D.',
    },
    {
      id: 'projection',
      title: 'Projection ≠ slice',
      eyebrow: 'TWO DIFFERENT WAYS TO SEE MORE DIMENSIONS',
      body: 'A projection compresses the whole object into fewer dimensions. A slice shows only one intersection. Hypermandala primarily shows projections.',
    },
  ];

  const style = document.createElement('style');
  style.id = 'hypermandalaTutorialStyles';
  style.textContent = `
    .learn-4d-launch {
      border: 0;
      padding: 2px 0;
      background: transparent;
      color: rgba(231,211,158,.78);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .08em;
      cursor: pointer;
    }
    .learn-4d-launch:hover { color: rgba(246,228,177,.98); }

    .dimension-tutorial {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: grid;
      place-items: center;
      padding: 18px;
      background: rgba(4,5,7,.82);
      backdrop-filter: blur(18px) saturate(115%);
      -webkit-backdrop-filter: blur(18px) saturate(115%);
    }
    .dimension-tutorial[hidden] { display: none; }
    .dimension-tutorial__shell {
      width: min(1080px, calc(100vw - 36px));
      max-height: min(860px, calc(100dvh - 36px));
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.11);
      border-radius: 22px;
      background: rgba(10,12,15,.97);
      box-shadow: 0 28px 90px rgba(0,0,0,.52);
    }
    .dimension-tutorial__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 18px 12px;
      border-bottom: 1px solid rgba(255,255,255,.07);
    }
    .dimension-tutorial__brand {
      display: flex;
      align-items: baseline;
      gap: 10px;
      min-width: 0;
    }
    .dimension-tutorial__brand strong {
      font-size: 14px;
      font-weight: 740;
      letter-spacing: .035em;
    }
    .dimension-tutorial__brand span {
      color: rgba(225,227,230,.38);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .1em;
    }
    .dimension-tutorial__close {
      width: 34px;
      height: 34px;
      border: 1px solid rgba(255,255,255,.09);
      border-radius: 10px;
      background: rgba(255,255,255,.035);
      color: rgba(245,246,248,.68);
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    }
    .dimension-tutorial__close:hover { background: rgba(255,255,255,.08); color: #fff; }
    .dimension-tutorial__steps {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 4px;
      padding: 10px 14px 0;
    }
    .dimension-tutorial__step {
      min-height: 36px;
      border: 0;
      border-radius: 9px;
      background: transparent;
      color: rgba(238,239,242,.34);
      cursor: pointer;
      font-size: 9px;
      font-weight: 720;
      letter-spacing: .045em;
    }
    .dimension-tutorial__step:hover { color: rgba(238,239,242,.72); }
    .dimension-tutorial__step.is-active {
      background: rgba(255,255,255,.075);
      color: rgba(249,249,247,.96);
    }
    .dimension-tutorial__body {
      display: grid;
      grid-template-columns: minmax(0, 1.58fr) minmax(270px, .72fr);
      min-height: 560px;
    }
    .dimension-tutorial__stage {
      position: relative;
      display: grid;
      grid-template-rows: minmax(0, 1fr) auto;
      min-width: 0;
      padding: 16px 16px 18px;
    }
    .dimension-tutorial__canvas-wrap {
      position: relative;
      min-height: 430px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.065);
      border-radius: 18px;
      background:
        radial-gradient(circle at 50% 44%, rgba(77,89,112,.10), transparent 45%),
        rgba(255,255,255,.015);
    }
    .dimension-tutorial canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
    .dimension-tutorial__visual-label {
      position: absolute;
      left: 14px;
      top: 13px;
      color: rgba(225,227,230,.38);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
      pointer-events: none;
    }
    .dimension-tutorial__controls {
      display: grid;
      gap: 10px;
      padding-top: 13px;
    }
    .dimension-tutorial__control-row {
      display: grid;
      grid-template-columns: 124px minmax(0,1fr) 54px;
      align-items: center;
      gap: 12px;
    }
    .dimension-tutorial__control-row > span:first-child {
      color: rgba(238,239,242,.48);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .055em;
      text-transform: uppercase;
    }
    .dimension-tutorial__value {
      color: rgba(238,239,242,.70);
      font-size: 10px;
      font-variant-numeric: tabular-nums;
      text-align: right;
    }
    .dimension-tutorial input[type='range'] {
      width: 100%;
      accent-color: #d8b662;
    }
    .dimension-tutorial__panel {
      display: flex;
      flex-direction: column;
      min-width: 0;
      padding: 24px 22px 20px 4px;
    }
    .dimension-tutorial__eyebrow {
      color: rgba(216,182,98,.72);
      font-size: 8px;
      font-weight: 800;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    .dimension-tutorial__title {
      margin: 8px 0 8px;
      font-size: clamp(24px, 2.2vw, 34px);
      line-height: 1.04;
      letter-spacing: -.025em;
    }
    .dimension-tutorial__copy {
      margin: 0;
      color: rgba(232,234,238,.60);
      font-size: 13px;
      line-height: 1.55;
    }
    .dimension-tutorial__rule {
      margin-top: 18px;
      padding: 14px 15px;
      border: 1px solid rgba(216,182,98,.18);
      border-radius: 13px;
      background: rgba(216,182,98,.055);
      color: rgba(245,239,225,.86);
      font-size: 13px;
      line-height: 1.42;
    }
    .dimension-tutorial__rule strong { color: #f5dfaa; }
    .dimension-tutorial__chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 16px;
    }
    .dimension-tutorial__chip {
      min-height: 34px;
      padding: 0 11px;
      border: 1px solid rgba(255,255,255,.07);
      border-radius: 9px;
      background: rgba(255,255,255,.025);
      color: rgba(238,239,242,.44);
      cursor: pointer;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .045em;
    }
    .dimension-tutorial__chip:hover { color: rgba(238,239,242,.8); }
    .dimension-tutorial__chip.is-active {
      border-color: rgba(216,182,98,.28);
      background: rgba(216,182,98,.10);
      color: rgba(249,245,232,.95);
    }
    .dimension-tutorial__facts {
      display: grid;
      gap: 7px;
      margin-top: 18px;
    }
    .dimension-tutorial__fact {
      display: grid;
      grid-template-columns: 54px 1fr;
      gap: 9px;
      align-items: baseline;
      color: rgba(232,234,238,.56);
      font-size: 11px;
      line-height: 1.35;
    }
    .dimension-tutorial__fact strong {
      color: rgba(249,249,247,.90);
      font-size: 13px;
      font-variant-numeric: tabular-nums;
    }
    .dimension-tutorial__nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-top: auto;
      padding-top: 22px;
    }
    .dimension-tutorial__nav button {
      min-height: 38px;
      padding: 0 14px;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 10px;
      background: rgba(255,255,255,.035);
      color: rgba(245,246,248,.70);
      cursor: pointer;
      font-size: 9px;
      font-weight: 750;
      letter-spacing: .055em;
      text-transform: uppercase;
    }
    .dimension-tutorial__nav button:hover { background: rgba(255,255,255,.075); color: #fff; }
    .dimension-tutorial__nav button:disabled { opacity: .25; cursor: default; }
    .dimension-tutorial__nav .is-primary {
      border-color: rgba(216,182,98,.23);
      background: rgba(216,182,98,.10);
      color: rgba(249,245,232,.94);
    }
    .dimension-tutorial__mini {
      margin-top: 12px;
      color: rgba(225,227,230,.34);
      font-size: 9px;
      line-height: 1.45;
    }

    @media (max-width: 800px) {
      .dimension-tutorial { padding: 0; }
      .dimension-tutorial__shell {
        width: 100vw;
        height: 100dvh;
        max-height: none;
        border: 0;
        border-radius: 0;
        overflow: auto;
      }
      .dimension-tutorial__top { position: sticky; top: 0; z-index: 5; background: rgba(10,12,15,.97); }
      .dimension-tutorial__brand span { display: none; }
      .dimension-tutorial__steps {
        grid-template-columns: repeat(5, minmax(92px, 1fr));
        overflow-x: auto;
        padding-bottom: 2px;
      }
      .dimension-tutorial__body { grid-template-columns: 1fr; min-height: 0; }
      .dimension-tutorial__stage { padding: 12px; }
      .dimension-tutorial__canvas-wrap { min-height: 340px; }
      .dimension-tutorial__panel { padding: 4px 16px 20px; }
      .dimension-tutorial__control-row { grid-template-columns: 92px minmax(0,1fr) 48px; gap: 8px; }
      .dimension-tutorial__nav { margin-top: 18px; }
    }
  `;
  document.head.appendChild(style);

  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'learn-4d-launch';
  launch.textContent = 'Learn 4D';
  launch.title = 'Interactive dimensional tutorial';
  document.querySelector('.control-panel__actions')?.prepend(launch);

  const overlay = document.createElement('div');
  overlay.className = 'dimension-tutorial';
  overlay.hidden = true;
  overlay.innerHTML = `
    <section class="dimension-tutorial__shell" role="dialog" aria-modal="true" aria-labelledby="dimensionTutorialTitle">
      <div class="dimension-tutorial__top">
        <div class="dimension-tutorial__brand">
          <strong>Dimension Builder</strong>
          <span>see the upgrade happen</span>
        </div>
        <button class="dimension-tutorial__close" type="button" aria-label="Close tutorial">×</button>
      </div>
      <div class="dimension-tutorial__steps" aria-label="Tutorial chapters"></div>
      <div class="dimension-tutorial__body">
        <div class="dimension-tutorial__stage">
          <div class="dimension-tutorial__canvas-wrap">
            <canvas aria-label="Interactive dimensional construction"></canvas>
            <div class="dimension-tutorial__visual-label"></div>
          </div>
          <div class="dimension-tutorial__controls"></div>
        </div>
        <aside class="dimension-tutorial__panel">
          <div class="dimension-tutorial__eyebrow"></div>
          <h2 class="dimension-tutorial__title" id="dimensionTutorialTitle"></h2>
          <p class="dimension-tutorial__copy"></p>
          <div class="dimension-tutorial__rule"></div>
          <div class="dimension-tutorial__chips"></div>
          <div class="dimension-tutorial__facts"></div>
          <div class="dimension-tutorial__mini"></div>
          <div class="dimension-tutorial__nav">
            <button type="button" data-nav="prev">Back</button>
            <button type="button" class="is-primary" data-nav="next">Next</button>
          </div>
        </aside>
      </div>
    </section>
  `;
  document.body.appendChild(overlay);

  const canvas = overlay.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const stepsEl = overlay.querySelector('.dimension-tutorial__steps');
  const controlsEl = overlay.querySelector('.dimension-tutorial__controls');
  const chipsEl = overlay.querySelector('.dimension-tutorial__chips');
  const factsEl = overlay.querySelector('.dimension-tutorial__facts');
  const miniEl = overlay.querySelector('.dimension-tutorial__mini');
  const titleEl = overlay.querySelector('.dimension-tutorial__title');
  const eyebrowEl = overlay.querySelector('.dimension-tutorial__eyebrow');
  const copyEl = overlay.querySelector('.dimension-tutorial__copy');
  const ruleEl = overlay.querySelector('.dimension-tutorial__rule');
  const visualLabel = overlay.querySelector('.dimension-tutorial__visual-label');
  const prevButton = overlay.querySelector('[data-nav="prev"]');
  const nextButton = overlay.querySelector('[data-nav="next"]');
  const closeButton = overlay.querySelector('.dimension-tutorial__close');

  let lessonIndex = 0;
  let stage = 3;
  let sweep = 1;
  let newAxisLength = 1;
  let partMode = 'everything';
  let continuation = 'box';
  let animationFrame = 0;
  let autoSweep = false;
  let autoDirection = -1;

  const colors = {
    text: 'rgba(245,246,248,.92)',
    muted: 'rgba(225,227,230,.34)',
    source: 'rgba(226,229,235,.42)',
    current: 'rgba(244,237,218,.92)',
    gold: 'rgba(216,182,98,.92)',
    goldSoft: 'rgba(216,182,98,.18)',
    blue: 'rgba(108,168,255,.80)',
    green: 'rgba(98,212,139,.72)',
    red: 'rgba(255,107,107,.72)',
  };

  function line(a, b, color = colors.current, width = 1.5, alpha = 1) {
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

  function polygon(points, fill, stroke = null, alpha = 1, width = 1) {
    if (!points.length) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    points.forEach((p, index) => {
      if (index === 0) ctx.moveTo(p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
    });
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

  function point(p, radius = 4.2, color = colors.current, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p[0], p[1], radius, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function label(text, x, y, align = 'center', color = colors.muted, size = 11) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `600 ${size}px Inter, ui-sans-serif, sans-serif`;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function fitCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width: rect.width, height: rect.height };
  }

  function cubeVertices(size = 1) {
    const out = [];
    for (let z = 0; z <= 1; z += 1) {
      for (let y = 0; y <= 1; y += 1) {
        for (let x = 0; x <= 1; x += 1) {
          out.push([(x - .5) * size, (y - .5) * size, (z - .5) * size]);
        }
      }
    }
    return out;
  }

  function cubeEdges() {
    const edges = [];
    for (let i = 0; i < 8; i += 1) {
      for (let axis = 0; axis < 3; axis += 1) {
        const j = i ^ (1 << axis);
        if (i < j) edges.push([i, j]);
      }
    }
    return edges;
  }

  function cubeFaces() {
    const faces = [];
    for (let axis = 0; axis < 3; axis += 1) {
      for (let side = 0; side <= 1; side += 1) {
        const indices = [];
        for (let i = 0; i < 8; i += 1) {
          if (((i >> axis) & 1) === side) indices.push(i);
        }
        faces.push(indices);
      }
    }
    return faces;
  }

  function project3(p, center, scale) {
    const yaw = -0.72;
    const pitch = 0.52;
    let [x, y, z] = p;
    let c = Math.cos(yaw), s = Math.sin(yaw);
    [x, z] = [c * x - s * z, s * x + c * z];
    c = Math.cos(pitch); s = Math.sin(pitch);
    [y, z] = [c * y - s * z, s * y + c * z];
    const perspective = 4.8 / (4.8 - z);
    return [center[0] + x * scale * perspective, center[1] + y * scale * perspective, z];
  }

  function rotate4(p) {
    const q = [...p];
    const rotate = (a, b, angle) => {
      const c = Math.cos(angle), s = Math.sin(angle);
      const na = c * q[a] - s * q[b];
      const nb = s * q[a] + c * q[b];
      q[a] = na; q[b] = nb;
    };
    rotate(0, 3, .52);
    rotate(1, 3, -.31);
    rotate(2, 3, .22);
    rotate(0, 2, -.54);
    rotate(1, 2, .36);
    return q;
  }

  function project4(p, center, scale) {
    const q = rotate4(p);
    const wCam = 4.7;
    const wf = wCam / (wCam - q[3]);
    return project3([q[0] * wf, q[1] * wf, q[2] * wf], center, scale);
  }

  function drawBuild(width, height) {
    const center = [width * .5, height * .50];
    const base = Math.min(width, height) * .29;
    const t = sweep;
    const depth = newAxisLength * t;

    if (stage === 0) {
      const a = [center[0] - base * .62, center[1]];
      const b = [center[0] - base * .62 + base * 1.24 * depth, center[1]];
      line(a, b, colors.gold, 3, .72);
      point(a, 5.2, colors.source);
      point(b, 5.5, colors.current);
      label('point', a[0], a[1] + 28);
      label('traces a line', center[0], center[1] - 38, 'center', colors.gold, 12);
      return;
    }

    if (stage === 1) {
      const h = base * .65;
      const x0 = center[0] - base * .55;
      const dx = base * 1.1 * depth;
      const a = [x0, center[1] - h];
      const b = [x0, center[1] + h];
      const c = [x0 + dx, center[1] + h];
      const d = [x0 + dx, center[1] - h];
      polygon([a,b,c,d], colors.goldSoft, colors.gold, .86, 1.3);
      line(a,b,colors.source,2.4,.8);
      line(d,c,colors.current,2.4,.96);
      [a,b].forEach((p) => point(p,4.2,colors.source));
      [d,c].forEach((p) => point(p,4.2,colors.current));
      label(Math.abs(newAxisLength - 1) < .03 ? 'square' : 'rectangle', center[0], center[1] - h - 34, 'center', colors.gold, 12);
      return;
    }

    if (stage === 2) {
      const s = 1.35;
      const verts = cubeVertices(s);
      const flattened = verts.map((p) => [p[0], p[1], p[2] * depth]);
      const projected = flattened.map((p) => project3(p, center, base * .78));
      const faces = cubeFaces();
      faces.forEach((face, idx) => {
        const pts = face.map((i) => projected[i]);
        polygon(pts, idx < 2 ? 'rgba(216,182,98,.055)' : 'rgba(216,182,98,.10)', 'rgba(216,182,98,.34)', .8, 1);
      });
      cubeEdges().forEach(([a,b]) => {
        const za = verts[a][2], zb = verts[b][2];
        const isNew = za !== zb;
        line(projected[a], projected[b], isNew ? colors.gold : colors.current, isNew ? 2 : 1.5, isNew ? .9 : .72);
      });
      projected.forEach((p, i) => point(p, 3.2, verts[i][2] < 0 ? colors.source : colors.current, .9));
      label(Math.abs(newAxisLength - 1) < .03 ? 'cube' : 'rectangular prism', center[0], height * .13, 'center', colors.gold, 12);
      return;
    }

    const cube = cubeVertices(1.32);
    const verts4 = [];
    cube.forEach((p) => verts4.push([p[0],p[1],p[2],-.66 * depth]));
    cube.forEach((p) => verts4.push([p[0],p[1],p[2], .66 * depth]));
    const projected = verts4.map((p) => project4(p, center, base * .78));
    const edges = cubeEdges();
    edges.forEach(([a,b]) => {
      line(projected[a], projected[b], colors.source, 1.35, .62);
      line(projected[a+8], projected[b+8], colors.current, 1.55, .88);
    });
    for (let i = 0; i < 8; i += 1) line(projected[i], projected[i+8], colors.gold, 2.2, .9);
    projected.forEach((p, i) => point(p, 2.8, i < 8 ? colors.source : colors.current, .9));
    label(Math.abs(newAxisLength - 1) < .03 ? 'tesseract' : '4D rectangular orthotope', center[0], height * .12, 'center', colors.gold, 12);
    label('W', width * .84, height * .22, 'center', colors.gold, 12);
  }

  function drawParts(width, height) {
    const center = [width * .5, height * .50];
    const scale = Math.min(width, height) * .24;
    const cube = cubeVertices(1.35);
    const p4 = [];
    cube.forEach((p) => p4.push([p[0],p[1],p[2],-.72]));
    cube.forEach((p) => p4.push([p[0],p[1],p[2], .72]));
    const p = p4.map((v) => project4(v, center, scale));
    const edges = cubeEdges();

    edges.forEach(([a,b]) => {
      line(p[a],p[b],colors.source,1.2,.32);
      line(p[a+8],p[b+8],colors.current,1.3,.44);
    });
    for (let i = 0; i < 8; i += 1) line(p[i],p[i+8],colors.gold,1.7,.5);

    if (partMode === 'vertices' || partMode === 'everything') {
      for (let i = 0; i < 8; i += 1) {
        line(p[i],p[i+8],colors.gold,3.2,1);
        point(p[i],4.3,colors.source);
        point(p[i+8],4.3,colors.gold);
      }
    }

    if (partMode === 'edges' || partMode === 'everything') {
      edges.forEach(([a,b]) => {
        polygon([p[a],p[b],p[b+8],p[a+8]], 'rgba(108,168,255,.075)', 'rgba(108,168,255,.46)', partMode === 'everything' ? .45 : .88, 1.15);
      });
    }

    if (partMode === 'faces') {
      const faces = cubeFaces();
      faces.forEach((face, idx) => {
        const side = idx % 2;
        const source = face.map((i) => p[i]);
        const dest = face.map((i) => p[i+8]);
        polygon(source, null, 'rgba(98,212,139,.62)', .9, 1.2);
        polygon(dest, null, 'rgba(98,212,139,.80)', .9, 1.4);
        face.forEach((i) => line(p[i],p[i+8],colors.green,2.1,.72));
      });
    }

    if (partMode === 'whole') {
      edges.forEach(([a,b]) => {
        line(p[a],p[b],colors.source,2,.7);
        line(p[a+8],p[b+8],colors.current,2,.9);
      });
      for (let i = 0; i < 8; i += 1) line(p[i],p[i+8],colors.gold,2.7,.95);
    }

    const messages = {
      vertices: '8 vertices → 8 new W-edges',
      edges: '12 edges → 12 swept square faces',
      faces: '6 square faces → 6 swept cubic cells',
      whole: '1 cube → 1 four-dimensional body',
      everything: 'Every level transforms at the same time',
    };
    label(messages[partMode], center[0], height * .12, 'center', colors.gold, 12);
  }

  function drawChoice(width, height) {
    const center = [width * .5, height * .52];
    const base = Math.min(width, height) * .24;
    const mode = continuation;
    const steps = 8;
    const rings = [];
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      let scale = 1;
      let angle = 0;
      if (mode === 'taper') scale = 1 - t * .58;
      if (mode === 'twist') angle = t * .9;
      const z = (t - .5) * 2 * newAxisLength;
      const s = .82 * scale;
      const corners = [[-s,-s],[s,-s],[s,s],[-s,s]].map(([x,y]) => {
        const c = Math.cos(angle), sn = Math.sin(angle);
        return [c*x-sn*y, sn*x+c*y, z];
      });
      rings.push(corners.map((p) => project3(p, center, base)));
    }
    for (let r = 0; r < rings.length; r += 1) {
      polygon(rings[r], null, r === Math.floor(steps/2) ? colors.gold : 'rgba(226,229,235,.24)', r === Math.floor(steps/2) ? 1 : .65, r === Math.floor(steps/2) ? 2.2 : 1);
    }
    for (let k = 0; k < 4; k += 1) {
      for (let r = 0; r < rings.length - 1; r += 1) {
        line(rings[r][k],rings[r+1][k],mode === 'box' ? colors.current : colors.blue,1.25,.55);
      }
    }
    const regular = mode === 'box' && Math.abs(newAxisLength - 1) < .03;
    const name = regular ? 'cube' : mode === 'box' ? 'rectangular prism' : mode === 'taper' ? 'tapered solid' : 'twisted solid';
    label(name, center[0], height * .12, 'center', colors.gold, 12);
    label('same starting square', center[0], height * .88, 'center', colors.muted, 10);
  }

  function drawSlice(width, height) {
    const center = [width * .5, height * .52];
    const base = Math.min(width, height) * .23;
    const steps = 10;
    const rings = [];
    for (let i = 0; i <= steps; i += 1) {
      const u = (i / steps) * 2 - 1;
      let s = .72;
      let angle = 0;
      if (continuation === 'taper') s = .72 * (1 - .46 * Math.abs(u));
      if (continuation === 'twist') angle = u * .62;
      const z = u * 1.25;
      const corners = [[-s,-s],[s,-s],[s,s],[-s,s]].map(([x,y]) => {
        const c = Math.cos(angle), sn = Math.sin(angle);
        return [c*x-sn*y, sn*x+c*y, z];
      });
      rings.push(corners.map((p) => project3(p, center, base)));
    }
    const mid = Math.floor(steps/2);
    for (let i = 0; i < rings.length; i += 1) {
      polygon(rings[i], i === mid ? 'rgba(216,182,98,.12)' : null, i === mid ? colors.gold : 'rgba(226,229,235,.20)', i === mid ? 1 : .5, i === mid ? 2.5 : 1);
    }
    for (let k = 0; k < 4; k += 1) {
      for (let i = 0; i < rings.length - 1; i += 1) line(rings[i][k],rings[i+1][k],'rgba(226,229,235,.22)',1,.55);
    }
    label('this square is only one slice', center[0], height * .12, 'center', colors.gold, 12);
    label('many different bodies can contain the same slice', center[0], height * .89, 'center', colors.muted, 10);
  }

  function drawProjection(width, height) {
    const left = [width * .27, height * .50];
    const right = [width * .73, height * .50];
    const scale = Math.min(width, height) * .18;
    const cube = cubeVertices(1.42);
    const edges = cubeEdges();

    const p = cube.map((v) => project3(v,left,scale));
    edges.forEach(([a,b]) => line(p[a],p[b],colors.current,1.6,.82));
    label('PROJECTION',left[0],height*.18,'center',colors.gold,11);
    label('the whole cube is compressed into 2D',left[0],height*.83,'center',colors.muted,10);

    const square = [[-.72,-.72,0],[.72,-.72,0],[.72,.72,0],[-.72,.72,0]].map((v)=>project3(v,right,scale));
    polygon(square,'rgba(216,182,98,.12)',colors.gold,1,2.3);
    const faint = cube.map((v) => project3(v,right,scale));
    edges.forEach(([a,b]) => line(faint[a],faint[b],'rgba(226,229,235,.20)',1,.42));
    label('SLICE',right[0],height*.18,'center',colors.gold,11);
    label('only one intersection is shown',right[0],height*.83,'center',colors.muted,10);

    line([width*.5,height*.25],[width*.5,height*.78],'rgba(255,255,255,.08)',1,1);
  }

  function renderCanvas() {
    if (overlay.hidden) return;
    const { width, height } = fitCanvas();
    ctx.clearRect(0,0,width,height);
    const id = lessons[lessonIndex].id;
    if (id === 'build') drawBuild(width,height);
    else if (id === 'parts') drawParts(width,height);
    else if (id === 'choice') drawChoice(width,height);
    else if (id === 'slice') drawSlice(width,height);
    else drawProjection(width,height);
  }

  function rangeControl(labelText, min, max, stepValue, value, formatter, onInput) {
    const row = document.createElement('label');
    row.className = 'dimension-tutorial__control-row';
    const labelSpan = document.createElement('span');
    labelSpan.textContent = labelText;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(stepValue);
    input.value = String(value);
    const output = document.createElement('span');
    output.className = 'dimension-tutorial__value';
    output.textContent = formatter(value);
    input.addEventListener('input', () => {
      const v = Number(input.value);
      output.textContent = formatter(v);
      onInput(v);
      renderCanvas();
    });
    row.append(labelSpan,input,output);
    return row;
  }

  function chip(text, value, current, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dimension-tutorial__chip' + (current === value ? ' is-active' : '');
    button.textContent = text;
    button.addEventListener('click', () => onClick(value));
    chipsEl.appendChild(button);
  }

  function fact(number, text) {
    const row = document.createElement('div');
    row.className = 'dimension-tutorial__fact';
    row.innerHTML = `<strong>${number}</strong><span>${text}</span>`;
    factsEl.appendChild(row);
  }

  function buildLessonUi() {
    const lesson = lessons[lessonIndex];
    eyebrowEl.textContent = lesson.eyebrow;
    titleEl.textContent = lesson.title;
    copyEl.textContent = lesson.body;
    controlsEl.replaceChildren();
    chipsEl.replaceChildren();
    factsEl.replaceChildren();
    miniEl.textContent = '';
    visualLabel.textContent = '';

    stepsEl.querySelectorAll('button').forEach((button,index) => {
      button.classList.toggle('is-active', index === lessonIndex);
    });

    if (lesson.id === 'build') {
      visualLabel.textContent = ['0D → 1D','1D → 2D','2D → 3D','3D → 4D'][stage];
      ruleEl.innerHTML = '<strong>One rule, repeated:</strong> move the whole object along a new axis. The object and every sub-object sweep out something one dimension higher.';
      ['Point → line','Line → plane','Plane → space','Space → 4D'].forEach((text,index) => chip(text,index,stage,(value)=>{ stage=value; sweep=1; autoSweep=false; buildLessonUi(); renderCanvas(); }));
      controlsEl.append(
        rangeControl('Build progress',0,1,.01,sweep,(v)=>Math.round(v*100)+'%',(v)=>{sweep=v;}),
        rangeControl('New-axis length',.35,1.7,.01,newAxisLength,(v)=>v.toFixed(2)+'×',(v)=>{newAxisLength=v;})
      );
      const play = document.createElement('button');
      play.type='button'; play.className='dimension-tutorial__chip';
      play.textContent = autoSweep ? 'Pause' : 'Animate';
      play.addEventListener('click',()=>{autoSweep=!autoSweep; autoDirection=sweep >= .98 ? -1 : 1; buildLessonUi(); if(autoSweep) startLoop();});
      chipsEl.appendChild(play);
      miniEl.textContent = 'Equal side lengths give the familiar regular sequence. Unequal extension is still a valid dimensional upgrade.';
    } else if (lesson.id === 'parts') {
      visualLabel.textContent = 'CUBE → 4D';
      ruleEl.innerHTML = '<strong>Nothing is skipped.</strong> A dimensional upgrade acts on the entire incidence structure, not only on the outer silhouette.';
      [['Everything','everything'],['Vertices','vertices'],['Edges','edges'],['Faces','faces'],['Whole cube','whole']].forEach(([text,value])=>chip(text,value,partMode,(v)=>{partMode=v;buildLessonUi();renderCanvas();}));
      fact('8 → 8','vertices each trace a new W-edge');
      fact('12 → 12','edges each sweep a square face');
      fact('6 → 6','square faces each sweep a cubic cell');
      fact('+ 2','the two end cubes remain, giving 8 cubic cells for a tesseract');
      miniEl.textContent = 'For a regular tesseract the final counts are 16 vertices, 32 edges, 24 square faces and 8 cubic cells.';
    } else if (lesson.id === 'choice') {
      visualLabel.textContent = 'SAME START, DIFFERENT CONTINUATION';
      ruleEl.innerHTML = '<strong>Square → cube is not compulsory.</strong> It is the symmetric case where the new dimension has the same length and the cross-section stays unchanged.';
      [['Straight','box'],['Taper','taper'],['Twist','twist']].forEach(([text,value])=>chip(text,value,continuation,(v)=>{continuation=v;buildLessonUi();renderCanvas();}));
      controlsEl.append(rangeControl('New-axis length',.35,1.7,.01,newAxisLength,(v)=>v.toFixed(2)+'×',(v)=>{newAxisLength=v;}));
      miniEl.textContent = 'The same freedom continues upward: a cube can produce a regular tesseract, an elongated 4D orthotope, or a more general 4D body if its 3D cross-section changes along W.';
    } else if (lesson.id === 'slice') {
      visualLabel.textContent = 'ONE SQUARE SLICE';
      ruleEl.innerHTML = '<strong>A slice tells you what exists here, not what exists beyond it.</strong> One lower-dimensional cross-section cannot uniquely reconstruct the higher-dimensional whole.';
      [['Box','box'],['Tapered','taper'],['Twisted','twist']].forEach(([text,value])=>chip(text,value,continuation,(v)=>{continuation=v;buildLessonUi();renderCanvas();}));
      miniEl.textContent = 'Exactly the same logic applies in 4D: observing one cube-shaped 3D slice does not imply that the unseen 4D object must be a tesseract.';
    } else {
      visualLabel.textContent = 'TWO DIFFERENT OPERATIONS';
      ruleEl.innerHTML = '<strong>Projection:</strong> the whole higher-dimensional object contributes to the image. <strong>Slice:</strong> only the intersection with one lower-dimensional subspace appears.';
      fact('Projection','good for seeing global structure, but it overlaps information');
      fact('Slice','locally exact, but hides everything away from that slice');
      miniEl.textContent = 'Hypermandala uses projections to let you inspect 3D and 4D structures on a 2D screen. A projection is not the object itself.';
    }

    prevButton.disabled = lessonIndex === 0;
    nextButton.textContent = lessonIndex === lessons.length - 1 ? 'Explore' : 'Next';
  }

  function renderSteps() {
    stepsEl.replaceChildren();
    lessons.forEach((lesson,index) => {
      const button = document.createElement('button');
      button.type='button';
      button.className='dimension-tutorial__step' + (index===lessonIndex?' is-active':'');
      button.textContent = `${index+1}. ${lesson.title}`;
      button.addEventListener('click',()=>{lessonIndex=index;autoSweep=false;buildLessonUi();renderCanvas();});
      stepsEl.appendChild(button);
    });
  }

  function openTutorial() {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    renderSteps();
    buildLessonUi();
    requestAnimationFrame(renderCanvas);
    closeButton.focus();
  }

  function closeTutorial() {
    overlay.hidden = true;
    autoSweep = false;
    cancelAnimationFrame(animationFrame);
    document.body.style.overflow = '';
    launch.focus();
  }

  function startLoop() {
    cancelAnimationFrame(animationFrame);
    let last = performance.now();
    const tick = (now) => {
      if (!autoSweep || overlay.hidden) return;
      const dt = Math.min(.04,(now-last)/1000); last = now;
      sweep += autoDirection * dt * .48;
      if (sweep >= 1) { sweep=1; autoDirection=-1; }
      if (sweep <= 0) { sweep=0; autoDirection=1; }
      const input = controlsEl.querySelector('input[type="range"]');
      const value = controlsEl.querySelector('.dimension-tutorial__value');
      if (input) input.value = String(sweep);
      if (value) value.textContent = Math.round(sweep*100)+'%';
      renderCanvas();
      animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);
  }

  launch.addEventListener('click', openTutorial);
  closeButton.addEventListener('click', closeTutorial);
  overlay.addEventListener('click',(event)=>{ if(event.target===overlay) closeTutorial(); });
  prevButton.addEventListener('click',()=>{ if(lessonIndex>0){lessonIndex-=1;autoSweep=false;buildLessonUi();renderCanvas();} });
  nextButton.addEventListener('click',()=>{
    if (lessonIndex < lessons.length - 1) {
      lessonIndex += 1;
      autoSweep = false;
      buildLessonUi();
      renderCanvas();
      return;
    }
    closeTutorial();
    document.querySelector('[data-preset="square"]')?.click();
    document.querySelector('[data-dimension="4"]')?.click();
  });
  window.addEventListener('resize',()=>{ if(!overlay.hidden) renderCanvas(); },{passive:true});
  window.addEventListener('keydown',(event)=>{
    if (overlay.hidden) return;
    if (event.key === 'Escape') closeTutorial();
    if (event.key === 'ArrowRight' && lessonIndex < lessons.length - 1) { lessonIndex += 1; autoSweep=false; buildLessonUi(); renderCanvas(); }
    if (event.key === 'ArrowLeft' && lessonIndex > 0) { lessonIndex -= 1; autoSweep=false; buildLessonUi(); renderCanvas(); }
  });

  if (!reducedMotion) {
    // Start with a static UI; animation remains opt-in so the tutorial never feels busy.
  }
})();
