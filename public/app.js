/*
 * Hypermandala — dimensional mandala explorer.
 * 2D plans unfold into hierarchy-aware 3D forms and semantic 4D projections.
 *
 * Independent implementation inspired by the interaction model of
 * Tarek Sherif's Tesseract Explorer (MIT):
 * https://github.com/tsherif/tesseract-explorer
 *
 * Copyright (C) 2026 Mario Marcolongo and contributors.
 * Licensed under GNU AGPL v3 or later. See ../LICENSE.
 */

(() => {
  'use strict';

  const solidCanvas = document.getElementById('solidLayer');
  const canvas = document.getElementById('mandala');
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  const gl = solidCanvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
  });
  const basisCanvas = document.getElementById('basisCanvas');
  const basisCtx = basisCanvas.getContext('2d');
  const previewCanvases = {
    square: document.getElementById('previewSquare'),
    sriyantra: document.getElementById('previewSriYantra'),
    kaliyantra: document.getElementById('previewKaliYantra'),
    matangiyantra: document.getElementById('previewMatangiYantra'),
    hex: document.getElementById('previewHex'),
    stupa: document.getElementById('previewStupa'),
    borobudur: document.getElementById('previewBorobudur'),
    castel: document.getElementById('previewCastel'),
    kukulkan: document.getElementById('previewKukulkan'),
    lalibela: document.getElementById('previewLalibela'),
  };

  const dimensionValue = document.getElementById('dimensionValue');
  const dimensionStatus = document.getElementById('dimensionStatus');
  const hint = document.getElementById('hint');
  const resetAllButton = document.getElementById('resetAll');
  const geometricFormsDock = document.getElementById('geometricFormsDock');
  const toggleGeometricForms = document.getElementById('toggleGeometricForms');
  const explorerControls = document.getElementById('explorerControls');
  const mobileFormsButton = document.getElementById('mobileFormsButton');
  const mobileControlsButton = document.getElementById('mobileControlsButton');
  const mobileFormsClose = document.getElementById('mobileFormsClose');
  const mobileControlsClose = document.getElementById('mobileControlsClose');

  const dimensionButtons = [...document.querySelectorAll('[data-dimension]')];
  const projectionButtons = [...document.querySelectorAll('[data-projection]')];
  const colorButtons = [...document.querySelectorAll('[data-color]')];
  const renderButtons = [...document.querySelectorAll('[data-render]')];
  const presetButtons = [...document.querySelectorAll('[data-preset]')];
  const complexityButtons = [...document.querySelectorAll('[data-complexity]')];
  const spacingButtons = [...document.querySelectorAll('[data-spacing]')];
  const zLiftButtons = [...document.querySelectorAll('[data-zlift]')];

  const rotationRows = document.getElementById('rotationRows');
  const scaleRows = document.getElementById('scaleRows');

  const TAU = Math.PI * 2;
  const RAD = Math.PI / 180;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileLayoutQuery = matchMedia('(max-width: 760px)');
  const coarsePointerQuery = matchMedia('(pointer: coarse)');
  const activePointers = new Map();
  let primaryPointerId = null;
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  let mobilePanel = 'forms';
  let previewResizeFrame = 0;

  const COLORS = {
    form: '#e7ddc6',
    neutral: '#f2eee5',
    x: '#ff6b6b',
    y: '#62d48b',
    z: '#6ca8ff',
    w: '#f0c45c',
  };

  const TIBETAN_COLORS = {
    center: '#f4efe1',
    east: '#315db5',
    south: '#d8ae35',
    west: '#b64238',
    north: '#31906a',
  };

  const HEX_COLORS_OUTER_TO_INNER = [
    '#3f52a3',
    '#168c80',
    '#d7a33b',
    '#b94336',
  ];

  const HEX_CENTER = '#f2dfa0';
  const HEX_SATELLITE = '#2f8b6f';
  const HEX_OUTER_SATELLITE = '#9f405b';

  const STUPA_COLORS_OUTER_TO_INNER = [
    '#9b6a42',
    '#c58a3e',
    '#d9aa4b',
    '#e5c676',
    '#eee1b5',
    '#d2a642',
  ];

  const BOROBUDUR_SQUARE_COLORS = [
    '#5d605d',
    '#696c68',
    '#767873',
    '#85857d',
    '#96938a',
  ];

  const BOROBUDUR_CIRCLE_COLORS = [
    '#a39e93',
    '#b1aa9c',
    '#c0b7a5',
  ];

  const BOROBUDUR_STUPA_COLORS = [
    '#b8b09f',
    '#c5bcaa',
    '#d2c7b1',
  ];

  const BOROBUDUR_CENTER = '#d7bd78';

  const CASTEL_COLORS = {
    wall: '#d5c39d',
    inner: '#bba47e',
    tower: '#a88e68',
    accent: '#b96855',
  };

  const KUKULKAN_COLORS = [
    '#b9aa83',
    '#c5b58b',
    '#d0c095',
    '#dacba5',
    '#e5d8b8',
  ];

  const LALIBELA_COLORS = {
    court: '#6e4a3d',
    body: '#9a6049',
    roof: '#b87958',
    center: '#d1a27d',
  };

  const SRI_COLORS = {
    bhupura: '#d4a843',
    lotus16: '#d895a5',
    lotus8: '#efe0ad',
    shiva: '#4669ad',
    shakti: '#c94b40',
    bindu: '#b92f2f',
  };

  const KALI_COLORS = {
    bhupura: '#3b2527',
    lotus: '#b7444b',
    triangle: '#25171a',
    triangleAlt: '#7f252d',
    bindu: '#d8ad4d',
  };

  const MATANGI_COLORS = {
    bhupura: '#5d6840',
    lotus: '#d7839e',
    shiva: '#b99948',
    shakti: '#3e7655',
    bindu: '#d7aa3b',
  };

  const CLASSIC_SHADE = {
    x: 0.93,
    y: 0.98,
    z: 1.08,
    w: 0.86,
    n: 1.00,
  };

  const ROTATION_CONFIG = [
    { key: 'xw', label: 'XW', a: 0, b: 3, minDim: 4, color: COLORS.w },
    { key: 'yw', label: 'YW', a: 1, b: 3, minDim: 4, color: COLORS.w },
    { key: 'zw', label: 'ZW', a: 2, b: 3, minDim: 4, color: COLORS.w },
    { key: 'xy', label: 'XY', a: 0, b: 1, minDim: 2, color: '#d8dbe0' },
    { key: 'xz', label: 'XZ', a: 0, b: 2, minDim: 3, color: COLORS.z },
    { key: 'yz', label: 'YZ', a: 1, b: 2, minDim: 3, color: COLORS.z },
  ];

  const SCALE_CONFIG = [
    { key: 'x', label: 'X', minDim: 2, color: COLORS.x },
    { key: 'y', label: 'Y', minDim: 2, color: COLORS.y },
    { key: 'z', label: 'Z', minDim: 3, color: COLORS.z },
    { key: 'w', label: 'W', minDim: 4, color: COLORS.w },
  ];

  const PRESET_META = {
    square: {
      kind: 'symmetric',
      plan: 'square mandala',
      spatial: 'hierarchical mandala',
    },
    sriyantra: {
      kind: 'symmetric',
      plan: 'Sri Yantra plan',
      spatial: 'Sri Yantra hierarchy',
    },
    kaliyantra: {
      kind: 'symmetric',
      plan: 'Kali Yantra plan',
      spatial: 'Kali Yantra hierarchy',
    },
    matangiyantra: {
      kind: 'symmetric',
      plan: 'Matangi Yantra plan',
      spatial: 'Matangi Yantra hierarchy',
    },
    hex: {
      kind: 'symmetric',
      plan: 'hexagonal mandala',
      spatial: 'hierarchical hex mandala',
    },
    stupa: {
      kind: 'architecture',
      plan: 'stupa geometric plan',
      spatial: 'stupa architecture',
    },
    borobudur: {
      kind: 'architecture',
      plan: 'Borobudur geometric plan',
      spatial: 'Borobudur architecture',
    },
    castel: {
      kind: 'architecture',
      plan: 'octagonal castle plan',
      spatial: 'Castel del Monte form',
    },
    kukulkan: {
      kind: 'architecture',
      plan: 'step-pyramid plan',
      spatial: 'Kukulcán pyramid form',
    },
    lalibela: {
      kind: 'architecture',
      plan: 'cruciform rock-hewn plan',
      spatial: 'Bete Giyorgis form',
    },
  };

  const state = {
    dimension: 2,
    requestedDimension: 2,
    queue: [],
    transition: null,
    zMix: 0,
    wMix: 0,

    preset: 'square',
    complexity: 'complex',
    spacingStyle: 'compact',
    zLiftStyle: 'hierarchy',

    projection: 'perspective',
    colorMode: 'classic',
    renderMode: 'solid',

    rotations: { xw: 0, yw: 0, zw: 0, xy: 0, xz: 0, yz: 0 },
    auto: { xw: false, yw: false, zw: false, xy: false, xz: false, yz: false },
    scales: { x: 1, y: 1, z: 1, w: 1 },

    cameraYaw: -0.62,
    cameraPitch: 0.58,
    zoom: 1,

    pointerDown: false,
    pointerX: 0,
    pointerY: 0,

    width: innerWidth,
    height: innerHeight,
    viewBottomInset: 0,
    viewTopInset: 0,
    dpr: 1,
    lastTime: performance.now(),
    transitionDirection: 0,
  };

  const SETTINGS_KEY = 'hypermandala-settings-v2';
  let settingsDirty = false;
  let lastSettingsSave = 0;
  let restoredDockCollapsed = false;

  function finiteNumber(value, fallback, min = -Infinity, max = Infinity) {
    return Number.isFinite(value)
      ? clamp(value, min, max)
      : fallback;
  }

  function markSettingsDirty() {
    settingsDirty = true;
  }

  function exportedSettings() {
    return {
      version: 2,
      preset: state.preset,
      complexity: state.complexity,
      spacingStyle: state.spacingStyle,
      zLiftStyle: state.zLiftStyle,
      dimension: state.dimension,
      projection: state.projection,
      colorMode: state.colorMode,
      renderMode: state.renderMode,
      rotations: { ...state.rotations },
      auto: { ...state.auto },
      scales: { ...state.scales },
      zoom: state.zoom,
      cameraYaw: state.cameraYaw,
      cameraPitch: state.cameraPitch,
      formsCollapsed: Boolean(
        geometricFormsDock?.classList.contains('is-collapsed'),
      ),
    };
  }

  function persistSettings(force = false) {
    if (typeof localStorage === 'undefined') return;

    const now = Date.now();
    if (!force && (!settingsDirty || now - lastSettingsSave < 350)) {
      return;
    }

    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(exportedSettings()),
      );
      settingsDirty = false;
      lastSettingsSave = now;
    } catch (error) {
      // Storage may be unavailable in private/restricted contexts.
    }
  }

  function restoreSettings() {
    if (typeof localStorage === 'undefined') return false;

    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    } catch (error) {
      return false;
    }

    if (!saved || typeof saved !== 'object') return false;

    // Migrate the former generic Yantra preset to the specific Sri Yantra.
    if (saved.preset === 'yantra') saved.preset = 'sriyantra';

    if (Object.hasOwn(PRESET_META, saved.preset)) {
      state.preset = saved.preset;
    }

    if (['simple', 'complex'].includes(saved.complexity)) {
      state.complexity = saved.complexity;
    }
    if (['compact', 'separated'].includes(saved.spacingStyle)) {
      state.spacingStyle = saved.spacingStyle;
    }
    if (['hierarchy', 'mirror'].includes(saved.zLiftStyle)) {
      state.zLiftStyle = saved.zLiftStyle;
    }

    const dimension = Number(saved.dimension);
    if ([2,3,4].includes(dimension)) {
      state.dimension = dimension;
      state.requestedDimension = dimension;
      state.zMix = dimension >= 3 ? 1 : 0;
      state.wMix = dimension >= 4 ? 1 : 0;
    }

    if (['perspective', 'orthographic', 'isometric'].includes(saved.projection)) {
      state.projection = saved.projection;
    }
    if (['form', 'axis', 'classic'].includes(saved.colorMode)) {
      state.colorMode = saved.colorMode;
    }
    if (['wire', 'solid', 'solid-edges'].includes(saved.renderMode)) {
      state.renderMode = saved.renderMode;
    }

    for (const config of ROTATION_CONFIG) {
      const value = saved.rotations?.[config.key];
      if (Number.isFinite(value)) {
        state.rotations[config.key] = finiteNumber(value, 0, -180, 180);
      }
      if (typeof saved.auto?.[config.key] === 'boolean') {
        state.auto[config.key] = saved.auto[config.key];
      }
    }

    for (const config of SCALE_CONFIG) {
      const value = saved.scales?.[config.key];
      if (Number.isFinite(value)) {
        state.scales[config.key] = finiteNumber(value, 1, 0, 1.4);
      }
    }

    state.zoom = finiteNumber(saved.zoom, 1, 0.55, 1.9);
    state.cameraYaw = finiteNumber(saved.cameraYaw, -0.62, -Math.PI, Math.PI);
    state.cameraPitch = finiteNumber(saved.cameraPitch, 0.58, -Math.PI / 2, Math.PI / 2);
    restoredDockCollapsed = saved.formsCollapsed === true;

    state.queue = [];
    state.transition = null;
    state.transitionDirection = 0;
    return true;
  }

  function syncSettingsUI() {
    presetButtons.forEach((button) => {
      button.classList.toggle(
        'is-active',
        button.dataset.preset === state.preset,
      );
    });
    complexityButtons.forEach((button) => {
      button.classList.toggle(
        'is-active',
        button.dataset.complexity === state.complexity,
      );
    });
    spacingButtons.forEach((button) => {
      button.classList.toggle(
        'is-active',
        button.dataset.spacing === state.spacingStyle,
      );
    });
    zLiftButtons.forEach((button) => {
      button.classList.toggle(
        'is-active',
        button.dataset.zlift === state.zLiftStyle,
      );
    });
    projectionButtons.forEach((button) => {
      button.classList.toggle(
        'is-active',
        button.dataset.projection === state.projection,
      );
    });
    colorButtons.forEach((button) => {
      button.classList.toggle(
        'is-active',
        button.dataset.color === state.colorMode,
      );
    });
    renderButtons.forEach((button) => {
      button.classList.toggle(
        'is-active',
        button.dataset.render === state.renderMode,
      );
    });

    for (const config of ROTATION_CONFIG) {
      const ui = rotationUI[config.key];
      if (!ui) continue;
      ui.input.value = String(state.rotations[config.key]);
      ui.value.textContent = Math.round(state.rotations[config.key]) + '°';
      ui.auto.setAttribute(
        'aria-pressed',
        String(state.auto[config.key]),
      );
    }

    for (const config of SCALE_CONFIG) {
      const ui = scaleUI[config.key];
      if (!ui) continue;
      ui.input.value = String(state.scales[config.key]);
      ui.value.textContent = '×' + state.scales[config.key].toFixed(2);
    }

    geometricFormsDock?.classList.toggle(
      'is-collapsed',
      restoredDockCollapsed,
    );
    if (toggleGeometricForms) {
      toggleGeometricForms.setAttribute(
        'aria-expanded',
        String(!restoredDockCollapsed),
      );
      toggleGeometricForms.title = restoredDockCollapsed
        ? 'Expand geometric forms'
        : 'Collapse geometric forms';
    }
  }

  const modules = [];
  const planEdges = [];
  const planFaces = [];
  const planEdgeKeys = new Set();
  const planFaceKeys = new Set();
  const rotationUI = {};
  const scaleUI = {};
  const geometryStats = {
    maxPlanRadius: 1,
    centerZ: 0,
    centerW: 0,
  };

  function compileGlShader(type, source) {
    if (!gl) return null;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('Hypermandala solid shader failed:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createSolidRenderer() {
    if (!gl) return null;

    const vertexShader = compileGlShader(gl.VERTEX_SHADER, `#version 300 es
      in vec3 aPosition;
      in vec4 aColor;
      out vec4 vColor;
      void main() {
        gl_Position = vec4(aPosition, 1.0);
        vColor = aColor;
      }
    `);

    const fragmentShader = compileGlShader(gl.FRAGMENT_SHADER, `#version 300 es
      precision highp float;
      in vec4 vColor;
      out vec4 outColor;
      void main() {
        outColor = vColor;
      }
    `);

    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Hypermandala solid program failed:', gl.getProgramInfoLog(program));
      return null;
    }

    const buffer = gl.createBuffer();
    return {
      program,
      buffer,
      aPosition: gl.getAttribLocation(program, 'aPosition'),
      aColor: gl.getAttribLocation(program, 'aColor'),
    };
  }

  const solidRenderer = createSolidRenderer();

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const smoother = (t) => {
    t = clamp(t, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  };

  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const value = Number.parseInt(clean, 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    };
  }

  function rgbCss(rgb) {
    return 'rgb('
      + Math.round(rgb.r) + ' '
      + Math.round(rgb.g) + ' '
      + Math.round(rgb.b) + ')';
  }

  function mixRgb(a, b, t) {
    return {
      r: a.r + (b.r - a.r) * t,
      g: a.g + (b.g - a.g) * t,
      b: a.b + (b.b - a.b) * t,
    };
  }

  function shadeRgb(rgb, factor) {
    return {
      r: clamp(rgb.r * factor, 0, 255),
      g: clamp(rgb.g * factor, 0, 255),
      b: clamp(rgb.b * factor, 0, 255),
    };
  }

  

  function hexLayerRgb(index) {
    return hexToRgb(
      HEX_COLORS_OUTER_TO_INNER[
        Math.min(index, HEX_COLORS_OUTER_TO_INNER.length - 1)
      ],
    );
  }

  function squareRegionId(x, y) {
    const radius = Math.hypot(x, y);
    if (radius < 0.12) return 'square-center';

    if (Math.abs(y) >= Math.abs(x)) {
      return y >= 0 ? 'square-east' : 'square-west';
    }
    return x < 0 ? 'square-south' : 'square-north';
  }

  function classicRegionRgb(regionId, fallbackX = 0, fallbackY = 0) {
    if (regionId === 'square-center') return hexToRgb(TIBETAN_COLORS.center);
    if (regionId === 'square-east') return hexToRgb(TIBETAN_COLORS.east);
    if (regionId === 'square-south') return hexToRgb(TIBETAN_COLORS.south);
    if (regionId === 'square-west') return hexToRgb(TIBETAN_COLORS.west);
    if (regionId === 'square-north') return hexToRgb(TIBETAN_COLORS.north);

    if (regionId === 'sri-bhupura') return hexToRgb(SRI_COLORS.bhupura);
    if (regionId === 'sri-lotus16') return hexToRgb(SRI_COLORS.lotus16);
    if (regionId === 'sri-lotus8') return hexToRgb(SRI_COLORS.lotus8);
    if (regionId?.startsWith('sri-shiva-')) return hexToRgb(SRI_COLORS.shiva);
    if (regionId?.startsWith('sri-shakti-')) return hexToRgb(SRI_COLORS.shakti);
    if (regionId === 'sri-bindu') return hexToRgb(SRI_COLORS.bindu);

    if (regionId === 'kali-bhupura') return hexToRgb(KALI_COLORS.bhupura);
    if (regionId === 'kali-lotus') return hexToRgb(KALI_COLORS.lotus);
    if (regionId?.startsWith('kali-triangle-')) {
      const index = Number(regionId.split('-')[2]);
      return hexToRgb(index % 2 ? KALI_COLORS.triangleAlt : KALI_COLORS.triangle);
    }
    if (regionId === 'kali-bindu') return hexToRgb(KALI_COLORS.bindu);

    if (regionId === 'matangi-bhupura') return hexToRgb(MATANGI_COLORS.bhupura);
    if (regionId === 'matangi-lotus') return hexToRgb(MATANGI_COLORS.lotus);
    if (regionId === 'matangi-shiva') return hexToRgb(MATANGI_COLORS.shiva);
    if (regionId === 'matangi-shakti') return hexToRgb(MATANGI_COLORS.shakti);
    if (regionId === 'matangi-bindu') return hexToRgb(MATANGI_COLORS.bindu);

    if (regionId === 'hex-center') return hexToRgb(HEX_CENTER);
    if (regionId === 'hex-satellite') return hexToRgb(HEX_SATELLITE);
    if (regionId === 'hex-outer-satellite') {
      return hexToRgb(HEX_OUTER_SATELLITE);
    }
    if (regionId?.startsWith('hex-layer-')) {
      const parts = regionId.split('-');
      const index = Number(parts[2]);
      return hexLayerRgb(index);
    }

    if (regionId === 'stupa-center') {
      return hexToRgb(STUPA_COLORS_OUTER_TO_INNER[
        STUPA_COLORS_OUTER_TO_INNER.length - 1
      ]);
    }
    if (regionId?.startsWith('stupa-layer-')) {
      const parts = regionId.split('-');
      const index = Number(parts[2]);
      return hexToRgb(
        STUPA_COLORS_OUTER_TO_INNER[
          Math.min(index, STUPA_COLORS_OUTER_TO_INNER.length - 2)
        ],
      );
    }

    if (regionId === 'borobudur-center') return hexToRgb(BOROBUDUR_CENTER);
    if (regionId?.startsWith('borobudur-square-')) {
      const index = Number(regionId.split('-')[2]);
      return hexToRgb(
        BOROBUDUR_SQUARE_COLORS[
          Math.min(index, BOROBUDUR_SQUARE_COLORS.length - 1)
        ],
      );
    }
    if (regionId?.startsWith('borobudur-circle-')) {
      const index = Number(regionId.split('-')[2]);
      return hexToRgb(
        BOROBUDUR_CIRCLE_COLORS[
          Math.min(index, BOROBUDUR_CIRCLE_COLORS.length - 1)
        ],
      );
    }
    if (regionId?.startsWith('borobudur-stupa-')) {
      const index = Number(regionId.split('-')[2]);
      return hexToRgb(
        BOROBUDUR_STUPA_COLORS[
          Math.min(index, BOROBUDUR_STUPA_COLORS.length - 1)
        ],
      );
    }

    if (regionId === 'castel-wall') return hexToRgb(CASTEL_COLORS.wall);
    if (regionId === 'castel-inner') return hexToRgb(CASTEL_COLORS.inner);
    if (regionId === 'castel-tower') return hexToRgb(CASTEL_COLORS.tower);
    if (regionId === 'castel-accent') return hexToRgb(CASTEL_COLORS.accent);

    if (regionId?.startsWith('kukulkan-level-')) {
      const index = Number(regionId.split('-')[2]);
      return hexToRgb(
        KUKULKAN_COLORS[Math.min(index, KUKULKAN_COLORS.length - 1)],
      );
    }
    if (regionId === 'kukulkan-stair') return hexToRgb('#8f7d5e');
    if (regionId === 'kukulkan-temple') return hexToRgb('#eee1bd');

    if (regionId === 'lalibela-court') return hexToRgb(LALIBELA_COLORS.court);
    if (regionId === 'lalibela-body') return hexToRgb(LALIBELA_COLORS.body);
    if (regionId === 'lalibela-roof') return hexToRgb(LALIBELA_COLORS.roof);
    if (regionId === 'lalibela-center') return hexToRgb(LALIBELA_COLORS.center);

    if (regionId?.startsWith('square-ring-')) {
      const index = Number(regionId.split('-')[2]);
      return hexToRgb(['#d1af49','#4968aa','#c94b40','#f0e4c2'][index % 4]);
    }
    if (regionId?.startsWith('square-gate-')) {
      const direction = regionId.slice('square-gate-'.length);
      return classicRegionRgb('square-' + direction, fallbackX, fallbackY);
    }

    // Fallback is only for legacy/unclassified geometry.
    return classicRegionRgb(squareRegionId(fallbackX, fallbackY));
  }

  function updateGeometryStats() {
    let maxRadius = 0.001;
    let minZ = Infinity;
    let maxZ = -Infinity;
    let minW = Infinity;
    let maxW = -Infinity;

    for (const module of modules) {
      for (const point of module.vertices) {
        maxRadius = Math.max(maxRadius, Math.hypot(point[0], point[1]));
        minZ = Math.min(minZ, point[2]);
        maxZ = Math.max(maxZ, point[2]);
        minW = Math.min(minW, point[3]);
        maxW = Math.max(maxW, point[3]);
      }
    }

    geometryStats.maxPlanRadius = maxRadius;
    geometryStats.centerZ = Number.isFinite(minZ) && Number.isFinite(maxZ)
      ? (minZ + maxZ) * 0.5
      : 0;
    geometryStats.centerW = Number.isFinite(minW) && Number.isFinite(maxW)
      ? (minW + maxW) * 0.5
      : 0;
  }

  function rotateXYPoint(x, y, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [x * c - y * s, x * s + y * c];
  }

  function addPlanEdge(a, b, axis, regionId = 'unclassified') {
    const p1 = [Number(a[0].toFixed(4)), Number(a[1].toFixed(4))];
    const p2 = [Number(b[0].toFixed(4)), Number(b[1].toFixed(4))];
    const first = p1[0] < p2[0] || (p1[0] === p2[0] && p1[1] <= p2[1]) ? p1 : p2;
    const second = first === p1 ? p2 : p1;
    const key = first.join(',') + '|' + second.join(',');
    if (planEdgeKeys.has(key)) return;
    planEdgeKeys.add(key);
    planEdges.push({
      a: [first[0], first[1], 0, 0],
      b: [second[0], second[1], 0, 0],
      axis,
      regionId,
    });
  }

  function addPlanFace(
    points,
    regionId = 'unclassified',
    paintOrder = 0,
  ) {
    const normalized = points.map((p) => [
      Number(p[0].toFixed(4)),
      Number(p[1].toFixed(4)),
    ]);
    const sorted = [...normalized]
      .map((p) => p.join(','))
      .sort()
      .join('|');

    if (planFaceKeys.has(sorted)) return;
    planFaceKeys.add(sorted);

    const face = normalized.map((p) => [p[0], p[1], 0, 0]);
    face.regionId = regionId;
    face.paintOrder = paintOrder;
    planFaces.push(face);
  }

  function regionPolarity(regionId) {
    if (regionId?.startsWith('sri-shiva-')) return 1;
    if (regionId?.startsWith('sri-shakti-')) return -1;
    if (regionId === 'matangi-shiva') return 1;
    if (regionId === 'matangi-shakti') return -1;

    if (regionId?.startsWith('kali-triangle-')) return -1;

    return 0;
  }

  function isCentralRegion(regionId) {
    return (
      regionId?.includes('bindu')
      || regionId?.endsWith('-center')
      || regionId === 'square-center'
      || regionId === 'borobudur-center'
      || regionId === 'stupa-center'
      || regionId === 'kukulkan-temple'
      || regionId === 'lalibela-center'
    );
  }

  function fourthDimensionProfile(
    vertices3,
    baseHalf,
    regionId,
    liftMeta = null,
  ) {
    const meta = PRESET_META[state.preset] || PRESET_META.square;

    const centroid = vertices3.reduce(
      (sum, p) => [
        sum[0] + p[0],
        sum[1] + p[1],
        sum[2] + p[2],
      ],
      [0,0,0],
    ).map((value) => value / vertices3.length);

    const z = centroid[2];
    const central = isCentralRegion(regionId);

    if (meta.kind === 'architecture') {
      const upward = clamp(Math.max(0, z) / 1.55, 0, 1);
      const centerBoost = central ? 1.28 : 1;
      return {
        center: 0,
        half: Math.max(
          0.035,
          baseHalf * (0.52 + upward * 0.58) * centerBoost,
        ),
        kind: 'architectural-hierarchy',
      };
    }

    // For free geometric forms, Z already carries the single outer→inner
    // ascent. W gets a different semantic role: polarity/duality where
    // present, and hierarchy-dependent extent otherwise.
    const hierarchy = clamp(
      liftMeta?.hierarchyT
        ?? ((z + 1.2) / 2.4),
      0,
      1,
    );
    const polarity = liftMeta?.polarity ?? regionPolarity(regionId);

    // Separation is strongest in the middle of the journey and converges
    // again at outer boundary and final center/bindu.
    const envelope = Math.sin(Math.PI * hierarchy);
    const center = central
      ? 0
      : polarity * 0.32 * envelope;

    const extentShape =
      0.42
      + 0.42 * envelope
      + (central ? 0.32 : 0);

    const half = Math.max(
      central ? 0.08 : 0.025,
      baseHalf * extentShape,
    );

    return {
      center,
      half,
      hierarchy,
      polarity,
      kind: polarity
        ? 'polarity-convergence'
        : 'hierarchy-extent',
    };
  }

  function extrudeTo4D(
    vertices3,
    edges3,
    faces3,
    wHalf,
    footprint,
    planExtra = [],
    regionId = 'unclassified',
    liftMeta = null,
  ) {
    const wProfile = fourthDimensionProfile(
      vertices3,
      wHalf,
      regionId,
      liftMeta,
    );

    const vertices = [];
    for (const w of [
      wProfile.center - wProfile.half,
      wProfile.center + wProfile.half,
    ]) {
      for (const p of vertices3) vertices.push([p[0], p[1], p[2], w]);
    }

    const n = vertices3.length;
    const edges = [];
    const faces = [];

    for (let layer = 0; layer < 2; layer += 1) {
      const offset = layer * n;
      for (const edge of edges3) {
        edges.push({
          a: edge.a + offset,
          b: edge.b + offset,
          axis: edge.axis,
          detail: Boolean(edge.detail),
          wLayer: layer === 0 ? -1 : 1,
        });
      }
      for (const face of faces3) {
        faces.push({
          indices: face.indices.map((index) => index + offset),
          axis: face.axis || 'n',
          wLayer: layer === 0 ? -1 : 1,
          bridge: false,
        });
      }
    }

    for (let i = 0; i < n; i += 1) {
      edges.push({ a: i, b: i + n, axis: 'w', wLayer: 0 });
    }

    for (const edge of edges3) {
      faces.push({
        indices: [edge.a, edge.b, edge.b + n, edge.a + n],
        axis: 'w',
        wLayer: 0,
        bridge: true,
        detailBridge: Boolean(edge.detail),
      });
    }

    modules.push({
      vertices,
      edges,
      faces,
      regionId,
      wProfile,
    });
  }

  function cubeData(cx, cy, baseZ, size, rotation = 0) {
    const h = size / 2;
    const vertices3 = [];

    for (let zBit = 0; zBit < 2; zBit += 1) {
      for (let yBit = 0; yBit < 2; yBit += 1) {
        for (let xBit = 0; xBit < 2; xBit += 1) {
          let x = xBit ? h : -h;
          let y = yBit ? h : -h;
          [x, y] = rotateXYPoint(x, y, rotation);
          vertices3.push([cx + x, cy + y, baseZ + zBit * size]);
        }
      }
    }

    const edges3 = [];
    for (let i = 0; i < 8; i += 1) {
      for (let axis = 0; axis < 3; axis += 1) {
        const j = i ^ (1 << axis);
        if (i < j) {
          edges3.push({
            a: i,
            b: j,
            axis: axis === 0 ? 'x' : axis === 1 ? 'y' : 'z',
          });
        }
      }
    }

    const faces3 = [
      { indices: [0,2,6,4], axis: 'x' },
      { indices: [1,5,7,3], axis: 'x' },
      { indices: [0,4,5,1], axis: 'y' },
      { indices: [2,3,7,6], axis: 'y' },
      { indices: [0,1,3,2], axis: 'z' },
      { indices: [4,6,7,5], axis: 'z' },
    ];

    const footprint = [
      [-h,-h], [h,-h], [h,h], [-h,h],
    ].map(([x, y]) => {
      const p = rotateXYPoint(x, y, rotation);
      return [cx + p[0], cy + p[1]];
    });

    return { vertices3, edges3, faces3, footprint };
  }

  function addCube(cx, cy, baseZ, size, rotation = 0, regionId = 'unclassified') {
    const data = cubeData(cx, cy, baseZ, size, rotation);
    extrudeTo4D(
      data.vertices3,
      data.edges3,
      data.faces3,
      size * 0.5,
      data.footprint,
      [],
      regionId,
    );
  }

  function addCenteredCube(
    cx,
    cy,
    centerZ,
    size,
    rotation = 0,
    regionId = 'unclassified',
  ) {
    addCube(
      cx,
      cy,
      centerZ - size / 2,
      size,
      rotation,
      regionId,
    );
  }

  function polygonFootprint(cx, cy, radius, sides, rotation = 0) {
    return Array.from({ length: sides }, (_, i) => {
      const angle = rotation + (i / sides) * TAU;
      return [
        cx + Math.cos(angle) * radius,
        cy + Math.sin(angle) * radius,
      ];
    });
  }

  function prismData(cx, cy, baseZ, radius, sides, height, rotation = 0) {
    const footprint = polygonFootprint(cx, cy, radius, sides, rotation);
    const vertices3 = [
      ...footprint.map(([x, y]) => [x, y, baseZ]),
      ...footprint.map(([x, y]) => [x, y, baseZ + height]),
    ];

    const edges3 = [];
    const faces3 = [];

    for (let i = 0; i < sides; i += 1) {
      const next = (i + 1) % sides;
      edges3.push({ a: i, b: next, axis: 'n' });
      edges3.push({ a: i + sides, b: next + sides, axis: 'n' });
      edges3.push({ a: i, b: i + sides, axis: 'z' });
      faces3.push({
        indices: [i, next, next + sides, i + sides],
        axis: 'n',
      });
    }

    faces3.push({
      indices: Array.from({ length: sides }, (_, i) => sides - 1 - i),
      axis: 'z',
    });
    faces3.push({
      indices: Array.from({ length: sides }, (_, i) => i + sides),
      axis: 'z',
    });

    return { vertices3, edges3, faces3, footprint };
  }

  function addPrism(
    cx,
    cy,
    baseZ,
    radius,
    sides,
    height,
    rotation = 0,
    regionId = 'unclassified',
    liftMeta = null,
  ) {
    const data = prismData(cx, cy, baseZ, radius, sides, height, rotation);
    const center = [cx, cy];
    const spokes = data.footprint.map((point) => [point, center]);

    extrudeTo4D(
      data.vertices3,
      data.edges3,
      data.faces3,
      radius * 0.34,
      data.footprint,
      spokes,
      regionId,
      liftMeta,
    );
  }

  function addCenteredPrism(
    cx,
    cy,
    centerZ,
    radius,
    sides,
    height,
    rotation = 0,
    regionId = 'unclassified',
    liftMeta = null,
  ) {
    addPrism(
      cx,
      cy,
      centerZ - height / 2,
      radius,
      sides,
      height,
      rotation,
      regionId,
      liftMeta,
    );
  }

  function pyramidData(cx, cy, baseZ, radius, sides, height, rotation = 0) {
    const footprint = polygonFootprint(cx, cy, radius, sides, rotation);
    const vertices3 = [
      ...footprint.map(([x, y]) => [x, y, baseZ]),
      [cx, cy, baseZ + height],
    ];
    const apex = sides;
    const edges3 = [];
    const faces3 = [];

    for (let i = 0; i < sides; i += 1) {
      const next = (i + 1) % sides;
      edges3.push({ a: i, b: next, axis: 'n' });
      edges3.push({ a: i, b: apex, axis: 'n' });
      faces3.push({ indices: [i, next, apex], axis: 'n' });
    }

    faces3.push({
      indices: Array.from({ length: sides }, (_, i) => sides - 1 - i),
      axis: 'z',
    });

    return { vertices3, edges3, faces3, footprint };
  }

  function addPolygonPyramid(
    cx,
    cy,
    baseZ,
    radius,
    sides,
    height,
    rotation = 0,
    regionId = 'unclassified',
  ) {
    const data = pyramidData(cx, cy, baseZ, radius, sides, height, rotation);
    const center = [cx, cy];
    const spokes = data.footprint.map((point) => [point, center]);

    extrudeTo4D(
      data.vertices3,
      data.edges3,
      data.faces3,
      radius * 0.34,
      data.footprint,
      spokes,
      regionId,
    );
  }

  function addPyramid(
    cx,
    cy,
    baseZ,
    size,
    height,
    rotation = 0,
    regionId = 'unclassified',
  ) {
    const radius = size / Math.sqrt(2);
    addPolygonPyramid(
      cx,
      cy,
      baseZ,
      radius,
      4,
      height,
      rotation + Math.PI / 4,
      regionId,
    );
  }

  function addBipyramid(
    cx,
    cy,
    centerZ,
    radius,
    sides,
    height,
    rotation = 0,
    regionId = 'unclassified',
  ) {
    const footprint = polygonFootprint(cx, cy, radius, sides, rotation);
    const vertices3 = [
      ...footprint.map(([x, y]) => [x, y, centerZ]),
      [cx, cy, centerZ + height],
      [cx, cy, centerZ - height],
    ];

    const upper = sides;
    const lower = sides + 1;
    const edges3 = [];
    const faces3 = [];

    for (let i = 0; i < sides; i += 1) {
      const next = (i + 1) % sides;
      edges3.push({ a: i, b: next, axis: 'n' });
      edges3.push({ a: i, b: upper, axis: 'n' });
      edges3.push({ a: i, b: lower, axis: 'n' });

      faces3.push({ indices: [i, next, upper], axis: 'n' });
      faces3.push({ indices: [next, i, lower], axis: 'n' });
    }

    const center = [cx, cy];
    const spokes = footprint.map((point) => [point, center]);

    extrudeTo4D(
      vertices3,
      edges3,
      faces3,
      radius * 0.34,
      footprint,
      spokes,
      regionId,
    );
  }

  function addSquareBipyramid(
    cx,
    cy,
    centerZ,
    size,
    height,
    rotation = 0,
    regionId = 'unclassified',
  ) {
    addBipyramid(
      cx,
      cy,
      centerZ,
      size / Math.sqrt(2),
      4,
      height,
      rotation + Math.PI / 4,
      regionId,
    );
  }

  function resetGeometry() {
    modules.length = 0;
    planEdges.length = 0;
    planFaces.length = 0;
    planEdgeKeys.clear();
    planFaceKeys.clear();
  }

  function symmetryCoord(value) {
    if (Math.abs(value) < 1e-8) return 0;
    return Math.round(value * 100000) / 100000;
  }


  function clearPlan() {
    planEdges.length = 0;
    planFaces.length = 0;
    planEdgeKeys.clear();
    planFaceKeys.clear();
  }

  function addPlanLoop(
    points,
    fill = true,
    regionId = 'unclassified',
    paintOrder = 0,
  ) {
    if (fill) addPlanFace(points, regionId, paintOrder);
    for (let i = 0; i < points.length; i += 1) {
      addPlanEdge(points[i], points[(i + 1) % points.length], 'n', regionId);
    }
  }

  function addPlanRegularPolygon(
    cx,
    cy,
    radius,
    sides,
    rotation = 0,
    fill = true,
    regionId = 'unclassified',
    paintOrder = 0,
  ) {
    const points = polygonFootprint(cx, cy, radius, sides, rotation);
    addPlanLoop(points, fill, regionId, paintOrder);
  }

  function addPlanSquareCell(
    cx,
    cy,
    size,
    rotation = 0,
    fill = true,
    regionId = 'unclassified',
    paintOrder = 0,
  ) {
    const h = size / 2;
    const points = [
      [-h,-h], [h,-h], [h,h], [-h,h],
    ].map(([x, y]) => {
      const rotated = rotateXYPoint(x, y, rotation);
      return [cx + rotated[0], cy + rotated[1]];
    });
    addPlanLoop(points, fill, regionId, paintOrder);
  }

  function rectFootprint(
    cx,
    cy,
    width,
    height,
    rotation = 0,
  ) {
    const hw = width / 2;
    const hh = height / 2;
    return [
      [-hw,-hh], [hw,-hh], [hw,hh], [-hw,hh],
    ].map(([x, y]) => {
      const p = rotateXYPoint(x, y, rotation);
      return [cx + p[0], cy + p[1]];
    });
  }

  function addPlanRect(
    cx,
    cy,
    width,
    height,
    rotation = 0,
    fill = true,
    regionId = 'unclassified',
    paintOrder = 0,
  ) {
    addPlanLoop(
      rectFootprint(cx, cy, width, height, rotation),
      fill,
      regionId,
      paintOrder,
    );
  }

  function yantraSubdivisionSource(piece) {
    return (
      piece.regionId?.startsWith('sri-shiva-')
      || piece.regionId?.startsWith('sri-shakti-')
      || piece.regionId?.startsWith('kali-triangle-')
      || piece.regionId === 'matangi-shiva'
      || piece.regionId === 'matangi-shakti'
    );
  }

  function segmentIntersection2D(a, b, c, d, epsilon = 1e-8) {
    const rx = b[0] - a[0];
    const ry = b[1] - a[1];
    const sx = d[0] - c[0];
    const sy = d[1] - c[1];
    const denom = rx * sy - ry * sx;

    if (Math.abs(denom) < epsilon) return null;

    const qx = c[0] - a[0];
    const qy = c[1] - a[1];
    const t = (qx * sy - qy * sx) / denom;
    const u = (qx * ry - qy * rx) / denom;

    if (
      t < -epsilon || t > 1 + epsilon
      || u < -epsilon || u > 1 + epsilon
    ) return null;

    return {
      t: clamp(t, 0, 1),
      u: clamp(u, 0, 1),
      point: [
        a[0] + rx * clamp(t, 0, 1),
        a[1] + ry * clamp(t, 0, 1),
      ],
    };
  }

  function splitSegmentsAtIntersections(segments) {
    const parameters = segments.map(() => [0, 1]);

    for (let i = 0; i < segments.length; i += 1) {
      for (let j = i + 1; j < segments.length; j += 1) {
        const hit = segmentIntersection2D(
          segments[i][0], segments[i][1],
          segments[j][0], segments[j][1],
        );
        if (!hit) continue;
        parameters[i].push(hit.t);
        parameters[j].push(hit.u);
      }
    }

    const result = [];
    const seen = new Set();

    segments.forEach((segment, index) => {
      const [a, b] = segment;
      const ts = [...new Set(
        parameters[index].map((t) => Number(t.toFixed(8))),
      )].sort((x, y) => x - y);

      for (let i = 0; i < ts.length - 1; i += 1) {
        const t0 = ts[i];
        const t1 = ts[i + 1];
        if (t1 - t0 < 1e-7) continue;

        const p0 = [
          a[0] + (b[0] - a[0]) * t0,
          a[1] + (b[1] - a[1]) * t0,
        ];
        const p1 = [
          a[0] + (b[0] - a[0]) * t1,
          a[1] + (b[1] - a[1]) * t1,
        ];

        const k0 = p0.map((v) => v.toFixed(5)).join(',');
        const k1 = p1.map((v) => v.toFixed(5)).join(',');
        const key = k0 < k1 ? k0 + '|' + k1 : k1 + '|' + k0;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push([p0, p1]);
      }
    });

    return result;
  }

  function pointInConvexPolygon(point, polygon, epsilon = 1e-7) {
    let sign = 0;

    for (let i = 0; i < polygon.length; i += 1) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      const cross =
        (b[0] - a[0]) * (point[1] - a[1])
        - (b[1] - a[1]) * (point[0] - a[0]);

      if (Math.abs(cross) <= epsilon) continue;
      const nextSign = Math.sign(cross);
      if (!sign) sign = nextSign;
      else if (sign !== nextSign) return false;
    }

    return true;
  }

  function clipSegmentToConvexPolygon(segment, polygon) {
    const [a, b] = segment;
    const ts = [0, 1];

    for (let i = 0; i < polygon.length; i += 1) {
      const c = polygon[i];
      const d = polygon[(i + 1) % polygon.length];
      const hit = segmentIntersection2D(a, b, c, d);
      if (hit) ts.push(hit.t);
    }

    const sorted = [...new Set(
      ts.map((t) => Number(t.toFixed(8))),
    )].sort((x, y) => x - y);

    const clipped = [];
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const t0 = sorted[i];
      const t1 = sorted[i + 1];
      if (t1 - t0 < 1e-7) continue;
      const tm = (t0 + t1) * 0.5;
      const mid = [
        a[0] + (b[0] - a[0]) * tm,
        a[1] + (b[1] - a[1]) * tm,
      ];
      if (!pointInConvexPolygon(mid, polygon)) continue;

      clipped.push([
        [
          a[0] + (b[0] - a[0]) * t0,
          a[1] + (b[1] - a[1]) * t0,
        ],
        [
          a[0] + (b[0] - a[0]) * t1,
          a[1] + (b[1] - a[1]) * t1,
        ],
      ]);
    }

    return clipped;
  }

  function pointOnSegment2D(point, a, b, epsilon = 1e-6) {
    const cross =
      (b[0] - a[0]) * (point[1] - a[1])
      - (b[1] - a[1]) * (point[0] - a[0]);
    if (Math.abs(cross) > epsilon) return false;

    const dot =
      (point[0] - a[0]) * (point[0] - b[0])
      + (point[1] - a[1]) * (point[1] - b[1]);
    return dot <= epsilon;
  }

  function segmentOnPolygonBoundary(segment, polygon) {
    return polygon.some((a, index) => {
      const b = polygon[(index + 1) % polygon.length];
      return (
        pointOnSegment2D(segment[0], a, b)
        && pointOnSegment2D(segment[1], a, b)
      );
    });
  }

  function yantraSubdivisionNetwork(pieces) {
    const sources = pieces.filter(yantraSubdivisionSource);
    const raw = [];

    for (const piece of sources) {
      for (let i = 0; i < piece.points.length; i += 1) {
        raw.push([
          piece.points[i],
          piece.points[(i + 1) % piece.points.length],
        ]);
      }
    }

    return splitSegmentsAtIntersections(raw);
  }

  function detailSegmentsForPiece(piece, network) {
    const result = [];
    const seen = new Set();

    for (const segment of network) {
      for (const clipped of clipSegmentToConvexPolygon(
        segment,
        piece.points,
      )) {
        if (segmentOnPolygonBoundary(clipped, piece.points)) continue;

        const length = Math.hypot(
          clipped[1][0] - clipped[0][0],
          clipped[1][1] - clipped[0][1],
        );
        if (length < 0.012) continue;

        const k0 = clipped[0].map((v) => v.toFixed(5)).join(',');
        const k1 = clipped[1].map((v) => v.toFixed(5)).join(',');
        const key = k0 < k1 ? k0 + '|' + k1 : k1 + '|' + k0;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(clipped);
      }
    }

    return result;
  }

  function addPlanDetailEdge(a, b) {
    planEdges.push({
      a: [a[0], a[1], 0, 0],
      b: [b[0], b[1], 0, 0],
      axis: 'n',
      detail: true,
    });
  }

  function footprintPrismData(
    points,
    baseZ,
    height,
    detailSegments = [],
  ) {
    const footprint = points.map((p) => [p[0], p[1]]);
    const n = footprint.length;
    const vertices3 = [
      ...footprint.map(([x, y]) => [x, y, baseZ]),
      ...footprint.map(([x, y]) => [x, y, baseZ + height]),
    ];
    const edges3 = [];
    const faces3 = [];

    for (let i = 0; i < n; i += 1) {
      const next = (i + 1) % n;
      edges3.push({ a: i, b: next, axis: 'n' });
      edges3.push({ a: i + n, b: next + n, axis: 'n' });
      edges3.push({ a: i, b: i + n, axis: 'z' });
      faces3.push({
        indices: [i, next, next + n, i + n],
        axis: 'n',
      });
    }

    faces3.push({
      indices: Array.from({ length: n }, (_, i) => n - 1 - i),
      axis: 'z',
    });
    faces3.push({
      indices: Array.from({ length: n }, (_, i) => i + n),
      axis: 'z',
    });

    // Preserve the 2D subdivision network as actual surface edges.
    // They are not internal walls in 3D; they are structural lines on the
    // lower/upper surfaces. In 4D they also generate W bridge ribbons,
    // so complexity survives the dimensional lift.
    for (const [a, b] of detailSegments) {
      const base = vertices3.length;
      vertices3.push(
        [a[0], a[1], baseZ],
        [b[0], b[1], baseZ],
        [a[0], a[1], baseZ + height],
        [b[0], b[1], baseZ + height],
      );
      edges3.push(
        { a: base, b: base + 1, axis: 'n', detail: true },
        { a: base + 2, b: base + 3, axis: 'n', detail: true },
      );
    }

    return { vertices3, edges3, faces3, footprint };
  }

  function addFootprintPrism(
    points,
    baseZ,
    height,
    regionId = 'unclassified',
    detailSegments = [],
    liftMeta = null,
  ) {
    const data = footprintPrismData(
      points,
      baseZ,
      height,
      detailSegments,
    );
    const cx = points.reduce((sum, p) => sum + p[0], 0) / points.length;
    const cy = points.reduce((sum, p) => sum + p[1], 0) / points.length;
    const localRadius = Math.max(
      0.08,
      ...points.map((p) => Math.hypot(p[0] - cx, p[1] - cy)),
    );

    extrudeTo4D(
      data.vertices3,
      data.edges3,
      data.faces3,
      localRadius * 0.34,
      data.footprint,
      [],
      regionId,
      liftMeta,
    );
  }

  function addFootprintPrismCentered(
    points,
    centerZ,
    height,
    regionId = 'unclassified',
    detailSegments = [],
    liftMeta = null,
  ) {
    addFootprintPrism(
      points,
      centerZ - height / 2,
      height,
      regionId,
      detailSegments,
      liftMeta,
    );
  }

  function addRectPrismBase(
    cx,
    cy,
    width,
    height2D,
    baseZ,
    height3D,
    rotation,
    regionId,
  ) {
    addFootprintPrism(
      rectFootprint(cx, cy, width, height2D, rotation),
      baseZ,
      height3D,
      regionId,
    );
  }

  function addRectPrismCentered(
    cx,
    cy,
    width,
    height2D,
    centerZ,
    height3D,
    rotation,
    regionId,
  ) {
    addFootprintPrismCentered(
      rectFootprint(cx, cy, width, height2D, rotation),
      centerZ,
      height3D,
      regionId,
    );
  }

  function polygonRingSectors(
    outerRadius,
    innerRadius,
    sides,
    rotation = 0,
  ) {
    const outer = polygonFootprint(0, 0, outerRadius, sides, rotation);
    const inner = polygonFootprint(0, 0, innerRadius, sides, rotation);
    return outer.map((point, i) => {
      const next = (i + 1) % sides;
      return [
        point,
        outer[next],
        inner[next],
        inner[i],
      ];
    });
  }

  function addPlanPoint(
    cx,
    cy,
    radius = 0.026,
    regionId = 'unclassified',
    paintOrder = 100,
  ) {
    addPlanRegularPolygon(
      cx,
      cy,
      radius,
      12,
      0,
      true,
      regionId,
      paintOrder,
    );
  }

  function squareComplexPieces() {
    const pieces = [];

    const addFrame = (size, thickness, level, order) => {
      const side = size - thickness;
      pieces.push(
        {
          points: rectFootprint(0, side / 2, size, thickness, 0),
          regionId: 'square-gate-east',
          level,
          paintOrder: order,
        },
        {
          points: rectFootprint(0, -side / 2, size, thickness, 0),
          regionId: 'square-gate-west',
          level,
          paintOrder: order,
        },
        {
          points: rectFootprint(-side / 2, 0, thickness, size - 2 * thickness, 0),
          regionId: 'square-gate-south',
          level,
          paintOrder: order,
        },
        {
          points: rectFootprint(side / 2, 0, thickness, size - 2 * thickness, 0),
          regionId: 'square-gate-north',
          level,
          paintOrder: order,
        },
      );
    };

    addFrame(2.46, 0.18, 0, 0);

    const gateOffset = 1.31;
    pieces.push(
      {
        points: rectFootprint(0, gateOffset, 0.62, 0.34, 0),
        regionId: 'square-gate-east',
        level: 0,
        paintOrder: 1,
      },
      {
        points: rectFootprint(0, -gateOffset, 0.62, 0.34, 0),
        regionId: 'square-gate-west',
        level: 0,
        paintOrder: 1,
      },
      {
        points: rectFootprint(-gateOffset, 0, 0.34, 0.62, 0),
        regionId: 'square-gate-south',
        level: 0,
        paintOrder: 1,
      },
      {
        points: rectFootprint(gateOffset, 0, 0.34, 0.62, 0),
        regionId: 'square-gate-north',
        level: 0,
        paintOrder: 1,
      },
    );

    addFrame(1.72, 0.14, 1, 5);

    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const cx = sx * 0.66;
        const cy = sy * 0.66;
        pieces.push({
          points: rectFootprint(cx, cy, 0.30, 0.30, Math.PI / 4),
          regionId: squareRegionId(cx, cy),
          level: 2,
          paintOrder: 10,
        });
      }
    }

    pieces.push(
      {
        points: rectFootprint(0, 0, 1.12, 1.12, 0),
        regionId: 'square-center',
        level: 3,
        paintOrder: 20,
      },
      {
        points: rectFootprint(0, 0, 0.78, 0.78, Math.PI / 4),
        regionId: 'square-center',
        level: 4,
        paintOrder: 30,
      },
      {
        points: rectFootprint(0, 0, 0.42, 0.42, 0),
        regionId: 'square-center',
        level: 5,
        paintOrder: 40,
      },
    );

    return pieces;
  }

  function buildSquareComplexPlan() {
    clearPlan();
    for (const piece of squareComplexPieces()) {
      addPlanLoop(
        piece.points,
        true,
        piece.regionId,
        piece.paintOrder,
      );
    }
  }

  function squareSimplePieces() {
    const size = 0.34;
    const spacing = size;
    const pieces = [];

    for (const [gx, gy] of squareBaseCells()) {
      const cx = gx * spacing;
      const cy = gy * spacing;
      const distance = Math.abs(gx) + Math.abs(gy);
      pieces.push({
        points: rectFootprint(cx, cy, size, size, 0),
        regionId: squareRegionId(cx, cy),
        level: Math.max(0, 3 - Math.min(3, distance)),
        paintOrder: 0,
      });
    }

    pieces.push({
      points: rectFootprint(
        0,
        0,
        size * 0.72,
        size * 0.72,
        Math.PI / 4,
      ),
      regionId: 'square-center',
      level: 4,
      paintOrder: 20,
    });

    return pieces;
  }

  function buildSquarePlan() {
    if (state.complexity === 'complex') {
      buildSquareComplexPlan();
      return;
    }

    clearPlan();
    for (const piece of squareSimplePieces()) {
      addPlanLoop(
        piece.points,
        true,
        piece.regionId,
        piece.paintOrder,
      );
    }
  }

  function lotusPetalFootprint(
    radius,
    radialLength,
    tangentialWidth,
    angle,
  ) {
    const local = [
      [-radialLength * 0.50, 0],
      [-radialLength * 0.18, -tangentialWidth * 0.50],
      [ radialLength * 0.20, -tangentialWidth * 0.38],
      [ radialLength * 0.50, 0],
      [ radialLength * 0.20,  tangentialWidth * 0.38],
      [-radialLength * 0.18,  tangentialWidth * 0.50],
    ];

    const cx = Math.cos(angle) * radius;
    const cy = Math.sin(angle) * radius;

    return local.map(([x, y]) => {
      const p = rotateXYPoint(x, y, angle);
      return [cx + p[0], cy + p[1]];
    });
  }

  function bhupuraPieces(
    size,
    thickness,
    gateWidth,
    regionId,
    level = 0,
    paintOrder = 0,
  ) {
    const pieces = [];
    const half = size / 2;
    const segment = (size - gateWidth) / 2;
    const offset = gateWidth / 2 + segment / 2;
    const wallCenter = half - thickness / 2;
    const gateCapOffset = half + thickness * 0.65;

    const push = (points, order = paintOrder) => {
      pieces.push({ points, regionId, level, paintOrder: order });
    };

    for (const sx of [-1, 1]) {
      push(rectFootprint(sx * offset,  wallCenter, segment, thickness, 0));
      push(rectFootprint(sx * offset, -wallCenter, segment, thickness, 0));
    }

    for (const sy of [-1, 1]) {
      push(rectFootprint( wallCenter, sy * offset, thickness, segment, 0));
      push(rectFootprint(-wallCenter, sy * offset, thickness, segment, 0));
    }

    push(rectFootprint(0,  gateCapOffset, gateWidth, thickness, 0), paintOrder + 1);
    push(rectFootprint(0, -gateCapOffset, gateWidth, thickness, 0), paintOrder + 1);
    push(rectFootprint( gateCapOffset, 0, thickness, gateWidth, 0), paintOrder + 1);
    push(rectFootprint(-gateCapOffset, 0, thickness, gateWidth, 0), paintOrder + 1);

    return pieces;
  }

  function lotusRingPieces(
    count,
    radius,
    radialLength,
    tangentialWidth,
    regionId,
    level,
    paintOrder,
  ) {
    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * TAU - Math.PI / 2;
      return {
        points: lotusPetalFootprint(
          radius,
          radialLength,
          tangentialWidth,
          angle,
        ),
        regionId,
        level,
        paintOrder,
      };
    });
  }

  function sriTriangleSpecs() {
    // Normalized from a published computational coordinate set:
    // original frame center (150,150), circumradius 100.
    const raw = [
      ['D1', 53.65669559977147, 123.20508075688774, 250, 246.34330440022853, 'shakti'],
      ['U1', 52.984011026495736, 174.24660560764943, 50, 247.01598897350425, 'shiva'],
      ['U3', 98.71823312733801, 220.03828947357886, 123.20508075688774, 201.281766872662, 'shiva'],
      ['U2', 78.26467997914015, 197.92315674002487, 78.10499177949904, 221.73532002085986, 'shiva'],
      ['D3', 90.4856922951427, 78.10499177949904, 160.66014976539617, 209.51430770485734, 'shakti'],
      ['D2', 80.98384838952128, 103.12199145016105, 220.03828947357886, 219.0161516104787, 'shakti'],
      ['U4', 114.9488500600036, 160.66014976539617, 103.12199145016105, 185.0511499399964, 'shiva'],
      ['D4', 116.35142605010424, 134.30757626706648, 197.92315674002487, 183.64857394989576, 'shakti'],
      ['D5', 124.61190803072795, 144.79777263138968, 174.24660560764943, 175.38809196927207, 'shakti'],
    ];

    return raw.map(([name, leftX, baseY, apexY, rightX, family], index) => ({
      name,
      family,
      points: [
        [(leftX - 150) / 100, (150 - baseY) / 100],
        [0, (150 - apexY) / 100],
        [(rightX - 150) / 100, (150 - baseY) / 100],
      ],
      level: 4 + index,
      paintOrder: 40 + index,
      regionId: 'sri-' + family + '-' + index,
    }));
  }

  function sriYantraPieces() {
    const complex = state.complexity === 'complex';
    const pieces = [];

    const frameSpecs = complex
      ? [
          [3.92, 0.10, 0],
          [3.70, 0.09, 1],
          [3.50, 0.08, 2],
        ]
      : [[3.82, 0.12, 0]];

    frameSpecs.forEach(([size, thickness, order]) => {
      pieces.push(...bhupuraPieces(
        size,
        thickness,
        0.58,
        'sri-bhupura',
        0,
        order,
      ));
    });

    pieces.push(...lotusRingPieces(
      16, 1.58, 0.34, 0.22,
      'sri-lotus16', 1, 10,
    ));
    pieces.push(...lotusRingPieces(
      8, 1.28, 0.42, 0.36,
      'sri-lotus8', 2, 20,
    ));

    if (complex) {
      for (const [outer, inner, order] of [
        [1.115, 1.080, 27],
        [1.075, 1.040, 28],
        [1.035, 1.000, 29],
      ]) {
        for (const sector of polygonRingSectors(
          outer, inner, 48, Math.PI / 48,
        )) {
          pieces.push({
            points: sector,
            regionId: 'sri-lotus8',
            level: 3,
            paintOrder: order,
          });
        }
      }
    }

    pieces.push(...sriTriangleSpecs());
    pieces.push({
      points: polygonFootprint(0, 0, 0.035, 16, 0),
      regionId: 'sri-bindu',
      level: 14,
      paintOrder: 100,
    });

    return pieces;
  }

  function kaliYantraPieces() {
    const complex = state.complexity === 'complex';
    const pieces = [];

    const frameSpecs = complex
      ? [[3.44,0.10,0],[3.26,0.08,1],[3.10,0.07,2]]
      : [[3.34,0.11,0]];

    frameSpecs.forEach(([size, thickness, order]) => {
      pieces.push(...bhupuraPieces(
        size, thickness, 0.54,
        'kali-bhupura', 0, order,
      ));
    });

    pieces.push(...lotusRingPieces(
      8, 1.23, 0.46, 0.39,
      'kali-lotus', 1, 10,
    ));

    const radii = [0.98, 0.81, 0.65, 0.49, 0.34];
    radii.forEach((radius, index) => {
      pieces.push({
        points: polygonFootprint(
          0, 0, radius, 3, Math.PI / 2,
        ),
        regionId: 'kali-triangle-' + index,
        level: 2 + index,
        paintOrder: 30 + index,
      });
    });

    pieces.push({
      points: polygonFootprint(0, 0, 0.038, 16, 0),
      regionId: 'kali-bindu',
      level: 7,
      paintOrder: 100,
    });

    return pieces;
  }

  function matangiYantraPieces() {
    const complex = state.complexity === 'complex';
    const pieces = [];

    const frameSpecs = complex
      ? [[4.02,0.10,0],[3.82,0.08,1]]
      : [[3.36,0.11,0]];

    frameSpecs.forEach(([size, thickness, order]) => {
      pieces.push(...bhupuraPieces(
        size, thickness, complex ? 0.62 : 0.54,
        'matangi-bhupura', 0, order,
      ));
    });

    if (complex) {
      pieces.push(...lotusRingPieces(
        16, 1.68, 0.34, 0.20,
        'matangi-lotus', 1, 8,
      ));
      pieces.push(...lotusRingPieces(
        8, 1.39, 0.38, 0.32,
        'matangi-lotus', 2, 12,
      ));
    }

    pieces.push(...lotusRingPieces(
      8, complex ? 1.10 : 1.20,
      0.43, 0.36,
      'matangi-lotus', complex ? 3 : 1, 20,
    ));

    if (complex) {
      pieces.push({
        points: polygonFootprint(
          0, 0, 0.86, 3, Math.PI / 2,
        ),
        regionId: 'matangi-shakti',
        level: 4,
        paintOrder: 28,
      });
    }

    pieces.push({
      points: polygonFootprint(
        0, 0, 0.72, 3, -Math.PI / 2,
      ),
      regionId: 'matangi-shiva',
      level: complex ? 5 : 2,
      paintOrder: 30,
    });
    pieces.push({
      points: polygonFootprint(
        0, 0, 0.72, 3, Math.PI / 2,
      ),
      regionId: 'matangi-shakti',
      level: complex ? 6 : 3,
      paintOrder: 31,
    });

    pieces.push({
      points: polygonFootprint(0, 0, 0.040, 16, 0),
      regionId: 'matangi-bindu',
      level: complex ? 7 : 4,
      paintOrder: 100,
    });

    return pieces;
  }

  function buildPlanFromPieces(pieces) {
    clearPlan();
    for (const piece of pieces) {
      addPlanLoop(
        piece.points,
        true,
        piece.regionId,
        piece.paintOrder,
      );
    }

    const network = yantraSubdivisionNetwork(pieces);
    const detailSeen = new Set();

    for (const piece of pieces) {
      for (const segment of detailSegmentsForPiece(piece, network)) {
        const k0 = segment[0].map((v) => v.toFixed(5)).join(',');
        const k1 = segment[1].map((v) => v.toFixed(5)).join(',');
        const key = k0 < k1 ? k0 + '|' + k1 : k1 + '|' + k0;
        if (detailSeen.has(key)) continue;
        detailSeen.add(key);
        addPlanDetailEdge(segment[0], segment[1]);
      }
    }
  }

  function buildSriYantraPlan() {
    buildPlanFromPieces(sriYantraPieces());
  }

  function buildKaliYantraPlan() {
    buildPlanFromPieces(kaliYantraPieces());
  }

  function buildMatangiYantraPlan() {
    buildPlanFromPieces(matangiYantraPieces());
  }

  function buildHexPlan() {
    clearPlan();
    const layers = hexLayerSpecs();

    layers.forEach(([radius, rotation], index) => {
      addPlanRegularPolygon(
        0,
        0,
        radius,
        6,
        rotation,
        true,
        'hex-layer-' + index + '-of-' + layers.length,
        index,
      );
    });

    const ringRadius = 1.58;
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * TAU;
      addPlanRegularPolygon(
        Math.cos(angle) * ringRadius,
        Math.sin(angle) * ringRadius,
        0.22,
        6,
        Math.PI / 6,
        true,
        'hex-satellite',
        10,
      );
    }

    if (state.complexity === 'complex') {
      const outerRadius = 2.02;
      for (let i = 0; i < 12; i += 1) {
        const angle = (i / 12) * TAU + Math.PI / 12;
        addPlanRegularPolygon(
          Math.cos(angle) * outerRadius,
          Math.sin(angle) * outerRadius,
          0.15,
          6,
          i % 2 ? Math.PI / 6 : 0,
          true,
          'hex-outer-satellite',
          5,
        );
      }
    }

    addPlanPoint(
      0,
      0,
      0.026,
      'hex-center',
      100,
    );
  }

  function castelSpec() {
    return state.complexity === 'complex'
      ? {
          outerRadius: 1.46,
          innerRadius: 0.78,
          innerWallRadius: 0.65,
          towerRadius: 0.29,
        }
      : {
          outerRadius: 1.40,
          innerRadius: 0.76,
          innerWallRadius: null,
          towerRadius: 0.27,
        };
  }

  function buildCastelPlan() {
    clearPlan();
    const spec = castelSpec();
    const rotation = Math.PI / 8;

    for (const sector of polygonRingSectors(
      spec.outerRadius,
      spec.innerRadius,
      8,
      rotation,
    )) {
      addPlanLoop(sector, true, 'castel-wall', 0);
    }

    const towerCenters = polygonFootprint(
      0,
      0,
      spec.outerRadius,
      8,
      rotation,
    );

    for (const [cx, cy] of towerCenters) {
      addPlanRegularPolygon(
        cx,
        cy,
        spec.towerRadius,
        8,
        rotation,
        true,
        'castel-tower',
        10,
      );
    }

    if (spec.innerWallRadius) {
      for (const sector of polygonRingSectors(
        spec.innerRadius,
        spec.innerWallRadius,
        8,
        rotation,
      )) {
        addPlanLoop(sector, true, 'castel-inner', 20);
      }
    }

    addPlanRegularPolygon(
      0,
      0,
      spec.innerWallRadius || spec.innerRadius,
      8,
      rotation,
      false,
      'castel-accent',
      100,
    );
  }

  function kukulkanSpec() {
    const complex = state.complexity === 'complex';
    return {
      sizes: complex
        ? [2.82,2.58,2.34,2.10,1.86,1.62,1.38,1.14,0.90]
        : [2.62,2.18,1.74,1.30,0.88],
      stairWidth: complex ? 0.24 : 0.27,
      templeSize: complex ? 0.62 : 0.58,
    };
  }

  function kukulkanStairPieces(spec) {
    const pieces = [];

    for (let i = 0; i < spec.sizes.length - 1; i += 1) {
      const outer = spec.sizes[i];
      const inner = spec.sizes[i + 1];
      const band = (outer - inner) / 2;
      const center = (outer + inner) / 4;
      const order = 20 + i;

      pieces.push(
        {
          points: rectFootprint(
            0,
            center,
            spec.stairWidth,
            band,
            0,
          ),
          level: i,
          paintOrder: order,
        },
        {
          points: rectFootprint(
            0,
            -center,
            spec.stairWidth,
            band,
            0,
          ),
          level: i,
          paintOrder: order,
        },
        {
          points: rectFootprint(
            center,
            0,
            band,
            spec.stairWidth,
            0,
          ),
          level: i,
          paintOrder: order,
        },
        {
          points: rectFootprint(
            -center,
            0,
            band,
            spec.stairWidth,
            0,
          ),
          level: i,
          paintOrder: order,
        },
      );
    }

    return pieces;
  }

  function buildKukulkanPlan() {
    clearPlan();
    const spec = kukulkanSpec();

    spec.sizes.forEach((size, index) => {
      addPlanSquareCell(
        0,
        0,
        size,
        0,
        true,
        'kukulkan-level-' + index,
        index,
      );
    });

    for (const piece of kukulkanStairPieces(spec)) {
      addPlanLoop(
        piece.points,
        true,
        'kukulkan-stair',
        piece.paintOrder,
      );
    }

    addPlanSquareCell(
      0,
      0,
      spec.templeSize,
      0,
      true,
      'kukulkan-temple',
      100,
    );
  }

  function lalibelaCrossCells(size, spacing, regionId, order) {
    return [
      [0,0],
      [spacing,0],
      [-spacing,0],
      [0,spacing],
      [0,-spacing],
    ].map(([cx, cy]) => ({
      points: rectFootprint(cx, cy, size, size, 0),
      regionId,
      paintOrder: order,
    }));
  }

  function lalibelaCourtPieces(size, thickness) {
    const side = size - thickness;
    return [
      rectFootprint(0, side / 2, size, thickness, 0),
      rectFootprint(0, -side / 2, size, thickness, 0),
      rectFootprint(-side / 2, 0, thickness, size - 2 * thickness, 0),
      rectFootprint(side / 2, 0, thickness, size - 2 * thickness, 0),
    ];
  }

  function buildLalibelaPlan() {
    clearPlan();
    const complex = state.complexity === 'complex';

    for (const points of lalibelaCourtPieces(
      complex ? 2.72 : 2.56,
      0.12,
    )) {
      addPlanLoop(points, true, 'lalibela-court', 0);
    }

    const bodySize = complex ? 0.66 : 0.70;
    const bodySpacing = bodySize;

    for (const cell of lalibelaCrossCells(
      bodySize,
      bodySpacing,
      'lalibela-body',
      10,
    )) {
      addPlanLoop(
        cell.points,
        true,
        cell.regionId,
        cell.paintOrder,
      );
    }

    if (complex) {
      for (const cell of lalibelaCrossCells(
        0.42,
        bodySpacing,
        'lalibela-roof',
        20,
      )) {
        addPlanLoop(
          cell.points,
          true,
          cell.regionId,
          cell.paintOrder,
        );
      }
    }

    addPlanSquareCell(
      0,
      0,
      complex ? 0.30 : 0.34,
      0,
      true,
      'lalibela-center',
      100,
    );
  }

  function addSquarePrismCentered(
    centerZ,
    size,
    height,
    regionId,
  ) {
    addCenteredPrism(
      0,
      0,
      centerZ,
      size / Math.sqrt(2),
      4,
      height,
      Math.PI / 4,
      regionId,
    );
  }

  function addSquarePrismBase(
    baseZ,
    size,
    height,
    regionId,
  ) {
    addPrism(
      0,
      0,
      baseZ,
      size / Math.sqrt(2),
      4,
      height,
      Math.PI / 4,
      regionId,
    );
  }

  function stupaLayerSpecs() {
    const complex = state.complexity === 'complex';

    const raw = complex
      ? [
          { kind: 'square', size: 2.28, height: 0.12 },
          { kind: 'square', size: 1.98, height: 0.12 },
          { kind: 'square', size: 1.68, height: 0.11 },
          { kind: 'polygon', radius: 0.78, sides: 20, height: 0.10 },
          { kind: 'polygon', radius: 0.88, sides: 20, height: 0.11 },
          { kind: 'polygon', radius: 0.82, sides: 20, height: 0.11 },
          { kind: 'polygon', radius: 0.70, sides: 20, height: 0.10 },
          { kind: 'polygon', radius: 0.54, sides: 20, height: 0.10 },
          { kind: 'square', size: 0.58, height: 0.11 },
          { kind: 'polygon', radius: 0.34, sides: 16, height: 0.07 },
          { kind: 'polygon', radius: 0.29, sides: 16, height: 0.07 },
          { kind: 'polygon', radius: 0.24, sides: 16, height: 0.07 },
          { kind: 'polygon', radius: 0.19, sides: 16, height: 0.07 },
          { kind: 'polygon', radius: 0.14, sides: 16, height: 0.07 },
          { kind: 'polygon', radius: 0.10, sides: 16, height: 0.07 },
          { kind: 'polygon', radius: 0.065, sides: 12, height: 0.18, center: true },
        ]
      : [
          { kind: 'square', size: 2.20, height: 0.14 },
          { kind: 'square', size: 1.82, height: 0.13 },
          { kind: 'polygon', radius: 0.72, sides: 18, height: 0.11 },
          { kind: 'polygon', radius: 0.82, sides: 18, height: 0.13 },
          { kind: 'polygon', radius: 0.64, sides: 18, height: 0.12 },
          { kind: 'square', size: 0.52, height: 0.12 },
          { kind: 'polygon', radius: 0.28, sides: 14, height: 0.09 },
          { kind: 'polygon', radius: 0.20, sides: 14, height: 0.09 },
          { kind: 'polygon', radius: 0.12, sides: 14, height: 0.09 },
          { kind: 'polygon', radius: 0.065, sides: 12, height: 0.17, center: true },
        ];

    return raw.map((layer, index) => ({
      ...layer,
      regionId: layer.center
        ? 'stupa-center'
        : 'stupa-layer-' + index + '-of-' + raw.length,
    }));
  }

  function buildStupaPlan() {
    clearPlan();
    const layers = stupaLayerSpecs();

    layers.forEach((layer, index) => {
      if (layer.kind === 'square') {
        addPlanSquareCell(
          0,
          0,
          layer.size,
          0,
          true,
          layer.regionId,
          index,
        );
      } else {
        addPlanRegularPolygon(
          0,
          0,
          layer.radius,
          layer.sides,
          0,
          true,
          layer.regionId,
          index,
        );
      }
    });
  }

  function borobudurSpec() {
    const complex = state.complexity === 'complex';

    return complex
      ? {
          squares: [2.82, 2.58, 2.34, 2.10, 1.86],
          circles: [0.82, 0.66, 0.50],
          satelliteCounts: [32, 24, 16],
          satelliteRadii: [0.72, 0.58, 0.44],
          satelliteSizes: [0.055, 0.050, 0.046],
          centerRadius: 0.22,
        }
      : {
          squares: [2.60, 2.20, 1.80],
          circles: [0.78, 0.55],
          satelliteCounts: [16, 8],
          satelliteRadii: [0.68, 0.47],
          satelliteSizes: [0.066, 0.058],
          centerRadius: 0.21,
        };
  }

  function borobudurSmallStupaProfile(radius) {
    return [
      { radius, height: radius * 0.72 },
      { radius: radius * 0.82, height: radius * 1.05 },
      { radius: radius * 0.48, height: radius * 0.92 },
    ];
  }

  function borobudurCentralProfile(radius) {
    return [
      { radius: radius * 0.92, height: 0.07 },
      { radius: radius * 1.18, height: 0.13 },
      { radius, height: 0.12 },
      { radius: radius * 0.70, height: 0.11 },
      { radius: radius * 0.42, height: 0.20 },
    ];
  }

  function addBorobudurSatellitePlanRing(spec, ringIndex) {
    const count = spec.satelliteCounts[ringIndex];
    const ringRadius = spec.satelliteRadii[ringIndex];
    const radius = spec.satelliteSizes[ringIndex];
    const profile = borobudurSmallStupaProfile(radius);

    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * TAU;
      const cx = Math.cos(angle) * ringRadius;
      const cy = Math.sin(angle) * ringRadius;

      profile.forEach((part, partIndex) => {
        addPlanRegularPolygon(
          cx,
          cy,
          part.radius,
          8,
          Math.PI / 8,
          true,
          'borobudur-stupa-' + ringIndex,
          60 + ringIndex * 5 + partIndex,
        );
      });
    }
  }

  function buildBorobudurPlan() {
    clearPlan();
    const spec = borobudurSpec();

    spec.squares.forEach((size, index) => {
      addPlanSquareCell(
        0,
        0,
        size,
        0,
        true,
        'borobudur-square-' + index,
        index,
      );
    });

    spec.circles.forEach((radius, index) => {
      addPlanRegularPolygon(
        0,
        0,
        radius,
        24,
        Math.PI / 24,
        true,
        'borobudur-circle-' + index,
        20 + index,
      );
      addBorobudurSatellitePlanRing(spec, index);
    });

    borobudurCentralProfile(spec.centerRadius).forEach((part, index) => {
      addPlanRegularPolygon(
        0,
        0,
        part.radius,
        24,
        Math.PI / 24,
        true,
        'borobudur-center',
        100 + index,
      );
    });
  }

  function addLayerCentered(layer, centerZ, height, regionId = layer.regionId) {
    if (layer.kind === 'square') {
      addSquarePrismCentered(centerZ, layer.size, height, regionId);
    } else {
      addCenteredPrism(
        0,
        0,
        centerZ,
        layer.radius,
        layer.sides,
        height,
        layer.rotation || 0,
        regionId,
      );
    }
  }

  function addLayerBase(layer, baseZ, height, regionId = layer.regionId) {
    if (layer.kind === 'square') {
      addSquarePrismBase(baseZ, layer.size, height, regionId);
    } else {
      addPrism(
        0,
        0,
        baseZ,
        layer.radius,
        layer.sides,
        height,
        layer.rotation || 0,
        regionId,
      );
    }
  }

  

  function buildStupaTemple() {
    resetGeometry();
    const layers = stupaLayerSpecs();
    const gap = state.spacingStyle === 'separated' ? 0.035 : 0;
    let z = 0;

    for (const layer of layers) {
      if (layer.kind === 'square') {
        addSquarePrismBase(
          z,
          layer.size,
          layer.height,
          layer.regionId,
        );
      } else {
        addPrism(
          0,
          0,
          z,
          layer.radius,
          layer.sides,
          layer.height,
          0,
          layer.regionId,
        );
      }
      z += layer.height + gap;
    }
  }

  function addBorobudurSatelliteModules(
    spec,
    ringIndex,
    baseZ,
  ) {
    const count = spec.satelliteCounts[ringIndex];
    const ringRadius = spec.satelliteRadii[ringIndex];
    const radius = spec.satelliteSizes[ringIndex];
    const profile = borobudurSmallStupaProfile(radius);

    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * TAU;
      const cx = Math.cos(angle) * ringRadius;
      const cy = Math.sin(angle) * ringRadius;
      let z = baseZ;

      for (const part of profile) {
        addPrism(
          cx,
          cy,
          z,
          part.radius,
          8,
          part.height,
          Math.PI / 8,
          'borobudur-stupa-' + ringIndex,
        );
        z += part.height;
      }
    }
  }

  

  function buildBorobudurTemple() {
    resetGeometry();
    const spec = borobudurSpec();
    const gap = state.spacingStyle === 'separated' ? 0.035 : 0;
    const squareHeight = 0.115;
    const circleHeight = 0.085;
    let z = 0;

    spec.squares.forEach((size, index) => {
      addSquarePrismBase(
        z,
        size,
        squareHeight,
        'borobudur-square-' + index,
      );
      z += squareHeight + gap;
    });

    spec.circles.forEach((radius, index) => {
      addPrism(
        0,
        0,
        z,
        radius,
        24,
        circleHeight,
        Math.PI / 24,
        'borobudur-circle-' + index,
      );

      addBorobudurSatelliteModules(
        spec,
        index,
        z + circleHeight,
      );

      z += circleHeight + gap;
    });

    for (const part of borobudurCentralProfile(spec.centerRadius)) {
      addPrism(
        0,
        0,
        z,
        part.radius,
        24,
        part.height,
        Math.PI / 24,
        'borobudur-center',
      );
      z += part.height;
    }
  }

  function buildPlanForPreset() {
    if (state.preset === 'sriyantra') buildSriYantraPlan();
    else if (state.preset === 'kaliyantra') buildKaliYantraPlan();
    else if (state.preset === 'matangiyantra') buildMatangiYantraPlan();
    else if (state.preset === 'hex') buildHexPlan();
    else if (state.preset === 'stupa') buildStupaPlan();
    else if (state.preset === 'borobudur') buildBorobudurPlan();
    else if (state.preset === 'castel') buildCastelPlan();
    else if (state.preset === 'kukulkan') buildKukulkanPlan();
    else if (state.preset === 'lalibela') buildLalibelaPlan();
    else buildSquarePlan();
  }

  function squareBaseCells() {
    const base = [];
    for (let gx = -2; gx <= 2; gx += 1) {
      for (let gy = -2; gy <= 2; gy += 1) {
        if (Math.abs(gx) + Math.abs(gy) <= 2) {
          base.push([gx, gy]);
        }
      }
    }
    base.push([3,0],[-3,0],[0,3],[0,-3]);
    return base;
  }

  function squareSecondCells() {
    return [[0,0],[1,0],[-1,0],[0,1],[0,-1]];
  }

  function hierarchyLevelLayout(
    pieces,
    thicknessForPiece,
    separatedGap = 0.12,
  ) {
    const levels = [...new Set(
      pieces.map((piece) => piece.level),
    )].sort((a, b) => a - b);

    const piecesByLevel = new Map(
      levels.map((level) => [
        level,
        pieces.filter((piece) => piece.level === level),
      ]),
    );

    const rankThickness = levels.map((level, rank) => {
      const candidates = piecesByLevel.get(level).map((piece) => (
        thicknessForPiece(piece, rank, levels.length)
      ));
      return Math.max(...candidates);
    });

    const gap = state.spacingStyle === 'separated'
      ? separatedGap
      : 0;
    const totalHeight =
      rankThickness.reduce((sum, value) => sum + value, 0)
      + gap * Math.max(0, levels.length - 1);

    const centers = [];
    let cursor = -totalHeight * 0.5;

    for (const thickness of rankThickness) {
      centers.push(cursor + thickness * 0.5);
      cursor += thickness + gap;
    }

    return {
      levels,
      rankByLevel: new Map(
        levels.map((level, rank) => [level, rank]),
      ),
      rankThickness,
      centers,
    };
  }

  function buildCenteredPieceHierarchy(
    pieces,
    thicknessForPiece,
    separatedGap = 0.12,
    preserveSubdivision = false,
  ) {
    resetGeometry();

    const layout = hierarchyLevelLayout(
      pieces,
      thicknessForPiece,
      separatedGap,
    );
    const network = preserveSubdivision
      ? yantraSubdivisionNetwork(pieces)
      : [];
    const mirrored =
      state.zLiftStyle === 'mirror'
      && (PRESET_META[state.preset]?.kind !== 'architecture');

    let mirroredCenters = null;
    if (mirrored) {
      const gap = state.spacingStyle === 'separated'
        ? separatedGap
        : 0;
      mirroredCenters = [0];
      let topSurface = layout.rankThickness[0] * 0.5;

      for (let rank = 1; rank < layout.levels.length; rank += 1) {
        const height = layout.rankThickness[rank];
        const center = topSurface + gap + height * 0.5;
        mirroredCenters.push(center);
        topSurface = center + height * 0.5;
      }
    }

    for (const piece of pieces) {
      const rank = layout.rankByLevel.get(piece.level) || 0;
      const height = layout.rankThickness[rank];
      const hierarchyT = layout.levels.length <= 1
        ? 1
        : rank / (layout.levels.length - 1);
      const details = preserveSubdivision
        ? detailSegmentsForPiece(piece, network)
        : [];
      const liftMeta = {
        hierarchyT,
        polarity: regionPolarity(piece.regionId),
      };

      if (mirrored && rank > 0) {
        const z = mirroredCenters[rank];
        addFootprintPrismCentered(
          piece.points,
          z,
          height,
          piece.regionId,
          details,
          liftMeta,
        );
        addFootprintPrismCentered(
          piece.points,
          -z,
          height,
          piece.regionId,
          details,
          liftMeta,
        );
        continue;
      }

      const z = mirrored
        ? 0
        : layout.centers[rank];

      addFootprintPrismCentered(
        piece.points,
        z,
        height,
        piece.regionId,
        details,
        liftMeta,
      );
    }
  }

  function buildSquareComplexMandala() {
    const pieces = squareComplexPieces();

    buildCenteredPieceHierarchy(
      pieces,
      (piece, rank, count) => {
        const t = count <= 1 ? 0 : rank / (count - 1);
        if (piece.regionId === 'square-center') {
          return 0.10 + t * 0.075;
        }
        return 0.075 + t * 0.045;
      },
      0.14,
    );
  }

  function buildSquareMandala() {
    const pieces = state.complexity === 'complex'
      ? squareComplexPieces()
      : squareSimplePieces();

    buildCenteredPieceHierarchy(
      pieces,
      (piece, rank, count) => {
        const t = count <= 1 ? 0 : rank / (count - 1);
        if (piece.regionId === 'square-center') {
          return 0.11 + t * 0.065;
        }
        return 0.085 + t * 0.045;
      },
      0.14,
    );
  }

  

  function buildYantraForm(pieces) {
    buildCenteredPieceHierarchy(
      pieces,
      (piece, rank, count) => {
        const t = count <= 1 ? 0 : rank / (count - 1);

        if (piece.regionId?.includes('bindu')) {
          return 0.17;
        }
        if (piece.regionId?.includes('bhupura')) {
          return 0.065;
        }
        if (piece.regionId?.includes('lotus')) {
          return 0.075 + t * 0.012;
        }

        // Triangle / enclosure hierarchy grows subtly toward the center.
        return 0.082 + t * 0.052;
      },
      0.13,
      true,
    );
  }

  function buildSriYantraForm() {
    buildYantraForm(sriYantraPieces());
  }

  function buildKaliYantraForm() {
    buildYantraForm(kaliYantraPieces());
  }

  function buildMatangiYantraForm() {
    buildYantraForm(matangiYantraPieces());
  }

  

  

  function hexLayerSpecs() {
    return state.complexity === 'complex'
      ? [
          [1.28, 0],
          [1.02, Math.PI / 6],
          [0.78, 0],
          [0.56, Math.PI / 6],
        ]
      : [
          [1.22, 0],
          [0.86, Math.PI / 6],
          [0.52, 0],
        ];
  }

  function addHexSatelliteRing(
    centerZ,
    height = 0.18,
    liftMeta = null,
  ) {
    const ringRadius = 1.58;
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * TAU;
      addCenteredPrism(
        Math.cos(angle) * ringRadius,
        Math.sin(angle) * ringRadius,
        centerZ,
        0.22,
        6,
        height,
        Math.PI / 6,
        'hex-satellite',
        liftMeta,
      );
    }
  }

  function buildHexMandala() {
    resetGeometry();

    const layers = hexLayerSpecs();
    const separated = state.spacingStyle === 'separated';
    const satelliteThickness = 0.11;
    const layerThicknesses = layers.map((_, index) => (
      0.085 + index * 0.018
    ));
    const centerHeight = 0.17;
    const gap = separated ? 0.15 : 0;

    if (state.zLiftStyle === 'mirror') {
      const baseThickness = Math.max(
        satelliteThickness,
        layerThicknesses[0],
      );
      const baseMeta = { hierarchyT: 0, polarity: 0 };

      addHexSatelliteRing(
        0,
        satelliteThickness,
        baseMeta,
      );

      if (state.complexity === 'complex') {
        const outerRadius = 2.02;
        for (let i = 0; i < 12; i += 1) {
          const angle = (i / 12) * TAU + Math.PI / 12;
          addCenteredPrism(
            Math.cos(angle) * outerRadius,
            Math.sin(angle) * outerRadius,
            0,
            0.15,
            6,
            satelliteThickness,
            i % 2 ? Math.PI / 6 : 0,
            'hex-outer-satellite',
            baseMeta,
          );
        }
      }

      addCenteredPrism(
        0,
        0,
        0,
        layers[0][0],
        6,
        layerThicknesses[0],
        layers[0][1],
        'hex-layer-0-of-' + layers.length,
        { hierarchyT: 0.15, polarity: 0 },
      );

      let topSurface = baseThickness * 0.5;

      for (let index = 1; index < layers.length; index += 1) {
        const thickness = layerThicknesses[index];
        const z = topSurface + gap + thickness * 0.5;
        const hierarchyT = index / layers.length;
        const regionId =
          'hex-layer-' + index + '-of-' + layers.length;

        addCenteredPrism(
          0, 0, z,
          layers[index][0], 6, thickness, layers[index][1],
          regionId,
          { hierarchyT, polarity: 0 },
        );
        addCenteredPrism(
          0, 0, -z,
          layers[index][0], 6, thickness, layers[index][1],
          regionId,
          { hierarchyT, polarity: 0 },
        );

        topSurface = z + thickness * 0.5;
      }

      const crownZ = topSurface + gap + centerHeight * 0.5;
      for (const sign of [-1, 1]) {
        addCenteredPrism(
          0,
          0,
          sign * crownZ,
          0.026,
          12,
          centerHeight,
          0,
          'hex-center',
          { hierarchyT: 1, polarity: 0 },
        );
      }
      return;
    }

    const thicknesses = [
      satelliteThickness,
      ...layerThicknesses,
      centerHeight,
    ];

    const total =
      thicknesses.reduce((sum, value) => sum + value, 0)
      + gap * (thicknesses.length - 1);
    const centers = [];
    let cursor = -total * 0.5;

    for (const thickness of thicknesses) {
      centers.push(cursor + thickness * 0.5);
      cursor += thickness + gap;
    }

    const lastIndex = thicknesses.length - 1;
    const satelliteMeta = { hierarchyT: 0, polarity: 0 };
    addHexSatelliteRing(
      centers[0],
      satelliteThickness,
      satelliteMeta,
    );

    if (state.complexity === 'complex') {
      const outerRadius = 2.02;
      for (let i = 0; i < 12; i += 1) {
        const angle = (i / 12) * TAU + Math.PI / 12;
        addCenteredPrism(
          Math.cos(angle) * outerRadius,
          Math.sin(angle) * outerRadius,
          centers[0],
          0.15,
          6,
          satelliteThickness,
          i % 2 ? Math.PI / 6 : 0,
          'hex-outer-satellite',
          satelliteMeta,
        );
      }
    }

    layers.forEach(([radius, rotation], index) => {
      const hierarchyIndex = index + 1;
      const hierarchyT = hierarchyIndex / lastIndex;
      addCenteredPrism(
        0,
        0,
        centers[hierarchyIndex],
        radius,
        6,
        layerThicknesses[index],
        rotation,
        'hex-layer-' + index + '-of-' + layers.length,
        { hierarchyT, polarity: 0 },
      );
    });

    addCenteredPrism(
      0,
      0,
      centers[lastIndex],
      0.026,
      12,
      centerHeight,
      0,
      'hex-center',
      { hierarchyT: 1, polarity: 0 },
    );
  }

  


  function buildCastelForm() {
    resetGeometry();
    const spec = castelSpec();
    const rotation = Math.PI / 8;
    const separated = state.spacingStyle === 'separated';
    const gap = separated ? 0.08 : 0;

    const wallHeight = 0.56;
    for (const sector of polygonRingSectors(
      spec.outerRadius,
      spec.innerRadius,
      8,
      rotation,
    )) {
      addFootprintPrism(
        sector,
        0,
        wallHeight,
        'castel-wall',
      );
    }

    const towerCenters = polygonFootprint(
      0,
      0,
      spec.outerRadius,
      8,
      rotation,
    );

    for (const [cx, cy] of towerCenters) {
      addPrism(
        cx,
        cy,
        0,
        spec.towerRadius,
        8,
        wallHeight + 0.16 + gap,
        rotation,
        'castel-tower',
      );
    }

    if (spec.innerWallRadius) {
      for (const sector of polygonRingSectors(
        spec.innerRadius,
        spec.innerWallRadius,
        8,
        rotation,
      )) {
        addFootprintPrism(
          sector,
          gap,
          wallHeight - 0.08,
          'castel-inner',
        );
      }
    }
  }

  function buildKukulkanForm() {
    resetGeometry();
    const spec = kukulkanSpec();
    const separated = state.spacingStyle === 'separated';
    const gap = separated ? 0.045 : 0;
    const levelHeight = state.complexity === 'complex' ? 0.095 : 0.13;

    spec.sizes.forEach((size, index) => {
      addSquarePrismBase(
        index * (levelHeight + gap),
        size,
        levelHeight,
        'kukulkan-level-' + index,
      );
    });

    for (const piece of kukulkanStairPieces(spec)) {
      const baseZ =
        piece.level * (levelHeight + gap)
        + levelHeight
        + gap * 0.25;

      addFootprintPrism(
        piece.points,
        baseZ,
        Math.max(0.035, levelHeight * 0.35),
        'kukulkan-stair',
      );
    }

    const templeBase = spec.sizes.length * (levelHeight + gap);
    addSquarePrismBase(
      templeBase,
      spec.templeSize,
      state.complexity === 'complex' ? 0.24 : 0.22,
      'kukulkan-temple',
    );
  }

  function buildLalibelaForm() {
    resetGeometry();
    const complex = state.complexity === 'complex';
    const separated = state.spacingStyle === 'separated';
    const gap = separated ? 0.06 : 0;

    for (const points of lalibelaCourtPieces(
      complex ? 2.72 : 2.56,
      0.12,
    )) {
      addFootprintPrism(
        points,
        0,
        0.07,
        'lalibela-court',
      );
    }

    const bodySize = complex ? 0.66 : 0.70;
    const bodySpacing = bodySize;
    const bodyBase = 0.07 + gap;
    const bodyHeight = complex ? 0.62 : 0.58;

    for (const cell of lalibelaCrossCells(
      bodySize,
      bodySpacing,
      'lalibela-body',
      10,
    )) {
      addFootprintPrism(
        cell.points,
        bodyBase,
        bodyHeight,
        cell.regionId,
      );
    }

    if (complex) {
      for (const cell of lalibelaCrossCells(
        0.42,
        bodySpacing,
        'lalibela-roof',
        20,
      )) {
        addFootprintPrism(
          cell.points,
          bodyBase + bodyHeight + gap,
          0.11,
          cell.regionId,
        );
      }
    }

    addFootprintPrism(
      rectFootprint(
        0,
        0,
        complex ? 0.30 : 0.34,
        complex ? 0.30 : 0.34,
        0,
      ),
      bodyBase + bodyHeight + (complex ? 0.11 : 0) + gap,
      0.10,
      'lalibela-center',
    );
  }

  function buildGeometryForCurrentChoice() {
    if (state.preset === 'sriyantra') buildSriYantraForm();
    else if (state.preset === 'kaliyantra') buildKaliYantraForm();
    else if (state.preset === 'matangiyantra') buildMatangiYantraForm();
    else if (state.preset === 'hex') buildHexMandala();
    else if (state.preset === 'stupa') buildStupaTemple();
    else if (state.preset === 'borobudur') buildBorobudurTemple();
    else if (state.preset === 'castel') buildCastelForm();
    else if (state.preset === 'kukulkan') buildKukulkanForm();
    else if (state.preset === 'lalibela') buildLalibelaForm();
    else buildSquareMandala();
  }

  function buildActiveMandala() {
    buildPlanForPreset();
    buildGeometryForCurrentChoice();
    updateGeometryStats();
    drawAllPreviews();
    updateGeometryStats();
  }

  function rotatePlane(point, a, b, angle) {
    if (Math.abs(angle) < 1e-8) return;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const pa = point[a];
    const pb = point[b];
    point[a] = c * pa - s * pb;
    point[b] = s * pa + c * pb;
  }

  function transitionProgress() {
    return state.transition?.progress ?? 0;
  }

  function transitionTouchesDimension(dimension) {
    if (!state.transition) return false;
    return (
      state.transition.fromDimension === dimension
      || state.transition.toDimension === dimension
    );
  }

  function dimensionOrientationMix(dimension) {
    const structural = dimension === 3 ? state.zMix : state.wMix;
    if (!state.transition || !transitionTouchesDimension(dimension)) {
      return structural;
    }

    const t = transitionProgress();
    const forward = state.transition.toDimension > state.transition.fromDimension;

    if (
      dimension === 3
      && (
        state.transition.fromDimension === 2
        || state.transition.toDimension === 2
      )
    ) {
      return forward
        ? smoother(clamp((t - 0.78) / 0.22, 0, 1))
        : 1 - smoother(clamp(t / 0.24, 0, 1));
    }

    if (
      dimension === 4
      && (
        state.transition.fromDimension === 3
        || state.transition.toDimension === 3
      )
    ) {
      return forward
        ? smoother(clamp((t - 0.74) / 0.26, 0, 1))
        : 1 - smoother(clamp(t / 0.26, 0, 1));
    }

    return structural;
  }

  function activeAngle(config) {
    let factor = 1;
    if (config.key.includes('z')) factor *= dimensionOrientationMix(3);
    if (config.key.includes('w')) factor *= dimensionOrientationMix(4);
    return state.rotations[config.key] * RAD * factor;
  }

  function transform4D(source, applyUserScale = true) {
    const p = [source[0], source[1], source[2], source[3]];

    const sx = applyUserScale ? state.scales.x : 1;
    const sy = applyUserScale ? state.scales.y : 1;
    const sz = applyUserScale ? state.scales.z : 1;
    const sw = applyUserScale ? state.scales.w : 1;

    p[0] *= sx;
    p[1] *= sy;

    // Center the added dimensions for presentation. This is a uniform
    // rendering offset only: it does not change the intrinsic geometry.
    // It prevents asymmetric +Z architectures or W polarity from making the
    // whole object visibly jump up/down or sideways while a dimension grows.
    // Basis vectors use applyUserScale=false and must remain pure directions.
    const centerZ = applyUserScale ? geometryStats.centerZ : 0;
    const centerW = applyUserScale ? geometryStats.centerW : 0;
    p[2] = (p[2] - centerZ) * sz * state.zMix;
    p[3] = (p[3] - centerW) * sw * state.wMix;

    for (const config of ROTATION_CONFIG) {
      rotatePlane(p, config.a, config.b, activeAngle(config));
    }

    return p;
  }

  function project4Dto3D(p) {
    if (
      state.projection === 'orthographic'
      || state.projection === 'isometric'
      || state.wMix < 0.001
    ) {
      return [p[0], p[1], p[2]];
    }

    const cameraW = 3.6;
    const focal = 3.6;
    const denom = Math.max(0.8, cameraW - p[3]);
    const factor = focal / denom;

    return [
      p[0] * factor,
      p[1] * factor,
      p[2] * factor,
    ];
  }

  function cameraViewMix() {
    if (!state.transition) return state.dimension >= 3 ? 1 : 0;

    const from = state.transition.fromDimension;
    const to = state.transition.toDimension;
    const t = transitionProgress();

    if ((from === 2 && to === 3) || (from === 3 && to === 2)) {
      const forward = to > from;

      // Geometry separates first. Only once the new surfaces are legible does
      // the camera move into the ordinary 3D viewpoint. On collapse the order
      // reverses: return toward the plan view before flattening the geometry.
      return forward
        ? smoother(clamp((t - 0.34) / 0.66, 0, 1))
        : 1 - smoother(clamp(t / 0.46, 0, 1));
    }

    return 1;
  }

  function cameraTransform(p) {
    let [x, y, z] = p;

    const viewMix = cameraViewMix();

    const isometric = state.projection === 'isometric';
    const yaw = (
      isometric ? -Math.PI / 4 : state.cameraYaw
    ) * viewMix;

    let c = Math.cos(yaw);
    let s = Math.sin(yaw);
    let nx = c * x - s * z;
    let nz = s * x + c * z;
    x = nx;
    z = nz;

    const pitch = (
      isometric
        ? Math.atan(1 / Math.sqrt(2))
        : state.cameraPitch
    ) * viewMix;

    c = Math.cos(pitch);
    s = Math.sin(pitch);
    const ny = c * y - s * z;
    nz = s * y + c * z;
    y = ny;
    z = nz;

    return [x, y, z];
  }

  function projectToScreen(source) {
    const p4 = transform4D(source, true);
    const p3 = cameraTransform(project4Dto3D(p4));

    const cameraZ = 5.8;
    const factor = state.projection === 'isometric'
      ? 1
      : cameraZ / Math.max(2.6, cameraZ - p3[2]);

    const mobile = isMobileLayout();
    const stageTop = mobile ? state.viewTopInset : 0;
    const stageBottom = mobile
      ? Math.max(stageTop + 180, state.height - state.viewBottomInset)
      : state.height;
    const stageHeight = Math.max(180, stageBottom - stageTop);
    const scale = Math.min(state.width, stageHeight)
      * (mobile ? 0.27 : 0.245)
      * state.zoom;

    return {
      x: state.width * (mobile ? 0.5 : 0.47) + p3[0] * factor * scale,
      y: stageTop + stageHeight * 0.5 + p3[1] * factor * scale,
      depth: p3[2],
      w: p4[3],
    };
  }

  function moduleEmergence() {
    return 1;
  }

  function projectModulePoint(module, source) {
    return projectToScreen(source);
  }


  function axisColor(axis) {
    if (state.colorMode === 'axis') {
      return axis === 'x' ? COLORS.x
        : axis === 'y' ? COLORS.y
        : axis === 'z' ? COLORS.z
        : axis === 'w' ? COLORS.w
        : COLORS.neutral;
    }

    return axis === 'w'
      ? '#d8b662'
      : axis === 'n'
        ? '#eee7d8'
        : COLORS.form;
  }

  function drawLine(a, b, color, width, alpha) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function polygonArea2D(points) {
    let sum = 0;
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      sum += a.x * b.y - b.x * a.y;
    }
    return sum * 0.5;
  }

  function rawPolygonArea(points) {
    let sum = 0;
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      sum += a[0] * b[1] - b[0] * a[1];
    }
    return Math.abs(sum * 0.5);
  }

  function zConstructionReveal() {
    return {
      edges: smoother(clamp((state.zMix - 0.02) / 0.48, 0, 1)),
      faces: smoother(clamp((state.zMix - 0.18) / 0.58, 0, 1)),
      solid: smoother(clamp((state.zMix - 0.42) / 0.58, 0, 1)),
    };
  }

  function wConstructionReveal() {
    return {
      edges: smoother(clamp((state.wMix - 0.04) / 0.42, 0, 1)),
      faces: smoother(clamp((state.wMix - 0.24) / 0.50, 0, 1)),
      shell: smoother(clamp((state.wMix - 0.48) / 0.52, 0, 1)),
    };
  }

  function faceVisibility(face) {
    const wReveal = wConstructionReveal();

    if (face.bridge) return wReveal.faces;
    if (face.wLayer === 1) return wReveal.shell;
    return 1;
  }

  function edgeVisibility(edge) {
    const zReveal = zConstructionReveal();
    const wReveal = wConstructionReveal();

    if (edge.axis === 'w') return wReveal.edges;
    if (edge.axis === 'z') return zReveal.edges;
    if (edge.wLayer === 1) return wReveal.shell;
    return 1;
  }

  function faceCentroid(face, module) {
    const centroid = [0, 0, 0, 0];
    for (const index of face.indices) {
      const point = module.vertices[index];
      centroid[0] += point[0];
      centroid[1] += point[1];
      centroid[2] += point[2];
      centroid[3] += point[3];
    }
    const n = face.indices.length;
    return centroid.map((value) => value / n);
  }

  function classicFaceRgb(face, module) {
    const centroid = faceCentroid(face, module);
    const base = classicRegionRgb(
      module.regionId,
      centroid[0],
      centroid[1],
    );

    // Region hue is invariant across 2D/3D/4D. Orientation changes only
    // brightness so the geometry remains readable.
    const orientationShade = CLASSIC_SHADE[face.axis] || 1;
    return shadeRgb(base, orientationShade);
  }

  function classicFaceColor(face, module) {
    return rgbCss(classicFaceRgb(face, module));
  }

  function faceFillRgb(face, module) {
    if (state.colorMode === 'axis') {
      return hexToRgb(axisColor(face.axis));
    }

    if (state.colorMode === 'classic') {
      return classicFaceRgb(face, module);
    }

    const formColors = {
      x: '#b9ad96',
      y: '#c5b9a1',
      z: '#d2c6ad',
      w: '#9f927d',
      n: '#c0b49d',
    };

    return hexToRgb(formColors[face.axis] || formColors.n);
  }

  function faceFillColor(face, module) {
    return rgbCss(faceFillRgb(face, module));
  }

  function classicPlanColor(face) {
    let cx = 0;
    let cy = 0;

    for (const point of face) {
      cx += point[0];
      cy += point[1];
    }

    cx /= face.length;
    cy /= face.length;

    return rgbCss(
      classicRegionRgb(face.regionId, cx, cy),
    );
  }

  function classicWireColor(regionId, x = 0, y = 0) {
    const base = classicRegionRgb(regionId, x, y);
    return rgbCss(mixRgb(base, { r: 244, g: 241, b: 232 }, 0.26));
  }

  function edgeStrokeColor(axis) {
    if (state.renderMode === 'solid-edges') {
      if (state.colorMode === 'classic') return '#1d1714';
      if (state.colorMode === 'form') return '#241f19';
      return axisColor(axis);
    }
    return axisColor(axis);
  }

  function drawPlanFaces(alpha) {
    if (state.renderMode === 'wire' || alpha <= 0.001) return;

    const sorted = [...planFaces].sort((a, b) => {
      const orderA = a.paintOrder ?? 0;
      const orderB = b.paintOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return rawPolygonArea(b) - rawPolygonArea(a);
    });

    for (const face of sorted) {
      const points = face.map(projectToScreen);
      if (Math.abs(polygonArea2D(points)) < 0.2) continue;

      ctx.beginPath();
      points.forEach((p, index) => {
        if (index === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();

      ctx.fillStyle = state.colorMode === 'axis'
        ? '#d9dde4'
        : state.colorMode === 'classic'
          ? classicPlanColor(face)
          : '#c9b995';

      // Classic regions are opaque at rest. This prevents overlapping
      // translucent polygons from inventing colors that don't exist in 3D.
      ctx.globalAlpha = state.colorMode === 'classic'
        ? alpha
        : alpha * 0.16;
      ctx.fill();

      if (state.colorMode === 'classic') {
        ctx.globalAlpha = alpha * 0.96;
        ctx.strokeStyle = '#1d1714';
        ctx.lineWidth = 1.25;
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }
  }

  function drawPlanEdges(alpha) {
    if (alpha <= 0.001) return;

    for (const edge of planEdges) {
      if (edge.detail) continue;
      const a = projectToScreen(edge.a);
      const b = projectToScreen(edge.b);

      let color = axisColor(edge.axis);
      let width = 1.15;

      if (state.colorMode === 'classic') {
        if (state.renderMode === 'wire') {
          const mx = (edge.a[0] + edge.b[0]) * 0.5;
          const my = (edge.a[1] + edge.b[1]) * 0.5;
          color = classicWireColor(edge.regionId, mx, my);
          width = 1.3;
        } else {
          color = '#1d1714';
          width = 1.55;
        }
      }

      drawLine(a, b, color, width, alpha * 0.96);
    }
  }

  function faceWorldKey(module, face) {
    const transitionGroup = state.wMix >= 0.999
      ? ''
      : module.hyperOnly
        ? 'hyper|'
        : 'spatial|';

    return transitionGroup + face.indices
      .map((index) => module.vertices[index]
        .map(symmetryCoord)
        .join(','))
      .sort()
      .join('|');
  }

  function clearSolidLayer() {
    if (!solidRenderer || !gl) return;
    gl.viewport(0, 0, solidCanvas.width, solidCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  function drawSolidLayer(alpha) {
    if (!solidRenderer || !gl) return false;

    if (state.renderMode === 'wire' || alpha <= 0.001) {
      clearSolidLayer();
      return true;
    }

    const entries = [];
    const counts = new Map();

    for (const module of modules) {
      const moduleAmount = moduleEmergence(module);
      if (moduleAmount <= 0.002) continue;

      for (const face of module.faces) {
        const visibility = faceVisibility(face);
        if (visibility <= 0.002) continue;

        const key = faceWorldKey(module, face);
        counts.set(key, (counts.get(key) || 0) + 1);
        entries.push({ module, face, visibility, key });
      }
    }

    const faceData = [];

    for (const entry of entries) {
      if ((counts.get(entry.key) || 0) > 1) continue;

      const points = entry.face.indices
        .map((index) => projectModulePoint(
          entry.module,
          entry.module.vertices[index],
        ));

      if (
        points.length < 3
        || Math.abs(polygonArea2D(points)) < 0.45
      ) continue;

      const rgb = faceFillRgb(entry.face, entry.module);

      for (let i = 1; i < points.length - 1; i += 1) {
        const tri = [points[0], points[i], points[i + 1]];

        for (const p of tri) {
          const x = (p.x / state.width) * 2 - 1;
          const y = 1 - (p.y / state.height) * 2;
          const z = clamp(-p.depth / 4.5, -0.98, 0.98);

          faceData.push(
            x, y, z,
            rgb.r / 255,
            rgb.g / 255,
            rgb.b / 255,
            clamp(alpha * entry.visibility, 0, 1),
          );
        }
      }
    }

    gl.viewport(0, 0, solidCanvas.width, solidCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (!faceData.length) return true;

    gl.useProgram(solidRenderer.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, solidRenderer.buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(faceData),
      gl.DYNAMIC_DRAW,
    );

    const stride = 7 * 4;

    gl.enableVertexAttribArray(solidRenderer.aPosition);
    gl.vertexAttribPointer(
      solidRenderer.aPosition,
      3,
      gl.FLOAT,
      false,
      stride,
      0,
    );

    gl.enableVertexAttribArray(solidRenderer.aColor);
    gl.vertexAttribPointer(
      solidRenderer.aColor,
      4,
      gl.FLOAT,
      false,
      stride,
      3 * 4,
    );

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);

    if (alpha < 0.999) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    } else {
      gl.disable(gl.BLEND);
    }
    gl.disable(gl.CULL_FACE);
    gl.drawArrays(gl.TRIANGLES, 0, faceData.length / 7);
    gl.disable(gl.BLEND);

    // Default Solid follows the 2D visual grammar: colored faces plus only
    // the edges that survive the same depth buffer. Hidden/back edges fail
    // the depth test. Solid + edges may add the separate structural overlay.
    const edgeData = [];
    const black = hexToRgb('#1d1714');
    const edgeWidth = 1.35;
    const halfWidth = edgeWidth * 0.5;

    const pushEdgeVertex = (xPx, yPx, depth, edgeAlpha) => {
      const x = (xPx / state.width) * 2 - 1;
      const y = 1 - (yPx / state.height) * 2;
      const z = clamp(
        -depth / 4.5 - 0.0018,
        -0.999,
        0.999,
      );

      edgeData.push(
        x, y, z,
        black.r / 255,
        black.g / 255,
        black.b / 255,
        edgeAlpha,
      );
    };

    for (const module of modules) {
      const moduleAmount = moduleEmergence(module);
      if (moduleAmount <= 0.002) continue;

      for (const edge of module.edges) {
        const visibility = edgeVisibility(edge) * moduleAmount;
        if (visibility <= 0.002) continue;

        const a = projectModulePoint(
          module,
          module.vertices[edge.a],
        );
        const b = projectModulePoint(
          module,
          module.vertices[edge.b],
        );

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const length = Math.hypot(dx, dy);
        if (length < 0.5) continue;

        const ox = (-dy / length) * halfWidth;
        const oy = (dx / length) * halfWidth;
        const edgeAlpha = clamp(alpha * visibility, 0, 1);

        const a0 = [a.x + ox, a.y + oy, a.depth];
        const a1 = [a.x - ox, a.y - oy, a.depth];
        const b0 = [b.x + ox, b.y + oy, b.depth];
        const b1 = [b.x - ox, b.y - oy, b.depth];

        for (const p of [a0, a1, b0, b0, a1, b1]) {
          pushEdgeVertex(p[0], p[1], p[2], edgeAlpha);
        }
      }
    }

    if (edgeData.length) {
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(edgeData),
        gl.DYNAMIC_DRAW,
      );

      gl.vertexAttribPointer(
        solidRenderer.aPosition,
        3,
        gl.FLOAT,
        false,
        stride,
        0,
      );
      gl.vertexAttribPointer(
        solidRenderer.aColor,
        4,
        gl.FLOAT,
        false,
        stride,
        3 * 4,
      );

      gl.depthMask(false);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLES, 0, edgeData.length / 7);

      gl.disable(gl.BLEND);
      gl.depthMask(true);
    }

    return true;
  }

  function drawFaces(alpha) {
    if (state.renderMode === 'wire' || alpha <= 0.001) return;

    const rendered = [];

    for (const module of modules) {
      const moduleAmount = moduleEmergence(module);
      if (moduleAmount <= 0.002) continue;

      for (const face of module.faces) {
        const visibility = faceVisibility(face);
        if (visibility <= 0.002) continue;

        const points = face.indices.map((index) => projectModulePoint(
          module,
          module.vertices[index],
        ));
        if (Math.abs(polygonArea2D(points)) < 0.45) continue;

        const depth = points.reduce((sum, p) => sum + p.depth, 0) / points.length;
        rendered.push({
          face,
          module,
          points,
          depth,
          visibility: visibility * moduleAmount,
        });
      }
    }

    rendered.sort((a, b) => a.depth - b.depth);

    for (const item of rendered) {
      ctx.beginPath();
      item.points.forEach((p, index) => {
        if (index === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();

      ctx.fillStyle = faceFillColor(item.face, item.module);
      ctx.globalAlpha = clamp(alpha * item.visibility, 0, 1);
      ctx.fill();

      ctx.strokeStyle = '#1d1714';
      ctx.lineWidth = 1.35;
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.globalAlpha = 1;
    }
  }

  function drawEdges(alpha, force = false) {
    if ((state.renderMode === 'solid' && !force) || alpha <= 0.001) return;

    const rendered = [];

    for (const module of modules) {
      const moduleAmount = moduleEmergence(module);
      if (moduleAmount <= 0.002) continue;

      for (const edge of module.edges) {
        const visibility = edgeVisibility(edge) * moduleAmount;
        if (visibility <= 0.002) continue;

        const a = projectModulePoint(module, module.vertices[edge.a]);
        const b = projectModulePoint(module, module.vertices[edge.b]);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (dx * dx + dy * dy < 0.25) continue;

        rendered.push({
          edge,
          module,
          a,
          b,
          depth: (a.depth + b.depth) * 0.5,
          visibility,
        });
      }
    }

    rendered.sort((a, b) => a.depth - b.depth);

    for (const item of rendered) {
      const depth = clamp((item.depth + 1.6) / 3.5, 0, 1);

      if (state.renderMode === 'solid-edges') {
        drawLine(
          item.a,
          item.b,
          edgeStrokeColor(item.edge.axis),
          1.28 + depth * 0.34,
          clamp(item.visibility, 0, 1),
        );
        continue;
      }

      const width = 0.72 + depth * 0.52 + (item.edge.axis === 'w' ? 0.14 : 0);
      const lineAlpha = alpha
        * item.visibility
        * 0.82
        * (0.55 + depth * 0.42);

      let color = axisColor(item.edge.axis);
      if (state.colorMode === 'classic') {
        const va = item.module.vertices[item.edge.a];
        const vb = item.module.vertices[item.edge.b];
        color = classicWireColor(
          item.module.regionId,
          (va[0] + vb[0]) * 0.5,
          (va[1] + vb[1]) * 0.5,
        );
      }

      drawLine(
        item.a,
        item.b,
        color,
        width,
        lineAlpha,
      );
    }
  }

  function drawVertices(alpha) {
    if (
      state.renderMode === 'solid'
      || alpha <= 0.001
      || state.zMix < 0.15
    ) return;

    const seen = new Set();
    ctx.fillStyle = state.colorMode === 'axis'
      ? 'rgba(248,248,245,.86)'
      : 'rgba(245,239,225,.70)';

    for (const module of modules) {
      const moduleAmount = moduleEmergence(module);
      if (moduleAmount <= 0.002) continue;

      for (const vertex of module.vertices) {
        const p = projectModulePoint(module, vertex);
        const key = Math.round(p.x * 2) + ':' + Math.round(p.y * 2);
        if (seen.has(key)) continue;
        seen.add(key);

        ctx.globalAlpha = alpha
          * moduleAmount
          * (0.2 + state.wMix * 0.13);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 0.95, 0, TAU);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
  }

  function drawScene() {
    ctx.clearRect(0, 0, state.width, state.height);

    const radius = Math.min(state.width, state.height) * 0.38;
    const glow = ctx.createRadialGradient(
      state.width * 0.47,
      state.height * 0.48,
      0,
      state.width * 0.47,
      state.height * 0.48,
      radius,
    );
    glow.addColorStop(0, 'rgba(105,116,136,.055)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const zReveal = zConstructionReveal();
    const wReveal = wConstructionReveal();

    // The 2D source behaves like a construction drawing: its filled regions
    // fade first, while its lines remain long enough to show exactly where the
    // new edges and surfaces originate.
    const planFaceAlpha =
      1 - smoother(clamp((state.zMix - 0.14) / 0.48, 0, 1));
    const planEdgeAlpha =
      1 - smoother(clamp((state.zMix - 0.58) / 0.42, 0, 1));

    drawPlanFaces(planFaceAlpha);
    drawPlanEdges(planEdgeAlpha);

    // Surfaces first appear translucent, then become fully opaque solids.
    // This gives the morph a readable edge → face → solid progression.
    const surfaceAlpha = zReveal.faces * (0.18 + zReveal.solid * 0.82);
    const solidHandled = drawSolidLayer(surfaceAlpha);
    if (!solidHandled) drawFaces(surfaceAlpha);

    // In Solid mode show a temporary construction scaffold during a
    // dimensional transition. This makes 2D→3D read as line→surface→solid and
    // 3D→4D as W-edge→bridge-face→hyper-shell instead of a camera trick.
    let scaffoldAlpha = 0;
    if (state.transition) {
      const from = state.transition.fromDimension;
      const to = state.transition.toDimension;

      if ((from === 2 && to === 3) || (from === 3 && to === 2)) {
        scaffoldAlpha = zReveal.edges * (1 - zReveal.solid * 0.72);
      } else if ((from === 3 && to === 4) || (from === 4 && to === 3)) {
        scaffoldAlpha = wReveal.edges * (1 - wReveal.shell * 0.58);
      }
    }

    if (state.renderMode === 'solid' && scaffoldAlpha > 0.001) {
      drawEdges(scaffoldAlpha, true);
    } else {
      drawEdges(Math.max(zReveal.edges, wReveal.edges));
    }

    drawVertices(Math.max(zReveal.edges, wReveal.edges));
  }

  function drawPreviewToCanvas(previewCanvas) {
    if (!previewCanvas) return;

    const previewCtx = previewCanvas.getContext('2d');
    const rect = previewCanvas.getBoundingClientRect();
    const computedStyle = getComputedStyle(previewCanvas);
    const fallbackWidth = parseFloat(computedStyle.width) || 72;
    const fallbackHeight = parseFloat(computedStyle.height) || fallbackWidth;
    const width = Math.max(1, rect.width || fallbackWidth);
    const height = Math.max(1, rect.height || fallbackHeight);
    const previewDpr = Math.min(devicePixelRatio || 1, 2);
    const pixelWidth = Math.max(1, Math.round(width * previewDpr));
    const pixelHeight = Math.max(1, Math.round(height * previewDpr));

    if (
      previewCanvas.width !== pixelWidth
      || previewCanvas.height !== pixelHeight
    ) {
      previewCanvas.width = pixelWidth;
      previewCanvas.height = pixelHeight;
    }

    previewCtx.setTransform(previewDpr, 0, 0, previewDpr, 0, 0);
    previewCtx.clearRect(0, 0, width, height);

    if (!planEdges.length) return;

    const points = [];
    for (const edge of planEdges) points.push(edge.a, edge.b);
    for (const face of planFaces) points.push(...face);

    const minX = Math.min(...points.map((p) => p[0]));
    const maxX = Math.max(...points.map((p) => p[0]));
    const minY = Math.min(...points.map((p) => p[1]));
    const maxY = Math.max(...points.map((p) => p[1]));

    // All current plans are authored around (0, 0). Keep that invariant
    // exactly at the visual center instead of centering the raw bounding box.
    // This prevents gates, stairs, intersections, or other asymmetric detail
    // from pulling a preview sideways.
    const halfSpanX = Math.max(0.005, Math.abs(minX), Math.abs(maxX));
    const halfSpanY = Math.max(0.005, Math.abs(minY), Math.abs(maxY));
    const padding = Math.max(
      4,
      Math.min(10, Math.min(width, height) * 0.11),
    );
    const scale = Math.min(
      Math.max(1, width - padding * 2) / (halfSpanX * 2),
      Math.max(1, height - padding * 2) / (halfSpanY * 2),
    );

    const map = (p) => ({
      x: width * 0.5 + p[0] * scale,
      y: height * 0.5 + p[1] * scale,
    });

    const sortedFaces = [...planFaces].sort((a, b) => {
      const orderA = a.paintOrder ?? 0;
      const orderB = b.paintOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return rawPolygonArea(b) - rawPolygonArea(a);
    });

    for (const face of sortedFaces) {
      const projected = face.map(map);
      previewCtx.beginPath();
      projected.forEach((p, index) => {
        if (index === 0) previewCtx.moveTo(p.x, p.y);
        else previewCtx.lineTo(p.x, p.y);
      });
      previewCtx.closePath();
      previewCtx.fillStyle = state.colorMode === 'classic'
        ? classicPlanColor(face)
        : 'rgba(225,218,201,.055)';
      previewCtx.globalAlpha = state.colorMode === 'classic' ? 0.92 : 1;
      previewCtx.fill();

      if (state.colorMode === 'classic') {
        previewCtx.globalAlpha = 0.96;
        previewCtx.strokeStyle = '#1d1714';
        previewCtx.lineWidth = 1.1;
        previewCtx.lineJoin = 'round';
        previewCtx.stroke();
      }

      previewCtx.globalAlpha = 1;
    }

    previewCtx.lineCap = 'round';
    previewCtx.lineJoin = 'round';
    previewCtx.strokeStyle = state.colorMode === 'classic'
      ? '#1d1714'
      : 'rgba(240,237,228,.80)';
    previewCtx.lineWidth = state.colorMode === 'classic' ? 1.05 : 1;

    for (const edge of planEdges) {
      if (edge.detail) continue;
      const a = map(edge.a);
      const b = map(edge.b);
      previewCtx.beginPath();
      previewCtx.moveTo(a.x, a.y);
      previewCtx.lineTo(b.x, b.y);
      previewCtx.stroke();
    }

    previewCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function drawAllPreviews() {
    const selectedPreset = state.preset;

    for (const preset of [
      'square',
      'sriyantra',
      'kaliyantra',
      'matangiyantra',
      'hex',
      'stupa',
      'borobudur',
      'castel',
      'kukulkan',
      'lalibela',
    ]) {
      state.preset = preset;
      buildPlanForPreset();
      drawPreviewToCanvas(previewCanvases[preset]);
    }

    state.preset = selectedPreset;
    buildPlanForPreset();
  }

  function schedulePreviewRedraw() {
    if (previewResizeFrame) cancelAnimationFrame(previewResizeFrame);
    previewResizeFrame = requestAnimationFrame(() => {
      previewResizeFrame = 0;
      drawAllPreviews();
    });
  }

  function basisPoint(source) {
    const p4 = transform4D(source, false);
    return cameraTransform(project4Dto3D(p4));
  }

  function drawBasis() {
    const width = basisCanvas.width;
    const height = basisCanvas.height;
    basisCtx.clearRect(0, 0, width, height);

    const axes = [
      { label: 'X', vector: [0.8,0,0,0], color: COLORS.x, min: 2 },
      { label: 'Y', vector: [0,0.8,0,0], color: COLORS.y, min: 2 },
      { label: 'Z', vector: [0,0,0.8,0], color: COLORS.z, min: 3 },
      { label: 'W', vector: [0,0,0,0.8], color: COLORS.w, min: 4 },
    ];

    const active = axes.filter((axis) => (
      axis.min === 2
      || (axis.min === 3 && state.zMix > 0.025)
      || (axis.min === 4 && state.wMix > 0.025)
    ));

    const points = active.map((axis) => ({ axis, p: basisPoint(axis.vector) }));
    let max = 0.01;
    for (const item of points) max = Math.max(max, Math.hypot(item.p[0], item.p[1]));

    const scale = 45 / max;
    const ox = width / 2;
    const oy = height / 2;

    basisCtx.lineCap = 'round';

    for (const item of points) {
      const x = ox + item.p[0] * scale;
      const y = oy + item.p[1] * scale;

      basisCtx.beginPath();
      basisCtx.moveTo(ox, oy);
      basisCtx.lineTo(x, y);
      basisCtx.strokeStyle = item.axis.color;
      basisCtx.globalAlpha = 0.85;
      basisCtx.lineWidth = 1.6;
      basisCtx.stroke();

      basisCtx.fillStyle = item.axis.color;
      basisCtx.font = '700 10px Inter, sans-serif';
      basisCtx.fillText(item.axis.label, x + 4, y - 3);
    }

    basisCtx.globalAlpha = 0.75;
    basisCtx.fillStyle = '#f5f4ef';
    basisCtx.beginPath();
    basisCtx.arc(ox, oy, 2.1, 0, TAU);
    basisCtx.fill();
    basisCtx.globalAlpha = 1;
  }

  function wrapDegrees(value) {
    return ((value + 180) % 360 + 360) % 360 - 180;
  }

  function syncRotationControl(key) {
    const ui = rotationUI[key];
    if (!ui) return;
    ui.input.value = String(state.rotations[key]);
    ui.value.textContent = Math.round(state.rotations[key]) + '°';
  }

  function setRotationValue(key, value) {
    state.rotations[key] = wrapDegrees(value);
    syncRotationControl(key);
    markSettingsDirty();
  }

  function stopAutorotation(key) {
    if (!state.auto[key]) return;
    state.auto[key] = false;
    markSettingsDirty();
    const ui = rotationUI[key];
    if (ui) ui.auto.setAttribute('aria-pressed', 'false');
  }

  function installTouchRangeGuard(input, applyValue) {
    let gesture = null;
    const threshold = 8;
    const directionBias = 1.12;

    function restoreStartValue() {
      if (!gesture) return;
      input.value = gesture.startValue;
      applyValue(Number(gesture.startValue), false);
    }

    input.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch') return;

      gesture = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startValue: input.value,
        mode: 'pending',
      };
      input.classList.add('is-touch-pending');
    });

    input.addEventListener('pointermove', (event) => {
      if (!gesture || event.pointerId !== gesture.pointerId) return;

      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);

      if (gesture.mode === 'pending') {
        if (Math.max(ax, ay) < threshold) return;

        if (ay > ax * directionBias) {
          gesture.mode = 'scroll';
          input.classList.remove('is-touch-pending');
          input.classList.add('is-touch-scrolling');
          restoreStartValue();
          return;
        }

        if (ax > ay * directionBias) {
          gesture.mode = 'adjust';
          input.classList.remove('is-touch-pending');
          input.classList.add('is-touch-adjusting');
        }
      }

      if (gesture.mode === 'scroll') {
        restoreStartValue();
      }
    });

    input.addEventListener('input', () => {
      if (gesture && gesture.mode !== 'adjust') {
        restoreStartValue();
        return;
      }

      applyValue(Number(input.value), true);
    });

    function finishGesture(event) {
      if (!gesture || event.pointerId !== gesture.pointerId) return;

      if (gesture.mode !== 'adjust') {
        restoreStartValue();
      }

      gesture = null;
      input.classList.remove(
        'is-touch-pending',
        'is-touch-scrolling',
        'is-touch-adjusting',
      );
    }

    input.addEventListener('pointerup', finishGesture);
    input.addEventListener('pointercancel', finishGesture);
    input.addEventListener('lostpointercapture', (event) => {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      finishGesture(event);
    });
  }

  function createRotationControls() {
    for (const config of ROTATION_CONFIG) {
      const row = document.createElement('div');
      row.className = 'control-row';
      row.style.setProperty('--axis-color', config.color);

      const label = document.createElement('span');
      label.className = 'control-row__label';
      label.textContent = config.label;
      label.title = 'Rotate the object in the ' + config.label + ' coordinate plane';

      const input = document.createElement('input');
      input.type = 'range';
      input.min = '-180';
      input.max = '180';
      input.step = '1';
      input.value = '0';
      input.setAttribute('aria-label', 'Rotate in ' + config.label + ' plane');

      const value = document.createElement('span');
      value.className = 'control-row__value';
      value.textContent = '0°';

      const auto = document.createElement('button');
      auto.type = 'button';
      auto.className = 'auto-toggle';
      auto.textContent = 'A';
      auto.setAttribute('aria-label', 'Autorotate ' + config.label);
      auto.setAttribute('aria-pressed', 'false');

      installTouchRangeGuard(input, (nextValue, interactive) => {
        state.rotations[config.key] = nextValue;
        value.textContent = Math.round(state.rotations[config.key]) + '°';
        if (interactive) {
          markSettingsDirty();
          hideHint();
        }
      });

      auto.addEventListener('click', () => {
        state.auto[config.key] = !state.auto[config.key];
        auto.setAttribute('aria-pressed', String(state.auto[config.key]));
        markSettingsDirty();
        hideHint();
      });

      row.append(label, input, value, auto);
      rotationRows.append(row);

      rotationUI[config.key] = {
        row,
        input,
        value,
        auto,
        config,
      };
    }
  }

  function createScaleControls() {
    for (const config of SCALE_CONFIG) {
      const row = document.createElement('div');
      row.className = 'control-row';
      row.style.setProperty('--axis-color', config.color);

      const label = document.createElement('span');
      label.className = 'control-row__label';
      label.textContent = config.label;
      label.title =
        config.key === 'x' ? 'Stretch the X direction of the mandala plan'
        : config.key === 'y' ? 'Stretch the Y direction of the mandala plan'
        : config.key === 'z' ? 'Stretch or collapse the added 3D depth; 0 collapses toward 2D'
        : 'Stretch or collapse the fourth dimension; 0 collapses toward 3D';

      const input = document.createElement('input');
      input.type = 'range';
      input.min = '0';
      input.max = '1.4';
      input.step = '0.02';
      input.value = '1';
      input.setAttribute(
        'aria-label',
        'Dimension stretch ' + config.label + ': 1 normal, 0 collapsed',
      );
      input.title = label.title;

      const value = document.createElement('span');
      value.className = 'control-row__value';
      value.textContent = '×1.00';

      installTouchRangeGuard(input, (nextValue, interactive) => {
        state.scales[config.key] = nextValue;
        value.textContent = '×' + state.scales[config.key].toFixed(2);
        if (interactive) {
          markSettingsDirty();
          hideHint();
        }
      });

      row.append(label, input, value);
      scaleRows.append(row);

      scaleUI[config.key] = {
        row,
        input,
        value,
        config,
      };
    }
  }

  function setProjection(mode) {
    if (!['perspective', 'orthographic', 'isometric'].includes(mode)) return;
    state.projection = mode;
    markSettingsDirty();
    projectionButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.projection === mode);
    });
  }

  function setColorMode(mode) {
    if (!['form', 'axis', 'classic'].includes(mode)) return;
    state.colorMode = mode;
    markSettingsDirty();

    colorButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.color === mode);
    });
  }

  function setRenderMode(mode) {
    if (!['wire','solid','solid-edges'].includes(mode)) return;
    state.renderMode = mode;
    markSettingsDirty();
    renderButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.render === mode);
    });
  }

  function startStage(target) {
    const fromZ = state.zMix;
    const fromW = state.wMix;
    const toZ = target >= 3 ? 1 : 0;
    const toW = target >= 4 ? 1 : 0;

    state.transitionDirection = target > state.dimension ? 1 : -1;
    state.transition = {
      fromDimension: state.dimension,
      toDimension: target,
      fromZ,
      fromW,
      toZ,
      toW,
      start: performance.now(),
      progress: 0,
      duration: reducedMotion ? 80 : 2150,
    };
  }

  

  

  function requestDimension(target) {
    target = Number(target);
    if (![2,3,4].includes(target) || state.transition || target === state.dimension) return;

    state.requestedDimension = target;

    if (state.dimension === 2 && target === 4) state.queue = [3,4];
    else if (state.dimension === 4 && target === 2) state.queue = [3,2];
    else state.queue = [target];

    startStage(state.queue.shift());
    hideHint();
  }

  function completeStage() {
    state.dimension = state.transition.toDimension;
    state.zMix = state.transition.toZ;
    state.wMix = state.transition.toW;
    state.transition = null;

    if (state.queue.length) {
      startStage(state.queue.shift());
    } else {
      state.requestedDimension = state.dimension;
      markSettingsDirty();
    }
  }

  function updateTransition(now) {
    if (!state.transition) return;

    const t = clamp(
      (now - state.transition.start) / state.transition.duration,
      0,
      1,
    );
    state.transition.progress = t;

    const from = state.transition.fromDimension;
    const to = state.transition.toDimension;

    if (from === 2 && to === 3) {
      // Build depth first; reserve the end of the transition for the final
      // viewpoint/orientation settling.
      state.zMix = smoother(clamp(t / 0.80, 0, 1));
      state.wMix = 0;
    } else if (from === 3 && to === 2) {
      // Reverse the visual grammar: settle toward plan view, then collapse.
      state.zMix = 1 - smoother(clamp((t - 0.14) / 0.86, 0, 1));
      state.wMix = 0;
    } else if (from === 3 && to === 4) {
      state.zMix = 1;
      state.wMix = smoother(clamp(t / 0.82, 0, 1));
    } else if (from === 4 && to === 3) {
      state.zMix = 1;
      state.wMix = 1 - smoother(clamp((t - 0.12) / 0.88, 0, 1));
    } else {
      const e = smoother(t);
      state.zMix = mix(state.transition.fromZ, state.transition.toZ, e);
      state.wMix = mix(state.transition.fromW, state.transition.toW, e);
    }

    if (t >= 1) completeStage();
  }

  function effectiveDimension() {
    if (!state.transition) return state.dimension;
    return Math.max(
      state.transition.fromDimension,
      state.transition.toDimension,
    );
  }

  function updateControlAvailability() {
    const dim = effectiveDimension();
    const locked = Boolean(state.transition);

    for (const config of ROTATION_CONFIG) {
      const ui = rotationUI[config.key];
      const enabled = dim >= config.minDim && !locked;
      ui.input.disabled = !enabled;
      ui.auto.disabled = !enabled;
      ui.row.classList.toggle('is-disabled', !enabled);
    }

    for (const config of SCALE_CONFIG) {
      const ui = scaleUI[config.key];
      const enabled = dim >= config.minDim && !locked;
      ui.input.disabled = !enabled;
      ui.row.classList.toggle('is-disabled', !enabled);
    }

    const meta = PRESET_META[state.preset] || PRESET_META.square;
    const zLiftEnabled = meta.kind !== 'architecture' && !locked;
    zLiftButtons.forEach((button) => {
      button.disabled = !zLiftEnabled;
      button.title = zLiftEnabled
        ? (
          button.dataset.zlift === 'mirror'
            ? 'Experimental reflection-symmetric Z lift'
            : 'Single outer-to-inner hierarchy spanning the Z axis'
        )
        : 'Architecture keeps its intrinsic vertical orientation';
    });
  }

  function updateUI() {
    const meta = PRESET_META[state.preset] || PRESET_META.square;

    if (state.transition) {
      const from = state.transition.fromDimension;
      const to = state.transition.toDimension;
      const t = transitionProgress();

      dimensionValue.textContent = from + 'D → ' + to + 'D';

      if (from === 2 && to === 3) {
        dimensionStatus.textContent =
          t < 0.34 ? 'lifting edges'
          : t < 0.72 ? 'forming surfaces'
          : 'forming solid';
      } else if (from === 3 && to === 2) {
        dimensionStatus.textContent =
          t < 0.30 ? 'settling view'
          : t < 0.74 ? 'collapsing surfaces'
          : 'returning to plan';
      } else if (from === 3 && to === 4) {
        dimensionStatus.textContent =
          t < 0.34 ? 'extending W edges'
          : t < 0.72 ? 'forming hyperfaces'
          : 'forming hyperform';
      } else if (from === 4 && to === 3) {
        dimensionStatus.textContent =
          t < 0.30 ? 'settling projection'
          : t < 0.74 ? 'collapsing hyperfaces'
          : 'returning to form';
      } else {
        dimensionStatus.textContent = 'transforming';
      }
    } else {
      dimensionValue.textContent = state.dimension + 'D';

      if (state.dimension === 2) {
        dimensionStatus.textContent = meta.plan;
      } else if (state.dimension === 3) {
        dimensionStatus.textContent = meta.spatial;
      } else {
        dimensionStatus.textContent =
          meta.kind === 'architecture'
            ? '4D architectural projection'
            : '4D geometric hyperform';
      }
    }

    dimensionButtons.forEach((button) => {
      const d = Number(button.dataset.dimension);
      const locked = Boolean(state.transition);
      button.classList.toggle('is-active', !locked && d === state.dimension);
      button.classList.toggle(
        'is-target',
        state.requestedDimension === d && d !== state.dimension,
      );
      button.disabled = locked;
    });

    updateControlAvailability();
  }

  function resetAll() {
    state.dimension = 2;
    state.requestedDimension = 2;
    state.queue = [];
    state.transition = null;
    state.transitionDirection = 0;
    state.zMix = 0;
    state.wMix = 0;

    state.preset = 'square';
    state.complexity = 'complex';
    state.spacingStyle = 'compact';
    state.zLiftStyle = 'hierarchy';

    state.projection = 'perspective';
    state.colorMode = 'classic';
    state.renderMode = 'solid';

    state.rotations = { xw: 0, yw: 0, zw: 0, xy: 0, xz: 0, yz: 0 };
    state.auto = { xw: false, yw: false, zw: false, xy: false, xz: false, yz: false };
    state.scales = { x: 1, y: 1, z: 1, w: 1 };
    state.cameraYaw = -0.62;
    state.cameraPitch = 0.58;
    state.zoom = 1;

    restoredDockCollapsed = false;
    syncSettingsUI();
    buildActiveMandala();
    updateUI();

    markSettingsDirty();
    persistSettings(true);
  }

  function updateAutorotation(dt) {
    // A dimensional morph must describe the geometry itself. Autorotation
    // would turn it back into a moving-camera/object animation, so pause it
    // temporarily without changing the user's autorotation toggles.
    if (state.transition) return;

    let changed = false;

    for (const config of ROTATION_CONFIG) {
      if (!state.auto[config.key] || effectiveDimension() < config.minDim) continue;

      let next = state.rotations[config.key] + dt * 28;
      if (next > 180) next -= 360;

      state.rotations[config.key] = next;
      changed = true;

      const ui = rotationUI[config.key];
      ui.input.value = String(next);
      ui.value.textContent = Math.round(next) + '°';
    }

    if (changed) markSettingsDirty();
  }

  function resize() {
    const mobileViewport = isMobileLayout() ? window.visualViewport : null;
    state.width = Math.max(1, Math.round(mobileViewport?.width || innerWidth));
    state.height = Math.max(1, Math.round(mobileViewport?.height || innerHeight));
    state.viewTopInset = isMobileLayout() ? 48 : 0;
    const dprCap = coarsePointerQuery.matches ? 1.75 : 2;
    state.dpr = Math.min(devicePixelRatio || 1, dprCap);

    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    canvas.style.width = state.width + 'px';
    canvas.style.height = state.height + 'px';

    solidCanvas.width = Math.round(state.width * state.dpr);
    solidCanvas.height = Math.round(state.height * state.dpr);
    solidCanvas.style.width = state.width + 'px';
    solidCanvas.style.height = state.height + 'px';

    if (gl) gl.viewport(0, 0, solidCanvas.width, solidCanvas.height);

    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    requestAnimationFrame(updateMobileStageInset);
    schedulePreviewRedraw();
  }

  function hideHint() {
    hint.classList.add('is-hidden');
  }

  function isMobileLayout() {
    return mobileLayoutQuery.matches;
  }

  function updateMobileStageInset() {
    if (!isMobileLayout()) {
      state.viewBottomInset = 0;
      return;
    }

    const tabsRect = document.querySelector('.mobile-panel-switcher')?.getBoundingClientRect();
    const activePanel = mobilePanel === 'controls'
      ? explorerControls
      : geometricFormsDock;
    const panelRect = activePanel?.getBoundingClientRect();

    const stageBottom = Math.min(
      tabsRect?.top ?? state.height,
      panelRect?.top ?? state.height,
    );

    state.viewBottomInset = Math.max(
      0,
      Math.min(state.height - 120, state.height - stageBottom + 6),
    );
  }

  function syncMobilePanels() {
    const mobile = isMobileLayout();
    if (mobile && !mobilePanel) mobilePanel = 'forms';

    const formsOpen = mobile && mobilePanel === 'forms';
    const controlsOpen = mobile && mobilePanel === 'controls';

    geometricFormsDock?.classList.toggle('is-mobile-open', formsOpen);
    explorerControls?.classList.toggle('is-mobile-open', controlsOpen);
    mobileFormsButton?.classList.toggle('is-active', formsOpen);
    mobileControlsButton?.classList.toggle('is-active', controlsOpen);

    mobileFormsButton?.setAttribute('aria-expanded', String(formsOpen));
    mobileControlsButton?.setAttribute('aria-expanded', String(controlsOpen));

    if (mobile) {
      geometricFormsDock?.setAttribute('aria-hidden', String(!formsOpen));
      explorerControls?.setAttribute('aria-hidden', String(!controlsOpen));
    } else {
      geometricFormsDock?.removeAttribute('aria-hidden');
      explorerControls?.removeAttribute('aria-hidden');
      geometricFormsDock?.classList.remove('is-mobile-open');
      explorerControls?.classList.remove('is-mobile-open');
    }

    requestAnimationFrame(updateMobileStageInset);
  }

  function setMobilePanel(panel) {
    if (!isMobileLayout()) return;
    mobilePanel = panel;
    syncMobilePanels();
    hideHint();
  }

  function closeMobilePanels() {
    if (!isMobileLayout()) return;
    mobilePanel = 'forms';
    syncMobilePanels();
  }

  function syncInteractionHint() {
    if (coarsePointerQuery.matches || isMobileLayout()) {
      hint.textContent = 'drag to rotate · pinch to zoom';
    } else {
      hint.textContent = 'drag: XY in 2D · spin + tilt in 3D/4D · shift-drag: pure XY · scroll: zoom';
    }
  }

  function rebuildFromChoice(buttons, button, stateKey, dataKey) {
    if (state.transition) return;

    state[stateKey] = button.dataset[dataKey];
    buttons.forEach((item) => {
      item.classList.toggle('is-active', item === button);
    });

    buildActiveMandala();
    markSettingsDirty();
    hideHint();
  }

  dimensionButtons.forEach((button) => {
    button.addEventListener('click', () => requestDimension(button.dataset.dimension));
  });

  projectionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setProjection(button.dataset.projection);
      hideHint();
    });
  });

  colorButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setColorMode(button.dataset.color);
      hideHint();
    });
  });

  renderButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setRenderMode(button.dataset.render);
      hideHint();
    });
  });

  presetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      rebuildFromChoice(
        presetButtons,
        button,
        'preset',
        'preset',
      );
    });
  });

  complexityButtons.forEach((button) => {
    button.addEventListener('click', () => {
      rebuildFromChoice(
        complexityButtons,
        button,
        'complexity',
        'complexity',
      );
    });
  });

  spacingButtons.forEach((button) => {
    button.addEventListener('click', () => {
      rebuildFromChoice(
        spacingButtons,
        button,
        'spacingStyle',
        'spacing',
      );
    });
  });

  zLiftButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      rebuildFromChoice(
        zLiftButtons,
        button,
        'zLiftStyle',
        'zlift',
      );
    });
  });

  resetAllButton.addEventListener('click', () => {
    resetAll();
    hideHint();
  });

  toggleGeometricForms?.addEventListener('click', () => {
    if (isMobileLayout()) {
      closeMobilePanels();
      return;
    }

    const collapsed = geometricFormsDock.classList.toggle('is-collapsed');
    toggleGeometricForms.setAttribute('aria-expanded', String(!collapsed));
    restoredDockCollapsed = collapsed;
    toggleGeometricForms.title = collapsed
      ? 'Expand geometric forms'
      : 'Collapse geometric forms';
    markSettingsDirty();
  });

  mobileFormsButton?.addEventListener('click', () => setMobilePanel('forms'));
  mobileControlsButton?.addEventListener('click', () => setMobilePanel('controls'));
  mobileFormsClose?.addEventListener('click', closeMobilePanels);
  mobileControlsClose?.addEventListener('click', closeMobilePanels);

  function pointerDistance() {
    const points = [...activePointers.values()];
    if (points.length < 2) return 0;
    return Math.hypot(
      points[0].x - points[1].x,
      points[0].y - points[1].y,
    );
  }

  canvas.addEventListener('pointerdown', (event) => {
    activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (canvas.setPointerCapture) {
      canvas.setPointerCapture(event.pointerId);
    }

    if (activePointers.size === 1) {
      primaryPointerId = event.pointerId;
      state.pointerDown = true;
      state.pointerX = event.clientX;
      state.pointerY = event.clientY;
    } else if (activePointers.size === 2) {
      state.pointerDown = false;
      pinchStartDistance = pointerDistance();
      pinchStartZoom = state.zoom;
    }

    hideHint();
  });

  canvas.addEventListener('pointermove', (event) => {
    const previous = activePointers.get(event.pointerId);
    if (!previous) return;

    activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (state.transition) return;

    if (activePointers.size >= 2) {
      const distance = pointerDistance();
      if (pinchStartDistance > 0 && distance > 0) {
        state.zoom = clamp(
          pinchStartZoom * (distance / pinchStartDistance),
          0.55,
          1.9,
        );
        markSettingsDirty();
      }
      return;
    }

    if (!state.pointerDown || event.pointerId !== primaryPointerId) return;

    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;

    state.pointerX = event.clientX;
    state.pointerY = event.clientY;

    if (state.dimension === 2) {
      stopAutorotation('xy');
      setRotationValue('xy', state.rotations.xy + dx * 0.42);
      return;
    }

    if (event.shiftKey) {
      stopAutorotation('xy');
      setRotationValue('xy', state.rotations.xy + dx * 0.42);
      return;
    }

    // Trackball-like object gesture. Horizontal motion now includes an
    // XY spin as well as XZ tilt, so XY remains directly responsive in
    // 3D/4D instead of being hidden behind Shift-drag only.
    stopAutorotation('xy');
    stopAutorotation('xz');
    stopAutorotation('yz');
    setRotationValue('xy', state.rotations.xy + dx * 0.18);
    setRotationValue('xz', state.rotations.xz + dx * 0.24);
    setRotationValue('yz', state.rotations.yz + dy * 0.34);
  });

  function pointerUp(event) {
    activePointers.delete(event.pointerId);

    if (canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    if (activePointers.size >= 2) {
      primaryPointerId = null;
      state.pointerDown = false;
      pinchStartDistance = pointerDistance();
      pinchStartZoom = state.zoom;
    } else if (activePointers.size === 1) {
      const [remainingId, remainingPoint] = activePointers.entries().next().value;
      primaryPointerId = remainingId;
      state.pointerDown = true;
      state.pointerX = remainingPoint.x;
      state.pointerY = remainingPoint.y;
      pinchStartDistance = 0;
      pinchStartZoom = state.zoom;
    } else {
      primaryPointerId = null;
      state.pointerDown = false;
      pinchStartDistance = 0;
      pinchStartZoom = state.zoom;
    }
  }

  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    state.zoom = clamp(
      state.zoom * Math.exp(-event.deltaY * 0.001),
      0.55,
      1.9,
    );
    markSettingsDirty();
    hideHint();
  }, { passive: false });

  canvas.addEventListener('dblclick', () => {
    setRotationValue('xy', 0);
    setRotationValue('xz', 0);
    setRotationValue('yz', 0);
    state.cameraYaw = -0.62;
    state.cameraPitch = 0.58;
    state.zoom = 1;
    markSettingsDirty();
  });

  window.addEventListener('resize', () => {
    resize();
    syncMobilePanels();
  }, { passive: true });
  window.visualViewport?.addEventListener('resize', resize, { passive: true });
  mobileLayoutQuery.addEventListener?.('change', () => {
    mobilePanel = isMobileLayout() ? 'forms' : null;
    syncMobilePanels();
    syncInteractionHint();
    resize();
  });
  coarsePointerQuery.addEventListener?.('change', () => {
    syncInteractionHint();
    resize();
  });
  window.addEventListener('pagehide', () => persistSettings(true));

  window.addEventListener('keydown', (event) => {
    if (
      event.target instanceof HTMLInputElement
      || event.target instanceof HTMLButtonElement
    ) return;

    if (event.key === '2' || event.key === '3' || event.key === '4') {
      requestDimension(Number(event.key));
    }

    if (event.key.toLowerCase() === 'r') resetAll();
  });

  function tick(now) {
    const dt = Math.min(0.05, (now - state.lastTime) / 1000);
    state.lastTime = now;

    updateTransition(now);
    updateAutorotation(dt);
    updateUI();
    drawScene();
    drawBasis();
    persistSettings(false);

    requestAnimationFrame(tick);
  }

  createRotationControls();
  createScaleControls();
  restoreSettings();
  syncSettingsUI();
  buildActiveMandala();
  syncInteractionHint();
  syncMobilePanels();
  resize();
  updateUI();
  requestAnimationFrame(tick);

  setTimeout(() => hint.classList.add('is-hidden'), 6500);
})();
