/*
 * Kali Yantra geometry correction.
 *
 * The documented Kali type used by Hypermandala has five nested downward
 * triangles inside a circular enclosure, surrounded by an eight-petalled
 * lotus and a four-gated bhupura. Keep the construction inside the native
 * 2D→3D→4D geometry pipeline and only replace the Kali-specific pieces.
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

    // Use the engine's existing convex lotus primitive. The earlier custom
    // petal generator created degenerate edges; this one stays within the
    // same polygon assumptions used by the other working yantras.
    pieces.push(...lotusRingPieces(
      8, 1.23, 0.46, 0.72,
      'kali-lotus', 1, 10,
    ));

    // The five triangles sit inside a circular enclosure. Model the enclosure
    // as a thin annulus rather than a filled disk so the central triangular
    // field remains visible and the 2D topology matches the reference.
    for (const sector of polygonRingSectors(
      1.07, 0.99, 24, Math.PI / 24,
    )) {
      pieces.push({
        points: sector,
        regionId: 'kali-ring',
        level: 2,
        paintOrder: 20,
        radialDistance: 1.03,
      });
    }

    const radii = [0.96, 0.79, 0.63, 0.47, 0.32];
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
`  function buildKaliYantraForm() {
    buildYantraForm(kaliYantraPieces());
  }`,
`  function buildKaliYantraForm() {
    const pieces = kaliYantraPieces();

    // Kali's five triangles are nested rather than interlocking. The generic
    // yantra builder preserves an intersection-subdivision network on every
    // footprint. That is useful for Sri/Matangi crossings, but unnecessary
    // here and becomes pathological once the circular enclosure is present.
    // Build the same contiguous outer→inner hierarchy without those extra
    // clipped detail segments.
    buildCenteredPieceHierarchy(
      pieces,
      (piece, rank, count) => {
        const t = count <= 1 ? 0 : rank / (count - 1);

        if (piece.regionId?.includes('bindu')) return 0.17;
        if (piece.regionId?.includes('bhupura')) return 0.065;
        if (piece.regionId?.includes('lotus')) return 0.075 + t * 0.012;

        // Circular enclosure and nested triangle hierarchy.
        return 0.082 + t * 0.052;
      },
      0.13,
      false,
    );
  }`,
      'Kali 3D form builder',
    );

    if (changes !== 4) {
      console.warn('Kali Yantra source patch applied partially:', changes, '/ 4');
    }

    return new Response(source, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  };
})();
