(() => {
  'use strict';

  const modesEl = document.querySelector('.learn4d-modes');
  const focusEl = document.querySelector('.learn4d-focus');
  const timeline = document.querySelector('.learn4d-timeline');
  const caption = document.querySelector('.learn4d-caption');
  if (!modesEl || !focusEl || !timeline || !caption) return;

  const WHITE = 'rgba(244,246,249,.92)';
  const GOLD = '#d8b662';
  const BLUE = '#6ca8ff';
  const GREEN = '#62d48b';
  const PINK = '#df7ab0';

  const style = document.createElement('style');
  style.textContent = `
    .learn4d-elements-clean-stage {
      position: fixed;
      inset: 0;
      z-index: 8;
      width: 100vw;
      height: 100dvh;
      pointer-events: none;
      opacity: 0;
      transition: opacity 140ms ease;
    }

    body.learn4d-active.learn4d-elements-clean .learn4d-elements-clean-stage {
      opacity: 1;
    }

    body.learn4d-active.learn4d-elements-clean .learn4d-stage,
    body.learn4d-active.learn4d-elements-clean .learn4d-enhanced-stage {
      opacity: 0 !important;
    }

    /* The teaching geometry should be the only geometry visible here. */
    body.learn4d-active.learn4d-elements-clean #solidLayer,
    body.learn4d-active.learn4d-elements-clean #mandala {
      opacity: 0 !important;
    }
  `;
  document.head.appendChild(style);

  const canvas = document.createElement('canvas');
  canvas.className = 'learn4d-elements-clean-stage';
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

  function line(a, b, color = WHITE, width = 1.4, alpha = 1) {
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

  function dot(p, radius = 3, color = WHITE, alpha = 1) {
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

  function stageInfo(t) {
    const x = clamp(t) * 4;
    const stage = Math.min(3, Math.floor(x));
    return { stage, local: x >= 4 ? 1 : x - stage };
  }

  /* The current shape stays centered. At the start of each dimensional step,
     both copies coincide at the previous shape. They then separate equally in
     the new axis, so stage boundaries are continuous and no geometry jumps. */
  function copyVertices(stage, axisValue) {
    const count = 1 << stage;
    const out = [];
    for (let mask = 0; mask < count; mask += 1) {
      const coord = [.5, .5, .5, .5];
      for (let axis = 0; axis < stage; axis += 1) {
        coord[axis] = (mask >> axis) & 1;
      }
      coord[stage] = axisValue;
      out.push({ coord, mask });
    }
    if (!out.length) out.push({ coord: [.5, .5, .5, .5], mask: 0 });
    return out;
  }

  function edgePairs(stage) {
    const out = [];
    const count = 1 << stage;
    for (let mask = 0; mask < count; mask += 1) {
      for (let axis = 0; axis < stage; axis += 1) {
        if ((mask >> axis) & 1) continue;
        out.push([mask, mask | (1 << axis)]);
      }
    }
    return out;
  }

  function faces(stage) {
    if (stage < 2) return [];
    const out = [];
    for (let a = 0; a < stage; a += 1) {
      for (let b = a + 1; b < stage; b += 1) {
        const fixedAxes = [];
        for (let axis = 0; axis < stage; axis += 1) {
          if (axis !== a && axis !== b) fixedAxes.push(axis);
        }
        const fixedCount = 1 << fixedAxes.length;
        for (let fixedMask = 0; fixedMask < fixedCount; fixedMask += 1) {
          let base = 0;
          fixedAxes.forEach((axis, k) => {
            if ((fixedMask >> k) & 1) base |= 1 << axis;
          });
          out.push([
            base,
            base | (1 << a),
            base | (1 << a) | (1 << b),
            base | (1 << b),
          ]);
        }
      }
    }
    return out;
  }

  function projectedCopy(stage, axisValue, width, height) {
    const vertices = copyVertices(stage, axisValue);
    return vertices.map((v) => project(v.coord, width, height));
  }

  function drawWire(stage, points, color, alpha, width = 1.2, showPoints = false) {
    edgePairs(stage).forEach(([a, b]) => line(points[a], points[b], color, width, alpha));
    if (stage === 0) dot(points[0], 3.8, color, alpha);
    else if (showPoints) points.forEach((p) => dot(p, 2.4, color, alpha));
  }

  function drawConnectors(a, b, color, alpha, width = 1.8) {
    for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
      line(a[i], b[i], color, width, alpha);
    }
  }

  function renderPoints(stage, low, high, u) {
    drawWire(stage, low, WHITE, .14, .9, false);
    drawWire(stage, high, WHITE, .14, .9, false);
    for (let i = 0; i < low.length; i += 1) {
      line(low[i], high[i], GOLD, 2.25, .90);
      dot(low[i], 3.1, WHITE, .78);
      dot(high[i], 3.2, GOLD, .98);
    }
    caption.textContent = `${stage}D → ${stage + 1}D · every point becomes an edge in the new dimension`;
  }

  function renderLines(stage, low, high) {
    drawWire(stage, low, WHITE, .28, 1.1, true);
    drawWire(stage, high, WHITE, .18, 1.0, false);

    if (stage < 1) {
      drawConnectors(low, high, GOLD, .88, 2.1);
      caption.textContent = '0D → 1D · first create an edge; lines appear after this step';
      return;
    }

    edgePairs(stage).forEach(([a, b]) => {
      polygon([low[a], low[b], high[b], high[a]], 'rgba(108,168,255,.075)', null, 1);
      line(low[a], low[b], BLUE, 1.65, .76);
      line(high[a], high[b], BLUE, 1.65, .76);
    });
    drawConnectors(low, high, GOLD, .26, 1.0);
    caption.textContent = `${stage}D → ${stage + 1}D · every line sweeps one face`;
  }

  function renderFaces(stage, low, high, local) {
    drawWire(stage, low, WHITE, .24, 1.05, false);
    drawWire(stage, high, WHITE, .17, 1.0, false);

    if (stage < 2) {
      drawConnectors(low, high, GOLD, .42, 1.2);
      caption.textContent = `${stage}D → ${stage + 1}D · square faces appear once the shape reaches 2D`;
      return;
    }

    const allFaces = faces(stage);
    const activeFace = Math.min(allFaces.length - 1, Math.floor(clamp(local) * allFaces.length));

    allFaces.forEach((face, index) => {
      const src = face.map((v) => low[v]);
      const dst = face.map((v) => high[v]);
      polygon(src, 'rgba(98,212,139,.024)', null, 1);
      polygon(dst, 'rgba(98,212,139,.024)', null, 1);
      if (index !== activeFace) return;
      polygon(src, 'rgba(98,212,139,.055)', GREEN, .88, 1.8);
      polygon(dst, 'rgba(98,212,139,.055)', GREEN, .88, 1.8);
      for (let i = 0; i < 4; i += 1) line(src[i], dst[i], GREEN, 1.75, .82);
    });

    caption.textContent = stage === 2
      ? '2D → 3D · the square face sweeps out the cube'
      : `3D → 4D · face ${activeFace + 1} of ${allFaces.length}: every square face sweeps a cubic cell`;
  }

  function renderCells(stage, low, high) {
    drawWire(stage, low, WHITE, .55, 1.35, true);
    drawWire(stage, high, PINK, .72, 1.5, true);
    drawConnectors(low, high, PINK, .78, 1.7);

    if (stage < 3) {
      caption.textContent = `${stage}D → ${stage + 1}D · a 3D cell exists only once the construction reaches the cube`;
      return;
    }
    caption.textContent = '3D → 4D · the entire cube sweeps a 4D body';
  }

  function renderAll(stage, low, high) {
    drawWire(stage, low, WHITE, .52, 1.3, true);
    drawWire(stage, high, WHITE, .32, 1.15, true);
    drawConnectors(low, high, GOLD, .88, 1.9);
    caption.textContent = [
      '0D → 1D · the point opens into an edge',
      '1D → 2D · points become edges while the line becomes a face',
      '2D → 3D · points → edges · lines → faces · square → cube',
      '3D → 4D · vertices → edges · edges → faces · faces → cells · cube → tesseract',
    ][stage];
  }

  function render(width, height, t) {
    const { stage, local } = stageInfo(t);
    const u = ease(local);
    const lowValue = .5 - .5 * u;
    const highValue = .5 + .5 * u;
    const low = projectedCopy(stage, lowValue, width, height);
    const high = projectedCopy(stage, highValue, width, height);
    const focus = focusEl.querySelector('.learn4d-focus-button.is-active')?.dataset.focus || 'all';

    if (focus === 'points') renderPoints(stage, low, high, u);
    else if (focus === 'lines') renderLines(stage, low, high);
    else if (focus === 'faces') renderFaces(stage, low, high, local);
    else if (focus === 'cells') renderCells(stage, low, high);
    else renderAll(stage, low, high);
  }

  function frame() {
    const activeMode = modesEl.querySelector('.learn4d-mode.is-active')?.dataset.mode;
    const isActive = document.body.classList.contains('learn4d-active') && activeMode === 'elements';
    document.body.classList.toggle('learn4d-elements-clean', isActive);

    if (isActive) {
      const { width, height } = fitCanvas();
      ctx.clearRect(0, 0, width, height);
      render(width, height, Number(timeline.value) || 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
