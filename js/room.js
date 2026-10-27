/* Virtual Pet — modo "casa" a pantalla completa (celular, tablet, navegador).
   La casa en sí (ambientes, botones, mascota) está en js/house.js; acá van las hojas (tienda, heladera…)
   y las ventanas, y el alto real de la pantalla. */
(function () {
  'use strict';
  const N = window.N;
  const UI = N.ui;

  const host = { kind: 'room' };
  let E = {}, house = null;

  /* Alto real de la pantalla. En algunos celulares Android (y con la app instalada desde la página) "100%"
     o "100dvh" incluyen la franja de los botones de Android: el juego quedaba más alto que la pantalla y
     los botones de abajo se cortaban. Se mide lo que de verdad se ve y se usa ese alto. */
  function fitHeight() {
    const vv = window.visualViewport;
    let hgt = window.innerHeight;
    if (vv && vv.height > 100 && vv.height < hgt && vv.scale <= 1.01) hgt = vv.height;
    const v = Math.round(hgt) + 'px';
    const root = document.documentElement;
    if (root.style.getPropertyValue('--app-h') !== v) root.style.setProperty('--app-h', v);
  }

  host.init = function () {
    fitHeight();
    window.addEventListener('resize', fitHeight);
    window.addEventListener('orientationchange', () => setTimeout(fitHeight, 250));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', fitHeight);
    document.body.classList.add('mode-room');
    document.documentElement.classList.add('is-room'); // (las tablets agrandan la letra con esto; antes era html:has(), que los navegadores viejos no entienden)
    const app = document.getElementById('app');
    app.innerHTML = `
      <main class="room-app"><div class="house-host"></div></main>
      <div class="sheet-wrap" hidden><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><header><h3 id="sheet-title"></h3><button type="button" class="x" aria-label="Cerrar">${UI.ic('close')}</button></header><div class="sheet-body"></div></div></div>
      <div class="modal-wrap" hidden><div class="modal-box" role="dialog" aria-modal="true"></div></div>`;
    E = {
      houseHost: app.querySelector('.house-host'), sheetWrap: app.querySelector('.sheet-wrap'), sheetBody: app.querySelector('.sheet-body'),
      sheetTitle: app.querySelector('#sheet-title'), modalWrap: app.querySelector('.modal-wrap'), modalBox: app.querySelector('.modal-box'),
    };
    house = N.House(E.houseHost, { covered: () => !E.sheetWrap.hidden || !E.modalWrap.hidden, hidden: () => !E.sheetWrap.hidden && E.sheetWrap.classList.contains('game') });
    // APK directo: la copia de seguridad se guarda donde elijas (Android pregunta)
    if (window.AndroidPet && window.AndroidPet.saveFile) host.saveFile = (name, text) => new Promise((res) => { window.__vpetSaved = (ok) => res(!!ok); window.AndroidPet.saveFile(name, text); });
    host.house = house;
    E.sheetWrap.addEventListener('click', (e) => { if (e.target === E.sheetWrap || e.target.closest('.sheet > header .x')) UI.closeSheet(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !E.sheetWrap.hidden) UI.closeSheet(); });
  };

  host.panelRoot = () => E.houseHost;
  host.petBox = () => house.petBox();
  host.view = () => house.view;
  host.bubble = (text, ms, warn, action) => house.bubble(text, ms, warn, action);

  let sheetOpts = null;
  host.sheet = function (title, node, opts) {
    if (sheetOpts && sheetOpts.onClose) { const f = sheetOpts.onClose; sheetOpts = null; f(); }
    sheetOpts = opts || {};
    E.sheetTitle.textContent = title;
    E.sheetBody.replaceChildren(node);
    E.sheetWrap.hidden = false;
    E.sheetWrap.classList.toggle('wide', !!sheetOpts.wide);
    E.sheetWrap.classList.toggle('game', !!sheetOpts.game);
    E.sheetBody.scrollTop = 0;
  };
  host.sheetClose = function () {
    const wasGame = E.sheetWrap.classList.contains('game');
    E.sheetWrap.hidden = true;
    E.sheetWrap.classList.remove('game');
    if (wasGame && house && house.kick) house.kick();
    E.sheetBody.replaceChildren();
    if (sheetOpts && sheetOpts.onClose) { const f = sheetOpts.onClose; sheetOpts = null; f(); }
  };
  host.modal = function (node) {
    host.sheetClose();
    E.modalBox.replaceChildren(node);
    E.modalWrap.hidden = false;
    const inp = node.querySelector('input');
    if (inp && window.matchMedia('(pointer:fine)').matches) setTimeout(() => inp.focus(), 60);
  };
  host.modalClose = function () { E.modalWrap.hidden = true; E.modalBox.replaceChildren(); };
  host.onClean = () => house.onClean();
  host.onAsk = (need) => house.onAsk(need);
  host.isIdle = () => house.isIdle();
  host.onReset = () => house.onReset();
  host.onSaver = () => {};
  host.onPetEvent = (e) => house.onPetEvent(e);
  host.update = () => {}; // (la casa se actualiza desde el panel)

  N.roomHost = host;
})();
