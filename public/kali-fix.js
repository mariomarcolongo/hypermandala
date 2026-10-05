/*
 * Kali Yantra geometry correction.
 *
 * The documented Kali type used by Hypermandala has five nested downward
 * triangles inside a circular enclosure, surrounded by an eight-petalled
 * lotus and a four-gated bhupura. Keep the construction inside the native
 * 2D→3D→4D geometry pipeline and only replace Kali-specific behavior.
 */
(() => {
  'use strict';

  const upstreamFetch = window.fetch.bind(window);

  window.fetch = async function patchKaliYantraSource(input, init) {
    const response = await upstreamFetch(input, init);
    const url = typeof input === 'string' ? input : input?.url || '';

    if (!/(^|\/)app\.js(?:[?#]|$)/.test(url) || !response.ok) {
      return response;
    }

    // app.js is fetched once during bootstrap. Do not leave a global fetch
    // wrapper installed after the source has been patched.
    window.fetch = upstreamFetch;

    let source = await response.text();
    let changes = 0;

    const replaceOnce = (before, after, label) => {
      if (!source.includes(before)) {
        console.warn('Kali Yantra source patch skipped:', label);
        return;
      }
      source = source.replace(before, after);
      changes += 1;
    };

    replaceOnce(
`  const KALI_COLORS = {
    bhupura: '#3b2527',
    lotus: '#b7444b',
    triangle: '#25171a',
    triangleAlt: '#7f252d',
    bindu: '#d8ad4d',
  };`,
`  const KALI_COLORS = {
    bhupura: '#3b2527',
    lotus: '#b7444b',
    ring: '#6a3035',
    triangle: '#25171a',
    triangleAlt: '#7f252d',
    bindu: '#d8ad4d',
  };`,
      'palette',
    );

    replaceOnce(
`    if (regionId === 'kali-bhupura') return hexToRgb(KALI_COLORS.bhupura);
    if (regionId === 'kali-lotus') return hexToRgb(KALI_COLORS.lotus);
    if (regionId?.startsWith('kali-triangle-')) {`,
`    if (regionId === 'kali-bhupura') return hexToRgb(KALI_COLORS.bhupura);
    if (regionId === 'kali-lotus') return hexToRgb(KALI_COLORS.lotus);
    if (regionId === 'kali-ring') return hexToRgb(KALI_COLORS.ring);
    if (regionId?.startsWith('kali-triangle-')) {`,
      'classic region mapping',
    );

    const functionPattern = /  function kaliYantraPieces\(\) \{[\s\S]*?\n    return pieces;\n  \}/;
    const correctedFunction = `  function kaliYantraPieces() {
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

    // Smooth, pointed lotus petals. Build each as one convex polygon with
    // unique tip vertices. This avoids both the old detached hexagonal blobs
    // and the degenerate duplicated-tip geometry from the first correction.
    const kaliPetalFootprint = (angle) => {
      const radius = 1.19;
      const radialLength = 0.62;
      const tangentialWidth = 0.54;
      const steps = 8;
      const local = [];

      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const radial = -radialLength * 0.5 + radialLength * t;
        const width = tangentialWidth * 0.5
          * Math.pow(Math.sin(Math.PI * t), 0.8);
        local.push([radius + radial, -width]);
      }

      // Exclude the two tips on the return side so every polygon vertex is
      // unique and every prism edge has non-zero length.
      for (let step = steps - 1; step >= 1; step -= 1) {
        const t = step / steps;
        const radial = -radialLength * 0.5 + radialLength * t;
        const width = tangentialWidth * 0.5
          * Math.pow(Math.sin(Math.PI * t), 0.8);
        local.push([radius + radial, width]);
      }

      return local.map(([x, y]) => rotateXYPoint(x, y, angle));
    };

    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * TAU - Math.PI / 2;
      pieces.push({
        points: kaliPetalFootprint(angle),
        regionId: 'kali-lotus',
        level: 1,
        paintOrder: 10,
        radialDistance: 1.19,
      });
    }

    // Circular enclosure around the five nested downward triangles.
    for (const sector of polygonRingSectors(
      1.045, 0.985, 24, Math.PI / 24,
    )) {
      pieces.push({
        points: sector,
        regionId: 'kali-ring',
        level: 2,
        paintOrder: 20,
        radialDistance: 1.015,
      });
    }

    const radii = [0.94, 0.77, 0.60, 0.44, 0.29];
    radii.forEach((radius, index) => {
      pieces.push({
        points: polygonFootprint(
          0, 0, radius, 3, Math.PI / 2,
        ),
        regionId: 'kali-triangle-' + index,
        level: 3 + index,
        paintOrder: 30 + index,
      });
    });

    pieces.push({
      points: polygonFootprint(0, 0, 0.038, 16, 0),
      regionId: 'kali-bindu',
      level: 8,
      paintOrder: 100,
    });

    return pieces;
  }`;

    if (!functionPattern.test(source)) {
      console.warn('Kali Yantra source patch skipped: geometry function');
    } else {
      source = source.replace(functionPattern, correctedFunction);
      changes += 1;
    }

    replaceOnce(
`  function buildKaliYantraPlan() {
    buildPlanFromPieces(kaliYantraPieces());
  }`,
`  function buildKaliYantraPlan() {
    // Kali uses nested, not interlocking, triangles. The triangle boundaries
    // are already explicit pieces, so the generic yantra subdivision pass adds
    // no information and needlessly clips those lines into the lotus/ring.
    clearPlan();
    for (const piece of kaliYantraPieces()) {
      addPlanLoop(
        piece.points,
        true,
        piece.regionId,
        piece.paintOrder,
      );
    }
  }`,
      'Kali 2D plan builder',
    );

    replaceOnce(
`  function buildKaliYantraForm() {
    buildYantraForm(kaliYantraPieces());
  }`,
`  function buildKaliYantraForm() {
    const pieces = kaliYantraPieces();

    // The five Kali triangles are nested rather than interlocking. Preserve
    // each explicit outline as a structural boundary but do not create the
    // generic cross-triangle subdivision network used by Sri/Matangi.
    buildCenteredPieceHierarchy(
      pieces,
      (piece, rank, count) => {
        const t = count <= 1 ? 0 : rank / (count - 1);

        if (piece.regionId?.includes('bindu')) return 0.17;
        if (piece.regionId?.includes('bhupura')) return 0.065;
        if (piece.regionId?.includes('lotus')) return 0.075 + t * 0.012;

        return 0.082 + t * 0.052;
      },
      0.13,
      false,
    );
  }`,
      'Kali 3D form builder',
    );

    replaceOnce(
`  function normalizeSymmetricSurfaceComplex() {
    surfaceModules.length = 0;

    if (
      PRESET_META[state.preset]?.kind !== 'symmetric'
      || !modules.length
    ) return;`,
`  function normalizeSymmetricSurfaceComplex() {
    surfaceModules.length = 0;

    // Kali's corrected plan contains a segmented circular enclosure plus
    // petal polygons. Feeding all of those footprints into the generic union
    // partitioner causes a combinatorial freeze when the preset is selected.
    // The Kali modules are already valid non-overlapping convex prisms at
    // their own hierarchy levels, so render them directly instead.
    if (state.preset === 'kaliyantra') return;

    if (
      PRESET_META[state.preset]?.kind !== 'symmetric'
      || !modules.length
    ) return;`,
      'Kali surface normalization bypass',
    );

    window.__hypermandalaKaliPatch = {
      version: '2026-10-06-v3',
      changes,
    };

    if (changes !== 6) {
      console.warn('Kali Yantra source patch applied partially:', changes, '/ 6');
    }

    return new Response(source, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  };
})();
