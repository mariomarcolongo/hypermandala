(() => {
  'use strict';

  const modesEl = document.querySelector('.learn4d-modes');
  const baseCanvas = document.querySelector('.learn4d-stage');
  const caption = document.querySelector('.learn4d-caption');
  const hud = document.querySelector('.learn4d-hud');
  const timeline = document.querySelector('.learn4d-timeline');
  const markers = document.querySelector('.learn4d-markers');
  if (!modesEl || !baseCanvas || !caption || !hud || !timeline || !markers) return;

  const GOLD = '#d8b662';
  const WHITE = 'rgba(244,246,249,.92)';
  const BLUE = '#6ca8ff';

  const style = document.createElement('style');
  style.textContent = `
    .learn4d-enhanced-stage {
      position: fixed;
      inset: 0;
      z-index: 8;
      width: 100vw;
      height: 100dvh;
      pointer-events: none;
      opacity: 0;
      transition: opacity 140ms ease;
    }
    body.learn4d-active.learn4d-enhanced .learn4d-enhanced-stage { opacity: 1; }
    body.learn4d-active.learn4d-enhanced .learn4d-stage:not(.learn4d-enhanced-stage) { opacity: 0 !important; }
  `;
  document.head.appendChild(style);

  const canvas = document.createElement('canvas');
  canvas.className = 'learn4d-enhanced-stage';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let mode = null;
  let raf = 0;

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
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

  function dot(p, r = 3.2, color = WHITE, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function basis(width, height) {
    const s = Math.min(width, height) * .285;
    return {
      center: [width * .5, height * .445],
      vectors: [[s, 0], [0, s], [s * .34, -s * .28], [-s * .27, -s * .22]],
    };
  }

  function project(c, width, height) {
    const { center, vectors } = basis(width, height);
    let x = center[0];
    let y = center[1];
    for (let i = 0; i < 4; i += 1) {
      x += (c[i] - .5) * vectors[i][0];
      y += (c[i] - .5) * vectors[i][1];
    }
    return [x, y];
  }

  function pairs(vs, axes) {
    const out = [];
    for (let i = 0; i < vs.length; i += 1) {
      for (const axis of axes) {
        const j = vs.findIndex((v) => axes.every(
          (a) => v.bits[a] === (a === axis ? 1 - vs[i].bits[a] : vs[i].bits[a]),
        ));
        if (j > i) out.push([i, j]);
      }
    }
    return out;
  }

  /* Canonical zero-origin copy used by Emergence.
     Keeping unused dimensions at zero makes the completed result of one step
     exactly the source object of the next: point -> line -> square -> cube. */
  function emergenceVertices(dim, newAxis, newAxisValue) {
    const axes = Array.from({ length: dim }, (_, i) => i);
    const out = [];
    const count = 1 << axes.length;

    for (let mask = 0; mask < count; mask += 1) {
      const c = [0, 0, 0, 0];
      const bits = [0, 0, 0, 0];
      c[newAxis] = newAxisValue;
      axes.forEach((axis, k) => {
        const bit = (mask >> k) & 1;
        bits[axis] = bit;
        c[axis] = bit;
      });
      out.push({ c, bits });
    }

    return { out, axes };
  }

  function drawEmergenceCopy(dim, axis, value, width, height, color, alpha, lineWidth = 1.4) {
    if (dim === 0) {
      const c = [0, 0, 0, 0];
      c[axis] = value;
      dot(project(c, width, height), 4.2, color, alpha);
      return [c];
    }

    const { out, axes } = emergenceVertices(dim, axis, value);
    const pts = out.map((v) => project(v.c, width, height));
    pairs(out, axes).forEach(([a, b]) => line(pts[a], pts[b], color, lineWidth, alpha));
    pts.forEach((p) => dot(p, 2.5, color, alpha * .82));
    return out.map((v) => v.c);
  }

  function stageInfo(t) {
    const x = clamp(t) * 4;
    const stage = Math.min(3, Math.floor(x));
    return { stage, local: x >= 4 ? 1 : x - stage };
  }

  function drawEmergence(width, height, t) {
    const { stage, local } = stageInfo(t);
    const axis = stage;

    /* Deliberately sequential:
       1. reveal an identical copy on top of the source;
       2. move only that copy in the new perpendicular direction;
       3. once it has arrived, connect corresponding vertices. */
    const duplicateIn = ease(clamp(local / .20));
    const move = ease(clamp((local - .20) / .52));
    const connect = ease(clamp((local - .72) / .28));

    const source = drawEmergenceCopy(stage, axis, 0, width, height, WHITE, .62, 1.35);
    const target = drawEmergenceCopy(
      stage,
      axis,
      move,
      width,
      height,
      GOLD,
      .96 * duplicateIn,
      1.75,
    );

    if (connect > 0) {
      for (let i = 0; i < Math.min(source.length, target.length); i += 1) {
        const end = source[i].slice();
        end[axis] = lerp(0, 1, connect);
        line(
          project(source[i], width, height),
          project(end, width, height),
          GOLD,
          2,
          .86,
        );
      }
    }

    const objects = ['point', 'line', 'square', 'cube'];
    const connections = ['points', 'endpoints', 'corners', 'vertices'];
    const results = ['line', 'square', 'cube', 'tesseract'];

    if (local < .20) {
      caption.textContent = `duplicate the ${objects[stage]} · the new copy is identical`;
    } else if (local < .72) {
      caption.textContent = `move the identical ${objects[stage]} in a new perpendicular direction`;
    } else if (connect < .98) {
      caption.textContent = `connect corresponding ${connections[stage]}`;
    } else {
      caption.textContent = `regular case · two ${objects[stage]}s + connections → ${results[stage]}`;
    }
  }

  function vertices(dim, fixedAxis = null, fixedValue = null) {
    const axes = [];
    for (let i = 0; i < dim; i += 1) if (i !== fixedAxis) axes.push(i);
    const out = [];
    const count = 1 << axes.length;
    for (let mask = 0; mask < count; mask += 1) {
      const c = [.5, .5, .5, .5];
      const bits = [0, 0, 0, 0];
      if (fixedAxis !== null) c[fixedAxis] = fixedValue;
      axes.forEach((axis, k) => {
        const bit = (mask >> k) & 1;
        bits[axis] = bit;
        c[axis] = bit;
      });
      out.push({ c, bits });
    }
    return { out, axes };
  }

  function drawWireExtent(width, height, extents, color = WHITE, alpha = .22, lineWidth = 1) {
    const axes = extents.map((e, i) => e > .0001 ? i : -1).filter((i) => i >= 0);
    const count = 1 << axes.length;
    const vs = [];
    for (let mask = 0; mask < count; mask += 1) {
      const c = [0, 0, 0, 0];
      const bits = [0, 0, 0, 0];
      axes.forEach((axis, k) => {
        const bit = (mask >> k) & 1;
        bits[axis] = bit;
        c[axis] = bit * extents[axis];
      });
      vs.push({ c, bits });
    }
    const pts = vs.map((v) => project(v.c, width, height));
    pairs(vs, axes).forEach(([a, b]) => line(pts[a], pts[b], color, lineWidth, alpha));
  }

  function drawSlice(dim, axis, value, width, height, color, alpha, lineWidth) {
    const { out, axes } = vertices(dim, axis, value);
    const pts = out.map((v) => project(v.c, width, height));
    pairs(out, axes).forEach(([a, b]) => line(pts[a], pts[b], color, lineWidth, alpha));
  }

  function drawContinuum(width, height, t) {
    const { stage, local } = stageInfo(t);
    const scan = ease(local);
    const samples = stage === 0 ? 120 : stage === 1 ? 52 : stage === 2 ? 28 : 20;

    if (stage === 0) {
      const a = project([0, 0, 0, 0], width, height);
      const b = project([1, 0, 0, 0], width, height);
      line(a, b, WHITE, 1.1, .16);

      for (let i = 0; i < samples; i += 1) {
        const u = i / (samples - 1);
        const p = project([u, 0, 0, 0], width, height);
        const distance = Math.abs(scan - u);
        const passed = u <= scan;
        const alpha = passed ? .10 + .46 * Math.exp(-distance * 7) : .025;
        dot(p, i % 12 === 0 ? 2.0 : 1.0, passed ? BLUE : WHITE, alpha);
      }

      dot(project([scan, 0, 0, 0], width, height), 4.8, GOLD, .98);
      caption.textContent = 'line = infinitely many points · the glowing point sweeps through the continuum';
      return;
    }

    if (stage === 1) {
      drawWireExtent(width, height, [1, scan, 0, 0], WHITE, .22, 1.05);
      for (let i = 0; i < samples; i += 1) {
        const u = (i / (samples - 1)) * scan;
        const distance = scan - u;
        const alpha = .05 + .18 * Math.exp(-distance * 7);
        line(project([0, u, 0, 0], width, height), project([1, u, 0, 0], width, height), BLUE, .7, alpha);
      }
      line(project([0, scan, 0, 0], width, height), project([1, scan, 0, 0], width, height), GOLD, 2.7, .98);
      caption.textContent = 'square = infinitely many parallel lines · one line sweeps continuously across the new axis';
      return;
    }

    if (stage === 2) {
      drawWireExtent(width, height, [1, 1, scan, 0], WHITE, .19, 1);
      for (let i = 0; i < samples; i += 1) {
        const u = (i / (samples - 1)) * scan;
        const distance = scan - u;
        const alpha = .04 + .15 * Math.exp(-distance * 6);
        drawSlice(2, 2, u, width, height, BLUE, alpha, .7);
      }
      drawSlice(2, 2, scan, width, height, GOLD, .98, 2.25);
      caption.textContent = 'cube = infinitely many square slices · the square sweeps continuously through depth';
      return;
    }

    drawWireExtent(width, height, [1, 1, 1, scan], WHITE, .16, .9);
    for (let i = 0; i < samples; i += 1) {
      const u = (i / (samples - 1)) * scan;
      const distance = scan - u;
      const alpha = .03 + .12 * Math.exp(-distance * 5);
      drawSlice(3, 3, u, width, height, BLUE, alpha, .62);
    }
    drawSlice(3, 3, scan, width, height, GOLD, .98, 2.05);
    caption.textContent = 'tesseract = infinitely many cubic slices · a cube sweeps continuously through W';
  }

  function setEnhanced(next) {
    mode = next;
    document.body.classList.toggle('learn4d-enhanced', Boolean(mode));
    modesEl.querySelectorAll('.learn4d-mode').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.mode === mode);
    });

    if (mode === 'emergence' || mode === 'continuum') {
      markers.innerHTML = '<span>0D</span><span>1D</span><span>2D</span><span>3D</span><span>4D</span>';
    }
  }

  const emergence = document.createElement('button');
  emergence.type = 'button';
  emergence.className = 'learn4d-mode';
  emergence.dataset.mode = 'emergence';
  emergence.textContent = 'Emergence';
  emergence.addEventListener('click', () => {
    const build = modesEl.querySelector('[data-mode="build"]');
    build?.click();
    setEnhanced('emergence');
  });

  const continuumButton = modesEl.querySelector('[data-mode="continuum"]');
  if (continuumButton) modesEl.insertBefore(emergence, continuumButton);
  else modesEl.appendChild(emergence);

  modesEl.querySelectorAll('.learn4d-mode').forEach((button) => {
    if (button === emergence) return;
    button.addEventListener('click', () => {
      if (button.dataset.mode === 'continuum') setEnhanced('continuum');
      else setEnhanced(null);
    });
  });

  function frame() {
    if (document.body.classList.contains('learn4d-active') && mode) {
      const { width, height } = fitCanvas();
      ctx.clearRect(0, 0, width, height);
      const t = Number(timeline.value) || 0;
      if (mode === 'emergence') drawEmergence(width, height, t);
      else drawContinuum(width, height, t);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);
})();
