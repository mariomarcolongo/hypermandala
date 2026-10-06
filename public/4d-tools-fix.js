/*
 * Hypermandala — additional 4D inspection tools.
 *
 * Loaded immediately before app.js. This bootstrap keeps the core renderer
 * untouched on disk while applying narrowly-scoped source additions to the
 * same native geometry engine at load time.
 *
 * Features:
 * - exact global intrinsic-W sections (fixes per-module normalized slicing);
 * - view-space W sections after the current 4D rotation;
 * - animated section sweep;
 * - independent post-rotation W-coordinate coloring;
 * - isolation/cycling of genuine 3D boundary cells of 4D prism modules.
 */
(() => {
  'use strict';

  const PATCH_VERSION = '2026-10-06-v3';

  function inject4DToolsUi() {
    if (document.getElementById('hypermandala4DInspectionTools')) return;

    const body = document.querySelector('.perception-body');
    const replay = document.getElementById('replay4D');
    if (!body || !replay) return;

    const oneSlice = document.querySelector('[data-insight="w-slice"]');
    const fiveSlices = document.querySelector('[data-insight="w-layers"]');
    if (oneSlice) {
      oneSlice.textContent = '1 slice';
      oneSlice.title = 'Show one exact 3D cross-section at a chosen W position';
    }
    if (fiveSlices) {
      fiveSlices.textContent = '5 slices';
      fiveSlices.title = 'Show five exact global 3D cross-sections across W';
    }

    const tools = document.createElement('div');
    tools.id = 'hypermandala4DInspectionTools';
    tools.className = 'hyper4d-tools';
    tools.innerHTML = `
      <div class="perception-tool-label">Section frame</div>
      <div class="segmented hyper4d-two" id="wSectionSpaceControl">
        <button
          type="button"
          data-w-section-space="intrinsic"
          class="is-active"
          title="Slice the unrotated object with one common intrinsic W = constant hyperplane"
        >Intrinsic W</button>
        <button
          type="button"
          data-w-section-space="view"
          title="Rotate in 4D first, then slice the transformed object at view-space W = constant"
        >View-space W</button>
      </div>

      <button
        id="wSliceSweep"
        class="inspection-toggle hyper4d-wide"
        type="button"
        aria-pressed="false"
        title="Animate the selected W cross-section continuously through the 4D object"
      >Sweep slice</button>

      <div class="perception-tool-label">Fourth-coordinate cue</div>
      <button
        id="wDepthToggle"
        class="inspection-toggle hyper4d-wide"
        type="button"
        aria-pressed="false"
        title="Color filled faces by their current post-rotation W coordinate"
      >W-depth color</button>

      <div class="perception-tool-label">3D boundary cell</div>
      <button
        id="hypercellToggle"
        class="inspection-toggle hyper4d-wide"
        type="button"
        aria-pressed="false"
        title="Isolate one genuine 3D boundary cell of the current 4D prism decomposition"
      >Isolate one cell</button>
      <div class="hyper4d-cell-nav" id="hypercellNav">
        <button id="hypercellPrev" type="button" aria-label="Previous 3D boundary cell">‹</button>
        <output id="hypercellLabel" aria-live="polite">all cells</output>
        <button id="hypercellNext" type="button" aria-label="Next 3D boundary cell">›</button>
      </div>
    `;
    replay.insertAdjacentElement('beforebegin', tools);

    const style = document.createElement('style');
    style.id = 'hypermandala4DInspectionStyles';
    style.textContent = `
      .hyper4d-tools {
        display: grid;
        gap: 7px;
        margin: 9px 0 10px;
      }

      .hyper4d-two {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .hyper4d-wide {
        width: 100%;
      }

      .hyper4d-cell-nav {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) 34px;
        gap: 5px;
        align-items: stretch;
      }

      .hyper4d-cell-nav button {
        min-width: 0;
      }

      .hyper4d-cell-nav output {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        padding: 5px 6px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 6px;
        color: rgba(242,238,229,.82);
        font-size: 10px;
        line-height: 1.2;
        text-align: center;
      }

      .hyper4d-cell-nav.is-disabled,
      .hyper4d-tools .is-disabled {
        opacity: .42;
      }
    `;
    document.head.appendChild(style);
  }

  inject4DToolsUi();

  const upstreamFetch = window.fetch.bind(window);

  window.fetch = async function patch4DInspectionSource(input, init) {
    const response = await upstreamFetch(input, init);
    const url = typeof input === 'string' ? input : input?.url || '';

    if (!/(^|\/)app\.js(?:[?#]|$)/.test(url) || !response.ok) {
      return response;
    }

    let source = await response.text();
    let changes = 0;

    const replaceRequired = (before, after, label) => {
      if (!source.includes(before)) {
        console.warn('4D inspection patch skipped:', label);
        return false;
      }
      source = source.replace(before, after);
      changes += 1;
      return true;
    };

    replaceRequired(
`  const wSliceControl = document.getElementById('wSliceControl');
  const replay4DButton = document.getElementById('replay4D');`,
`  const wSliceControl = document.getElementById('wSliceControl');
  const replay4DButton = document.getElementById('replay4D');
  const wSectionSpaceButtons = [...document.querySelectorAll('[data-w-section-space]')];
  const wSliceSweepButton = document.getElementById('wSliceSweep');
  const wDepthToggle = document.getElementById('wDepthToggle');
  const hypercellToggle = document.getElementById('hypercellToggle');
  const hypercellPrevButton = document.getElementById('hypercellPrev');
  const hypercellNextButton = document.getElementById('hypercellNext');
  const hypercellLabel = document.getElementById('hypercellLabel');
  const hypercellNav = document.getElementById('hypercellNav');`,
      '4D control references',
    );

    replaceRequired(
`    projection: 'perspective',
    insightMode: 'standard',
    wSlice: 0.5,
    colorMode: 'classic',`,
`    projection: 'perspective',
    insightMode: 'standard',
    wSlice: 0.5,
    wSectionSpace: 'intrinsic',
    wSliceSweep: false,
    wSliceSweepDirection: 1,
    wDepthColor: false,
    hypercellMode: 'all',
    hypercellIndex: 0,
    colorMode: 'classic',`,
      '4D inspection state',
    );

    replaceRequired(
`      projection: state.projection,
      insightMode: state.insightMode,
      wSlice: state.wSlice,
      colorMode: state.colorMode,`,
`      projection: state.projection,
      insightMode: state.insightMode,
      wSlice: state.wSlice,
      wSectionSpace: state.wSectionSpace,
      wDepthColor: state.wDepthColor,
      hypercellMode: state.hypercellMode,
      hypercellIndex: state.hypercellIndex,
      colorMode: state.colorMode,`,
      '4D inspection persistence',
    );

    replaceRequired(
`    state.wSlice = finiteNumber(saved.wSlice, 0.5, 0, 1);
    if (['form', 'axis', 'classic'].includes(saved.colorMode)) {`,
`    state.wSlice = finiteNumber(saved.wSlice, 0.5, 0, 1);
    if (['intrinsic', 'view'].includes(saved.wSectionSpace)) {
      state.wSectionSpace = saved.wSectionSpace;
    }
    state.wDepthColor = Boolean(saved.wDepthColor);
    if (['all', 'isolate'].includes(saved.hypercellMode)) {
      state.hypercellMode = saved.hypercellMode;
    }
    state.hypercellIndex = Math.max(
      0,
      Math.floor(finiteNumber(saved.hypercellIndex, 0, 0, 1000000)),
    );
    if (['form', 'axis', 'classic'].includes(saved.colorMode)) {`,
      '4D inspection restore',
    );

    replaceRequired(
`    if (state.insightMode === 'w-color' && state.wMix > 0.001) {`,
`    if (
      (state.wDepthColor || state.insightMode === 'w-color')
      && state.wMix > 0.001
    ) {`,
      'independent W-depth color',
    );

    const sectionFunctionPattern =
      /  function drawWLayerOverlay\(\) \{[\s\S]*?\n  \}\n\n  function transform3DReference/;

    const sectionFunctions = `  function activeFilledModules() {
    return (
      state.zMix > 0.001
      && surfaceModules.length
    ) ? surfaceModules : modules;
  }

  function projectTransformed4DToScreen(p4) {
    const p3 = cameraTransform(project4Dto3D(p4));

    const cameraZ = 9;
    const factor = state.projection === 'perspective'
      ? cameraZ / (cameraZ - p3[2])
      : 1;

    const mobile = isMobileLayout();
    const stageTop = mobile ? state.viewTopInset : 0;
    const stageBottom = mobile
      ? Math.max(stageTop + 180, state.height - state.viewBottomInset)
      : state.height;
    const stageHeight = Math.max(180, stageBottom - stageTop);
    const scale = Math.min(state.width, stageHeight)
      * (mobile ? 0.27 : 0.245)
      * state.zoom;

    return {
      x: state.width * (mobile ? 0.5 : 0.47) + p3[0] * factor * scale,
      y: stageTop + stageHeight * 0.5 + p3[1] * factor * scale,
      depth: p3[2],
      viewX: p3[0],
      viewY: p3[1],
      viewZ: p3[2],
      w: p4[3],
    };
  }

  function globalIntrinsicWBounds() {
    let min = Infinity;
    let max = -Infinity;

    for (const module of modules) {
      const profile = module.wProfile;
      if (profile) {
        min = Math.min(min, profile.center - profile.half);
        max = Math.max(max, profile.center + profile.half);
        continue;
      }

      for (const point of module.vertices) {
        min = Math.min(min, point[3]);
        max = Math.max(max, point[3]);
      }
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return { min: -0.5, max: 0.5 };
    }
    if (Math.abs(max - min) < 1e-8) {
      return { min: min - 0.5, max: max + 0.5 };
    }
    return { min, max };
  }

  function transformedSectionWBounds(sectionModules = activeFilledModules()) {
    let min = Infinity;
    let max = -Infinity;

    for (const module of sectionModules) {
      for (const point of module.vertices) {
        const transformed = transform4D(point, true);
        min = Math.min(min, transformed[3]);
        max = Math.max(max, transformed[3]);
      }
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return { min: -0.5, max: 0.5 };
    }
    if (Math.abs(max - min) < 1e-8) {
      return { min: min - 0.5, max: max + 0.5 };
    }
    return { min, max };
  }

  function point3Key(point, precision = 100000) {
    return [
      Math.round(point[0] * precision),
      Math.round(point[1] * precision),
      Math.round(point[2] * precision),
    ].join(',');
  }

  function segment3Key(a, b) {
    const ka = point3Key(a);
    const kb = point3Key(b);
    return ka < kb ? ka + '|' + kb : kb + '|' + ka;
  }

  function dedupeSectionPoints(points) {
    const unique = new Map();
    for (const point of points) {
      unique.set(point3Key(point), point);
    }
    return [...unique.values()];
  }

  function intersectFaceWithViewW(transformedVertices, face, targetW) {
    const epsilon = 1e-7;
    const polygon = face.indices.map((index) => transformedVertices[index]);
    if (polygon.length < 2) return [];

    const allOnPlane = polygon.every(
      (point) => Math.abs(point[3] - targetW) <= epsilon,
    );

    if (allOnPlane) {
      const segments = [];
      for (let i = 0; i < polygon.length; i += 1) {
        const a = polygon[i];
        const b = polygon[(i + 1) % polygon.length];
        segments.push([
          [a[0], a[1], a[2], targetW],
          [b[0], b[1], b[2], targetW],
        ]);
      }
      return segments;
    }

    const hits = [];
    for (let i = 0; i < polygon.length; i += 1) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      const da = a[3] - targetW;
      const db = b[3] - targetW;

      if (Math.abs(da) <= epsilon) {
        hits.push([a[0], a[1], a[2], targetW]);
      }

      if (
        (da < -epsilon && db > epsilon)
        || (da > epsilon && db < -epsilon)
      ) {
        const t = (targetW - a[3]) / (b[3] - a[3]);
        hits.push([
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t,
          a[2] + (b[2] - a[2]) * t,
          targetW,
        ]);
      }
    }

    const unique = dedupeSectionPoints(hits);
    if (unique.length < 2) return [];

    let bestA = unique[0];
    let bestB = unique[1];
    let bestDistance = -Infinity;

    for (let i = 0; i < unique.length; i += 1) {
      for (let j = i + 1; j < unique.length; j += 1) {
        const dx = unique[i][0] - unique[j][0];
        const dy = unique[i][1] - unique[j][1];
        const dz = unique[i][2] - unique[j][2];
        const distance = dx * dx + dy * dy + dz * dz;
        if (distance > bestDistance) {
          bestDistance = distance;
          bestA = unique[i];
          bestB = unique[j];
        }
      }
    }

    return [[bestA, bestB]];
  }

  function drawViewSpaceWSection(fraction, alpha, width, color) {
    const sectionModules = activeFilledModules();
    if (!sectionModules.length) return;

    const bounds = transformedSectionWBounds(sectionModules);
    const targetW = bounds.min + (bounds.max - bounds.min) * fraction;
    const seen = new Set();

    for (const module of sectionModules) {
      const moduleAmount = moduleEmergence(module);
      if (moduleAmount <= 0.002) continue;

      const transformedVertices = module.vertices.map(
        (point) => transform4D(point, true),
      );

      for (const face of module.faces) {
        const visibility = faceVisibility(face) * moduleAmount;
        if (visibility <= 0.002) continue;

        const segments = intersectFaceWithViewW(
          transformedVertices,
          face,
          targetW,
        );

        for (const [a4, b4] of segments) {
          const key = segment3Key(a4, b4);
          if (seen.has(key)) continue;
          seen.add(key);

          drawLine(
            projectTransformed4DToScreen(a4),
            projectTransformed4DToScreen(b4),
            color,
            width,
            alpha * visibility,
          );
        }
      }
    }
  }

  function drawIntrinsicWSection(fraction, alpha, width, color) {
    const bounds = globalIntrinsicWBounds();
    const targetW = bounds.min + (bounds.max - bounds.min) * fraction;
    const seen = new Set();
    const epsilon = Math.max(1e-7, (bounds.max - bounds.min) * 1e-7);

    for (const module of modules) {
      const moduleAmount = moduleEmergence(module);
      if (moduleAmount <= 0.002 || !module.source3) continue;

      const profile = module.wProfile;
      const low = profile
        ? profile.center - profile.half
        : Math.min(...module.vertices.map((point) => point[3]));
      const high = profile
        ? profile.center + profile.half
        : Math.max(...module.vertices.map((point) => point[3]));

      if (targetW < low - epsilon || targetW > high + epsilon) continue;

      for (const edge of module.source3.edges) {
        const a3 = module.source3.vertices[edge.a];
        const b3 = module.source3.vertices[edge.b];
        if (!a3 || !b3) continue;

        const key = segment3Key(a3, b3);
        if (seen.has(key)) continue;
        seen.add(key);

        drawLine(
          projectToScreen([a3[0], a3[1], a3[2], targetW]),
          projectToScreen([b3[0], b3[1], b3[2], targetW]),
          color,
          width,
          alpha * moduleAmount,
        );
      }
    }
  }

  function drawWLayerOverlay() {
    if (
      state.wMix <= 0.001
      || !['w-slice', 'w-layers'].includes(state.insightMode)
    ) return;

    const fractions = state.insightMode === 'w-slice'
      ? [state.wSlice]
      : [0, 0.25, 0.5, 0.75, 1];

    for (const fraction of fractions) {
      const distanceFromFocus = Math.abs(fraction - state.wSlice);
      const alpha = state.insightMode === 'w-slice'
        ? 0.94
        : 0.15 + Math.max(0, 0.28 - distanceFromFocus * 0.30);
      const width = state.insightMode === 'w-slice' ? 1.75 : 0.95;
      const color = state.insightMode === 'w-slice'
        ? 'rgba(246,221,151,.98)'
        : 'rgba(220,224,232,.76)';

      if (
        state.wSectionSpace === 'view'
        && state.insightMode === 'w-slice'
      ) {
        drawViewSpaceWSection(fraction, alpha, width, color);
      } else {
        drawIntrinsicWSection(fraction, alpha, width, color);
      }
    }
  }

  function boundaryHypercells(filledModules = activeFilledModules()) {
    const cells = [];

    filledModules.forEach((module, moduleIndex) => {
      const minusFaces = module.faces.filter(
        (face) => !face.bridge && face.wLayer === -1,
      );
      const plusFaces = module.faces.filter(
        (face) => !face.bridge && face.wLayer === 1,
      );

      if (minusFaces.length) {
        cells.push({
          module,
          moduleIndex,
          kind: 'cap',
          wLayer: -1,
          label: 'W− cap',
        });
      }
      if (plusFaces.length) {
        cells.push({
          module,
          moduleIndex,
          kind: 'cap',
          wLayer: 1,
          label: 'W+ cap',
        });
      }

      const sideCount = Math.min(minusFaces.length, plusFaces.length);
      for (let sideIndex = 0; sideIndex < sideCount; sideIndex += 1) {
        cells.push({
          module,
          moduleIndex,
          kind: 'side',
          sideIndex,
          label: 'side ' + (sideIndex + 1),
        });
      }
    });

    return cells;
  }

  function selectedBoundaryHypercell(filledModules = activeFilledModules()) {
    const cells = boundaryHypercells(filledModules);
    if (!cells.length) return { cells, cell: null, index: 0 };

    const index = (
      (Math.floor(state.hypercellIndex) % cells.length)
      + cells.length
    ) % cells.length;

    return { cells, cell: cells[index], index };
  }

  function bridgeBelongsToSide(module, bridgeFace, capFace) {
    const n = module.source3?.vertices?.length
      || Math.floor(module.vertices.length / 2);
    if (!n || !capFace?.indices?.length) return false;

    const sideVertices = new Set(
      capFace.indices.map((index) => ((index % n) + n) % n),
    );
    const a = ((bridgeFace.indices[0] % n) + n) % n;
    const b = ((bridgeFace.indices[1] % n) + n) % n;
    return sideVertices.has(a) && sideVertices.has(b);
  }

  function hypercellFaceVisible(module, face, filledModules) {
    if (state.hypercellMode !== 'isolate' || state.wMix <= 0.001) {
      return true;
    }

    const { cell } = selectedBoundaryHypercell(filledModules);
    if (!cell || cell.module !== module) return false;

    if (cell.kind === 'cap') {
      return !face.bridge && face.wLayer === cell.wLayer;
    }

    const minusFaces = module.faces.filter(
      (item) => !item.bridge && item.wLayer === -1,
    );
    const plusFaces = module.faces.filter(
      (item) => !item.bridge && item.wLayer === 1,
    );
    const minus = minusFaces[cell.sideIndex];
    const plus = plusFaces[cell.sideIndex];

    if (face === minus || face === plus) return true;
    if (!face.bridge) return false;
    return bridgeBelongsToSide(module, face, minus);
  }

  function syncHypercellLabel() {
    if (!hypercellLabel) return;

    const { cells, cell, index } = selectedBoundaryHypercell();
    if (!cells.length) {
      hypercellLabel.textContent = 'no cells';
      return;
    }

    if (state.hypercellMode !== 'isolate') {
      hypercellLabel.textContent = cells.length + ' cells';
      return;
    }

    hypercellLabel.textContent =
      (index + 1) + '/' + cells.length + ' · '
      + cell.label + ' · module ' + (cell.moduleIndex + 1);
  }

  function transform3DReference`;

    if (!sectionFunctionPattern.test(source)) {
      console.warn('4D inspection patch skipped: section renderer');
    } else {
      source = source.replace(sectionFunctionPattern, sectionFunctions);
      changes += 1;
    }

    const faceLoopNeedle =
`      for (const face of module.faces) {
        const visibility = faceVisibility(face);`;
    const faceLoopReplacement =
`      for (const face of module.faces) {
        if (!hypercellFaceVisible(module, face, filledModules)) continue;
        const visibility = faceVisibility(face);`;

    const faceLoopCount = source.split(faceLoopNeedle).length - 1;
    if (faceLoopCount < 2) {
      console.warn(
        '4D inspection patch expected at least two filled-face loops, found:',
        faceLoopCount,
      );
    }
    if (faceLoopCount > 0) {
      source = source.split(faceLoopNeedle).join(faceLoopReplacement);
      changes += 1;
    }

    replaceRequired(
`    if (wSliceInput) {
      wSliceInput.disabled = !insightEnabled || state.insightMode !== 'w-slice';
    }
    wSliceControl?.classList.toggle(
      'is-disabled',
      !insightEnabled || state.insightMode !== 'w-slice',
    );
    if (replay4DButton) replay4DButton.disabled = !insightEnabled;`,
`    if (wSliceInput) {
      wSliceInput.disabled = !insightEnabled || state.insightMode !== 'w-slice';
    }
    wSliceControl?.classList.toggle(
      'is-disabled',
      !insightEnabled || state.insightMode !== 'w-slice',
    );

    const sectionEnabled = (
      insightEnabled
      && state.insightMode === 'w-slice'
    );
    wSectionSpaceButtons.forEach((button) => {
      button.disabled = !sectionEnabled;
      button.classList.toggle(
        'is-active',
        button.dataset.wSectionSpace === state.wSectionSpace,
      );
    });

    if (wSliceSweepButton) {
      wSliceSweepButton.disabled = (
        !insightEnabled
        || state.insightMode !== 'w-slice'
      );
      wSliceSweepButton.classList.toggle('is-active', state.wSliceSweep);
      wSliceSweepButton.setAttribute(
        'aria-pressed',
        state.wSliceSweep ? 'true' : 'false',
      );
    }

    if (wDepthToggle) {
      const wDepthEnabled = insightEnabled && state.renderMode !== 'wire';
      wDepthToggle.disabled = !wDepthEnabled;
      wDepthToggle.classList.toggle('is-active', state.wDepthColor);
      wDepthToggle.setAttribute(
        'aria-pressed',
        state.wDepthColor ? 'true' : 'false',
      );
    }

    const hypercellEnabled = insightEnabled && state.renderMode !== 'wire';
    if (hypercellToggle) {
      hypercellToggle.disabled = !hypercellEnabled;
      hypercellToggle.classList.toggle(
        'is-active',
        state.hypercellMode === 'isolate',
      );
      hypercellToggle.setAttribute(
        'aria-pressed',
        state.hypercellMode === 'isolate' ? 'true' : 'false',
      );
    }
    if (hypercellPrevButton) hypercellPrevButton.disabled = !hypercellEnabled;
    if (hypercellNextButton) hypercellNextButton.disabled = !hypercellEnabled;
    hypercellNav?.classList.toggle('is-disabled', !hypercellEnabled);
    syncHypercellLabel();

    if (replay4DButton) replay4DButton.disabled = !insightEnabled;`,
      '4D inspection UI state',
    );

    replaceRequired(
`  replay4DButton?.addEventListener('click', replay4DConstruction);`,
`  wSectionSpaceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.dataset.wSectionSpace;
      if (!['intrinsic', 'view'].includes(next)) return;
      state.wSectionSpace = next;
      wSectionSpaceButtons.forEach((item) => {
        item.classList.toggle(
          'is-active',
          item.dataset.wSectionSpace === state.wSectionSpace,
        );
      });
      markSettingsDirty();
      hideHint();
    });
  });

  wSliceSweepButton?.addEventListener('click', () => {
    if (state.insightMode !== 'w-slice') setInsightMode('w-slice');
    state.wSliceSweep = !state.wSliceSweep;
    wSliceSweepButton.classList.toggle('is-active', state.wSliceSweep);
    wSliceSweepButton.setAttribute(
      'aria-pressed',
      state.wSliceSweep ? 'true' : 'false',
    );
    hideHint();
  });

  wDepthToggle?.addEventListener('click', () => {
    state.wDepthColor = !state.wDepthColor;
    wDepthToggle.classList.toggle('is-active', state.wDepthColor);
    wDepthToggle.setAttribute(
      'aria-pressed',
      state.wDepthColor ? 'true' : 'false',
    );
    markSettingsDirty();
    hideHint();
  });

  hypercellToggle?.addEventListener('click', () => {
    state.hypercellMode = state.hypercellMode === 'isolate'
      ? 'all'
      : 'isolate';
    markSettingsDirty();
    updateUI();
    hideHint();
  });

  hypercellPrevButton?.addEventListener('click', () => {
    const { cells, index } = selectedBoundaryHypercell();
    if (!cells.length) return;
    state.hypercellMode = 'isolate';
    state.hypercellIndex = (index - 1 + cells.length) % cells.length;
    markSettingsDirty();
    updateUI();
    hideHint();
  });

  hypercellNextButton?.addEventListener('click', () => {
    const { cells, index } = selectedBoundaryHypercell();
    if (!cells.length) return;
    state.hypercellMode = 'isolate';
    state.hypercellIndex = (index + 1) % cells.length;
    markSettingsDirty();
    updateUI();
    hideHint();
  });

  replay4DButton?.addEventListener('click', replay4DConstruction);`,
      '4D inspection event listeners',
    );

    replaceRequired(
`      state.wSlice = clamp(nextValue, 0, 1);
      if (wSliceValue) {`,
`      state.wSlice = clamp(nextValue, 0, 1);
      if (interactive) state.wSliceSweep = false;
      if (wSliceValue) {`,
      'manual slice stops sweep',
    );

    replaceRequired(
`  function tick(now) {
    const dt = Math.min(0.05, (now - state.lastTime) / 1000);
    state.lastTime = now;

    updateTransition(now);
    updateAutorotation(dt);`,
`  function updateWSliceSweep(dt) {
    if (!state.wSliceSweep) return;

    if (
      state.dimension < 4
      || state.insightMode !== 'w-slice'
      || state.transition
    ) {
      if (state.dimension < 4 || state.insightMode !== 'w-slice') {
        state.wSliceSweep = false;
        wSliceSweepButton?.classList.remove('is-active');
        wSliceSweepButton?.setAttribute('aria-pressed', 'false');
      }
      return;
    }

    const speed = 0.22;
    state.wSlice += dt * speed * state.wSliceSweepDirection;

    if (state.wSlice >= 1) {
      state.wSlice = 1;
      state.wSliceSweepDirection = -1;
    } else if (state.wSlice <= 0) {
      state.wSlice = 0;
      state.wSliceSweepDirection = 1;
    }

    if (wSliceInput) wSliceInput.value = String(state.wSlice);
    if (wSliceValue) {
      wSliceValue.textContent = Math.round(state.wSlice * 100) + '%';
    }
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - state.lastTime) / 1000);
    state.lastTime = now;

    updateTransition(now);
    updateAutorotation(dt);
    updateWSliceSweep(dt);`,
      'animated W-section sweep',
    );

    window.__hypermandala4DInspectionPatch = {
      version: PATCH_VERSION,
      changes,
      faceLoopCount,
    };

    if (changes < 10) {
      console.warn(
        '4D inspection source patch applied partially:',
        changes,
        'changes',
      );
    }

    return new Response(source, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  };
})();
