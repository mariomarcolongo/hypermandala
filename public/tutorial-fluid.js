(() => {
  'use strict';

  const base = document.createElement('script');
  base.src = './tutorial-base.js?reload=' + Date.now();
  base.async = false;
  base.onload = () => {
    const enhancements = document.createElement('script');
    enhancements.src = './tutorial-enhancements.js?reload=' + Date.now();
    enhancements.async = false;
    document.body.appendChild(enhancements);
  };
  document.body.appendChild(base);
})();
