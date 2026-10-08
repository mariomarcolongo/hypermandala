from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
app_path = ROOT / 'public' / 'app.js'
immersive_path = ROOT / 'public' / 'immersive.js'
verify_path = ROOT / 'scripts' / 'verify_mobile_xr.py'


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected exactly one anchor, found {count}')
    return text.replace(old, new, 1)


# --- Core 4D control bridge -------------------------------------------------
app = app_path.read_text()

app = replace_once(
    app,
    "      renderMode: state.renderMode,\n      colorMode: state.colorMode,\n      zoom: state.zoom,\n",
    "      renderMode: state.renderMode,\n      colorMode: state.colorMode,\n      insightMode: state.insightMode,\n      wSlice: state.wSlice,\n      wSectionSpace: state.wSectionSpace,\n      wSliceSweep: state.wSliceSweep,\n      wDepthColor: state.wDepthColor,\n      hypercellMode: state.hypercellMode,\n      hypercellIndex: state.hypercellIndex,\n      rotations: { ...state.rotations },\n      auto: { ...state.auto },\n      zoom: state.zoom,\n",
    'public state snapshot',
)

core_controls = r'''

  function vrSetRotation(key, value) {
    if (!Object.hasOwn(state.rotations, key) || state.transition) return null;
    stopAutorotation(key);
    setRotationValue(key, Number(value) || 0);
    markSettingsDirty();
    return state.rotations[key];
  }

  function vrNudgeRotation(key, delta) {
    if (!Object.hasOwn(state.rotations, key)) return null;
    return vrSetRotation(key, state.rotations[key] + (Number(delta) || 0));
  }

  function vrToggleAutorotation(key) {
    if (!Object.hasOwn(state.auto, key) || state.transition) return null;
    state.auto[key] = !state.auto[key];
    const ui = rotationUI[key];
    ui?.auto?.setAttribute('aria-pressed', String(state.auto[key]));
    markSettingsDirty();
    return state.auto[key];
  }

  function vrSetWSlice(value) {
    if (state.transition || state.dimension < 4) return state.wSlice;
    setInsightMode('w-slice');
    state.wSliceSweep = false;
    state.wSlice = clamp(Number(value) || 0, 0, 1);
    if (wSliceInput) wSliceInput.value = String(state.wSlice);
    if (wSliceValue) wSliceValue.textContent = Math.round(state.wSlice * 100) + '%';
    markSettingsDirty();
    updateUI();
    return state.wSlice;
  }

  function vrNudgeWSlice(delta) {
    return vrSetWSlice(state.wSlice + (Number(delta) || 0));
  }

  function vrSetInsightMode(mode) {
    if (state.transition || state.dimension < 4) return state.insightMode;
    setInsightMode(mode);
    updateUI();
    return state.insightMode;
  }

  function vrSetWSectionSpace(space) {
    if (!['intrinsic', 'view'].includes(space)) return state.wSectionSpace;
    state.wSectionSpace = space;
    markSettingsDirty();
    updateUI();
    return state.wSectionSpace;
  }

  function vrToggleWSweep() {
    if (state.dimension < 4 || state.transition) return state.wSliceSweep;
    if (state.insightMode !== 'w-slice') setInsightMode('w-slice');
    state.wSliceSweep = !state.wSliceSweep;
    markSettingsDirty();
    updateUI();
    return state.wSliceSweep;
  }

  function vrToggleWDepth() {
    if (state.dimension < 4 || state.transition) return state.wDepthColor;
    state.wDepthColor = !state.wDepthColor;
    markSettingsDirty();
    updateUI();
    return state.wDepthColor;
  }

  function vrToggleHypercell() {
    if (state.dimension < 4 || state.transition) return state.hypercellMode;
    state.hypercellMode = state.hypercellMode === 'isolate' ? 'all' : 'isolate';
    markSettingsDirty();
    updateUI();
    return state.hypercellMode;
  }

  function vrStepHypercell(direction) {
    if (state.dimension < 4 || state.transition) return state.hypercellIndex;
    const { cells, index } = selectedBoundaryHypercell();
    if (!cells.length) return state.hypercellIndex;
    const delta = Number(direction) < 0 ? -1 : 1;
    state.hypercellMode = 'isolate';
    state.hypercellIndex = (index + delta + cells.length) % cells.length;
    markSettingsDirty();
    updateUI();
    return state.hypercellIndex;
  }

  function vrReset4DControls() {
    for (const config of ROTATION_CONFIG) {
      state.auto[config.key] = false;
      const ui = rotationUI[config.key];
      ui?.auto?.setAttribute('aria-pressed', 'false');
      setRotationValue(config.key, 0);
    }
    state.insightMode = 'standard';
    state.wSlice = 0.5;
    state.wSectionSpace = 'intrinsic';
    state.wSliceSweep = false;
    state.wDepthColor = false;
    state.hypercellMode = 'all';
    state.hypercellIndex = 0;
    if (wSliceInput) wSliceInput.value = '0.5';
    if (wSliceValue) wSliceValue.textContent = '50%';
    insightButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.insight === 'standard');
    });
    markSettingsDirty();
    updateUI();
    return publicStateSnapshot();
  }
'''

app = replace_once(
    app,
    "  function setPerceptionCameraOffset(yaw, pitch) {\n    state.perceptionYaw = clamp(Number(yaw) || 0, -0.16, 0.16);\n    state.perceptionPitch = clamp(Number(pitch) || 0, -0.12, 0.12);\n  }\n\n  // Public read-only geometry bridge for immersive renderers.",
    "  function setPerceptionCameraOffset(yaw, pitch) {\n    state.perceptionYaw = clamp(Number(yaw) || 0, -0.16, 0.16);\n    state.perceptionPitch = clamp(Number(pitch) || 0, -0.12, 0.12);\n  }" + core_controls + "\n  // Public geometry bridge for immersive renderers. Intrinsic mutation is\n  // available only through the narrow vrControls interface below; it reuses\n  // the same state setters and validation path as the visible Explorer UI.",
    'VR core controls',
)

vr_api = r'''    vrControls: Object.freeze({
      setRotation: vrSetRotation,
      nudgeRotation: vrNudgeRotation,
      toggleAutorotation: vrToggleAutorotation,
      setWSlice: vrSetWSlice,
      nudgeWSlice: vrNudgeWSlice,
      setInsightMode: vrSetInsightMode,
      setWSectionSpace: vrSetWSectionSpace,
      toggleWSweep: vrToggleWSweep,
      toggleWDepth: vrToggleWDepth,
      toggleHypercell: vrToggleHypercell,
      stepHypercell: vrStepHypercell,
      setRenderMode,
      setColorMode,
      setProjection,
      setScreenProjection,
      setIsometricView,
      reset4D: vrReset4DControls,
    }),
'''

app = replace_once(
    app,
    "    setPerceptionCameraOffset,\n    regionRgb:",
    "    setPerceptionCameraOffset,\n" + vr_api + "    regionRgb:",
    'VR API exposure',
)
app_path.write_text(app)

# --- Immersive VR menu, world transform, and adaptive quality ---------------
source = immersive_path.read_text()

source = replace_once(
    source,
    "    xrScale: 0.34,\n    lastFrame: performance.now(),\n",
    "    xrScale: 0.34,\n    xrBaseModelMatrix: null,\n    xrUserScale: 1,\n    xrUserOffset: [0, 0, 0],\n    xrUiProgram: null,\n    xrUiBuffer: null,\n    xrUiTexture: null,\n    xrUiLocations: null,\n    xrMenuCanvas: null,\n    xrMenuCtx: null,\n    xrMenuOpen: false,\n    xrMenuPage: 'main',\n    xrMenuModelMatrix: null,\n    xrMenuPlacePending: false,\n    xrMenuTargets: [],\n    xrMenuHover: null,\n    xrMenuDirty: true,\n    xrHoldAction: null,\n    xrHoldStarted: 0,\n    xrHoldLast: 0,\n    xrLastViewerMatrix: null,\n    xrFrameSamples: [],\n    xrLastXRFrameTime: 0,\n    xrLastQualityChange: 0,\n    xrMeasuredFps: 0,\n    lastFrame: performance.now(),\n",
    'VR perception state',
)

helpers = r'''

  function clampXR(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function updateXRModelMatrix() {
    const base = perception.xrBaseModelMatrix;
    if (!base) return false;
    const model = new Float32Array(base);
    const scale = clampXR(perception.xrUserScale, 0.45, 2.2);
    for (const offset of [0, 4, 8]) {
      model[offset] *= scale;
      model[offset + 1] *= scale;
      model[offset + 2] *= scale;
    }
    const [x, y, z] = perception.xrUserOffset;
    model[12] = base[12] + base[0] * x + base[4] * y + base[8] * z;
    model[13] = base[13] + base[1] * x + base[5] * y + base[9] * z;
    model[14] = base[14] + base[2] * x + base[6] * y + base[10] * z;
    perception.xrModelMatrix = model;
    return true;
  }

  function createXRUiProgram(gl) {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, `
      attribute vec2 aPosition;
      attribute vec2 aUv;
      uniform mat4 uProjection;
      uniform mat4 uView;
      uniform mat4 uModel;
      uniform vec2 uSize;
      varying vec2 vUv;
      void main() {
        vec3 local = vec3(aPosition * uSize, 0.0);
        gl_Position = uProjection * uView * uModel * vec4(local, 1.0);
        vUv = aUv;
      }
    `);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform sampler2D uTexture;
      varying vec2 vUv;
      void main() {
        vec4 color = texture2D(uTexture, vUv);
        if (color.a < 0.02) discard;
        gl_FragColor = color;
      }
    `);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'XR UI program link failed');
    }
    return program;
  }

  function initXRMenuResources(gl) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 720;
    const menuCtx = canvas.getContext('2d', { alpha: true });
    if (!menuCtx) throw new Error('2D canvas unavailable for XR menu');

    const program = createXRUiProgram(gl);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -0.5, -0.5, 0, 0,
       0.5, -0.5, 1, 0,
      -0.5,  0.5, 0, 1,
      -0.5,  0.5, 0, 1,
       0.5, -0.5, 1, 0,
       0.5,  0.5, 1, 1,
    ]), gl.STATIC_DRAW);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    perception.xrUiProgram = program;
    perception.xrUiBuffer = buffer;
    perception.xrUiTexture = texture;
    perception.xrUiLocations = {
      position: gl.getAttribLocation(program, 'aPosition'),
      uv: gl.getAttribLocation(program, 'aUv'),
      projection: gl.getUniformLocation(program, 'uProjection'),
      view: gl.getUniformLocation(program, 'uView'),
      model: gl.getUniformLocation(program, 'uModel'),
      size: gl.getUniformLocation(program, 'uSize'),
      texture: gl.getUniformLocation(program, 'uTexture'),
    };
    perception.xrMenuCanvas = canvas;
    perception.xrMenuCtx = menuCtx;
    perception.xrMenuDirty = true;
  }

  function roundedMenuRect(ctx2d, x, y, w, h, radius) {
    const r = Math.min(radius, w * 0.5, h * 0.5);
    ctx2d.beginPath();
    ctx2d.moveTo(x + r, y);
    ctx2d.arcTo(x + w, y, x + w, y + h, r);
    ctx2d.arcTo(x + w, y + h, x, y + h, r);
    ctx2d.arcTo(x, y + h, x, y, r);
    ctx2d.arcTo(x, y, x + w, y, r);
    ctx2d.closePath();
  }

  function addXRMenuTarget(x, y, w, h, label, action, active = false, repeatable = false) {
    const canvas = perception.xrMenuCanvas;
    const ctx2d = perception.xrMenuCtx;
    if (!canvas || !ctx2d) return;
    const hovered = perception.xrMenuHover?.action === action;
    roundedMenuRect(ctx2d, x, y, w, h, 13);
    ctx2d.fillStyle = hovered
      ? 'rgba(242,223,160,.94)'
      : active
        ? 'rgba(92,126,183,.72)'
        : 'rgba(255,255,255,.075)';
    ctx2d.fill();
    ctx2d.strokeStyle = hovered
      ? 'rgba(255,248,222,.98)'
      : active
        ? 'rgba(130,170,235,.9)'
        : 'rgba(255,255,255,.12)';
    ctx2d.lineWidth = hovered ? 3 : 1.5;
    ctx2d.stroke();
    ctx2d.fillStyle = hovered ? '#17191c' : '#f1eee6';
    ctx2d.font = '600 24px system-ui, -apple-system, sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText(label, x + w * 0.5, y + h * 0.5 + 1);
    perception.xrMenuTargets.push({
      x0: x / canvas.width,
      y0: y / canvas.height,
      x1: (x + w) / canvas.width,
      y1: (y + h) / canvas.height,
      action,
      repeatable,
    });
  }

  function paintXRMenu() {
    const canvas = perception.xrMenuCanvas;
    const ctx2d = perception.xrMenuCtx;
    if (!canvas || !ctx2d) return;
    const appState = currentState();
    perception.xrMenuTargets = [];
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);

    roundedMenuRect(ctx2d, 10, 10, canvas.width - 20, canvas.height - 20, 28);
    ctx2d.fillStyle = 'rgba(7,8,10,.94)';
    ctx2d.fill();
    ctx2d.strokeStyle = 'rgba(242,223,160,.32)';
    ctx2d.lineWidth = 2;
    ctx2d.stroke();

    const titleByPage = {
      main: '4D VR controls',
      transform: 'Position & scale',
      rotation: 'Rotation planes',
      w: 'W inspection',
      view: 'View & rendering',
    };
    ctx2d.fillStyle = '#f2dfa0';
    ctx2d.font = '700 30px system-ui, -apple-system, sans-serif';
    ctx2d.textAlign = 'left';
    ctx2d.textBaseline = 'alphabetic';
    ctx2d.fillText(titleByPage[perception.xrMenuPage] || titleByPage.main, 32, 54);
    ctx2d.fillStyle = 'rgba(240,239,233,.58)';
    ctx2d.font = '500 17px system-ui, -apple-system, sans-serif';
    const fps = perception.xrMeasuredFps ? Math.round(perception.xrMeasuredFps) + ' fps' : 'measuring fps';
    ctx2d.fillText(`gaze + trigger · quality ${Math.round(perception.xrFramebufferScale * 100)}% · ${fps}`, 32, 82);

    const full = (y, label, action, active = false, repeatable = false) => {
      addXRMenuTarget(28, y, 456, 58, label, action, active, repeatable);
    };
    const pair = (y, leftLabel, leftAction, rightLabel, rightAction, leftActive = false, rightActive = false) => {
      addXRMenuTarget(28, y, 222, 58, leftLabel, leftAction, leftActive, false);
      addXRMenuTarget(262, y, 222, 58, rightLabel, rightAction, rightActive, false);
    };
    const adjust = (y, label, value, minusAction, plusAction, autoAction = null, autoActive = false) => {
      addXRMenuTarget(28, y, 72, 58, '−', minusAction, false, true);
      roundedMenuRect(ctx2d, 110, y, autoAction ? 224 : 292, 58, 13);
      ctx2d.fillStyle = 'rgba(255,255,255,.045)';
      ctx2d.fill();
      ctx2d.fillStyle = '#f1eee6';
      ctx2d.font = '600 21px system-ui, -apple-system, sans-serif';
      ctx2d.textAlign = 'center';
      ctx2d.textBaseline = 'middle';
      ctx2d.fillText(`${label}  ${value}`, 110 + (autoAction ? 112 : 146), y + 29);
      if (autoAction) addXRMenuTarget(344, y, 58, 58, 'A', autoAction, autoActive, false);
      addXRMenuTarget(412, y, 72, 58, '+', plusAction, false, true);
    };

    if (perception.xrMenuPage === 'main') {
      full(112, 'Position & scale', 'page:transform');
      full(180, '4D rotation planes', 'page:rotation');
      full(248, 'W inspection', 'page:w');
      full(316, 'View & rendering', 'page:view');
      full(402, 'Recenter mandala', 'recenter');
      full(470, 'Reset 4D controls', 'reset4d');
      full(556, 'Close menu', 'close');
    } else if (perception.xrMenuPage === 'transform') {
      adjust(116, 'Scale', `×${perception.xrUserScale.toFixed(2)}`, 'scale:-', 'scale:+');
      adjust(188, 'Horizontal', `${perception.xrUserOffset[0].toFixed(2)} m`, 'move:x:-', 'move:x:+');
      adjust(260, 'Vertical', `${perception.xrUserOffset[1].toFixed(2)} m`, 'move:y:-', 'move:y:+');
      adjust(332, 'Depth', `${perception.xrUserOffset[2].toFixed(2)} m`, 'move:z:-', 'move:z:+');
      full(426, 'Recenter position', 'recenter');
      full(520, 'Back', 'page:main');
    } else if (perception.xrMenuPage === 'rotation') {
      const keys = ['xw', 'yw', 'zw', 'xy', 'xz', 'yz'];
      keys.forEach((key, index) => {
        const angle = Math.round(appState.rotations?.[key] || 0) + '°';
        adjust(
          106 + index * 78,
          key.toUpperCase(),
          angle,
          `rot:${key}:-`,
          `rot:${key}:+`,
          `auto:${key}`,
          Boolean(appState.auto?.[key]),
        );
      });
      full(590, 'Back', 'page:main');
    } else if (perception.xrMenuPage === 'w') {
      adjust(108, 'W slice', `${Math.round((appState.wSlice ?? 0.5) * 100)}%`, 'slice:-', 'slice:+');
      pair(180, 'Standard', 'mode:standard', '3D slice', 'mode:w-slice', appState.insightMode === 'standard', appState.insightMode === 'w-slice');
      pair(248, 'W layers', 'mode:w-layers', 'W color', 'toggle:wcolor', appState.insightMode === 'w-layers', Boolean(appState.wDepthColor));
      pair(316, 'Intrinsic frame', 'frame:intrinsic', 'View frame', 'frame:view', appState.wSectionSpace === 'intrinsic', appState.wSectionSpace === 'view');
      pair(384, 'Sweep W', 'toggle:sweep', 'Hypercells', 'toggle:hypercell', Boolean(appState.wSliceSweep), appState.hypercellMode === 'isolate');
      pair(452, 'Prev cell', 'cell:-', 'Next cell', 'cell:+');
      full(544, 'Back', 'page:main');
    } else if (perception.xrMenuPage === 'view') {
      pair(108, 'Solid', 'render:solid', 'Solid + wire', 'render:solid-edges', appState.renderMode === 'solid', appState.renderMode === 'solid-edges');
      pair(176, 'Wire', 'render:wire', 'X-ray', 'render:xray', appState.renderMode === 'wire', appState.renderMode === 'xray');
      pair(252, 'Classic palette', 'color:classic', 'Axis palette', 'color:axis', appState.colorMode === 'classic', appState.colorMode === 'axis');
      full(320, 'Form palette', 'color:form', appState.colorMode === 'form');
      pair(396, 'W perspective', 'projection:perspective', 'W orthographic', 'projection:orthographic', appState.projection === 'perspective', appState.projection === 'orthographic');
      pair(464, '3D perspective', 'screen:perspective', '3D orthographic', 'screen:orthographic', appState.screenProjection === 'perspective', appState.screenProjection === 'orthographic');
      full(532, 'Isometric orientation', 'toggle:isometric', Boolean(appState.isometricView));
      full(600, 'Back', 'page:main');
    }

    perception.xrMenuDirty = false;
  }

  function placeXRMenuFromPose(pose) {
    const matrix = pose?.transform?.matrix;
    if (!matrix) return false;
    const model = identityXRMatrix();
    model[0] = matrix[0]; model[1] = matrix[1]; model[2] = matrix[2];
    model[4] = matrix[4]; model[5] = matrix[5]; model[6] = matrix[6];
    model[8] = matrix[8]; model[9] = matrix[9]; model[10] = matrix[10];
    const distance = 0.82;
    model[12] = matrix[12] - matrix[8] * distance;
    model[13] = matrix[13] - matrix[9] * distance;
    model[14] = matrix[14] - matrix[10] * distance;
    perception.xrMenuModelMatrix = model;
    perception.xrMenuPlacePending = false;
    perception.xrMenuDirty = true;
    return true;
  }

  function xrMenuTargetFromPose(pose) {
    if (!perception.xrMenuOpen || !perception.xrMenuModelMatrix) return null;
    const head = pose?.transform?.matrix;
    const panel = perception.xrMenuModelMatrix;
    if (!head || !panel) return null;
    const origin = [head[12], head[13], head[14]];
    const direction = [-head[8], -head[9], -head[10]];
    const center = [panel[12], panel[13], panel[14]];
    const normal = [panel[8], panel[9], panel[10]];
    const right = [panel[0], panel[1], panel[2]];
    const up = [panel[4], panel[5], panel[6]];
    const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
    const denom = dot(direction, normal);
    if (Math.abs(denom) < 1e-5) return null;
    const toCenter = [center[0]-origin[0], center[1]-origin[1], center[2]-origin[2]];
    const t = dot(toCenter, normal) / denom;
    if (t <= 0) return null;
    const hit = [
      origin[0] + direction[0] * t,
      origin[1] + direction[1] * t,
      origin[2] + direction[2] * t,
    ];
    const delta = [hit[0]-center[0], hit[1]-center[1], hit[2]-center[2]];
    const width = 0.56;
    const height = 0.78;
    const u = dot(delta, right) / width + 0.5;
    const v = 0.5 - dot(delta, up) / height;
    if (u < 0 || u > 1 || v < 0 || v > 1) return null;
    return perception.xrMenuTargets.find((target) => (
      u >= target.x0 && u <= target.x1 && v >= target.y0 && v <= target.y1
    )) || null;
  }

  function updateXRMenuHover(pose) {
    if (!perception.xrMenuOpen) return;
    if (perception.xrMenuPlacePending || !perception.xrMenuModelMatrix) placeXRMenuFromPose(pose);
    if (perception.xrMenuDirty) paintXRMenu();
    const next = xrMenuTargetFromPose(pose);
    if (next?.action !== perception.xrMenuHover?.action) {
      perception.xrMenuHover = next;
      perception.xrMenuDirty = true;
    }
  }

  function executeXRMenuAction(action) {
    if (!action) return;
    const controls = api.vrControls;
    if (action.startsWith('page:')) {
      perception.xrMenuPage = action.slice(5);
    } else if (action === 'close') {
      perception.xrMenuOpen = false;
      perception.xrMenuHover = null;
      perception.xrHoldAction = null;
      return;
    } else if (action === 'recenter') {
      perception.xrRecenterPending = true;
      perception.xrMenuPlacePending = true;
      perception.xrUserOffset = [0, 0, 0];
    } else if (action === 'reset4d') {
      controls?.reset4D?.();
      perception.xrUserScale = 1;
      perception.xrUserOffset = [0, 0, 0];
      updateXRModelMatrix();
    } else if (action.startsWith('scale:')) {
      const direction = action.endsWith('+') ? 1 : -1;
      perception.xrUserScale = clampXR(perception.xrUserScale + direction * 0.10, 0.45, 2.2);
      updateXRModelMatrix();
    } else if (action.startsWith('move:')) {
      const [, axis, sign] = action.split(':');
      const index = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
      const direction = sign === '+' ? 1 : -1;
      const step = index === 2 ? 0.07 : 0.055;
      perception.xrUserOffset[index] = clampXR(
        perception.xrUserOffset[index] + direction * step,
        index === 2 ? -0.9 : -0.7,
        index === 2 ? 0.9 : 0.7,
      );
      updateXRModelMatrix();
    } else if (action.startsWith('rot:')) {
      const [, key, sign] = action.split(':');
      controls?.nudgeRotation?.(key, sign === '+' ? 4 : -4);
    } else if (action.startsWith('auto:')) {
      controls?.toggleAutorotation?.(action.slice(5));
    } else if (action.startsWith('slice:')) {
      controls?.nudgeWSlice?.(action.endsWith('+') ? 0.025 : -0.025);
    } else if (action.startsWith('mode:')) {
      controls?.setInsightMode?.(action.slice(5));
    } else if (action.startsWith('frame:')) {
      controls?.setWSectionSpace?.(action.slice(6));
    } else if (action === 'toggle:sweep') {
      controls?.toggleWSweep?.();
    } else if (action === 'toggle:wcolor') {
      controls?.toggleWDepth?.();
    } else if (action === 'toggle:hypercell') {
      controls?.toggleHypercell?.();
    } else if (action.startsWith('cell:')) {
      controls?.stepHypercell?.(action.endsWith('+') ? 1 : -1);
    } else if (action.startsWith('render:')) {
      controls?.setRenderMode?.(action.slice(7));
    } else if (action.startsWith('color:')) {
      controls?.setColorMode?.(action.slice(6));
    } else if (action.startsWith('projection:')) {
      controls?.setProjection?.(action.slice(11));
    } else if (action.startsWith('screen:')) {
      controls?.setScreenProjection?.(action.slice(7));
    } else if (action === 'toggle:isometric') {
      controls?.setIsometricView?.(!currentState().isometricView);
    }
    perception.xrMenuDirty = true;
  }

  function updateXRHoldAction(time) {
    const action = perception.xrHoldAction;
    if (!action) return;
    if (time - perception.xrHoldStarted < 330) return;
    if (time - perception.xrHoldLast < 90) return;
    perception.xrHoldLast = time;
    executeXRMenuAction(action);
  }

  function onXRSelectStart() {
    const target = perception.xrMenuOpen ? perception.xrMenuHover : null;
    if (!target?.repeatable) return;
    perception.xrHoldAction = target.action;
    perception.xrHoldStarted = performance.now();
    perception.xrHoldLast = 0;
  }

  function onXRSelectEnd() {
    perception.xrHoldAction = null;
  }

  function onXRSelect() {
    if (!perception.xrMenuOpen) {
      perception.xrMenuOpen = true;
      perception.xrMenuPage = 'main';
      perception.xrMenuPlacePending = true;
      perception.xrMenuDirty = true;
      return;
    }
    executeXRMenuAction(perception.xrMenuHover?.action);
  }

  function drawXRMenu(gl, view) {
    if (!perception.xrMenuOpen || !perception.xrMenuModelMatrix || !perception.xrUiProgram) return;
    if (perception.xrMenuDirty) paintXRMenu();
    gl.useProgram(perception.xrUiProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, perception.xrUiBuffer);
    const stride = 4 * 4;
    gl.enableVertexAttribArray(perception.xrUiLocations.position);
    gl.vertexAttribPointer(perception.xrUiLocations.position, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(perception.xrUiLocations.uv);
    gl.vertexAttribPointer(perception.xrUiLocations.uv, 2, gl.FLOAT, false, stride, 2 * 4);
    gl.uniformMatrix4fv(perception.xrUiLocations.projection, false, view.projectionMatrix);
    gl.uniformMatrix4fv(perception.xrUiLocations.view, false, view.transform.inverse.matrix);
    gl.uniformMatrix4fv(perception.xrUiLocations.model, false, perception.xrMenuModelMatrix);
    gl.uniform2f(perception.xrUiLocations.size, 0.56, 0.78);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, perception.xrUiTexture);
    if (perception.xrMenuDirty) paintXRMenu();
    if (perception.xrMenuCanvas) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, perception.xrMenuCanvas);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    }
    gl.uniform1i(perception.xrUiLocations.texture, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
  }

  function updateXRAdaptiveQuality(time, session, gl) {
    if (!perception.xrMobile || !gl) return;
    if (perception.xrLastXRFrameTime > 0) {
      const dt = time - perception.xrLastXRFrameTime;
      if (dt > 4 && dt < 100) {
        perception.xrFrameSamples.push(dt);
        if (perception.xrFrameSamples.length > 120) perception.xrFrameSamples.shift();
        const average = perception.xrFrameSamples.reduce((sum, value) => sum + value, 0) / perception.xrFrameSamples.length;
        perception.xrMeasuredFps = 1000 / average;
      }
    }
    perception.xrLastXRFrameTime = time;
    if (perception.xrFrameSamples.length < 50 || time - perception.xrLastQualityChange < 3000) return;
    const average = perception.xrFrameSamples.reduce((sum, value) => sum + value, 0) / perception.xrFrameSamples.length;
    const targetHz = Number(session.frameRate) > 20 ? Number(session.frameRate) : 60;
    const targetMs = 1000 / targetHz;
    let next = perception.xrFramebufferScale;
    if (average > targetMs * 1.18) next -= 0.06;
    else if (average < targetMs * 1.05) next += 0.03;
    next = clampXR(next, 0.46, 0.74);
    if (Math.abs(next - perception.xrFramebufferScale) < 0.025) return;
    perception.xrFramebufferScale = Number(next.toFixed(2));
    perception.xrLastQualityChange = time;
    perception.xrFrameSamples.length = 0;
    perception.xrMenuDirty = true;
    session.updateRenderState({
      baseLayer: new XRWebGLLayer(session, gl, {
        antialias: false,
        framebufferScaleFactor: perception.xrFramebufferScale,
      }),
    });
  }
'''

source = replace_once(
    source,
    "  function recenterXRFromPose(pose) {",
    helpers + "\n\n  function recenterXRFromPose(pose) {",
    'XR helpers',
)

source = replace_once(
    source,
    "    perception.xrModelMatrix = model;\n    perception.xrRecenterPending = false;\n    return true;\n",
    "    perception.xrBaseModelMatrix = model;\n    perception.xrUserOffset = [0, 0, 0];\n    updateXRModelMatrix();\n    perception.xrRecenterPending = false;\n    return true;\n",
    'XR recenter model composition',
)

source = replace_once(
    source,
    "    const pose = frame.getViewerPose(perception.xrReferenceSpace);\n    if (!pose) return;\n\n    if (perception.xrRecenterPending || !perception.xrModelMatrix) recenterXRFromPose(pose);\n\n    const appState = currentState();",
    "    const pose = frame.getViewerPose(perception.xrReferenceSpace);\n    if (!pose) return;\n    perception.xrLastViewerMatrix = new Float32Array(pose.transform.matrix);\n\n    if (perception.xrRecenterPending || !perception.xrModelMatrix) recenterXRFromPose(pose);\n    updateXRMenuHover(pose);\n    updateXRHoldAction(time);\n\n    const appState = currentState();",
    'XR frame menu update',
)

source = replace_once(
    source,
    "    const gl = perception.xrGl;\n    const layer = session.renderState.baseLayer;\n    if (!gl || !layer || !perception.xrModelMatrix) return;\n",
    "    const gl = perception.xrGl;\n    if (!gl || !perception.xrModelMatrix) return;\n    updateXRAdaptiveQuality(time, session, gl);\n    const layer = session.renderState.baseLayer;\n    if (!layer) return;\n",
    'adaptive XR quality',
)

source = replace_once(
    source,
    "    const geometryInterval = perception.xrMobile ? 33 : 0;",
    "    const geometryInterval = perception.xrMobile\n      ? (perception.xrFramebufferScale <= 0.52 ? 50 : 33)\n      : 0;",
    'adaptive geometry interval',
)

source = replace_once(
    source,
    "    gl.useProgram(perception.xrProgram);\n    gl.uniformMatrix4fv(perception.xrLocations.model, false, perception.xrModelMatrix);\n\n    for (const view of pose.views) {\n      const viewport = layer.getViewport(view);",
    "    for (const view of pose.views) {\n      const viewport = layer.getViewport(view);\n      gl.useProgram(perception.xrProgram);\n      gl.uniformMatrix4fv(perception.xrLocations.model, false, perception.xrModelMatrix);",
    'XR per-eye program binding',
)

source = replace_once(
    source,
    "      gl.disable(gl.BLEND);\n      gl.depthMask(true);\n    }\n  }\n\n  async function startXR() {",
    "      gl.disable(gl.BLEND);\n      gl.depthMask(true);\n      drawXRMenu(gl, view);\n    }\n  }\n\n  async function startXR() {",
    'XR menu draw',
)

source = replace_once(
    source,
    "      perception.xrLocations = {\n        position: gl.getAttribLocation(program, 'aPosition'),\n        color: gl.getAttribLocation(program, 'aColor'),\n        projection: gl.getUniformLocation(program, 'uProjection'),\n        view: gl.getUniformLocation(program, 'uView'),\n        model: gl.getUniformLocation(program, 'uModel'),\n      };\n      perception.xrFramebufferScale = perception.xrMobile ? 0.68 : 0.90;",
    "      perception.xrLocations = {\n        position: gl.getAttribLocation(program, 'aPosition'),\n        color: gl.getAttribLocation(program, 'aColor'),\n        projection: gl.getUniformLocation(program, 'uProjection'),\n        view: gl.getUniformLocation(program, 'uView'),\n        model: gl.getUniformLocation(program, 'uModel'),\n      };\n      initXRMenuResources(gl);\n      perception.xrFramebufferScale = perception.xrMobile ? 0.68 : 0.90;",
    'XR menu resource init',
)

source = replace_once(
    source,
    "      perception.xrModelMatrix = null;\n      perception.xrRecenterPending = true;\n\n      // Cardboard-style viewers commonly expose a single select action.  Use it\n      // as a recenter command so the user can recover the mandala without exiting VR.\n      session.addEventListener('select', () => {\n        perception.xrRecenterPending = true;\n      });\n",
    "      perception.xrModelMatrix = null;\n      perception.xrBaseModelMatrix = null;\n      perception.xrUserScale = 1;\n      perception.xrUserOffset = [0, 0, 0];\n      perception.xrRecenterPending = true;\n      perception.xrMenuOpen = true;\n      perception.xrMenuPage = 'main';\n      perception.xrMenuModelMatrix = null;\n      perception.xrMenuPlacePending = true;\n      perception.xrMenuHover = null;\n      perception.xrMenuDirty = true;\n      perception.xrHoldAction = null;\n      perception.xrFrameSamples = [];\n      perception.xrLastXRFrameTime = 0;\n      perception.xrLastQualityChange = 0;\n      perception.xrMeasuredFps = 0;\n\n      // One-button/Cardboard interaction: gaze at an in-world control and use\n      // the primary trigger. Holding +/- repeats adjustments continuously.\n      session.addEventListener('selectstart', onXRSelectStart);\n      session.addEventListener('selectend', onXRSelectEnd);\n      session.addEventListener('select', onXRSelect);\n",
    'XR select interaction',
)

source = replace_once(
    source,
    "        perception.xrGeometryKey = '';\n        perception.xrModelMatrix = null;\n        perception.xrRecenterPending = true;\n",
    "        perception.xrGeometryKey = '';\n        perception.xrModelMatrix = null;\n        perception.xrBaseModelMatrix = null;\n        perception.xrRecenterPending = true;\n        perception.xrMenuOpen = false;\n        perception.xrMenuModelMatrix = null;\n        perception.xrMenuHover = null;\n        perception.xrHoldAction = null;\n        perception.xrUiProgram = null;\n        perception.xrUiBuffer = null;\n        perception.xrUiTexture = null;\n        perception.xrUiLocations = null;\n        perception.xrMenuCanvas = null;\n        perception.xrMenuCtx = null;\n",
    'XR cleanup',
)

source = replace_once(
    source,
    "          ? 'VR fitted the mandala in front of you. Tap the viewer trigger to recenter.'\n          : 'VR fitted the projected 4D form in front of you; use the primary select action to recenter.',",
    "          ? 'VR controls are open. Look at a control and use the viewer trigger; hold +/- for continuous adjustment.'\n          : 'VR controls are open. Gaze at a control and use primary select; hold +/- to adjust continuously.',",
    'XR status copy',
)

source = replace_once(
    source,
    "      geometryKey: perception.xrGeometryKey,\n      scale: perception.xrScale,\n    }),\n",
    "      geometryKey: perception.xrGeometryKey,\n      scale: perception.xrScale,\n      objectScale: perception.xrUserScale,\n      objectOffset: [...perception.xrUserOffset],\n      menuOpen: perception.xrMenuOpen,\n      menuPage: perception.xrMenuPage,\n      menuHover: perception.xrMenuHover?.action || null,\n      measuredFps: perception.xrMeasuredFps,\n    }),\n    xrMenuState: () => ({\n      open: perception.xrMenuOpen,\n      page: perception.xrMenuPage,\n      targetCount: perception.xrMenuTargets.length,\n      hover: perception.xrMenuHover?.action || null,\n    }),\n    xrExecuteControl: (action) => {\n      executeXRMenuAction(action);\n      return { state: currentState(), runtime: {\n        scale: perception.xrUserScale,\n        offset: [...perception.xrUserOffset],\n        menuPage: perception.xrMenuPage,\n      } };\n    },\n",
    'XR debug controls',
)

immersive_path.write_text(source)

# --- Permanent static guards ------------------------------------------------
verify = verify_path.read_text()
verify = replace_once(
    verify,
    "    \"session.addEventListener('select', () => {\",\n    \"perception.xrRecenterPending = true;\",\n",
    "    \"session.addEventListener('selectstart', onXRSelectStart);\",\n    \"session.addEventListener('selectend', onXRSelectEnd);\",\n    \"session.addEventListener('select', onXRSelect);\",\n    \"function executeXRMenuAction(action)\",\n    \"function drawXRMenu(gl, view)\",\n    \"function updateXRAdaptiveQuality(time, session, gl)\",\n    \"perception.xrRecenterPending = true;\",\n",
    'mobile XR required interaction markers',
)
verify = replace_once(
    verify,
    "    \"xrRecenterForMatrix: (matrix) =>\",\n]",
    "    \"xrRecenterForMatrix: (matrix) =>\",\n    \"xrExecuteControl: (action) =>\",\n    \"api.vrControls\",\n    \"rot:${key}:-\",\n    \"mode:w-slice\",\n    \"frame:intrinsic\",\n    \"toggle:hypercell\",\n    \"render:solid-edges\",\n    \"projection:orthographic\",\n    \"screen:orthographic\",\n]\n\napp_source = (ROOT / 'public' / 'app.js').read_text()\nfor marker in [\n    \"vrControls: Object.freeze({\",\n    \"nudgeRotation: vrNudgeRotation\",\n    \"nudgeWSlice: vrNudgeWSlice\",\n    \"toggleAutorotation: vrToggleAutorotation\",\n    \"toggleWDepth: vrToggleWDepth\",\n    \"toggleHypercell: vrToggleHypercell\",\n    \"stepHypercell: vrStepHypercell\",\n    \"reset4D: vrReset4DControls\",\n    \"rotations: { ...state.rotations }\",\n    \"wSlice: state.wSlice\",\n]:\n    assert marker in app_source, marker",
    'mobile XR core API guards',
)
verify_path.write_text(verify)

print('VR interaction migration applied.')
