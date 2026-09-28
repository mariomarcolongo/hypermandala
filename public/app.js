/*
 * Hypermandala — a clean geometric mandala explored in 2D, 3D and by W-slices in 4D.
 * Copyright (C) 2026 Mario Marcolongo and contributors.
 * Licensed under GNU AGPL v3 or later. See ../LICENSE.
 */

(() => {
  'use strict';

  const canvas = document.getElementById('mandala');
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  const dimensionValue = document.getElementById('dimensionValue');
  const dimensionStatus = document.getElementById('dimensionStatus');
  const sliceReadout = document.getElementById('sliceReadout');
  const sliceValue = document.getElementById('sliceValue');
  const wMarker = document.getElementById('wMarker');
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
    { key: 'w', label: 'W', color: '#d995ff', minDim: 4, slice: true },
  ];

  const state = {
    dimension: 2,
    renderDimension: 2,
    transition: null,
    position: { x: 0, y: 0, z: 0 },
    wSlice: 0,
    zoom: 1,
    rotX: -0.72,
    rotY: 0.48,
    rotZ: 0,
    rotXW: 0.62,
    rotYW: -0.42,
    pointerDown: false,
    pointerX: 0,
    pointerY: 0,
    width: innerWidth,
    height: innerHeight,
    dpr: 1,
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (t) => {
    t = clamp(t, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  };

  function v(x, y, z = 0, w = 0) {
    return { x, y, z, w };
  }

  function rotatePair(a, b, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [a * c - b * s, a * s + b * c];
  }

  function square(size, z, rotation, w) {
    const h = size / 2;
    const points = [
      v(-h, -h, z, w),
      v(h, -h, z, w),
      v(h, h, z, w),
      v(-h, h, z, w),
    ];
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    return points.map((p) => v(
      p.x * c - p.y * s,
      p.x * s + p.y * c,
      p.z,
      p.w,
    ));
  }

  function addLoop(edges, points) {
    for (let i = 0; i < points.length; i += 1) {
      edges.push([points[i], points[(i + 1) % points.length]]);
    }
  }

  function templeAtW(w) {
    const edges = [];
    const absW = Math.abs(w);
    const scale = 1 - 0.16 * absW;
    const height = 1 + 0.14 * Math.cos(Math.PI * w);
    const twist = w * Math.PI / 7;

    const specs = [
      [1.94, 0.00, 0],
      [1.52, 0.16, Math.PI / 4],
      [1.10, 0.36, 0],
      [0.76, 0.61, Math.PI / 4],
      [0.46, 0.88, 0],
      [0.24, 1.13, Math.PI / 4],
    ];

    const rings = specs.map(([size, z, baseRotation], index) => {
      const level = index / (specs.length - 1);
      const rotation = baseRotation + twist * (0.2 + level * 0.8);
      return square(size * scale, z * height, rotation, w);
    });

    rings.forEach((ring) => addLoop(edges, ring));

    for (let level = 0; level < rings.length - 1; level += 1) {
      for (let corner = 0; corner < 4; corner += 1) {
        edges.push([rings[level][corner], rings[level + 1][corner]]);
      }
    }

    const outer = 0.97 * scale;
    const inner = 0.18 * scale;
    edges.push([v(-outer, 0, 0, w), v(-inner, 0, 0, w)]);
    edges.push([v(inner, 0, 0, w), v(outer, 0, 0, w)]);
    edges.push([v(0, -outer, 0, w), v(0, -inner, 0, w)]);
    edges.push([v(0, inner, 0, w), v(0, outer, 0, w)]);

    const apex = v(0, 0, 1.43 * height, w);
    for (const point of rings[rings.length - 1]) {
      edges.push([point, apex]);
    }

    return {
      edges,
      outer: rings[0],
      apex,
    };
  }

  function activation() {
    return {
      z: ease(clamp(state.renderDimension - 2, 0, 1)),
      w: ease(clamp(state.renderDimension - 3, 0, 1)),
    };
  }

  function project(point, moveObject = true) {
    const act = activation();
    const pos = moveObject ? state.position : { x: 0, y: 0, z: 0 };

    let x = point.x + pos.x;
    let y = point.y + pos.y;
    let z = (point.z + pos.z) * act.z;
    let w = point.w * act.w;

    if (act.w > 0.0001) {
      let pair = rotatePair(x, w, state.rotXW * act.w);
      x = pair[0];
      w = pair[1];

      pair = rotatePair(y, w, state.rotYW * act.w);
      y = pair[0];
      w = pair[1];

      const p4 = 3.3 / Math.max(1.75, 3.3 - w);
      x *= p4;
      y *= p4;
      z *= p4;
    }

    let pair = rotatePair(y, z, state.rotX * act.z);
    y = pair[0];
    z = pair[1];

    pair = rotatePair(x, z, state.rotY * act.z);
    x = pair[0];
    z = pair[1];

    pair = rotatePair(x, y, state.rotZ);
    x = pair[0];
    y = pair[1];

    const camera = 4.35;
    const p3 = camera / Math.max(2.35, camera - z);
    const scale = Math.min(state.width, state.height) * 0.31 * state.zoom;

    return {
      x: state.width * 0.5 + x * p3 * scale,
      y: state.height * 0.44 + y * p3 * scale,
      z,
      w,
    };
  }

  function line(a, b, color, width, alpha) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawEdges(edges, color, baseAlpha, width = 1) {
    const projected = edges.map(([a, b]) => {
      const pa = project(a);
      const pb = project(b);
      return {
        pa,
        pb,
        depth: (pa.z + pb.z) / 2,
      };
    }).sort((a, b) => a.depth - b.depth);

    for (const item of projected) {
      const depth = clamp((item.depth + 0.8) / 2.4, 0, 1);
      line(
        item.pa,
        item.pb,
        color,
        width * (0.78 + depth * 0.5),
        baseAlpha * (0.55 + depth * 0.45),
      );
    }
  }

  function drawAxes() {
    const act = activation();
    const axes = [
      ['X', '#ff6d6d', v(-1.32, 0, 0, 0), v(1.32, 0, 0, 0), true],
      ['Y', '#65d98b', v(0, -1.32, 0, 0), v(0, 1.32, 0, 0), true],
      ['Z', '#69a8ff', v(0, 0, -0.35, 0), v(0, 0, 1.55, 0), act.z > 0.02],
    ];

    ctx.save();
    ctx.lineCap = 'round';

    for (const [label, color, start, end, visible] of axes) {
      if (!visible) continue;
      const a = project(start, false);
      const b = project(end, false);
      line(a, b, color, 1.1, 0.4);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.88;
      ctx.font = '700 11px Inter, ui-sans-serif, sans-serif';
      ctx.fillText(label, b.x + 6, b.y - 5);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function drawSliceFrame(w, alpha) {
    const size = 2.18;
    const z = -0.08;
    const frame = square(size, z, 0, w).map((p) => project(p, false));

    ctx.beginPath();
    frame.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = '#d995ff';
    ctx.globalAlpha = alpha * 0.035;
    ctx.fill();
    ctx.strokeStyle = '#d995ff';
    ctx.globalAlpha = alpha * 0.32;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function draw4DContext(wAmount) {
    if (wAmount <= 0.001) return;

    const ghostWs = [-0.9, -0.45, 0, 0.45, 0.9];
    const ghosts = ghostWs.map((w) => ({ w, temple: templeAtW(w) }));

    for (const ghost of ghosts) {
      drawEdges(ghost.temple.edges, '#bfa7cd', 0.055 * wAmount, 0.82);
    }

    for (let i = 0; i < ghosts.length - 1; i += 1) {
      const a = ghosts[i].temple;
      const b = ghosts[i + 1].temple;
      for (let corner = 0; corner < 4; corner += 1) {
        const pa = project(a.outer[corner]);
        const pb = project(b.outer[corner]);
        line(pa, pb, '#d995ff', 0.7, 0.055 * wAmount);
      }
      line(project(a.apex), project(b.apex), '#d995ff', 0.7, 0.055 * wAmount);
    }

    drawSliceFrame(state.wSlice, wAmount);
  }

  function drawActiveTemple() {
    const act = activation();
    const effectiveW = state.wSlice * act.w;
    const temple = templeAtW(effectiveW);
    drawEdges(temple.edges, '#ead7ad', 0.9, 1.05);
  }

  function drawBackground() {
    const radius = Math.min(state.width, state.height) * 0.4;
    const gradient = ctx.createRadialGradient(
      state.width * 0.5,
      state.height * 0.43,
      0,
      state.width * 0.5,
      state.height * 0.43,
      radius,
    );
    gradient.addColorStop(0, 'rgba(154,115,57,.045)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);
  }

  function draw() {
    ctx.clearRect(0, 0, state.width, state.height);
    drawBackground();
    drawAxes();

    const { w: wAmount } = activation();
    draw4DContext(wAmount);
    drawActiveTemple();
  }

  function makeAxisControls() {
    for (const axis of AXES) {
      const row = document.createElement('label');
      row.className = 'axis-row' + (axis.slice ? ' is-slice' : '');
      row.style.setProperty('--axis-color', axis.color);

      const label = document.createElement('span');
      label.className = 'axis-row__label';
      label.textContent = axis.label;

      const input = document.createElement('input');
      input.type = 'range';
      input.min = axis.slice ? '-1' : '-1.15';
      input.max = axis.slice ? '1' : '1.15';
      input.step = '0.01';
      input.value = '0';
      input.setAttribute(
        'aria-label',
        axis.slice ? 'Move the W slice plane' : 'Move mandala along ' + axis.label + ' axis',
      );

      const value = document.createElement('span');
      value.className = 'axis-row__value';
      value.textContent = '0.00';

      input.addEventListener('input', () => {
        const next = Number(input.value);
        if (axis.slice) {
          state.wSlice = next;
          sliceValue.textContent = next.toFixed(2);
          wMarker.style.left = (((next + 1) / 2) * 100).toFixed(2) + '%';
        } else {
          state.position[axis.key] = next;
        }
        value.textContent = next.toFixed(2);
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
    const effectiveDimension = state.transition
      ? Math.max(state.transition.from, state.transition.to)
      : state.dimension;

    for (const axis of AXES) {
      const enabled = effectiveDimension >= axis.minDim && !state.transition;
      axis.input.disabled = !enabled;
      axis.row.classList.toggle('is-disabled', !enabled);
    }
  }

  function resetCoordinates() {
    state.position.x = 0;
    state.position.y = 0;
    state.position.z = 0;
    state.wSlice = 0;
    sliceValue.textContent = '0.00';
    wMarker.style.left = '50%';

    for (const axis of AXES) {
      axis.input.value = '0';
      axis.valueEl.textContent = '0.00';
    }
  }

  function startDimensionTransition(target) {
    target = Number(target);
    if (![2, 3, 4].includes(target) || target === state.dimension || state.transition) return;

    if (target === 4 && state.dimension < 4) {
      state.wSlice = 0;
      const wAxis = AXES.find((axis) => axis.key === 'w');
      if (wAxis) {
        wAxis.input.value = '0';
        wAxis.valueEl.textContent = '0.00';
      }
      sliceValue.textContent = '0.00';
      wMarker.style.left = '50%';
    }

    state.transition = {
      from: state.renderDimension,
      to: target,
      start: performance.now(),
      duration: reducedMotion ? 80 : 1700,
    };

    dimensionButtons.forEach((button) => {
      button.classList.toggle('is-target', Number(button.dataset.dimension) === target);
    });

    updateAxisAvailability();
    hideHint();
  }

  function updateUI() {
    if (state.transition) {
      dimensionValue.textContent = Math.round(state.transition.from) + 'D → ' + state.transition.to + 'D';
      dimensionStatus.textContent = 'transforming';
    } else {
      dimensionValue.textContent = state.dimension + 'D';
      dimensionStatus.textContent = state.dimension === 2
        ? 'plan'
        : state.dimension === 3
          ? 'temple'
          : 'W slice';
    }

    const show4D = state.renderDimension > 3.55;
    document.body.classList.toggle('is-4d', show4D);
    sliceReadout.setAttribute('aria-hidden', String(!show4D));

    dimensionButtons.forEach((button) => {
      const d = Number(button.dataset.dimension);
      button.classList.toggle('is-active', !state.transition && d === state.dimension);
      button.disabled = Boolean(state.transition);
    });

    if (state.dimension === 4 && !state.transition) {
      hint.textContent = 'move the W slice coordinate · drag to orbit · Shift+drag changes the 4D projection';
    } else if (state.dimension === 3 && !state.transition) {
      hint.textContent = 'move X/Y/Z · drag to orbit · scroll to zoom';
    } else if (!state.transition) {
      hint.textContent = 'move X/Y · drag to rotate · scroll to zoom';
    }
  }

  function resetCamera() {
    state.zoom = 1;
    state.rotX = -0.72;
    state.rotY = 0.48;
    state.rotZ = 0;
    state.rotXW = 0.62;
    state.rotYW = -0.42;
  }

  function hideHint() {
    hint.classList.add('is-hidden');
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

  dimensionButtons.forEach((button) => {
    button.addEventListener('click', () => startDimensionTransition(button.dataset.dimension));
  });

  resetPosition.addEventListener('click', () => {
    resetCoordinates();
    hideHint();
  });

  resetView.addEventListener('click', () => {
    resetCamera();
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

    const act = activation();

    if (act.z < 0.04) {
      state.rotZ += dx * 0.006;
      return;
    }

    if (act.w > 0.04 && event.shiftKey) {
      state.rotXW += dx * 0.004;
      state.rotYW += dy * 0.004;
    } else {
      state.rotY += dx * 0.0048;
      state.rotX += dy * 0.0048;
    }
  });

  function pointerUp(event) {
    state.pointerDown = false;
    if (canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
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

    if (event.key === '2' || event.key === '3' || event.key === '4') {
      startDimensionTransition(Number(event.key));
    }
    if (event.key.toLowerCase() === 'c') resetCoordinates();
    if (event.key.toLowerCase() === 'r') resetCamera();
  });

  function tick(now) {
    if (state.transition) {
      const t = clamp((now - state.transition.start) / state.transition.duration, 0, 1);
      state.renderDimension = mix(
        state.transition.from,
        state.transition.to,
        ease(t),
      );

      if (t >= 1) {
        state.dimension = state.transition.to;
        state.renderDimension = state.dimension;
        state.transition = null;
        dimensionButtons.forEach((button) => button.classList.remove('is-target'));
        updateAxisAvailability();
      }
    }

    updateUI();
    draw();
    requestAnimationFrame(tick);
  }

  makeAxisControls();
  updateAxisAvailability();
  resize();
  updateUI();
  requestAnimationFrame(tick);

  setTimeout(() => hint.classList.add('is-hidden'), 7000);
})();
