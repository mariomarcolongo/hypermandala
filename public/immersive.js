/*
 * Hypermandala immersive perception and Explorer harmonization.
 *
 * Observation tools never mutate intrinsic vertices, topology, hierarchy or W
 * semantics. The UI is reorganized by task: Rendering, 4D inspection and
 * Perception. Stereo/WebXR operate after the exact 4D transform/projection;
 * motion parallax moves only the ordinary 3D camera; trajectories record
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

  const ctx = overlay.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return;

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
    xrBuffer: null,
    xrLocations: null,
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
        makeCopy('Perspective-camera binocular views of the same 4D→3D projection.'),
        makePair(stereoToggle, stereoSwap),
      );

      const motionGroup = document.createElement('div');
      motionGroup.className = 'tool-group';
      motionGroup.dataset.toolGroup = 'camera-motion';
      motionGroup.append(
        makeLabel('Observer motion'),
        makeCopy('Motion parallax changes only the 3D observer. WebXR uses the headset pose and two real eye views.'),
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

  function updateXRScale(scene) {
    let extent = 0.1;
    for (const point of uniqueVertices(scene.structuralModules)) {
      extent = Math.max(extent, Math.hypot(point[0], point[1], point[2]));
    }
    perception.xrScale = Math.max(0.20, Math.min(0.48, 0.82 / extent));
  }

  function ensureScene() {
    const key = api.sceneKey();
    if (perception.scene && key === perception.sceneKey) return perception.scene;
    perception.scene = api.sceneSnapshot();
    perception.sceneKey = key;
    perception.anchors = chooseTrajectoryAnchors(perception.scene);
    perception.trails.clear();
    for (const anchor of perception.anchors) perception.trails.set(anchor.id, []);
    updateXRScale(perception.scene);
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

  function stereoProject(viewPoint, eyeSign, viewport, appState) {
    const eye = eyeSign * 0.085;
    const cameraZ = 9;
    const distance = Math.max(0.3, cameraZ - viewPoint[2]);
    const factor = cameraZ / distance;
    // Parallel off-axis stereo with zero parallax at view-space Z=0.
    const x = (viewPoint[0] - eye) * factor + eye;
    const y = viewPoint[1] * factor;
    const scale = Math.min(viewport.width, viewport.height) * 0.245 * appState.zoom;
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

  function renderStereoEye(scene, appState, viewport, eyeSign) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(viewport.x, viewport.y, viewport.width, viewport.height);
    ctx.clip();

    const drawFaces = appState.renderMode !== 'wire';
    const drawStructuralEdges = appState.renderMode !== 'solid';
    const faces = [];
    let maxAbsW = 1e-6;
    const transformedCache = new Map();

    for (const module of scene.filledModules) {
      const transformed = transformedModule(module);
      transformedCache.set(module, transformed);
      for (const point of transformed.p4) maxAbsW = Math.max(maxAbsW, Math.abs(point[3]));
    }

    if (drawFaces) {
      for (const module of scene.filledModules) {
        const transformed = transformedCache.get(module) || transformedModule(module);
        for (const face of module.faces) {
          if (!face.indices || face.indices.length < 3) continue;
          const points = face.indices.map((index) => (
            stereoProject(transformed.view[index], eyeSign, viewport, appState)
          ));
          const depth = face.indices.reduce((sum, index) => sum + transformed.view[index][2], 0)
            / face.indices.length;
          const w = face.indices.reduce((sum, index) => sum + transformed.p4[index][3], 0)
            / face.indices.length;
          faces.push({
            points,
            depth,
            rgb: appearanceRgb(module, face.axis, w, maxAbsW, appState),
            axis: face.axis,
          });
        }
      }
      faces.sort((a, b) => a.depth - b.depth);

      for (const face of faces) {
        ctx.beginPath();
        face.points.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        const alpha = appState.renderMode === 'xray' ? 0.22 : 0.90;
        ctx.fillStyle = rgbCss(face.rgb, alpha);
        ctx.fill();
        ctx.strokeStyle = face.axis === 'w'
          ? 'rgba(240,196,92,.54)'
          : 'rgba(20,18,16,.34)';
        ctx.lineWidth = 0.65;
        ctx.stroke();
      }
    }

    if (drawStructuralEdges) {
      const structuralModules = activeInspectionSurface()
        ? scene.filledModules
        : scene.structuralModules;
      for (const module of structuralModules) {
        const transformed = transformedCache.get(module) || transformedModule(module);
        for (const edge of module.edges || []) {
          const a = stereoProject(transformed.view[edge.a], eyeSign, viewport, appState);
          const b = stereoProject(transformed.view[edge.b], eyeSign, viewport, appState);
          const w = (transformed.p4[edge.a][3] + transformed.p4[edge.b][3]) * 0.5;
          const rgb = appearanceRgb(module, edge.axis, w, maxAbsW, appState);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = rgbCss(rgb, edge.axis === 'w' ? 0.84 : 0.72);
          ctx.globalAlpha = appState.renderMode === 'xray' ? 0.88 : 1;
          ctx.lineWidth = edge.axis === 'w' ? 1.05 : 0.72;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    if (perception.trajectories) {
      for (const anchor of perception.anchors) {
        const history = perception.trails.get(anchor.id) || [];
        const points = history.map((sample) => {
          const view = api.projectTransformed4DToView3D(sample.p4);
          return stereoProject(view, eyeSign, viewport, appState);
        });
        drawTrailPolyline(points, anchor.color, 1.15);
      }
    }

    ctx.beginPath();
    ctx.arc(viewport.x + viewport.width * 0.5, viewport.y + viewport.height - 24, 2.1, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.center;
    ctx.globalAlpha = 0.64;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawStereo(scene, appState) {
    const width = innerWidth;
    const height = innerHeight;
    const gap = Math.max(14, width * 0.012);
    const eyeWidth = (width - gap) * 0.5;
    const leftViewport = { x: 0, y: 0, width: eyeWidth, height };
    const rightViewport = { x: eyeWidth + gap, y: 0, width: eyeWidth, height };

    ctx.fillStyle = COLORS.background;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, width, height);

    const leftEyeSign = perception.swapped ? 1 : -1;
    const rightEyeSign = perception.swapped ? -1 : 1;
    renderStereoEye(scene, appState, leftViewport, leftEyeSign);
    renderStereoEye(scene, appState, rightViewport, rightEyeSign);

    ctx.fillStyle = COLORS.separator;
    ctx.fillRect(eyeWidth, 0, gap, height);
    ctx.fillStyle = COLORS.text;
    ctx.font = '10px Inter, ui-sans-serif, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(perception.swapped ? 'cross-eye stereo' : 'parallel stereo', width * 0.5, height - 8);
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
      varying vec4 vColor;
      void main() {
        gl_Position = uProjection * uView * vec4(aPosition, 1.0);
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

  function worldPointFromProjected3D(point) {
    const scale = perception.xrScale;
    const baseY = perception.xrUsesFloor ? 1.35 : -0.02;
    return [point[0] * scale, baseY - point[1] * scale, -2.05 + point[2] * scale];
  }

  function pushXRVertex(target, point, rgb, alpha = 1) {
    target.push(point[0], point[1], point[2], rgb.r/255, rgb.g/255, rgb.b/255, alpha);
  }

  function buildXRGeometry(scene, appState) {
    const triangles = [];
    const lines = [];
    const drawFaces = appState.renderMode !== 'wire';
    const drawLines = appState.renderMode !== 'solid';
    let maxAbsW = 1e-6;
    const cache = new Map();

    for (const module of scene.filledModules) {
      const p4 = module.vertices.map((point) => api.transformPoint4D(point));
      cache.set(module, p4);
      for (const point of p4) maxAbsW = Math.max(maxAbsW, Math.abs(point[3]));
    }

    if (drawFaces) {
      for (const module of scene.filledModules) {
        const p4 = cache.get(module) || module.vertices.map((point) => api.transformPoint4D(point));
        const projected = p4.map((point) => worldPointFromProjected3D(api.projectTransformed4DTo3D(point)));
        for (const face of module.faces) {
          if (!face.indices || face.indices.length < 3) continue;
          const w = face.indices.reduce((sum, index) => sum + p4[index][3], 0) / face.indices.length;
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
        const p4 = module.vertices.map((point) => api.transformPoint4D(point));
        const projected = p4.map((point) => worldPointFromProjected3D(api.projectTransformed4DTo3D(point)));
        for (const edge of module.edges || []) {
          const w = (p4[edge.a][3] + p4[edge.b][3]) * 0.5;
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
          const a = worldPointFromProjected3D(api.projectTransformed4DTo3D(history[i-1].p4));
          const b = worldPointFromProjected3D(api.projectTransformed4DTo3D(history[i].p4));
          const alpha = 0.18 + 0.82 * (i / Math.max(1, history.length - 1));
          pushXRVertex(lines, a, rgb, alpha);
          pushXRVertex(lines, b, rgb, alpha);
        }
      }
    }
    return { triangles, lines };
  }

  function drawXRBuffer(gl, mode, data) {
    if (!data.length) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, perception.xrBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
    const stride = 7 * 4;
    gl.enableVertexAttribArray(perception.xrLocations.position);
    gl.vertexAttribPointer(perception.xrLocations.position, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(perception.xrLocations.color);
    gl.vertexAttribPointer(perception.xrLocations.color, 4, gl.FLOAT, false, stride, 3 * 4);
    gl.drawArrays(mode, 0, data.length / 7);
  }

  function onXRFrame(time, frame) {
    const session = frame.session;
    if (session !== perception.xrSession) return;
    session.requestAnimationFrame(onXRFrame);
    const pose = frame.getViewerPose(perception.xrReferenceSpace);
    if (!pose) return;

    const appState = currentState();
    const scene = ensureScene();
    const geometry = buildXRGeometry(scene, appState);
    const gl = perception.xrGl;
    const layer = session.renderState.baseLayer;
    if (!gl || !layer) return;

    gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(0.012, 0.014, 0.018, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(perception.xrProgram);

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
      drawXRBuffer(gl, gl.TRIANGLES, geometry.triangles);

      gl.depthMask(false);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      drawXRBuffer(gl, gl.LINES, geometry.lines);
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
      const gl = xrCanvas.getContext('webgl', { alpha: false, antialias: true, xrCompatible: true });
      if (!gl) throw new Error('WebGL unavailable for XR');
      if (gl.makeXRCompatible) await gl.makeXRCompatible();

      const program = createXRProgram(gl);
      perception.xrSession = session;
      perception.xrGl = gl;
      perception.xrProgram = program;
      perception.xrBuffer = gl.createBuffer();
      perception.xrLocations = {
        position: gl.getAttribLocation(program, 'aPosition'),
        color: gl.getAttribLocation(program, 'aColor'),
        projection: gl.getUniformLocation(program, 'uProjection'),
        view: gl.getUniformLocation(program, 'uView'),
      };
      session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });

      try {
        perception.xrReferenceSpace = await session.requestReferenceSpace('local-floor');
        perception.xrUsesFloor = true;
      } catch {
        perception.xrReferenceSpace = await session.requestReferenceSpace('local');
        perception.xrUsesFloor = false;
      }

      session.addEventListener('end', () => {
        perception.xrSession = null;
        perception.xrReferenceSpace = null;
        perception.xrGl = null;
        perception.xrProgram = null;
        perception.xrBuffer = null;
        perception.xrLocations = null;
        if (enterVr) enterVr.textContent = 'Enter immersive VR';
        setStatus('VR session ended. Intrinsic 4D geometry was unchanged.');
      }, { once: true });

      if (enterVr) enterVr.textContent = 'Exit immersive VR';
      setStatus('VR uses the headset pose and two physical eye views of the projected 4D form.');
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
    if (message) setStatus(perception.parallax ? 'Motion parallax moves only the 3D observer.' : 'Motion parallax off.');
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
    setStatus(perception.swapped ? 'Cross-eye stereo order.' : 'Parallel stereo order.');
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
          setStatus('Motion parallax enabled for pointer input; device orientation permission was not granted.');
          return;
        }
      } catch {
        setStatus('Motion parallax enabled for pointer input; device orientation is unavailable.');
        return;
      }
    }
    setStatus(perception.parallax ? 'Motion parallax moves only the 3D observer.' : 'Motion parallax off.');
  });

  trajectoryToggle?.addEventListener('click', () => {
    if (currentState().dimension < 4) return;
    setTrajectories(!perception.trajectories);
  });

  enterVr?.addEventListener('click', startXR);

  function syncAvailability(appState) {
    const in4D = appState.dimension >= 4 && !appState.transition;
    const in3DOr4D = appState.dimension >= 3 && !appState.transition;
    const stereoAllowed = in4D && appState.screenProjection === 'perspective';

    if (stereoToggle) {
      stereoToggle.disabled = !stereoAllowed;
      stereoToggle.title = !in4D
        ? 'Switch to 4D to use stereoscopic viewing'
        : appState.screenProjection !== 'perspective'
          ? 'Stereo requires the perspective 3D→2D camera; orthographic projection has no binocular depth disparity'
          : 'Render two parallel off-axis eye views of the exact 4D→3D projection';
    }
    if (stereoSwap) stereoSwap.disabled = !stereoAllowed || !perception.stereo;
    if (trajectoryToggle) trajectoryToggle.disabled = !in4D;
    if (parallaxToggle) parallaxToggle.disabled = !in3DOr4D;
    if (enterVr) enterVr.disabled = !perception.xrSupported || !in4D;

    document.querySelector('[data-tool-group="stereo"]')?.classList.toggle('is-unavailable', !in4D);
    document.querySelector('[data-tool-group="camera-motion"]')?.classList.toggle('is-unavailable', !in3DOr4D);
    document.querySelector('[data-tool-group="4d-motion"]')?.classList.toggle('is-unavailable', !in4D);

    if (!stereoAllowed && perception.stereo) setStereo(false, false);
    if (!in4D && perception.trajectories) setTrajectories(false, false);
    if (!in3DOr4D && perception.parallax) setParallax(false, false);
    if (!in4D && perception.xrSession) perception.xrSession.end().catch(() => {});
  }

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
