import fs from 'node:fs';

const path = 'public/app.js';
let source = fs.readFileSync(path, 'utf8');

function replaceOnce(label, before, after) {
  const first = source.indexOf(before);
  const last = source.lastIndexOf(before);
  if (first < 0) throw new Error(`Could not find ${label}`);
  if (first !== last) throw new Error(`Expected one ${label}, found multiple`);
  source = source.replace(before, after);
}

replaceOnce(
  'Sri Yantra palette',
  `  const SRI_COLORS = {\n    bhupura: '#d4a843',\n    lotus16: '#d895a5',\n    lotus8: '#efe0ad',\n    shiva: '#4669ad',\n    shakti: '#c94b40',\n    bindu: '#b92f2f',\n  };`,
  `  const SRI_COLORS = {\n    // Manuscript-inspired traditional palette. Geometry is deliberately\n    // unchanged: these colors only affect Classic rendering.\n    bhupura: '#eadfbd',\n    lotus16: '#d1a13c',\n    lotus8: '#cf8d98',\n    triangles: [\n      '#c96f4d', // D1 · terracotta\n      '#d39b40', // U1 · ochre\n      '#748e68', // U3 · muted green\n      '#c77855', // U2 · warm brick\n      '#d5b451', // D3 · yellow ochre\n      '#7b956f', // D2 · leaf green\n      '#cf844c', // U4 · orange earth\n      '#b96857', // D4 · muted red\n      '#ddc66c', // D5 · warm central yellow\n    ],\n    bindu: '#e2b0a7',\n  };`,
);

replaceOnce(
  'Sri Yantra classic color mapping',
  `    if (regionId === 'sri-bhupura') return hexToRgb(SRI_COLORS.bhupura);\n    if (regionId === 'sri-lotus16') return hexToRgb(SRI_COLORS.lotus16);\n    if (regionId === 'sri-lotus8') return hexToRgb(SRI_COLORS.lotus8);\n    if (regionId?.startsWith('sri-shiva-')) return hexToRgb(SRI_COLORS.shiva);\n    if (regionId?.startsWith('sri-shakti-')) return hexToRgb(SRI_COLORS.shakti);\n    if (regionId === 'sri-bindu') return hexToRgb(SRI_COLORS.bindu);`,
  `    if (regionId === 'sri-bhupura') return hexToRgb(SRI_COLORS.bhupura);\n    if (regionId === 'sri-lotus16') return hexToRgb(SRI_COLORS.lotus16);\n    if (regionId === 'sri-lotus8') return hexToRgb(SRI_COLORS.lotus8);\n    if (\n      regionId?.startsWith('sri-shiva-')\n      || regionId?.startsWith('sri-shakti-')\n    ) {\n      const index = Number(regionId.split('-')[2]);\n      const color = SRI_COLORS.triangles[index] ?? SRI_COLORS.triangles[0];\n      return hexToRgb(color);\n    }\n    if (regionId === 'sri-bindu') return hexToRgb(SRI_COLORS.bindu);`,
);

fs.writeFileSync(path, source);
