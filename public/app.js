/*
 * Hypermandala — square → cube → hypercube mandala explorer.
 * Independent implementation inspired by the interaction model of
 * Tarek Sherif's Tesseract Explorer (MIT): https://github.com/tsherif/tesseract-explorer
 *
 * Copyright (C) 2026 Mario Marcolongo and contributors.
 * Licensed under GNU AGPL v3 or later. See ../LICENSE.
 */

(() => {
  'use strict';

  const canvas = document.getElementById('mandala');
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  const basisCanvas = document.getElementById('basisCanvas');
  const basisCtx = basisCanvas.getContext('2d');

  const dimensionValue = document.getElementById('dimensionValue');
  const dimensionStatus = document.getElementById('dimensionStatus');
  const hint = document.getElementById('hint');
  const resetAllButton = document.getElementById('resetAll');
  const dimensionButtons = [...document.querySelectorAll('[data-dimension]')];
  const projectionButtons = [...document.querySelectorAll('[data-projection]')];
  const colorButtons = [...document.querySelectorAll('[data-color]')];
  const rotationRows = document.getElementById('rotationRows');
  const scaleRows = document.getElementById('scaleRows');

  const TAU = Math.PI * 2;
  const RAD = Math.PI / 180;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COLORS = {
    form: '#e7ddc6',
    neutral: '#f2eee5',
    x: '#ff6b6b',
    y: '#62d48b',
    z: '#6ca8ff',
    w: '#f0c45c',
  };

  const ROTATION_CONFIG = [
    { key: 'xw', label: 'XW', a: 0, b: 3, minDim: 4, color: COLORS.w },
    { key: 'yw', label: 'YW', a: 1, b: 3, minDim: 4, color: COLORS.w },
    { key: 'zw', label: 'ZW', a: 2, b: 3, minDim: 4, color: COLORS.w },
    { key: 'xy', label: 'XY', a: 0, b: 1, minDim: 2, color: '#d8dbe0' },
    { key: 'xz', label: 'XZ', a: 0, b: 2, minDim: 3, color: COLORS.z },
    { key: 'yz', label: 'YZ', a: 1, b: 2, minDim: 3, color: COLORS.z },
  ];

  const SCALE_CONFIG = [
    { key: 'x', label: 'X', minDim: 2, color: COLORS.x },
    { key: 'y', label: 'Y', minDim: 2, color: COLORS.y },
    { key: 'z', label: 'Z', minDim: 3, color: COLORS.z },
    { key: 'w', label: 'W', minDim: 4, color: COLORS.w },
  ];

  const state = {
    dimension: 2,
    requestedDimension: 2,
    queue: [],
    transition: null,
    zMix: 0,
    wMix: 0,
    projection: 'perspective',
    colorMode: 'form',
    rotations: { xw: 0, yw: 0, zw: 0, xy: 0, xz: 0, yz: 0 },
    auto: { xw: false, yw: false, zw: false, xy: false, xz: false, yz: false },
    scales: { x: 1, y: 1, z: 1, w: 1 },
    cameraYaw: -0.62,
    cameraPitch: 0.58,
    zoom: 1,
    pointerDown: false,
    pointerX: 0,
    pointerY: 0,
    width: innerWidth,
    height: innerHeight,
    dpr: 1,
    lastTime: performance.now(),
  };

  const modules = [];
  const planEdges = [];
  const planEdgeKeys = new Set();
  const rotationUI = {};
  const scaleUI = {};

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const smoother = (t) => {
    t = clamp(t, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  };

  function rotateXYPoint(x, y, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [x * c - y * s, x * s + y * c];
  }

  function addPlanEdge(a, b, axis) {
    const p1 = [Number(a[0].toFixed(4)), Number(a[1].toFixed(4))];
    const p2 = [Number(b[0].toFixed(4)), Number(b[1].toFixed(4))];
    const first = p1[0] < p2[0] || (p1[0] === p2[0] && p1[1] <= p2[1]) ? p1 : p2;
    const second = first === p1 ? p2 : p1;
    const key = first.join(',') + '|' + second.join(',');
    if (planEdgeKeys.has(key)) return;
    planEdgeKeys.add(key);
    planEdges.push({ a: [first[0], first[1], 0, 0], b: [second[0], second[1], 0, 0], axis });
  }

  function extrudeTo4D(vertices3, edges3, wHalf, footprint, planExtra = []) {
    const vertices = [];
    for (const w of [-wHalf, wHalf]) {
      for (const p of vertices3) vertices.push([p[0], p[1], p[2], w]);
    }

    const n = vertices3.length;
    const edges = [];
    for (let layer = 0; layer < 2; layer += 1) {
      for (const edge of edges3) {
        edges.push({
          a: edge.a + layer * n,
          b: edge.b + layer * n,
          axis: edge.axis,
          wLayer: layer === 0 ? -1 : 1,
        });
      }
    }
    for (let i = 0; i < n; i += 1) {
      edges.push({ a: i, b: i + n, axis: 'w', wLayer: 0 });
    }

    modules.push({ vertices, edges });

    for (let i = 0; i < footprint.length; i += 1) {
      addPlanEdge(footprint[i], footprint[(i + 1) % footprint.length], i % 2 === 0 ? 'x' : 'y');
    }
    for (const edge of planExtra) addPlanEdge(edge[0], edge[1], 'n');
  }

  function addCube(cx, cy, baseZ, size, rotation = 0) {
    const h = size / 2;
    const vertices3 = [];
    for (let zBit = 0; zBit < 2; zBit += 1) {
      for (let yBit = 0; yBit < 2; yBit += 1) {
        for (let xBit = 0; xBit < 2; xBit += 1) {
          let x = (xBit ? h : -h);
          let y = (yBit ? h : -h);
          [x, y] = rotateXYPoint(x, y, rotation);
          vertices3.push([cx + x, cy + y, baseZ + zBit * size]);
        }
      }
    }

    const edges3 = [];
    for (let i = 0; i < 8; i += 1) {
      for (let axis = 0; axis < 3; axis += 1) {
        const j = i ^ (1 << axis);
        if (i < j) edges3.push({ a: i, b: j, axis: axis === 0 ? 'x' : axis === 1 ? 'y' : 'z' });
      }
    }

    const footprint = [
      [-h, -h], [h, -h], [h, h], [-h, h],
    ].map(([x, y]) => {
      const p = rotateXYPoint(x, y, rotation);
      return [cx + p[0], cy + p[1]];
    });

    extrudeTo4D(vertices3, edges3, size * 0.5, footprint);
  }

  function addPyramid(cx, cy, baseZ, size, height, rotation = 0) {
    const h = size / 2;
    const base = [
      [-h, -h], [h, -h], [h, h], [-h, h],
    ].map(([x, y]) => {
      const p = rotateXYPoint(x, y, rotation);
      return [cx + p[0], cy + p[1], baseZ];
    });

    const vertices3 = [...base, [cx, cy, baseZ + height]];
    const edges3 = [
      { a: 0, b: 1, axis: 'x' },
      { a: 1, b: 2, axis: 'y' },
      { a: 2, b: 3, axis: 'x' },
      { a: 3, b: 0, axis: 'y' },
      { a: 0, b: 4, axis: 'n' },
      { a: 1, b: 4, axis: 'n' },
      { a: 2, b: 4, axis: 'n' },
      { a: 3, b: 4, axis: 'n' },
    ];

    const footprint = base.map((p) => [p[0], p[1]]);
    const center = [cx, cy];
    const extra = footprint.map((p) => [p, center]);
    extrudeTo4D(vertices3, edges3, size * 0.5, footprint, extra);
  }

  function buildTemple() {
    modules.length = 0;
    planEdges.length = 0;
    planEdgeKeys.clear();

    const size = 0.34;
    const spacing = 0.47;

    const base = [];
    for (let gx = -2; gx <= 2; gx += 1) {
      for (let gy = -2; gy <= 2; gy += 1) {
        if (Math.abs(gx) + Math.abs(gy) <= 2) base.push([gx, gy]);
      }
    }
    base.push([3, 0], [-3, 0], [0, 3], [0, -3]);

    for (const [gx, gy] of base) {
      addCube(gx * spacing, gy * spacing, 0, size, 0);
    }

    const second = [[0,0], [1,0], [-1,0], [0,1], [0,-1]];
    for (const [gx, gy] of second) {
      addCube(gx * spacing, gy * spacing, size, size, 0);
    }

    addCube(0, 0, size * 2, size, 0);
    addPyramid(0, 0, size * 3, size * 1.16, size * 1.12, 0);

    for (const [gx, gy] of [[3,0],[-3,0],[0,3],[0,-3]]) {
      addPyramid(gx * spacing, gy * spacing, size, size * 0.82, size * 0.72, 0);
    }
  }

  function rotatePlane(point, a, b, angle) {
    if (Math.abs(angle) < 1e-8) return;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const pa = point[a];
    const pb = point[b];
    point[a] = c * pa - s * pb;
    point[b] = s * pa + c * pb;
  }

  function activeAngle(config) {
    let factor = 1;
    if (config.key.includes('z')) factor *= state.zMix;
    if (config.key.includes('w')) factor *= state.wMix;
    return state.rotations[config.key] * RAD * factor;
  }

  function transform4D(source, applyUserScale = true) {
    const p = [source[0], source[1], source[2], source[3]];

    const sx = applyUserScale ? state.scales.x : 1;
    const sy = applyUserScale ? state.scales.y : 1;
    const sz = applyUserScale ? state.scales.z : 1;
    const sw = applyUserScale ? state.scales.w : 1;

    p[0] *= sx;
    p[1] *= sy;
    p[2] *= sz * state.zMix;
    p[3] *= sw * state.wMix;

    for (const config of ROTATION_CONFIG) {
      rotatePlane(p, config.a, config.b, activeAngle(config));
    }
    return p;
  }

  function project4Dto3D(p) {
    if (state.projection === 'orthographic' || state.wMix < 0.001) {
      return [p[0], p[1], p[2]];
    }

    const cameraW = 3.4;
    const focal = 3.4;
    const denom = Math.max(0.72, cameraW - p[3]);
    const factor = focal / denom;
    return [p[0] * factor, p[1] * factor, p[2] * factor];
  }

  function cameraTransform(p) {
    let [x, y, z] = p;
    const viewMix = state.zMix;

    const yaw = state.cameraYaw * viewMix;
    let c = Math.cos(yaw);
    let s = Math.sin(yaw);
    let nx = c * x - s * z;
    let nz = s * x + c * z;
    x = nx;
    z = nz;

    const pitch = state.cameraPitch * viewMix;
    c = Math.cos(pitch);
    s = Math.sin(pitch);
    const ny = c * y - s * z;
    nz = s * y + c * z;
    y = ny;
    z = nz;

    return [x, y, z];
  }

  function projectToScreen(source) {
    const p4 = transform4D(source, true);
    const p3 = cameraTransform(project4Dto3D(p4));

    const cameraZ = 5.8;
    const factor = cameraZ / Math.max(2.6, cameraZ - p3[2]);
    const scale = Math.min(state.width, state.height) * 0.255 * state.zoom;

    return {
      x: state.width * 0.46 + p3[0] * factor * scale,
      y: state.height * 0.48 + p3[1] * factor * scale,
      depth: p3[2],
      w: p4[3],
    };
  }

  function axisColor(axis) {
    if (state.colorMode === 'axis') {
      return axis === 'x' ? COLORS.x
        : axis === 'y' ? COLORS.y
        : axis === 'z' ? COLORS.z
        : axis === 'w' ? COLORS.w
        : COLORS.neutral;
    }
    return axis === 'w' ? '#d7b45f' : axis === 'n' ? '#f0eadf' : COLORS.form;
  }

  function drawLine(a, b, color, width, alpha) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawPlan(alpha) {
    if (alpha <= 0.001) return;

    for (const edge of planEdges) {
      const a = projectToScreen(edge.a);
      const b = projectToScreen(edge.b);
      drawLine(a, b, axisColor(edge.axis), 1.15, alpha * 0.9);
    }
  }

  function edgeVisibility(edge) {
    if (edge.axis === 'w') return state.wMix;
    if (edge.axis === 'z') return state.zMix;

    if (edge.wLayer === 1) return mix(0, 0.78, state.wMix);
    if (edge.wLayer === -1) return mix(1, 0.78, state.wMix);
    return 1;
  }

  function drawModules(alpha) {
    if (alpha <= 0.001) return;

    const rendered = [];
    for (const module of modules) {
      for (const edge of module.edges) {
        const a = projectToScreen(module.vertices[edge.a]);
        const b = projectToScreen(module.vertices[edge.b]);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (dx * dx + dy * dy < 0.3) continue;

        rendered.push({
          edge,
          a,
          b,
          depth: (a.depth + b.depth) * 0.5,
        });
      }
    }

    rendered.sort((a, b) => a.depth - b.depth);

    for (const item of rendered) {
      const depth = clamp((item.depth + 1.4) / 3.2, 0, 1);
      const visibility = edgeVisibility(item.edge);
      if (visibility <= 0.002) continue;
      const width = 0.7 + depth * 0.55 + (item.edge.axis === 'w' ? 0.12 : 0);
      const lineAlpha = alpha * visibility * (0.34 + depth * 0.53);
      drawLine(item.a, item.b, axisColor(item.edge.axis), width, lineAlpha);
    }
  }

  function drawVertices(alpha) {
    if (alpha <= 0.001 || state.zMix < 0.15) return;
    const seen = new Set();

    ctx.fillStyle = state.colorMode === 'axis' ? 'rgba(248,248,245,.86)' : 'rgba(245,239,225,.72)';

    for (const module of modules) {
      for (const vertex of module.vertices) {
        const p = projectToScreen(vertex);
        const key = Math.round(p.x * 2) + ':' + Math.round(p.y * 2);
        if (seen.has(key)) continue;
        seen.add(key);
        ctx.globalAlpha = alpha * (0.32 + state.wMix * 0.2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.05, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawScene() {
    ctx.clearRect(0, 0, state.width, state.height);

    const radius = Math.min(state.width, state.height) * 0.38;
    const glow = ctx.createRadialGradient(
      state.width * 0.46,
      state.height * 0.47,
      0,
      state.width * 0.46,
      state.height * 0.47,
      radius,
    );
    glow.addColorStop(0, 'rgba(105,116,136,.055)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const planAlpha = 1 - state.zMix;
    drawPlan(planAlpha);
    drawModules(state.zMix);
    drawVertices(state.zMix);
  }

  function basisPoint(source) {
    const p4 = transform4D(source, false);
    const p3 = cameraTransform(project4Dto3D(p4));
    return p3;
  }

  function drawBasis() {
    const width = basisCanvas.width;
    const height = basisCanvas.height;
    basisCtx.clearRect(0, 0, width, height);

    const axes = [
      { label: 'X', vector: [0.8,0,0,0], color: COLORS.x, min: 2 },
      { label: 'Y', vector: [0,0.8,0,0], color: COLORS.y, min: 2 },
      { label: 'Z', vector: [0,0,0.8,0], color: COLORS.z, min: 3 },
      { label: 'W', vector: [0,0,0,0.8], color: COLORS.w, min: 4 },
    ];

    const active = axes.filter((axis) => (
      axis.min === 2
      || (axis.min === 3 && state.zMix > 0.025)
      || (axis.min === 4 && state.wMix > 0.025)
    ));
    const points = active.map((axis) => ({ axis, p: basisPoint(axis.vector) }));
    let max = 0.01;
    for (const item of points) max = Math.max(max, Math.hypot(item.p[0], item.p[1]));
    const scale = 45 / max;
    const ox = width / 2;
    const oy = height / 2;

    basisCtx.lineCap = 'round';
    for (const item of points) {
      const x = ox + item.p[0] * scale;
      const y = oy + item.p[1] * scale;
      basisCtx.beginPath();
      basisCtx.moveTo(ox, oy);
      basisCtx.lineTo(x, y);
      basisCtx.strokeStyle = item.axis.color;
      basisCtx.globalAlpha = 0.85;
      basisCtx.lineWidth = 1.6;
      basisCtx.stroke();

      basisCtx.fillStyle = item.axis.color;
      basisCtx.font = '700 10px Inter, sans-serif';
      basisCtx.fillText(item.axis.label, x + 4, y - 3);
    }

    basisCtx.globalAlpha = 0.75;
    basisCtx.fillStyle = '#f5f4ef';
    basisCtx.beginPath();
    basisCtx.arc(ox, oy, 2.1, 0, TAU);
    basisCtx.fill();
    basisCtx.globalAlpha = 1;
  }

  function createRotationControls() {
    for (const config of ROTATION_CONFIG) {
      const row = document.createElement('div');
      row.className = 'control-row';
      row.style.setProperty('--axis-color', config.color);

      const label = document.createElement('span');
      label.className = 'control-row__label';
      label.textContent = config.label;

      const input = document.createElement('input');
      input.type = 'range';
      input.min = '-180';
      input.max = '180';
      input.step = '1';
      input.value = '0';
      input.setAttribute('aria-label', 'Rotate in ' + config.label + ' plane');

      const value = document.createElement('span');
      value.className = 'control-row__value';
      value.textContent = '0°';

      const auto = document.createElement('button');
      auto.type = 'button';
      auto.className = 'auto-toggle';
      auto.textContent = 'A';
      auto.setAttribute('aria-label', 'Autorotate ' + config.label);
      auto.setAttribute('aria-pressed', 'false');

      input.addEventListener('input', () => {
        state.rotations[config.key] = Number(input.value);
        value.textContent = Math.round(state.rotations[config.key]) + '°';
        hideHint();
      });

      auto.addEventListener('click', () => {
        state.auto[config.key] = !state.auto[config.key];
        auto.setAttribute('aria-pressed', String(state.auto[config.key]));
        hideHint();
      });

      row.append(label, input, value, auto);
      rotationRows.append(row);
      rotationUI[config.key] = { row, input, value, auto, config };
    }
  }

  function createScaleControls() {
    for (const config of SCALE_CONFIG) {
      const row = document.createElement('div');
      row.className = 'control-row';
      row.style.setProperty('--axis-color', config.color);

      const label = document.createElement('span');
      label.className = 'control-row__label';
      label.textContent = config.label;

      const input = document.createElement('input');
      input.type = 'range';
      input.min = '0';
      input.max = '1.4';
      input.step = '0.02';
      input.value = '1';
      input.setAttribute('aria-label', 'Scale ' + config.label + ' axis');

      const value = document.createElement('span');
      value.className = 'control-row__value';
      value.textContent = '1.00';

      input.addEventListener('input', () => {
        state.scales[config.key] = Number(input.value);
        value.textContent = state.scales[config.key].toFixed(2);
        hideHint();
      });

      row.append(label, input, value);
      scaleRows.append(row);
      scaleUI[config.key] = { row, input, value, config };
    }
  }

  function setProjection(mode) {
    if (mode !== 'perspective' && mode !== 'orthographic') return;
    state.projection = mode;
    projectionButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.projection === mode);
    });
  }

  function setColorMode(mode) {
    if (mode !== 'form' && mode !== 'axis') return;
    state.colorMode = mode;
    colorButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.color === mode);
    });
  }

  function startStage(target) {
    const fromZ = state.zMix;
    const fromW = state.wMix;
    const toZ = target >= 3 ? 1 : 0;
    const toW = target >= 4 ? 1 : 0;

    state.transition = {
      fromDimension: state.dimension,
      toDimension: target,
      fromZ,
      fromW,
      toZ,
      toW,
      start: performance.now(),
      duration: reducedMotion ? 80 : 1150,
    };
  }

  function requestDimension(target) {
    target = Number(target);
    if (![2,3,4].includes(target) || state.transition || target === state.dimension) return;

    state.requestedDimension = target;
    if (state.dimension === 2 && target === 4) state.queue = [3,4];
    else if (state.dimension === 4 && target === 2) state.queue = [3,2];
    else state.queue = [target];

    startStage(state.queue.shift());
    hideHint();
  }

  function completeStage() {
    state.dimension = state.transition.toDimension;
    state.zMix = state.transition.toZ;
    state.wMix = state.transition.toW;
    state.transition = null;

    if (state.queue.length) {
      startStage(state.queue.shift());
    } else {
      state.requestedDimension = state.dimension;
    }
  }

  function updateTransition(now) {
    if (!state.transition) return;
    const t = clamp((now - state.transition.start) / state.transition.duration, 0, 1);
    const e = smoother(t);
    state.zMix = mix(state.transition.fromZ, state.transition.toZ, e);
    state.wMix = mix(state.transition.fromW, state.transition.toW, e);
    if (t >= 1) completeStage();
  }

  function effectiveDimension() {
    if (!state.transition) return state.dimension;
    return Math.max(state.transition.fromDimension, state.transition.toDimension);
  }

  function updateControlAvailability() {
    const dim = effectiveDimension();
    const locked = Boolean(state.transition);

    for (const config of ROTATION_CONFIG) {
      const ui = rotationUI[config.key];
      const enabled = dim >= config.minDim && !locked;
      ui.input.disabled = !enabled;
      ui.auto.disabled = !enabled;
      ui.row.classList.toggle('is-disabled', !enabled);
    }

    for (const config of SCALE_CONFIG) {
      const ui = scaleUI[config.key];
      const enabled = dim >= config.minDim && !locked;
      ui.input.disabled = !enabled;
      ui.row.classList.toggle('is-disabled', !enabled);
    }
  }

  function updateUI() {
    if (state.transition) {
      dimensionValue.textContent = state.transition.fromDimension + 'D → ' + state.transition.toDimension + 'D';
      dimensionStatus.textContent = 'unfolding';
    } else {
      dimensionValue.textContent = state.dimension + 'D';
      dimensionStatus.textContent = state.dimension === 2
        ? 'mandala plan'
        : state.dimension === 3
          ? 'cube temple'
          : '4D projection';
    }

    dimensionButtons.forEach((button) => {
      const d = Number(button.dataset.dimension);
      button.classList.toggle('is-active', !state.transition && d === state.dimension);
      button.classList.toggle('is-target', state.requestedDimension === d && d !== state.dimension);
      button.disabled = Boolean(state.transition);
    });

    updateControlAvailability();
  }

  function resetAll() {
    state.rotations = { xw: 0, yw: 0, zw: 0, xy: 0, xz: 0, yz: 0 };
    state.auto = { xw: false, yw: false, zw: false, xy: false, xz: false, yz: false };
    state.scales = { x: 1, y: 1, z: 1, w: 1 };
    state.cameraYaw = -0.62;
    state.cameraPitch = 0.58;
    state.zoom = 1;
    setProjection('perspective');
    setColorMode('form');

    for (const config of ROTATION_CONFIG) {
      const ui = rotationUI[config.key];
      ui.input.value = '0';
      ui.value.textContent = '0°';
      ui.auto.setAttribute('aria-pressed', 'false');
    }
    for (const config of SCALE_CONFIG) {
      const ui = scaleUI[config.key];
      ui.input.value = '1';
      ui.value.textContent = '1.00';
    }
  }

  function updateAutorotation(dt) {
    for (const config of ROTATION_CONFIG) {
      if (!state.auto[config.key] || effectiveDimension() < config.minDim) continue;
      let next = state.rotations[config.key] + dt * 28;
      if (next > 180) next -= 360;
      state.rotations[config.key] = next;

      const ui = rotationUI[config.key];
      ui.input.value = String(next);
      ui.value.textContent = Math.round(next) + '°';
    }
  }

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

  function hideHint() {
    hint.classList.add('is-hidden');
  }

  dimensionButtons.forEach((button) => {
    button.addEventListener('click', () => requestDimension(button.dataset.dimension));
  });

  projectionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setProjection(button.dataset.projection);
      hideHint();
    });
  });

  colorButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setColorMode(button.dataset.color);
      hideHint();
    });
  });

  resetAllButton.addEventListener('click', () => {
    resetAll();
    hideHint();
  });

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

    if (state.dimension === 2 && !state.transition) {
      state.rotations.xy += dx * 0.42;
      state.rotations.xy = ((state.rotations.xy + 180) % 360 + 360) % 360 - 180;
      const ui = rotationUI.xy;
      ui.input.value = String(state.rotations.xy);
      ui.value.textContent = Math.round(state.rotations.xy) + '°';
    } else {
      state.cameraYaw += dx * 0.005;
      state.cameraPitch = clamp(state.cameraPitch + dy * 0.005, -1.45, 1.45);
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
    state.zoom = clamp(state.zoom * Math.exp(-event.deltaY * 0.001), 0.55, 1.9);
    hideHint();
  }, { passive: false });

  canvas.addEventListener('dblclick', () => {
    state.cameraYaw = -0.62;
    state.cameraPitch = 0.58;
    state.zoom = 1;
  });

  window.addEventListener('resize', resize, { passive: true });

  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return;
    if (event.key === '2' || event.key === '3' || event.key === '4') requestDimension(Number(event.key));
    if (event.key.toLowerCase() === 'r') resetAll();
  });

  function tick(now) {
    const dt = Math.min(0.05, (now - state.lastTime) / 1000);
    state.lastTime = now;

    updateTransition(now);
    updateAutorotation(dt);
    updateUI();
    drawScene();
    drawBasis();
    requestAnimationFrame(tick);
  }

  buildTemple();
  createRotationControls();
  createScaleControls();
  resetAll();
  resize();
  updateUI();
  requestAnimationFrame(tick);

  setTimeout(() => hint.classList.add('is-hidden'), 6500);
})();