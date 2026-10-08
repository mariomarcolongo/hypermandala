#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def sub_once(text: str, pattern: str, replacement: str, *, flags=0) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(f"Expected one replacement for {pattern!r}, got {count}")
    return updated


def replace_once(text: str, old: str, new: str) -> str:
    if text.count(old) != 1:
        raise RuntimeError(f"Expected one occurrence of {old!r}, got {text.count(old)}")
    return text.replace(old, new, 1)


def patch_immersive() -> None:
    path = ROOT / "public/immersive.js"
    text = path.read_text()

    text = text.replace(
        " * motion parallax moves only the ordinary 3D camera; trajectories record\n",
        " * observer-orbit cues move only the ordinary 3D camera; WebXR supplies\n * true head-tracked binocular parallax; trajectories record\n",
    )

    text = replace_once(
        text,
        "  if (!overlay || !xrCanvas) return;\n\n  const ctx = overlay.getContext('2d', { alpha: true, desynchronized: true });",
        "  if (!overlay || !xrCanvas) return;\n\n"
        "  const stereoCanvas = document.createElement('canvas');\n"
        "  stereoCanvas.id = 'stereoLayer';\n"
        "  stereoCanvas.setAttribute('aria-hidden', 'true');\n"
        "  stereoCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;display:none';\n"
        "  overlay.parentNode.insertBefore(stereoCanvas, overlay);\n"
        "  const stereoGl = stereoCanvas.getContext('webgl', { alpha: false, antialias: true, premultipliedAlpha: false });\n\n"
        "  const ctx = overlay.getContext('2d', { alpha: true, desynchronized: true });",
    )

    text = replace_once(
        text,
        "  if (!ctx) return;\n\n  const COLORS = Object.freeze({",
        "  if (!ctx) return;\n"
        "  if (stereoSwap) {\n"
        "    stereoSwap.textContent = 'Cross-eye';\n"
        "    stereoSwap.setAttribute('aria-label', 'Cross-eye stereo');\n"
        "  }\n"
        "  if (parallaxToggle) {\n"
        "    parallaxToggle.textContent = 'Observer orbit';\n"
        "    parallaxToggle.setAttribute('aria-label', 'Observer orbit');\n"
        "  }\n\n"
        "  const COLORS = Object.freeze({",
    )

    text = text.replace(
        "makeCopy('Perspective-camera binocular views of the same 4D→3D projection.'),",
        "makeCopy('Human-eye perspective stereo of the same 4D→3D projection. Cross-eye uses a compact centered pair with fusion markers.'),",
    )
    text = text.replace(
        "makeCopy('Motion parallax changes only the 3D observer. WebXR uses the headset pose and two real eye views.'),",
        "makeCopy('Observer orbit changes only camera orientation. WebXR supplies true head-tracked binocular parallax with two physical eye views.'),",
    )

    stereo_block = r"  function stereoProject\(.*?\n  function clearOverlay\(\) \{"
    replacement = r'''  const STEREO_CAMERA_Z = 9;
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
    const maxPairWidth = swapped ? 720 : 580;
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
          pushStereoVertex(lines, transformed.view[edge.a], rgb, 0.96);
          pushStereoVertex(lines, transformed.view[edge.b], rgb, 0.96);
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

  function clearOverlay() {'''
    text = sub_once(text, stereo_block, replacement, flags=re.S)

    text = replace_once(
        text,
        "    perception.stereo = Boolean(enabled);\n    stereoToggle?.classList.toggle('is-active', perception.stereo);",
        "    perception.stereo = Boolean(enabled);\n"
        "    document.body.classList.toggle('stereo-active', perception.stereo);\n"
        "    if (!perception.stereo) hideStereoLayer();\n"
        "    stereoToggle?.classList.toggle('is-active', perception.stereo);",
    )
    text = text.replace(
        "setStatus(perception.swapped ? 'Cross-eye stereo order.' : 'Parallel stereo order.');",
        "setStatus(perception.swapped\n      ? 'Cross-eye: converge until the two fusion dots become a central third dot.'\n      : 'Parallel stereo: relax focus beyond the screen until the fusion dots merge.');",
    )
    text = text.replace(
        "if (message) setStatus(perception.parallax ? 'Motion parallax moves only the 3D observer.' : 'Motion parallax off.');",
        "if (message) setStatus(perception.parallax ? 'Observer orbit changes only the ordinary 3D camera orientation.' : 'Observer orbit off.');",
    )

    sync_pattern = r"  function syncAvailability\(appState\) \{.*?\n  \}\n\n  function frame\(now\) \{"
    sync_replacement = r'''  function syncAvailability(appState) {
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

  function frame(now) {'''
    text = sub_once(text, sync_pattern, sync_replacement, flags=re.S)

    text = replace_once(
        text,
        "    } else {\n      clearOverlay();",
        "    } else {\n      hideStereoLayer();\n      clearOverlay();",
    )

    path.write_text(text)


def patch_index() -> None:
    path = ROOT / "public/index.html"
    text = path.read_text()
    text = text.replace(
        'title="Move only the ordinary 3D camera with pointer or device orientation">Motion parallax</button>',
        'title="Orbit only the ordinary 3D camera with pointer or device orientation; WebXR provides true translational head parallax">Observer orbit</button>',
    )
    text = text.replace(
        'title="Swap left/right views for cross-eye stereoscopy">Swap eyes</button>',
        'title="Swap eye images and use a compact centered pair for cross-eye stereoscopy">Cross-eye</button>',
    )
    path.write_text(text)


def patch_harmony() -> None:
    path = ROOT / "public/ui-harmony.css"
    text = path.read_text()
    text = text.replace("content: 'Isometric';", "content: 'Isometric orientation';")
    marker = "\n/* Four peer rendering modes read better"
    addition = """

/* Stereo is a focused perceptual mode. Keep the Explorer available, but remove
   unrelated chrome so neither eye image is obscured by decorative/status UI. */
body.stereo-active .brand,
body.stereo-active .dimension-readout,
body.stereo-active .w-semantics-readout,
body.stereo-active .basis-gizmo,
body.stereo-active .hint,
body.stereo-active .source,
body.stereo-active .about-panel,
body.stereo-active .mandala-dock {
  opacity: 0;
  pointer-events: none;
}

body.stereo-active #perceptionOverlay {
  z-index: 3;
}
"""
    if addition.strip() not in text:
        text = text.replace(marker, addition + marker, 1)
    path.write_text(text)


def patch_readme() -> None:
    path = ROOT / "README.md"
    text = path.read_text()
    text = text.replace(
        "Stereo, motion parallax, 4D point trajectories and WebXR are **view modes**",
        "Stereo, observer-orbit cues, 4D point trajectories and WebXR are **view modes**",
    )
    text = text.replace(
        "motion parallax changes only the ordinary 3D camera",
        "observer orbit changes only the ordinary 3D camera orientation",
    )
    path.write_text(text)


def patch_math_tests() -> None:
    path = ROOT / "scripts/verify_math_rigor.py"
    text = path.read_text()
    insertion = r'''

def project_3d(point, mode: str):
    x, y, z = point
    if mode == "orthographic":
        return x, y
    camera_z = 9.0
    factor = camera_z / (camera_z - z)
    return x * factor, y * factor


def check_projection_pipeline() -> None:
    point4 = [1.2, -0.7, 0.4, 2.25]
    camera_w = 9.0
    w_factor = camera_w / (camera_w - point4[3])
    perspective3 = [point4[i] * w_factor for i in range(3)]
    orthographic3 = point4[:3]
    assert perspective3 != orthographic3

    pp = project_3d(perspective3, "perspective")
    po = project_3d(perspective3, "orthographic")
    op = project_3d(orthographic3, "perspective")
    oo = project_3d(orthographic3, "orthographic")
    for pair in (pp, po, op, oo):
        assert all(math.isfinite(value) for value in pair)
    assert pp != po
    assert op != oo
    assert pp != op
    assert po != oo

    # Isometric is an orientation. Equal X/Y/Z foreshortening is exact only
    # when the final 3D→2D stage is orthographic.
    ortho_lengths = []
    perspective_lengths = []
    origin_iso = camera_isometric([0.0, 0.0, 0.0])
    origin_p = project_3d(origin_iso, "perspective")
    for axis in range(3):
        basis = [0.0, 0.0, 0.0]
        basis[axis] = 1.0
        iso = camera_isometric(basis)
        ortho_lengths.append(math.hypot(iso[0], iso[1]))
        p = project_3d(iso, "perspective")
        perspective_lengths.append(math.hypot(p[0] - origin_p[0], p[1] - origin_p[1]))
    assert max(ortho_lengths) - min(ortho_lengths) < 1e-12
    assert max(perspective_lengths) - min(perspective_lengths) > 1e-3


def stereo_x(view_point, eye: float) -> float:
    camera_z = 9.0
    distance = camera_z - view_point[2]
    factor = camera_z / distance
    return (view_point[0] - eye) * factor + eye


def check_stereo_projection() -> None:
    eye = 0.085
    # The chosen convergence/reference plane is Z=0: both eyes project a point
    # there to exactly the same local image coordinate.
    for x in (-1.3, 0.0, 0.8):
        assert abs(stereo_x([x, 0.0, 0.0], -eye) - stereo_x([x, 0.0, 0.0], eye)) < 1e-12

    # Near and far points have opposite disparity signs, as physical stereo
    # requires. Cross-eye mode swaps the two eye images; it does not alter the
    # underlying eye projections.
    near_disparity = stereo_x([0.0, 0.0, 2.0], eye) - stereo_x([0.0, 0.0, 2.0], -eye)
    far_disparity = stereo_x([0.0, 0.0, -2.0], eye) - stereo_x([0.0, 0.0, -2.0], -eye)
    assert near_disparity < 0 < far_disparity
    assert abs(near_disparity) > 1e-4
    assert abs(far_disparity) > 1e-4
'''
    text = replace_once(text, "\ndef check_source_guards() -> None:\n", insertion + "\n\ndef check_source_guards() -> None:\n")
    text = text.replace(
        '        "(viewPoint[0] - eye) * factor + eye",\n',
        '        "(viewPoint[0] - eye) * factor + eye",\n'
        '        "function stereoSafeRect()",\n'
        '        "function stereoLayout(",\n'
        '        "id = \'stereoLayer\'",\n'
        '        "Cross-eye",\n'
        '        "Observer orbit",\n',
    )
    text = text.replace(
        "    for marker in [\n        'id=\"stereoToggle\"',",
        "    assert \"Math.max(0.3, cameraZ - viewPoint[2])\" not in immersive\n"
        "    assert \"const distance = STEREO_CAMERA_Z - viewPoint[2];\" in immersive\n"
        "    for marker in [\n        'id=\"stereoToggle\"',",
    )
    text = text.replace(
        "    check_projective_depth()\n    check_source_guards()",
        "    check_projective_depth()\n    check_projection_pipeline()\n    check_stereo_projection()\n    check_source_guards()",
    )
    path.write_text(text)


def main() -> None:
    patch_immersive()
    patch_index()
    patch_harmony()
    patch_readme()
    patch_math_tests()
    print("Projection/perception audit fixes applied.")


if __name__ == "__main__":
    main()
