(() => {
  'use strict';

  if (window.__hypermandalaTutorialInstalled) return;
  window.__hypermandalaTutorialInstalled = true;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;

  const chapters = [
    {
      id: 'build',
      label: 'Build',
      line: 'Move the whole object in a new perpendicular direction. Every part moves with it.',
    },
    {
      id: 'parts',
      label: 'Every part',
      line: 'Vertices trace edges. Edges sweep faces. Faces sweep cells. The whole cube sweeps a 4D body.',
    },
    {
      id: 'freedom',
      label: 'Freedom',
      line: 'The regular shape is only one choice. Change the new-axis length, scale, or rotation and the higher-dimensional object changes.',
    },
    {
      id: 'slice',
      label: 'Slices',
      line: 'A slice tells you what exists here — not what exists beyond it. The same slice can belong to many different wholes.',
    },
  ];

  const style = document.createElement('style');
  style.id = 'hypermandalaInlineTutorialStyles';
  style.textContent = `
    .control-panel__actions .learn-4d-launch {
      border: 0;
      padding: 2px 0;
      background: transparent;
      color: rgba(231,211,158,.82);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .08em;
      cursor: pointer;
    }
    .control-panel__actions .learn-4d-launch:hover {
      color: rgba(250,232,181,.98);
    }

    .dimension-tour {
      position: fixed;
      inset: 0;
      z-index: 7;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 180ms ease, visibility 0s linear 180ms;
    }
    .dimension-tour.is-open {
      opacity: 1;
      visibility: visible;
      transition: opacity 180ms ease, visibility 0s;
    }
    .dimension-tour canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    }
    .dimension-tour__title {
      position: absolute;
      top: max(23px, env(safe-area-inset-top));
      left: 50%;
      transform: translateX(-50%);
      color: rgba(245,246,248,.54);
      font-size: 9px;
      font-weight: 760;
      letter-spacing: .12em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .dimension-tour__stage-label {
      position: absolute;
      top: max(54px, calc(env(safe-area-inset-top) + 42px));
      left: 50%;
      transform: translateX(-50%);
      color: rgba(245,239,225,.90);
      font-size: 13px;
      font-weight: 720;
      letter-spacing: .035em;
      white-space: nowrap;
    }
    .dimension-tour__close {
      position: absolute;
      top: max(17px, env(safe-area-inset-top));
      right: max(19px, env(safe-area-inset-right));
      pointer-events: auto;
      min-width: 44px;
      height: 34px;
      padding: 0 10px;
      border: 1px solid rgba(255,255,255,.09);
      border-radius: 10px;
      background: rgba(12,14,17,.72);
      color: rgba(245,246,248,.62);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      cursor: pointer;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .055em;
      text-transform: uppercase;
    }
    .dimension-tour__close:hover {
      background: rgba(255,255,255,.08);
      color: rgba(245,246,248,.95);
    }
    .dimension-tour__bar {
      position: absolute;
      left: 50%;
      bottom: max(22px, env(safe-area-inset-bottom));
      transform: translateX(-50%);
      width: min(680px, calc(100vw - 32px));
      pointer-events: auto;
      text-align: center;
    }
    .dimension-tour__tabs {
      display: inline-grid;
      grid-template-columns: repeat(4, minmax(92px, 1fr));
      gap: 3px;
      padding: 4px;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 13px;
      background: rgba(10,12,15,.76);
      backdrop-filter: blur(16px) saturate(120%);
      -webkit-backdrop-filter: blur(16px) saturate(120%);
    }
    .dimension-tour__tab {
      min-height: 34px;
      padding: 0 12px;
      border: 0;
      border-radius: 9px;
      background: transparent;
      color: rgba(238,239,242,.40);
      cursor: pointer;
      font-size: 9px;
      font-weight: 740;
      letter-spacing: .045em;
    }
    .dimension-tour__tab:hover {
      color: rgba(238,239,242,.82);
    }
    .dimension-tour__tab.is-active {
      background: rgba(255,255,255,.085);
      color: rgba(249,249,247,.96);
    }
    .dimension-tour__copy {
      min-height: 34px;
      margin: 9px auto 0;
      color: rgba(232,234,238,.52);
      font-size: 11px;
      line-height: 1.45;
      text-wrap: balance;
    }
    .dimension-tour__hint {
      margin-top: 3px;
      color: rgba(225,227,230,.25);
      font-size: 8px;
      letter-spacing: .055em;
      text-transform: uppercase;
    }

    body.learn-4d-mode #mandala,
    body.learn-4d-mode #solidLayer {
      opacity: .08;
      pointer-events: none;
      transition: opacity 180ms ease;
    }
    body.learn-4d-mode .control-panel,
    body.learn-4d-mode .mandala-dock,
    body.learn-4d-mode .dimension-switcher,
    body.learn-4d-mode .mobile-panel-switcher,
    body.learn-4d-mode .dimension-readout,
    body.learn-4d-mode .basis-gizmo,
    body.learn-4d-mode .hint,
    body.learn-4d-mode .source,
    body.learn-4d-mode .about-panel {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      transition: opacity 150ms ease, visibility 0s linear 150ms !important;
    }

    @media (max-width: 680px) {
      .dimension-tour__title { font-size: 8px; }
      .dimension-tour__stage-label {
        top: max(48px, calc(env(safe-area-inset-top) + 38px));
        font-size: 11px;
      }
      .dimension-tour__bar {
        bottom: max(12px, env(safe-area-inset-bottom));
        width: calc(100vw - 20px);
      }
      .dimension-tour__tabs {
        width: 100%;
        grid-template-columns: repeat(4, 1fr);
      }
      .dimension-tour__tab {
        min-width: 0;
        padding: 0 5px;
        font-size: 8px;
      }
      .dimension-tour__copy {
        max-width: 92vw;
        font-size: 10px;
      }
    }
  `;
  document.head.appendChild(style);

  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'learn-4d-launch';
  launch.textContent = 'Learn 4D';
  launch.title = 'See how dimensions grow';
  document.querySelector('.control-panel__actions')?.prepend(launch);

  const tour = document.createElement('div');
  tour.className = 'dimension-tour';
  tour.innerHTML = `
    <canvas aria-hidden="true"></canvas>
    <div class="dimension-tour__title">Dimension builder</div>
    <div class="dimension-tour__stage-label"></div>
    <button type="button" class="dimension-tour__close" aria-label="Exit Learn 4D">Exit</button>
    <div class="dimension-tour__bar">
      <div class="dimension-tour__tabs" role="tablist" aria-label="Learn 4D concepts"></div>
      <div class="dimension-tour__copy"></div>
      <div class="dimension-tour__hint">automatic animation · click a concept · Esc exits</div>
    </div>
  `;
  document.body.appendChild(tour);

  const canvas = tour.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const labelEl = tour.querySelector('.dimension-tour__stage-label');
  const tabsEl = tour.querySelector('.dimension-tour__tabs');
  const copyEl = tour.querySelector('.dimension-tour__copy');
  const closeButton = tour.querySelector('.dimension-tour__close');

  const C = {
    text: 'rgba(246,247,249,.92)',
    faint: 'rgba(226,229,235,.25)',
    source: 'rgba(226,229,235,.44)',
    gold: 'rgba(231,194,100,.94)',
    goldSoft: 'rgba(231,194,100,.10)',
    blue: 'rgba(108,168,255,.66)',
    green: 'rgba(98,212,139,.70)',
  };

  let isOpen = false;
  let chapterIndex = 0;
  let startedAt = performance.now();
  let rafId = 0;

  function ease(t) {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  }

  function line(a, b, color = C.text, width = 1.4, alpha = 1) {
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

  function dot(p, radius = 4, color = C.text, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p[0], p[1], radius, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function poly(points, fill = null, stroke = C.text, alpha = 1, width = 1.2) {
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

  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = innerWidth;
    const height = innerHeight;
    const pw = Math.max(1, Math.round(width * dpr));
    const ph = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return [width, height];
  }

  function cubeVertices(size = 1) {
    const out = [];
    for (let z = 0; z < 2; z += 1) {
      for (let y = 0; y < 2; y += 1) {
        for (let x = 0; x < 2; x += 1) {
          out.push([(x - .5) * size, (y - .5) * size, (z - .5) * size]);
        }
      }
    }
    return out;
  }

  const cubeEdges = [
    [0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],
    [4,5],[4,6],[5,7],[6,7],
  ];

  const cubeFaces = [
    [0,2,6,4], [1,5,7,3],
    [0,4,5,1], [2,3,7,6],
    [0,1,3,2], [4,6,7,5],
  ];

  function project3(v, center, scale, rotation = 0) {
    let [x, y, z] = v;
    if (rotation) {
      const c0 = Math.cos(rotation);
      const s0 = Math.sin(rotation);
      [x, y] = [c0 * x - s0 * y, s0 * x + c0 * y];
    }
    const yaw = -.72;
    const pitch = .52;
    let c = Math.cos(yaw);
    let s = Math.sin(yaw);
    [x, z] = [c * x - s * z, s * x + c * z];
    c = Math.cos(pitch);
    s = Math.sin(pitch);
    [y, z] = [c * y - s * z, s * y + c * z];
    const f = 5 / (5 - z);
    return [center[0] + x * scale * f, center[1] + y * scale * f, z];
  }

  function project4(v, center, scale) {
    const q = [...v];
    const rotate = (a, b, angle) => {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const na = c * q[a] - s * q[b];
      const nb = s * q[a] + c * q[b];
      q[a] = na;
      q[b] = nb;
    };
    rotate(0, 3, .52);
    rotate(1, 3, -.30);
    rotate(2, 3, .20);
    rotate(0, 2, -.52);
    rotate(1, 2, .34);
    const wf = 5 / (5 - q[3]);
    return project3([q[0] * wf, q[1] * wf, q[2] * wf], center, scale);
  }

  function drawCube(points, color = C.text, alpha = .8, width = 1.4) {
    cubeEdges.forEach(([a, b]) => line(points[a], points[b], color, width, alpha));
  }

  function stageTiming(elapsed, durations) {
    const total = durations.reduce((a, b) => a + b, 0);
    let t = ((elapsed % total) + total) % total;
    for (let i = 0; i < durations.length; i += 1) {
      if (t < durations[i]) return [i, t / durations[i]];
      t -= durations[i];
    }
    return [durations.length - 1, 1];
  }

  function drawBuild(width, height, elapsed) {
    const durations = [3000, 3200, 3400, 4300];
    const [stage, raw] = stageTiming(elapsed, durations);
    const hold = .14;
    const local = raw < hold ? 0 : raw > 1 - hold ? 1 : ease((raw - hold) / (1 - hold * 2));
    const center = [width * .5, height * .47];
    const base = Math.min(width, height) * .245;
    const stageNames = ['POINT → LINE', 'LINE → SQUARE', 'SQUARE → CUBE', 'CUBE → TESSERACT'];
    labelEl.textContent = stageNames[stage];

    if (stage === 0) {
      const a = [center[0] - base * .62, center[1]];
      const b = [a[0] + base * 1.24 * local, center[1]];
      line(a, b, C.gold, 3.2, .92);
      dot(a, 5, C.source);
      dot(b, 5.2, C.text);
      return;
    }

    if (stage === 1) {
      const half = base * .56;
      const dx = base * 1.12 * local;
      const x = center[0] - base * .56;
      const a = [x, center[1] - half];
      const b = [x, center[1] + half];
      const c = [x + dx, center[1] + half];
      const d = [x + dx, center[1] - half];
      poly([a, b, c, d], C.goldSoft, C.gold, .92, 1.4);
      line(a, b, C.source, 2.4, .82);
      line(d, c, C.text, 2.4, .94);
      [a, b].forEach((p) => dot(p, 4.2, C.source));
      [c, d].forEach((p) => dot(p, 4.2, C.text));
      return;
    }

    if (stage === 2) {
      const verts = cubeVertices(1.35).map(([x, y, z]) => [x, y, z * local]);
      const p = verts.map((v) => project3(v, center, base * .82));
      cubeFaces.forEach((face) => poly(face.map((i) => p[i]), 'rgba(231,194,100,.035)', 'rgba(231,194,100,.20)', .58, 1));
      cubeEdges.forEach(([a, b]) => {
        const newEdge = Math.abs(verts[a][2] - verts[b][2]) > .01;
        line(p[a], p[b], newEdge ? C.gold : C.text, newEdge ? 2.3 : 1.5, newEdge ? .95 : .74);
      });
      p.forEach((q, i) => dot(q, 3, i < 4 ? C.source : C.text, .9));
      return;
    }

    const cube = cubeVertices(1.30);
    const w = .66 * local;
    const p = [
      ...cube.map((v) => project4([v[0], v[1], v[2], -w], center, base * .80)),
      ...cube.map((v) => project4([v[0], v[1], v[2], w], center, base * .80)),
    ];
    cubeEdges.forEach(([a, b]) => {
      line(p[a], p[b], C.source, 1.3, .55);
      line(p[a + 8], p[b + 8], C.text, 1.55, .90);
    });
    for (let i = 0; i < 8; i += 1) line(p[i], p[i + 8], C.gold, 2.3, .92);
    p.forEach((q, i) => dot(q, 2.8, i < 8 ? C.source : C.text, .88));
  }

  function tesseract(width, height) {
    const center = [width * .5, height * .47];
    const scale = Math.min(width, height) * .20;
    const cube = cubeVertices(1.34);
    const all = [
      ...cube.map((v) => [...v, -.68]),
      ...cube.map((v) => [...v, .68]),
    ];
    return { center, cube, p: all.map((v) => project4(v, center, scale)) };
  }

  function drawParts(width, height, elapsed) {
    const { center, p } = tesseract(width, height);
    const modes = ['vertices', 'edges', 'faces', 'whole'];
    const mode = modes[Math.floor(elapsed / 2600) % modes.length];
    const names = {
      vertices: 'EVERY VERTEX TRACES AN EDGE',
      edges: 'EVERY EDGE SWEEPS A FACE',
      faces: 'EVERY FACE SWEEPS A CUBE',
      whole: 'THE WHOLE CUBE SWEEPS A 4D BODY',
    };
    labelEl.textContent = names[mode];

    cubeEdges.forEach(([a, b]) => {
      line(p[a], p[b], C.source, 1.1, .22);
      line(p[a + 8], p[b + 8], C.text, 1.2, .28);
    });
    for (let i = 0; i < 8; i += 1) line(p[i], p[i + 8], C.gold, 1.3, .24);

    if (mode === 'vertices') {
      for (let i = 0; i < 8; i += 1) {
        line(p[i], p[i + 8], C.gold, 3.1, 1);
        dot(p[i], 4.2, C.source);
        dot(p[i + 8], 4.2, C.gold);
      }
      return;
    }

    if (mode === 'edges') {
      cubeEdges.forEach(([a, b]) => {
        poly([p[a], p[b], p[b + 8], p[a + 8]], 'rgba(108,168,255,.055)', C.blue, .74, 1.2);
      });
      return;
    }

    if (mode === 'faces') {
      const faceIndex = Math.floor(elapsed / 850) % cubeFaces.length;
      const face = cubeFaces[faceIndex];
      const a = face.map((i) => p[i]);
      const b = face.map((i) => p[i + 8]);
      poly(a, 'rgba(98,212,139,.05)', C.green, .95, 2);
      poly(b, 'rgba(98,212,139,.05)', C.green, .95, 2);
      face.forEach((i) => line(p[i], p[i + 8], C.green, 2.2, .95));
      return;
    }

    cubeEdges.forEach(([a, b]) => {
      line(p[a], p[b], C.source, 1.8, .72);
      line(p[a + 8], p[b + 8], C.text, 1.9, .9);
    });
    for (let i = 0; i < 8; i += 1) line(p[i], p[i + 8], C.gold, 2.5, .95);
    dot(center, 2.5, C.gold, .7);
  }

  function drawSquareContinuation(width, height, elapsed, sliceMode = false) {
    const center = [width * .5, height * .47];
    const base = Math.min(width, height) * .19;
    const phase = (elapsed / 1000) % 12;
    const modeIndex = Math.floor(phase / 4) % 3;
    const mode = ['length', 'taper', 'twist'][modeIndex];
    const phaseT = (phase % 4) / 4;
    const pulse = .5 - .5 * Math.cos(phaseT * TAU);
    const rings = [];
    const steps = 10;

    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const signed = t * 2 - 1;
      const u = sliceMode ? Math.abs(signed) : t;
      let scale = 1;
      let angle = 0;
      let depth = 1;

      if (mode === 'length') depth = .45 + 1.10 * pulse;
      if (mode === 'taper') scale = 1 - u * (.12 + .46 * pulse);
      if (mode === 'twist') angle = (sliceMode ? signed : t) * (.15 + .95 * pulse);

      const z = (sliceMode ? signed : (t - .5) * 2) * 1.24 * depth;
      const s = .74 * scale;
      const corners = [[-s,-s],[s,-s],[s,s],[-s,s]].map(([x, y]) => {
        const c = Math.cos(angle);
        const sn = Math.sin(angle);
        return [c * x - sn * y, sn * x + c * y, z];
      });
      rings.push(corners.map((v) => project3(v, center, base)));
    }

    const highlight = sliceMode ? Math.floor(steps / 2) : 0;
    rings.forEach((ring, i) => {
      const isHighlight = i === highlight;
      poly(
        ring,
        isHighlight ? C.goldSoft : null,
        isHighlight ? C.gold : 'rgba(226,229,235,.20)',
        isHighlight ? 1 : .42,
        isHighlight ? 2.4 : 1,
      );
    });
    for (let k = 0; k < 4; k += 1) {
      for (let i = 0; i < rings.length - 1; i += 1) {
        line(rings[i][k], rings[i + 1][k], mode === 'length' ? C.faint : C.blue, 1.1, .46);
      }
    }

    if (sliceMode) {
      const names = {
        length: 'SAME SQUARE SLICE · DIFFERENT DEPTH',
        taper: 'SAME SQUARE SLICE · DIFFERENT OUTSIDE SHAPE',
        twist: 'SAME SQUARE SLICE · DIFFERENT TWIST',
      };
      labelEl.textContent = names[mode];
    } else {
      const names = {
        length: 'SAME SQUARE · DIFFERENT NEW-AXIS LENGTH',
        taper: 'SAME SQUARE · TAPER AS IT MOVES',
        twist: 'SAME SQUARE · ROTATE AS IT MOVES',
      };
      labelEl.textContent = names[mode];
    }
  }

  function drawCubeSlice4D(width, height, elapsed) {
    const center = [width * .5, height * .47];
    const base = Math.min(width, height) * .15;
    const cube = cubeVertices(1.16);
    const pulse = .5 - .5 * Math.cos((elapsed / 4200) * TAU);
    const twist = .12 + .72 * pulse;
    const slices = [];
    const steps = 8;

    for (let i = 0; i <= steps; i += 1) {
      const signed = (i / steps) * 2 - 1;
      const w = signed * .86;
      const angle = signed * twist;
      const scale = 1 - .20 * Math.abs(signed) * pulse;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const verts = cube.map(([x, y, z]) => {
        const sx = x * scale;
        const sy = y * scale;
        return [c * sx - s * sy, s * sx + c * sy, z * scale, w];
      });
      const p = verts.map((v) => project4(v, center, base));
      slices.push(p);
      const isMid = i === Math.floor(steps / 2);
      drawCube(p, isMid ? C.gold : C.faint, isMid ? .95 : .28, isMid ? 2 : 1);
    }
    for (let i = 0; i < slices.length - 1; i += 1) {
      for (let v = 0; v < 8; v += 1) line(slices[i][v], slices[i + 1][v], C.blue, 1, .25);
    }
    labelEl.textContent = 'SAME CUBE SLICE · DIFFERENT 4D CONTINUATION';
  }

  function drawFreedom(width, height, elapsed) {
    drawSquareContinuation(width, height, elapsed, false);
  }

  function drawSlices(width, height, elapsed) {
    const block = Math.floor(elapsed / 7200) % 2;
    const local = elapsed % 7200;
    if (block === 0) drawSquareContinuation(width, height, local, true);
    else drawCubeSlice4D(width, height, local);
  }

  function render(now) {
    if (!isOpen) return;
    const [width, height] = fitCanvas();
    ctx.clearRect(0, 0, width, height);
    const elapsed = reduceMotion ? 3200 : now - startedAt;
    const chapter = chapters[chapterIndex].id;

    if (chapter === 'build') drawBuild(width, height, elapsed);
    else if (chapter === 'parts') drawParts(width, height, elapsed);
    else if (chapter === 'freedom') drawFreedom(width, height, elapsed);
    else drawSlices(width, height, elapsed);

    rafId = requestAnimationFrame(render);
  }

  function setChapter(index) {
    chapterIndex = index;
    startedAt = performance.now();
    tabsEl.querySelectorAll('.dimension-tour__tab').forEach((button, i) => {
      button.classList.toggle('is-active', i === index);
      button.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
    copyEl.textContent = chapters[index].line;
  }

  chapters.forEach((chapter, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dimension-tour__tab' + (index === 0 ? ' is-active' : '');
    button.textContent = chapter.label;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    button.addEventListener('click', () => setChapter(index));
    tabsEl.appendChild(button);
  });
  copyEl.textContent = chapters[0].line;

  function openTour() {
    if (isOpen) return;
    isOpen = true;
    startedAt = performance.now();
    document.body.classList.add('learn-4d-mode');
    tour.classList.add('is-open');
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(render);
    closeButton.focus({ preventScroll: true });
  }

  function closeTour() {
    if (!isOpen) return;
    isOpen = false;
    cancelAnimationFrame(rafId);
    tour.classList.remove('is-open');
    document.body.classList.remove('learn-4d-mode');
    launch.focus({ preventScroll: true });
  }

  launch.addEventListener('click', openTour);
  closeButton.addEventListener('click', closeTour);
  window.addEventListener('resize', () => {
    if (isOpen) startedAt = performance.now();
  }, { passive: true });
  window.addEventListener('keydown', (event) => {
    if (!isOpen) return;
    if (event.key === 'Escape') closeTour();
    if (event.key === 'ArrowRight') setChapter((chapterIndex + 1) % chapters.length);
    if (event.key === 'ArrowLeft') setChapter((chapterIndex + chapters.length - 1) % chapters.length);
  });
})();
