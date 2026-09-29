/*
 * Hypermandala — dimensional mandala explorer.
 * 2D plans expand into 3D primitive structures and symmetric 4D W-extrusions.
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

  const canvas = document.getElementById('mandala');
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  const basisCanvas = document.getElementById('basisCanvas');
  const basisCtx = basisCanvas.getContext('2d');
  const previewCanvases = {
    square: document.getElementById('previewSquare'),
    yantra: document.getElementById('previewYantra'),
    hex: document.getElementById('previewHex'),
  };

  const dimensionValue = document.getElementById('dimensionValue');
  const dimensionStatus = document.getElementById('dimensionStatus');
  const hint = document.getElementById('hint');
  const resetAllButton = document.getElementById('resetAll');

  const dimensionButtons = [...document.querySelectorAll('[data-dimension]')];
  const projectionButtons = [...document.querySelectorAll('[data-projection]')];
  const colorButtons = [...document.querySelectorAll('[data-color]')];
  const renderButtons = [...document.querySelectorAll('[data-render]')];
  const presetButtons = [...document.querySelectorAll('[data-preset]')];
  const complexityButtons = [...document.querySelectorAll('[data-complexity]')];
  const formButtons = [...document.querySelectorAll('[data-form]')];

  const rotationRows = document.getElementById('rotationRows');
  const scaleRows = document.getElementById('scaleRows');

  const TAU = Math.PI * 2;
  const RAD = Math.PI / 180;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  const SRI_CHAKRA_COLORS = [
    '#b92f2f',
    '#f3efe5',
    '#c7473d',
    '#315aa5',
    '#bd4136',
    '#355aa0',
    '#c94b40',
    '#4968aa',
    '#d7ad39',
  ];

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

  const state = {
    dimension: 2,
    requestedDimension: 2,
    queue: [],
    transition: null,
    zMix: 0,
    wMix: 0,

    preset: 'square',
    complexity: 'simple',
    formStyle: 'symmetric',

    projection: 'perspective',
    colorMode: 'form',
    renderMode: 'wire',

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
    dpr: 1,
    lastTime: performance.now(),
    transitionDirection: 0,
  };

  const modules = [];
  const planEdges = [];
  const planFaces = [];
  const planEdgeKeys = new Set();
  const planFaceKeys = new Set();
  const rotationUI = {};
  const scaleUI = {};
  const geometryStats = { maxPlanRadius: 1 };

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

  function sriChakraBandColor(radiusNorm) {
    const band = Math.min(
      SRI_CHAKRA_COLORS.length - 1,
      Math.floor(clamp(radiusNorm, 0, 0.9999) * SRI_CHAKRA_COLORS.length),
    );
    return hexToRgb(SRI_CHAKRA_COLORS[band]);
  }

  function tibetanDirectionalColor(x, y, centroidRadiusNorm) {
    if (centroidRadiusNorm < 0.22) {
      return hexToRgb(TIBETAN_COLORS.center);
    }

    if (Math.abs(y) >= Math.abs(x)) {
      return hexToRgb(y >= 0 ? TIBETAN_COLORS.east : TIBETAN_COLORS.west);
    }
    return hexToRgb(x < 0 ? TIBETAN_COLORS.south : TIBETAN_COLORS.north);
  }

  function classicBaseColor(x, y, bandRadiusNorm, centroidRadiusNorm) {
    if (state.preset === 'yantra') {
      return sriChakraBandColor(bandRadiusNorm);
    }

    return tibetanDirectionalColor(
      x,
      y,
      centroidRadiusNorm ?? bandRadiusNorm,
    );
  }

  function updateGeometryStats() {
    let maxRadius = 0.001;
    for (const module of modules) {
      for (const point of module.vertices) {
        maxRadius = Math.max(maxRadius, Math.hypot(point[0], point[1]));
      }
    }
    geometryStats.maxPlanRadius = maxRadius;
  }

  function rotateXYPoint(x, y, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [x * c - y * s, x * s + y * c];
  }

  function addPlanEdge(a, b, axis) {
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
    });
  }

  function addPlanFace(points) {
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
    planFaces.push(normalized.map((p) => [p[0], p[1], 0, 0]));
  }

  function extrudeTo4D(vertices3, edges3, faces3, wHalf, footprint, planExtra = []) {
    const vertices = [];
    for (const w of [-wHalf, wHalf]) {
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
      });
    }

    modules.push({ vertices, edges, faces });
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

  function addCube(cx, cy, baseZ, size, rotation = 0) {
    const data = cubeData(cx, cy, baseZ, size, rotation);
    extrudeTo4D(
      data.vertices3,
      data.edges3,
      data.faces3,
      size * 0.5,
      data.footprint,
    );
  }

  function addCenteredCube(cx, cy, centerZ, size, rotation = 0) {
    addCube(cx, cy, centerZ - size / 2, size, rotation);
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

  function addPrism(cx, cy, baseZ, radius, sides, height, rotation = 0) {
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
    );
  }

  function addCenteredPrism(cx, cy, centerZ, radius, sides, height, rotation = 0) {
    addPrism(cx, cy, centerZ - height / 2, radius, sides, height, rotation);
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

  function addPolygonPyramid(cx, cy, baseZ, radius, sides, height, rotation = 0) {
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
    );
  }

  function addPyramid(cx, cy, baseZ, size, height, rotation = 0) {
    const radius = size / Math.sqrt(2);
    addPolygonPyramid(cx, cy, baseZ, radius, 4, height, rotation + Math.PI / 4);
  }

  function addBipyramid(cx, cy, centerZ, radius, sides, height, rotation = 0) {
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
    );
  }

  function addSquareBipyramid(cx, cy, centerZ, size, height, rotation = 0) {
    addBipyramid(
      cx,
      cy,
      centerZ,
      size / Math.sqrt(2),
      4,
      height,
      rotation + Math.PI / 4,
    );
  }

  function resetGeometry() {
    modules.length = 0;
    planEdges.length = 0;
    planFaces.length = 0;
    planEdgeKeys.clear();
    planFaceKeys.clear();
  }

  function clearPlan() {
    planEdges.length = 0;
    planFaces.length = 0;
    planEdgeKeys.clear();
    planFaceKeys.clear();
  }

  function addPlanLoop(points, fill = true) {
    if (fill) addPlanFace(points);
    for (let i = 0; i < points.length; i += 1) {
      addPlanEdge(points[i], points[(i + 1) % points.length], 'n');
    }
  }

  function addPlanRegularPolygon(cx, cy, radius, sides, rotation = 0, fill = true) {
    const points = polygonFootprint(cx, cy, radius, sides, rotation);
    addPlanLoop(points, fill);
  }

  function addPlanSquareCell(cx, cy, size, rotation = 0, fill = true) {
    const h = size / 2;
    const points = [
      [-h,-h], [h,-h], [h,h], [-h,h],
    ].map(([x, y]) => {
      const rotated = rotateXYPoint(x, y, rotation);
      return [cx + rotated[0], cy + rotated[1]];
    });
    addPlanLoop(points, fill);
  }

  function addPlanPoint(cx, cy, radius = 0.026) {
    addPlanRegularPolygon(cx, cy, radius, 12, 0, true);
  }

  function buildSquarePlan() {
    clearPlan();
    const size = 0.34;
    const spacing = size;
    const complex = state.complexity === 'complex';

    for (const [gx, gy] of squareBaseCells(complex)) {
      addPlanSquareCell(gx * spacing, gy * spacing, size, 0, true);
    }

    addPlanSquareCell(0, 0, size * 0.72, Math.PI / 4, false);
    if (complex) addPlanSquareCell(0, 0, size * 0.46, 0, false);
  }

  function buildYantraPlan() {
    clearPlan();
    for (const [radius, rotation] of yantraLayerSpecs()) {
      addPlanRegularPolygon(0, 0, radius, 3, rotation, false);
    }
    addPlanPoint(0, 0, 0.028);
  }

  function buildHexPlan() {
    clearPlan();
    for (const [radius, rotation] of hexLayerSpecs()) {
      addPlanRegularPolygon(0, 0, radius, 6, rotation, false);
    }

    const ringRadius = 1.58;
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * TAU;
      addPlanRegularPolygon(
        Math.cos(angle) * ringRadius,
        Math.sin(angle) * ringRadius,
        0.22,
        6,
        Math.PI / 6,
        false,
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
          false,
        );
      }
    }

    addPlanPoint(0, 0);
  }

  function buildPlanForPreset() {
    if (state.preset === 'yantra') buildYantraPlan();
    else if (state.preset === 'hex') buildHexPlan();
    else buildSquarePlan();
  }

  function squareBaseCells(complex) {
    const base = [];
    for (let gx = -2; gx <= 2; gx += 1) {
      for (let gy = -2; gy <= 2; gy += 1) {
        if (complex || Math.abs(gx) + Math.abs(gy) <= 2) {
          base.push([gx, gy]);
        }
      }
    }
    base.push([3,0],[-3,0],[0,3],[0,-3]);
    return base;
  }

  function squareSecondCells(complex) {
    return complex
      ? [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
      : [[0,0],[1,0],[-1,0],[0,1],[0,-1]];
  }

  function buildSquareSymmetric() {
    resetGeometry();
    const complex = state.complexity === 'complex';
    const size = 0.34;
    const spacing = size;

    for (const [gx, gy] of squareBaseCells(complex)) {
      addCenteredCube(gx * spacing, gy * spacing, 0, size, 0);
    }

    const secondZ = 0.48;
    for (const sign of [-1, 1]) {
      for (const [gx, gy] of squareSecondCells(complex)) {
        addCenteredCube(gx * spacing, gy * spacing, sign * secondZ, size, 0);
      }
    }

    const crownZ = 0.96;
    for (const sign of [-1, 1]) {
      addCenteredCube(0, 0, sign * crownZ, size * 0.74, Math.PI / 4);

      const baseZ = sign > 0
        ? crownZ + size * 0.37
        : -crownZ - size * 0.37;

      addPolygonPyramid(
        0,
        0,
        baseZ,
        size * 0.31,
        4,
        sign * size * 0.58,
        Math.PI / 4,
      );
    }
  }

  function buildSquareTemple() {
    resetGeometry();
    const complex = state.complexity === 'complex';
    const size = 0.34;
    const spacing = size;

    for (const [gx, gy] of squareBaseCells(complex)) {
      addCube(gx * spacing, gy * spacing, 0, size, 0);
    }

    for (const [gx, gy] of squareSecondCells(complex)) {
      addCube(gx * spacing, gy * spacing, size, size, 0);
    }

    addCube(0, 0, size * 2, size, 0);
    addPyramid(0, 0, size * 3, size * 0.92, size * 1.02, 0);

    for (const [gx, gy] of [[3,0],[-3,0],[0,3],[0,-3]]) {
      addPyramid(
        gx * spacing,
        gy * spacing,
        size,
        size * 0.70,
        size * 0.64,
        0,
      );
    }
  }

  function yantraLayerSpecs() {
    return state.complexity === 'complex'
      ? [
          [1.46, -Math.PI / 2],
          [1.30,  Math.PI / 2],
          [1.15, -Math.PI / 2],
          [1.00,  Math.PI / 2],
          [0.85, -Math.PI / 2],
          [0.70,  Math.PI / 2],
          [0.56, -Math.PI / 2],
          [0.43,  Math.PI / 2],
          [0.31, -Math.PI / 2],
        ]
      : [
          [1.40, -Math.PI / 2],
          [1.10,  Math.PI / 2],
          [0.82, -Math.PI / 2],
          [0.58,  Math.PI / 2],
          [0.36, -Math.PI / 2],
        ];
  }

  function buildYantraSymmetric() {
    resetGeometry();

    const layers = yantraLayerSpecs();
    const zStep = state.complexity === 'complex' ? 0.23 : 0.30;

    layers.forEach(([radius, rotation], index) => {
      if (index === 0) {
        addCenteredPrism(0, 0, 0, radius, 3, 0.10, rotation);
        return;
      }

      const z = index * zStep;
      const thickness = 0.10;
      addCenteredPrism(0, 0, z, radius, 3, thickness, rotation);
      addCenteredPrism(0, 0, -z, radius, 3, thickness, rotation);
    });

    const innerRadius = layers[layers.length - 1][0] * 0.46;
    addBipyramid(0, 0, 0, innerRadius, 3, 0.20, -Math.PI / 2);
  }

  function buildYantraTemple() {
    resetGeometry();
    const layers = yantraLayerSpecs();

    let zCursor = 0;
    const layerHeight = 0.10;
    const layerGap = 0.035;

    for (const [radius, rotation] of layers) {
      addPrism(
        0,
        0,
        zCursor,
        radius,
        3,
        layerHeight,
        rotation,
      );
      zCursor += layerHeight + layerGap;
    }

    addPolygonPyramid(
      0,
      0,
      zCursor,
      layers[layers.length - 1][0] * 0.46,
      3,
      0.40,
      -Math.PI / 2,
    );
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

  function addHexSatelliteRing(centerZ) {
    const ringRadius = 1.58;
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * TAU;
      addCenteredPrism(
        Math.cos(angle) * ringRadius,
        Math.sin(angle) * ringRadius,
        centerZ,
        0.22,
        6,
        0.18,
        Math.PI / 6,
      );
    }
  }

  function buildHexSymmetric() {
    resetGeometry();

    const layers = hexLayerSpecs();
    const zStep = 0.30;

    layers.forEach(([radius, rotation], index) => {
      if (index === 0) {
        addCenteredPrism(0, 0, 0, radius, 6, 0.10, rotation);
        return;
      }

      const z = index * zStep;
      addCenteredPrism(0, 0, z, radius, 6, 0.11, rotation);
      addCenteredPrism(0, 0, -z, radius, 6, 0.11, rotation);
    });

    const crownRadius = layers[layers.length - 1][0] * 0.55;
    const crownZ = layers.length * zStep + 0.05;

    for (const sign of [-1, 1]) {
      addCenteredPrism(
        0,
        0,
        sign * crownZ,
        crownRadius,
        6,
        0.12,
        Math.PI / 6,
      );
    }

    addHexSatelliteRing(0);

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
          0.13,
          i % 2 ? Math.PI / 6 : 0,
        );
      }
    }
  }

  function buildHexTemple() {
    resetGeometry();

    const layers = hexLayerSpecs();
    let zCursor = 0;
    const layerHeight = 0.12;
    const layerGap = 0.035;

    for (const [radius, rotation] of layers) {
      addPrism(
        0,
        0,
        zCursor,
        radius,
        6,
        layerHeight,
        rotation,
      );
      zCursor += layerHeight + layerGap;
    }

    addPolygonPyramid(
      0,
      0,
      zCursor,
      layers[layers.length - 1][0] * 0.55,
      6,
      0.38,
      Math.PI / 6,
    );

    const ringRadius = 1.58;
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * TAU;
      addPrism(
        Math.cos(angle) * ringRadius,
        Math.sin(angle) * ringRadius,
        0,
        0.22,
        6,
        0.18,
        Math.PI / 6,
      );
    }

    if (state.complexity === 'complex') {
      const outerRadius = 2.02;
      for (let i = 0; i < 12; i += 1) {
        const angle = (i / 12) * TAU + Math.PI / 12;
        addPrism(
          Math.cos(angle) * outerRadius,
          Math.sin(angle) * outerRadius,
          0,
          0.15,
          6,
          0.13,
          i % 2 ? Math.PI / 6 : 0,
        );
      }
    }
  }


  function buildGeometryForCurrentChoice() {
    if (state.preset === 'yantra') {
      if (state.formStyle === 'temple') buildYantraTemple();
      else buildYantraSymmetric();
    } else if (state.preset === 'hex') {
      if (state.formStyle === 'temple') buildHexTemple();
      else buildHexSymmetric();
    } else {
      if (state.formStyle === 'temple') buildSquareTemple();
      else buildSquareSymmetric();
    }
  }

  function buildActiveMandala() {
    buildGeometryForCurrentChoice();
    buildPlanForPreset();
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

  function activeAngle(config) {
    let factor = 1;
    if (config.key.includes('z')) factor *= state.zMix;
    if (config.key.includes('w')) factor *= state.wMix;
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
    p[2] *= sz * state.zMix;
    p[3] *= sw * state.wMix;

    for (const config of ROTATION_CONFIG) {
      rotatePlane(p, config.a, config.b, activeAngle(config));
    }

    return p;
  }

  function project4Dto3D(p) {
    if (state.projection === 'orthographic' || state.wMix < 0.001) {
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

  function cameraTransform(p) {
    let [x, y, z] = p;

    // Let the new dimension visibly separate before the viewpoint tilts.
    // This preserves the feeling that the volume grows out of the 2D mandala.
    const viewMix = smoother(clamp((state.zMix - 0.30) / 0.70, 0, 1));

    const yaw = state.cameraYaw * viewMix;
    let c = Math.cos(yaw);
    let s = Math.sin(yaw);
    let nx = c * x - s * z;
    let nz = s * x + c * z;
    x = nx;
    z = nz;

    const pitch = state.cameraPitch * viewMix;
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
    const factor = cameraZ / Math.max(2.6, cameraZ - p3[2]);
    const scale = Math.min(state.width, state.height) * 0.245 * state.zoom;

    return {
      x: state.width * 0.47 + p3[0] * factor * scale,
      y: state.height * 0.49 + p3[1] * factor * scale,
      depth: p3[2],
      w: p4[3],
    };
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

  function faceVisibility(face) {
    if (face.bridge) return state.wMix;
    if (face.wLayer === 1) return state.wMix;
    return 1;
  }

  function edgeVisibility(edge) {
    if (edge.axis === 'w') return state.wMix;
    if (edge.axis === 'z') return state.zMix;
    if (edge.wLayer === 1) return state.wMix;
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

  function classicFaceColor(face, module, depth) {
    const centroid = faceCentroid(face, module);
    const meanRadius = face.indices.reduce((sum, index) => {
      const point = module.vertices[index];
      return sum + Math.hypot(point[0], point[1]);
    }, 0) / face.indices.length;

    const bandRadiusNorm = clamp(
      meanRadius / geometryStats.maxPlanRadius,
      0,
      1,
    );
    const centroidRadiusNorm = clamp(
      Math.hypot(centroid[0], centroid[1]) / geometryStats.maxPlanRadius,
      0,
      1,
    );

    const base = classicBaseColor(
      centroid[0],
      centroid[1],
      bandRadiusNorm,
      centroidRadiusNorm,
    );

    const orientationShade = CLASSIC_SHADE[face.axis] || 1;
    const depthNorm = clamp((depth + 1.8) / 3.8, 0, 1);

    return rgbCss(
      shadeRgb(
        base,
        orientationShade * (0.94 + depthNorm * 0.10),
      ),
    );
  }

  function faceFillColor(face, module, depth) {
    if (state.colorMode === 'axis') return axisColor(face.axis);
    if (state.colorMode === 'classic') {
      return classicFaceColor(face, module, depth);
    }

    // One neutral material across X/Y/Z/W.
    const normalized = clamp((depth + 1.8) / 3.8, 0, 1);
    const light = 45 + normalized * 9;
    return 'hsl(39 18% ' + light + '%)';
  }

  function classicPlanColor(face) {
    const cx = face.reduce((sum, p) => sum + p[0], 0) / face.length;
    const cy = face.reduce((sum, p) => sum + p[1], 0) / face.length;
    const meanRadius = face.reduce(
      (sum, p) => sum + Math.hypot(p[0], p[1]),
      0,
    ) / face.length;

    const bandRadiusNorm = clamp(
      meanRadius / geometryStats.maxPlanRadius,
      0,
      1,
    );
    const centroidRadiusNorm = clamp(
      Math.hypot(cx, cy) / geometryStats.maxPlanRadius,
      0,
      1,
    );

    return rgbCss(
      classicBaseColor(
        cx,
        cy,
        bandRadiusNorm,
        centroidRadiusNorm,
      ),
    );
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

    const sorted = [...planFaces].sort((a, b) => rawPolygonArea(b) - rawPolygonArea(a));
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
      ctx.globalAlpha = alpha * (state.colorMode === 'classic' ? 0.62 : 0.16);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawPlanEdges(alpha) {
    if (alpha <= 0.001) return;

    for (const edge of planEdges) {
      const a = projectToScreen(edge.a);
      const b = projectToScreen(edge.b);

      let color = axisColor(edge.axis);
      let width = 1.15;

      if (state.colorMode === 'classic') {
        const mx = (edge.a[0] + edge.b[0]) * 0.5;
        const my = (edge.a[1] + edge.b[1]) * 0.5;
        const meanRadius = (
          Math.hypot(edge.a[0], edge.a[1])
          + Math.hypot(edge.b[0], edge.b[1])
        ) * 0.5;

        const bandRadiusNorm = clamp(
          meanRadius / geometryStats.maxPlanRadius,
          0,
          1,
        );
        const centroidRadiusNorm = clamp(
          Math.hypot(mx, my) / geometryStats.maxPlanRadius,
          0,
          1,
        );

        color = rgbCss(
          classicBaseColor(
            mx,
            my,
            bandRadiusNorm,
            centroidRadiusNorm,
          ),
        );
        width = 1.35;
      }

      drawLine(a, b, color, width, alpha * 0.94);
    }
  }

  function drawFaces(alpha) {
    if (state.renderMode === 'wire' || alpha <= 0.001) return;

    const rendered = [];

    for (const module of modules) {
      for (const face of module.faces) {
        const visibility = faceVisibility(face);
        if (visibility <= 0.002) continue;

        const points = face.indices.map((index) => projectToScreen(module.vertices[index]));
        if (Math.abs(polygonArea2D(points)) < 0.45) continue;

        const depth = points.reduce((sum, p) => sum + p.depth, 0) / points.length;
        rendered.push({ face, module, points, depth, visibility });
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

      ctx.fillStyle = faceFillColor(item.face, item.module, item.depth);
      // Solid means solid: avoid cumulative translucent overdraw, which made
      // 4D face projections create false bands and strange colors.
      ctx.globalAlpha = item.visibility >= 0.995
        ? 1
        : clamp(item.visibility * 1.15, 0, 1);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawEdges(alpha) {
    if (state.renderMode === 'solid' || alpha <= 0.001) return;

    const rendered = [];

    for (const module of modules) {
      for (const edge of module.edges) {
        const visibility = edgeVisibility(edge);
        if (visibility <= 0.002) continue;

        const a = projectToScreen(module.vertices[edge.a]);
        const b = projectToScreen(module.vertices[edge.b]);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (dx * dx + dy * dy < 0.25) continue;

        rendered.push({
          edge,
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

      drawLine(
        item.a,
        item.b,
        axisColor(item.edge.axis),
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
      for (const vertex of module.vertices) {
        const p = projectToScreen(vertex);
        const key = Math.round(p.x * 2) + ':' + Math.round(p.y * 2);
        if (seen.has(key)) continue;
        seen.add(key);

        ctx.globalAlpha = alpha * (0.2 + state.wMix * 0.13);
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

    // Keep the originating mandala visible while the new dimension separates.
    // It only fades late in the transition, so the viewer can follow where
    // every emerging volume came from.
    const planFade = smoother(clamp((state.zMix - 0.58) / 0.42, 0, 1));
    const planAlpha = 1 - planFade;

    // Faces arrive after the first geometric separation; edges lead the motion.
    const volumeAlpha = smoother(clamp((state.zMix - 0.08) / 0.92, 0, 1));
    const edgeAlpha = smoother(clamp(state.zMix / 0.82, 0, 1));

    drawPlanFaces(planAlpha);
    drawPlanEdges(planAlpha);

    drawFaces(volumeAlpha);
    drawEdges(edgeAlpha);
    drawVertices(edgeAlpha);
  }

  function drawPreviewToCanvas(previewCanvas) {
    const previewCtx = previewCanvas.getContext('2d');
    const width = previewCanvas.width;
    const height = previewCanvas.height;
    previewCtx.clearRect(0, 0, width, height);

    if (!planEdges.length) return;

    const points = [];
    for (const edge of planEdges) points.push(edge.a, edge.b);

    const minX = Math.min(...points.map((p) => p[0]));
    const maxX = Math.max(...points.map((p) => p[0]));
    const minY = Math.min(...points.map((p) => p[1]));
    const maxY = Math.max(...points.map((p) => p[1]));

    const spanX = Math.max(0.01, maxX - minX);
    const spanY = Math.max(0.01, maxY - minY);
    const scale = Math.min((width - 14) / spanX, (height - 14) / spanY);
    const cx = (minX + maxX) * 0.5;
    const cy = (minY + maxY) * 0.5;

    const map = (p) => ({
      x: width * 0.5 + (p[0] - cx) * scale,
      y: height * 0.5 + (p[1] - cy) * scale,
    });

    const sortedFaces = [...planFaces]
      .sort((a, b) => rawPolygonArea(b) - rawPolygonArea(a));

    for (const face of sortedFaces) {
      const projected = face.map(map);
      previewCtx.beginPath();
      projected.forEach((p, index) => {
        if (index === 0) previewCtx.moveTo(p.x, p.y);
        else previewCtx.lineTo(p.x, p.y);
      });
      previewCtx.closePath();
      previewCtx.fillStyle = 'rgba(225,218,201,.055)';
      previewCtx.fill();
    }

    previewCtx.lineCap = 'round';
    previewCtx.lineJoin = 'round';
    previewCtx.strokeStyle = 'rgba(240,237,228,.80)';
    previewCtx.lineWidth = 1;

    for (const edge of planEdges) {
      const a = map(edge.a);
      const b = map(edge.b);
      previewCtx.beginPath();
      previewCtx.moveTo(a.x, a.y);
      previewCtx.lineTo(b.x, b.y);
      previewCtx.stroke();
    }
  }

  function drawAllPreviews() {
    const selectedPreset = state.preset;

    for (const preset of ['square', 'yantra', 'hex']) {
      state.preset = preset;
      buildGeometryForCurrentChoice();
      buildPlanForPreset();
      drawPreviewToCanvas(previewCanvases[preset]);
    }

    state.preset = selectedPreset;
    buildGeometryForCurrentChoice();
    buildPlanForPreset();
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

  function createRotationControls() {
    for (const config of ROTATION_CONFIG) {
      const row = document.createElement('div');
      row.className = 'control-row';
      row.style.setProperty('--axis-color', config.color);

      const label = document.createElement('span');
      label.className = 'control-row__label';
      label.textContent = config.label;

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

      input.addEventListener('input', () => {
        state.rotations[config.key] = Number(input.value);
        value.textContent = Math.round(state.rotations[config.key]) + '°';
        hideHint();
      });

      auto.addEventListener('click', () => {
        state.auto[config.key] = !state.auto[config.key];
        auto.setAttribute('aria-pressed', String(state.auto[config.key]));
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

      const input = document.createElement('input');
      input.type = 'range';
      input.min = '0';
      input.max = '1.4';
      input.step = '0.02';
      input.value = '1';
      input.setAttribute('aria-label', 'Scale ' + config.label + ' axis');

      const value = document.createElement('span');
      value.className = 'control-row__value';
      value.textContent = '1.00';

      input.addEventListener('input', () => {
        state.scales[config.key] = Number(input.value);
        value.textContent = state.scales[config.key].toFixed(2);
        hideHint();
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
    if (mode !== 'perspective' && mode !== 'orthographic') return;
    state.projection = mode;
    projectionButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.projection === mode);
    });
  }

  function setColorMode(mode) {
    if (!['form', 'axis', 'classic'].includes(mode)) return;
    state.colorMode = mode;

    colorButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.color === mode);
    });

    // Classic is a showcase palette: reveal the colored faces immediately.
    if (mode === 'classic' && state.renderMode === 'wire') {
      setRenderMode('solid-edges');
    }
  }

  function setRenderMode(mode) {
    if (!['wire','solid','solid-edges'].includes(mode)) return;
    state.renderMode = mode;
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
      duration: reducedMotion ? 80 : 1750,
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
    }
  }

  function updateTransition(now) {
    if (!state.transition) return;

    const t = clamp(
      (now - state.transition.start) / state.transition.duration,
      0,
      1,
    );
    const e = smoother(t);

    state.zMix = mix(state.transition.fromZ, state.transition.toZ, e);
    state.wMix = mix(state.transition.fromW, state.transition.toW, e);

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
  }

  function updateUI() {
    if (state.transition) {
      dimensionValue.textContent =
        state.transition.fromDimension
        + 'D → '
        + state.transition.toDimension
        + 'D';
      dimensionStatus.textContent = 'unfolding';
    } else {
      dimensionValue.textContent = state.dimension + 'D';

      if (state.dimension === 2) {
        dimensionStatus.textContent = 'mandala plan';
      } else if (state.dimension === 3) {
        dimensionStatus.textContent =
          state.formStyle === 'temple'
            ? 'temple view'
            : 'symmetric form';
      } else {
        dimensionStatus.textContent = '4D projection';
      }
    }

    dimensionButtons.forEach((button) => {
      const d = Number(button.dataset.dimension);
      button.classList.toggle('is-active', !state.transition && d === state.dimension);
      button.classList.toggle(
        'is-target',
        state.requestedDimension === d && d !== state.dimension,
      );
      button.disabled = Boolean(state.transition);
    });

    updateControlAvailability();
  }

  function resetAll() {
    state.rotations = { xw: 0, yw: 0, zw: 0, xy: 0, xz: 0, yz: 0 };
    state.auto = { xw: false, yw: false, zw: false, xy: false, xz: false, yz: false };
    state.scales = { x: 1, y: 1, z: 1, w: 1 };
    state.cameraYaw = -0.62;
    state.cameraPitch = 0.58;
    state.zoom = 1;

    setProjection('perspective');
    setColorMode('form');
    setRenderMode('wire');

    for (const config of ROTATION_CONFIG) {
      const ui = rotationUI[config.key];
      ui.input.value = '0';
      ui.value.textContent = '0°';
      ui.auto.setAttribute('aria-pressed', 'false');
    }

    for (const config of SCALE_CONFIG) {
      const ui = scaleUI[config.key];
      ui.input.value = '1';
      ui.value.textContent = '1.00';
    }
  }

  function updateAutorotation(dt) {
    for (const config of ROTATION_CONFIG) {
      if (!state.auto[config.key] || effectiveDimension() < config.minDim) continue;

      let next = state.rotations[config.key] + dt * 28;
      if (next > 180) next -= 360;

      state.rotations[config.key] = next;

      const ui = rotationUI[config.key];
      ui.input.value = String(next);
      ui.value.textContent = Math.round(next) + '°';
    }
  }

  function resize() {
    state.width = innerWidth;
    state.height = innerHeight;
    state.dpr = Math.min(devicePixelRatio || 1, 2);

    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    canvas.style.width = state.width + 'px';
    canvas.style.height = state.height + 'px';

    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  function hideHint() {
    hint.classList.add('is-hidden');
  }

  function rebuildFromChoice(buttons, button, stateKey, dataKey) {
    if (state.transition) return;

    state[stateKey] = button.dataset[dataKey];
    buttons.forEach((item) => {
      item.classList.toggle('is-active', item === button);
    });

    buildActiveMandala();
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

  formButtons.forEach((button) => {
    button.addEventListener('click', () => {
      rebuildFromChoice(
        formButtons,
        button,
        'formStyle',
        'form',
      );
    });
  });

  resetAllButton.addEventListener('click', () => {
    resetAll();
    hideHint();
  });

  canvas.addEventListener('pointerdown', (event) => {
    state.pointerDown = true;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    hideHint();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!state.pointerDown) return;

    const dx = event.clientX - state.pointerX;
    const dy = event.clientY - state.pointerY;

    state.pointerX = event.clientX;
    state.pointerY = event.clientY;

    if (state.dimension === 2 && !state.transition) {
      state.rotations.xy += dx * 0.42;
      state.rotations.xy =
        ((state.rotations.xy + 180) % 360 + 360) % 360 - 180;

      const ui = rotationUI.xy;
      ui.input.value = String(state.rotations.xy);
      ui.value.textContent = Math.round(state.rotations.xy) + '°';
    } else {
      state.cameraYaw += dx * 0.005;
      state.cameraPitch = clamp(
        state.cameraPitch + dy * 0.005,
        -1.45,
        1.45,
      );
    }
  });

  function pointerUp(event) {
    state.pointerDown = false;
    if (canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
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
    hideHint();
  }, { passive: false });

  canvas.addEventListener('dblclick', () => {
    state.cameraYaw = -0.62;
    state.cameraPitch = 0.58;
    state.zoom = 1;
  });

  window.addEventListener('resize', resize, { passive: true });

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

    requestAnimationFrame(tick);
  }

  createRotationControls();
  createScaleControls();
  buildActiveMandala();
  resetAll();
  resize();
  updateUI();
  requestAnimationFrame(tick);

  setTimeout(() => hint.classList.add('is-hidden'), 6500);
})();
