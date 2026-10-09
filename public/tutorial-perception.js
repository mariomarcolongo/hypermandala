(() => {
  'use strict';

  if (window.__hypermandalaPerceptionLessonInstalled) return;
  window.__hypermandalaPerceptionLessonInstalled = true;

  const modes = document.querySelector('.learn4d-modes');
  const timeline = document.querySelector('.learn4d-timeline');
  const caption = document.querySelector('.learn4d-caption');
  const markers = document.querySelector('.learn4d-markers');
  const description = document.querySelector('.learn4d-step-description');
  if (!modes || !timeline || !caption || !markers) return;

  const WHITE = 'rgba(244,246,249,.92)';
  const FAINT = 'rgba(244,246,249,.18)';
  const GOLD = '#d8b662';
  const BLUE = '#6ca8ff';
  const GREEN = '#62d48b';
  const PINK = '#df7ab0';

  const style = document.createElement('style');
  style.id = 'learn4dPerceptionStyles';
  style.textContent = `
    .learn4d-perception-stage {
      position: fixed;
      inset: 0;
      z-index: 8;
      width: 100vw;
      height: 100dvh;
      pointer-events: none;
      opacity: 0;
      transition: opacity 140ms ease;
    }

    body.learn4d-active.learn4d-perception .learn4d-perception-stage {
      opacity: 1;
    }

    body.learn4d-active.learn4d-perception .learn4d-stage:not(.learn4d-perception-stage),
    body.learn4d-active.learn4d-perception .learn4d-enhanced-stage,
    body.learn4d-active.learn4d-perception .learn4d-elements-clean-stage,
    body.learn4d-active.learn4d-perception .learn4d-build-rotation-stage {
      opacity: 0 !important;
    }

    @media (prefers-reduced-motion: reduce) {
      .learn4d-perception-stage { transition: none !important; }
    }
  `;
  document.head.appendChild(style);

  const canvas = document.createElement('canvas');
  canvas.className = 'learn4d-perception-stage';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

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
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width, height };
  }

  function line(a, b, color = WHITE, width = 1.4, alpha = 1, dash = null) {
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

  function dot(p, radius = 3.2, color = WHITE, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p[0], p[1], radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function polygon(points, fill = null, stroke = null, alpha = 1, width = 1.2) {
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

  function circle(center, radius, fill = null, stroke = WHITE, alpha = 1, width = 1.2) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(center[0], center[1], radius, 0, Math.PI * 2);
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

  function label(text, p, size = 11, color = 'rgba(244,246,249,.62)', align = 'center') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `600 ${size}px ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, p[0], p[1]);
    ctx.restore();
  }

  function arrow(a, b, color = GOLD, alpha = .92, width = 1.8) {
    line(a, b, color, width, alpha);
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const length = 8;
    const spread = .55;
    line(b, [b[0] - Math.cos(angle - spread) * length, b[1] - Math.sin(angle - spread) * length], color, width, alpha);
    line(b, [b[0] - Math.cos(angle + spread) * length, b[1] - Math.sin(angle + spread) * length], color, width, alpha);
  }

  function cube(center, size, depth, color = WHITE, alpha = .72, fill = null) {
    const x = center[0];
    const y = center[1];
    const h = size / 2;
    const d = depth;
    const front = [[x - h, y - h], [x + h, y - h], [x + h, y + h], [x - h, y + h]];
    const back = front.map(([px, py]) => [px + d, py - d * .72]);
    if (fill) polygon(front, fill, null, alpha * .6);
    polygon(back, null, color, alpha * .56, 1.1);
    polygon(front, null, color, alpha, 1.45);
    for (let i = 0; i < 4; i += 1) line(front[i], back[i], color, 1.2, alpha * .72);
    return { front, back };
  }

  function tesseract(center, size, phase = 0) {
    const pulse = .84 + .10 * Math.sin(phase * Math.PI * 2);
    const d = size * .20;
    const offset = size * .17;
    const outer = cube([center[0] - offset * .28, center[1] + offset * .18], size, d, WHITE, .48);
    const inner = cube([center[0] + offset * .18, center[1] - offset * .10], size * .56 * pulse, d * .56, GOLD, .92);
    for (let i = 0; i < 4; i += 1) {
      line(outer.front[i], inner.front[i], GOLD, 1.35, .50);
      line(outer.back[i], inner.back[i], GOLD, 1.0, .32);
    }
  }

  function phaseInfo(t) {
    const x = clamp(t) * 4;
    const phase = Math.min(3, Math.floor(x));
    return { phase, local: x >= 4 ? 1 : x - phase };
  }

  function setDescription(text) {
    if (description) description.textContent = text;
  }

  function draw2DTo1D(width, height, local) {
    const s = Math.min(width, height) * .31;
    const c = [width * .5, height * .43];
    const half = s * .48;
    const world = [[c[0] - half, c[1] - half], [c[0] + half, c[1] - half], [c[0] + half, c[1] + half], [c[0] - half, c[1] + half]];
    polygon(world, 'rgba(108,168,255,.025)', BLUE, .55, 1.25);
    label('2D world', [c[0], c[1] - half - 24], 11, 'rgba(108,168,255,.82)');

    const observer = [c[0] - half * .72, c[1] + half * .62];
    dot(observer, 5, GOLD, .98);
    label('2D observer', [observer[0] - 10, observer[1] + 18], 9, 'rgba(216,182,98,.82)', 'right');

    const objects = [
      { p: [c[0] - half * .08, c[1] - half * .18], color: GREEN },
      { p: [c[0] + half * .26, c[1] + half * .10], color: PINK },
      { p: [c[0] + half * .54, c[1] - half * .38], color: BLUE },
    ];
    objects.forEach((o) => {
      dot(o.p, 7, o.color, .92);
      line(observer, o.p, o.color, .9, .22 + .34 * ease(local), [4, 5]);
    });

    const retinalY = c[1] + half + 58;
    const retinalA = [c[0] - half * .62, retinalY];
    const retinalB = [c[0] + half * .62, retinalY];
    line(retinalA, retinalB, WHITE, 2.2, .66);
    label('1D visual image', [c[0], retinalY + 22], 10, 'rgba(244,246,249,.72)');

    objects.forEach((o, i) => {
      const u = [.28, .55, .78][i];
      const p = [lerp(retinalA[0], retinalB[0], u), retinalY];
      dot(p, 4.1, o.color, .94);
    });

    caption.textContent = '2D world → 1D visual projection';
    setDescription('A creature confined to a 2D plane can use line-of-sight, but its instantaneous image is one-dimensional: directions around it collapse onto a line. The 2D world is richer than the image it receives.');
  }

  function draw3DTo2D(width, height, local) {
    const s = Math.min(width, height) * .24;
    const left = [width * .34, height * .43];
    const right = [width * .68, height * .43];
    const spin = (local - .5) * .18;

    cube([left[0] + spin * s, left[1]], s, s * .24, WHITE, .76, 'rgba(108,168,255,.018)');
    label('3D scene', [left[0], left[1] - s * .78], 11, 'rgba(108,168,255,.84)');

    arrow([left[0] + s * .72, left[1]], [right[0] - s * .72, right[1]], GOLD, .82);
    label('projection', [width * .51, left[1] - 20], 9, 'rgba(216,182,98,.76)');

    const screenW = s * 1.12;
    const screenH = s * .86;
    const screen = [
      [right[0] - screenW / 2, right[1] - screenH / 2],
      [right[0] + screenW / 2, right[1] - screenH / 2],
      [right[0] + screenW / 2, right[1] + screenH / 2],
      [right[0] - screenW / 2, right[1] + screenH / 2],
    ];
    polygon(screen, 'rgba(244,246,249,.018)', WHITE, .48, 1.15);
    cube(right, s * .55, s * .12, BLUE, .88);
    label('2D image / retina', [right[0], right[1] + screenH * .70], 10, 'rgba(244,246,249,.72)');

    caption.textContent = '3D world → 2D visual projection';
    setDescription('Humans do not receive a miniature 3D volume on the retina. Each retina records a 2D image. The brain reconstructs depth from binocular disparity, motion, perspective, shading and other cues.');
  }

  function draw4DTo3D(width, height, local) {
    const s = Math.min(width, height) * .22;
    const left = [width * .32, height * .43];
    const right = [width * .68, height * .43];

    tesseract(left, s, local);
    label('4D object', [left[0], left[1] - s * .92], 11, 'rgba(216,182,98,.88)');
    label('W is a real extra axis', [left[0], left[1] + s * .94], 9, 'rgba(216,182,98,.62)');

    arrow([left[0] + s * .80, left[1]], [right[0] - s * .78, right[1]], GOLD, .88);
    label('4D → 3D projection', [width * .50, left[1] - 22], 9, 'rgba(216,182,98,.80)');

    cube(right, s * 1.08, s * .28, WHITE, .76, 'rgba(98,212,139,.018)');
    const sliceCount = 5;
    for (let i = 0; i < sliceCount; i += 1) {
      const u = i / (sliceCount - 1);
      const y = right[1] - s * .36 + u * s * .72;
      line([right[0] - s * .36, y], [right[0] + s * .45, y - s * .10], GREEN, .8, .10 + .08 * Math.sin((u + local) * Math.PI));
    }
    label('3D visual volume', [right[0], right[1] + s * .93], 10, 'rgba(98,212,139,.80)');

    const noteY = height * .69;
    line([width * .39, noteY], [width * .61, noteY], FAINT, 1, .55);
    label('On a normal monitor, that 3D projection must be projected once more to 2D.', [width * .50, noteY + 19], 10, 'rgba(244,246,249,.56)');

    caption.textContent = '4D world → 3D visual projection → our 2D screen';
    setDescription('A hypothetical 4D observer could receive a genuinely 3D projection of a 4D scene. We cannot display that directly: Hypermandala must project 4D → 3D and then 3D → 2D, so overlap, foreshortening and apparent distortion are unavoidable clues of the missing dimension.');
  }

  function drawInteriorAccess(width, height, local) {
    const s = Math.min(width, height) * .22;
    const left = [width * .29, height * .45];
    const right = [width * .71, height * .45];
    const lift = ease(local) * s * .46;

    label('3D observer looking at a 2D world', [left[0], left[1] - s * 1.15], 11, 'rgba(108,168,255,.84)');
    const plane = [
      [left[0] - s * .78, left[1] + s * .30],
      [left[0] + s * .72, left[1] + s * .30],
      [left[0] + s * .50, left[1] - s * .12],
      [left[0] - s * 1.00, left[1] - s * .12],
    ];
    polygon(plane, 'rgba(108,168,255,.025)', BLUE, .30, 1);
    const inside2 = [left[0] - s * .10, left[1] + s * .06];
    circle(inside2, s * .25, 'rgba(223,122,176,.025)', PINK, .72, 1.4);
    dot(inside2, 4.5, GREEN, .98);
    label('inside', [inside2[0], inside2[1] + s * .36], 9, 'rgba(98,212,139,.78)');
    const observer3 = [left[0] - s * .10, left[1] - s * .26 - lift];
    dot(observer3, 6, GOLD, .98);
    arrow(observer3, inside2, GOLD, .80, 1.6);
    label('leave the plane', [observer3[0] + 10, observer3[1] - 16], 9, 'rgba(216,182,98,.76)', 'left');

    label('4D observer looking at a 3D world', [right[0], right[1] - s * 1.15], 11, 'rgba(216,182,98,.88)');
    cube(right, s * .94, s * .22, WHITE, .50, 'rgba(244,246,249,.012)');
    const inside3 = [right[0], right[1]];
    dot(inside3, 4.7, GREEN, .98);
    label('3D interior point', [inside3[0], inside3[1] + s * .68], 9, 'rgba(98,212,139,.78)');
    const wDir = [right[0] + s * .54, right[1] - s * .72 - lift * .70];
    dot(wDir, 6, GOLD, .98);
    arrow(wDir, inside3, GOLD, .84, 1.7);
    line([right[0] + s * .05, right[1] - s * .04], [right[0] + s * .72, right[1] - s * .82], GOLD, 1, .28, [4, 5]);
    label('W', [right[0] + s * .72, right[1] - s * .86], 10, 'rgba(216,182,98,.86)');

    caption.textContent = 'Higher dimension = a new direction around the lower-dimensional boundary';
    setDescription('A 3D observer can reach or see points inside a closed 2D boundary by moving out of the plane. Analogously, for a purely 3D object embedded in 4D, a 4D observer could use W-direction lines of sight to interior points without crossing the 3D boundary first. This is the precise sense in which the “see inside” analogy works.');
  }

  function draw(width, height, t) {
    const { phase, local } = phaseInfo(t);
    if (phase === 0) draw2DTo1D(width, height, local);
    else if (phase === 1) draw3DTo2D(width, height, local);
    else if (phase === 2) draw4DTo3D(width, height, local);
    else drawInteriorAccess(width, height, local);
  }

  const existingButtons = [...modes.querySelectorAll('.learn4d-mode')];
  const perception = document.createElement('button');
  perception.type = 'button';
  perception.className = 'learn4d-mode';
  perception.dataset.mode = 'perception';
  perception.textContent = 'Perception';
  perception.title = 'Compare what 2D, 3D and hypothetical 4D observers can visually receive';

  existingButtons.forEach((button) => {
    button.addEventListener('click', () => {
      document.body.classList.remove('learn4d-perception');
    });
  });

  perception.addEventListener('click', () => {
    const build = modes.querySelector('[data-mode="build"]');
    build?.click();
    modes.querySelectorAll('.learn4d-mode').forEach((button) => button.classList.remove('is-active'));
    perception.classList.add('is-active');
    document.body.classList.add('learn4d-perception');
    markers.innerHTML = '<span>2D→1D</span><span>3D→2D</span><span>4D→3D</span><span>extra axis</span><span>inside</span>';
  });

  modes.appendChild(perception);

  function frame() {
    const active = document.body.classList.contains('learn4d-active') && perception.classList.contains('is-active');
    document.body.classList.toggle('learn4d-perception', active);

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
