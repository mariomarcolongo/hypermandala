/*
 * Hypermandala — geometric mandala/temple explorer across 2D, 3D and 4D.
 * Copyright (C) 2026 Mario Marcolongo and contributors.
 * Licensed under GNU AGPL v3 or later. See ../LICENSE.
 */

(() => {
  'use strict';

  const canvas = document.getElementById('mandala');
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  const dimensionValue = document.getElementById('dimensionValue');
  const dimensionStatus = document.getElementById('dimensionStatus');
  const axisRows = document.getElementById('axisRows');
  const resetPosition = document.getElementById('resetPosition');
  const resetView = document.getElementById('resetView');
  const hint = document.getElementById('hint');
  const dimensionButtons = [...document.querySelectorAll('[data-dimension]')];

  const TAU = Math.PI * 2;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AXES = [
    { key: 'x', label: 'X', color: '#ff6d6d', minDim: 2 },
    { key: 'y', label: 'Y', color: '#65d98b', minDim: 2 },
    { key: 'z', label: 'Z', color: '#69a8ff', minDim: 3 },
    { key: 'w', label: 'W', color: '#d995ff', minDim: 4 },
  ];

  const baseEdges = [];
  const hyperEdges = [];
  const state = {
    dimension: 2,
    renderDimension: 2,
    transition: null,
    position: { x: 0, y: 0, z: 0, w: 0 },
    zoom: 1,
    rotX: -0.72,
    rotY: 0.48,
    rotZ: 0,
    hyperXW: 0.48,
    hyperYW: -0.34,
    hyperZW: 0.22,
    pointerDown: false,
    pointerX: 0,
    pointerY: 0,
    width: innerWidth,
    height: innerHeight,
    dpr: 1,
    lastTime: performance.now(),
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (t) => {
    t = clamp(t, 0, 1);
    return t < 0.5 ? 16 * t ** 5 : 1 - ((-2 * t + 2) ** 5) / 2;
  };

  function v(x, y, z = 0, w = 0) { return { x, y, z, w }; }
  function addEdge(a, b, tone = 0, weight = 1, target = baseEdges) { target.push({ a, b, tone, weight }); }

  function squareVertices(size, z, rotation = 0, w = 0) {
    const half = size / 2;
    const corners = [v(-half, -half, z, w), v(half, -half, z, w), v(half, half, z, w), v(-half, half, z, w)];
    if (rotation === 0) return corners;
    const c = Math.cos(rotation), s = Math.sin(rotation);
    return corners.map((p) => v(p.x * c - p.y * s, p.x * s + p.y * c, p.z, p.w));
  }

  function polygonVertices(radius, sides, z, rotation = 0, w = 0) {
    return Array.from({ length: sides }, (_, i) => {
      const a = rotation + (i / sides) * TAU;
      return v(Math.cos(a) * radius, Math.sin(a) * radius, z, w);
    });
  }

  function connectLoop(vertices, tone = 0, weight = 1, target = baseEdges) {
    for (let i = 0; i < vertices.length; i += 1) addEdge(vertices[i], vertices[(i + 1) % vertices.length], tone, weight, target);
  }

  function connectRings(a, b, every = 1, tone = 0, weight = 1, target = baseEdges) {
    const count = Math.min(a.length, b.length);
    for (let i = 0; i < count; i += every) addEdge(a[i], b[i], tone, weight, target);
  }

  function buildTempleMandala3D() {
    baseEdges.length = 0;
    const terraces = [
      { size: 1.9, z: 0.00 },
      { size: 1.62, z: 0.08 },
      { size: 1.34, z: 0.18 },
      { size: 1.08, z: 0.31 },
      { size: 0.82, z: 0.47 },
      { size: 0.58, z: 0.65 },
      { size: 0.36, z: 0.84 },
    ];

    const squareLoops = terraces.map((t, i) => squareVertices(t.size, t.z, i % 2 ? Math.PI / 4 : 0));
    squareLoops.forEach((loop, i) => connectLoop(loop, i / squareLoops.length, i === 0 ? 1.4 : 1));
    for (let i = 0; i < squareLoops.length - 1; i += 1) connectRings(squareLoops[i], squareLoops[i + 1], 1, i / squareLoops.length, 0.75);

    // Cardinal temple axes / gateways in the ground plan.
    const gateDepths = [1.08, 0.86, 0.64];
    for (const d of gateDepths) {
      const hw = d * 0.17;
      const outer = 1.10;
      const inner = 0.78;
      [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy], idx) => {
        const tx = -dy, ty = dx;
        const p1 = v(dx * outer + tx * hw, dy * outer + ty * hw, 0);
        const p2 = v(dx * inner + tx * hw, dy * inner + ty * hw, 0);
        const p3 = v(dx * inner - tx * hw, dy * inner - ty * hw, 0);
        const p4 = v(dx * outer - tx * hw, dy * outer - ty * hw, 0);
        connectLoop([p1, p2, p3, p4], 0.12 + idx * 0.03, 0.8);
      });
    }

    // Concentric octagons and diagonals create a stricter geometric mandala plan.
    [0.82, 0.58, 0.39].forEach((r, i) => {
      const oct = polygonVertices(r, 8, terraces[Math.min(i + 1, terraces.length - 1)].z * 0.35, Math.PI / 8);
      connectLoop(oct, 0.35 + i * 0.08, 0.8);
      for (let j = 0; j < 4; j += 1) addEdge(oct[j], oct[j + 4], 0.4, 0.55);
    });

    // Central shrine / tower.
    const tower = [
      { s: 0.34, z: 0.84 },
      { s: 0.27, z: 1.01 },
      { s: 0.20, z: 1.17 },
      { s: 0.13, z: 1.32 },
    ].map((t, i) => squareVertices(t.s, t.z, i % 2 ? Math.PI / 4 : 0));
    tower.forEach((loop, i) => connectLoop(loop, 0.72 + i * 0.05, 1.1));
    for (let i = 0; i < tower.length - 1; i += 1) connectRings(tower[i], tower[i + 1], 1, 0.76, 0.9);
    tower[tower.length - 1].forEach((p) => addEdge(p, v(0, 0, 1.52), 0.92, 1.15));

    // Four subsidiary shrines preserve cardinal symmetry.
    const centers = [[0.57, 0], [0, 0.57], [-0.57, 0], [0, -0.57]];
    for (const [cx, cy] of centers) {
      const low = squareVertices(0.24, 0.39, Math.PI / 4).map((p) => v(p.x + cx, p.y + cy, p.z));
      const high = squareVertices(0.16, 0.61, 0).map((p) => v(p.x + cx, p.y + cy, p.z));
      connectLoop(low, 0.57, 0.9);
      connectLoop(high, 0.64, 0.9);
      connectRings(low, high, 1, 0.61, 0.7);
      high.forEach((p) => addEdge(p, v(cx, cy, 0.78), 0.68, 0.9));
    }

    // Ground-plane radial construction lines.
    for (let i = 0; i < 16; i += 1) {
      const a = (i / 16) * TAU;
      addEdge(v(Math.cos(a) * 0.18, Math.sin(a) * 0.18, 0), v(Math.cos(a) * 0.94, Math.sin(a) * 0.94, 0), 0.18, 0.45);
    }
  }

  function build4DExtrusion() {
    hyperEdges.length = 0;
    const layers = [-0.34, 0, 0.34];
    for (const w of layers) {
      for (const e of baseEdges) {
        addEdge(v(e.a.x, e.a.y, e.a.z, w), v(e.b.x, e.b.y, e.b.z, w), e.tone, e.weight * (w === 0 ? 1 : 0.66), hyperEdges);
      }
    }

    // Connect a sparse set of matching 3D vertices through W so the fourth axis is legible.
    const anchors = [];
    for (const e of baseEdges) {
      if (anchors.length >= 120) break;
      if ((Math.round((Math.abs(e.a.x) + Math.abs(e.a.y) + e.a.z) * 100) % 7) === 0) anchors.push(e.a);
    }
    for (const p of anchors) {
      addEdge(v(p.x, p.y, p.z, layers[0]), v(p.x, p.y, p.z, layers[2]), 0.96, 0.48, hyperEdges);
    }
  }

  function rotatePair(a, b, angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [a * c - b * s, a * s + b * c];
  }

  function activation() {
    const d = state.renderDimension;
    return {
      z: ease(clamp(d - 2, 0, 1)),
      w: ease(clamp(d - 3, 0, 1)),
    };
  }

  function projectPoint(point, includeObjectPosition = true) {
    const { z: zAmount, w: wAmount } = activation();
    const pos = includeObjectPosition ? state.position : { x: 0, y: 0, z: 0, w: 0 };
    let x = point.x + pos.x;
    let y = point.y + pos.y;
    let z = (point.z + pos.z) * zAmount;
    let w = (point.w + pos.w) * wAmount;

    if (wAmount > 0.0001) {
      let pair = rotatePair(x, w, state.hyperXW * wAmount); x = pair[0]; w = pair[1];
      pair = rotatePair(y, w, state.hyperYW * wAmount); y = pair[0]; w = pair[1];
      pair = rotatePair(z, w, state.hyperZW * wAmount); z = pair[0]; w = pair[1];
      const p4 = 3.35 / Math.max(1.7, 3.35 - w);
      x *= p4; y *= p4; z *= p4;
    }

    const rx = state.rotX * zAmount;
    const ry = state.rotY * zAmount;
    let pair = rotatePair(y, z, rx); y = pair[0]; z = pair[1];
    pair = rotatePair(x, z, ry); x = pair[0]; z = pair[1];
    pair = rotatePair(x, y, state.rotZ); x = pair[0]; y = pair[1];

    const camera = 4.4;
    const p3 = camera / Math.max(2.35, camera - z);
    const scale = Math.min(state.width, state.height) * 0.305 * state.zoom;
    return {
      x: state.width * 0.5 + x * p3 * scale,
      y: state.height * 0.45 + y * p3 * scale,
      z,
      w,
      p3,
    };
  }

  function drawLine(a, b, stroke, width, alpha = 1) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = stroke;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawWorldAxes() {
    const { z: zAmount, w: wAmount } = activation();
    const axes = [
      { key: 'x', color: '#ff6d6d', end: v(1.34, 0, 0, 0), neg: v(-1.34, 0, 0, 0), active: true },
      { key: 'y', color: '#65d98b', end: v(0, 1.34, 0, 0), neg: v(0, -1.34, 0, 0), active: true },
      { key: 'z', color: '#69a8ff', end: v(0, 0, 1.55, 0), neg: v(0, 0, -0.5, 0), active: zAmount > 0.02 },
      { key: 'w', color: '#d995ff', end: v(0, 0, 0, 1.05), neg: v(0, 0, 0, -1.05), active: wAmount > 0.02 },
    ];

    ctx.save();
    ctx.lineCap = 'round';
    for (const axis of axes) {
      if (!axis.active) continue;
      const a = projectPoint(axis.neg, false);
      const b = projectPoint(axis.end, false);
      drawLine(a, b, axis.color, 1.15, 0.42);
      ctx.fillStyle = axis.color;
      ctx.globalAlpha = 0.9;
      ctx.font = '700 11px Inter, ui-sans-serif, sans-serif';
      ctx.fillText(axis.key.toUpperCase(), b.x + 6, b.y - 5);
      ctx.globalAlpha = 1;
    }
    const o = projectPoint(v(0, 0, 0, 0), false);
    ctx.beginPath(); ctx.arc(o.x, o.y, 2.1, 0, TAU); ctx.fillStyle = 'rgba(250,246,236,.75)'; ctx.fill();
    ctx.restore();
  }

  function drawEdgeSet(edges, opacityScale, wAmount) {
    if (opacityScale <= 0.001) return;
    const projected = edges.map((edge) => {
      const a = projectPoint(edge.a, true);
      const b = projectPoint(edge.b, true);
      return { edge, a, b, depth: (a.z + b.z) * 0.5, hyper: (Math.abs(a.w) + Math.abs(b.w)) * 0.5 };
    }).sort((a, b) => a.depth - b.depth);

    for (const item of projected) {
      const depth = clamp((item.depth + 0.75) / 2.5, 0, 1);
      const tone = item.edge.tone;
      const light = 66 + tone * 17 + depth * 8;
      const alpha = opacityScale * (0.28 + depth * 0.58) * (1 - item.hyper * 0.1);
      const hue = mix(39, 51, tone) + wAmount * item.hyper * 18;
      drawLine(item.a, item.b, 'hsla(' + hue + ', 48%, ' + light + '%, 1)', (0.58 + depth * 0.72) * item.edge.weight, alpha);
    }
  }

  function drawGeometry() {
    const { w: wAmount } = activation();
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawEdgeSet(baseEdges, 1 - wAmount, wAmount);
    drawEdgeSet(hyperEdges, wAmount, wAmount);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, state.width, state.height);
    const r = Math.min(state.width, state.height) * 0.42;
    const g = ctx.createRadialGradient(state.width * .5, state.height * .44, 0, state.width * .5, state.height * .44, r);
    g.addColorStop(0, 'rgba(166,125,63,.055)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, state.width, state.height);
    drawWorldAxes();
    drawGeometry();
  }

  function makeAxisControls() {
    for (const axis of AXES) {
      const row = document.createElement('label');
      row.className = 'axis-row';
      row.style.setProperty('--axis-color', axis.color);
      row.dataset.axis = axis.key;

      const label = document.createElement('span');
      label.className = 'axis-row__label';
      label.textContent = axis.label;

      const input = document.createElement('input');
      input.type = 'range';
      input.min = '-1.2';
      input.max = '1.2';
      input.step = '0.01';
      input.value = '0';
      input.setAttribute('aria-label', 'Move along ' + axis.label + ' axis');

      const value = document.createElement('span');
      value.className = 'axis-row__value';
      value.textContent = '0.00';

      input.addEventListener('input', () => {
        state.position[axis.key] = Number(input.value);
        value.textContent = Number(input.value).toFixed(2);
        hideHint();
      });

      row.append(label, input, value);
      axisRows.append(row);
      axis.row = row;
      axis.input = input;
      axis.valueEl = value;
    }
  }

  function updateAxisAvailability() {
    const effectiveDim = state.transition ? Math.max(state.transition.from, state.transition.to) : state.dimension;
    for (const axis of AXES) {
      const enabled = effectiveDim >= axis.minDim && !state.transition;
      axis.input.disabled = !enabled;
      axis.row.classList.toggle('is-disabled', !enabled);
    }
  }

  function resetObjectPosition() {
    for (const axis of AXES) {
      state.position[axis.key] = 0;
      axis.input.value = '0';
      axis.valueEl.textContent = '0.00';
    }
  }

  function startDimensionTransition(target) {
    target = Number(target);
    if (![2, 3, 4].includes(target) || target === state.dimension || state.transition) return;
    const from = state.renderDimension;
    state.transition = { from, to: target, start: performance.now(), duration: reducedMotion ? 80 : 1900 };
    dimensionButtons.forEach((button) => button.classList.toggle('is-target', Number(button.dataset.dimension) === target));
    updateAxisAvailability();
    hideHint();
  }

  function updateDimensionUI() {
    if (state.transition) {
      dimensionValue.textContent = Math.round(state.transition.from) + 'D → ' + state.transition.to + 'D';
      dimensionStatus.textContent = 'transforming';
    } else {
      dimensionValue.textContent = state.dimension + 'D';
      dimensionStatus.textContent = state.dimension === 2 ? 'plan' : state.dimension === 3 ? 'temple' : 'hyperspace';
    }

    dimensionButtons.forEach((button) => {
      const d = Number(button.dataset.dimension);
      button.classList.toggle('is-active', !state.transition && d === state.dimension);
      button.disabled = Boolean(state.transition);
    });
  }

  function resetCamera() {
    state.zoom = 1;
    state.rotX = -0.72;
    state.rotY = 0.48;
    state.rotZ = 0;
    state.hyperXW = 0.48;
    state.hyperYW = -0.34;
    state.hyperZW = 0.22;
  }

  function hideHint() { hint.classList.add('is-hidden'); }

  function resize() {
    state.width = innerWidth;
    state.height = innerHeight;
    state.dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    canvas.style.width = state.width + 'px';
    canvas.style.height = state.height + 'px';
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  dimensionButtons.forEach((button) => button.addEventListener('click', () => startDimensionTransition(button.dataset.dimension)));
  resetPosition.addEventListener('click', () => { resetObjectPosition(); hideHint(); });
  resetView.addEventListener('click', () => { resetCamera(); hideHint(); });

  canvas.addEventListener('pointerdown', (event) => {
    state.pointerDown = true;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    hideHint();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!state.pointerDown) return;
    const dx = event.clientX - state.pointerX;
    const dy = event.clientY - state.pointerY;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    const { z: zAmount, w: wAmount } = activation();
    if (zAmount < 0.04) {
      state.rotZ += dx * 0.006;
      return;
    }
    if (wAmount > 0.04 && event.shiftKey) {
      state.hyperXW += dx * 0.004;
      state.hyperYW += dy * 0.004;
    } else {
      state.rotY += dx * 0.0048;
      state.rotX += dy * 0.0048;
    }
  });
  function pointerUp(event) {
    state.pointerDown = false;
    if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  }
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    state.zoom = clamp(state.zoom * Math.exp(-event.deltaY * 0.0011), 0.55, 1.75);
    hideHint();
  }, { passive: false });
  canvas.addEventListener('dblclick', resetCamera);
  window.addEventListener('resize', resize, { passive: true });

  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === '2' || event.key === '3' || event.key === '4') startDimensionTransition(Number(event.key));
    if (event.key.toLowerCase() === 'c') resetObjectPosition();
    if (event.key.toLowerCase() === 'r') resetCamera();
  });

  function tick(now) {
    const dt = Math.min(0.05, (now - state.lastTime) / 1000);
    state.lastTime = now;
    void dt;

    if (state.transition) {
      const t = clamp((now - state.transition.start) / state.transition.duration, 0, 1);
      state.renderDimension = mix(state.transition.from, state.transition.to, ease(t));
      if (t >= 1) {
        state.dimension = state.transition.to;
        state.renderDimension = state.dimension;
        state.transition = null;
        dimensionButtons.forEach((button) => button.classList.remove('is-target'));
        updateAxisAvailability();
      }
    }

    updateDimensionUI();
    draw();
    requestAnimationFrame(tick);
  }

  buildTempleMandala3D();
  build4DExtrusion();
  makeAxisControls();
  updateAxisAvailability();
  resize();
  updateDimensionUI();
  requestAnimationFrame(tick);
  setTimeout(() => hint.classList.add('is-hidden'), 7000);
})();
