/* Virtual Pet — arranque: elige el modo según dónde corre. */
(function () {
  'use strict';
  const N = window.N;
  const desktop = !!window.petDesktop;
  if (desktop) document.documentElement.classList.add('desk');
  N.ui.start(desktop ? N.desktopHost : N.roomHost);
  if (!desktop && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
