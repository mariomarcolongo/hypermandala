/*
 * UI compatibility fixes for the expandable geometric-form library.
 *
 * Keep these hooks isolated from the geometry engine where possible. The
 * Sri Yantra source patch below is a narrow bootstrap compatibility layer:
 * it rewrites only Sri-specific literals/functions before app.js executes,
 * so the result still runs through the native Hypermandala geometry engine.
 */
(() => {
  'use strict';

  const SETTINGS_KEY = 'hypermandala-settings-v2';
  const EXPERIMENTAL_SELECTOR = '.mandala-card--experimental[data-preset]';
  let prepared = false;
  let installed = false;
  let savedExperimentalPreset = null;

  function isExperimentalPreset(preset) {
    if (!preset) return false;
    return Boolean(document.querySelector(
      EXPERIMENTAL_SELECTOR + '[data-preset="' + CSS.escape(preset) + '"]',
    ));
  }

  function readSavedExperimentalPreset() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      return isExperimentalPreset(saved?.preset) ? saved.preset : null;
    } catch {
      return null;
    }
  }

  function retireInsightUi() {
    /*
     * Keep 4D inspection available without returning to the old crowded
     * research panel. The public UI now exposes only exact W sections/layers
     * in a collapsed disclosure. Legacy W-color/reference modes remain internal
     * and must not be restored invisibly when their buttons are absent.
     */
    const explorer = document.getElementById('explorerControls');
    explorer?.setAttribute('aria-label', '4D explorer controls');

    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return;

      const visibleModes = new Set(['standard', 'w-slice', 'w-layers']);
      if (!visibleModes.has(saved.insightMode)) {
        saved.insightMode = 'standard';
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
      }
    } catch {
      // Storage may be unavailable in private/restricted contexts.
    }
  }

  function moveResizeControlsBelowLibrary() {
    const library = document.getElementById('presetControl');
    const expand = document.getElementById('expandGeometricForms');
    const reduce = document.getElementById('reduceGeometricForms');
    if (!library || !expand || !reduce) return;

    let actions = document.querySelector('.mandala-dock__library-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'mandala-dock__library-actions';
      actions.setAttribute('aria-label', 'Geometric form library display');
      library.insertAdjacentElement('afterend', actions);
    }

    actions.append(expand, reduce);
  }

  function injectLibraryStyles() {
    if (document.getElementById('hypermandalaFormsUiFixes')) return;

    const style = document.createElement('style');
    style.id = 'hypermandalaFormsUiFixes';
    style.textContent = `
      .mandala-dock__library-actions {
        display: flex;
        justify-content: center;
        margin: 8px 0 3px;
      }

      .mandala-dock.is-collapsed .mandala-dock__library-actions {
        display: none;
      }

      .mandala-dock__library-actions .mandala-dock__resize {
        align-items: center;
        justify-content: center;
        min-width: 104px;
      }

      .mandala-dock__library-actions .mandala-dock__resize--expand {
        display: inline-flex;
      }

      .mandala-dock__library-actions .mandala-dock__resize--reduce {
        display: none;
      }

      .mandala-dock.is-expanded
        .mandala-dock__library-actions
        .mandala-dock__resize--expand {
        display: none;
      }

      .mandala-dock.is-expanded
        .mandala-dock__library-actions
        .mandala-dock__resize--reduce {
        display: inline-flex;
      }

      /* If the selected form belongs to the extended library, keep that one
         card visible after "show less" so the current selection is not hidden. */
      .mandala-dock:not(.is-expanded)
        .mandala-library
        .mandala-card--experimental.is-active {
        display: grid;
      }
    `;
    document.head.appendChild(style);
  }

  function isClassicPreviewOutline(value) {
    const normalized = String(value).toLowerCase().replace(/\s+/g, '');
    return normalized === '#1d1714'
      || normalized === 'rgb(29,23,20)'
      || normalized === 'rgba(29,23,20,1)';
  }

  function patchExperimentalPreviewContexts() {
    const prototype = HTMLCanvasElement.prototype;
    if (prototype.__hypermandalaPreviewPatchInstalled) return;

    const originalGetContext = prototype.getContext;

    prototype.getContext = function patchedGetContext(type, ...args) {
      const context = originalGetContext.call(this, type, ...args);

      if (
        type !== '2d'
        || !context
        || !this.closest(EXPERIMENTAL_SELECTOR)
        || context.__hypermandalaDensePreviewPatched
      ) {
        return context;
      }

      Object.defineProperty(context, '__hypermandalaDensePreviewPatched', {
        value: true,
        configurable: false,
      });

      const originalStroke = context.stroke.bind(context);
      context.stroke = function patchedStroke(...strokeArgs) {
        if (!isClassicPreviewOutline(this.strokeStyle)) {
          return originalStroke(...strokeArgs);
        }

        /* The extended forms are built from many narrow reference pieces.
           At thumbnail scale, the normal 1px face outline plus the edge pass
           can cover most of those pieces in near-black. Make only those
           classic-mode thumbnail contours thinner and more transparent. */
        const previousAlpha = this.globalAlpha;
        const previousWidth = this.lineWidth;
        this.globalAlpha = previousAlpha * 0.36;
        this.lineWidth = Math.min(previousWidth, 0.55);

        try {
          return originalStroke(...strokeArgs);
        } finally {
          this.globalAlpha = previousAlpha;
          this.lineWidth = previousWidth;
        }
      };

      return context;
    };

    Object.defineProperty(prototype, '__hypermandalaPreviewPatchInstalled', {
      value: true,
      configurable: false,
    });
  }

  function patchSriYantraAppSource() {
    if (window.__hypermandalaSriSourcePatchInstalled) return;
    window.__hypermandalaSriSourcePatchInstalled = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async function patchedFetch(input, init) {
      const response = await originalFetch(input, init);
      const url = typeof input === 'string' ? input : input?.url || '';

      if (!/(^|\/)app\.js(?:[?#]|$)/.test(url)) return response;

      // app.js is loaded once during bootstrap. Restore native fetch before
      // evaluating it so every later network request behaves normally.
      window.fetch = originalFetch;
      if (!response.ok) return response;

      let source = await response.text();
      let changes = 0;

      const replaceRequired = (before, after, label) => {
        if (!source.includes(before)) {
          console.warn('Sri Yantra source patch skipped:', label);
          return;
        }
        source = source.replace(before, after);
        changes += 1;
      };

      replaceRequired(
`  const SRI_COLORS = {
    // Manuscript-inspired traditional palette. Geometry is deliberately
    // unchanged: these colors only affect Classic rendering.
    bhupura: '#eadfbd',
    lotus16: '#d1a13c',
    lotus8: '#cf8d98',
    triangles: [
      '#c96f4d', // D1 · terracotta
      '#d39b40', // U1 · ochre
      '#748e68', // U3 · muted green
      '#c77855', // U2 · warm brick
      '#d5b451', // D3 · yellow ochre
      '#7b956f', // D2 · leaf green
      '#cf844c', // U4 · orange earth
      '#b96857', // D4 · muted red
      '#ddc66c', // D5 · warm central yellow
    ],
    bindu: '#e2b0a7',
  };`,
`  const SRI_COLORS = {
    // Historical painted-reference palette. Geometry remains independent of
    // color so the same plan still performs the native 3D and 4D lifts.
    bhupura: '#eadfbd',
    lotus16: '#d0a23b',
    lotus8: '#ce8e98',
    trivalaya: '#777b76',
    cells: {
      terracotta: '#c46e4d',
      orange: '#c6652f',
      ochre: '#c99a32',
      green: '#71815f',
    },
    bindu: '#e1b2a8',
  };`,
        'palette',
      );

      replaceRequired(
`    if (regionId === 'sri-bhupura') return hexToRgb(SRI_COLORS.bhupura);
    if (regionId === 'sri-lotus16') return hexToRgb(SRI_COLORS.lotus16);
    if (regionId === 'sri-lotus8') return hexToRgb(SRI_COLORS.lotus8);
    if (
      regionId?.startsWith('sri-shiva-')
      || regionId?.startsWith('sri-shakti-')
    ) {
      const index = Number(regionId.split('-')[2]);
      const color = SRI_COLORS.triangles[index] ?? SRI_COLORS.triangles[0];
      return hexToRgb(color);
    }
    if (regionId === 'sri-bindu') return hexToRgb(SRI_COLORS.bindu);`,
`    if (regionId === 'sri-bhupura') return hexToRgb(SRI_COLORS.bhupura);
    if (regionId === 'sri-lotus16') return hexToRgb(SRI_COLORS.lotus16);
    if (regionId === 'sri-lotus8') return hexToRgb(SRI_COLORS.lotus8);
    if (regionId === 'sri-trivalaya') return hexToRgb(SRI_COLORS.trivalaya);
    if (regionId?.startsWith('sri-cell-')) {
      const key = regionId.slice('sri-cell-'.length);
      return hexToRgb(SRI_COLORS.cells[key] ?? SRI_COLORS.cells.terracotta);
    }
    if (
      regionId?.startsWith('sri-shiva-')
      || regionId?.startsWith('sri-shakti-')
    ) return hexToRgb(SRI_COLORS.cells.terracotta);
    if (regionId === 'sri-bindu') return hexToRgb(SRI_COLORS.bindu);`,
        'classic region mapping',
      );

      replaceRequired(
`    pieces.push(...lotusRingPieces(
      16, 1.58, 0.34, 0.22,
      'sri-lotus16', 1, 10,
    ));
    pieces.push(...lotusRingPieces(
      8, 1.28, 0.42, 0.36,
      'sri-lotus8', 2, 20,
    ));`,
`    // Radially disjoint lotus enclosures. The petals remain closed polygons,
    // therefore they still extrude and W-lift with the native engine.
    pieces.push(...lotusRingPieces(
      16, 1.51, 0.24, 0.46,
      'sri-lotus16', 1, 10,
    ));
    pieces.push(...lotusRingPieces(
      8, 1.25, 0.24, 0.78,
      'sri-lotus8', 2, 20,
    ));`,
        'lotus geometry',
      );

      replaceRequired(
`            regionId: 'sri-lotus8',
            level: 3,
            paintOrder: order,`,
`            regionId: 'sri-trivalaya',
            level: 3,
            paintOrder: order,`,
        'trivalaya color region',
      );

      replaceRequired(
`  function buildSriYantraPlan() {
    buildPlanFromPieces(sriYantraPieces());
  }`,
`  const SRI_REFERENCE_CELL_ANCHORS = [
  // One reference anchor per visible triangular subdivision. These
  // were registered against the historical painted Sri Yantra image,
  // rather than inferred by symmetry or nearest-color heuristics.
  [0.000000, 0.812633, 'orange'],
  [-0.409819, 0.635460, 'orange'],
  [0.409819, 0.635460, 'orange'],
  [-0.199217, 0.592694, 'green'],
  [0.199217, 0.592694, 'green'],
  [0.000000, 0.556038, 'ochre'],
  [-0.415511, 0.470506, 'terracotta'],
  [0.415511, 0.470506, 'terracotta'],
  [-0.557809, 0.403302, 'ochre'],
  [-0.278904, 0.403302, 'terracotta'],
  [0.278904, 0.403302, 'terracotta'],
  [0.557809, 0.403302, 'ochre'],
  [-0.136606, 0.366646, 'ochre'],
  [0.136606, 0.366646, 'ochre'],
  [-0.421203, 0.336099, 'orange'],
  [0.000000, 0.336099, 'ochre'],
  [0.421203, 0.336099, 'orange'],
  [-0.574885, 0.268895, 'orange'],
  [-0.273212, 0.268895, 'terracotta'],
  [0.273212, 0.268895, 'terracotta'],
  [-0.193525, 0.232238, 'ochre'],
  [0.193525, 0.232238, 'ochre'],
  [-0.091071, 0.213910, 'ochre'],
  [0.091071, 0.213910, 'ochre'],
  [0.000000, 0.195582, 'ochre'],
  [-0.768410, 0.183363, 'green'],
  [-0.421203, 0.183363, 'orange'],
  [0.421203, 0.183363, 'orange'],
  [0.768410, 0.183363, 'green'],
  [-0.187834, 0.158925, 'ochre'],
  [0.187834, 0.158925, 'ochre'],
  [-0.119530, 0.122269, 'orange'],
  [0.119530, 0.122269, 'green'],
  [-0.267521, 0.116159, 'terracotta'],
  [0.267521, 0.116159, 'terracotta'],
  [0.000000, 0.097831, 'terracotta'],
  [0.187834, 0.085612, 'green'],
  [-0.324440, 0.073394, 'terracotta'],
  [0.324440, 0.073394, 'terracotta'],
  [-0.113839, 0.055065, 'orange'],
  [0.113839, 0.055065, 'green'],
  [0.256137, 0.055065, 'terracotta'],
  [-0.203486, 0.039792, 'terracotta'],
  [-0.176450, 0.018409, 'orange'],
  [0.176450, 0.018409, 'terracotta'],
  [-0.591960, 0.012299, 'green'],
  [0.591960, 0.012299, 'green'],
  [0.000000, 0.000081, 'terracotta'],
  [0.216293, -0.024357, 'terracotta'],
  [-0.096763, -0.048795, 'terracotta'],
  [0.096763, -0.048795, 'terracotta'],
  [-0.273212, -0.061014, 'terracotta'],
  [0.273212, -0.061014, 'terracotta'],
  [-0.179296, -0.094615, 'terracotta'],
  [0.179296, -0.094615, 'terracotta'],
  [-0.352899, -0.103780, 'terracotta'],
  [0.352899, -0.103780, 'terracotta'],
  [-0.273212, -0.152655, 'terracotta'],
  [0.000000, -0.152655, 'terracotta'],
  [0.273212, -0.152655, 'terracotta'],
  [-0.774102, -0.158764, 'ochre'],
  [-0.421203, -0.158764, 'ochre'],
  [0.421203, -0.158764, 'ochre'],
  [0.774102, -0.158764, 'ochre'],
  [-0.108147, -0.177093, 'green'],
  [0.108147, -0.177093, 'orange'],
  [-0.199217, -0.195421, 'green'],
  [0.199217, -0.195421, 'terracotta'],
  [-0.574885, -0.244296, 'green'],
  [-0.273212, -0.244296, 'terracotta'],
  [0.273212, -0.244296, 'terracotta'],
  [0.574885, -0.244296, 'green'],
  [-0.415511, -0.323719, 'orange'],
  [0.000000, -0.323719, 'ochre'],
  [0.415511, -0.323719, 'orange'],
  [-0.130914, -0.360375, 'ochre'],
  [0.130914, -0.360375, 'ochre'],
  [-0.563501, -0.403141, 'orange'],
  [-0.267521, -0.403141, 'terracotta'],
  [0.267521, -0.403141, 'terracotta'],
  [0.563501, -0.403141, 'ochre'],
  [-0.398435, -0.482563, 'orange'],
  [0.398435, -0.482563, 'orange'],
  [0.000000, -0.555876, 'ochre'],
  [-0.193525, -0.586423, 'terracotta'],
  [0.193525, -0.586423, 'terracotta'],
  [-0.381359, -0.629189, 'terracotta'],
  [0.381359, -0.629189, 'orange'],
  [0.000000, -0.800253, 'green'],
];

  function sriCellRegionId(point) {
    let best = SRI_REFERENCE_CELL_ANCHORS[0];
    let bestDistance = Infinity;

    for (const anchor of SRI_REFERENCE_CELL_ANCHORS) {
      const dx = point[0] - anchor[0];
      const dy = point[1] - anchor[1];
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        best = anchor;
        bestDistance = distance;
      }
    }

    return 'sri-cell-' + best[2];
  }

  function sriTriangleCellData() {
    const triangles = sriTriangleSpecs();
    const network = yantraSubdivisionNetwork(triangles);
    const cells = yantraNetworkCells(network);

    return cells.map((cell) => {
      const centroid = yantraPolygonCentroid(cell);
      const covering = yantraContainingTriangles(centroid, triangles);
      return {
        cell,
        centroid,
        depth: covering.length,
        regionId: sriCellRegionId(centroid),
      };
    }).filter((item) => item.depth > 0);
  }

  function buildSriYantraPlan() {
    clearPlan();
    const pieces = sriYantraPieces();

    for (const piece of pieces) {
      const parentTriangle =
        piece.regionId?.startsWith('sri-shiva-')
        || piece.regionId?.startsWith('sri-shakti-');
      if (parentTriangle) continue;

      addPlanLoop(
        piece.points,
        true,
        piece.regionId,
        piece.paintOrder,
      );
    }

    // Color the visible planar subdivisions, not the nine overlapping source
    // triangles. This is what allows the painted reference disposition to be
    // represented without changing the underlying Sri triangle coordinates.
    for (const item of sriTriangleCellData()) {
      addPlanLoop(
        item.cell,
        true,
        item.regionId,
        40 + item.depth,
      );
    }
  }`,
        'Sri 2D cell renderer',
      );

      replaceRequired(
`      cellData.push({
        cell,
        centroid,
        depth,
        visiblePiece,
      });`,
`      cellData.push({
        cell,
        centroid,
        depth,
        visiblePiece,
        regionId: state.preset === 'sriyantra'
          ? sriCellRegionId(centroid)
          : visiblePiece.regionId,
      });`,
        '3D Sri cell semantics',
      );

      replaceRequired(
`          item.visiblePiece.regionId,
          [],
          {
            hierarchyT: 0.24 + 0.66 * (item.depth / maxDepth),
            polarity: regionPolarity(item.visiblePiece.regionId),`,
`          item.regionId,
          [],
          {
            hierarchyT: 0.24 + 0.66 * (item.depth / maxDepth),
            polarity: regionPolarity(item.regionId),`,
        'separated Sri cell color',
      );

      replaceRequired(
`        item.visiblePiece.regionId,
        [],
        {
          hierarchyT: 0.24 + 0.66 * (item.depth / maxDepth),
          polarity: regionPolarity(item.visiblePiece.regionId),`,
`        item.regionId,
        [],
        {
          hierarchyT: 0.24 + 0.66 * (item.depth / maxDepth),
          polarity: regionPolarity(item.regionId),`,
        'compact Sri cell color',
      );

      if (changes !== 8) {
        console.warn('Sri Yantra source patch applied', changes, 'of 8 expected changes');
      }

      return new Response(source, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    };
  }

  function activePreset() {
    return document.querySelector('.mandala-card.is-active[data-preset]')
      ?.dataset.preset || null;
  }

  function restoreExperimentalPreset(preset) {
    if (!isExperimentalPreset(preset)) return;

    const button = document.querySelector(
      EXPERIMENTAL_SELECTOR + '[data-preset="' + CSS.escape(preset) + '"]',
    );
    if (!button || button.classList.contains('is-active')) return;

    /* A hidden button can still be activated programmatically. This routes
       through the app's existing preset handler, so geometry and settings stay
       in sync instead of maintaining a second state store here. */
    button.click();
  }

  function preserveSelectionAcross(control) {
    if (!control) return;

    let presetBeforeClick = null;

    control.addEventListener('click', () => {
      presetBeforeClick = activePreset();
    }, true);

    /* Installed after app.js, so this target-phase listener runs after the
       app's own click handler and can restore an experimental selection that
       the legacy collapse behavior changed to Square. */
    control.addEventListener('click', () => {
      const preset = presetBeforeClick;
      presetBeforeClick = null;
      restoreExperimentalPreset(preset);
    });
  }

  function loadDimensionTutorial() {
    if (
      window.__hypermandalaTutorialInstalled
      || document.querySelector('script[data-hypermandala-tutorial]')
    ) return;

    const script = document.createElement('script');
    script.dataset.hypermandalaTutorial = 'true';
    script.src = './tutorial-fluid.js?reload=' + Date.now();
    script.async = true;
    document.body.appendChild(script);
  }

  function prepare() {
    if (prepared) return;
    prepared = true;

    retireInsightUi();
    moveResizeControlsBelowLibrary();
    injectLibraryStyles();
    savedExperimentalPreset = readSavedExperimentalPreset();
    patchExperimentalPreviewContexts();
    // Sri Yantra is implemented natively in app.js.
  }

  function install() {
    if (installed) return;
    installed = true;

    preserveSelectionAcross(document.getElementById('reduceGeometricForms'));
    preserveSelectionAcross(document.getElementById('toggleGeometricForms'));

    /* app.js historically discarded an extended preset when restoring a
       compact/collapsed library. Restore the saved choice before the first
       animation-frame settings flush. */
    restoreExperimentalPreset(savedExperimentalPreset);
    loadDimensionTutorial();
  }

  window.__hypermandalaPrepareUiFixes = prepare;
  window.__hypermandalaInstallUiFixes = install;

  prepare();
})();
