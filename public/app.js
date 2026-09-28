/*
 * Hypermandala — a dependency-free dimensional mandala explorer.
 * Copyright (C) 2026 Mario Marcolongo and contributors.
 * Licensed under GNU AGPL v3 or later. See ../LICENSE.
 */

(() => {
  'use strict';

  const canvas = document.getElementById('mandala');
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  const slider = document.getElementById('dimensionSlider');
  const valueEl = document.getElementById('dimensionValue');
  const nameEl = document.getElementById('dimensionName');
  const playButton = document.getElementById('playButton');
  const resetButton = document.getElementById('resetButton');
  const hint = document.getElementById('hint');
  const dimensionButtons = [...document.querySelectorAll('[data-dimension]')];

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const paths = [];
  const nodes = [];

  const state = {
    dimension: 2,
    targetDimension: 2,
    draggingSlider: false,
    playing: false,
    playPhase: 0,
    zoom: 1,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    hyperX: 0,
    hyperY: 0,
    pointerDown: false,
    pointerX: 0,
    pointerY: 0,
    lastTime: performance.now(),
    elapsed: 0,
    width: innerWidth,
    height: innerHeight,
    dpr: 1,
  };

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function smootherstep01(t) {
    t = clamp(t, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function mix(a, b, t) {
    return a + (b - a) * t;
  }

  function makePoint(x, y, phase, layer) {
    const radius = Math.hypot(x, y);
    const theta = Math.atan2(y, x);
    const envelope = smoothstep(0.035, 0.94, radius);

    // The 2D point is the seed. z and w are latent coordinates that are
    // continuously introduced by the dimension slider.
    const z0 = envelope * (
      0.265 * Math.sin(6 * theta + phase) * (0.58 + radius * 0.42) +
      0.085 * Math.sin(TAU * radius * 1.85 - phase * 0.8)
    );

    const w0 = envelope * (
      0.255 * Math.cos(4 * theta - phase * 0.72) * (0.62 + radius * 0.38) +
      0.095 * Math.sin(8 * theta + phase * 0.55)
    );

    return { x, y, z0, w0, layer };
  }

  function addPath(points, hue, alpha = 0.9, glow = 1, closed = true) {
    paths.push({ points, hue, alpha, glow, closed });
  }

  function addRosette(radius, amplitude, lobes, phase, hue, layer, samples = 300) {
    const points = [];
    for (let i = 0; i <= samples; i += 1) {
      const theta = (i / samples) * TAU;
      const r = radius + amplitude * Math.cos(lobes * theta + phase);
      points.push(makePoint(r * Math.cos(theta), r * Math.sin(theta), phase + layer * 0.37, layer));
    }
    addPath(points, hue, 0.82, 1.0, true);
  }

  function addPetalRing(count, center, length, width, offset, hue, layer) {
    const samples = 88;
    for (let i = 0; i < count; i += 1) {
      const angle = offset + (i / count) * TAU;
      const erx = Math.cos(angle);
      const ery = Math.sin(angle);
      const etx = -ery;
      const ety = erx;
      const points = [];
      const phase = angle * 0.5 + layer * 0.71;

      for (let j = 0; j <= samples; j += 1) {
        const t = (j / samples) * TAU;
        const radial = center + 0.5 * length * Math.cos(t);
        const taper = 0.74 + 0.26 * Math.cos(2 * t);
        const lateral = width * Math.sin(t) * taper;
        const x = radial * erx + lateral * etx;
        const y = radial * ery + lateral * ety;
        points.push(makePoint(x, y, phase, layer));
      }

      addPath(points, hue + (i % 2) * 5, 0.67, 0.82, true);
    }
  }

  function addSpokes(count, inner, outer, hue, layer) {
    const samples = 60;
    for (let i = 0; i < count; i += 1) {
      const base = (i / count) * TAU;
      const points = [];
      for (let j = 0; j <= samples; j += 1) {
        const t = j / samples;
        const r = mix(inner, outer, t);
        const angle = base + 0.043 * Math.sin(Math.PI * t) * Math.sin(TAU * t + i * 0.55);
        points.push(makePoint(r * Math.cos(angle), r * Math.sin(angle), i * 0.21 + layer, layer));
      }
      addPath(points, hue, 0.28, 0.42, false);
    }
  }

  function buildMandala() {
    addRosette(0.16, 0.055, 6, 0, 188, 0.2, 220);
    addRosette(0.285, 0.076, 8, Math.PI / 8, 207, 0.7, 260);
    addRosette(0.43, 0.095, 12, 0, 235, 1.2, 300);
    addRosette(0.585, 0.083, 16, Math.PI / 16, 267, 1.7, 320);
    addRosette(0.755, 0.058, 24, 0, 304, 2.2, 340);
    addRosette(0.89, 0.024, 36, Math.PI / 36, 324, 2.65, 360);

    addPetalRing(12, 0.515, 0.62, 0.105, 0, 252, 1.45);
    addPetalRing(12, 0.31, 0.34, 0.072, Math.PI / 12, 216, 0.95);
    addSpokes(24, 0.095, 0.92, 242, 1.1);

    // Anchor points make the transformation easier to read spatially.
    const rings = [0.285, 0.585, 0.89];
    rings.forEach((r, ringIndex) => {
      const count = ringIndex === 2 ? 24 : 12;
      for (let i = 0; i < count; i += 1) {
        const theta = (i / count) * TAU + (ringIndex === 1 ? Math.PI / 12 : 0);
        nodes.push({
          point: makePoint(r * Math.cos(theta), r * Math.sin(theta), ringIndex * 0.8 + theta * 0.35, ringIndex + 0.5),
          hue: 205 + ringIndex * 55,
          size: ringIndex === 2 ? 1.35 : 1.65,
        });
      }
    });
  }

  function rotatePair(a, b, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [a * c - b * s, a * s + b * c];
  }

  function project(point, zAmount, wAmount, ambient) {
    let x = point.x;
    let y = point.y;
    let z = point.z0 * zAmount;
    let w = point.w0 * wAmount;

    if (wAmount > 0.0001) {
      let pair;
      pair = rotatePair(x, w, wAmount * (0.62 + state.hyperX + ambient));
      x = pair[0]; w = pair[1];

      pair = rotatePair(y, w, wAmount * (-0.43 + state.hyperY + ambient * 0.71));
      y = pair[0]; w = pair[1];

      pair = rotatePair(z, w, wAmount * (0.24 + ambient * 0.46));
      z = pair[0]; w = pair[1];

      const fourDPerspective = 2.72 / Math.max(1.42, 2.72 - w);
      x *= fourDPerspective;
      y *= fourDPerspective;
      z *= fourDPerspective;
    }

    const rx = zAmount * (0.62 + state.rotX);
    const ry = zAmount * (0.11 + state.rotY);
    const rz = state.rotZ;

    let pair = rotatePair(y, z, rx);
    y = pair[0]; z = pair[1];
    pair = rotatePair(x, z, ry);
    x = pair[0]; z = pair[1];
    pair = rotatePair(x, y, rz);
    x = pair[0]; y = pair[1];

    const camera = 3.75;
    const perspective = camera / Math.max(2.1, camera - z);
    const scale = Math.min(state.width, state.height) * 0.39 * state.zoom;

    return {
      x: state.width * 0.5 + x * perspective * scale,
      y: state.height * 0.48 + y * perspective * scale,
      z,
      w,
      perspective,
    };
  }

  function drawBackgroundAura(zAmount, wAmount) {
    const radius = Math.min(state.width, state.height) * (0.18 + 0.09 * zAmount + 0.05 * wAmount);
    const gradient = ctx.createRadialGradient(
      state.width * 0.5,
      state.height * 0.48,
      0,
      state.width * 0.5,
      state.height * 0.48,
      radius * 2.9
    );
    gradient.addColorStop(0, `rgba(122, 103, 255, ${0.055 + 0.035 * wAmount})`);
    gradient.addColorStop(0.46, `rgba(68, 174, 210, ${0.025 + 0.02 * zAmount})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);
  }

  function drawMandala() {
    const dim = state.dimension;
    const zAmount = smootherstep01(dim - 2);
    const wAmount = smootherstep01(dim - 3);
    const ambient = reducedMotion ? 0 : state.elapsed * 0.055;

    ctx.clearRect(0, 0, state.width, state.height);
    drawBackgroundAura(zAmount, wAmount);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'lighter';

    const projectedPaths = paths.map((path) => {
      const projected = path.points.map((point) => project(point, zAmount, wAmount, ambient));
      let depth = 0;
      let hyper = 0;
      for (const p of projected) {
        depth += p.z;
        hyper += p.w;
      }
      return {
        ...path,
        projected,
        depth: depth / projected.length,
        hyper: hyper / projected.length,
      };
    }).sort((a, b) => a.depth - b.depth);

    for (const path of projectedPaths) {
      const depthLift = clamp((path.depth + 0.65) / 1.3, 0, 1);
      const hue = path.hue + wAmount * path.hyper * 36 + wAmount * 10;
      const coreAlpha = path.alpha * (0.52 + depthLift * 0.38);
      const glowAlpha = 0.038 + path.glow * 0.035 + depthLift * 0.018;

      ctx.beginPath();
      path.projected.forEach((p, index) => {
        if (index === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      if (path.closed) ctx.closePath();

      ctx.strokeStyle = `hsla(${hue}, 96%, 67%, ${glowAlpha})`;
      ctx.lineWidth = 5.5 * path.glow + 1.4 * depthLift;
      ctx.stroke();

      ctx.strokeStyle = `hsla(${hue}, 92%, ${76 + depthLift * 8}%, ${coreAlpha})`;
      ctx.lineWidth = 0.72 + depthLift * 0.62;
      ctx.stroke();
    }

    const projectedNodes = nodes.map((node) => ({
      ...node,
      projected: project(node.point, zAmount, wAmount, ambient),
    })).sort((a, b) => a.projected.z - b.projected.z);

    for (const node of projectedNodes) {
      const p = node.projected;
      const depthLift = clamp((p.z + 0.65) / 1.3, 0, 1);
      const r = node.size * (0.72 + 0.52 * depthLift) * p.perspective;
      const hue = node.hue + wAmount * p.w * 45;

      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 4.5, 0, TAU);
      ctx.fillStyle = `hsla(${hue}, 100%, 72%, ${0.035 + 0.03 * depthLift})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.7, r), 0, TAU);
      ctx.fillStyle = `hsla(${hue}, 92%, 90%, ${0.64 + 0.25 * depthLift})`;
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  function dimensionName(value) {
    if (value < 2.12) return 'plane';
    if (value < 2.88) return 'unfolding';
    if (value < 3.12) return 'space';
    if (value < 3.88) return 'hyperfold';
    return 'hyperspace';
  }

  function updateUI() {
    const dim = state.dimension;
    valueEl.textContent = `${dim.toFixed(2)}D`;
    nameEl.textContent = dimensionName(dim);
    slider.value = String(dim);
    slider.style.setProperty('--position', `${((dim - 2) / 2) * 100}%`);
    slider.setAttribute('aria-valuetext', `${dim.toFixed(2)} dimensions, ${dimensionName(dim)}`);

    dimensionButtons.forEach((button) => {
      const target = Number(button.dataset.dimension);
      button.classList.toggle('is-active', Math.abs(dim - target) < 0.055);
    });

    if (dim > 3.08) {
      hint.textContent = 'drag to rotate through 4D · scroll to zoom';
    } else if (dim > 2.08) {
      hint.textContent = 'drag to orbit · scroll to zoom';
    } else {
      hint.textContent = 'drag to rotate · scroll to zoom';
    }
  }

  function stopPlaying() {
    state.playing = false;
    playButton.classList.remove('is-playing');
    playButton.setAttribute('aria-pressed', 'false');
    playButton.setAttribute('aria-label', 'Play dimensional transition');
  }

  function setPlaying(next) {
    state.playing = next;
    playButton.classList.toggle('is-playing', next);
    playButton.setAttribute('aria-pressed', String(next));
    playButton.setAttribute('aria-label', next ? 'Pause dimensional transition' : 'Play dimensional transition');
    if (next) {
      state.playPhase = Math.acos(clamp(3 - state.dimension, -1, 1));
      hideHint();
    }
  }

  function hideHint() {
    hint.classList.add('is-hidden');
  }

  function animateToDimension(value) {
    stopPlaying();
    state.targetDimension = clamp(value, 2, 4);
    hideHint();
  }

  function resetView() {
    state.zoom = 1;
    state.rotX = 0;
    state.rotY = 0;
    state.rotZ = 0;
    state.hyperX = 0;
    state.hyperY = 0;
  }

  function resize() {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  slider.addEventListener('pointerdown', () => {
    state.draggingSlider = true;
    stopPlaying();
    hideHint();
  });

  slider.addEventListener('input', () => {
    const next = Number(slider.value);
    state.dimension = next;
    state.targetDimension = next;
    updateUI();
  });

  slider.addEventListener('change', () => {
    state.draggingSlider = false;
  });

  playButton.addEventListener('click', () => {
    setPlaying(!state.playing);
  });

  resetButton.addEventListener('click', () => {
    resetView();
    hideHint();
  });

  dimensionButtons.forEach((button) => {
    button.addEventListener('click', () => animateToDimension(Number(button.dataset.dimension)));
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

    const zAmount = smootherstep01(state.dimension - 2);
    const wAmount = smootherstep01(state.dimension - 3);

    if (zAmount < 0.08) {
      state.rotZ += dx * 0.006;
      return;
    }

    state.rotY += dx * 0.005 * (1 - 0.22 * wAmount);
    state.rotX += dy * 0.005 * (1 - 0.22 * wAmount);

    if (wAmount > 0.001) {
      const boost = event.shiftKey ? 1.9 : 1;
      state.hyperX += dx * 0.0034 * wAmount * boost;
      state.hyperY += dy * 0.0034 * wAmount * boost;
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
    const factor = Math.exp(-event.deltaY * 0.0011);
    state.zoom = clamp(state.zoom * factor, 0.62, 1.72);
    hideHint();
  }, { passive: false });

  canvas.addEventListener('dblclick', resetView);

  window.addEventListener('keydown', (event) => {
    if (event.target === slider) return;

    if (event.key === '2' || event.key === '3' || event.key === '4') {
      animateToDimension(Number(event.key));
    } else if (event.key === ' ') {
      event.preventDefault();
      setPlaying(!state.playing);
    } else if (event.key.toLowerCase() === 'r') {
      resetView();
    } else if (event.key === 'ArrowRight') {
      animateToDimension(state.targetDimension + 0.1);
    } else if (event.key === 'ArrowLeft') {
      animateToDimension(state.targetDimension - 0.1);
    }
  });

  window.addEventListener('resize', resize, { passive: true });

  function tick(now) {
    const dt = Math.min(0.05, (now - state.lastTime) / 1000);
    state.lastTime = now;
    state.elapsed += dt;

    if (state.playing) {
      state.playPhase += dt * 0.31;
      const eased = (1 - Math.cos(state.playPhase)) * 0.5;
      state.dimension = 2 + eased * 2;
      state.targetDimension = state.dimension;
    } else if (!state.draggingSlider) {
      const responsiveness = 1 - Math.exp(-dt * 7.8);
      state.dimension += (state.targetDimension - state.dimension) * responsiveness;
      if (Math.abs(state.targetDimension - state.dimension) < 0.0002) {
        state.dimension = state.targetDimension;
      }
    }

    updateUI();
    drawMandala();
    requestAnimationFrame(tick);
  }

  buildMandala();
  resize();
  updateUI();
  requestAnimationFrame(tick);

  window.setTimeout(() => {
    if (!state.pointerDown && !state.playing) hint.classList.add('is-hidden');
  }, 6500);
})();
