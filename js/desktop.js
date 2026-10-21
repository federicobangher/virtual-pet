/* Virtual Pet — modo escritorio (Windows): la mascota pasea sola por el escritorio, como Neko.
   Igual que Neko95, la ventana es chiquita (del tamaño de la mascota) y lo que se mueve es la ventana:
   así Windows sólo redibuja unos pocos píxeles y el programa casi no consume.
   Cuando se abre el panel de cuidados, la ventana se agranda lo justo para mostrarlo. */
(function () {
  'use strict';
  const N = window.N;
  const C = N.core, UI = N.ui, snd = N.sound;
  const D = window.petDesktop; // puente con Electron (preload.js)
  if (!D) { N.desktopHost = null; return; }

  const BUB = 70;   // espacio arriba de la mascota para el globito
  const TAG = 26;   // espacio abajo para el nombre
  const MINW = 290; // ancho mínimo de la ventana compacta (para que entre el globito)
  const CARD_W = 360;
  // Alto máximo del panel. Antes ocupaba casi toda la pantalla (alto del monitor − 16 px): en Windows, con
  // escalas distintas o la barra de tareas arriba, la parte de arriba (con la X y la flecha de volver)
  // podía quedar fuera de la pantalla y no había forma de cerrarlo.
  const CARD_MAXH = 600;
  const cardMaxH = () => Math.max(260, Math.min(CARD_MAXH, wa.height - 40));

  const host = { kind: 'desktop' };
  let E = {}, view;
  // Varios monitores: la mascota pasea por todos. "areas" son las áreas de trabajo de cada monitor (sin la barra
  // de tareas), "wa" es la del monitor donde está la mascota ahora y "primary" la del monitor principal.
  let areas = [{ x: 0, y: 0, width: 1280, height: 720 }];
  let primary = areas[0];
  let wa = primary;
  const pos = { x: 0, y: 0, vy: 0 };                 // esquina sup. izq. de la mascota, en coordenadas de pantalla
  let size = { w: 150, h: 125 };
  let mode = 'free';                                 // free | follow | fall | drag
  let walking = false, flying = false, target = null, idleUntil = 0, lastFrame = 0, walkingPrev = false;
  let cursor = { x: -1, y: -1 };
  let hiddenAll = false, cardOpen = false;
  let drag = null, cardDrag = null;
  let cardPos = null;                                // posición del panel en pantalla
  let cardMoved = false;                             // el usuario lo movió a mano
  let bounds = { x: 0, y: 0, width: 0, height: 0 };  // ventana actual

  const PREF_KEY = 'nido.desk.v2';
  let pref = { x: null, y: null };
  try { pref = Object.assign(pref, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch (e) {}
  const savePref = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify({ x: Math.round(pos.x), y: Math.round(pos.y) })); } catch (e) {} };

  const inside = (a, x, y) => x >= a.x && x < a.x + a.width && y >= a.y && y < a.y + a.height;
  // monitor que contiene el punto (o el más cercano, si cae en un hueco entre monitores)
  function areaAt(x, y) {
    let best = null, bd = Infinity;
    for (const a of areas) {
      if (inside(a, x, y)) return a;
      const dx = Math.max(a.x - x, 0, x - (a.x + a.width)), dy = Math.max(a.y - y, 0, y - (a.y + a.height));
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = a; }
    }
    return best || primary;
  }
  const areaOfPet = (x, y) => areaAt(x + size.w / 2, y + size.h / 2);
  const floorOf = (a) => a.y + a.height - size.h * 0.96;
  const floorY = () => floorOf(wa);
  // Acomoda un punto (esquina de la mascota) dentro del monitor que le corresponde
  function clampPt(x, y) {
    const a = areaOfPet(x, y);
    return { x: Math.max(a.x - size.w * 0.15, Math.min(a.x + a.width - size.w * 0.85, x)), y: Math.max(a.y, Math.min(floorOf(a), y)) };
  }
  const clampX = (x) => clampPt(x, pos.y).x;
  const clampY = (y) => clampPt(pos.x, y).y;
  // rectángulo que abarca todos los monitores (la ventana puede quedar entre dos mientras cruza)
  function unionArea() {
    const x1 = Math.min(...areas.map((a) => a.x)), y1 = Math.min(...areas.map((a) => a.y));
    const x2 = Math.max(...areas.map((a) => a.x + a.width)), y2 = Math.max(...areas.map((a) => a.y + a.height));
    return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
  }
  function setAreas(info) {
    if (!info) return;
    primary = info.workArea || primary;
    areas = Array.isArray(info.areas) && info.areas.length ? info.areas : [primary];
    wa = areaOfPet(pos.x, pos.y);
  }

  /* ---------- clics: qué partes de la ventana se pueden tocar ----------
     La ventana es transparente y deja pasar los clics al escritorio, salvo sobre la mascota, el globito con
     botón, el ícono de pedido y el panel. Antes Electron se enteraba de dónde estaba el mouse con un "gancho"
     global (forward): TODOS los movimientos del mouse de la compu pasaban por Virtual Pet, y cuando el
     programa estaba ocupado se trababa el mouse de todas las aplicaciones. Ahora la página le pasa al
     proceso principal los rectángulos tocables y él mira la posición del mouse unas pocas veces por segundo. */
  let hitsKey = '', hitsQueued = false;
  const rectOf = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left) - 2, y: Math.round(r.top) - 2, w: Math.round(r.width) + 4, h: Math.round(r.height) + 4 }; };
  function sendHits() {
    hitsQueued = false;
    const rects = [];
    if (!hiddenAll) {
      if (!E.pet.hidden) rects.push(rectOf(E.hit));
      if (!E.bubble.hidden && E.bubble.classList.contains('ask')) rects.push(rectOf(E.bubble));
      const ni = E.pet.querySelector('.needicon:not([hidden])'); if (ni) rects.push(rectOf(ni));
      if (cardOpen && !E.card.hidden) rects.push(rectOf(E.card));
    }
    const key = JSON.stringify(rects);
    if (key === hitsKey) return;
    hitsKey = key;
    if (D.hitRects) D.hitRects(rects);
  }
  function queueHits() { if (hitsQueued) return; hitsQueued = true; requestAnimationFrame(sendHits); }
  function setHold(v) { if (D.hold) D.hold(!!v); }

  /* ---------- ventana: tamaño y posición ---------- */
  function cardSize() {
    const r = E.card.getBoundingClientRect();
    return { w: CARD_W, h: Math.min(r.height || 460, cardMaxH()) };
  }
  function placeCardAuto() {
    const cs = cardSize();
    let x = pos.x + size.w / 2 - cs.w / 2;
    let y = pos.y - cs.h - 8;
    if (y < wa.y + 8) {
      y = pos.y + size.h * 0.2 - cs.h / 2;
      x = pos.x + size.w + 10;
      if (x + cs.w > wa.x + wa.width - 8) x = pos.x - cs.w - 10;
    }
    cardPos = clampCard(x, y);
  }
  function clampCard(x, y) {
    const cs = cardSize();
    return {
      x: Math.max(wa.x + 8, Math.min(wa.x + wa.width - cs.w - 8, x)),
      y: Math.max(wa.y + 12, Math.min(wa.y + wa.height - cs.h - 12, y)),
    };
  }
  // Calcula el rectángulo de la ventana y ubica la mascota y el panel adentro.
  function layout() {
    const cw = Math.max(size.w + 40, MINW), ch = size.h + BUB + TAG;
    let x = pos.x - (cw - size.w) / 2, y = pos.y - BUB;
    const U = unionArea();
    x = Math.max(U.x, Math.min(U.x + U.width - cw, x));
    y = Math.max(wa.y, Math.min(wa.y + wa.height - ch + TAG, y));
    let r = { x, y, w: cw, h: ch };
    if (cardOpen && cardPos) {
      const cs = cardSize();
      const x2 = Math.max(r.x + r.w, cardPos.x + cs.w), y2 = Math.max(r.y + r.h, cardPos.y + cs.h + 8);
      r.x = Math.min(r.x, cardPos.x); r.y = Math.min(r.y, cardPos.y);
      r.w = x2 - r.x; r.h = y2 - r.y;
    }
    const b = { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.w), height: Math.round(r.h) };
    if (b.x !== bounds.x || b.y !== bounds.y || b.width !== bounds.width || b.height !== bounds.height) {
      bounds = b;
      D.setBounds(b);
    }
    // (mientras camina se mueve la ventana, no el dibujo: sólo se toca el estilo si de verdad cambió)
    let moved = false;
    const sl = (el, k, v) => { v = Math.round(v) + 'px'; if (el.style[k] !== v) { el.style[k] = v; moved = true; } };
    sl(E.pet, 'left', pos.x - b.x); sl(E.pet, 'top', pos.y - b.y);
    if (cardOpen && cardPos) { sl(E.card, 'left', cardPos.x - b.x); sl(E.card, 'top', cardPos.y - b.y); }
    if (moved) queueHits(); // (caminando se mueve la ventana entera: las zonas tocables no cambian)
  }
  function applyCardMax() { const v = cardMaxH() + 'px'; if (E.card.style.maxHeight !== v) E.card.style.maxHeight = v; }
  // Windows a veces no deja la ventana exactamente donde se pidió (monitores con distinta escala, ventana más
  // alta que la pantalla). Electron avisa dónde quedó de verdad y acá se reacomoda todo adentro, y si el panel
  // igual quedara cortado, se lo trae a la parte visible del monitor.
  let fixTries = 0;
  function onRealBounds(rb) {
    if (!rb) return;
    bounds = { x: rb.x, y: rb.y, width: rb.width, height: rb.height };
    const sl = (el, k, v) => { v = Math.round(v) + 'px'; if (el.style[k] !== v) el.style[k] = v; };
    sl(E.pet, 'left', pos.x - rb.x); sl(E.pet, 'top', pos.y - rb.y);
    if (!cardOpen || !cardPos) return;
    sl(E.card, 'left', cardPos.x - rb.x); sl(E.card, 'top', cardPos.y - rb.y);
    const cs = cardSize();
    const off = cardPos.y < rb.y || cardPos.y + cs.h > rb.y + rb.height || cardPos.y < wa.y;
    if (off && fixTries++ < 3) { cardPos = clampCard(cardPos.x, Math.max(cardPos.y, rb.y)); layout(); }
  }

  host.init = function () {
    document.body.classList.add('mode-desktop');
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="dpet"><div class="dsvg"></div><div class="hit" title="Hacé clic para cuidarlo"></div><div class="bubble" hidden></div><div class="dtag"></div></div>
      <div class="dcard" hidden role="dialog" aria-label="Virtual Pet">
        <div class="dcard-head"><span class="brand">Virtual Pet</span><button type="button" class="dclose" aria-label="Cerrar panel">${UI.ic('close')}</button></div>
        <div class="dcard-body"><div class="dpanel"></div><div class="dsheet" hidden><div class="dsheet-head"><button type="button" class="dback" aria-label="Volver">${UI.ic('back')}</button><h3></h3></div><div class="dsheet-body"></div></div><div class="dmodal" hidden></div></div>
        <div class="dcard-foot"><button type="button" class="btn dclose2">${UI.ic('close')} Cerrar el panel</button></div>
      </div>`;
    E = {
      pet: app.querySelector('.dpet'), svg: app.querySelector('.dsvg'), hit: app.querySelector('.hit'), bubble: app.querySelector('.bubble'), tag: app.querySelector('.dtag'),
      card: app.querySelector('.dcard'), panel: app.querySelector('.dpanel'), sheet: app.querySelector('.dsheet'),
      sheetTitle: app.querySelector('.dsheet h3'), sheetBody: app.querySelector('.dsheet-body'), modal: app.querySelector('.dmodal'),
      head: app.querySelector('.dcard-head'), close: app.querySelector('.dclose'), foot: app.querySelector('.dcard-foot'),
    };
    view = new UI.PetView(E.svg);
    startAnim();

    // si el contenido del panel cambia de alto, acomodar la ventana
    if (window.ResizeObserver) new ResizeObserver(() => {
      if (!cardOpen || !cardPos) return;
      if (cardMoved) cardPos = clampCard(cardPos.x, cardPos.y); else placeCardAuto();
      layout();
    }).observe(E.card);

    setAreas(D.screenInfo());
    wa = primary;
    applyCardMax();
    measure();
    if (pref.x != null && pref.y != null) { const c = clampPt(pref.x, pref.y); pos.x = c.x; pos.y = c.y; } // (si ese monitor ya no está, va al más cercano)
    else { pos.x = primary.x + primary.width - size.w - 180; pos.y = floorOf(primary); }
    wa = areaOfPet(pos.x, pos.y);
    const p0 = C.state.pet;
    if (p0 && p0.stage === 'egg' && pos.y < floorY() - 2) mode = 'fall';
    layout();

    // arrastrar / clic sobre la mascota (en coordenadas de pantalla, porque la ventana se mueve)
    E.hit.addEventListener('pointerdown', (e) => {
      snd.unlock();
      drag = { sx: e.screenX, sy: e.screenY, ox: e.screenX - pos.x, oy: e.screenY - pos.y, moved: false };
      setHold(true); // mientras se arrastra, la ventana sigue tomando el mouse aunque se salga de la mascota
      try { E.hit.setPointerCapture(e.pointerId); } catch (_) {}
      wake();
    });
    E.hit.addEventListener('pointermove', (e) => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.screenX - drag.sx, e.screenY - drag.sy) > 6) { drag.moved = true; mode = 'drag'; E.pet.classList.add('dragging'); }
      if (drag.moved) { const c = clampPt(e.screenX - drag.ox, e.screenY - drag.oy); pos.x = c.x; pos.y = c.y; wa = areaOfPet(pos.x, pos.y); layout(); }
    });
    const endDrag = () => {
      if (!drag) return;
      const wasClick = !drag.moved;
      drag = null; setHold(false);
      E.pet.classList.remove('dragging');
      if (wasClick) { if (mode === 'drag') mode = 'free'; petClick(); return; }
      const p = C.state.pet;
      mode = p && p.stage === 'egg' ? 'fall' : 'free'; // el huevo cae; la mascota se queda donde la soltaste
      target = null; idleUntil = performance.now() + 2500; pos.vy = 0;
      savePref(); wake();
    };
    E.hit.addEventListener('pointerup', endDrag);
    E.hit.addEventListener('pointercancel', endDrag);

    E.close.addEventListener('click', () => closeCard());
    E.card.querySelector('.dclose2').addEventListener('click', () => closeCard());
    // Escape: vuelve de una hoja al panel, o cierra el panel
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !cardOpen) return;
      if (!E.sheet.hidden) UI.closeSheet(); else closeCard();
    });
    if (D.onBounds) D.onBounds(onRealBounds);
    E.sheet.querySelector('.dback').addEventListener('click', () => host.sheetClose());

    // mover el panel desde su encabezado
    E.head.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || !cardPos) return;
      cardDrag = { ox: e.screenX - cardPos.x, oy: e.screenY - cardPos.y }; setHold(true);
      try { E.head.setPointerCapture(e.pointerId); } catch (_) {}
    });
    E.head.addEventListener('pointermove', (e) => {
      if (!cardDrag) return;
      cardPos = clampCard(e.screenX - cardDrag.ox, e.screenY - cardDrag.oy);
      cardMoved = true;
      layout();
    });
    E.head.addEventListener('pointerup', () => { cardDrag = null; setHold(false); });
    E.head.addEventListener('pointercancel', () => { cardDrag = null; setHold(false); });

    // posición del mouse: sólo llega con "Que me siga el mouse" prendido
    D.onCursor((p) => {
      cursor.x = p.x; cursor.y = p.y;
      if (C.state.settings.follow) wake();
    });
    // cualquier cambio de tamaño adentro (globito, ícono, panel) actualiza las zonas tocables
    if (window.ResizeObserver) new ResizeObserver(queueHits).observe(document.getElementById('app'));
    new MutationObserver(queueHits).observe(document.getElementById('app'), { attributes: true, subtree: true, attributeFilter: ['hidden', 'class'] });
    queueHits();
    // se conectó o desconectó un monitor, o cambió la resolución
    D.onWorkArea((w) => {
      setAreas(w.areas ? w : { workArea: w, areas: [w] });
      const c = clampPt(pos.x, pos.y); pos.x = c.x; pos.y = c.y; wa = areaOfPet(pos.x, pos.y);
      target = null;
      applyCardMax();
      if (cardOpen && cardPos) cardPos = clampCard(cardPos.x, cardPos.y);
      layout();
    });
    D.onPoopClean((id) => { const r = C.act.clean(id); if (r.ok) snd.play('good'); syncPoops(true); });
    const onCmd = (cmd) => {
      if (cmd === 'panel') { show(); openCard(); }
      else if (cmd === 'closePanel') { if (!E.sheet.hidden) host.sheetClose(); closeCard(); }
      else if (cmd === 'toggle') { show(); if (cardOpen && E.modal.hidden) closeCard(); else openCard(); }
      else if (cmd === 'save') C.save();
      else if (cmd === 'hide') hideAll(true);
      else if (cmd === 'show') hideAll(false);
      else if (cmd === 'call') {
        show();
        // aparece en el centro del monitor donde está el mouse
        const go = (a) => {
          wa = a;
          pos.x = a.x + a.width / 2 - size.w / 2; pos.y = a.y + a.height / 2 - size.h / 2;
          mode = C.state.pet && C.state.pet.stage === 'egg' ? 'fall' : 'free';
          target = null; idleUntil = performance.now() + 3000; pos.vy = 0; layout(); wake();
        };
        if (D.getCursor) D.getCursor().then((c) => go(c ? areaAt(c.x, c.y) : primary)).catch(() => go(primary)); else go(primary);
      } else if (cmd === 'onTop') { C.act.setting('onTop', !C.state.settings.onTop); D.setOnTop(C.state.settings.onTop); syncTray(); }
      else if (cmd === 'follow' || cmd === 'sound' || cmd === 'wander' || cmd === 'notify') { C.act.setting(cmd, !C.state.settings[cmd]); syncTray(); wake(); }
    };
    D.onCommand(onCmd);
    host.debugCmd = onCmd; // (para las pruebas automáticas)
    D.getAutostart().then((v) => { C.state.settings.autostart = !!v; syncTray(); }).catch(() => {});
    D.setOnTop(C.state.settings.onTop !== false);
    setTimeout(syncTray, 300);
    wake();
  };

  function show() { if (hiddenAll) hideAll(false); }
  function hideAll(v) {
    hiddenAll = v;
    document.getElementById('app').style.visibility = v ? 'hidden' : '';
    queueHits();
    showPoops(v ? [] : currentPoops());
    syncTray();
  }
  function syncTray() {
    const S = C.state;
    D.trayState({ onTop: S.settings.onTop !== false, follow: !!S.settings.follow, sound: !!S.settings.sound, wander: !!S.settings.wander, notify: !!S.settings.notify, autostart: !!S.settings.autostart, hidden: hiddenAll, name: S.pet && !S.pet.dead ? S.pet.name : 'Virtual Pet' });
  }

  function petClick() {
    const p = C.state.pet;
    if (p && !p.dead && p.stage !== 'egg' && !p.sleeping) {
      const r = C.act.pet();
      if (r.ok) { UI.fx(E.pet, 'love'); if (Math.random() < 0.35) UI.doIdle('special'); else { view.setTemp('happy', 1500); snd.play('voice', p.species); } }
    }
    if (p && p.stage === 'egg' && cardOpen) { UI.warmEgg(); return; }
    if (cardOpen && E.modal.hidden) closeCard(); else openCard();
  }

  function measure() {
    const p = C.state && C.state.pet;
    const w = p && p.stage === 'egg' ? 110 : p && p.stage === 'adult' ? 170 : p && p.stage === 'young' ? 155 : 140;
    if (w === size.w) return;
    const oldH = size.h;
    size = { w, h: w * 200 / 240 };
    pos.y += oldH - size.h; // mantener los pies en el mismo lugar
    pos.y = clampY(pos.y);
    E.pet.style.width = w + 'px';
    E.pet.classList.toggle('egg', !!(p && p.stage === 'egg'));
  }

  /* ---------- panel ---------- */
  // (si lo moviste a mano, se respeta dónde lo dejaste)
  function relayoutCard() { requestAnimationFrame(() => { if (!cardOpen) return; if (cardMoved && cardPos) cardPos = clampCard(cardPos.x, cardPos.y); else placeCardAuto(); layout(); queueHits(); }); }
  function openCard() {
    if (cardOpen) { relayoutCard(); return; }
    cardOpen = true; fixTries = 0;
    E.card.hidden = false;
    applyCardMax();
    placeCardAuto(); layout(); relayoutCard();
    // (no se le roba el foco a lo que estés usando: antes, una ventana automática como el premio diario o
    //  "subió de nivel" te sacaba el teclado de la aplicación en la que estabas escribiendo)
  }
  function closeCard() {
    if (!E.modal.hidden) return; // las ventanas importantes no se cierran solas
    host.sheetClose();
    cardOpen = false;
    cardPos = null;
    cardMoved = false;
    E.card.hidden = true;
    layout();
    queueHits();
    wake();
  }

  host.panelRoot = () => E.panel;
  host.petBox = () => E.pet;
  host.view = () => view;

  let bubbleT = 0;
  host.bubble = function (text, ms, warn, action) {
    if (hiddenAll) return;
    E.bubble.textContent = '';
    E.bubble.append(Object.assign(document.createElement('span'), { textContent: text }));
    E.bubble.classList.toggle('ask', !!action);
    if (action) {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: 'bubble-act', textContent: action.label });
      b.addEventListener('click', (e) => { e.stopPropagation(); E.bubble.hidden = true; action.run(); });
      E.bubble.append(b);
    }
    E.bubble.classList.toggle('warn', !!warn);
    E.bubble.hidden = false;
    E.bubble.style.marginLeft = '0px';
    E.bubble.classList.remove('pop'); void E.bubble.offsetWidth; E.bubble.classList.add('pop');
    const r = E.bubble.getBoundingClientRect();
    if (r.left < 4) E.bubble.style.marginLeft = (4 - r.left) + 'px';
    else if (r.right > window.innerWidth - 4) E.bubble.style.marginLeft = (window.innerWidth - 4 - r.right) + 'px';
    clearTimeout(bubbleT);
    bubbleT = setTimeout(() => { E.bubble.hidden = true; queueHits(); }, ms || 2000);
    queueHits();
  };

  let sheetOpts = null;
  host.sheet = function (title, node, opts) {
    if (sheetOpts && sheetOpts.onClose) { const f = sheetOpts.onClose; sheetOpts = null; f(); }
    sheetOpts = opts || {};
    openCard();
    E.sheetTitle.textContent = title;
    E.sheetBody.replaceChildren(node);
    E.panel.hidden = true; E.sheet.hidden = false;
    relayoutCard();
  };
  host.sheetClose = function () {
    if (E.sheet.hidden && !sheetOpts) return;
    E.sheet.hidden = true; E.panel.hidden = false;
    E.sheetBody.replaceChildren();
    if (sheetOpts && sheetOpts.onClose) { const f = sheetOpts.onClose; sheetOpts = null; f(); }
    relayoutCard();
  };
  host.modal = function (node) {
    host.sheetClose();
    openCard();
    E.modal.replaceChildren(node);
    E.modal.hidden = false; E.panel.hidden = true;
    E.close.hidden = true; E.foot.hidden = true;
    relayoutCard();
    const inp = node.querySelector('input');
    if (inp) setTimeout(() => inp.focus(), 80);
  };
  host.modalClose = function () {
    E.modal.hidden = true; E.modal.replaceChildren(); E.panel.hidden = false; E.close.hidden = false; E.foot.hidden = false;
    measure();
    relayoutCard();
  };
  host.notify = (title, body) => D.notify(title, body);
  host.saveFile = (name, text) => D.saveFile(name, text);
  host.quit = () => { C.save(); D.quit(); };
  host.uninstall = () => { C.save(); D.uninstall && D.uninstall(); };
  host.onClean = () => syncPoops(true);
  host.onPetEvent = (e) => { if (e.type === 'poop') syncPoops(true); if (e.type === 'hatch' || e.type === 'grow') { measure(); layout(); } wake(); };
  // cuando pide algo, se queda quieta mirando hasta que la atiendan (o un ratito)
  let seek = null, lastSeek = -1e9;
  host.onAsk = (need, action) => {
    target = null; idleUntil = performance.now() + 7000;
    if (!need || need.level !== 2) return;
    // si no está siempre visible, en un pedido urgente se asoma por delante de las ventanas
    if (C.state.settings.onTop === false) D.bringToFront();
    // y te viene a buscar: camina hasta el puntero y te tironea (como mucho cada 3 minutos)
    const t = performance.now();
    if (cardOpen || C.state.settings.follow || t - lastSeek < 180000 || !D.getCursor) return;
    lastSeek = t;
    D.getCursor().then((c) => {
      if (!c || cardOpen) return;
      const side = pos.x + size.w / 2 < c.x ? -1 : 1;
      target = clampPt(c.x - size.w / 2 + side * size.w * 0.65, c.y - size.h * 0.6);
      seek = { need, action };
      idleUntil = 0;
      wake();
    }).catch(() => {});
  };
  host.isIdle = () => !walking && mode === 'free' && !drag && !cardOpen && !target;
  host.onReset = () => {
    try { localStorage.removeItem(PREF_KEY); } catch (e) {}
    E.bubble.hidden = true;
    measure();
    wa = primary; pos.x = primary.x + primary.width - size.w - 180; pos.y = floorOf(primary); mode = 'free'; target = null;
    syncPoops(true); syncTray(); layout();
  };
  host.onSetting = (k, v) => { if (k === 'autostart') D.setAutostart(v); if (k === 'onTop') D.setOnTop(v); syncTray(); wake(); };

  /* ---------- cacas: se muestran en una franja aparte, abajo de la pantalla ---------- */
  let poopKey = null;
  function currentPoops() {
    const p = C.state.pet;
    return p && !p.dead ? p.poops.map((q) => ({ id: q.id, x: q.x })) : [];
  }
  function syncPoops(force) {
    const list = currentPoops();
    const key = list.map((q) => q.id).join(',');
    if (!force && key === poopKey) return;
    poopKey = key;
    if (!hiddenAll) showPoops(list);
  }
  /* La franja de cacas es una ventanita aparte (abajo de la pantalla). Antes era otra ventana de Electron con
     su propio proceso (unos 60-100 MB más de memoria mientras hubiera cacas). Ahora la abre esta misma página
     con window.open: comparte el proceso y se dibuja desde acá, sin mensajes de ida y vuelta.
     Si por algún motivo no se puede abrir, se usa la forma vieja (D.poops). */
  let strip = null, useIpc = !D.poopsChild;
  const POOP_CSS = 'html,body{margin:0;height:100%;background:transparent;overflow:hidden;user-select:none}' +
    'button{position:absolute;bottom:4px;width:44px;height:38px;padding:0;border:0;background:none;cursor:pointer;transform:translateX(-50%)}' +
    'button svg{width:100%;height:100%;display:block}';
  function showPoops(list) {
    if (useIpc) { D.poops(list); return; }
    if (!list.length) { if (strip && !strip.closed) strip.close(); strip = null; if (D.stripHits) D.stripHits([]); return; }
    if (!strip || strip.closed) {
      try { strip = window.open('', 'vpet-poops', ''); } catch (e) { strip = null; }
      if (!strip || !strip.document) { useIpc = true; strip = null; D.poops(list); return; }
      const d = strip.document;
      d.title = 'Virtual Pet';
      const st = d.createElement('style'); st.textContent = POOP_CSS; d.head.appendChild(st);
      d.addEventListener('click', (e) => {
        const b = e.target.closest && e.target.closest('button'); if (!b) return;
        snd.unlock();
        const r = C.act.clean(b.dataset.id);
        if (r.ok) snd.play('good');
        b.remove(); syncPoops(true);
      });
    }
    const svg = N.art.poopSVG().replace(/ class="stink"/, ' class="stink" style="opacity:.8"');
    strip.document.body.innerHTML = list.map((q) => `<button type="button" data-id="${q.id}" title="Limpiar" style="left:${(4 + q.x * 92).toFixed(1)}%">${svg}</button>`).join('');
    // zonas tocables de la franja (el resto deja pasar los clics a la barra de tareas y al escritorio)
    if (D.stripHits) D.stripHits(list.map((q) => q.x));
  }

  host.update = function () {
    const p = C.state.pet;
    E.tag.textContent = p ? (p.stage === 'egg' || p.dead ? p.name : p.name + ' · Nv ' + p.level) : '';
    E.pet.hidden = !p;
    E.pet.dataset.stage = p ? p.stage : '';
    syncPoops();
    const before = size.w;
    measure();
    if (before !== size.w) layout();
    view.render();
    if (p && !p.sleeping && !p.dead && !running && (C.state.settings.wander || C.state.settings.follow || mode === 'fall' || target)) wake();
  };

  /* ---------- movimiento ---------- */
  // Pasea sola por todo el escritorio: elige un punto cualquiera, camina (o vuela) hasta ahí,
  // descansa un rato y vuelve a salir. Si duerme, se queda dormida donde esté.
  function canFly(p) { return (p.species === 'bird' || p.species === 'dragon') && p.stage !== 'baby'; }
  function baseSpeed(p) {
    let v = p.stage === 'baby' ? 60 : p.stage === 'young' ? 85 : 100;
    if (p.species === 'turtle') v *= 0.45;
    if (p.energy < 20) v *= 0.5;
    return v;
  }
  function pickTarget() {
    let x, y, a = wa;
    if (Math.random() < 0.35) { // a veces cruza la pantalla; casi siempre pasea cerca, como Neko
      // un lugar cualquiera de cualquier monitor (los más grandes, un poco más seguido)
      if (areas.length > 1) {
        const tot = areas.reduce((n, b) => n + b.width * b.height, 0);
        let r = Math.random() * tot;
        a = areas.find((b) => (r -= b.width * b.height) < 0) || wa;
      }
      x = a.x + Math.random() * (a.width - size.w); y = a.y + Math.random() * (floorOf(a) - a.y);
    } else { x = pos.x + (Math.random() - 0.5) * 520; y = pos.y + (Math.random() - 0.5) * 300; }
    const c = clampPt(x, y);
    if (Math.random() < 0.25) c.y = floorOf(areaOfPet(c.x, c.y)); // de vez en cuando vuelve a la barra de tareas
    return c;
  }
  let curSpeed = 100;
  function moveTowards(tx, ty, speed, dt) {
    curSpeed = speed;
    const dx = tx - pos.x, dy = ty - pos.y, dist = Math.hypot(dx, dy);
    if (dist < 1) return true;
    const st = Math.min(dist, speed * dt);
    pos.x += (dx / dist) * st; pos.y += (dy / dist) * st;
    if (Math.abs(dx) > 2) view.dir = dx > 0 ? 1 : -1;
    return st >= dist;
  }

  // Ciclo de movimiento: corre a ~30 cuadros por segundo sólo mientras algo se mueve.
  // Quieta, no revisa nada a cada rato: se despierta cuando le toca salir a pasear (o cuando algo cambia:
  // un clic, un ajuste, el reloj del juego, que la llama cada segundo).
  let timer = 0, running = false;
  function wake() { if (!running) { running = true; clearTimeout(timer); lastFrame = 0; timer = setTimeout(tick, 0); } }
  function tick() {
    const t = performance.now();
    const dt = lastFrame ? Math.min(100, t - lastFrame) / 1000 : 0;
    lastFrame = t;
    const active = step(dt, t);
    view.walking = walking && !flying;
    view.flying = flying;
    view.render();
    // paso de ~4 píxeles: a 15 cuadros por segundo si va despacio (tortuga, bebé), hasta 30 si vuela
    if (active) timer = setTimeout(tick, mode === 'drag' || mode === 'fall' ? 33 : Math.max(33, Math.min(66, 4000 / Math.max(1, curSpeed))));
    else {
      running = false; lastFrame = 0;
      // si no va a salir a pasear (paseo apagado, durmiendo, con el panel abierto) espera 2 s; si no, hasta el próximo paseo
      const p = C.state.pet, S = C.state.settings;
      const still = !p || p.dead || p.sleeping || p.stage === 'egg' || cardOpen || hiddenAll || (!S.wander && !S.follow && !seek);
      const wait = still ? 2000 : Math.max(250, Math.min(2000, idleUntil - t));
      timer = setTimeout(() => { if (!running) { running = true; tick(); } }, wait);
    }
  }

  function step(dt, now) {
    const p = C.state.pet;
    const S = C.state.settings;
    walking = false;
    if (!p || hiddenAll) { flying = false; return false; }
    if (mode === 'drag') return true;
    const fy = floorY();
    const busy = p.dead || p.sleeping || p.stage === 'egg' || view.busy || cardOpen;
    if (p.stage === 'egg') { if (pos.y < fy - 1) mode = 'fall'; }
    else if (!busy && S.follow && cursor.x >= 0) mode = 'follow';
    else if (mode === 'follow') { mode = 'free'; target = null; idleUntil = now + 1500; }

    let moved = false;
    if (mode === 'fall') {
      pos.vy += 2200 * dt; pos.y += pos.vy * dt; moved = true;
      if (pos.y >= fy) { pos.y = fy; pos.vy = 0; mode = 'free'; savePref(); }
    } else if (mode === 'follow') {
      const side = pos.x + size.w / 2 < cursor.x ? -1 : 1; // se queda al costado del puntero, no debajo
      const { x: tx, y: ty } = clampPt(cursor.x - size.w / 2 + side * size.w * 0.6, cursor.y - size.h * 0.7);
      const dist = Math.hypot(tx - pos.x, ty - pos.y);
      if (dist > 26 || (dist > 4 && walkingPrev)) { moveTowards(tx, ty, baseSpeed(p) * 2.2, dt); walking = true; moved = true; }
      flying = canFly(p) && pos.y < fy - 20;
    } else {
      flying = false;
      if (busy || (!S.wander && !seek)) { target = null; seek = null; }
      else {
        if (!target && now > idleUntil) target = pickTarget();
        if (target) {
          const fly = canFly(p) && (target.y < fy - 20 || pos.y < fy - 20);
          const arrived = moveTowards(target.x, target.y, baseSpeed(p) * (fly ? 1.5 : 1) * (seek ? 1.8 : 1), dt);
          walking = true; flying = fly; moved = true;
          if (arrived) {
            target = null;
            if (seek) { // llegó al puntero: saltito y vuelve a pedir
              const sk = seek; seek = null;
              view.setAct('hop', 1000);
              host.bubble('¡Ey! ' + sk.need.text, 7000, true, sk.action);
            }
            // descansa un rato antes de volver a salir (cuanto más quieta, menos consume)
            idleUntil = now + (p.species === 'turtle' ? 8000 : 4000) + Math.random() * 14000;
            savePref();
          }
        }
      }
      if (!walking) flying = canFly(p) && !p.sleeping && !p.dead && pos.y < fy - 20;
    }
    walkingPrev = walking;
    if (moved) { wa = areaOfPet(pos.x, pos.y); layout(); }
    return moved;
  }

  // para las pruebas automáticas: poner la mascota en un punto de la pantalla
  host.debugPlace = (x, y) => { const c = clampPt(x, y); pos.x = c.x; pos.y = c.y; wa = areaOfPet(pos.x, pos.y); mode = 'free'; target = null; layout(); };
  host.debug = () => ({ idleUntil: Math.round(idleUntil - performance.now()), pos: { x: Math.round(pos.x), y: Math.round(pos.y) }, target, mode, running, card: cardOpen, temp: view.temp, bounds, wa, fy: Math.round(floorY()), areas });
  /* ---------- animación "a cuadros" (js/anim.js) ----------
     En vez de dejar que Chromium anime a 60 cuadros por segundo, la mascota se anima con un reloj propio:
     10 cuadros por segundo caminando, 4 quieta y 2 dormida. Se ve igual de viva y la CPU casi ni se entera. */
  let petAnim = null;
  function startAnim() {
    // con el panel abierto la ventana es grande: cada cuadro cuesta más, así que la mascota se anima más despacio
    petAnim = N.petAnim({ svg: () => (hiddenAll ? null : E.svg && E.svg.firstElementChild), view: () => view, ms: { active: 100, idle: 250, sleep: 500, egg: 125 }, slow: () => cardOpen, saver: () => !!C.state.settings.saver });
    view.onSvg = () => petAnim.kick();
  }

  N.desktopHost = host;
})();
