import fs from 'node:fs';

const path = 'public/app.js';
let source = fs.readFileSync(path, 'utf8');
let patchCount = 0;

function replaceRange(startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Missing ${label} markers`);
  }
  source = source.slice(0, start) + replacement + source.slice(end);
  patchCount += 1;
}

replaceRange(
  "  const SRI_COLORS = {",
  "  const KALI_COLORS = {",
  `  const SRI_COLORS = {
    bhupuraOuter: '#f2eee4',
    bhupuraMiddle: '#c66040',
    bhupuraInner: '#d9b44b',
    trivalaya: '#b9ad98',
    lotus16: '#4366ad',
    lotus8: '#c94b40',
    triangleLine: '#efe6d3',
    central: '#f4efe2',
    bindu: '#b83232',
  };

`,
  'Sri palette',
);

replaceRange(
  "    if (regionId === 'sri-bhupura')",
  "    if (regionId === 'kali-bhupura')",
  `    if (regionId === 'sri-bhupura-outer') return hexToRgb(SRI_COLORS.bhupuraOuter);
    if (regionId === 'sri-bhupura-middle') return hexToRgb(SRI_COLORS.bhupuraMiddle);
    if (regionId === 'sri-bhupura-inner') return hexToRgb(SRI_COLORS.bhupuraInner);
    if (regionId === 'sri-trivalaya') return hexToRgb(SRI_COLORS.trivalaya);
    if (regionId === 'sri-lotus16') return hexToRgb(SRI_COLORS.lotus16);
    if (regionId === 'sri-lotus8') return hexToRgb(SRI_COLORS.lotus8);
    if (regionId === 'sri-triangle-line') return hexToRgb(SRI_COLORS.triangleLine);
    if (regionId === 'sri-central-trikona') return hexToRgb(SRI_COLORS.central);
    if (regionId === 'sri-bindu') return hexToRgb(SRI_COLORS.bindu);

`,
  'Sri classic colors',
);

replaceRange(
  "  function sriYantraPieces() {",
  "  function kaliYantraPieces() {",
  `  function sriYantraPieces() {
    const complex = state.complexity === 'complex';
    const pieces = [];

    const sriPetalFootprint = (radius, radialLength, tangentialWidth, angle) => {
      const halfLength = radialLength * 0.5;
      const halfWidth = tangentialWidth * 0.5;
      const baseLeft = [-halfLength, -halfWidth * 0.30];
      const tip = [halfLength, 0];
      const baseRight = [-halfLength, halfWidth * 0.30];
      const leftControl = [-radialLength * 0.08, -halfWidth];
      const rightControl = [-radialLength * 0.08, halfWidth];
      const local = [];
      const samples = 6;
      const quadratic = (a, control, b, t) => {
        const u = 1 - t;
        return [
          u * u * a[0] + 2 * u * t * control[0] + t * t * b[0],
          u * u * a[1] + 2 * u * t * control[1] + t * t * b[1],
        ];
      };

      for (let i = 0; i <= samples; i += 1) {
        local.push(quadratic(baseLeft, leftControl, tip, i / samples));
      }
      for (let i = 1; i <= samples; i += 1) {
        local.push(quadratic(tip, rightControl, baseRight, i / samples));
      }

      const cx = Math.cos(angle) * radius;
      const cy = Math.sin(angle) * radius;
      return local.map(([x, y]) => {
        const p = rotateXYPoint(x, y, angle);
        return [cx + p[0], cy + p[1]];
      });
    };

    const sriLotusRingPieces = (
      count,
      radius,
      radialLength,
      tangentialWidth,
      regionId,
      level,
      paintOrder,
    ) => Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * TAU - Math.PI / 2;
      return {
        points: sriPetalFootprint(
          radius,
          radialLength,
          tangentialWidth,
          angle,
        ),
        regionId,
        level,
        paintOrder,
        radialDistance: radius,
      };
    });

    /*
     * Traditional structure is encoded as actual native geometry:
     * three bhupura ramparts, trivalaya, sixteen- and eight-petal lotuses,
     * the nine-triangle network as linework, central trikona and bindu.
     * The nine generating triangles are not painted as large Shiva/Shakti
     * fields, because that falsely colors the 43 resulting chambers.
     */
    const ramparts = complex
      ? [
          [4.10, 0.045, 0.62, 'sri-bhupura-outer', 0, 0],
          [3.90, 0.043, 0.60, 'sri-bhupura-middle', 1, 1],
          [3.70, 0.041, 0.58, 'sri-bhupura-inner', 2, 2],
        ]
      : [
          [4.00, 0.050, 0.62, 'sri-bhupura-inner', 0, 0],
        ];

    for (const [size, thickness, gateWidth, regionId, level, order] of ramparts) {
      pieces.push(...bhupuraPieces(
        size,
        thickness,
        gateWidth,
        regionId,
        level,
        order,
      ));
    }

    if (complex) {
      const rings = [
        [1.80, 1.785, 3, 6],
        [1.755, 1.740, 3, 7],
        [1.710, 1.695, 3, 8],
      ];

      for (const [outer, inner, level, order] of rings) {
        for (const sector of polygonRingSectors(
          outer,
          inner,
          48,
          Math.PI / 48,
        )) {
          pieces.push({
            points: sector,
            regionId: 'sri-trivalaya',
            level,
            paintOrder: order,
            radialDistance: (outer + inner) * 0.5,
          });
        }
      }
    }

    pieces.push(...sriLotusRingPieces(
      16,
      1.49,
      0.34,
      0.25,
      'sri-lotus16',
      4,
      12,
    ));
    pieces.push(...sriLotusRingPieces(
      8,
      1.19,
      0.40,
      0.38,
      'sri-lotus8',
      5,
      20,
    ));

    const triangles = sriTriangleSpecs();
    for (const triangle of triangles) {
      for (let edge = 0; edge < 3; edge += 1) {
        const a = triangle.points[edge];
        const b = triangle.points[(edge + 1) % 3];
        pieces.push({
          points: ribbonSegmentFootprint(
            a,
            b,
            complex ? 0.014 : 0.018,
          ),
          regionId: 'sri-triangle-line',
          level: 6,
          paintOrder: 40,
          radialDistance: Math.max(
            Math.hypot(a[0], a[1]),
            Math.hypot(b[0], b[1]),
          ),
        });
      }
    }

    const central = triangles.find((triangle) => triangle.name === 'D5');
    if (central) {
      pieces.push({
        points: central.points.map(([x, y]) => [x * 0.90, y * 0.90]),
        regionId: 'sri-central-trikona',
        level: 7,
        paintOrder: 60,
        radialDistance: 0.18,
      });
    }

    pieces.push({
      points: polygonFootprint(0, 0, 0.034, 20, Math.PI / 20),
      regionId: 'sri-bindu',
      level: 8,
      paintOrder: 100,
      radialDistance: 0,
    });

    return pieces;
  }

`,
  'Sri native pieces',
);

replaceRange(
  "  function buildSriYantraForm() {",
  "  function buildKaliYantraForm() {",
  `  function buildSriYantraForm() {
    const pieces = sriYantraPieces();

    /*
     * Every Sri Yantra component stays in the native dimensional pipeline.
     * Closed 2D regions become prisms in Z and native hyperprisms in W,
     * including the 8- and 16-petal lotus rings.
     */
    buildCenteredPieceHierarchy(
      pieces,
      (piece, rank, count) => {
        const t = count <= 1 ? 0 : rank / (count - 1);
        if (piece.regionId === 'sri-bindu') return 0.115;
        if (piece.regionId === 'sri-central-trikona') return 0.070;
        if (piece.regionId === 'sri-triangle-line') return 0.036;
        if (piece.regionId === 'sri-lotus8') return 0.060;
        if (piece.regionId === 'sri-lotus16') return 0.055;
        if (piece.regionId === 'sri-trivalaya') return 0.032;
        if (piece.regionId?.startsWith('sri-bhupura-')) return 0.045;
        return 0.045 + t * 0.012;
      },
      0.075,
      false,
    );
  }

`,
  'Sri native 3D/4D form',
);

if (patchCount !== 4) {
  throw new Error(`Expected 4 Sri patches, applied ${patchCount}`);
}

fs.writeFileSync(path, source);
console.log('Applied Sri Yantra native geometry patch.');
