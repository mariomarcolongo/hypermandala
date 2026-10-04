(() => {
  'use strict';

  const base = document.createElement('script');
  base.src = './tutorial-base.js?reload=' + Date.now();
  base.async = false;
  base.onload = () => {
    const enhancements = document.createElement('script');
    enhancements.src = './tutorial-enhancements.js?reload=' + Date.now();
    enhancements.async = false;
    enhancements.onload = () => {
      const descriptions = document.createElement('script');
      descriptions.src = './tutorial-descriptions.js?reload=' + Date.now();
      descriptions.async = false;
      document.body.appendChild(descriptions);
    };
    document.body.appendChild(enhancements);
  };
  document.body.appendChild(base);
})();
