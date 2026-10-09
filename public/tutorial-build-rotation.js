(() => {
  'use strict';

  if (window.__hypermandalaBuildRotationInstalled) return;
  window.__hypermandalaBuildRotationInstalled = true;

  const modes = document.querySelector('.learn4d-modes');
  const timeline = document.querySelector('.learn4d-timeline');
  const caption = document.querySelector('.learn4d-caption');
  const description = document.querySelector('.learn4d-step-description');
  if (!modes || !timeline || !caption) return;

  const WHITE = 'rgba(244,246,249,.92)';
  const GOLD = '#d8b662';
  const BLUE = '#6ca8ff';
  /* Keep the dimensional build smooth, then devote most of each stage to the
     completed form's 360° rotation so it can actually be inspected. */
  const BUILD_END = .30;
  const FOUR_D_ROTATION_START = .44;

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
      vectors: [[s, 0], [0, s], [s * .34, -s * .28], [-s * .31, -s * .25]],
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

  function line(a, b, color, width, alpha, dash = null) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    if (dash) ctx.setLineDash(dash);
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

  function label(text, p, color = 'rgba(216,182,98,.72)') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '700 10px ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, p[0], p[1]);
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
    const rotationStart = stage === 3 ? FOUR_D_ROTATION_START : BUILD_END;
    if (stage >= 1 && local > rotationStart) {
      const turn = ease((local - rotationStart) / (1 - rotationStart));
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
    return { vertices, axes };
  }

  function key(bits, axes) {
    return axes.map((axis) => bits[axis]).join('');
  }

  function setDescription(text) {
    if (description) description.textContent = text;
  }

  function drawWAxis(width, height) {
    const { center, vectors } = basis(width, height);
    const v = vectors[3];
    const a = [center[0] - v[0] * .78, center[1] - v[1] * .78];
    const b = [center[0] + v[0] * .78, center[1] + v[1] * .78];
    line(a, b, GOLD, 1, .24, [4, 6]);
    label('W', [b[0] + 8, b[1] - 5]);
  }

  function draw(width, height, t) {
    const { stage, local } = stageInfo(t);
    const { vertices, axes } = geometry(stage, local);
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
        let color = newest ? GOLD : WHITE;
        let lineWidth = newest ? 2.15 : 1.35;
        let alpha = newest ? .92 : .60;

        /* At the 3D → 4D step, make the construction legible as two cubes:
           the original cube remains white, the W-shifted copy is blue, and
           only the new W-edges are gold. */
        if (stage === 3 && axis !== 3 && axes.includes(3)) {
          const shiftedCopy = v.bits[3] === 1;
          color = shiftedCopy ? BLUE : WHITE;
          lineWidth = shiftedCopy ? 1.65 : 1.35;
          alpha = shiftedCopy ? .82 : .56;
        }

        line(a, b, color, lineWidth, alpha);
      });
    });
    projected.forEach((p) => dot(p, 2.8, WHITE, .74));
    if (stage === 3) drawWAxis(width, height);

    if (stage === 0) {
      caption.textContent = local < .06 ? '0D · one point' : '0D → 1D · the point traces a line';
      setDescription(local < .06
        ? 'Start with a point: it has position, but no length.'
        : 'Move the point along the new X direction. Its path is a line. A 1D line has no intrinsic rotation plane yet.');
      return;
    }

    if (local <= BUILD_END) {
      caption.textContent = [
        '',
        '1D → 2D · the line extends along the new Y direction',
        '2D → 3D · the square extends along the new Z direction',
        '3D → 4D · duplicate the cube and separate the copy along W',
      ][stage];
      setDescription([
        '',
        'Move the whole line along Y. Every point traces a line, and the line sweeps out the square.',
        'Move the whole square along Z. Its edges sweep faces, while the square sweeps out the cube.',
        'The white cube stays fixed while an identical blue cube moves along W. Gold W-edges connect corresponding vertices; together the two cubes and connectors form the tesseract boundary.',
      ][stage]);
      return;
    }

    if (stage === 3 && local <= FOUR_D_ROTATION_START) {
      caption.textContent = '4D reached · white cube + W-shifted blue cube + gold W-edges';
      setDescription('Hold the completed projection still for a moment: the blue cube is not smaller or inside the white cube in 4D. That nesting is only the 2D appearance of separation along W.');
      return;
    }

    const names = { 1: 'X–Y', 2: 'X–Z', 3: 'X–W' };
    const explanations = {
      1: '2D reached. Now rotate the square a full 360° in the X–Y plane. It returns exactly to its starting orientation.',
      2: '3D reached. Now rotate the cube a full 360° in the X–Z plane, a rotation involving the newly added Z direction.',
      3: '4D reached. Now rotate the tesseract a full 360° in the X–W plane. The changing nesting and overlap are projection effects of a genuine 4D rotation, not deformation of the tesseract.',
    };
    caption.textContent = `${stage + 1}D reached · full 360° rotation in the ${names[stage]} plane · returns to the original orientation`;
    setDescription(explanations[stage]);
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