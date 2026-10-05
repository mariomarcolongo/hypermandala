(() => {
  'use strict';

  const sri = document.createElement('script');
  sri.src = './sri-yantra-traditional-v2.js?reload=' + Date.now();
  sri.async = false;
  document.body.appendChild(sri);

  const base = document.createElement('script');
  base.src = './tutorial-base.js?reload=' + Date.now();
  base.async = false;
  base.onload = () => {
    const enhancements = document.createElement('script');
    enhancements.src = './tutorial-enhancements.js?reload=' + Date.now();
    enhancements.async = false;
    enhancements.onload = () => {
      const elements = document.createElement('script');
      elements.src = './tutorial-elements-clean.js?reload=' + Date.now();
      elements.async = false;
      elements.onload = () => {
        const descriptions = document.createElement('script');
        descriptions.src = './tutorial-descriptions.js?reload=' + Date.now();
        descriptions.async = false;
        descriptions.onload = () => {
          const pacing = document.createElement('script');
          pacing.src = './tutorial-emergence-pacing.js?reload=' + Date.now();
          pacing.async = false;
          pacing.onload = () => {
            const linkExit = document.createElement('script');
            linkExit.src = './tutorial-link-exit.js?reload=' + Date.now();
            linkExit.async = false;
            linkExit.onload = () => {
              const cleanBackground = document.createElement('script');
              cleanBackground.src = './tutorial-clean-background.js?reload=' + Date.now();
              cleanBackground.async = false;
              cleanBackground.onload = () => {
                const buildRotation = document.createElement('script');
                buildRotation.src = './tutorial-build-rotation.js?reload=' + Date.now();
                buildRotation.async = false;
                document.body.appendChild(buildRotation);
              };
              document.body.appendChild(cleanBackground);
            };
            document.body.appendChild(linkExit);
          };
          document.body.appendChild(pacing);
        };
        document.body.appendChild(descriptions);
      };
      document.body.appendChild(elements);
    };
    document.body.appendChild(enhancements);
  };
  document.body.appendChild(base);
})();
