(() => {
  'use strict';

  if (window.__hypermandalaBuildRotationInstalled) return;
  window.__hypermandalaBuildRotationInstalled = true;

  const modes = document.querySelector('.learn4d-modes');
  const timeline = document.querySelector('.learn4d-timeline');
  const caption = document.querySelector('.learn4d-caption');
  if (!modes || !timeline || !caption) return;

  const WHITE = 'rgba(244,246,249,.92)';
  const GOLD = '#d8b662';
  const BUILD_END = .58;

  const style = document.createElement('style');
  style.id = 'learn4dBuildRotationStyles';
  style.textContent = `
    .learn4d-build-rotation-stage {
      position: fixed;
      inset: 0;
      z-index: 8;
      width: 100vw;
      height: 100dvh;
      pointer-events: none;
      opacity: 0;
      transition: opacity 140ms ease;
    }

    body.learn4d-active.learn4d-build-rotation .learn4d-build-rotation-stage {
      opacity: 1;
    }

    body.learn4d-active.learn4d-build-rotation .learn4d-stage,
    body.learn4d-active.learn4d-build-rotation .learn4d-enhanced-stage,
    body.learn4d-active.learn4d-build-rotation .learn4d-elements-clean-stage {
      opacity: 0 !important;
    }
  `;
  document.head.appendChild(style);

  const canvas = document.createElement('canvas');
  canvas.className = 'learn4d-build-rotation-stage';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (t) => {
    const x = clamp(t);
    return x * x * (3 - 2 * x);
  };

  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pw = Math.max(1, Math.round(width * dpr));
    const ph = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width, height };
  }

  function basis(width, height) {
    const s = Math.min(width, height) * .285;
    return {
      center: [width * .5, height * .445],
      vectors: [[s, 0], [0, s], [s * .34, -s * .28], [-s * .27, -s * .22]],
    };
  }

  function rotateInPlane(coord, a, b, angle) {
    if (!angle) return coord;
    const out = coord.slice();
    const x = coord[a] - .5;
    const y = coord[b] - .5;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    out[a] = .5 + x * c - y * s;
    out[b] = .5 + x * s + y * c;
    return out;
  }

  function project(coord, width, height) {
    const { center, vectors } = basis(width, height);
    let x = center[0];
    let y = center[1];
    for (let i = 0; i < 4; i += 1) {
      x += (coord[i] - .5) * vectors[i][0];
      y += (coord[i] - .5) * vectors[i][1];
    }
    return [x, y];
  }

  function line(a, b, color, width, alpha) {
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

  function dot(p, radius, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p[0], p[1], radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function stageInfo(t) {
    const x = clamp(t) * 4;
    const stage = Math.min(3, Math.floor(x));
    return { stage, local: x >= 4 ? 1 : x - stage };
  }

  function geometry(stage, local) {
    const buildEnd = stage === 0 ? 1 : BUILD_END;
    const newExtent = ease(clamp(local / buildEnd));
    const extents = [0, 0, 0, 0];
    for (let axis = 0; axis < stage; axis += 1) extents[axis] = 1;
    extents[stage] = newExtent;

    let angle = 0;
    let plane = null;
    if (stage >= 1 && local > BUILD_END) {
      const turn = ease((local - BUILD_END) / (1 - BUILD_END));
      angle = Math.PI * 2 * turn;
      plane = [0, stage];
    }

    const axes = extents.map((e, i) => e > .00001 ? i : -1).filter((i) => i >= 0);
    const count = axes.length ? (1 << axes.length) : 1;
    const vertices = [];
    for (let mask = 0; mask < count; mask += 1) {
      const coord = [.5, .5, .5, .5];
      const bits = [0, 0, 0, 0];
      axes.forEach((axis, k) => {
        const bit = (mask >> k) & 1;
        bits[axis] = bit;
        coord[axis] = .5 + (bit ? .5 : -.5) * extents[axis];
      });
      vertices.push({ coord: plane ? rotateInPlane(coord, plane[0], plane[1], angle) : coord, bits });
    }
    return { vertices, axes, plane, angle, newExtent };
  }

  function key(bits, axes) {
    return axes.map((axis) => bits[axis]).join('');
  }

  function draw(width, height, t) {
    const { stage, local } = stageInfo(t);
    const { vertices, axes, plane } = geometry(stage, local);
    const projected = new Map();
    vertices.forEach((v) => projected.set(key(v.bits, axes), project(v.coord, width, height)));

    axes.forEach((axis) => {
      vertices.forEach((v) => {
        if (v.bits[axis]) return;
        const nextBits = v.bits.slice();
        nextBits[axis] = 1;
        const a = projected.get(key(v.bits, axes));
        const b = projected.get(key(nextBits, axes));
        if (!a || !b) return;
        const newest = axis === stage;
        line(a, b, newest ? GOLD : WHITE, newest ? 2.15 : 1.35, newest ? .92 : .60);
      });
    });
    projected.forEach((p) => dot(p, 2.8, WHITE, .74));

    if (stage === 0) {
      caption.textContent = local < .06 ? '0D · one point' : '0D → 1D · the point traces a line';
      return;
    }

    if (local <= BUILD_END) {
      caption.textContent = [
        '',
        '1D → 2D · the line extends along the new Y direction',
        '2D → 3D · the square extends along the new Z direction',
        '3D → 4D · the cube extends along the new W direction',
      ][stage];
      return;
    }

    const names = {
      1: 'X–Y',
      2: 'X–Z',
      3: 'X–W',
    };
    caption.textContent = `${stage + 1}D reached · full 360° rotation in the ${names[stage]} plane · returns to the original orientation`;
  }

  function frame() {
    const activeMode = modes.querySelector('.learn4d-mode.is-active')?.dataset.mode;
    const active = document.body.classList.contains('learn4d-active') && activeMode === 'build';
    document.body.classList.toggle('learn4d-build-rotation', active);

    if (active) {
      const { width, height } = fitCanvas();
      ctx.clearRect(0, 0, width, height);
      draw(width, height, Number(timeline.value) || 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
