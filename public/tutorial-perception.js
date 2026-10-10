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
  const FAINT = 'rgba(244,246,249,.16)';
  const GOLD = '#d8b662';
  const BLUE = '#6ca8ff';
  const GREEN = '#62d48b';
  const PINK = '#df7ab0';
  const RED = '#ef7777';

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
    body.learn4d-active.learn4d-perception .learn4d-perception-stage { opacity: 1; }
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

  function ring(p, radius, color = WHITE, alpha = 1, width = 1.2) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(p[0], p[1], radius, 0, Math.PI * 2);
    ctx.stroke();
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

  function label(text, p, size = 11, color = 'rgba(244,246,249,.62)', align = 'center') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `600 ${size}px ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, p[0], p[1]);
    ctx.restore();
  }

  function arrow(a, b, color = GOLD, alpha = .92, width = 1.7) {
    line(a, b, color, width, alpha);
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const length = 8;
    const spread = .54;
    line(b, [b[0] - Math.cos(angle - spread) * length, b[1] - Math.sin(angle - spread) * length], color, width, alpha);
    line(b, [b[0] - Math.cos(angle + spread) * length, b[1] - Math.sin(angle + spread) * length], color, width, alpha);
  }

  function cross(p, size = 6, color = RED, alpha = .9) {
    line([p[0] - size, p[1] - size], [p[0] + size, p[1] + size], color, 1.6, alpha);
    line([p[0] - size, p[1] + size], [p[0] + size, p[1] - size], color, 1.6, alpha);
  }

  function cube(center, size, depth, color = WHITE, alpha = .72, fill = null) {
    const x = center[0];
    const y = center[1];
    const h = size / 2;
    const d = depth;
    const front = [[x - h, y - h], [x + h, y - h], [x + h, y + h], [x - h, y + h]];
    const back = front.map(([px, py]) => [px + d, py - d * .70]);
    if (fill) polygon(front, fill, null, alpha * .55);
    polygon(back, null, color, alpha * .50, 1.0);
    polygon(front, null, color, alpha, 1.45);
    for (let i = 0; i < 4; i += 1) line(front[i], back[i], color, 1.1, alpha * .68);
    return { front, back };
  }

  function tesseract(center, size, local) {
    const pulse = .82 + .12 * Math.sin(local * Math.PI * 2);
    const d = size * .18;
    const offset = size * (.16 + .04 * Math.sin(local * Math.PI));
    const outer = cube([center[0] - offset * .26, center[1] + offset * .18], size, d, WHITE, .48);
    const inner = cube([center[0] + offset * .18, center[1] - offset * .10], size * .56 * pulse, d * .55, GOLD, .90);
    for (let i = 0; i < 4; i += 1) {
      line(outer.front[i], inner.front[i], GOLD, 1.35, .48);
      line(outer.back[i], inner.back[i], GOLD, 1.0, .30);
    }
  }

  function setDescription(text) {
    if (description) description.textContent = text;
  }

  function phaseInfo(t) {
    const x = clamp(t) * 5;
    const phase = Math.min(4, Math.floor(x));
    return { phase, local: x >= 5 ? 1 : x - phase };
  }

  function viewArea(width, height) {
    const top = Math.max(128, height * .16);
    const bottom = Math.min(height - 142, height * .80);
    return { top, bottom, height: Math.max(160, bottom - top), centerY: (top + bottom) / 2 };
  }

  function splitPanels(width, height) {
    const area = viewArea(width, height);
    if (width >= 760) {
      return {
        a: { x: width * .08, y: area.top, w: width * .38, h: area.height },
        b: { x: width * .54, y: area.top, w: width * .38, h: area.height },
      };
    }
    return {
      a: { x: width * .08, y: area.top, w: width * .84, h: area.height * .43 },
      b: { x: width * .08, y: area.top + area.height * .54, w: width * .84, h: area.height * .43 },
    };
  }

  function panelFrame(panel, title, tint = WHITE) {
    const r = Math.min(panel.w, panel.h) * .04;
    ctx.save();
    ctx.globalAlpha = .7;
    ctx.strokeStyle = 'rgba(255,255,255,.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(panel.x, panel.y, panel.w, panel.h, r);
    ctx.stroke();
    ctx.restore();
    label(title, [panel.x + panel.w / 2, panel.y + 18], 10, tint);
  }

  function rectBoundaryHit(observer, target, rect) {
    const dx = target[0] - observer[0];
    const dy = target[1] - observer[1];
    const hits = [];
    const tryX = (x) => {
      if (Math.abs(dx) < 1e-8) return;
      const t = (x - observer[0]) / dx;
      const y = observer[1] + t * dy;
      if (t > 0 && t < 1 && y >= rect.y0 && y <= rect.y1) hits.push({ t, p: [x, y] });
    };
    const tryY = (y) => {
      if (Math.abs(dy) < 1e-8) return;
      const t = (y - observer[1]) / dy;
      const x = observer[0] + t * dx;
      if (t > 0 && t < 1 && x >= rect.x0 && x <= rect.x1) hits.push({ t, p: [x, y] });
    };
    tryX(rect.x0); tryX(rect.x1); tryY(rect.y0); tryY(rect.y1);
    hits.sort((a, b) => a.t - b.t);
    return hits[0]?.p || target;
  }

  function drawFlatlanderView(width, height, local) {
    const { a, b } = splitPanels(width, height);
    panelFrame(a, 'outside diagram · the 2D world', 'rgba(108,168,255,.80)');
    panelFrame(b, 'what the Flatlander actually receives', 'rgba(216,182,98,.82)');

    const cx = a.x + a.w * .52;
    const cy = a.y + a.h * .55;
    const rw = a.w * .34;
    const rh = a.h * .26;
    const room = { x0: cx - rw, x1: cx + rw, y0: cy - rh, y1: cy + rh };
    polygon([[room.x0, room.y0], [room.x1, room.y0], [room.x1, room.y1], [room.x0, room.y1]], 'rgba(223,122,176,.025)', PINK, .78, 2.0);
    label('closed 2D room', [cx, room.y0 - 18], 9, 'rgba(223,122,176,.80)');

    const target = [cx + rw * .16, cy - rh * .06];
    ring(target, Math.max(10, rh * .18), GREEN, .64, 1.2);
    dot(target, 4.5, GREEN, .96);
    label('inside', [target[0], target[1] + rh * .34], 9, 'rgba(98,212,139,.78)');

    const angle = lerp(-2.65, -.28, ease(local));
    const observer = [cx + Math.cos(angle) * rw * 1.55, cy + Math.sin(angle) * rh * 1.65];
    dot(observer, 5.5, GOLD, .98);
    ring(observer, 9, GOLD, .45, 1);
    label('2D observer', [observer[0], observer[1] + 18], 9, 'rgba(216,182,98,.84)');

    const hit = rectBoundaryHit(observer, target, room);
    line(observer, hit, GOLD, 1.25, .55, [5, 5]);
    cross(hit, 5, RED, .92);
    line(hit, target, RED, 1.0, .16, [3, 6]);
    label('wall blocks line of sight', [lerp(observer[0], hit[0], .55), lerp(observer[1], hit[1], .55) - 13], 8, 'rgba(239,119,119,.80)');

    const horizonY = b.y + b.h * .58;
    const horizonA = [b.x + b.w * .10, horizonY];
    const horizonB = [b.x + b.w * .90, horizonY];
    line(horizonA, horizonB, WHITE, 2.0, .55);
    label('1D visual field', [b.x + b.w / 2, horizonY + 24], 9, 'rgba(244,246,249,.62)');

    const drift = Math.sin(local * Math.PI * 2) * b.w * .08;
    const wallCenter = b.x + b.w * .52 + drift;
    line([wallCenter - b.w * .14, horizonY], [wallCenter + b.w * .14, horizonY], PINK, 8, .84);
    dot([wallCenter - b.w * .09, horizonY], 4.2, BLUE, .84);
    dot([wallCenter + b.w * .08, horizonY], 4.2, WHITE, .80);
    label('near wall fills those directions', [wallCenter, horizonY - 28], 9, 'rgba(223,122,176,.80)');
    label('the green object inside does not appear', [b.x + b.w / 2, b.y + b.h * .80], 9, 'rgba(98,212,139,.58)');

    caption.textContent = 'Flatland first-person · a 2D being gets a 1D image, and the boundary hides the interior';
    setDescription('The left panel is our privileged view from outside the plane. The right panel is the Flatlander’s instantaneous visual field: one-dimensional. A closed 1D boundary can occlude whatever is inside because every line of sight must stay in the 2D plane.');
  }

  function planeProject(center, scale, x, y, z, lift) {
    const depth = .09 + .46 * lift;
    return [
      center[0] + x * scale + y * scale * .24,
      center[1] + y * scale * depth - z * scale * .72,
    ];
  }

  function drawRiseInto3D(width, height, local) {
    const area = viewArea(width, height);
    const c = [width * .50, area.centerY + 10];
    const s = Math.min(width, area.height) * .28;
    const lift = ease(local);

    const plane = [[-1,-.72],[1,-.72],[1,.72],[-1,.72]].map(([x,y]) => planeProject(c, s, x, y, 0, lift));
    polygon(plane, 'rgba(108,168,255,.025)', BLUE, .34, 1.1);
    label('the 2D plane', planeProject(c, s, 0, -.92, 0, lift), 10, 'rgba(108,168,255,.72)');

    const roomRaw = [[-.46,-.30],[.46,-.30],[.46,.30],[-.46,.30]];
    const room = roomRaw.map(([x,y]) => planeProject(c, s, x, y, 0, lift));
    polygon(room, 'rgba(223,122,176,.018)', PINK, .82, 2.0);
    const target = planeProject(c, s, .10, .03, 0, lift);
    const visible = ease(clamp((lift - .20) / .45));
    ring(target, 13, GREEN, .30 + .52 * visible, 1.2);
    dot(target, 4.8, GREEN, .25 + .72 * visible);

    const cameraBase = planeProject(c, s, -.68, .62, 0, lift);
    const camera = planeProject(c, s, -.68, .62, .15 + .92 * lift, lift);
    dot(cameraBase, 4.2, GOLD, .30);
    line(cameraBase, camera, GOLD, 1.25, .52, [4, 5]);
    dot(camera, 6, GOLD, .98);
    label('3D observer', [camera[0] - 8, camera[1] - 18], 10, 'rgba(216,182,98,.86)', 'right');

    const zTop = planeProject(c, s, -.93, .64, .92, lift);
    const zBase = planeProject(c, s, -.93, .64, 0, lift);
    arrow(zBase, zTop, GOLD, .80, 1.4);
    label('new Z direction', [zTop[0] - 4, zTop[1] - 15], 9, 'rgba(216,182,98,.76)', 'right');

    if (lift < .23) {
      const blocked = planeProject(c, s, -.18, .28, 0, lift);
      line(camera, blocked, RED, 1.1, .40, [4, 5]);
      cross(blocked, 5, RED, .82);
    } else {
      line(camera, target, GOLD, 1.4, .34 + .48 * visible, [5, 5]);
    }

    label(lift < .28 ? 'still almost in the plane' : 'the line of sight now passes above the 1D wall', [width * .50, area.bottom - 16], 10, lift < .28 ? 'rgba(239,119,119,.72)' : 'rgba(98,212,139,.78)');

    caption.textContent = 'Rise out of Flatland · the boundary stops being an obstacle';
    setDescription('Nothing about the room changed. Only the observer gained a new direction. Once the viewpoint moves into Z, a sightline can leave the 2D plane, pass over the 1D boundary, and return to any interior point. That is the key higher-dimensional trick.');
  }

  function drawSeeInside2D(width, height, local) {
    const { a, b } = splitPanels(width, height);
    panelFrame(a, 'Flatlander looking at another 2D being', 'rgba(216,182,98,.82)');
    panelFrame(b, 'our 3D view from above the plane', 'rgba(98,212,139,.82)');

    const ay = a.y + a.h * .58;
    line([a.x + a.w * .10, ay], [a.x + a.w * .90, ay], WHITE, 1.8, .46);
    const silhouetteX = a.x + a.w * (.48 + .08 * Math.sin(local * Math.PI * 2));
    line([silhouetteX - a.w * .09, ay], [silhouetteX + a.w * .09, ay], BLUE, 9, .80);
    label('only a 1D slice / silhouette', [silhouetteX, ay - 28], 9, 'rgba(108,168,255,.80)');
    dot([a.x + a.w * .20, ay], 5, GOLD, .96);
    label('observer', [a.x + a.w * .20, ay + 22], 8, 'rgba(216,182,98,.78)');

    const cx = b.x + b.w * .50;
    const cy = b.y + b.h * .56;
    const r = Math.min(b.w, b.h) * .24;
    const body = [];
    const n = 18;
    for (let i = 0; i < n; i += 1) {
      const q = (i / n) * Math.PI * 2;
      const wobble = 1 + .10 * Math.sin(q * 3 + local * Math.PI * 2);
      body.push([cx + Math.cos(q) * r * wobble, cy + Math.sin(q) * r * .76 * wobble]);
    }
    polygon(body, 'rgba(108,168,255,.035)', BLUE, .76, 1.8);
    label('2D body boundary', [cx, cy - r * .93], 9, 'rgba(108,168,255,.74)');

    const organs = [
      { p: [cx - r * .22, cy - r * .08], c: PINK, name: 'A' },
      { p: [cx + r * .19, cy - r * .20], c: GREEN, name: 'B' },
      { p: [cx + r * .06, cy + r * .23], c: GOLD, name: 'C' },
    ];
    organs.forEach((o, i) => {
      const pulse = 4.4 + 1.6 * Math.sin(local * Math.PI * 2 + i * 1.8);
      ring(o.p, pulse + 6, o.c, .28, 1);
      dot(o.p, pulse, o.c, .94);
    });

    const camera = [cx + r * .90, cy - r * 1.05];
    dot(camera, 6, WHITE, .96);
    label('3D observer above plane', [camera[0], camera[1] - 18], 9, 'rgba(244,246,249,.76)');
    organs.forEach((o) => line(camera, o.p, o.c, 1.0, .24, [4, 5]));
    label('all interior points can be addressed directly', [cx, b.y + b.h * .84], 9, 'rgba(98,212,139,.76)');

    caption.textContent = 'Why we could “see inside” a truly 2D being';
    setDescription('In the ideal geometric analogy, a 2D being’s enclosing boundary is one-dimensional. From inside the plane, that boundary can hide what lies behind it. From 3D, we look down across the whole 2D area, so the boundary does not sit between our eye and the interior points.');
  }

  function drawRiseInto4D(width, height, local) {
    const area = viewArea(width, height);
    const c = [width * .50, area.centerY + 6];
    const s = Math.min(width, area.height) * .28;
    const lift = ease(local);

    const shell = cube(c, s * 1.15, s * .24, WHITE, .58, 'rgba(244,246,249,.014)');
    label('closed 3D body / room', [c[0], c[1] - s * .86], 10, 'rgba(244,246,249,.72)');

    const internals = [
      [c[0] - s * .18, c[1] - s * .05, PINK],
      [c[0] + s * .12, c[1] - s * .20, GREEN],
      [c[0] + s * .04, c[1] + s * .17, BLUE],
    ];

    const wStart = [c[0] + s * .70, c[1] - s * .58];
    const wEnd = [c[0] + s * (1.05 + .55 * lift), c[1] - s * (1.00 + .45 * lift)];
    arrow(wStart, wEnd, GOLD, .86, 1.6);
    label('W', [wEnd[0] + 8, wEnd[1] - 6], 11, 'rgba(216,182,98,.90)', 'left');

    for (let i = 1; i <= 4; i += 1) {
      const u = i / 4;
      const off = lift * u * s * .24;
      cube([c[0] + off, c[1] - off * .72], s * 1.15, s * .24, GOLD, .035 + .035 * (1 - u));
    }

    const observer = [lerp(shell.front[1][0] + 18, wEnd[0] - 16, lift), lerp(shell.front[1][1] - 18, wEnd[1] + 18, lift)];
    dot(observer, 6.5, GOLD, .98);
    label('hypothetical 4D observer', [observer[0] - 8, observer[1] - 18], 9, 'rgba(216,182,98,.84)', 'right');

    internals.forEach(([x, y, color], i) => {
      const visible = ease(clamp((lift - .18 - i * .05) / .42));
      ring([x, y], 10 + i * 2, color, .18 + .38 * visible, 1);
      dot([x, y], 4.2 + i * .3, color, .12 + .84 * visible);
      if (visible > .04) line(observer, [x, y], color, 1.0, .12 + .30 * visible, [4, 5]);
    });

    const note = lift < .25
      ? 'from ordinary 3D viewpoints, the shell can occlude the interior'
      : 'with W available, sightlines need not cross the 3D boundary first';
    label(note, [width * .50, area.bottom - 14], 10, lift < .25 ? 'rgba(239,119,119,.68)' : 'rgba(98,212,139,.78)');

    caption.textContent = 'Replay the same move with us · 3D → 4D';
    setDescription('Replace “2D plane + Z” with “3D space + W.” For a purely 3D object embedded in 4D, an observer displaced in W can connect to an interior 3D point along a line that touches our 3D space only at that target point. The animation uses translucency only to depict that higher-dimensional access on a 2D monitor.');
  }

  function drawProjectionChain(width, height, local) {
    const area = viewArea(width, height);
    const narrow = width < 760;
    const y = area.centerY + 6;
    const s = Math.min(width, area.height) * (narrow ? .16 : .18);
    const xs = narrow ? [width * .22, width * .50, width * .78] : [width * .25, width * .50, width * .75];

    tesseract([xs[0], y], s * 1.15, local);
    label('4D object', [xs[0], y - s * .95], 10, 'rgba(216,182,98,.84)');

    arrow([xs[0] + s * .72, y], [xs[1] - s * .72, y], GOLD, .78, 1.4);
    label('4D → 3D', [(xs[0] + xs[1]) / 2, y - 22], 9, 'rgba(216,182,98,.72)');

    cube([xs[1], y], s * .95, s * .22, GREEN, .72, 'rgba(98,212,139,.018)');
    const vox = [
      [xs[1] - s * .16, y - s * .08, PINK],
      [xs[1] + s * .14, y - s * .18, GOLD],
      [xs[1] + s * .04, y + s * .16, BLUE],
    ];
    vox.forEach(([x, yy, c]) => dot([x, yy], 4, c, .90));
    label('hypothetical 3D visual field', [xs[1], y + s * .86], 9, 'rgba(98,212,139,.76)');

    arrow([xs[1] + s * .72, y], [xs[2] - s * .72, y], GOLD, .78, 1.4);
    label('3D → 2D', [(xs[1] + xs[2]) / 2, y - 22], 9, 'rgba(216,182,98,.72)');

    const screen = [
      [xs[2] - s * .55, y - s * .44], [xs[2] + s * .55, y - s * .44],
      [xs[2] + s * .55, y + s * .44], [xs[2] - s * .55, y + s * .44],
    ];
    polygon(screen, 'rgba(244,246,249,.012)', WHITE, .45, 1.2);
    cube([xs[2], y], s * .56, s * .11, WHITE, .68);
    cube([xs[2] + s * .04, y - s * .02], s * .29 * (.9 + .1 * Math.sin(local * Math.PI * 2)), s * .06, GOLD, .78);
    label('our 2D monitor', [xs[2], y + s * .70], 9, 'rgba(244,246,249,.68)');

    caption.textContent = 'Why a real 4D view still looks strange here · 4D → 3D → 2D';
    setDescription('The hypothetical 4D observer gets one dimension more of visual data than we do. Hypermandala cannot give your eyes a real 3D retinal image, so it must flatten the 4D → 3D result again onto this 2D screen. Nested cubes, overlap and foreshortening are therefore projections of a projection.');
  }

  function draw(width, height, t) {
    const { phase, local } = phaseInfo(t);
    if (phase === 0) drawFlatlanderView(width, height, local);
    else if (phase === 1) drawRiseInto3D(width, height, local);
    else if (phase === 2) drawSeeInside2D(width, height, local);
    else if (phase === 3) drawRiseInto4D(width, height, local);
    else drawProjectionChain(width, height, local);
  }

  const existingButtons = [...modes.querySelectorAll('.learn4d-mode')];
  const perception = document.createElement('button');
  perception.type = 'button';
  perception.className = 'learn4d-mode';
  perception.dataset.mode = 'perception';
  perception.textContent = 'Perception';
  perception.title = 'Experience the dimensional viewpoint shift from Flatland to 4D';

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
    markers.innerHTML = '<span>Flatland view</span><span>rise to 3D</span><span>see inside 2D</span><span>rise to 4D</span><span>projection</span>';
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
