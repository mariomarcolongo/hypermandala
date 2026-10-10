(() => {
  'use strict';

  if (window.__hypermandalaPerceptionLessonInstalled) return;
  window.__hypermandalaPerceptionLessonInstalled = true;

  const modes = document.querySelector('.learn4d-modes');
  const hud = document.querySelector('.learn4d-hud');
  const timeline = document.querySelector('.learn4d-timeline');
  const caption = document.querySelector('.learn4d-caption');
  const markers = document.querySelector('.learn4d-markers');
  const timelineRow = document.querySelector('.learn4d-timeline-row');
  const description = document.querySelector('.learn4d-step-description');
  if (!modes || !hud || !timeline || !caption || !markers || !timelineRow) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

    .learn4d-perception-nav {
      display: none;
      align-items: center;
      justify-content: center;
      gap: 3px;
      flex-wrap: wrap;
      padding: 1px 0 2px;
    }
    body.learn4d-active.learn4d-perception .learn4d-perception-nav { display: flex; }
    .learn4d-perception-scene {
      min-height: 27px;
      padding: 0 8px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: rgba(238,239,242,.34);
      cursor: pointer;
      font-size: 7.5px;
      font-weight: 720;
      letter-spacing: .045em;
      text-transform: uppercase;
    }
    .learn4d-perception-scene:hover { color: rgba(248,249,250,.84); }
    .learn4d-perception-scene.is-active {
      background: rgba(216,182,98,.10);
      color: rgba(238,208,130,.96);
      box-shadow: inset 0 -1px 0 rgba(216,182,98,.42);
    }
    .learn4d-perception-loop-note {
      display: none;
      width: 100%;
      margin-top: -1px;
      color: rgba(225,229,235,.28);
      font-size: 7px;
      font-weight: 650;
      letter-spacing: .055em;
      text-align: center;
      text-transform: uppercase;
    }
    body.learn4d-active.learn4d-perception .learn4d-perception-loop-note { display: block; }
    body.learn4d-active.learn4d-perception .learn4d-markers,
    body.learn4d-active.learn4d-perception .learn4d-play,
    body.learn4d-active.learn4d-perception .learn4d-timeline { display: none !important; }
    body.learn4d-active.learn4d-perception .learn4d-timeline-row {
      display: flex;
      justify-content: flex-end;
      min-height: 27px;
    }

    @media (max-width: 680px) {
      .learn4d-perception-scene { padding: 0 6px; font-size: 7px; }
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
  const angleDelta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

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
    const offset = size * (.16 + .04 * Math.sin(local * Math.PI * 2));
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

  function viewArea(width, height) {
    const top = Math.max(128, height * .16);
    const bottom = Math.min(height - 150, height * .79);
    return { top, bottom, height: Math.max(160, bottom - top), centerY: (top + bottom) / 2 };
  }

  function splitPanels(width, height) {
    const area = viewArea(width, height);
    if (width >= 760) {
      return {
        a: { x: width * .07, y: area.top, w: width * .40, h: area.height },
        b: { x: width * .53, y: area.top, w: width * .40, h: area.height },
      };
    }
    return {
      a: { x: width * .07, y: area.top, w: width * .86, h: area.height * .43 },
      b: { x: width * .07, y: area.top + area.height * .54, w: width * .86, h: area.height * .43 },
    };
  }

  function panelFrame(panel, title, tint = WHITE) {
    ctx.save();
    ctx.globalAlpha = .72;
    ctx.strokeStyle = 'rgba(255,255,255,.07)';
    ctx.lineWidth = 1;
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
    ctx.restore();
    label(title, [panel.x + panel.w / 2, panel.y + 18], 10, tint);
  }

  const WALLS = {
    top: BLUE,
    right: PINK,
    bottom: WHITE,
    left: GOLD,
  };

  function drawColoredRoom(rect, alpha = .84) {
    line([rect.x0, rect.y0], [rect.x1, rect.y0], WALLS.top, 3, alpha);
    line([rect.x1, rect.y0], [rect.x1, rect.y1], WALLS.right, 3, alpha);
    line([rect.x1, rect.y1], [rect.x0, rect.y1], WALLS.bottom, 3, alpha);
    line([rect.x0, rect.y1], [rect.x0, rect.y0], WALLS.left, 3, alpha);
  }

  function rayRectHit(origin, angle, rect) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const hits = [];
    const tryVertical = (x, side) => {
      if (Math.abs(dx) < 1e-8) return;
      const t = (x - origin[0]) / dx;
      const y = origin[1] + t * dy;
      if (t > 0 && y >= rect.y0 - 1e-6 && y <= rect.y1 + 1e-6) hits.push({ t, p: [x, y], side });
    };
    const tryHorizontal = (y, side) => {
      if (Math.abs(dy) < 1e-8) return;
      const t = (y - origin[1]) / dy;
      const x = origin[0] + t * dx;
      if (t > 0 && x >= rect.x0 - 1e-6 && x <= rect.x1 + 1e-6) hits.push({ t, p: [x, y], side });
    };
    tryVertical(rect.x0, 'left');
    tryVertical(rect.x1, 'right');
    tryHorizontal(rect.y0, 'top');
    tryHorizontal(rect.y1, 'bottom');
    hits.sort((a, b) => a.t - b.t);
    return hits[0] || null;
  }

  function pingPongWithHolds(u) {
    if (u < .12) return 0;
    if (u < .46) return ease((u - .12) / .34);
    if (u < .62) return 1;
    if (u < .96) return 1 - ease((u - .62) / .34);
    return 0;
  }

  function drawFlatlanderView(width, height, local) {
    const { a, b } = splitPanels(width, height);
    panelFrame(a, 'same instant · view from above Flatland', 'rgba(108,168,255,.82)');
    panelFrame(b, 'same instant · Flatlander first-person 1D image', 'rgba(216,182,98,.84)');

    const cx = a.x + a.w * .52;
    const cy = a.y + a.h * .56;
    const rw = a.w * .24;
    const rh = a.h * .21;
    const room = { x0: cx - rw, x1: cx + rw, y0: cy - rh, y1: cy + rh };
    drawColoredRoom(room);
    label('four wall segments keep the same colors in both views', [cx, room.y0 - 22], 8, 'rgba(244,246,249,.48)');

    const target = [cx + rw * .12, cy - rh * .08];
    ring(target, Math.max(9, rh * .16), GREEN, .62, 1.1);
    dot(target, 4.5, GREEN, .98);
    label('interior target', [target[0], target[1] + rh * .34], 8, 'rgba(98,212,139,.78)');

    const orbit = -Math.PI * .82 + local * Math.PI * 2;
    const observer = [cx + Math.cos(orbit) * rw * 1.78, cy + Math.sin(orbit) * rh * 1.95];
    const heading = Math.atan2(target[1] - observer[1], target[0] - observer[0]);
    const fov = 1.32;
    const rayCount = 49;
    const hits = [];

    dot(observer, 5.6, GOLD, .98);
    ring(observer, 9.5, GOLD, .40, 1);
    label('2D observer', [observer[0], observer[1] + 18], 8, 'rgba(216,182,98,.86)');

    for (let i = 0; i < rayCount; i += 1) {
      const u = i / (rayCount - 1);
      const angle = heading + (u - .5) * fov;
      hits.push({ u, angle, hit: rayRectHit(observer, angle, room) });
    }

    const horizonY = b.y + b.h * .58;
    const x0 = b.x + b.w * .10;
    const x1 = b.x + b.w * .90;
    line([x0, horizonY], [x1, horizonY], 'rgba(255,255,255,.11)', 9, .65);
    label('angular direction →', [x1, horizonY + 24], 8, 'rgba(244,246,249,.42)', 'right');

    const step = (x1 - x0) / (rayCount - 1);
    hits.forEach(({ u, hit }) => {
      const x = lerp(x0, x1, u);
      if (!hit) return;
      const alpha = .58 + .28 * clamp(1 - hit.t / (rw * 5));
      line([x - step * .48, horizonY], [x + step * .48, horizonY], WALLS[hit.side], 8, alpha);
    });

    const special = [
      { offset: -.13, name: 'A' },
      { offset: 0, name: 'B' },
      { offset: .13, name: 'C' },
    ];
    special.forEach(({ offset, name }) => {
      const angle = heading + offset;
      const hit = rayRectHit(observer, angle, room);
      if (!hit) return;
      const u = offset / fov + .5;
      const x = lerp(x0, x1, u);
      line(observer, hit.p, WALLS[hit.side], 1.25, .48, [4, 5]);
      ring(hit.p, 5, WALLS[hit.side], .88, 1.2);
      label(name, [hit.p[0], hit.p[1] - 10], 8, WALLS[hit.side]);
      dot([x, horizonY], 5.1, WALLS[hit.side], .98);
      label(name, [x, horizonY - 17], 8, WALLS[hit.side]);
    });

    const central = rayRectHit(observer, heading, room);
    if (central) {
      line(observer, central.p, WALLS[central.side], 1.5, .70, [5, 5]);
      cross(central.p, 5, RED, .94);
      line(central.p, target, RED, 1, .20, [3, 6]);
      cross([lerp(x0, x1, .5), horizonY + 34], 5, RED, .90);
      label('target direction is blocked by the B wall sample', [b.x + b.w / 2, b.y + b.h * .80], 8, 'rgba(239,119,119,.76)');
    }

    caption.textContent = 'Flatland POV · the overhead rays and the 1D image are now the same geometry';
    setDescription('Every colored sample on the right comes from an actual ray drawn in the overhead world on the left. A, B and C are the same rays in both panels. The green target lies behind the nearest wall hit, so it cannot appear in the Flatlander’s one-dimensional image.');
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
    const lift = pingPongWithHolds(local);

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
    label('observer', [camera[0] - 8, camera[1] - 18], 10, 'rgba(216,182,98,.86)', 'right');

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

    label(lift < .28 ? 'in-plane: boundary blocks the sightline' : 'out of plane: sightline passes over the boundary', [width * .50, area.bottom - 14], 10, lift < .28 ? 'rgba(239,119,119,.72)' : 'rgba(98,212,139,.78)');
    caption.textContent = 'Rise into 3D · this scene loops between the blocked and unblocked viewpoints';
    setDescription('The room never changes. The loop changes only the observer’s Z coordinate. Watch the same sightline become possible when it can leave the plane, pass over the one-dimensional wall, and return to the interior point.');
  }

  function makeBody(center, r) {
    const points = [];
    const n = 28;
    for (let i = 0; i < n; i += 1) {
      const q = (i / n) * Math.PI * 2;
      const wobble = 1 + .08 * Math.sin(q * 3) + .035 * Math.cos(q * 5);
      points.push([center[0] + Math.cos(q) * r * wobble, center[1] + Math.sin(q) * r * .76 * wobble]);
    }
    return points;
  }

  function drawSeeInside2D(width, height, local) {
    const { a, b } = splitPanels(width, height);
    panelFrame(a, '2D first-person image of the body', 'rgba(216,182,98,.84)');
    panelFrame(b, 'same body from +Z · our privileged 3D view', 'rgba(98,212,139,.84)');

    const cx = b.x + b.w * .54;
    const cy = b.y + b.h * .57;
    const r = Math.min(b.w, b.h) * .23;
    const body = makeBody([cx, cy], r);
    polygon(body, 'rgba(108,168,255,.035)', BLUE, .78, 1.8);

    const orbit = Math.PI + local * Math.PI * 2;
    const observer = [cx + Math.cos(orbit) * r * 1.95, cy + Math.sin(orbit) * r * 1.62];
    const heading = Math.atan2(cy - observer[1], cx - observer[0]);
    dot(observer, 5.5, GOLD, .98);
    label('2D observer', [observer[0], observer[1] + 17], 8, 'rgba(216,182,98,.82)');

    const offsets = body.map((p) => angleDelta(Math.atan2(p[1] - observer[1], p[0] - observer[0]), heading));
    let minI = 0;
    let maxI = 0;
    for (let i = 1; i < offsets.length; i += 1) {
      if (offsets[i] < offsets[minI]) minI = i;
      if (offsets[i] > offsets[maxI]) maxI = i;
    }
    line(observer, body[minI], BLUE, 1, .35, [4, 5]);
    line(observer, body[maxI], BLUE, 1, .35, [4, 5]);

    const organs = [
      { p: [cx - r * .22, cy - r * .08], c: PINK, name: 'A' },
      { p: [cx + r * .19, cy - r * .20], c: GREEN, name: 'B' },
      { p: [cx + r * .06, cy + r * .23], c: GOLD, name: 'C' },
    ];
    organs.forEach((o, i) => {
      ring(o.p, 9 + i * 2, o.c, .28, 1);
      dot(o.p, 4.4, o.c, .96);
    });

    const above = [cx + r * .88, cy - r * 1.04];
    dot(above, 6, WHITE, .96);
    label('3D observer above plane', [above[0], above[1] - 18], 8, 'rgba(244,246,249,.76)');
    organs.forEach((o) => line(above, o.p, o.c, 1, .24, [4, 5]));

    const horizonY = a.y + a.h * .58;
    const x0 = a.x + a.w * .10;
    const x1 = a.x + a.w * .90;
    const displayFov = 1.25;
    line([x0, horizonY], [x1, horizonY], WHITE, 2, .48);
    const minX = lerp(x0, x1, clamp(offsets[minI] / displayFov + .5));
    const maxX = lerp(x0, x1, clamp(offsets[maxI] / displayFov + .5));
    line([minX, horizonY], [maxX, horizonY], BLUE, 10, .82);
    label('the blue interval is the angular silhouette of the same blue body', [a.x + a.w / 2, horizonY - 30], 8, 'rgba(108,168,255,.78)');

    organs.forEach((o) => {
      const q = Math.atan2(o.p[1] - observer[1], o.p[0] - observer[0]);
      const off = angleDelta(q, heading);
      const x = lerp(x0, x1, clamp(off / displayFov + .5));
      dot([x, horizonY + 30], 4, o.c, .80);
      cross([x, horizonY], 4, RED, .72);
      label(o.name, [x, horizonY + 45], 7, o.c);
    });
    label('A/B/C have directions in the 1D image, but the boundary occludes them', [a.x + a.w / 2, a.y + a.h * .84], 8, 'rgba(239,119,119,.67)');

    caption.textContent = 'See inside 2D · the silhouette on the left is computed from the same body on the right';
    setDescription('The blue 1D interval is not decorative: it is the angular extent of the exact blue 2D body shown from above. A, B and C also project to exact positions on that 1D field, but a same-plane observer meets the body boundary first. From +Z, the whole 2D area and its interior points are directly exposed.');
  }

  function drawRiseInto4D(width, height, local) {
    const area = viewArea(width, height);
    const c = [width * .50, area.centerY + 6];
    const s = Math.min(width, area.height) * .28;
    const lift = pingPongWithHolds(local);

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
      if (visible > .04) line(observer, [x, y], color, 1, .12 + .30 * visible, [4, 5]);
    });

    const note = lift < .25
      ? 'ordinary 3D viewpoint: shell can occlude its interior'
      : 'W-displaced viewpoint: sightlines need not cross the 3D boundary first';
    label(note, [width * .50, area.bottom - 14], 10, lift < .25 ? 'rgba(239,119,119,.68)' : 'rgba(98,212,139,.78)');
    caption.textContent = 'Rise into 4D · the same blocked → unblocked transition now loops with W';
    setDescription('This is the direct analogue of the previous Z animation. The loop starts with an ordinary 3D viewpoint, moves the observer in the extra W direction, holds so you can inspect the new sightlines, then returns. Translucency is only a 2D drawing aid for higher-dimensional access.');
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

    caption.textContent = 'Projection chain · this loop keeps the nested projection in motion';
    setDescription('A hypothetical 4D observer could receive a 3D visual projection. Hypermandala must flatten that result again for a 2D monitor, so nesting, overlap and foreshortening remain. The animation loops continuously so you can watch which apparent deformations are projection effects.');
  }

  const scenes = [
    { id: 'flatland', label: 'Flatland POV', duration: 9, draw: drawFlatlanderView },
    { id: 'rise3d', label: 'Rise to 3D', duration: 8, draw: drawRiseInto3D },
    { id: 'inside2d', label: 'See inside 2D', duration: 9, draw: drawSeeInside2D },
    { id: 'rise4d', label: 'Rise to 4D', duration: 9, draw: drawRiseInto4D },
    { id: 'projection', label: 'Projection', duration: 7, draw: drawProjectionChain },
  ];

  const nav = document.createElement('div');
  nav.className = 'learn4d-perception-nav';
  nav.setAttribute('aria-label', 'Perception animation');
  const navButtons = scenes.map((scene, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'learn4d-perception-scene';
    button.dataset.scene = scene.id;
    button.textContent = scene.label;
    button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
    nav.appendChild(button);
    return button;
  });
  modes.insertAdjacentElement('afterend', nav);

  const loopNote = document.createElement('div');
  loopNote.className = 'learn4d-perception-loop-note';
  loopNote.textContent = reduceMotion ? 'Reduced motion is enabled · choose a scene above' : 'Each scene loops automatically · use the buttons above or ← →';
  nav.insertAdjacentElement('afterend', loopNote);

  const existingButtons = [...modes.querySelectorAll('.learn4d-mode')];
  const perception = document.createElement('button');
  perception.type = 'button';
  perception.className = 'learn4d-mode';
  perception.dataset.mode = 'perception';
  perception.textContent = 'Perception';
  perception.title = 'Switch between looping dimensional viewpoint animations';

  let sceneIndex = 0;
  let sceneStartedAt = performance.now();

  function selectScene(index) {
    sceneIndex = (index + scenes.length) % scenes.length;
    sceneStartedAt = performance.now();
    navButtons.forEach((button, i) => {
      const selected = i === sceneIndex;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
  }

  navButtons.forEach((button, index) => {
    button.addEventListener('click', () => selectScene(index));
  });
  selectScene(0);

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
    sceneStartedAt = performance.now();
  });

  modes.appendChild(perception);

  window.addEventListener('keydown', (event) => {
    if (!document.body.classList.contains('learn4d-perception')) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      selectScene(sceneIndex + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      selectScene(sceneIndex - 1);
    }
  });

  function frame(now) {
    const active = document.body.classList.contains('learn4d-active') && perception.classList.contains('is-active');
    document.body.classList.toggle('learn4d-perception', active);

    if (active) {
      const { width, height } = fitCanvas();
      ctx.clearRect(0, 0, width, height);
      const scene = scenes[sceneIndex];
      const local = reduceMotion ? .5 : (((now - sceneStartedAt) / 1000) / scene.duration) % 1;
      scene.draw(width, height, local);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
