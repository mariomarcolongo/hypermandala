/*
 * Yantra geometry corrections.
 *
 * Kali keeps its connected eight-petalled lotus and stable nested-triangle
 * hierarchy. Sri uses two traditional connected lotus coronas around the
 * triangle field: sixteen smaller outer petals and eight broader inner petals.
 * Keep all changes inside the native 2D→3D→4D geometry pipeline.
 */
(() => {
  'use strict';

  const upstreamFetch = window.fetch.bind(window);

  window.fetch = async function patchYantraSource(input, init) {
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
        console.warn('Yantra source patch skipped:', label);
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
      'Kali palette',
    );

    replaceOnce(
`    if (regionId === 'kali-bhupura') return hexToRgb(KALI_COLORS.bhupura);
    if (regionId === 'kali-lotus') return hexToRgb(KALI_COLORS.lotus);
    if (regionId?.startsWith('kali-triangle-')) {`,
`    if (regionId === 'kali-bhupura') return hexToRgb(KALI_COLORS.bhupura);
    if (regionId === 'kali-lotus') return hexToRgb(KALI_COLORS.lotus);
    if (regionId === 'kali-ring') return hexToRgb(KALI_COLORS.ring);
    if (regionId?.startsWith('kali-triangle-')) {`,
      'Kali classic region mapping',
    );

    // The native Sri lotus helper makes small detached hexagonal/almond pieces.
    // Replace only Sri's two lotus calls with broad-rooted convex petals whose
    // roots occupy each full angular sector. Adjacent petals therefore meet at
    // the base, while the seven-vertex profile gives a rounded painted-lotus
    // silhouette rather than a floating polygon tile. The polygons stay convex
    // so the same footprints remain safe for the native 3D/4D prism pipeline.
    replaceOnce(
`    pieces.push(...lotusRingPieces(
      16, 1.51, 0.24, 0.46,
      'sri-lotus16', 1, 10,
    ));
    pieces.push(...lotusRingPieces(
      8, 1.25, 0.24, 0.78,
      'sri-lotus8', 2, 20,
    ));`,
`    const sriLotusPetalFootprint = (
      count,
      rootRadius,
      shoulderRadius,
      capRadius,
      angle,
    ) => {
      const halfSector = Math.PI / count;
      const shoulderAngle = halfSector * 0.72;
      const capAngle = halfSector * 0.34;

      const rootX = rootRadius * Math.cos(halfSector);
      const rootY = rootRadius * Math.sin(halfSector);
      const shoulderX = shoulderRadius * Math.cos(shoulderAngle);
      const shoulderY = shoulderRadius * Math.sin(shoulderAngle);
      const capX = capRadius * 0.985 * Math.cos(capAngle);
      const capY = capRadius * 0.985 * Math.sin(capAngle);

      const local = [
        [rootX, -rootY],
        [shoulderX, -shoulderY],
        [capX, -capY],
        [capRadius, 0],
        [capX, capY],
        [shoulderX, shoulderY],
        [rootX, rootY],
      ];

      return local.map(([x, y]) => rotateXYPoint(x, y, angle));
    };

    const sriLotusRingPieces = (
      count,
      rootRadius,
      shoulderRadius,
      capRadius,
      regionId,
      level,
      paintOrder,
    ) => {
      const ringPieces = [];
      for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * TAU - Math.PI / 2;
        ringPieces.push({
          points: sriLotusPetalFootprint(
            count,
            rootRadius,
            shoulderRadius,
            capRadius,
            angle,
          ),
          regionId,
          level,
          paintOrder,
          radialDistance: (rootRadius + capRadius) * 0.5,
        });
      }
      return ringPieces;
    };

    // Painted Sri Yantra references typically show a broad eight-petalled
    // inner lotus and a tighter sixteen-petalled outer lotus. Keep the outer
    // extent close to the existing implementation, changing mainly the petal
    // silhouette and base continuity rather than the overall yantra scale.
    // Leave narrow radial separators between the triangle enclosure, the
    // eight-petal lotus, and the sixteen-petal lotus. The previous revision
    // placed the inner petal tips and outer petal roots at exactly radius 1.40,
    // which caused their strokes/fills to overlap at the shared boundary.
    pieces.push(...sriLotusRingPieces(
      16, 1.42, 1.53, 1.63,
      'sri-lotus16', 1, 10,
    ));
    pieces.push(...sriLotusRingPieces(
      8, 1.14, 1.28, 1.37,
      'sri-lotus8', 2, 20,
    ));`,
      'Sri connected lotus geometry',
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
      version: '2026-10-06-v8',
      changes,
    };
    window.__hypermandalaSriPatch = {
      version: '2026-10-06-v2',
      applied: changes >= 7,
    };

    if (changes !== 7) {
      console.warn('Yantra source patch applied partially:', changes, '/ 7');
    }

    return new Response(source, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  };
})();
