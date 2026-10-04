(() => {
  'use strict';

  const hud = document.querySelector('.learn4d-hud');
  const modesEl = document.querySelector('.learn4d-modes');
  if (!hud || !modesEl || document.querySelector('.learn4d-description')) return;

  const descriptions = {
    build: 'Watch the same rule repeat: each shape extends in a new perpendicular direction to become one dimension higher.',
    elements: 'Focus on one kind of part: points become edges, edges become faces, faces become cells, and the whole object gains a dimension.',
    emergence: 'Duplicate the current shape, move the copy in a new perpendicular direction, then connect matching parts. The result is one dimension higher.',
    continuum: 'Between the two ends are infinitely many slices: a line contains points, a square contains lines, a cube contains squares, and a tesseract contains cubes.',
    freedom: 'The new dimension is a choice: changing its length, scale, or twist produces different higher-dimensional forms.',
    slices: 'A slice shows only one cross-section. The same square or cube can belong to many different higher-dimensional objects.',
  };

  const style = document.createElement('style');
  style.textContent = `
    .learn4d-description {
      max-width: 650px;
      margin: 0 auto;
      padding: 1px 10px 3px;
      color: rgba(238,240,244,.48);
      font-size: 10px;
      font-weight: 470;
      line-height: 1.4;
      letter-spacing: .008em;
      text-align: center;
      text-wrap: balance;
      pointer-events: none;
    }

    @media (max-width: 680px) {
      .learn4d-description {
        padding: 0 5px 2px;
        font-size: 9px;
        line-height: 1.35;
      }
    }
  `;
  document.head.appendChild(style);

  const description = document.createElement('div');
  description.className = 'learn4d-description';
  description.setAttribute('aria-live', 'polite');
  modesEl.insertAdjacentElement('afterend', description);

  function syncDescription() {
    const active = modesEl.querySelector('.learn4d-mode.is-active');
    const mode = active?.dataset.mode || 'build';
    description.textContent = descriptions[mode] || descriptions.build;
  }

  modesEl.addEventListener('click', () => requestAnimationFrame(syncDescription));

  const observer = new MutationObserver(syncDescription);
  observer.observe(modesEl, {
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
  });

  syncDescription();
})();
