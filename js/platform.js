/* Virtual Pet — capa de plataforma: lo que cambia según dónde corre el juego.
   - 'desktop': Windows (Electron). La mascota pasea por el escritorio (js/desktop.js).
   - 'android': app nativa de Android (Capacitor), la que va a Play Store. Tiene avisos programados,
                botón "atrás" nativo y compras con Google Play.
   - 'web':     navegador o app instalada desde la página (PWA).
   El resto del juego no pregunta "¿estoy en Android?": usa N.platform. */
(function () {
  'use strict';
  const N = (window.N = window.N || {});
  const cap = window.Capacitor;
  const native = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  const P = (native && cap.Plugins) || {};
  const kind = window.petDesktop ? 'desktop' : native ? cap.getPlatform() : 'web'; // 'android' | 'ios' | 'web' | 'desktop'

  const plat = { kind, native };

  /* ---------- botón "atrás" (Android) ----------
     Antes, en el celular, tocar "atrás" con la tienda abierta cerraba el juego entero.
     Ahora cierra lo que esté arriba (hoja, ventana) y recién con todo cerrado sale. */
  const backHandlers = [];
  plat.onBack = (fn) => { backHandlers.push(fn); };
  const handleBack = () => { for (let i = backHandlers.length - 1; i >= 0; i--) { try { if (backHandlers[i]()) return true; } catch (e) { /* seguir */ } } return false; };
  let guard = false, layersOpen = () => false;
  plat.setLayersQuery = (fn) => { layersOpen = fn; };
  plat.onBackExitHint = null; // (la interfaz pone acá un aviso "tocá atrás otra vez para salir")
  if (native && P.App && P.App.addListener) {
    P.App.addListener('backButton', () => {
      if (handleBack()) return;
      if (P.App.minimizeApp) P.App.minimizeApp(); else if (P.App.exitApp) P.App.exitApp();
    });
    plat.layerChanged = () => {};
  } else if (kind === 'web') {
    // En el navegador y en la app instalada desde la página (PWA) se usa el historial: cuando algo se abre se
    // agrega UNA entrada, así "atrás" la consume y cierra la hoja en vez de salir del juego.
    // El juego nunca llama a history.back(): en la 1.8 lo hacía al cerrar una hoja con la X y, si se
    // desincronizaba, el celular salía de la app o la recargaba (parecía que el juego se colgaba).
    // Si la entrada queda de más (cerraste la hoja con la X), el próximo "atrás" no hace nada y avisa.
    window.addEventListener('popstate', () => {
      guard = false;
      if (layersOpen()) {
        handleBack();
        if (layersOpen()) { try { history.pushState({ vpet: 1 }, ''); guard = true; } catch (e) { /* nada */ } } // ventana que no se cierra
      } else if (plat.onBackExitHint) plat.onBackExitHint();
    });
    plat.layerChanged = () => {
      if (layersOpen() && !guard) { try { history.pushState({ vpet: 1 }, ''); guard = true; } catch (e) { /* sin historial */ } }
    };
  } else plat.layerChanged = () => {};

  /* ---------- pausa / vuelta ---------- */
  const lifeHandlers = [];
  plat.onLifecycle = (fn) => { lifeHandlers.push(fn); };
  let active = !document.hidden;
  const setActive = (v) => { if (v === active) return; active = v; lifeHandlers.forEach((fn) => { try { fn(v); } catch (e) { console.error(e); } }); };
  document.addEventListener('visibilitychange', () => setActive(!document.hidden));
  if (native && P.App && P.App.addListener) P.App.addListener('appStateChange', (s) => setActive(!!s.isActive));
  window.addEventListener('pagehide', () => setActive(false));
  window.addEventListener('pageshow', () => setActive(!document.hidden)); // vuelve de la caché del navegador

  /* ---------- registro de errores ----------
     Si algo falla, queda anotado (los últimos 20) para poder verlo en Más → Informe de errores y mandarlo. */
  const ERR_KEY = 'vpet.errores';
  plat.errors = () => { try { return JSON.parse(localStorage.getItem(ERR_KEY) || '[]'); } catch (e) { return []; } };
  plat.clearErrors = () => { try { localStorage.removeItem(ERR_KEY); } catch (e) { /* nada */ } };
  plat.logError = (msg, where) => {
    try {
      const list = plat.errors();
      const v = (N.APP && N.APP.version) || '?';
      const item = { t: new Date().toISOString(), v, k: kind, m: String(msg || '').slice(0, 300), w: String(where || '').slice(0, 200) };
      const last = list[list.length - 1];
      if (last && last.m === item.m && last.w === item.w) { last.n = (last.n || 1) + 1; last.t = item.t; } else list.push(item);
      localStorage.setItem(ERR_KEY, JSON.stringify(list.slice(-20)));
    } catch (e) { /* sin almacenamiento */ }
  };
  window.addEventListener('error', (e) => plat.logError(e.message, (e.filename || '').split('/').pop() + ':' + e.lineno + ':' + e.colno));
  window.addEventListener('unhandledrejection', (e) => plat.logError(e.reason && (e.reason.message || e.reason), 'promesa'));
  Object.defineProperty(plat, 'active', { get: () => active });

  /* ---------- batería ----------
     Con poca batería (menos de 20 % y sin cargar) el juego se pone solo en modo ahorro. */
  plat.lowBattery = false;
  try {
    if (navigator.getBattery && kind !== 'desktop') {
      navigator.getBattery().then((b) => {
        const upd = () => { plat.lowBattery = !b.charging && b.level <= 0.2; };
        upd(); b.addEventListener('levelchange', upd); b.addEventListener('chargingchange', upd);
      }).catch(() => {});
    }
  } catch (e) { /* sin API de batería */ }

  /* ---------- avisos programados (sólo en la app nativa) ----------
     El celular congela las apps en segundo plano, así que un aviso "tengo hambre" no puede salir del
     juego mientras está cerrado. En la app de Android se dejan programados al salir (con la hora en que
     la mascota va a empezar a pedir cada cosa) y se borran al volver. */
  const LN = P.LocalNotifications;
  plat.canSchedule = !!(native && LN);
  let channelOk = false;
  async function ensureChannel() {
    if (channelOk || !LN.createChannel) return;
    try { await LN.createChannel({ id: 'pedidos', name: 'Pedidos de la mascota', description: 'Cuando tu mascota necesita algo', importance: 3, visibility: 1 }); } catch (e) { /* iOS o versión vieja */ }
    channelOk = true;
  }
  plat.askNotifyPermission = async () => {
    if (!plat.canSchedule) return false;
    try {
      let p = await LN.checkPermissions();
      if (p.display === 'prompt' || p.display === 'prompt-with-rationale') p = await LN.requestPermissions();
      return p.display === 'granted';
    } catch (e) { return false; }
  };
  plat.cancelScheduled = async () => {
    if (!plat.canSchedule) return;
    try { const p = await LN.getPending(); if (p && p.notifications && p.notifications.length) await LN.cancel({ notifications: p.notifications.map((n) => ({ id: n.id })) }); } catch (e) { /* nada */ }
  };
  // items: [{ at: ms, title, body }]
  plat.schedule = async (items) => {
    if (!plat.canSchedule) return false;
    await plat.cancelScheduled();
    if (!items.length) return true;
    try {
      const p = await LN.checkPermissions();
      if (p.display !== 'granted') return false;
      await ensureChannel();
      await LN.schedule({
        notifications: items.slice(0, 8).map((n, i) => ({
          id: 1000 + i, title: n.title, body: n.body, channelId: 'pedidos', smallIcon: 'ic_stat_pet', iconColor: '#5b3fa8',
          schedule: { at: new Date(n.at), allowWhileIdle: false },
        })),
      });
      return true;
    } catch (e) { console.warn('avisos', e); return false; }
  };
  // al tocar un aviso, la app se abre: no hace falta nada más
  plat.haptic = (kind2) => {
    if (!native || !P.Haptics) return;
    try { P.Haptics.impact({ style: kind2 === 'heavy' ? 'HEAVY' : 'LIGHT' }); } catch (e) { /* sin vibración */ }
  };

  /* ---------- instalar el juego (página web en el celular o la tablet) ----------
     Chrome sólo muestra solo su cartelito de "Instalar" de vez en cuando (si lo cerraste, tarda meses en volver),
     así que el juego ofrece su propio botón: guarda el aviso del navegador y lo muestra cuando tocás "Instalar".
     En iPhone/iPad no existe ese aviso: se explica cómo hacerlo desde Safari. */
  const inst = { ev: null, done: false, subs: [] };
  const standalone = () => { try { return matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true; } catch (e) { return false; } };
  const ua = navigator.userAgent || '';
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (kind === 'web') {
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); inst.ev = e; inst.subs.forEach((f) => { try { f(); } catch (x) { /* nada */ } }); });
    window.addEventListener('appinstalled', () => { inst.ev = null; inst.done = true; inst.subs.forEach((f) => { try { f(); } catch (x) { /* nada */ } }); });
  }
  plat.install = {
    // 'ready': se puede instalar con un toque · 'ios': hay que hacerlo desde Safari · 'manual': desde el menú del navegador
    // 'installed': ya está abierta como app · null: no corresponde (Windows o la app de Android)
    state() {
      if (kind !== 'web') return null;
      if (standalone() || inst.done) return 'installed';
      if (inst.ev) return 'ready';
      return ios ? 'ios' : 'manual';
    },
    async prompt() {
      if (!inst.ev) return false;
      const e = inst.ev; inst.ev = null;
      try { await e.prompt(); const c = await e.userChoice; const ok = !!(c && c.outcome === 'accepted'); if (ok) inst.done = true; return ok; } catch (x) { return false; }
    },
    onChange(fn) { inst.subs.push(fn); },
  };

  N.platform = plat;
})();
