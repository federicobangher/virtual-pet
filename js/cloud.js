/* Virtual Pet — guardado en la nube para la versión publicada en claude.ai (sólo se usa ahí).
   Guarda la partida en el espacio privado de cada persona, así no se pierde si el navegador borra sus datos. */
(function () {
  'use strict';
  const N = window.N, C = N.core;
  if (!window.claude || typeof window.claude.use !== 'function') return;
  // copia de seguridad: en claude.ai el archivo se baja con la capacidad "downloads"
  window.claude.use('downloads').then((d) => { if (d) N.cloudDownloads = d; }).catch(() => {});
  (async () => {
    const db = await window.claude.use('db');
    const user = await window.claude.use('user');
    if (!db || !user) return;
    let id = null;
    try { id = await user.id(); } catch (e) { return; }
    if (!id) return;
    const ref = db.collection('data/users/' + id).doc('nido');
    let remote = null;
    try { const snap = await ref.get(); if (snap.exists) remote = snap.data(); } catch (e) { return; }

    const info = C.loadInfo;
    const remoteNewer = remote && typeof remote.json === 'string' && (!info.fromStorage || (remote.savedAt || 0) > (info.lastSeen || 0) + 5000);
    let guard = false;
    try { guard = sessionStorage.getItem('nido.cloud') === String(remote && remote.savedAt); } catch (e) {}
    if (remoteNewer && !guard) {
      try {
        JSON.parse(remote.json);
        localStorage.setItem(C.KEY, remote.json);
        if (localStorage.getItem(C.KEY) === remote.json) {
          try { sessionStorage.setItem('nido.cloud', String(remote.savedAt)); } catch (e) {}
          location.reload();
          return;
        }
      } catch (e) { /* sin almacenamiento local: seguimos con lo que hay */ }
    }

    let last = 0, timer = null, writing = false;
    const push = () => {
      const t = Date.now();
      if (writing) return;
      if (t - last < 20000) { clearTimeout(timer); timer = setTimeout(push, 20000 - (t - last)); return; }
      last = t; writing = true;
      ref.set({ json: JSON.stringify(C.state), savedAt: C.state.lastSeen || t }).catch(() => {}).finally(() => { writing = false; });
    };
    const orig = C.save;
    C.save = function () { orig.apply(this, arguments); push(); };
    push();
  })();
})();
