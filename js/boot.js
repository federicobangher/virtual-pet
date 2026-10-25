/* Virtual Pet — arranque: elige el modo según dónde corre. */
(function () {
  'use strict';
  const N = window.N;
  const desktop = !!window.petDesktop;
  if (desktop) document.documentElement.classList.add('desk');
  N.ui.start(desktop ? N.desktopHost : N.roomHost);
  // (en la app nativa de Android no hace falta: los archivos ya vienen adentro de la app)
  if (!desktop && !(N.platform && N.platform.native) && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
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

  /* 2.0.1: Windows y el APK se actualizan solos desde GitHub (docs/ACTUALIZACIONES.md).
     El programa baja la versión nueva por su cuenta y avisa acá; el juego ofrece ponerla con un globito
     (si no, se pone sola la próxima vez que abrís el juego). Además el juego le avisa al programa que
     arrancó bien: si una versión bajada no llega a avisar, el programa vuelve a la anterior. */
  const D = window.petDesktop && window.petDesktop.applyUpdate ? window.petDesktop : null;
  const A = window.AndroidPet && window.AndroidPet.applyUpdate ? window.AndroidPet : null;
  const sh = D || A;
  if (sh) {
    try { sh.booted(N.APP.version); } catch (e) { /* nada */ }
    const busy = () => !!(N.ui.modalOpen || N.ui.sheetOpen);
    const later = (fn) => { const go = () => { if (busy()) setTimeout(go, 15000); else fn(); }; setTimeout(go, 2500); };
    window.__vpetUpdate = (v) => later(() => N.ui.say(`¡Hay una versión nueva del juego (${v})!`, false, 15000, {
      label: 'Actualizar', run: () => { try { N.core.save(); } catch (e) { /* nada */ } sh.applyUpdate(); },
    }));
    window.__vpetProgram = (v, url) => {
      let last = 0; try { last = +localStorage.getItem('vpet.avisoPrograma') || 0; } catch (e) { /* nada */ }
      if (Date.now() - last < 86400e3) return; // una vez por día
      later(() => {
        try { localStorage.setItem('vpet.avisoPrograma', String(Date.now())); } catch (e) { /* nada */ }
        N.ui.say(`Hay un programa nuevo de Virtual Pet (${v}). Instalalo para seguir recibiendo novedades`, false, 15000, {
          label: 'Bajar', run: () => { if (A && A.openUrl) A.openUrl(url); else window.open(url, '_blank'); },
        });
      });
    };
  }
})();
