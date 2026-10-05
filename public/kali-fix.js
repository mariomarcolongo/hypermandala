/*
 * Kali Yantra geometry correction.
 *
 * The documented Kali type used by Hypermandala has five nested downward
 * triangles inside a circular field, surrounded by an eight-petalled lotus
 * and a four-gated bhupura. app.js already has the five triangles and bhupura;
 * this bootstrap patch replaces the detached generic lotus polygons with a
 * continuous lotus/circle composition while keeping the native 2D→3D→4D
 * geometry pipeline unchanged.
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
    field: '#4d292e',
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
    if (regionId === 'kali-field') return hexToRgb(KALI_COLORS.field);
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

    // Eight broad, pointed lotus petals. Their inner halves sit beneath the
    // circular field, so the visible plan reads as one lotus rather than eight
    // detached polygonal satellites.
    const petalRadius = 1.17;
    const petalLength = 0.64;
    const petalWidth = 0.78;
    const petalSteps = 10;

    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * TAU - Math.PI / 2;
      const petal = [];

      for (let step = 0; step <= petalSteps; step += 1) {
        const t = step / petalSteps;
        const radial = -petalLength * 0.50 + petalLength * t;
        const width = 0.50 * petalWidth * Math.pow(Math.sin(Math.PI * t), 0.72);
        petal.push(rotateXYPoint(petalRadius + radial, -width, angle));
      }
      for (let step = petalSteps; step >= 0; step -= 1) {
        const t = step / petalSteps;
        const radial = -petalLength * 0.50 + petalLength * t;
        const width = 0.50 * petalWidth * Math.pow(Math.sin(Math.PI * t), 0.72);
        petal.push(rotateXYPoint(petalRadius + radial, width, angle));
      }

      pieces.push({
        points: petal,
        regionId: 'kali-lotus',
        level: 1,
        paintOrder: 10 + index,
      });
    }

    // Historical Kali Yantra examples place the five triangles inside a
    // circular field, with the eight-petalled lotus outside that circle.
    // Drawing the field after the petals masks their inner bases and produces
    // the continuous lotus-and-circle silhouette seen in the references.
    pieces.push({
      points: polygonFootprint(0, 0, 1.03, 64, -Math.PI / 2),
      regionId: 'kali-field',
      level: 2,
      paintOrder: 20,
    });

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

    if (changes !== 3) {
      console.warn('Kali Yantra source patch applied partially:', changes, '/ 3');
    }

    return new Response(source, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  };
})();
