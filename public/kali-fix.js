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

    const ringInner = 0.985;
    const ringOuter = 1.045;

    // Eight pointed convex petals begin exactly at the outside of the circular
    // enclosure. The previous version extended each petal through the annulus,
    // so the ring outline visibly crossed the petal fill. Keeping the petal's
    // inner tip on ringOuter makes the two structures tangent rather than
    // overlapping while preserving a broad traditional lotus silhouette.
    const kaliPetalFootprint = (angle) => {
      const innerRadius = ringOuter;
      const outerRadius = 1.53;
      const radius = (innerRadius + outerRadius) * 0.5;
      const radialLength = outerRadius - innerRadius;
      const tangentialWidth = 0.48;
      const steps = 8;
      const local = [];

      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const radial = -radialLength * 0.5 + radialLength * t;
        const width = tangentialWidth * 0.5
          * Math.pow(Math.sin(Math.PI * t), 0.78);
        local.push([radius + radial, -width]);
      }

      // Exclude the two tips on the return side so every polygon vertex is
      // unique and every prism edge has non-zero length.
      for (let step = steps - 1; step >= 1; step -= 1) {
        const t = step / steps;
        const radial = -radialLength * 0.5 + radialLength * t;
        const width = tangentialWidth * 0.5
          * Math.pow(Math.sin(Math.PI * t), 0.78);
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
        radialDistance: (ringOuter + 1.53) * 0.5,
      });
    }

    // Circular enclosure around the five nested downward triangles. Convex
    // sectors keep the 3D prism pipeline robust; the 2D plan builder below
    // suppresses only their internal radial seams so they read as one annulus.
    for (const sector of polygonRingSectors(
      ringOuter, ringInner, 32, Math.PI / 32,
    )) {
      pieces.push({
        points: sector,
        regionId: 'kali-ring',
        level: 2,
        paintOrder: 20,
        radialDistance: (ringOuter + ringInner) * 0.5,
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
    // Kali uses nested, not interlocking, triangles. Their boundaries are
    // explicit source geometry, so no generic triangle subdivision is needed.
    // Ring sectors are filled separately for convexity, but only their inner
    // and outer chords are exposed as 2D edges. Omitting the shared radial
    // sector boundaries removes the spoke-like overlap artifacts from the
    // circular enclosure and its thumbnail.
    clearPlan();
    for (const piece of kaliYantraPieces()) {
      if (piece.regionId === 'kali-ring' && piece.points.length === 4) {
        addPlanFace(
          piece.points,
          piece.regionId,
          piece.paintOrder,
        );
        addPlanEdge(
          piece.points[0],
          piece.points[1],
          'n',
          piece.regionId,
        );
        addPlanEdge(
          piece.points[2],
          piece.points[3],
          'n',
          piece.regionId,
        );
        continue;
      }

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

    // Kali's circular enclosure is already decomposed into safe convex pieces.
    // Sending those sectors through the generic symmetric footprint union is
    // unnecessary and can cause a combinatorial freeze when the preset loads.
    if (state.preset === 'kaliyantra') return;

    if (
      PRESET_META[state.preset]?.kind !== 'symmetric'
      || !modules.length
    ) return;`,
      'Kali surface normalization bypass',
    );

    window.__hypermandalaKaliPatch = {
      version: '2026-10-06-v4',
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
