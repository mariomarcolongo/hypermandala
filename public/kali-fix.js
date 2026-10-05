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

    const ringInner = 0.96;
    const ringOuter = 1.045;

    // Traditional connected eight-petalled lotus. Each petal owns exactly one
    // 45-degree root sector, so neighbouring petals meet at the circular
    // enclosure instead of floating apart. The closing root chord is hidden
    // in the 2D plan, and the annulus is painted over it, producing a single
    // continuous lotus-and-ring construction without crossing outlines.
    //
    // The bronze reference uses relatively squat petals: broad at the ring
    // and only moderately projecting beyond it. Keep the same connected root
    // geometry while shortening the radial projection so the lotus stays in
    // proportion to the circular enclosure and bhupura.
    const kaliPetalFootprint = (angle) => {
      const baseHalfAngle = 22.5 * RAD;
      const baseX = ringOuter * Math.cos(baseHalfAngle);
      const baseY = ringOuter * Math.sin(baseHalfAngle);
      const outerRadius = 1.45;
      const local = [
        [baseX, -baseY],
        [1.19, -0.28],
        [outerRadius, 0],
        [1.19, 0.28],
        [baseX, baseY],
      ];

      return local.map(([x, y]) => rotateXYPoint(x, y, angle));
    };

    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * TAU - Math.PI / 2;
      pieces.push({
        points: kaliPetalFootprint(angle),
        regionId: 'kali-lotus',
        level: 1,
        paintOrder: 10,
        radialDistance: 1.24,
      });
    }

    // Circular enclosure around the five nested downward triangles. Convex
    // sectors keep the 3D prism pipeline robust. In the 2D plan only the inner
    // circular edge is stroked: the outer edge is the shared lotus root and is
    // deliberately left unstroked so it cannot cut across the petals.
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
    clearPlan();
    for (const piece of kaliYantraPieces()) {
      if (piece.regionId === 'kali-ring' && piece.points.length === 4) {
        addPlanFace(
          piece.points,
          piece.regionId,
          piece.paintOrder,
        );

        // polygonRingSectors() stores the outer chord first and the inner
        // chord second. Stroke only the inner circle: the outer ring boundary
        // is shared with the lotus roots and would otherwise cross them.
        addPlanEdge(
          piece.points[2],
          piece.points[3],
          'n',
          piece.regionId,
        );
        continue;
      }

      if (piece.regionId === 'kali-lotus') {
        addPlanFace(
          piece.points,
          piece.regionId,
          piece.paintOrder,
        );

        // Draw the two petal flanks and tip, but not the closing base chord.
        // The annulus fills that root area, so the lotus reads as attached to
        // the circular enclosure instead of as eight separate polygons.
        for (let i = 0; i < piece.points.length - 1; i += 1) {
          addPlanEdge(
            piece.points[i],
            piece.points[i + 1],
            'n',
            piece.regionId,
          );
        }
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
      version: '2026-10-06-v7',
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
