(() => {
  'use strict';

  if (document.getElementById('learn4dInspectionMotionStyle')) return;

  const style = document.createElement('style');
  style.id = 'learn4dInspectionMotionStyle';
  style.textContent = `
    @keyframes learn4dInspectionMotion {
      0%, 12% {
        transform: perspective(1800px) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
      }
      20% {
        transform: perspective(1800px) rotateX(2.6deg) rotateY(0deg) rotateZ(0deg);
      }
      28%, 38% {
        transform: perspective(1800px) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
      }
      46% {
        transform: perspective(1800px) rotateX(0deg) rotateY(-2.6deg) rotateZ(0deg);
      }
      54%, 64% {
        transform: perspective(1800px) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
      }
      72% {
        transform: perspective(1800px) rotateX(0deg) rotateY(0deg) rotateZ(2.1deg);
      }
      80%, 100% {
        transform: perspective(1800px) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
      }
    }

    body.learn4d-active .learn4d-stage,
    body.learn4d-active .learn4d-enhanced-stage,
    body.learn4d-active .learn4d-elements-clean-stage {
      transform-origin: 50% 44.5%;
      transform-style: preserve-3d;
      will-change: transform;
      animation: learn4dInspectionMotion 18s ease-in-out infinite;
    }

    body.learn4d-active.learn4d-inspection-paused .learn4d-stage,
    body.learn4d-active.learn4d-inspection-paused .learn4d-enhanced-stage,
    body.learn4d-active.learn4d-inspection-paused .learn4d-elements-clean-stage {
      animation-play-state: paused;
    }

    @media (prefers-reduced-motion: reduce) {
      body.learn4d-active .learn4d-stage,
      body.learn4d-active .learn4d-enhanced-stage,
      body.learn4d-active .learn4d-elements-clean-stage {
        animation: none !important;
        transform: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  const playButton = document.querySelector('.learn4d-play');
  if (!playButton) return;

  function syncPauseState() {
    const isPaused = playButton.getAttribute('aria-label') === 'Play animation';
    document.body.classList.toggle('learn4d-inspection-paused', isPaused);
  }

  const observer = new MutationObserver(syncPauseState);
  observer.observe(playButton, {
    attributes: true,
    attributeFilter: ['aria-label'],
    childList: true,
    subtree: true,
  });

  syncPauseState();
})();
