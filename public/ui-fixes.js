/*
 * UI compatibility fixes for the expandable geometric-form library.
 *
 * Keep these hooks isolated from the geometry engine: they only adjust
 * thumbnail rendering and panel/selection behavior.
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
     * The old "4D insight" block exposed several research/diagnostic modes
     * directly in the main control panel. They add a lot of visual and verbal
     * complexity, and some are not yet robust enough to be primary UX.
     *
     * Keep the underlying experimental renderer code available for future work,
     * but remove these controls from the public interface for now. The core 4D
     * experience remains available through projection, rotation planes and
     * dimension stretch.
     */
    document.querySelector('.insight-section')?.remove();

    const explorer = document.getElementById('explorerControls');
    explorer?.setAttribute('aria-label', 'Explorer controls');

    // Do not let an old saved diagnostic mode stay active invisibly after the
    // controls are removed. Reset persisted state before app.js restores it.
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return;

      let changed = false;
      if (saved.insightMode !== 'standard') {
        saved.insightMode = 'standard';
        changed = true;
      }
      if (saved.wSlice !== 0.5) {
        saved.wSlice = 0.5;
        changed = true;
      }

      if (changed) {
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
    script.src = './tutorial.js?reload=' + Date.now();
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
