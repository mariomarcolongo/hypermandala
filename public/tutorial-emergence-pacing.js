(() => {
  'use strict';

  const modes = document.querySelector('.learn4d-modes');
  const timeline = document.querySelector('.learn4d-timeline');
  const play = document.querySelector('.learn4d-play');
  if (!modes || !timeline || !play) return;

  /*
   * Emergence carries four separate ideas inside every dimensional step.
   * Let each visual state settle briefly so the accompanying sentence can
   * actually be read. Pauses happen only during forward autoplay; scrubbing,
   * manual pause/play, and reverse playback remain fully under the user.
   */
  const holds = [
    { at: .18, ms: 1900 }, // identical copy is now visible
    { at: .68, ms: 2100 }, // copy has nearly reached the new axis position
    { at: .95, ms: 1900 }, // matching parts are almost fully connected
    { at: .985, ms: 2400 }, // completed higher-dimensional result
  ];

  let lastValue = Number(timeline.value) || 0;
  let lastStage = 0;
  let held = new Set();
  let timer = 0;
  let autoPaused = false;
  let userInterrupted = false;

  function emergenceActive() {
    return modes.querySelector('.learn4d-mode.is-active')?.dataset.mode === 'emergence';
  }

  function isPlaying() {
    return play.getAttribute('aria-label') === 'Pause animation' || play.textContent.trim() === 'Ⅱ';
  }

  function cancelAutoPause() {
    if (timer) window.clearTimeout(timer);
    timer = 0;
    autoPaused = false;
  }

  function pauseFor(ms) {
    if (!isPlaying()) return;
    userInterrupted = false;
    autoPaused = true;
    play.click();

    timer = window.setTimeout(() => {
      timer = 0;
      if (!autoPaused || userInterrupted || !emergenceActive()) {
        autoPaused = false;
        return;
      }
      if (!isPlaying()) play.click();
      autoPaused = false;
    }, ms);
  }

  play.addEventListener('click', (event) => {
    if (!event.isTrusted || !autoPaused) return;
    userInterrupted = true;
    cancelAutoPause();
  }, true);

  timeline.addEventListener('pointerdown', () => {
    userInterrupted = true;
    cancelAutoPause();
  }, true);

  modes.addEventListener('click', () => {
    cancelAutoPause();
    held.clear();
    lastValue = Number(timeline.value) || 0;
    lastStage = Math.min(3, Math.floor(lastValue * 4));
  });

  function frame() {
    const value = Number(timeline.value) || 0;

    if (!emergenceActive()) {
      cancelAutoPause();
      held.clear();
      lastValue = value;
      lastStage = Math.min(3, Math.floor(value * 4));
      requestAnimationFrame(frame);
      return;
    }

    const scaled = Math.max(0, Math.min(1, value)) * 4;
    const stage = Math.min(3, Math.floor(scaled));
    const local = scaled >= 4 ? 1 : scaled - stage;

    const previousScaled = Math.max(0, Math.min(1, lastValue)) * 4;
    const previousStage = Math.min(3, Math.floor(previousScaled));
    const previousLocal = previousScaled >= 4 ? 1 : previousScaled - previousStage;
    const movingForward = value > lastValue + 0.00001;

    if (stage !== lastStage) {
      held.clear();
      lastStage = stage;
    }

    if (movingForward && stage === previousStage && !autoPaused) {
      for (let i = 0; i < holds.length; i += 1) {
        const hold = holds[i];
        const key = `${stage}:${i}`;
        if (!held.has(key) && previousLocal < hold.at && local >= hold.at) {
          held.add(key);
          pauseFor(hold.ms);
          break;
        }
      }
    }

    lastValue = value;
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
