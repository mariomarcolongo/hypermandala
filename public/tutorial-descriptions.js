(() => {
  'use strict';

  const hud = document.querySelector('.learn4d-hud');
  const modesEl = document.querySelector('.learn4d-modes');
  const timeline = document.querySelector('.learn4d-timeline');
  if (!hud || !modesEl || !timeline || document.querySelector('.learn4d-step-description')) return;

  const style = document.createElement('style');
  style.textContent = `
    /* The small line above is a label; the sentence below is the explanation.
       Keep the hierarchy obvious and readable even on large desktop screens. */
    body.learn4d-active .learn4d-caption {
      font-size: clamp(11px, .58vw, 14px) !important;
      color: rgba(244,246,249,.62) !important;
      max-width: min(820px, calc(100vw - 40px)) !important;
    }

    .learn4d-step-description {
      position: fixed;
      top: max(54px, calc(env(safe-area-inset-top) + 50px));
      left: 50%;
      z-index: 9;
      transform: translateX(-50%);
      width: min(900px, calc(100vw - 48px));
      padding: 9px 16px;
      border-radius: 12px;
      background: rgba(7,9,11,.46);
      color: rgba(248,249,251,.88);
      font-size: clamp(14px, .70vw, 17px);
      font-weight: 500;
      line-height: 1.45;
      letter-spacing: .003em;
      text-align: center;
      text-wrap: balance;
      text-shadow: 0 1px 10px rgba(0,0,0,.42);
      backdrop-filter: blur(9px);
      -webkit-backdrop-filter: blur(9px);
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 150ms ease, visibility 0s linear 150ms;
    }

    body.learn4d-active .learn4d-step-description {
      opacity: 1;
      visibility: visible;
      transition: opacity 150ms ease, visibility 0s;
    }

    @media (max-width: 680px) {
      body.learn4d-active .learn4d-caption {
        font-size: 11px !important;
        max-width: calc(100vw - 24px) !important;
      }

      .learn4d-step-description {
        top: max(46px, calc(env(safe-area-inset-top) + 42px));
        width: calc(100vw - 20px);
        padding: 7px 10px;
        border-radius: 10px;
        font-size: 13px;
        line-height: 1.4;
      }
    }
  `;
  document.head.appendChild(style);

  /* Remove the older static HUD paragraph if this script is hot-reloaded. */
  document.querySelector('.learn4d-description')?.remove();

  const description = document.createElement('div');
  description.className = 'learn4d-step-description';
  description.setAttribute('aria-live', 'polite');
  document.body.appendChild(description);

  const objects = ['point', 'line', 'square', 'cube'];
  const results = ['line', 'square', 'cube', 'tesseract'];
  const matchingParts = ['point', 'endpoints', 'corners', 'vertices'];

  function stageInfo(t) {
    const x = Math.max(0, Math.min(1, t)) * 4;
    const stage = Math.min(3, Math.floor(x));
    return { stage, local: x >= 4 ? 1 : x - stage };
  }

  function buildText(stage) {
    return [
      'A point moves along a new axis. Its path becomes a line.',
      'Now the whole line moves. Every point traces a line, and together those paths fill a square.',
      'The whole square moves through a third axis. Its edges sweep faces, while the square sweeps out a cube.',
      'The whole cube moves through W. Vertices trace edges, edges sweep faces, and faces sweep cubic cells: a tesseract.',
    ][stage];
  }

  function elementsText(stage) {
    const focus = document.querySelector('.learn4d-focus-button.is-active')?.dataset.focus || 'all';
    if (focus === 'vertices') {
      return stage === 3
        ? 'Follow the vertices: every cube vertex traces a new edge through W.'
        : 'Follow the points: each point traces an edge in the new dimension.';
    }
    if (focus === 'edges') {
      return stage >= 1
        ? 'Follow the edges: every existing edge sweeps out a face in the new dimension.'
        : 'Edges appear only after the first dimensional step.';
    }
    if (focus === 'faces') {
      return stage >= 2
        ? 'Follow the faces: every square face sweeps out a 3D cell in the new dimension.'
        : 'Faces appear once the construction reaches 2D.';
    }
    if (focus === 'whole') {
      return `The entire ${objects[stage]} sweeps out a ${results[stage]}.`;
    }
    return [
      'The point gains one new direction and becomes an edge.',
      'Every point traces an edge, while the line itself sweeps a face.',
      'Points trace edges, edges sweep faces, and the square sweeps the cube.',
      'Vertices trace W-edges, edges sweep square faces, faces sweep cubic cells, and the cube sweeps the tesseract.',
    ][stage];
  }

  function emergenceText(stage, local) {
    const source = objects[stage];
    if (local < .20) {
      return `1 · Make an identical copy of the ${source}. At first, the two copies occupy the same place.`;
    }
    if (local < .72) {
      return `2 · Move only the copy in a new perpendicular direction. The original ${source} stays where it is.`;
    }
    if (local < .98) {
      return `3 · Connect corresponding ${matchingParts[stage]} between the two identical copies.`;
    }
    return `Result · the two ${source}s and their connections form a ${results[stage]} — one dimension higher.`;
  }

  function continuumText(stage) {
    return [
      'A point sweeps continuously along the line. The dots are only samples: infinitely many point positions lie between them.',
      'A line sweeps continuously across the square. Every intermediate position is another line, so the square contains infinitely many parallel lines.',
      'A square sweeps continuously through the cube. Every intermediate depth is another square, so the cube contains infinitely many square slices.',
      'A cube sweeps continuously through W. Every intermediate W-position is another cube, so the tesseract contains infinitely many cubic slices.',
    ][stage];
  }

  function variationsText(t) {
    return t < .5
      ? 'The continuation is not unique: change how far the square moves, or let it taper or twist, and a different 3D form appears.'
      : 'The same freedom exists in 4D. A tesseract is only the regular equal-length case; a cube can continue through W in many other ways.';
  }

  function slicesText(t) {
    return t < .5
      ? 'The highlighted square is only one 2D slice. Many different 3D objects can have exactly that same square cross-section.'
      : 'The highlighted cube is only one 3D slice. Many different 4D objects can contain exactly that same cube cross-section.';
  }

  function textFor(mode, t) {
    const { stage, local } = stageInfo(t);
    if (mode === 'build') return buildText(stage);
    if (mode === 'elements') return elementsText(stage);
    if (mode === 'emergence') return emergenceText(stage, local);
    if (mode === 'continuum') return continuumText(stage);
    if (mode === 'freedom') return variationsText(t);
    if (mode === 'slices') return slicesText(t);
    return '';
  }

  let previousText = '';
  function syncDescription() {
    const active = modesEl.querySelector('.learn4d-mode.is-active');
    const mode = active?.dataset.mode || 'build';
    const t = Number(timeline.value) || 0;
    const next = textFor(mode, t);
    if (next !== previousText) {
      previousText = next;
      description.textContent = next;
    }
  }

  modesEl.addEventListener('click', () => requestAnimationFrame(syncDescription));
  timeline.addEventListener('input', syncDescription);

  const observer = new MutationObserver(syncDescription);
  observer.observe(modesEl, {
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
  });

  function frame() {
    if (document.body.classList.contains('learn4d-active')) syncDescription();
    requestAnimationFrame(frame);
  }

  syncDescription();
  requestAnimationFrame(frame);
})();
