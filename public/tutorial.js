(() => {
  'use strict';

  if (window.__hypermandalaTutorialInstalled) return;
  window.__hypermandalaTutorialInstalled = true;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GOLD = '#d8b662';
  const WHITE = 'rgba(244,246,249,.92)';
  const MUTED = 'rgba(225,229,235,.34)';
  const BLUE = '#6ca8ff';
  const GREEN = '#62d48b';

  const modes = [
    { id: 'build', label: 'Build' },
    { id: 'freedom', label: 'Variations' },
    { id: 'slices', label: 'Slices' },
  ];

  const style = document.createElement('style');
  style.id = 'hypermandalaSimpleLearn4DStyles';
  style.textContent = `
    /* The old comparison view belonged to the retired diagnostic UI. */
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
      transition: opacity 220ms ease;
    }
    body.learn4d-active .learn4d-stage { opacity: 1; }

    .learn4d-caption {
      position: fixed;
      top: max(24px, env(safe-area-inset-top));
      left: 50%;
      z-index: 9;
      transform: translateX(-50%);
      max-width: min(720px, calc(100vw - 40px));
      color: rgba(244,246,249,.70);
      font-size: 12px;
      font-weight: 560;
      line-height: 1.35;
      letter-spacing: .015em;
      text-align: center;
      pointer-events: none;
      opacity: 0;
      transition: opacity 180ms ease;
    }
    body.learn4d-active .learn4d-caption { opacity: 1; }

    .learn4d-hud {
      position: fixed;
      left: 50%;
      bottom: max(22px, env(safe-area-inset-bottom));
      z-index: 10;
      transform: translateX(-50%);
      display: grid;
      gap: 8px;
      width: min(720px, calc(100vw - 34px));
      padding: 8px 10px 9px;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 13px;
      background: rgba(10,12,15,.70);
      backdrop-filter: blur(14px) saturate(115%);
      -webkit-backdrop-filter: blur(14px) saturate(115%);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 180ms ease, visibility 0s linear 180ms;
    }
    body.learn4d-active .learn4d-hud {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transition: opacity 180ms ease, visibility 0s;
    }
    .learn4d-modes {
      display: flex;
      justify-content: center;
      gap: 4px;
    }
    .learn4d-mode,
    .learn4d-icon {
      min-height: 29px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: rgba(238,239,242,.38);
      cursor: pointer;
      font-size: 8px;
      font-weight: 730;
      letter-spacing: .055em;
      text-transform: uppercase;
    }
    .learn4d-mode { padding: 0 10px; }
    .learn4d-mode:hover,
    .learn4d-icon:hover { color: rgba(248,249,250,.86); }
    .learn4d-mode.is-active {
      background: rgba(255,255,255,.07);
      color: rgba(248,249,250,.91);
    }
    .learn4d-timeline-row {
      display: grid;
      grid-template-columns: 34px minmax(0,1fr) 34px;
      align-items: center;
      gap: 8px;
    }
    .learn4d-icon {
      display: grid;
      place-items: center;
      width: 34px;
      min-width: 34px;
      padding: 0;
      font-size: 12px;
      text-transform: none;
    }
    .learn4d-timeline {
      width: 100%;
      height: 26px;
      margin: 0;
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      cursor: ew-resize;
    }
    .learn4d-timeline::-webkit-slider-runnable-track {
      height: 2px;
      border-radius: 99px;
      background: rgba(255,255,255,.22);
    }
    .learn4d-timeline::-moz-range-track {
      height: 2px;
      border-radius: 99px;
      background: rgba(255,255,255,.22);
    }
    .learn4d-timeline::-webkit-slider-thumb {
      width: 14px;
      height: 14px;
      margin-top: -6px;
      appearance: none;
      -webkit-appearance: none;
      border: 1px solid rgba(255,255,255,.74);
      border-radius: 50%;
      background: ${GOLD};
    }
    .learn4d-timeline::-moz-range-thumb {
      width: 13px;
      height: 13px;
      border: 1px solid rgba(255,255,255,.74);
      border-radius: 50%;
      background: ${GOLD};
    }
    .learn4d-markers {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      padding: 0 43px;
      color: rgba(225,229,235,.28);
      font-size: 7px;
      font-weight: 700;
      letter-spacing: .07em;
      text-align: center;
      text-transform: uppercase;
    }
    .learn4d-markers span:first-child { text-align: left; }
    .learn4d-markers span:last-child { text-align: right; }

    body.learn4d-active #solidLayer,
    body.learn4d-active #mandala { opacity: .055; transition: opacity 220ms ease; }
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
      transition: opacity 160ms ease !important;
    }

    @media (max-width: 680px) {
      .learn4d-caption {
        top: max(18px, env(safe-area-inset-top));
        font-size: 10px;
      }
      .learn4d-hud {
        bottom: max(10px, env(safe-area-inset-bottom));
        width: calc(100vw - 18px);
        padding: 7px 8px 8px;
      }
      .learn4d-mode { padding: 0 8px; }
      .learn4d-markers { padding: 0 42px; }
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
  let lastFrame = performance.now();
  let raf = 0;
  let scrubbing = false;

  const modeDurations = {
    build: 12,
    freedom: 10,
    slices: 10,
  };

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

  function dot(p, radius = 3.5, color = WHITE, alpha = 1) {
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

  function rotatePoint(p, center, angle) {
    const x = p[0] - center[0];
    const y = p[1] - center[1];
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [center[0] + c * x - s * y, center[1] + s * x + c * y];
  }

  function squarePoints(cx, cy, size) {
    const h = size / 2;
    return [
      [cx - h, cy - h],
      [cx + h, cy - h],
      [cx + h, cy + h],
      [cx - h, cy + h],
    ];
  }

  function cubePoints(cx, cy, size, depth = 1) {
    const front = squarePoints(cx - size * .10 * depth, cy + size * .08 * depth, size);
    const dx = size * .28 * depth;
    const dy = -size * .22 * depth;
    const back = front.map(([x, y]) => [x + dx, y + dy]);
    return [...front, ...back];
  }

  function drawCube(points, color = WHITE, alpha = .86, width = 1.5) {
    cubeEdges.forEach(([a, b]) => line(points[a], points[b], color, width, alpha));
  }

  function project3([x, y, z], center, scale) {
    const yaw = -.68;
    const pitch = .48;
    let xx = x;
    let yy = y;
    let zz = z;
    let c = Math.cos(yaw);
    let s = Math.sin(yaw);
    [xx, zz] = [c * xx - s * zz, s * xx + c * zz];
    c = Math.cos(pitch);
    s = Math.sin(pitch);
    [yy, zz] = [c * yy - s * zz, s * yy + c * zz];
    const f = 4.8 / (4.8 - zz);
    return [center[0] + xx * scale * f, center[1] + yy * scale * f];
  }

  function drawBuild(width, height, t) {
    const segmentFloat = clamp(t) * 4;
    const segment = Math.min(3, Math.floor(segmentFloat));
    const local = ease(segmentFloat - segment);
    const cx = width * .5;
    const cy = height * .46;
    const size = Math.min(width, height) * .31;

    if (segment === 0) {
      const half = size * .48 * local;
      const a = [cx, cy - half];
      const b = [cx, cy + half];
      line(a, b, GOLD, 2.4, .92);
      dot(a, 4, WHITE, .92);
      dot(b, 4, WHITE, .92);
      caption.textContent = local < .08 ? '0D · a point' : '0D → 1D · a point moves and traces a line';
      return;
    }

    if (segment === 1) {
      const h = size * .48;
      const left = cx - size * .48;
      const right = lerp(left, cx + size * .48, local);
      const source = [[left, cy - h], [left, cy + h]];
      const moved = [[right, cy - h], [right, cy + h]];
      polygon([source[0], source[1], moved[1], moved[0]], 'rgba(216,182,98,.055)', GOLD, .72, 1.1);
      line(source[0], source[1], WHITE, 1.8, .56);
      line(moved[0], moved[1], GOLD, 2.2, .92);
      line(source[0], moved[0], GOLD, 1.4, .58);
      line(source[1], moved[1], GOLD, 1.4, .58);
      [...source, ...moved].forEach((p) => dot(p, 3.5, WHITE, .85));
      caption.textContent = '1D → 2D · every point of the line moves · the line sweeps a face';
      return;
    }

    if (segment === 2) {
      const front = squarePoints(cx - size * .08 * local, cy + size * .06 * local, size * .92);
      const dx = size * .27 * local;
      const dy = -size * .22 * local;
      const back = front.map(([x, y]) => [x + dx, y + dy]);
      polygon(front, 'rgba(216,182,98,.025)', WHITE, .58, 1.2);
      polygon(back, 'rgba(216,182,98,.045)', GOLD, .88, 1.4);
      for (let i = 0; i < 4; i += 1) {
        const j = (i + 1) % 4;
        polygon([front[i], front[j], back[j], back[i]], 'rgba(108,168,255,.025)', null, .7);
        line(front[i], back[i], GOLD, 1.8, .76);
      }
      front.forEach((p) => dot(p, 3, WHITE, .72));
      back.forEach((p) => dot(p, 3, GOLD, .88));
      caption.textContent = '2D → 3D · points trace edges · edges sweep faces · the square sweeps volume';
      return;
    }

    const source = cubePoints(cx, cy, size * .86, 1);
    const targetScale = lerp(1, .54, local);
    const targetOffset = [size * .08 * local, -size * .055 * local];
    const target = source.map(([x, y]) => [
      cx + (x - cx) * targetScale + targetOffset[0],
      cy + (y - cy) * targetScale + targetOffset[1],
    ]);

    drawCube(source, WHITE, .50, 1.25);

    const ghostCount = 5;
    for (let g = 1; g <= ghostCount; g += 1) {
      const u = (g / (ghostCount + 1)) * local;
      const s = lerp(1, .54, u);
      const ghost = source.map(([x, y]) => [
        cx + (x - cx) * s + size * .08 * u,
        cy + (y - cy) * s - size * .055 * u,
      ]);
      drawCube(ghost, GOLD, .08 + u * .05, .8);
    }

    cubeEdges.forEach(([a, b]) => {
      polygon([source[a], source[b], target[b], target[a]], 'rgba(108,168,255,.018)', null, .9);
    });
    for (let i = 0; i < 8; i += 1) line(source[i], target[i], GOLD, 1.9, .76);
    drawCube(target, GOLD, .92, 1.6);
    source.forEach((p) => dot(p, 2.7, WHITE, .64));
    target.forEach((p) => dot(p, 2.9, GOLD, .92));

    caption.textContent = '3D → 4D · every vertex → edge · every edge → face · every face → cell';
  }

  function freedomParams(t) {
    const phase = t * Math.PI * 2;
    return {
      depth: .72 + .45 * (Math.sin(phase) * .5 + .5),
      taper: .38 * (Math.sin(phase * .73 + 1.2) * .5 + .5),
      twist: .92 * Math.sin(phase * .61),
    };
  }

  function drawFreedom3D(width, height, t) {
    const { depth, taper, twist } = freedomParams(t);
    const center = [width * .5, height * .46];
    const scale = Math.min(width, height) * .22;
    const rings = 11;
    const all = [];

    for (let i = 0; i < rings; i += 1) {
      const u = i / (rings - 1);
      const z = (u - .5) * 2 * depth;
      const s = 1 - taper * u;
      const a = twist * u;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const corners = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x, y]) => {
        const xx = (c * x - sn * y) * s;
        const yy = (sn * x + c * y) * s;
        return project3([xx, yy, z], center, scale);
      });
      all.push(corners);
    }

    for (let i = 0; i < rings; i += 1) {
      polygon(all[i], i === 0 ? 'rgba(216,182,98,.045)' : null, i === 0 ? GOLD : WHITE, i === 0 ? .90 : .17, i === 0 ? 1.8 : .8);
    }
    for (let corner = 0; corner < 4; corner += 1) {
      for (let i = 0; i < rings - 1; i += 1) line(all[i][corner], all[i + 1][corner], BLUE, 1, .22);
    }
    caption.textContent = 'Same square · the new dimension can be longer, shorter, tapered or twisted';
  }

  function drawFreedom4D(width, height, t) {
    const { depth, taper, twist } = freedomParams(t);
    const cx = width * .5;
    const cy = height * .46;
    const size = Math.min(width, height) * .28;
    const base = cubePoints(cx, cy, size, 1);
    const slices = 8;
    const previous = [];

    for (let i = 0; i < slices; i += 1) {
      const u = i / (slices - 1);
      const scaleFactor = (1 - taper * u) * lerp(1, .62, u * depth * .68);
      const angle = twist * u * .42;
      let points = base.map(([x, y]) => [
        cx + (x - cx) * scaleFactor + size * .07 * u * depth,
        cy + (y - cy) * scaleFactor - size * .05 * u * depth,
      ]);
      points = points.map((p) => rotatePoint(p, [cx, cy], angle));
      drawCube(points, i === 0 ? GOLD : WHITE, i === 0 ? .90 : .13, i === 0 ? 1.8 : .8);
      if (previous.length) {
        for (let v = 0; v < 8; v += 1) line(previous[v], points[v], BLUE, .8, .15);
      }
      previous.splice(0, previous.length, ...points);
    }
    caption.textContent = 'Same freedom in 4D · a cube can continue through W in many different ways';
  }

  function drawFreedom(width, height, t) {
    if (t < .5) drawFreedom3D(width, height, t * 2);
    else drawFreedom4D(width, height, (t - .5) * 2);
  }

  function drawSlices3D(width, height, t) {
    const phase = t * Math.PI * 2;
    const amp = .18 + .34 * (Math.sin(phase) * .5 + .5);
    const twist = .72 * Math.sin(phase * .71);
    const center = [width * .5, height * .46];
    const scale = Math.min(width, height) * .21;
    const rings = 13;
    const all = [];

    for (let i = 0; i < rings; i += 1) {
      const u = i / (rings - 1) * 2 - 1;
      const s = 1 - amp * Math.abs(u);
      const a = twist * u;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const corners = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x, y]) => {
        const xx = (c * x - sn * y) * s;
        const yy = (sn * x + c * y) * s;
        return project3([xx, yy, u * 1.18], center, scale);
      });
      all.push(corners);
    }

    const middle = Math.floor(rings / 2);
    all.forEach((ring, i) => polygon(
      ring,
      i === middle ? 'rgba(216,182,98,.06)' : null,
      i === middle ? GOLD : WHITE,
      i === middle ? .96 : .13,
      i === middle ? 2.2 : .8,
    ));
    for (let corner = 0; corner < 4; corner += 1) {
      for (let i = 0; i < rings - 1; i += 1) line(all[i][corner], all[i + 1][corner], BLUE, .8, .15);
    }
    caption.textContent = 'The highlighted square stays the same · the 3D object around it can change';
  }

  function drawSlices4D(width, height, t) {
    const phase = t * Math.PI * 2;
    const amp = .16 + .30 * (Math.sin(phase) * .5 + .5);
    const twist = .54 * Math.sin(phase * .77);
    const cx = width * .5;
    const cy = height * .46;
    const size = Math.min(width, height) * .27;
    const base = cubePoints(cx, cy, size, 1);
    const slices = 9;
    const middle = Math.floor(slices / 2);
    let previous = null;

    for (let i = 0; i < slices; i += 1) {
      const u = i / (slices - 1) * 2 - 1;
      const s = 1 - amp * Math.abs(u);
      const a = twist * u;
      let points = base.map(([x, y]) => [
        cx + (x - cx) * s + size * .055 * u,
        cy + (y - cy) * s - size * .04 * u,
      ]);
      points = points.map((p) => rotatePoint(p, [cx, cy], a));
      drawCube(points, i === middle ? GOLD : WHITE, i === middle ? .96 : .12, i === middle ? 2 : .8);
      if (previous) {
        for (let v = 0; v < 8; v += 1) line(previous[v], points[v], BLUE, .75, .11);
      }
      previous = points;
    }
    caption.textContent = 'The highlighted cube stays the same · the 4D object around it can change';
  }

  function drawSlices(width, height, t) {
    if (t < .5) drawSlices3D(width, height, t * 2);
    else drawSlices4D(width, height, (t - .5) * 2);
  }

  function render() {
    if (!active) return;
    const { width, height } = fitCanvas();
    ctx.clearRect(0, 0, width, height);
    if (mode === 'build') drawBuild(width, height, progress);
    else if (mode === 'freedom') drawFreedom(width, height, progress);
    else drawSlices(width, height, progress);
    timeline.value = String(progress);
  }

  function updateMarkers() {
    if (mode === 'build') {
      markers.innerHTML = '<span>0D</span><span>1D</span><span>2D</span><span>3D</span><span>4D</span>';
    } else if (mode === 'freedom') {
      markers.innerHTML = '<span>same source</span><span></span><span>many continuations</span><span></span><span>same rule in 4D</span>';
    } else {
      markers.innerHTML = '<span>3D</span><span></span><span>same slice</span><span></span><span>4D</span>';
    }
  }

  function syncPlayButton() {
    playButton.textContent = playing ? 'Ⅱ' : '▶';
    playButton.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
  }

  function setMode(nextMode) {
    mode = nextMode;
    progress = 0;
    playing = !reduceMotion;
    modesEl.querySelectorAll('.learn4d-mode').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.mode === mode);
    });
    updateMarkers();
    syncPlayButton();
    render();
  }

  modes.forEach(({ id, label }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'learn4d-mode' + (id === mode ? ' is-active' : '');
    button.dataset.mode = id;
    button.textContent = label;
    button.addEventListener('click', () => setMode(id));
    modesEl.appendChild(button);
  });

  function open() {
    if (active) return;
    active = true;
    document.body.classList.add('learn4d-active');
    progress = 0;
    playing = !reduceMotion;
    lastFrame = performance.now();
    syncPlayButton();
    updateMarkers();
    render();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function close() {
    if (!active) return;
    active = false;
    document.body.classList.remove('learn4d-active');
    cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function tick(now) {
    if (!active) return;
    const dt = Math.min(.05, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    if (playing && !scrubbing) {
      const duration = modeDurations[mode] || 10;
      progress = (progress + dt / duration) % 1;
    }
    render();
    raf = requestAnimationFrame(tick);
  }

  launch.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  playButton.addEventListener('click', () => {
    playing = !playing;
    syncPlayButton();
  });

  timeline.addEventListener('pointerdown', () => {
    scrubbing = true;
    playing = false;
    syncPlayButton();
  });
  timeline.addEventListener('input', () => {
    progress = Number(timeline.value);
    render();
  });
  const stopScrub = () => { scrubbing = false; };
  timeline.addEventListener('pointerup', stopScrub);
  timeline.addEventListener('pointercancel', stopScrub);

  window.addEventListener('resize', render, { passive: true });
  window.addEventListener('keydown', (event) => {
    if (!active) return;
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
      playing = !playing;
      syncPlayButton();
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      playing = false;
      progress = clamp(progress + (event.key === 'ArrowRight' ? .02 : -.02));
      syncPlayButton();
      render();
    }
  });
})();
