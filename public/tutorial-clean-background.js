(() => {
  'use strict';

  if (document.getElementById('learn4dCleanBackgroundStyles')) return;

  const style = document.createElement('style');
  style.id = 'learn4dCleanBackgroundStyles';
  style.textContent = `
    /* Learn 4D should show only tutorial geometry.  Hide every non-tutorial
       canvas outright and also place an opaque site-colored backdrop below the
       tutorial canvases, so no WebGL/main-scene fragments can bleed through. */
    body.learn4d-active #solidLayer,
    body.learn4d-active #mandala,
    body.learn4d-active #basisCanvas,
    body.learn4d-active #referenceCanvas {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
    }

    body.learn4d-active > canvas:not(.learn4d-stage):not(.learn4d-enhanced-stage):not(.learn4d-elements-clean-stage):not(.learn4d-build-rotation-stage) {
      display: none !important;
    }

    .learn4d-clean-backdrop {
      position: fixed;
      inset: 0;
      z-index: 6;
      background: #07090b;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 140ms ease, visibility 0s linear 140ms;
    }

    body.learn4d-active .learn4d-clean-backdrop {
      opacity: 1;
      visibility: visible;
      transition: opacity 140ms ease, visibility 0s;
    }
  `;
  document.head.appendChild(style);

  const backdrop = document.createElement('div');
  backdrop.className = 'learn4d-clean-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.appendChild(backdrop);
})();
