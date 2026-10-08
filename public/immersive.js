/*
 * Hypermandala immersive perception and Explorer harmonization.
 *
 * Observation tools never mutate intrinsic vertices, topology, hierarchy or W
 * semantics. The UI is reorganized by task: Rendering, 4D inspection and
 * Perception. Stereo/WebXR operate after the exact 4D transform/projection;
 * observer-orbit cues move only the ordinary 3D camera; WebXR supplies
 * true head-tracked binocular parallax; trajectories record
 * transformed points in R4.
 *
 * Copyright (C) 2026 Mario Marcolongo and contributors.
 * Licensed under GNU AGPL v3 or later. See ../LICENSE.
 */

(() => {
  'use strict';

  const api = window.HypermandalaAPI;
  if (!api) {
    console.warn('Hypermandala immersive tools: core API unavailable.');
    return;
  }

  const byId = (id) => document.getElementById(id);
  const overlay = byId('perceptionOverlay');
  const xrCanvas = byId('xrCanvas');
  const stereoToggle = byId('stereoToggle');
  const stereoSwap = byId('stereoSwap');
  const parallaxToggle = byId('motionParallaxToggle');
  const trajectoryToggle = byId('trajectoryToggle');
  const enterVr = byId('enterVr');
  const status = byId('immersiveStatus');

  if (!overlay || !xrCanvas) return;

  const stereoCanvas = document.createElement('canvas');
  stereoCanvas.id = 'stereoLayer';
  stereoCanvas.setAttribute('aria-hidden', 'true');
  stereoCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;display:none';
  overlay.parentNode.insertBefore(stereoCanvas, overlay);
  const stereoGl = stereoCanvas.getContext('webgl', { alpha: false, antialias: true, premultipliedAlpha: false });

  const ctx = overlay.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return;
  if (stereoSwap) {
    stereoSwap.textContent = 'Cross-eye';
    stereoSwap.setAttribute('aria-label', 'Cross-eye stereo');
  }
  if (parallaxToggle) {
    parallaxToggle.textContent = 'Observer orbit';
    parallaxToggle.setAttribute('aria-label', 'Observer orbit');
  }

  const COLORS = Object.freeze({
    background: '#070809',
    separator: 'rgba(255,255,255,.09)',
    text: 'rgba(240,239,233,.54)',
    center: '#f2dfa0',
    wPlus: '#f0c45c',
    wMinus: '#6ca8ff',
    neutral: '#e7ddc6',
    x: '#ff6b6b',
    y: '#62d48b',
    z: '#6ca8ff',
    w: '#f0c45c',
  });

  const perception = {
    stereo: false,
    swapped: false,
    parallax: false,
    trajectories: false,
    sceneKey: '',
    scene: null,
    anchors: [],
    trails: new Map(),
    lastTrailSample: 0,
    parallaxTargetYaw: 0,
    parallaxTargetPitch: 0,
    parallaxYaw: 0,
    parallaxPitch: 0,
    orientationBaseline: null,
    orientationInstalled: false,
    xrSupported: false,
    xrSession: null,
    xrReferenceSpace: null,
    xrUsesFloor: false,
    xrGl: null,
    xrProgram: null,
    xrTriangleBuffer: null,
    xrLineBuffer: null,
    xrLocations: null,
    xrGeometry: null,
    xrGeometryKey: '',
    xrLastGeometryBuild: 0,
    xrModelMatrix: null,
    xrRecenterPending: true,
    xrMobile: false,
    xrFramebufferScale: 1,
    xrScale: 0.34,
    lastFrame: performance.now(),
  };

  function currentState() {
    return api.stateSnapshot();
  }

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function loadHarmonyStyles() {
    if (document.getElementById('hypermandalaUiHarmonyStyles')) return;
    const link = document.createElement('link');
    link.id = 'hypermandalaUiHarmonyStyles';
    link.rel = 'stylesheet';
    link.href = './ui-harmony.css?version=2026-10-08-1';
    document.head.appendChild(link);
  }

  function makeLabel(text) {
    const label = document.createElement('div');
    label.className = 'tool-group__label';
    label.textContent = text;
    return label;
  }

  function makeCopy(text) {
    const copy = document.createElement('p');
    copy.className = 'tool-group__copy';
    copy.textContent = text;
    return copy;
  }

  function makePair(...buttons) {
    const pair = document.createElement('div');
    pair.className = 'segmented hyper4d-two tool-pair';
    for (const button of buttons) {
      if (!button) continue;
      button.classList.remove('inspection-toggle', 'hyper4d-wide', 'perception-replay');
      pair.appendChild(button);
    }
    return pair;
  }

  function harmonizeExplorer() {
    loadHarmonyStyles();

    const renderControl = byId('renderControl');
    const xray = document.querySelector('[data-render="xray"]');
    if (renderControl && xray && xray.parentElement !== renderControl) {
      renderControl.classList.remove('segmented--three');
      renderControl.classList.add('segmented--four');
      xray.classList.remove('inspection-toggle');
      renderControl.appendChild(xray);
    }

    const inspection = document.querySelector('.perception-details');
    const inspectionLabel = inspection?.querySelector('.control-section__label');
    if (inspectionLabel) inspectionLabel.textContent = '4D inspection';
    if (inspection) {
      const summary = inspection.querySelector('summary');
      if (summary) {
        summary.title = 'Inspect sections, W structure, boundary cells and motion through the fourth dimension';
      }
    }

    const inspectionTools = byId('hypermandala4DInspectionTools');
    const replay = byId('replay4D');
    if (inspectionTools && trajectoryToggle && replay) {
      const oldImmersiveLabel = [...inspectionTools.querySelectorAll('.perception-tool-label')]
        .find((node) => node.textContent.trim().toLowerCase() === 'immersive perception');
      if (oldImmersiveLabel) {
        oldImmersiveLabel.dataset.retired = 'true';
        oldImmersiveLabel.remove();
      }

      const motionGroup = document.createElement('div');
      motionGroup.className = 'tool-group';
      motionGroup.dataset.toolGroup = '4d-motion';
      motionGroup.append(
        makeLabel('4D motion'),
        makeCopy('Trace transformed points or replay the dimensional lift without changing the underlying construction.'),
        makePair(trajectoryToggle, replay),
      );
      inspectionTools.appendChild(motionGroup);

      for (const grid of [...inspectionTools.querySelectorAll('.immersive-grid')]) {
        if (!grid.querySelector('button')) grid.remove();
      }
    }

    if (!document.querySelector('.view-tools-details')) {
      const perceptionDetails = document.createElement('details');
      perceptionDetails.className = 'control-section view-tools-details';
      perceptionDetails.open = true;
      perceptionDetails.innerHTML = `
        <summary class="view-tools-summary" title="Observation aids that never modify intrinsic geometry">
          <span class="control-section__label">Perception</span>
        </summary>
        <div class="view-tools-body"></div>
      `;

      const body = perceptionDetails.querySelector('.view-tools-body');
      const stereoGroup = document.createElement('div');
      stereoGroup.className = 'tool-group';
      stereoGroup.dataset.toolGroup = 'stereo';
      stereoGroup.append(
        makeLabel('Stereoscopic view'),
        makeCopy('Human-eye perspective stereo of the same 4D→3D projection. Cross-eye uses a compact centered pair with fusion markers.'),
        makePair(stereoToggle, stereoSwap),
      );

      const motionGroup = document.createElement('div');
      motionGroup.className = 'tool-group';
      motionGroup.dataset.toolGroup = 'camera-motion';
      motionGroup.append(
        makeLabel('Observer motion'),
        makeCopy('Observer orbit changes only camera orientation. WebXR supplies true head-tracked binocular parallax with two physical eye views.'),
        makePair(parallaxToggle, enterVr),
      );

      if (status) {
        status.classList.add('tool-group__copy');
        motionGroup.appendChild(status);
      }

      body.append(stereoGroup, motionGroup);
      inspection?.insertAdjacentElement('afterend', perceptionDetails);
    }
  }

  function rgbCss(rgb, alpha = 1) {
    return `rgba(${Math.round(rgb.r)},${Math.round(rgb.g)},${Math.round(rgb.b)},${alpha})`;
  }

  function hexRgb(hex) {
    const value = hex.replace('#', '');
    const expanded = value.length === 3
      ? value.split('').map((c) => c + c).join('')
      : value;
    const number = Number.parseInt(expanded, 16);
    return {
      r: (number >> 16) & 255,
      g: (number >> 8) & 255,
      b: number & 255,
    };
  }

  function mixRgb(a, b, t) {
    const u = Math.max(0, Math.min(1, t));
    return {
      r: a.r + (b.r - a.r) * u,
      g: a.g + (b.g - a.g) * u,
      b: a.b + (b.b - a.b) * u,
    };
  }

  function axisRgb(axis) {
    return hexRgb(
      axis === 'x' ? COLORS.x
      : axis === 'y' ? COLORS.y
      : axis === 'z' ? COLORS.z
      : axis === 'w' ? COLORS.w
      : COLORS.neutral,
    );
  }

  function shadeForAxis(rgb, axis) {
    const multiplier = axis === 'w' ? 0.84 : axis === 'z' ? 1.06 : axis === 'x' ? 0.94 : 1;
    return {
      r: Math.max(0, Math.min(255, rgb.r * multiplier)),
      g: Math.max(0, Math.min(255, rgb.g * multiplier)),
      b: Math.max(0, Math.min(255, rgb.b * multiplier)),
    };
  }

  function wCueRgb(w, maxAbsW) {
    const extent = Math.max(1e-6, maxAbsW);
    const normalized = Math.max(-1, Math.min(1, w / extent));
    const neutral = hexRgb(COLORS.neutral);
    return normalized < 0
      ? mixRgb(neutral, hexRgb(COLORS.wMinus), -normalized)
      : mixRgb(neutral, hexRgb(COLORS.wPlus), normalized);
  }

  function wColorIsActive() {
    return byId('wDepthToggle')?.classList.contains('is-active') || false;
  }

  function activeInspectionSurface() {
    const insight = document.querySelector('[data-insight].is-active')?.dataset.insight;
    return insight === 'w-slice'
      || insight === 'w-layers'
      || byId('hypercellToggle')?.classList.contains('is-active');
  }

  function appearanceRgb(module, axis, w, maxAbsW, appState) {
    if (wColorIsActive()) return wCueRgb(w, maxAbsW);
    if (appState.colorMode === 'axis') return axisRgb(axis);
    if (appState.colorMode === 'form') return hexRgb(COLORS.neutral);
    return shadeForAxis(api.regionRgb(module.regionId, 0, 0), axis);
  }

  function resizeOverlay() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(innerWidth));
    const height = Math.max(1, Math.round(innerHeight));
    overlay.width = Math.round(width * dpr);
    overlay.height = Math.round(height * dpr);
    overlay.style.width = width + 'px';
    overlay.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function uniqueVertices(modules) {
    const seen = new Set();
    const result = [];
    for (const module of modules || []) {
      for (const vertex of module.vertices || []) {
        const key = vertex.map((value) => Math.round(value * 10000)).join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        result.push([...vertex]);
      }
    }
    return result;
  }

  function chooseMirrorPair(vertices) {
    const buckets = new Map();
    for (const point of vertices) {
      const key = point.slice(0, 3).map((value) => Math.round(value * 10000)).join(',');
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(point);
    }

    let best = null;
    let bestScore = -Infinity;
    for (const points of buckets.values()) {
      if (points.length < 2) continue;
      const ordered = [...points].sort((a, b) => a[3] - b[3]);
      const negative = ordered[0];
      const positive = ordered[ordered.length - 1];
      if (!(negative[3] < -1e-5 && positive[3] > 1e-5)) continue;
      const span = positive[3] - negative[3];
      const radial = Math.hypot(positive[0], positive[1], positive[2]);
      const score = span * (0.75 + radial);
      if (score > bestScore) {
        bestScore = score;
        best = [negative, positive];
      }
    }
    return best;
  }

  function chooseTrajectoryAnchors(scene) {
    const anchors = [];
    const symbolic = scene.symbolicCenter;
    if (symbolic?.every(Number.isFinite)) {
      anchors.push({ id: 'symbolic-center', point: [...symbolic], color: COLORS.center });
    }

    const vertices = uniqueVertices(scene.structuralModules);
    if (scene.state.wSemantics?.[1] === 'spatial') {
      const pair = chooseMirrorPair(vertices);
      if (pair) {
        anchors.push({ id: 'w-minus', point: [...pair[0]], color: COLORS.wMinus });
        anchors.push({ id: 'w-plus', point: [...pair[1]], color: COLORS.wPlus });
      }
    }

    if (anchors.length < 2 && vertices.length) {
      let farthest = vertices[0];
      let score = -Infinity;
      for (const point of vertices) {
        const next = Math.hypot(...point);
        if (next > score) {
          score = next;
          farthest = point;
        }
      }
      anchors.push({ id: 'outer-anchor', point: [...farthest], color: COLORS.wPlus });
    }
    return anchors.slice(0, 3);
  }

  function ensureScene() {
    const key = api.sceneKey();
    if (perception.scene && key === perception.sceneKey) return perception.scene;
    perception.scene = api.sceneSnapshot();
    perception.sceneKey = key;
    perception.anchors = chooseTrajectoryAnchors(perception.scene);
    perception.trails.clear();
    for (const anchor of perception.anchors) perception.trails.set(anchor.id, []);
    perception.xrGeometry = null;
    perception.xrGeometryKey = '';
    return perception.scene;
  }

  function p4Distance(a, b) {
    if (!a || !b) return Infinity;
    return Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2], a[3]-b[3]);
  }

  function updateTrajectories(now, appState) {
    if (!perception.trajectories || appState.dimension < 4 || appState.transition) return;
    if (now - perception.lastTrailSample < 28) return;
    ensureScene();
    let moved = false;
    for (const anchor of perception.anchors) {
      const transformed = api.transformPoint4D(anchor.point);
      const history = perception.trails.get(anchor.id) || [];
      const last = history[history.length - 1];
      if (!last || p4Distance(last.p4, transformed) > 0.0025) {
        history.push({ p4: [...transformed], time: now });
        moved = true;
      }
      while (history.length > 180 || (history[0] && now - history[0].time > 8000)) history.shift();
      perception.trails.set(anchor.id, history);
    }
    if (moved) perception.lastTrailSample = now;
  }

  function drawTrailPolyline(points, color, width = 1.4) {
    if (points.length < 2) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < points.length; i += 1) {
      const t = i / (points.length - 1);
      ctx.beginPath();
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      ctx.lineTo(points[i].x, points[i].y);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.08 + t * 0.68;
      ctx.lineWidth = width * (0.75 + 0.25 * t);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawScreenTrajectories() {
    for (const anchor of perception.anchors) {
      const history = perception.trails.get(anchor.id) || [];
      const points = history
        .map((sample) => api.projectTransformed4DToScreen(sample.p4))
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
      drawTrailPolyline(points, anchor.color);
      if (!points.length) continue;
      const point = points[points.length - 1];
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.8, 0, Math.PI * 2);
      ctx.fillStyle = anchor.color;
      ctx.globalAlpha = 0.92;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  const STEREO_CAMERA_Z = 9;
  const STEREO_SCALE = 0.31;
  let stereoProgram = null;
  let stereoTriangleBuffer = null;
  let stereoLineBuffer = null;
  let stereoLocations = null;
  let lastStereoLayout = null;

  function stereoSafeRect() {
    const margin = 18;
    const top = 72;
    const bottomMargin = 96;
    let left = margin;
    let right = Math.max(left + 1, innerWidth - margin);
    const bottom = Math.max(top + 1, innerHeight - bottomMargin);

    const panel = byId('explorerControls');
    if (panel) {
      const style = getComputedStyle(panel);
      const rect = panel.getBoundingClientRect();
      const visible = style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity || 1) > 0
        && rect.width > 1
        && rect.height > 1;
      const overlapsStage = rect.bottom > top && rect.top < bottom;
      if (visible && overlapsStage && rect.left > innerWidth * 0.42) {
        right = Math.min(right, rect.left - 18);
      }
    }

    return {
      x: left,
      y: top,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top),
    };
  }

  function stereoLayout(swapped = perception.swapped) {
    const safe = stereoSafeRect();
    const gap = swapped ? 16 : 12;
    // Parallel viewing must remain especially compact because image-center
    // separation greater than the viewer's IPD requires eye divergence.
    const maxPairWidth = swapped ? 560 : 460;
    const pairWidth = Math.max(0, Math.min(safe.width, maxPairWidth));
    const eyeWidth = Math.max(0, (pairWidth - gap) * 0.5);
    const eyeHeight = Math.max(0, Math.min(safe.height, eyeWidth * 1.12));
    const pairX = safe.x + (safe.width - pairWidth) * 0.5;
    const pairY = safe.y + (safe.height - eyeHeight) * 0.5;
    return {
      safe,
      gap,
      pairWidth,
      leftViewport: { x: pairX, y: pairY, width: eyeWidth, height: eyeHeight },
      rightViewport: { x: pairX + eyeWidth + gap, y: pairY, width: eyeWidth, height: eyeHeight },
    };
  }

  function stereoProject(viewPoint, eyeSign, viewport, appState) {
    const eye = eyeSign * 0.085;
    const distance = STEREO_CAMERA_Z - viewPoint[2];
    const factor = STEREO_CAMERA_Z / distance;
    // Exact parallel off-axis pinhole stereo with zero parallax on Z=0.
    const x = (viewPoint[0] - eye) * factor + eye;
    const y = viewPoint[1] * factor;
    const scale = Math.min(viewport.width, viewport.height) * STEREO_SCALE * appState.zoom;
    return {
      x: viewport.x + viewport.width * 0.5 + x * scale,
      y: viewport.y + viewport.height * 0.5 + y * scale,
      depth: viewPoint[2],
    };
  }

  function transformedModule(module) {
    const p4 = module.vertices.map((point) => api.transformPoint4D(point));
    const view = p4.map((point) => api.projectTransformed4DToView3D(point));
    return { p4, view };
  }

  function stereoCross2D(a, b, c) {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  }

  function stereoPointInsideTriangle(p, a, b, c, orientation) {
    const epsilon = 1e-8;
    return orientation * stereoCross2D(a, b, p) > epsilon
      && orientation * stereoCross2D(b, c, p) > epsilon
      && orientation * stereoCross2D(c, a, p) > epsilon;
  }

  function triangulateStereoFace(indices, viewVertices) {
    if (indices.length === 3) return [[indices[0], indices[1], indices[2]]];
    const projected = indices.map((index) => {
      const point = viewVertices[index];
      const distance = STEREO_CAMERA_Z - point[2];
      return [
        point[0] * STEREO_CAMERA_Z / distance,
        point[1] * STEREO_CAMERA_Z / distance,
      ];
    });
    let area = 0;
    for (let i = 0; i < projected.length; i += 1) {
      const a = projected[i];
      const b = projected[(i + 1) % projected.length];
      area += a[0] * b[1] - b[0] * a[1];
    }
    if (Math.abs(area) < 1e-10) {
      return indices.slice(1, -1).map((_, i) => [indices[0], indices[i + 1], indices[i + 2]]);
    }
    const orientation = area > 0 ? 1 : -1;
    const remaining = indices.map((_, i) => i);
    const triangles = [];
    let guard = 0;
    while (remaining.length > 3 && guard < indices.length * indices.length) {
      guard += 1;
      let clipped = false;
      for (let r = 0; r < remaining.length; r += 1) {
        const previous = remaining[(r - 1 + remaining.length) % remaining.length];
        const current = remaining[r];
        const next = remaining[(r + 1) % remaining.length];
        const a = projected[previous];
        const b = projected[current];
        const c = projected[next];
        if (orientation * stereoCross2D(a, b, c) <= 1e-9) continue;
        let contains = false;
        for (const candidate of remaining) {
          if (candidate === previous || candidate === current || candidate === next) continue;
          if (stereoPointInsideTriangle(projected[candidate], a, b, c, orientation)) {
            contains = true;
            break;
          }
        }
        if (contains) continue;
        triangles.push([indices[previous], indices[current], indices[next]]);
        remaining.splice(r, 1);
        clipped = true;
        break;
      }
      if (!clipped) break;
    }
    if (remaining.length === 3) {
      triangles.push([indices[remaining[0]], indices[remaining[1]], indices[remaining[2]]]);
    }
    if (triangles.length !== indices.length - 2) {
      return indices.slice(1, -1).map((_, i) => [indices[0], indices[i + 1], indices[i + 2]]);
    }
    return triangles;
  }

  function ensureStereoProgram() {
    if (!stereoGl) return false;
    if (stereoProgram) return true;
    const gl = stereoGl;
    const vertex = compileShader(gl, gl.VERTEX_SHADER, `
      precision highp float;
      attribute vec3 aPosition;
      attribute vec4 aColor;
      uniform float uEye;
      uniform vec2 uScale;
      uniform float uCameraZ;
      varying vec4 vColor;
      void main() {
        float distance = uCameraZ - aPosition.z;
        float nearPlane = 0.1;
        float farPlane = 40.0;
        float depthA = (farPlane + nearPlane) / (farPlane - nearPlane);
        float depthB = (-2.0 * farPlane * nearPlane) / (farPlane - nearPlane);
        gl_Position = vec4(
          uScale.x * (uCameraZ * aPosition.x - uEye * aPosition.z),
          -uScale.y * (uCameraZ * aPosition.y),
          depthA * distance + depthB,
          distance
        );
        vColor = aColor;
      }
    `);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform float uXray;
      varying vec4 vColor;
      void main() {
        if (uXray > 0.5) {
          float pattern = mod(floor(gl_FragCoord.x) + 2.0 * floor(gl_FragCoord.y), 4.0);
          if (pattern > 1.5) discard;
        }
        gl_FragColor = vColor;
      }
    `);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'Stereo program link failed');
    }
    stereoProgram = program;
    stereoTriangleBuffer = gl.createBuffer();
    stereoLineBuffer = gl.createBuffer();
    stereoLocations = {
      position: gl.getAttribLocation(program, 'aPosition'),
      color: gl.getAttribLocation(program, 'aColor'),
      eye: gl.getUniformLocation(program, 'uEye'),
      scale: gl.getUniformLocation(program, 'uScale'),
      cameraZ: gl.getUniformLocation(program, 'uCameraZ'),
      xray: gl.getUniformLocation(program, 'uXray'),
    };
    return true;
  }

  function pushStereoVertex(target, point, rgb, alpha = 1) {
    target.push(point[0], point[1], point[2], rgb.r / 255, rgb.g / 255, rgb.b / 255, alpha);
  }

  function buildStereoGeometry(scene, appState) {
    const triangles = [];
    const lines = [];
    const cache = new Map();
    const allModules = [...new Set([...scene.filledModules, ...scene.structuralModules])];
    let maxAbsW = 1e-6;
    for (const module of allModules) {
      const transformed = transformedModule(module);
      cache.set(module, transformed);
      for (const point of transformed.p4) maxAbsW = Math.max(maxAbsW, Math.abs(point[3]));
    }

    if (appState.renderMode !== 'wire') {
      for (const module of scene.filledModules) {
        const transformed = cache.get(module) || transformedModule(module);
        for (const face of module.faces || []) {
          if (!face.indices || face.indices.length < 3) continue;
          const faceTriangles = triangulateStereoFace(face.indices, transformed.view);
          for (const triangle of faceTriangles) {
            for (const index of triangle) {
              const rgb = appearanceRgb(module, face.axis, transformed.p4[index][3], maxAbsW, appState);
              pushStereoVertex(triangles, transformed.view[index], rgb, 1);
            }
          }
        }
      }
    }

    if (appState.renderMode !== 'solid') {
      const structuralModules = activeInspectionSurface() ? scene.filledModules : scene.structuralModules;
      for (const module of structuralModules) {
        const transformed = cache.get(module) || transformedModule(module);
        for (const edge of module.edges || []) {
          const w = (transformed.p4[edge.a][3] + transformed.p4[edge.b][3]) * 0.5;
          const rgb = appState.renderMode === 'solid-edges'
            ? { r: 24, g: 25, b: 28 }
            : appearanceRgb(module, edge.axis, w, maxAbsW, appState);
          const depthBias = appState.renderMode === 'solid-edges' ? 0.0081 : 0;
          const a = transformed.view[edge.a];
          const b = transformed.view[edge.b];
          pushStereoVertex(lines, [a[0], a[1], a[2] + depthBias], rgb, 0.96);
          pushStereoVertex(lines, [b[0], b[1], b[2] + depthBias], rgb, 0.96);
        }
      }
    }
    return { triangles: new Float32Array(triangles), lines: new Float32Array(lines) };
  }

  function resizeStereoLayer() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(innerWidth * dpr));
    const height = Math.max(1, Math.round(innerHeight * dpr));
    if (stereoCanvas.width !== width || stereoCanvas.height !== height) {
      stereoCanvas.width = width;
      stereoCanvas.height = height;
    }
    stereoCanvas.style.width = innerWidth + 'px';
    stereoCanvas.style.height = innerHeight + 'px';
    return dpr;
  }

  function bindStereoBuffer(buffer, data) {
    const gl = stereoGl;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    const stride = 7 * 4;
    gl.enableVertexAttribArray(stereoLocations.position);
    gl.vertexAttribPointer(stereoLocations.position, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(stereoLocations.color);
    gl.vertexAttribPointer(stereoLocations.color, 4, gl.FLOAT, false, stride, 3 * 4);
  }

  function renderStereoGlEye(geometry, appState, viewport, eyeSign, dpr) {
    const gl = stereoGl;
    const vx = Math.round(viewport.x * dpr);
    const vy = Math.round((innerHeight - viewport.y - viewport.height) * dpr);
    const vw = Math.max(1, Math.round(viewport.width * dpr));
    const vh = Math.max(1, Math.round(viewport.height * dpr));
    gl.viewport(vx, vy, vw, vh);
    gl.scissor(vx, vy, vw, vh);
    const scale = Math.min(viewport.width, viewport.height) * STEREO_SCALE * appState.zoom;
    gl.uniform1f(stereoLocations.eye, eyeSign * 0.085);
    gl.uniform2f(stereoLocations.scale, 2 * scale / viewport.width, 2 * scale / viewport.height);
    gl.uniform1f(stereoLocations.cameraZ, STEREO_CAMERA_Z);

    if (geometry.triangles.length) {
      bindStereoBuffer(stereoTriangleBuffer, geometry.triangles);
      gl.uniform1f(stereoLocations.xray, appState.renderMode === 'xray' ? 1 : 0);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1, 1);
      gl.drawArrays(gl.TRIANGLES, 0, geometry.triangles.length / 7);
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }

    if (geometry.lines.length) {
      bindStereoBuffer(stereoLineBuffer, geometry.lines);
      gl.uniform1f(stereoLocations.xray, 0);
      if (appState.renderMode === 'xray') gl.disable(gl.DEPTH_TEST);
      gl.drawArrays(gl.LINES, 0, geometry.lines.length / 7);
      if (appState.renderMode === 'xray') gl.enable(gl.DEPTH_TEST);
    }
  }

  function drawStereoOverlay(scene, appState, layout, leftEyeSign, rightEyeSign) {
    clearOverlay();
    const pairs = [
      [layout.leftViewport, leftEyeSign, perception.swapped ? 'R eye' : 'L eye'],
      [layout.rightViewport, rightEyeSign, perception.swapped ? 'L eye' : 'R eye'],
    ];
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.13)';
    ctx.fillStyle = COLORS.text;
    ctx.font = '9px Inter, ui-sans-serif, sans-serif';
    ctx.textAlign = 'center';
    for (const [viewport, eyeSign, label] of pairs) {
      ctx.strokeRect(viewport.x + 0.5, viewport.y + 0.5, viewport.width - 1, viewport.height - 1);
      ctx.fillText(label, viewport.x + viewport.width * 0.5, viewport.y + 13);
      const markerY = Math.max(layout.safe.y + 8, viewport.y - 15);
      ctx.beginPath();
      ctx.arc(viewport.x + viewport.width * 0.5, markerY, 2.8, 0, Math.PI * 2);
      ctx.fill();

      if (perception.trajectories) {
        for (const anchor of perception.anchors) {
          const history = perception.trails.get(anchor.id) || [];
          const points = history.map((sample) => {
            const view = api.projectTransformed4DToView3D(sample.p4);
            return stereoProject(view, eyeSign, viewport, appState);
          });
          drawTrailPolyline(points, anchor.color, 1.15);
          const current = api.transformPoint4D(anchor.point);
          const view = api.projectTransformed4DToView3D(current);
          const point = stereoProject(view, eyeSign, viewport, appState);
          ctx.fillStyle = anchor.color;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = COLORS.text;
        }
      }
    }
    const instruction = perception.swapped
      ? 'Cross-eye · converge until the two dots fuse into a central third dot'
      : 'Parallel · relax focus beyond the screen until the two dots fuse';
    ctx.font = '10px Inter, ui-sans-serif, sans-serif';
    ctx.fillText(
      instruction,
      layout.safe.x + layout.safe.width * 0.5,
      Math.min(innerHeight - 14, layout.leftViewport.y + layout.leftViewport.height + 26),
    );
    ctx.restore();
  }

  function drawStereo(scene, appState) {
    if (!ensureStereoProgram()) {
      setStereo(false, false);
      setStatus('Stereo requires WebGL support in this browser.');
      return;
    }
    const layout = stereoLayout(perception.swapped);
    lastStereoLayout = layout;
    const dpr = resizeStereoLayer();
    stereoCanvas.style.display = 'block';
    const gl = stereoGl;
    gl.disable(gl.SCISSOR_TEST);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    gl.clearColor(0.027, 0.031, 0.035, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(stereoProgram);
    gl.enable(gl.SCISSOR_TEST);

    const geometry = buildStereoGeometry(scene, appState);
    const leftEyeSign = perception.swapped ? 1 : -1;
    const rightEyeSign = perception.swapped ? -1 : 1;
    renderStereoGlEye(geometry, appState, layout.leftViewport, leftEyeSign, dpr);
    renderStereoGlEye(geometry, appState, layout.rightViewport, rightEyeSign, dpr);
    gl.disable(gl.SCISSOR_TEST);
    drawStereoOverlay(scene, appState, layout, leftEyeSign, rightEyeSign);
  }

  function hideStereoLayer() {
    stereoCanvas.style.display = 'none';
    lastStereoLayout = null;
  }

  function clearOverlay() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }

  function installDesktopParallax() {
    window.addEventListener('pointermove', (event) => {
      if (!perception.parallax || event.buttons) return;
      const appState = currentState();
      if (appState.dimension < 3 || appState.pointerDown) return;
      const nx = (event.clientX / Math.max(1, innerWidth) - 0.5) * 2;
      const ny = (event.clientY / Math.max(1, innerHeight) - 0.5) * 2;
      perception.parallaxTargetYaw = Math.max(-0.075, Math.min(0.075, nx * 0.075));
      perception.parallaxTargetPitch = Math.max(-0.055, Math.min(0.055, ny * 0.055));
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      if (!perception.parallax) return;
      perception.parallaxTargetYaw = 0;
      perception.parallaxTargetPitch = 0;
    }, { passive: true });
  }

  function onDeviceOrientation(event) {
    if (!perception.parallax) return;
    if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    if (!perception.orientationBaseline) {
      perception.orientationBaseline = { beta: event.beta, gamma: event.gamma };
      return;
    }
    const dBeta = Math.max(-18, Math.min(18, event.beta - perception.orientationBaseline.beta));
    const dGamma = Math.max(-18, Math.min(18, event.gamma - perception.orientationBaseline.gamma));
    perception.parallaxTargetYaw = dGamma * 0.0040;
    perception.parallaxTargetPitch = dBeta * 0.0032;
  }

  async function ensureOrientationPermission() {
    if (perception.orientationInstalled) return true;
    const Orientation = window.DeviceOrientationEvent;
    if (!Orientation) return false;
    if (typeof Orientation.requestPermission === 'function') {
      const permission = await Orientation.requestPermission();
      if (permission !== 'granted') return false;
    }
    window.addEventListener('deviceorientation', onDeviceOrientation, true);
    perception.orientationInstalled = true;
    return true;
  }

  function updateParallax(dt) {
    if (!perception.parallax) {
      perception.parallaxTargetYaw = 0;
      perception.parallaxTargetPitch = 0;
    }
    const smoothing = 1 - Math.exp(-Math.max(0, dt) * 8.5);
    perception.parallaxYaw += (perception.parallaxTargetYaw - perception.parallaxYaw) * smoothing;
    perception.parallaxPitch += (perception.parallaxTargetPitch - perception.parallaxPitch) * smoothing;
    if (!perception.parallax
      && Math.abs(perception.parallaxYaw) < 1e-5
      && Math.abs(perception.parallaxPitch) < 1e-5) {
      perception.parallaxYaw = 0;
      perception.parallaxPitch = 0;
    }
    api.setPerceptionCameraOffset(perception.parallaxYaw, perception.parallaxPitch);
  }

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || 'unknown shader error';
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  function createXRProgram(gl) {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, `
      attribute vec3 aPosition;
      attribute vec4 aColor;
      uniform mat4 uProjection;
      uniform mat4 uView;
      uniform mat4 uModel;
      varying vec4 vColor;
      void main() {
        gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
        vColor = aColor;
      }
    `);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec4 vColor;
      void main() { gl_FragColor = vColor; }
    `);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'XR program link failed');
    }
    return program;
  }

  function xrIsMobileDevice() {
    const ua = navigator.userAgent || '';
    const uaMobile = navigator.userAgentData?.mobile === true
      || /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    // Standalone headsets should keep their native XR quality policy.
    return uaMobile && !/OculusBrowser|Quest|PicoBrowser/i.test(ua);
  }

  function identityXRMatrix() {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]);
  }

  function recenterXRFromPose(pose) {
    const matrix = pose?.transform?.matrix;
    if (!matrix) return false;
    let forwardX = -matrix[8];
    let forwardY = -matrix[9];
    let forwardZ = -matrix[10];
    const length = Math.hypot(forwardX, forwardY, forwardZ) || 1;
    forwardX /= length;
    forwardY /= length;
    forwardZ /= length;

    // Put the fitted hypermandala directly in the viewer's current gaze direction.
    // It remains world-locked afterwards, preserving genuine head-motion parallax.
    const distance = 1.55;
    const model = identityXRMatrix();
    model[12] = matrix[12] + forwardX * distance;
    model[13] = matrix[13] + forwardY * distance;
    model[14] = matrix[14] + forwardZ * distance;
    perception.xrModelMatrix = model;
    perception.xrRecenterPending = false;
    return true;
  }

  function fitXRProjectedPoints(points) {
    if (!points.length) return { center: [0, 0, 0], scale: 0.34, radius: 1 };
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const point of points) {
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], point[axis]);
        max[axis] = Math.max(max[axis], point[axis]);
      }
    }
    const center = min.map((value, axis) => (value + max[axis]) * 0.5);
    let radius = 1e-4;
    for (const point of points) {
      radius = Math.max(
        radius,
        Math.hypot(point[0] - center[0], point[1] - center[1], point[2] - center[2]),
      );
    }
    // ~0.56 m radius at 1.55 m gives a comfortable, immediately visible field of view.
    const scale = Math.max(0.10, Math.min(0.78, 0.56 / radius));
    return { center, scale, radius };
  }

  function xrFittedPoint(point, fit) {
    return [
      (point[0] - fit.center[0]) * fit.scale,
      -(point[1] - fit.center[1]) * fit.scale,
      (point[2] - fit.center[2]) * fit.scale,
    ];
  }

  function pushXRVertex(target, point, rgb, alpha = 1) {
    target.push(point[0], point[1], point[2], rgb.r/255, rgb.g/255, rgb.b/255, alpha);
  }

  function xrGeometryStateKey(appState) {
    return [
      api.sceneKey(),
      JSON.stringify(appState),
      perception.trajectories ? perception.lastTrailSample : 0,
    ].join('|');
  }

  function buildXRGeometry(scene, appState) {
    const triangles = [];
    const lines = [];
    const drawFaces = appState.renderMode !== 'wire';
    const drawLines = appState.renderMode !== 'solid';
    let maxAbsW = 1e-6;
    const cache = new Map();
    const allModules = [...new Set([...scene.filledModules, ...scene.structuralModules])];
    const allProjected = [];

    for (const module of allModules) {
      const p4 = module.vertices.map((point) => api.transformPoint4D(point));
      const p3 = p4.map((point) => api.projectTransformed4DTo3D(point));
      cache.set(module, { p4, p3 });
      for (const point of p4) maxAbsW = Math.max(maxAbsW, Math.abs(point[3]));
      allProjected.push(...p3);
    }

    const fit = fitXRProjectedPoints(allProjected);
    perception.xrScale = fit.scale;

    if (drawFaces) {
      for (const module of scene.filledModules) {
        const transformed = cache.get(module);
        if (!transformed) continue;
        const projected = transformed.p3.map((point) => xrFittedPoint(point, fit));
        for (const face of module.faces) {
          if (!face.indices || face.indices.length < 3) continue;
          const w = face.indices.reduce((sum, index) => sum + transformed.p4[index][3], 0) / face.indices.length;
          const rgb = appearanceRgb(module, face.axis, w, maxAbsW, appState);
          const alpha = appState.renderMode === 'xray' ? 0.24 : 1;
          for (let i = 1; i + 1 < face.indices.length; i += 1) {
            for (const index of [face.indices[0], face.indices[i], face.indices[i + 1]]) {
              pushXRVertex(triangles, projected[index], rgb, alpha);
            }
          }
        }
      }
    }

    if (drawLines) {
      const structuralModules = activeInspectionSurface() ? scene.filledModules : scene.structuralModules;
      for (const module of structuralModules) {
        const transformed = cache.get(module);
        if (!transformed) continue;
        const projected = transformed.p3.map((point) => xrFittedPoint(point, fit));
        for (const edge of module.edges || []) {
          const w = (transformed.p4[edge.a][3] + transformed.p4[edge.b][3]) * 0.5;
          const rgb = appearanceRgb(module, edge.axis, w, maxAbsW, appState);
          pushXRVertex(lines, projected[edge.a], rgb, 0.9);
          pushXRVertex(lines, projected[edge.b], rgb, 0.9);
        }
      }
    }

    if (perception.trajectories) {
      for (const anchor of perception.anchors) {
        const history = perception.trails.get(anchor.id) || [];
        const rgb = hexRgb(anchor.color);
        for (let i = 1; i < history.length; i += 1) {
          const a3 = api.projectTransformed4DTo3D(history[i - 1].p4);
          const b3 = api.projectTransformed4DTo3D(history[i].p4);
          const a = xrFittedPoint(a3, fit);
          const b = xrFittedPoint(b3, fit);
          const alpha = 0.18 + 0.82 * (i / Math.max(1, history.length - 1));
          pushXRVertex(lines, a, rgb, alpha);
          pushXRVertex(lines, b, rgb, alpha);
        }
      }
    }

    return {
      triangles: new Float32Array(triangles),
      lines: new Float32Array(lines),
      fit,
    };
  }

  function bindXRBuffer(gl, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const stride = 7 * 4;
    gl.enableVertexAttribArray(perception.xrLocations.position);
    gl.vertexAttribPointer(perception.xrLocations.position, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(perception.xrLocations.color);
    gl.vertexAttribPointer(perception.xrLocations.color, 4, gl.FLOAT, false, stride, 3 * 4);
  }

  function uploadXRGeometry(gl, geometry) {
    gl.bindBuffer(gl.ARRAY_BUFFER, perception.xrTriangleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.triangles, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, perception.xrLineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.lines, gl.DYNAMIC_DRAW);
  }

  function drawXRBuffer(gl, mode, buffer, vertexCount) {
    if (!vertexCount) return;
    bindXRBuffer(gl, buffer);
    gl.drawArrays(mode, 0, vertexCount);
  }

  function onXRFrame(time, frame) {
    const session = frame.session;
    if (session !== perception.xrSession) return;
    session.requestAnimationFrame(onXRFrame);
    const pose = frame.getViewerPose(perception.xrReferenceSpace);
    if (!pose) return;

    if (perception.xrRecenterPending || !perception.xrModelMatrix) recenterXRFromPose(pose);

    const appState = currentState();
    const scene = ensureScene();
    const gl = perception.xrGl;
    const layer = session.renderState.baseLayer;
    if (!gl || !layer || !perception.xrModelMatrix) return;

    const geometryKey = xrGeometryStateKey(appState);
    const geometryInterval = perception.xrMobile ? 33 : 0;
    if (!perception.xrGeometry
      || (geometryKey !== perception.xrGeometryKey
        && time - perception.xrLastGeometryBuild >= geometryInterval)) {
      perception.xrGeometry = buildXRGeometry(scene, appState);
      perception.xrGeometryKey = geometryKey;
      perception.xrLastGeometryBuild = time;
      uploadXRGeometry(gl, perception.xrGeometry);
    }
    const geometry = perception.xrGeometry;
    if (!geometry) return;

    gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(0.012, 0.014, 0.018, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(perception.xrProgram);
    gl.uniformMatrix4fv(perception.xrLocations.model, false, perception.xrModelMatrix);

    for (const view of pose.views) {
      const viewport = layer.getViewport(view);
      gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
      gl.uniformMatrix4fv(perception.xrLocations.projection, false, view.projectionMatrix);
      gl.uniformMatrix4fv(perception.xrLocations.view, false, view.transform.inverse.matrix);

      const translucent = appState.renderMode === 'xray';
      gl.depthMask(!translucent);
      if (translucent) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      } else {
        gl.disable(gl.BLEND);
      }
      drawXRBuffer(
        gl,
        gl.TRIANGLES,
        perception.xrTriangleBuffer,
        geometry.triangles.length / 7,
      );

      gl.depthMask(false);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      drawXRBuffer(
        gl,
        gl.LINES,
        perception.xrLineBuffer,
        geometry.lines.length / 7,
      );
      gl.disable(gl.BLEND);
      gl.depthMask(true);
    }
  }

  async function startXR() {
    if (!perception.xrSupported || !navigator.xr) return;
    if (perception.xrSession) {
      await perception.xrSession.end();
      return;
    }
    const appState = currentState();
    if (appState.dimension < 4) {
      setStatus('Switch to 4D before entering VR.');
      return;
    }

    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor'],
      });
      perception.xrMobile = xrIsMobileDevice();
      const gl = xrCanvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        xrCompatible: true,
        powerPreference: 'high-performance',
      });
      if (!gl) throw new Error('WebGL unavailable for XR');
      if (gl.makeXRCompatible) await gl.makeXRCompatible();

      const program = createXRProgram(gl);
      perception.xrSession = session;
      perception.xrGl = gl;
      perception.xrProgram = program;
      perception.xrTriangleBuffer = gl.createBuffer();
      perception.xrLineBuffer = gl.createBuffer();
      perception.xrLocations = {
        position: gl.getAttribLocation(program, 'aPosition'),
        color: gl.getAttribLocation(program, 'aColor'),
        projection: gl.getUniformLocation(program, 'uProjection'),
        view: gl.getUniformLocation(program, 'uView'),
        model: gl.getUniformLocation(program, 'uModel'),
      };
      perception.xrFramebufferScale = perception.xrMobile ? 0.68 : 0.90;
      session.updateRenderState({
        baseLayer: new XRWebGLLayer(session, gl, {
          antialias: false,
          framebufferScaleFactor: perception.xrFramebufferScale,
        }),
      });

      try {
        perception.xrReferenceSpace = await session.requestReferenceSpace('local-floor');
        perception.xrUsesFloor = true;
      } catch {
        perception.xrReferenceSpace = await session.requestReferenceSpace('local');
        perception.xrUsesFloor = false;
      }

      perception.xrGeometry = null;
      perception.xrGeometryKey = '';
      perception.xrLastGeometryBuild = 0;
      perception.xrModelMatrix = null;
      perception.xrRecenterPending = true;

      // Cardboard-style viewers commonly expose a single select action.  Use it
      // as a recenter command so the user can recover the mandala without exiting VR.
      session.addEventListener('select', () => {
        perception.xrRecenterPending = true;
      });

      session.addEventListener('end', () => {
        perception.xrSession = null;
        perception.xrReferenceSpace = null;
        perception.xrGl = null;
        perception.xrProgram = null;
        perception.xrTriangleBuffer = null;
        perception.xrLineBuffer = null;
        perception.xrLocations = null;
        perception.xrGeometry = null;
        perception.xrGeometryKey = '';
        perception.xrModelMatrix = null;
        perception.xrRecenterPending = true;
        if (enterVr) enterVr.textContent = 'Enter immersive VR';
        setStatus('VR session ended. Intrinsic 4D geometry was unchanged.');
      }, { once: true });

      if (enterVr) enterVr.textContent = 'Exit immersive VR';
      setStatus(
        perception.xrMobile
          ? 'VR fitted the mandala in front of you. Tap the viewer trigger to recenter.'
          : 'VR fitted the projected 4D form in front of you; use the primary select action to recenter.',
      );
      session.requestAnimationFrame(onXRFrame);
    } catch (error) {
      console.warn('Unable to start WebXR session.', error);
      setStatus('Immersive VR could not start on this browser/device.');
    }
  }

  async function detectXR() {
    try {
      perception.xrSupported = Boolean(
        navigator.xr?.isSessionSupported
        && await navigator.xr.isSessionSupported('immersive-vr'),
      );
    } catch {
      perception.xrSupported = false;
    }
  }

  function setStereo(enabled, message = true) {
    perception.stereo = Boolean(enabled);
    document.body.classList.toggle('stereo-active', perception.stereo);
    if (!perception.stereo) hideStereoLayer();
    stereoToggle?.classList.toggle('is-active', perception.stereo);
    stereoToggle?.setAttribute('aria-pressed', String(perception.stereo));
    if (!perception.stereo) {
      perception.swapped = false;
      stereoSwap?.classList.remove('is-active');
      stereoSwap?.setAttribute('aria-pressed', 'false');
    }
    if (message) setStatus(perception.stereo ? 'Stereo pair on.' : 'Stereo pair off.');
  }

  function setParallax(enabled, message = true) {
    perception.parallax = Boolean(enabled);
    if (!perception.parallax) {
      perception.parallaxTargetYaw = 0;
      perception.parallaxTargetPitch = 0;
    }
    parallaxToggle?.classList.toggle('is-active', perception.parallax);
    parallaxToggle?.setAttribute('aria-pressed', String(perception.parallax));
    if (message) setStatus(perception.parallax ? 'Observer orbit changes only the ordinary 3D camera orientation.' : 'Observer orbit off.');
  }

  function setTrajectories(enabled, message = true) {
    perception.trajectories = Boolean(enabled);
    perception.trails.clear();
    ensureScene();
    for (const anchor of perception.anchors) perception.trails.set(anchor.id, []);
    trajectoryToggle?.classList.toggle('is-active', perception.trajectories);
    trajectoryToggle?.setAttribute('aria-pressed', String(perception.trajectories));
    if (message) setStatus(perception.trajectories ? 'Tracing transformed points in R4.' : '4D trajectories off.');
  }

  stereoToggle?.addEventListener('click', () => {
    const appState = currentState();
    if (appState.dimension < 4 || appState.screenProjection !== 'perspective') return;
    setStereo(!perception.stereo);
  });

  stereoSwap?.addEventListener('click', () => {
    if (!perception.stereo) return;
    perception.swapped = !perception.swapped;
    stereoSwap.classList.toggle('is-active', perception.swapped);
    stereoSwap.setAttribute('aria-pressed', String(perception.swapped));
    setStatus(perception.swapped
      ? 'Cross-eye: converge until the two fusion dots become a central third dot.'
      : 'Parallel stereo: relax focus beyond the screen until the fusion dots merge.');
  });

  parallaxToggle?.addEventListener('click', async () => {
    const appState = currentState();
    if (appState.dimension < 3) return;
    setParallax(!perception.parallax, false);
    perception.orientationBaseline = null;
    if (perception.parallax && matchMedia('(pointer: coarse)').matches) {
      try {
        const granted = await ensureOrientationPermission();
        if (!granted) {
          setStatus('Observer orbit enabled for pointer input; device orientation permission was not granted.');
          return;
        }
      } catch {
        setStatus('Observer orbit enabled for pointer input; device orientation is unavailable.');
        return;
      }
    }
    setStatus(perception.parallax ? 'Observer orbit changes only the ordinary 3D camera orientation.' : 'Observer orbit off.');
  });

  trajectoryToggle?.addEventListener('click', () => {
    if (currentState().dimension < 4) return;
    setTrajectories(!perception.trajectories);
  });

  enterVr?.addEventListener('click', startXR);

  function syncAvailability(appState) {
    const in4D = appState.dimension >= 4 && !appState.transition;
    const in3DOr4D = appState.dimension >= 3 && !appState.transition;
    const safe = stereoSafeRect();
    const stereoLayoutReady = innerWidth >= 820 && innerHeight >= 520 && safe.width >= 520;
    const stereoAllowed = in4D
      && appState.screenProjection === 'perspective'
      && stereoLayoutReady
      && Boolean(stereoGl);

    if (stereoToggle) {
      stereoToggle.disabled = !stereoAllowed;
      stereoToggle.title = !in4D
        ? 'Switch to 4D to use stereoscopic viewing'
        : appState.screenProjection !== 'perspective'
          ? 'Screen stereo in Hypermandala uses a physical pinhole-eye model; choose Perspective for the 3D→2D camera'
          : !stereoLayoutReady
            ? 'Stereo needs a wider unobstructed viewport; widen the window or collapse browser sidebars'
            : !stereoGl
              ? 'Stereo requires WebGL support'
              : 'Render a depth-tested parallel off-axis eye pair of the exact 4D→3D projection';
    }
    if (stereoSwap) stereoSwap.disabled = !stereoAllowed || !perception.stereo;
    if (trajectoryToggle) trajectoryToggle.disabled = !in4D;
    if (parallaxToggle) {
      parallaxToggle.disabled = !in3DOr4D;
      parallaxToggle.title = 'Orbit the ordinary 3D observer with pointer or device tilt; this is an orientation cue, not translational head parallax';
    }
    if (enterVr) enterVr.disabled = !perception.xrSupported || !in4D;

    document.querySelector('[data-tool-group="stereo"]')?.classList.toggle('is-unavailable', !in4D || !stereoLayoutReady);
    document.querySelector('[data-tool-group="camera-motion"]')?.classList.toggle('is-unavailable', !in3DOr4D);
    document.querySelector('[data-tool-group="4d-motion"]')?.classList.toggle('is-unavailable', !in4D);

    if (!stereoAllowed && perception.stereo) setStereo(false, false);
    if (!in4D && perception.trajectories) setTrajectories(false, false);
    if (!in3DOr4D && perception.parallax) setParallax(false, false);
    if (!in4D && perception.xrSession) perception.xrSession.end().catch(() => {});
  }

  window.__hypermandalaPerceptionDebug = Object.freeze({
    stereoLayout: () => stereoLayout(perception.swapped),
    stereoState: () => ({
      enabled: perception.stereo,
      crossEye: perception.swapped,
      hasWebGL: Boolean(stereoGl),
      layout: lastStereoLayout || stereoLayout(perception.swapped),
    }),
    stereoProject: (viewPoint, eyeSign) => {
      const layout = stereoLayout(perception.swapped);
      return stereoProject(viewPoint, eyeSign, layout.leftViewport, currentState());
    },
  });

  function frame(now) {
    const dt = Math.min(0.05, (now - perception.lastFrame) / 1000);
    perception.lastFrame = now;
    const appState = currentState();

    syncAvailability(appState);
    updateParallax(dt);
    updateTrajectories(now, appState);

    if (perception.stereo && appState.dimension >= 4 && appState.screenProjection === 'perspective') {
      drawStereo(ensureScene(), appState);
    } else {
      hideStereoLayer();
      clearOverlay();
      if (perception.trajectories && appState.dimension >= 4) {
        ensureScene();
        drawScreenTrajectories();
      }
    }
    requestAnimationFrame(frame);
  }

  harmonizeExplorer();
  installDesktopParallax();
  resizeOverlay();
  window.addEventListener('resize', resizeOverlay, { passive: true });
  detectXR();
  setStatus('Perception changes only the observer; intrinsic geometry is unchanged.');

  window.__hypermandalaImmersiveDebug = Object.freeze({
    state: () => ({
      stereo: perception.stereo,
      swapped: perception.swapped,
      parallax: perception.parallax,
      trajectories: perception.trajectories,
      xrSupported: perception.xrSupported,
    }),
    ui: () => ({
      xrayInsideRendering: document.querySelector('[data-render="xray"]')?.parentElement?.id === 'renderControl',
      renderChoices: byId('renderControl')?.querySelectorAll('[data-render]').length || 0,
      perceptionSection: Boolean(document.querySelector('.view-tools-details')),
      inspectionLabel: document.querySelector('.perception-details .control-section__label')?.textContent || '',
    }),
  });

  requestAnimationFrame(frame);
})();
