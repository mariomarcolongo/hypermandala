/*
 * UI compatibility fixes for the expandable geometric-form library.
 *
 * Most hooks only adjust thumbnail rendering and panel/selection behavior.
 * The Sri Yantra source transform below is intentionally narrow: it replaces
 * only that preset's geometry/palette inside app.js before the native engine
 * executes, so Sri Yantra keeps the same controls, animation, projection,
 * scaling and 4D machinery as every other Hypermandala form.
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

  function replaceSourceRange(source, startMarker, endMarker, replacement, label) {
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start + startMarker.length);

    if (start < 0 || end < 0 || end <= start) {
      console.warn('Hypermandala Sri patch skipped missing section:', label);
      return { source, changed: false };
    }

    return {
      source: source.slice(0, start) + replacement + source.slice(end),
      changed: true,
    };
  }

  function transformSriYantraSource(originalSource) {
    let source = originalSource;
    let patchCount = 0;
    const replace = (startMarker, endMarker, replacement, label) => {
      const result = replaceSourceRange(
        source,
        startMarker,
        endMarker,
        replacement,
        label,
      );
      source = result.source;
      if (result.changed) patchCount += 1;
    };

    replace(
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

    replace(
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

    replace(
      "  function lotusPetalFootprint(",
      "  function bhupuraPieces(",
      `  function lotusPetalFootprint(
    radius,
    radialLength,
    tangentialWidth,
    angle,
  ) {
    /*
     * A closed convex lens rather than a detached teardrop glyph. Because the
     * petal is an ordinary footprint polygon, the native prism/hyperprism
     * machinery can lift exactly the same petal through Z and W.
     */
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
  }

`,
      'lotus petal geometry',
    );

    replace(
      "  function sriYantraPieces() {",
      "  function kaliYantraPieces() {",
      `  function sriYantraPieces() {
    const complex = state.complexity === 'complex';
    const pieces = [];

    /*
     * Traditional structure is encoded as actual native geometry:
     * three bhupura ramparts, trivalaya, sixteen- and eight-petal lotuses,
     * the nine-triangle network as linework, central trikona and bindu.
     * We deliberately do not paint the nine generating triangles as large
     * Shiva/Shakti color fields; that falsely colors the 43 resulting chambers.
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
          64,
          Math.PI / 64,
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

    pieces.push(...lotusRingPieces(
      16,
      1.49,
      0.34,
      0.25,
      'sri-lotus16',
      4,
      12,
    ));
    pieces.push(...lotusRingPieces(
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
          points: ribbonSegmentFootprint(a, b, complex ? 0.014 : 0.018),
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

    replace(
      "  function buildSriYantraForm() {",
      "  function buildKaliYantraForm() {",
      `  function buildSriYantraForm() {
    const pieces = sriYantraPieces();

    /*
     * Keep Sri Yantra inside the same geometry engine as every other mandala.
     * Each closed 2D region becomes a native prism in 3D, then the ordinary
     * Hypermandala W extrusion turns that prism into its 4D hyperprism. This
     * includes every lotus petal; there is no decorative 2D-only layer.
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

    if (patchCount !== 5) {
      console.warn(
        'Hypermandala Sri patch applied only',
        patchCount,
        'of 5 sections; keeping the executable source but review app.js markers.',
      );
    }

    return source;
  }

  function installNativeSriYantraPatch() {
    if (window.__hypermandalaSriNativeSourcePatchInstalled) return;
    window.__hypermandalaSriNativeSourcePatchInstalled = true;

    const nativeFetch = window.fetch.bind(window);
    window.fetch = async function hypermandalaPatchedFetch(input, init) {
      const response = await nativeFetch(input, init);
      const requestUrl = typeof input === 'string'
        ? input
        : input?.url || '';

      if (!/(^|\/)app\.js(?:[?#]|$)/.test(requestUrl)) {
        return response;
      }

      const source = await response.text();
      const transformed = transformSriYantraSource(source);

      return new Response(transformed, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    };
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

    installNativeSriYantraPatch();
    retireInsightUi();
    moveResizeControlsBelowLibrary();
    injectLibraryStyles();
    savedExperimentalPreset = readSavedExperimentalPreset();
    patchExperimentalPreviewContexts();
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
