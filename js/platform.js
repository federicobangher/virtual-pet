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
  let guard = false, ignorePop = 0, layersOpen = () => false;
  plat.setLayersQuery = (fn) => { layersOpen = fn; };
  if (native && P.App && P.App.addListener) {
    P.App.addListener('backButton', () => {
      if (handleBack()) return;
      if (P.App.minimizeApp) P.App.minimizeApp(); else if (P.App.exitApp) P.App.exitApp();
    });
    plat.layerChanged = () => {};
  } else if (kind === 'web') {
    // En el navegador (y en la PWA instalada) se usa el historial: mientras haya algo abierto hay una
    // entrada de más, así "atrás" la consume en vez de salir de la página.
    window.addEventListener('popstate', () => {
      if (ignorePop) { ignorePop--; return; }
      guard = false; clearTimeout(closeT); closeT = 0;
      handleBack();
      if (layersOpen()) { history.pushState({ vpet: 1 }, ''); guard = true; }
    });
    // Abrir algo agrega la entrada enseguida. Cerrar espera un momento: si enseguida se abre otra cosa
    // (de "Más" a "Logros", o la ventana siguiente de la fila) la entrada se reutiliza en vez de sacarla y
    // volverla a poner, porque esos ida y vuelta del historial se pisan entre sí.
    let closeT = 0;
    const reconcile = () => {
      closeT = 0;
      if (!layersOpen() && guard) { guard = false; ignorePop++; try { history.back(); } catch (e) { ignorePop--; } }
    };
    plat.layerChanged = () => {
      if (layersOpen()) {
        clearTimeout(closeT); closeT = 0;
        if (!guard) { try { history.pushState({ vpet: 1 }, ''); guard = true; } catch (e) { /* sin historial */ } }
      } else if (guard && !closeT) closeT = setTimeout(reconcile, 200);
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

  N.platform = plat;
})();
