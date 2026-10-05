import fs from 'node:fs';

const path = 'public/app.js';
let source = fs.readFileSync(path, 'utf8');

const needle = `  function normalizeSymmetricSurfaceComplex() {\n    surfaceModules.length = 0;\n\n    if (\n      PRESET_META[state.preset]?.kind !== 'symmetric'\n      || !modules.length\n    ) return;\n\n    const sources = modules.map(extractSymmetricPrismSource);`;

const replacement = `  function normalizeSymmetricSurfaceComplex() {\n    surfaceModules.length = 0;\n\n    if (\n      PRESET_META[state.preset]?.kind !== 'symmetric'\n      || !modules.length\n    ) return;\n\n    /*\n     * Sri Yantra is intentionally composed from many thin semantic pieces:\n     * three bhupura ramparts, trivalaya sectors, two lotus rings and the\n     * nine-triangle line network. Running the generic symmetric union\n     * normalizer over all of those overlapping footprints causes a\n     * combinatorial polygon-partition explosion and can freeze the UI when\n     * the preset is selected. The native modules are already valid prisms /\n     * hyperprisms, so render them directly just as they were authored. This\n     * keeps the ordinary axis controls, projections and 2D→3D→4D pipeline\n     * without attempting an unnecessary global boolean union.\n     */\n    if (state.preset === 'sriyantra') return;\n\n    const sources = modules.map(extractSymmetricPrismSource);`;

const occurrences = source.split(needle).length - 1;
if (occurrences !== 1) {
  throw new Error(`Expected one normalizeSymmetricSurfaceComplex insertion point, found ${occurrences}`);
}

source = source.replace(needle, replacement);
fs.writeFileSync(path, source);
