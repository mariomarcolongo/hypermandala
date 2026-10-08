/*
 * Hypermandala immersive perception tools.
 *
 * These tools alter only the way the already-constructed 4D geometry is
 * observed. They never mutate intrinsic vertices, topology, hierarchy or W
 * semantics. Stereo and WebXR operate after the exact 4D transform/projection;
 * motion parallax perturbs only the ordinary 3D camera; trajectories record
 * the actual transformed 4D positions of points in the mandala.
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

  const overlay = document.getElementById('perceptionOverlay');
  const xrCanvas = document.getElementById('xrCanvas');
  const stereoToggle = document.getElementById('stereoToggle');
  const stereoSwap = document.getElementById('stereoSwap');
  const parallaxToggle = document.getElementById('motionParallaxToggle');
  const trajectoryToggle = document.getElementById('trajectoryToggle');
  const enterVr = document.getElementById('enterVr');
  const status = document.getElementById('immersiveStatus');

  if (!overlay || !xrCanvas) return;

  const ctx = overlay.getContext('2d', { alpha: true, desynchronized: true });
  const COLORS = {
    background: '#070809',
    separator: 'rgba(255,255,255,.09)',
    text: 'rgba(240,239,233,.54)',
    center: '#f2dfa0',
    wPlus: '#f0c45c',
    wMinus: '#6ca8ff',
    neutral: '#e7ddc6',
  };

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

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function rgbCss(rgb, alpha = 1) {
    return `rgba(${Math.round(rgb.r)},${Math.round(rgb.g)},${Math.round(rgb.b)},${alpha})`;
  }

  function mixRgb(a, b, t) {
    const u = Math.max(0, Math.min(1, t));
    return {
      r: a.r + (b.r - a.r) * u,
      g: a.g + (b.g - a.g) * u,
      b: a.b + (b.b - a.b) * u,
    };
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

  function currentState() {
    return api.stateSnapshot();
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

    for (const p of vertices) {
      const key = p.slice(0, 3).map((value) => Math.round(value * 10000)).join(',');
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(p);
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
    if (symbolic && symbolic.every(Number.isFinite)) {
      anchors.push({
        id: 'symbolic-center',
        label: 'symbolic center',
        point: [...symbolic],
        color: COLORS.center,
      });
    }

    const vertices = uniqueVertices(scene.structuralModules);
    const semantics = scene.state.wSemantics;

    if (semantics?.[1] === 'spatial') {
      const pair = chooseMirrorPair(vertices);
      if (pair) {
        anchors.push({ id: 'w-minus', label: 'W− mirror', point: [...pair[0]], color: COLORS.wMinus });
        anchors.push({ id: 'w-plus', label: 'W+ mirror', point: [...pair[1]], color: COLORS.wPlus });
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
      anchors.push({
        id: 'outer-anchor',
        label: 'outer 4D point',
        point: [...farthest],
        color: COLORS.wPlus,
      });
    }

    return anchors.slice(0, 3);
  }

  function p4Distance(a, b) {
    if (!a || !b) return Infinity;
    return Math.hypot(
      a[0] - b[0],
      a[1] - b[1],
      a[2] - b[2],
      a[3] - b[3],
    );
  }

  function updateTrajectories(now, state) {
    if (!perception.trajectories || state.dimension < 4 || state.transition) return;
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
      while (history.length > 180 || (history[0] && now - history[0].time > 8000)) {
        history.shift();
      }
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
      if (points.length) {
        const p = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = anchor.color;
        ctx.globalAlpha = 0.92;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  function stereoProject(viewPoint, eyeSign, viewport, appState) {
    const eye = eyeSign * 0.085;
    const cameraZ = 9;
    const distance = Math.max(0.3, cameraZ - viewPoint[2]);
    const factor = cameraZ / distance;

    // Parallel off-axis stereo. Adding the eye term sets zero parallax at
    // view-space Z=0, avoiding toe-in distortion while keeping the mandala's
    // center on the fusion plane.
    const x = (viewPoint[0] - eye) * factor + eye;
    const y = viewPoint[1] * factor;
    const scale = Math.min(viewport.width, viewport.height)
      * 0.245
      * appState.zoom;

    return {
      x: viewport.x + viewport.width * 0.5 + x * scale,
      y: viewport.y + viewport.height * 0.5 + y * scale,
      depth: viewPoint[2],
    };
  }

  function shadeForAxis(rgb, axis) {
    const multiplier = axis === 'w' ? 0.84 : axis === 'z' ? 1.06 : axis === 'x' ? 0.94 : 1;
    return {
      r: Math.max(0, Math.min(255, rgb.r * multiplier)),
      g: Math.max(0, Math.min(255, rgb.g * multiplier)),
      b: Math.max(0, Math.min(255, rgb.b * multiplier)),
    };
  }

  function renderStereoEye(scene, appState, viewport, eyeSign) {
    const faces = [];

    for (const module of scene.filledModules) {
      const viewVertices = module.vertices.map((point) => api.projectPointToView3D(point));
      const baseRgb = api.regionRgb(module.regionId, 0, 0);

      for (const face of module.faces) {
        if (!face.indices || face.indices.length < 3) continue;
        const points = face.indices.map((index) => (
          stereoProject(viewVertices[index], eyeSign, viewport, appState)
        ));
        const depth = face.indices.reduce(
          (sum, index) => sum + viewVertices[index][2],
          0,
        ) / face.indices.length;
        faces.push({
          points,
          depth,
          rgb: shadeForAxis(baseRgb, face.axis),
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
      ctx.fillStyle = rgbCss(face.rgb, appState.renderMode === 'xray' ? 0.38 : 0.90);
      ctx.fill();
      ctx.strokeStyle = face.axis === 'w'
        ? 'rgba(240,196,92,.64)'
        : 'rgba(20,18,16,.58)';
      ctx.lineWidth = 0.75;
      ctx.stroke();
    }

    for (const module of scene.structuralModules) {
      const viewVertices = module.vertices.map((point) => api.projectPointToView3D(point));
      const region = api.regionRgb(module.regionId, 0, 0);
      const structural = mixRgb(region, { r: 244, g: 241, b: 232 }, 0.34);

      for (const edge of module.edges) {
        const a = stereoProject(viewVertices[edge.a], eyeSign, viewport, appState);
        const b = stereoProject(viewVertices[edge.b], eyeSign, viewport, appState);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = edge.axis === 'w' ? COLORS.wPlus : rgbCss(structural, 0.78);
        ctx.globalAlpha = edge.axis === 'w' ? 0.78 : 0.48;
        ctx.lineWidth = edge.axis === 'w' ? 1.05 : 0.70;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

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

    // Minimal fusion marker: useful for both parallel and cross-eye viewing,
    // while visually echoing the bindu without pretending to be geometry.
    ctx.beginPath();
    ctx.arc(viewport.x + viewport.width * 0.5, viewport.y + viewport.height - 24, 2.1, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.center;
    ctx.globalAlpha = 0.64;
    ctx.fill();
    ctx.globalAlpha = 1;
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
      const state = currentState();
      if (state.dimension < 3 || state.pointerDown) return;
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

    if (
      Math.abs(perception.parallaxYaw) < 1e-5
      && Math.abs(perception.parallaxPitch) < 1e-5
      && !perception.parallax
    ) {
      perception.parallaxYaw = 0;
      perception.parallaxPitch = 0;
    }

    api.setPerceptionCameraOffset(perception.parallaxYaw, perception.parallaxPitch);
  }

  function updateXRScale(scene) {
    let extent = 0.1;
    for (const point of uniqueVertices(scene.structuralModules)) {
      extent = Math.max(extent, Math.hypot(point[0], point[1], point[2]));
    }
    perception.xrScale = Math.max(0.20, Math.min(0.48, 0.82 / extent));
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
      void main() {
        gl_FragColor = vColor;
      }
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

  function worldPointFromProjected3D(p3) {
    const scale = perception.xrScale;
    const baseY = perception.xrUsesFloor ? 1.35 : -0.02;
    return [
      p3[0] * scale,
      baseY - p3[1] * scale,
      -2.05 + p3[2] * scale,
    ];
  }

  function pushXRVertex(target, point, rgb, alpha = 1) {
    target.push(
      point[0], point[1], point[2],
      rgb.r / 255, rgb.g / 255, rgb.b / 255, alpha,
    );
  }

  function buildXRGeometry(scene) {
    const triangles = [];
    const lines = [];

    for (const module of scene.filledModules) {
      const projected = module.vertices.map((point) => (
        worldPointFromProjected3D(api.projectPoint4DTo3D(point))
      ));
      const region = api.regionRgb(module.regionId, 0, 0);

      for (const face of module.faces) {
        if (!face.indices || face.indices.length < 3) continue;
        let rgb = shadeForAxis(region, face.axis);
        if (face.axis === 'w') rgb = mixRgb(rgb, hexRgb(COLORS.wPlus), 0.22);
        for (let i = 1; i + 1 < face.indices.length; i += 1) {
          const indices = [face.indices[0], face.indices[i], face.indices[i + 1]];
          for (const index of indices) pushXRVertex(triangles, projected[index], rgb, 1);
        }
      }
    }

    for (const module of scene.structuralModules) {
      const projected = module.vertices.map((point) => (
        worldPointFromProjected3D(api.projectPoint4DTo3D(point))
      ));
      const region = api.regionRgb(module.regionId, 0, 0);
      const neutral = mixRgb(region, { r: 250, g: 246, b: 236 }, 0.42);
      for (const edge of module.edges) {
        const rgb = edge.axis === 'w' ? hexRgb(COLORS.wPlus) : neutral;
        pushXRVertex(lines, projected[edge.a], rgb, 1);
        pushXRVertex(lines, projected[edge.b], rgb, 1);
      }
    }

    if (perception.trajectories) {
      for (const anchor of perception.anchors) {
        const history = perception.trails.get(anchor.id) || [];
        const rgb = hexRgb(anchor.color);
        for (let i = 1; i < history.length; i += 1) {
          const a = worldPointFromProjected3D(api.projectTransformed4DTo3D(history[i - 1].p4));
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

    const scene = ensureScene();
    const geometry = buildXRGeometry(scene);
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

      gl.depthMask(true);
      gl.disable(gl.BLEND);
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
      // requestSession is intentionally called directly from the button event:
      // immersive WebXR requires transient user activation.
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor'],
      });

      const gl = xrCanvas.getContext('webgl', {
        alpha: false,
        antialias: true,
        xrCompatible: true,
      });
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
      } catch (error) {
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
      setStatus('VR: headset pose supplies the two real eye views of the projected 4D mandala.');
      session.requestAnimationFrame(onXRFrame);
    } catch (error) {
      console.warn('Unable to start WebXR session.', error);
      setStatus('Immersive VR could not start on this browser/device.');
    }
  }

  async function detectXR() {
    if (!navigator.xr?.isSessionSupported) {
      perception.xrSupported = false;
    } else {
      try {
        perception.xrSupported = await navigator.xr.isSessionSupported('immersive-vr');
      } catch (error) {
        perception.xrSupported = false;
      }
    }

    if (enterVr) {
      enterVr.disabled = !perception.xrSupported;
      enterVr.title = perception.xrSupported
        ? 'Enter a headset-rendered stereoscopic view of the current 4D projection'
        : 'Immersive WebXR is not available on this browser/device';
    }
  }

  stereoToggle?.addEventListener('click', () => {
    const appState = currentState();
    if (appState.dimension < 4) {
      setStatus('Stereo is a 4D perception tool; switch to 4D first.');
      return;
    }
    perception.stereo = !perception.stereo;
    stereoToggle.classList.toggle('is-active', perception.stereo);
    stereoToggle.setAttribute('aria-pressed', String(perception.stereo));
    if (stereoSwap) stereoSwap.disabled = !perception.stereo;
    setStatus(perception.stereo
      ? 'Stereo uses two off-axis eye views; the intrinsic 4D mandala is unchanged.'
      : 'Stereo off.');
  });

  stereoSwap?.addEventListener('click', () => {
    if (!perception.stereo) return;
    perception.swapped = !perception.swapped;
    stereoSwap.classList.toggle('is-active', perception.swapped);
    stereoSwap.setAttribute('aria-pressed', String(perception.swapped));
    setStatus(perception.swapped ? 'Cross-eye stereo order.' : 'Parallel stereo order.');
  });

  parallaxToggle?.addEventListener('click', async () => {
    perception.parallax = !perception.parallax;
    perception.orientationBaseline = null;

    if (perception.parallax && matchMedia('(pointer: coarse)').matches) {
      try {
        const granted = await ensureOrientationPermission();
        if (!granted) setStatus('Motion parallax enabled for pointer input; device orientation permission was not granted.');
      } catch (error) {
        setStatus('Motion parallax enabled for pointer input; device orientation is unavailable.');
      }
    }

    if (!perception.parallax) {
      perception.parallaxTargetYaw = 0;
      perception.parallaxTargetPitch = 0;
    }

    parallaxToggle.classList.toggle('is-active', perception.parallax);
    parallaxToggle.setAttribute('aria-pressed', String(perception.parallax));
    if (perception.parallax) {
      setStatus('Motion parallax moves only the 3D camera, never the 4D geometry.');
    }
  });

  trajectoryToggle?.addEventListener('click', () => {
    const appState = currentState();
    if (appState.dimension < 4) {
      setStatus('4D trajectories become meaningful after switching to 4D.');
      return;
    }
    perception.trajectories = !perception.trajectories;
    perception.trails.clear();
    ensureScene();
    for (const anchor of perception.anchors) perception.trails.set(anchor.id, []);
    trajectoryToggle.classList.toggle('is-active', perception.trajectories);
    trajectoryToggle.setAttribute('aria-pressed', String(perception.trajectories));
    setStatus(perception.trajectories
      ? 'Tracing the symbolic center and, where present, the exact W↔−W mirror pair.'
      : '4D trajectories off.');
  });

  enterVr?.addEventListener('click', startXR);

  function frame(now) {
    const dt = Math.min(0.05, (now - perception.lastFrame) / 1000);
    perception.lastFrame = now;
    const appState = currentState();

    if (appState.dimension < 4 && perception.stereo) {
      perception.stereo = false;
      stereoToggle?.classList.remove('is-active');
      stereoToggle?.setAttribute('aria-pressed', 'false');
      if (stereoSwap) stereoSwap.disabled = true;
    }

    updateParallax(dt);
    updateTrajectories(now, appState);

    if (perception.stereo && appState.dimension >= 4) {
      drawStereo(ensureScene(), appState);
    } else {
      clearOverlay();
      if (perception.trajectories && appState.dimension >= 4) {
        ensureScene();
        drawScreenTrajectories();
      }
    }

    if (enterVr) {
      enterVr.disabled = !perception.xrSupported || appState.dimension < 4;
    }

    requestAnimationFrame(frame);
  }

  installDesktopParallax();
  resizeOverlay();
  window.addEventListener('resize', resizeOverlay, { passive: true });
  detectXR();
  setStatus('Perception tools preserve the mandala center, topology and intrinsic 4D coordinates.');
  requestAnimationFrame(frame);
})();
