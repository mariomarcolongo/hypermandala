(() => {
  'use strict';

  const launch = document.querySelector('.learn-4d-launch');
  const hud = document.querySelector('.learn4d-hud');
  const closeButton = document.querySelector('.learn4d-close');
  if (!launch || !hud || !closeButton) return;

  const TUTORIAL_HASH = '#learn4d';

  function tutorialIsActive() {
    return document.body.classList.contains('learn4d-active');
  }

  function tutorialHashIsActive() {
    return window.location.hash.toLowerCase() === TUTORIAL_HASH;
  }

  function tutorialUrl() {
    return `${window.location.pathname}${window.location.search}${TUTORIAL_HASH}`;
  }

  function pageUrlWithoutTutorialHash() {
    return `${window.location.pathname}${window.location.search}`;
  }

  /* Give Learn 4D a stable, shareable deep link without introducing a router. */
  launch.addEventListener('click', () => {
    if (!tutorialHashIsActive()) {
      window.history.pushState({ learn4d: true }, '', tutorialUrl());
    }
  }, { capture: true });

  /* Closing explicitly should leave the user on the normal Hypermandala page. */
  closeButton.addEventListener('click', () => {
    if (tutorialHashIsActive()) {
      window.history.replaceState(null, '', pageUrlWithoutTutorialHash());
    }
  });

  /* Clicking anywhere outside the compact tutorial controls exits Learn 4D.
     The canvas is intentionally non-interactive, so the whole visual field acts
     like the backdrop while the HUD remains fully usable. */
  document.addEventListener('pointerdown', (event) => {
    if (!tutorialIsActive()) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('.learn4d-hud, .learn-4d-launch')) return;

    closeButton.click();
  }, true);

  /* Browser Back/Forward should naturally enter and leave the tutorial. */
  function syncWithUrl() {
    const wantsTutorial = tutorialHashIsActive();
    const isOpen = tutorialIsActive();
    if (wantsTutorial && !isOpen) launch.click();
    else if (!wantsTutorial && isOpen) closeButton.click();
  }

  window.addEventListener('hashchange', syncWithUrl);

  /* Escape is handled by tutorial-base.js. Keep the URL in sync with that close. */
  const observer = new MutationObserver(() => {
    if (!tutorialIsActive() && tutorialHashIsActive()) {
      window.history.replaceState(null, '', pageUrlWithoutTutorialHash());
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* Direct links such as /#learn4d open automatically once the tutorial scripts exist. */
  if (tutorialHashIsActive()) requestAnimationFrame(syncWithUrl);
})();
