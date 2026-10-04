(() => {
  'use strict';

  if (document.getElementById('learn4dCleanBackgroundStyles')) return;

  const style = document.createElement('style');
  style.id = 'learn4dCleanBackgroundStyles';
  style.textContent = `
    /* Learn 4D should show only tutorial geometry. The main Hypermandala
       canvases used to remain faintly visible and appeared as stray blocks. */
    body.learn4d-active #solidLayer,
    body.learn4d-active #mandala {
      opacity: 0 !important;
      visibility: hidden !important;
    }
  `;
  document.head.appendChild(style);
})();
