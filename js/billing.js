/* Virtual Pet — compras con dinero real (paquetes de monedas).
   Sólo existen en la app de Android publicada en Google Play: Google exige usar su sistema de cobro
   (Google Play Billing) para vender cosas digitales dentro de una app. En Windows y en la página web
   la tienda funciona igual, pero sin la sección de compras.

   Modos:
   - 'play': app de Android con el plugin cordova-plugin-purchase (expone window.CdvPurchase).
   - 'demo': para probar la tienda en el navegador sin cobrar nada. Se activa abriendo la página con
             ?tienda=demo (queda guardado; ?tienda=no lo apaga). Muestra "Compra de prueba".
   - 'none': no hay compras.

   Cada compra se acredita UNA sola vez aunque Google la avise dos veces (N.core.act.grantPurchase guarda
   su ID). Primero se acreditan las monedas y se guarda la partida; recién después se le avisa a Google
   que la compra se entregó ("consumir"). Si la app se cierra en el medio, Google la vuelve a avisar al
   abrir y no se cobra ni se acredita dos veces. */
(function () {
  'use strict';
  const N = window.N, C = N.core;
  const B = { mode: 'none', ready: false, available: false, pending: false, error: '' };
  const subs = [];
  B.onChange = (fn) => { subs.push(fn); };
  const changed = () => subs.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
  B.price = () => null;
  B.buy = () => Promise.resolve({ ok: false, msg: 'Las compras sólo están en la app de Android.' });

  function deliver(txId, sku, qty) {
    const r = C.act.grantPurchase(txId, sku, qty);
    if (r.ok && r.coins) N.emit('event', { type: 'purchase', coins: r.coins, sku });
    return r;
  }

  /* ---------- Google Play ---------- */
  function initPlay() {
    const CP = window.CdvPurchase;
    if (!CP || !CP.store) return false;
    const { store, ProductType, Platform } = CP;
    B.mode = 'play';
    store.verbosity = CP.LogLevel ? CP.LogLevel.WARNING : 2;
    store.register(C.PACKS.map((p) => ({ id: p.sku, type: ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY })));
    store.when()
      .productUpdated(() => { B.ready = true; changed(); })
      .pending(() => { B.pending = true; changed(); })
      .approved((tx) => {
        const id = tx.purchaseId || tx.transactionId;
        (tx.products || []).forEach((pr) => deliver(id + '|' + pr.id, pr.id, tx.quantity || 1));
        B.pending = false;
        tx.finish(); // para Google, la compra queda entregada (y el paquete se puede volver a comprar)
        changed();
      });
    if (store.error) store.error((e) => { B.error = (e && e.message) || 'Error de la tienda'; changed(); });
    store.initialize([Platform.GOOGLE_PLAY]).then(() => { B.available = true; changed(); }).catch((e) => { B.error = String(e && e.message || e); changed(); });
    B.price = (sku) => { const p = store.get(sku, Platform.GOOGLE_PLAY); return p && p.pricing ? p.pricing.price : null; };
    B.buy = (sku) => {
      const p = store.get(sku, Platform.GOOGLE_PLAY);
      const offer = p && p.getOffer && p.getOffer();
      if (!offer) return Promise.resolve({ ok: false, msg: 'La tienda de Google todavía no está lista. Probá en un ratito.' });
      return store.order(offer).then((err) => {
        if (!err) return { ok: true, started: true }; // el resultado llega por "approved"
        if (CP.ErrorCode && err.code === CP.ErrorCode.PAYMENT_CANCELLED) return { ok: false, cancelled: true };
        return { ok: false, msg: err.message || 'No se pudo hacer la compra.' };
      });
    };
    return true;
  }

  /* ---------- modo de prueba (navegador) ---------- */
  function initDemo() {
    B.mode = 'demo'; B.available = true; B.ready = true;
    const fake = { monedas_chico: '$ 999 (prueba)', monedas_mediano: '$ 1.999 (prueba)', monedas_grande: '$ 3.999 (prueba)' };
    B.price = (sku) => fake[sku] || '$ (prueba)';
    B.buy = (sku) => new Promise((res) => setTimeout(() => {
      const r = deliver('demo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), sku, 1);
      res({ ok: r.ok, msg: r.msg, coins: r.coins });
    }, 400));
  }

  function wantDemo() {
    let v = null;
    try {
      const q = new URLSearchParams(location.search).get('tienda');
      if (q === 'demo') localStorage.setItem('vpet.tienda', 'demo');
      if (q === 'no') localStorage.removeItem('vpet.tienda');
      v = localStorage.getItem('vpet.tienda');
    } catch (e) { /* sin almacenamiento */ }
    return v === 'demo';
  }

  B.init = function () {
    const kind = N.platform ? N.platform.kind : 'web';
    if (kind === 'android') {
      // los plugins de Cordova quedan listos con "deviceready"
      if (!initPlay()) document.addEventListener('deviceready', () => { if (!initPlay()) { B.error = 'Falta el plugin de compras'; changed(); } }, { once: true });
      return;
    }
    if (kind === 'web' && wantDemo()) initDemo();
  };
  Object.defineProperty(B, 'enabled', { get: () => B.mode !== 'none' });

  N.billing = B;
})();
