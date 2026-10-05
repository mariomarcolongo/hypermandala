(() => {
  'use strict';

  if (window.__hypermandalaSriTraditionalInstalled) return;
  window.__hypermandalaSriTraditionalInstalled = true;

  /*
   * Sri Yantra correction layer.
   *
   * Geometry: Type III nine-triangle coordinates already used by Hypermandala,
   * ultimately derived from published computational constructions of Sri Cakra.
   * Structure: 9 triangles, bindu, 8- and 16-petal lotuses, trivalaya and the
   * three-rampart bhupura described in traditional Sri Vidya sources.
   *
   * Classic palette is intentionally conservative: it uses the well-attested
   * white / aruna-red / peeta-yellow bhupura, blue 16-petal lotus, red 8-petal
   * lotus, a white central triangle and red bindu. The 43 internal chambers are
   * NOT falsely painted by parent-triangle identity; until chamber polygons are
   * explicitly encoded, the nine generating triangles are rendered as linework.
   *
   * Every visible petal is a genuine closed polygon. In 3D it becomes a prism;
   * in 4D that prism is duplicated along W and corresponding vertices connect,
   * so the lotus is part of the dimensional construction rather than decoration.
   */

  const TAU = Math.PI * 2;
  const DPR_LIMIT = 2;

  const COLORS = {
    outline: '#efe6d3',
    outlineSoft: '#b9ad98',
    bhupuraOuter: '#f2eee4',
    bhupuraMiddle: '#c66040',
    bhupuraInner: '#d9b44b',
    lotus16: '#4366ad',
    lotus8: '#c94b40',
    central: '#f4efe2',
    bindu: '#b83232',
    neutral: '#dfd5c0',
    x: '#ff6b6b',
    y: '#62d48b',
    z: '#6ca8ff',
    w: '#f0c45c',
  };

  const RAW_TRIANGLES = [
    [53.65669559977147, 123.20508075688774, 250, 246.34330440022853, 0, 'D1'],
    [52.984011026495736, 174.24660560764943, 50, 247.01598897350425, 1, 'U1'],
    [98.71823312733801, 220.03828947357886, 123.20508075688774, 201.281766872662, 1, 'U3'],
    [78.26467997914015, 197.92315674002487, 78.10499177949904, 221.73532002085986, 1, 'U2'],
    [90.4856922951427, 78.10499177949904, 160.66014976539617, 209.51430770485734, 0, 'D3'],
    [80.98384838952128, 103.12199145016105, 220.03828947357886, 219.0161516104787, 0, 'D2'],
    [114.9488500600036, 160.66014976539617, 103.12199145016105, 185.0511499399964, 1, 'U4'],
    [116.35142605010424, 134.30757626706648, 197.92315674002487, 183.64857394989576, 0, 'D4'],
    [124.61190803072795, 144.79777263138968, 174.24660560764943, 175.38809196927207, 0, 'D5'],
  ];

  const canvas = document.createElement('canvas');
  canvas.className = 'sri-traditional-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

  const style = document.createElement('style');
  style.id = 'sriTraditionalCorrectionStyles';
  style.textContent = `
    .sri-traditional-canvas {
      position: fixed;
      inset: 0;
      z-index: 1;
      width: 100vw;
      height: 100dvh;
      opacity: 0;
      pointer-events: none;
      transition: opacity 160ms ease;
      touch-action: none;
    }

    body.sri-traditional-active:not(.learn4d-active) .sri-traditional-canvas {
      opacity: 1;
      pointer-events: auto;
    }

    body.sri-traditional-active:not(.learn4d-active) #solidLayer,
    body.sri-traditional-active:not(.learn4d-active) #mandala {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    @media (prefers-reduced-motion: reduce) {
      .sri-traditional-canvas { transition: none; }
    }
  `;
  document.head.appendChild(style);

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function hexToRgba(hex, alpha = 1) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pw = Math.max(1, Math.round(w * dpr));
    const ph = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }

  function activeValue(selector, attr) {
    const el = document.querySelector(`${selector}.is-active`);
    return el?.getAttribute(attr) || null;
  }

  function sriSelected() {
    return Boolean(document.querySelector('.mandala-card[data-preset="sriyantra"].is-active'));
  }

  function selectedDimension() {
    return Number(activeValue('[data-dimension]', 'data-dimension')) || 2;
  }

  function selectedRenderMode() {
    return activeValue('[data-render]', 'data-render') || 'solid';
  }

  function selectedColorMode() {
    return activeValue('[data-color]', 'data-color') || 'classic';
  }

  function selectedProjection() {
    return activeValue('[data-projection]', 'data-projection') || 'perspective';
  }

  function readRanges(containerId, count, fallback) {
    const inputs = [...document.querySelectorAll(`#${containerId} input[type="range"]`)];
    return Array.from({ length: count }, (_, i) => {
      const v = Number(inputs[i]?.value);
      return Number.isFinite(v) ? v : fallback[i];
    });
  }

  function readRotations() {
    const values = readRanges('rotationRows', 6, [0, 0, 0, 0, 0, 0]);
    return {
      xw: values[0] * Math.PI / 180,
      yw: values[1] * Math.PI / 180,
      zw: values[2] * Math.PI / 180,
      xy: values[3] * Math.PI / 180,
      xz: values[4] * Math.PI / 180,
      yz: values[5] * Math.PI / 180,
    };
  }

  function readScales() {
    const values = readRanges('scaleRows', 4, [1, 1, 1, 1]);
    return { x: values[0], y: values[1], z: values[2], w: values[3] };
  }

  function trianglePoints(raw, scale = 0.62) {
    const [lx, baseY, apexY, rx] = raw;
    const transform = (x, y) => [
      ((x - 150) / 100) * scale,
      ((y - 150) / 100) * scale,
    ];
    return [transform(lx, baseY), transform(150, apexY), transform(rx, baseY)];
  }

  const TRIANGLES = RAW_TRIANGLES.map((raw) => ({
    id: raw[5],
    direction: raw[4] ? 'up' : 'down',
    points: trianglePoints(raw),
  }));

  function segmentStrip(a, b, thickness) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len * thickness * 0.5;
    const ny = dx / len * thickness * 0.5;
    return [
      [a[0] + nx, a[1] + ny],
      [b[0] + nx, b[1] + ny],
      [b[0] - nx, b[1] - ny],
      [a[0] - nx, a[1] - ny],
    ];
  }

  function circlePoly(radius, segments = 28, start = 0) {
    return Array.from({ length: segments }, (_, i) => {
      const a = start + (i / segments) * TAU;
      return [Math.cos(a) * radius, Math.sin(a) * radius];
    });
  }

  function petalPolygon(count, index, innerR, outerR) {
    const step = TAU / count;
    const center = -Math.PI / 2 + index * step;
    const half = step * 0.43;
    const points = [];
    const curveSamples = 10;
    for (let i = 0; i <= curveSamples; i += 1) {
      const t = i / curveSamples;
      const a = center - half + 2 * half * t;
      const profile = Math.pow(Math.sin(Math.PI * t), 0.62);
      const r = innerR + (outerR - innerR) * profile;
      points.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    const innerSamples = 4;
    for (let i = innerSamples; i >= 0; i -= 1) {
      const t = i / innerSamples;
      const a = center - half + 2 * half * t;
      points.push([Math.cos(a) * innerR, Math.sin(a) * innerR]);
    }
    return points;
  }

  function ringQuads(radius, thickness, segments = 64) {
    const out = [];
    const r0 = radius - thickness * 0.5;
    const r1 = radius + thickness * 0.5;
    for (let i = 0; i < segments; i += 1) {
      const a0 = i / segments * TAU;
      const a1 = (i + 1) / segments * TAU;
      out.push([
        [Math.cos(a0) * r0, Math.sin(a0) * r0],
        [Math.cos(a1) * r0, Math.sin(a1) * r0],
        [Math.cos(a1) * r1, Math.sin(a1) * r1],
        [Math.cos(a0) * r1, Math.sin(a0) * r1],
      ]);
    }
    return out;
  }

  function bhupuraSegments(half, thickness, gateWidth = 0.22, gateDepth = 0.12) {
    const g = gateWidth * 0.5;
    const t = thickness;
    const polys = [];

    polys.push([[-half,-half],[-g,-half],[-g,-half+t],[-half,-half+t]]);
    polys.push([[g,-half],[half,-half],[half,-half+t],[g,-half+t]]);
    polys.push([[-half,half-t],[-g,half-t],[-g,half],[-half,half]]);
    polys.push([[g,half-t],[half,half-t],[half,half],[g,half]]);
    polys.push([[-half,-half],[-half+t,-half],[-half+t,-g],[-half,-g]]);
    polys.push([[-half,g],[-half+t,g],[-half+t,half],[-half,half]]);
    polys.push([[half-t,-half],[half,-half],[half,-g],[half-t,-g]]);
    polys.push([[half-t,g],[half,g],[half,half],[half-t,half]]);

    const lip = gateWidth * 0.15;
    polys.push([[-g-lip,-half-gateDepth],[g+lip,-half-gateDepth],[g+lip,-half-gateDepth+t],[-g-lip,-half-gateDepth+t]]);
    polys.push([[-g-lip,half+gateDepth-t],[g+lip,half+gateDepth-t],[g+lip,half+gateDepth],[-g-lip,half+gateDepth]]);
    polys.push([[-half-gateDepth,-g-lip],[-half-gateDepth+t,-g-lip],[-half-gateDepth+t,g+lip],[-half-gateDepth,g+lip]]);
    polys.push([[half+gateDepth-t,-g-lip],[half+gateDepth,-g-lip],[half+gateDepth,g+lip],[half+gateDepth-t,g+lip]]);

    return polys;
  }

  function region(poly, color, z, height, order, id, kind = 'solid') {
    return { poly, color, z, height, order, id, kind };
  }

  function buildRegions(colorMode = 'classic') {
    const classic = colorMode === 'classic';
    const form = colorMode === 'form';
    const neutral = form ? COLORS.neutral : COLORS.outline;
    const regions = [];

    const palette = classic ? COLORS : {
      ...COLORS,
      bhupuraOuter: neutral,
      bhupuraMiddle: neutral,
      bhupuraInner: neutral,
      lotus16: neutral,
      lotus8: neutral,
      central: neutral,
      bindu: neutral,
      outline: neutral,
      outlineSoft: neutral,
    };

    [
      [1.34, palette.bhupuraOuter, 0.00, 'bhupura-outer'],
      [1.285, palette.bhupuraMiddle, 0.035, 'bhupura-middle'],
      [1.23, palette.bhupuraInner, 0.070, 'bhupura-inner'],
    ].forEach(([half, color, z, id], layer) => {
      bhupuraSegments(half, 0.018, 0.24, 0.11).forEach((poly, i) => {
        regions.push(region(poly, color, z, 0.045, 10 + layer, `${id}-${i}`));
      });
    });

    [1.105, 1.07, 1.035].forEach((r, ringIndex) => {
      ringQuads(r, 0.010, 72).forEach((poly, i) => {
        regions.push(region(poly, palette.outlineSoft, 0.105, 0.026, 20 + ringIndex, `trivalaya-${ringIndex}-${i}`));
      });
    });

    for (let i = 0; i < 16; i += 1) {
      regions.push(region(petalPolygon(16, i, 0.82, 0.995), palette.lotus16, 0.15, 0.075, 30, `lotus16-${i}`));
    }
    for (let i = 0; i < 8; i += 1) {
      regions.push(region(petalPolygon(8, i, 0.665, 0.79), palette.lotus8, 0.245, 0.082, 40, `lotus8-${i}`));
    }

    TRIANGLES.forEach((tri, ti) => {
      for (let i = 0; i < 3; i += 1) {
        const a = tri.points[i];
        const b = tri.points[(i + 1) % 3];
        regions.push(region(segmentStrip(a, b, 0.011), palette.outline, 0.35, 0.040, 50 + ti * 0.01, `${tri.id}-edge-${i}`, 'line'));
      }
    });

    const centralTri = TRIANGLES.find((tri) => tri.id === 'D5');
    if (centralTri) {
      const inset = centralTri.points.map(([x, y]) => [x * 0.92, y * 0.92]);
      regions.push(region(inset, palette.central, 0.405, 0.052, 70, 'central-trikona'));
    }
    regions.push(region(circlePoly(0.024, 24), palette.bindu, 0.475, 0.060, 80, 'bindu'));

    return regions;
  }

  function rotatePlane(v, a, b, angle) {
    if (!angle) return;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const x = v[a];
    const y = v[b];
    v[a] = x * c - y * s;
    v[b] = x * s + y * c;
  }

  function transform4(point, rotations, scales) {
    const v = [
      point[0] * scales.x,
      point[1] * scales.y,
      point[2] * scales.z,
      point[3] * scales.w,
    ];
    rotatePlane(v, 0, 3, rotations.xw);
    rotatePlane(v, 1, 3, rotations.yw);
    rotatePlane(v, 2, 3, rotations.zw);
    rotatePlane(v, 0, 1, rotations.xy);
    rotatePlane(v, 0, 2, rotations.xz);
    rotatePlane(v, 1, 2, rotations.yz);
    return v;
  }

  const camera = {
    yaw: -0.60,
    pitch: 0.50,
    zoom: 1,
    dragging: false,
    x: 0,
    y: 0,
    pointerId: null,
  };

  function rotate3(v, yaw, pitch) {
    let [x, y, z] = v;
    let c = Math.cos(yaw), s = Math.sin(yaw);
    [x, z] = [c * x - s * z, s * x + c * z];
    c = Math.cos(pitch); s = Math.sin(pitch);
    [y, z] = [c * y - s * z, s * y + c * z];
    return [x, y, z];
  }

  function stageFrame(width, height) {
    const panel = document.getElementById('explorerControls');
    const rect = panel?.getBoundingClientRect();
    const panelVisible = rect && rect.width > 100 && rect.left > width * 0.55 && getComputedStyle(panel).visibility !== 'hidden';
    const right = panelVisible ? rect.left : width;
    const left = 0;
    const available = Math.max(320, right - left);
    return {
      cx: left + available * 0.50,
      cy: height * 0.49,
      scale: Math.min(available * 0.275, height * 0.335) * camera.zoom,
    };
  }

  function projectPoint(point, width, height, rotations, scales, projection) {
    const v4 = transform4(point, rotations, scales);
    let v3 = [
      v4[0] + v4[3] * 0.58,
      v4[1] - v4[3] * 0.42,
      v4[2] + v4[3] * 0.20,
    ];

    if (projection === 'isometric') {
      v3 = rotate3(v3, -Math.PI / 4, Math.asin(Math.tan(Math.PI / 6)));
    } else {
      v3 = rotate3(v3, camera.yaw, camera.pitch);
    }

    const frame = stageFrame(width, height);
    let factor = 1;
    if (projection === 'perspective') {
      factor = 4.6 / Math.max(2.4, 4.6 - v3[2]);
    }

    return {
      x: frame.cx + v3[0] * frame.scale * factor,
      y: frame.cy + v3[1] * frame.scale * factor,
      depth: v3[2],
    };
  }

  function polyPath(points) {
    if (!points.length) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
  }

  function drawFace(points, color, alpha, stroke = null, lineWidth = 0.8) {
    if (points.length < 3) return;
    polyPath(points);
    ctx.fillStyle = hexToRgba(color, alpha);
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = hexToRgba(stroke, Math.min(1, alpha + 0.18));
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  function drawLine(a, b, color, alpha = 1, width = 1) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = hexToRgba(color, alpha);
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function regionFaces(region, zMix, w, width, height, rotations, scales, projection) {
    const z0 = region.z * zMix;
    const z1 = (region.z + region.height) * zMix;
    const bottom = region.poly.map(([x, y]) => projectPoint([x, y, z0, w], width, height, rotations, scales, projection));
    const top = region.poly.map(([x, y]) => projectPoint([x, y, z1, w], width, height, rotations, scales, projection));
    const faces = [];

    faces.push({ points: top, depth: top.reduce((s, p) => s + p.depth, 0) / top.length, type: 'top' });
    if (zMix > 0.02) {
      for (let i = 0; i < region.poly.length; i += 1) {
        const j = (i + 1) % region.poly.length;
        const points = [bottom[i], bottom[j], top[j], top[i]];
        faces.push({ points, depth: points.reduce((s, p) => s + p.depth, 0) / 4, type: 'side' });
      }
    }
    return { faces, top, bottom };
  }

  function axisTint(region, colorMode) {
    if (colorMode !== 'axis') return region.color;
    if (region.id.startsWith('bhupura')) return COLORS.x;
    if (region.id.startsWith('lotus16')) return COLORS.y;
    if (region.id.startsWith('lotus8')) return COLORS.z;
    if (region.id === 'bindu') return COLORS.w;
    return COLORS.neutral;
  }

  function draw2D(regions, width, height, colorMode, renderMode) {
    const frame = stageFrame(width, height);
    const sorted = [...regions].sort((a, b) => a.order - b.order);
    ctx.save();
    ctx.translate(frame.cx, frame.cy);
    ctx.scale(frame.scale, frame.scale);

    for (const r of sorted) {
      const color = axisTint(r, colorMode);
      ctx.beginPath();
      ctx.moveTo(r.poly[0][0], r.poly[0][1]);
      for (let i = 1; i < r.poly.length; i += 1) ctx.lineTo(r.poly[i][0], r.poly[i][1]);
      ctx.closePath();

      if (renderMode !== 'wire') {
        ctx.fillStyle = color;
        ctx.globalAlpha = r.kind === 'line' ? 0.96 : 0.92;
        ctx.fill();
      }

      if (renderMode === 'wire' || renderMode === 'solid-edges') {
        ctx.strokeStyle = COLORS.outline;
        ctx.globalAlpha = renderMode === 'wire' ? 0.86 : 0.50;
        ctx.lineWidth = 0.006;
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawSpatial(regions, width, height, zMix, wMix, colorMode, renderMode, projection, rotations, scales) {
    const wDepth = 0.34 * wMix;
    const copies = wMix > 0.02 ? [-wDepth * 0.5, wDepth * 0.5] : [0];
    const drawQueue = [];
    const connectorQueue = [];

    for (const r of regions) {
      const color = axisTint(r, colorMode);
      const copyData = [];
      copies.forEach((w, copyIndex) => {
        const data = regionFaces(r, zMix, w, width, height, rotations, scales, projection);
        copyData.push(data);
        for (const face of data.faces) {
          drawQueue.push({
            ...face,
            color,
            alpha: copies.length === 2 ? (copyIndex === 0 ? 0.34 : 0.68) : 0.74,
            order: r.order,
          });
        }
      });

      if (copyData.length === 2) {
        const a = copyData[0];
        const b = copyData[1];
        for (let i = 0; i < a.top.length; i += 1) {
          connectorQueue.push([a.top[i], b.top[i], COLORS.w]);
          if (zMix > 0.02) connectorQueue.push([a.bottom[i], b.bottom[i], COLORS.w]);
        }
      }
    }

    drawQueue.sort((a, b) => a.depth - b.depth || a.order - b.order);
    for (const item of drawQueue) {
      const isSide = item.type === 'side';
      if (renderMode !== 'wire') {
        drawFace(item.points, item.color, item.alpha * (isSide ? 0.62 : 1), renderMode === 'solid-edges' ? COLORS.outline : null, 0.8);
      } else {
        polyPath(item.points);
        ctx.strokeStyle = hexToRgba(item.color, 0.72);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    if (wMix > 0.02) {
      for (const [a, b, color] of connectorQueue) {
        drawLine(a, b, color, renderMode === 'wire' ? 0.58 : 0.28, renderMode === 'wire' ? 1.0 : 0.75);
      }
    }
  }

  let zMix = 0;
  let wMix = 0;
  let last = performance.now();
  let lastPreview = 0;

  function drawPreview(now) {
    if (now - lastPreview < 180) return;
    lastPreview = now;
    const preview = document.getElementById('previewSriYantra');
    if (!preview) return;
    const pctx = preview.getContext('2d');
    const w = preview.width;
    const h = preview.height;
    pctx.clearRect(0, 0, w, h);
    const regions = buildRegions('classic');
    pctx.save();
    pctx.translate(w * 0.5, h * 0.5);
    const s = Math.min(w, h) * 0.35;
    pctx.scale(s, s);
    for (const r of regions.sort((a, b) => a.order - b.order)) {
      pctx.beginPath();
      pctx.moveTo(r.poly[0][0], r.poly[0][1]);
      for (let i = 1; i < r.poly.length; i += 1) pctx.lineTo(r.poly[i][0], r.poly[i][1]);
      pctx.closePath();
      pctx.fillStyle = r.color;
      pctx.globalAlpha = r.kind === 'line' ? 0.96 : 0.90;
      pctx.fill();
    }
    pctx.restore();
  }

  function tick(now) {
    const active = sriSelected() && !document.body.classList.contains('learn4d-active');
    document.body.classList.toggle('sri-traditional-active', active);
    drawPreview(now);

    const { w: width, h: height } = fitCanvas();
    ctx.clearRect(0, 0, width, height);

    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;

    if (active) {
      const dim = selectedDimension();
      const targetZ = dim >= 3 ? 1 : 0;
      const targetW = dim >= 4 ? 1 : 0;
      const rate = 1 - Math.exp(-dt * 5.5);
      zMix = lerp(zMix, targetZ, rate);
      wMix = lerp(wMix, targetW, rate);

      const colorMode = selectedColorMode();
      const renderMode = selectedRenderMode();
      const projection = selectedProjection();
      const rotations = readRotations();
      const scales = readScales();
      const regions = buildRegions(colorMode);

      if (zMix < 0.015 && wMix < 0.015) {
        draw2D(regions, width, height, colorMode, renderMode);
      } else {
        drawSpatial(regions, width, height, zMix, wMix, colorMode, renderMode, projection, rotations, scales);
      }
    } else {
      zMix = selectedDimension() >= 3 ? 1 : 0;
      wMix = selectedDimension() >= 4 ? 1 : 0;
    }

    requestAnimationFrame(tick);
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (!document.body.classList.contains('sri-traditional-active')) return;
    camera.dragging = true;
    camera.pointerId = event.pointerId;
    camera.x = event.clientX;
    camera.y = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!camera.dragging || event.pointerId !== camera.pointerId) return;
    const dim = selectedDimension();
    if (dim < 3) return;
    const dx = event.clientX - camera.x;
    const dy = event.clientY - camera.y;
    camera.x = event.clientX;
    camera.y = event.clientY;
    camera.yaw += dx * 0.008;
    camera.pitch = clamp(camera.pitch + dy * 0.008, -1.35, 1.35);
  });

  const releasePointer = (event) => {
    if (event.pointerId !== camera.pointerId) return;
    camera.dragging = false;
    camera.pointerId = null;
  };
  canvas.addEventListener('pointerup', releasePointer);
  canvas.addEventListener('pointercancel', releasePointer);

  canvas.addEventListener('wheel', (event) => {
    if (!document.body.classList.contains('sri-traditional-active')) return;
    event.preventDefault();
    camera.zoom = clamp(camera.zoom * Math.exp(-event.deltaY * 0.001), 0.62, 1.65);
  }, { passive: false });

  requestAnimationFrame(tick);
})();
