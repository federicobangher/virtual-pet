/* Virtual Pet — arranque: elige el modo según dónde corre. */
(function () {
  'use strict';
  const N = window.N;
  const desktop = !!window.petDesktop;
  if (desktop) document.documentElement.classList.add('desk');
  N.ui.start(desktop ? N.desktopHost : N.roomHost);
  if (!desktop && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').then((reg) => {
      // cada vez que se vuelve a la app, fijarse si hay una versión nueva
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => {}));
    // Versión nueva instalada: se recarga sola para usarla (guardando antes), sin esperar a que cierres la app.
    // Si estás en medio de algo (un juego, la tienda, una ventana), espera a que salgas de la app.
    let hadController = !!navigator.serviceWorker.controller, pending = false;
    const reloadNow = () => { try { N.core.save(); } catch (e) {} location.reload(); };
    const busy = () => !!(N.ui.modalOpen || N.ui.sheetOpen);
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) { hadController = true; return; } // primera instalación: no hace falta recargar
      if (busy()) pending = true; else reloadNow();
    });
    document.addEventListener('visibilitychange', () => { if (pending && document.hidden) reloadNow(); });
    setInterval(() => { if (pending && !busy()) reloadNow(); }, 5000);
  }
})();
