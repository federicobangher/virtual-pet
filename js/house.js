/* Virtual Pet — la casa: arriba las monedas, las 5 necesidades y el nivel; abajo del título los ambientes
   (se pasan con las flechas, deslizando el dedo o tocando el nombre) y abajo de todo tres botones grandes que
   cambian según el ambiente. La usan el celular (pantalla completa) y Windows (adentro del panel).

   N.House(root, { compact }) → objeto con la vista de la mascota, el globito y todo lo que el resto del juego
   necesita (petBox, view, bubble, update, onClean, onPetEvent, onAsk, isIdle, onReset…). */
(function () {
  'use strict';
  const N = window.N;
  const C = N.core, art = N.art, HA = N.houseArt, snd = N.sound;
  const UI = () => N.ui;
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const setText = (el, v) => { v = String(v); if (el.textContent !== v) el.textContent = v; };
  const setHTML = (el, v) => { if (el._html !== v) { el._html = v; el.innerHTML = v; } };
  const setCls = (el, c, on) => { on = !!on; if (el.classList.contains(c) !== on) el.classList.toggle(c, on); };
  const setHidden = (el, v) => { v = !!v; if (el.hidden !== v) el.hidden = v; };
  const STATS = [
    { k: 'food', icon: 'food', label: 'Comida' },
    { k: 'health', icon: 'heart', label: 'Salud' },
    { k: 'hygiene', icon: 'bath', label: 'Higiene' },
    { k: 'energy', icon: 'bolt', label: 'Energía' },
    { k: 'fun', icon: 'play', label: 'Diversión' },
  ];
  // Dónde se para la mascota en cada ambiente (x en %, tamaño relativo, cuánto más arriba del piso)
  const SPOT = { jardin: { x: 80, k: 0.6 }, patio: { x: 50, k: 0.68, up: 0.8 }, garaje: { x: 46, k: 0.62, up: 3.2 }, cocina: { x: 56, k: 0.9 }, paseo: { x: 50, k: 0.92 }, bano: { x: 52, k: 0.9 }, laboratorio: { x: 54, k: 0.9 } };
  const spot = (room) => Object.assign({ x: 50, k: 1, up: 0 }, SPOT[room] || {});
  const NEST = `<svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="100" cy="34" rx="86" ry="20" fill="#b9874f"/><ellipse cx="100" cy="28" rx="70" ry="13" fill="#7a5530"/><g stroke="#e0b47a" stroke-width="3" stroke-linecap="round" fill="none"><path d="M20 34 q30 -10 60 2"/><path d="M60 46 q40 -14 84 -2"/><path d="M120 30 q30 -6 62 6"/><path d="M30 42 q24 6 48 0"/><path d="M128 46 q20 4 40 -6"/></g></svg>`;

  N.House = function (root, opts) {
    opts = opts || {};
    const H = { compact: !!opts.compact };
    const ic = (n) => HA.icon(n);
    root.innerHTML = '';
    const el = h(`<div class="house${H.compact ? ' compact' : ''}">
      <header class="h-top">
        <button type="button" class="h-coins" title="Tus monedas — abrir la tienda"><span class="h-coin">${art.itemSVG('coin')}</span><b class="h-ncoins">0</b><span class="h-plus">+</span></button>
        <div class="h-stats">${STATS.map((s) => `<button type="button" class="h-stat st-${s.k}" data-k="${s.k}" title="${s.label}"><span class="h-fill"></span><span class="h-sic">${art.icon(s.icon)}</span></button>`).join('')}</div>
        <button type="button" class="h-level" title="Nivel — cómo subir"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3l6 13 14 2-10 10 3 14-13-7-13 7 3-14L4 18l14-2z" fill="#fff" stroke="#2a1f3d" stroke-width="3" stroke-linejoin="round"/></svg><b class="h-lv">0</b><i class="h-xp"><i></i></i></button>
      </header>
      <nav class="h-nav">
        <button type="button" class="h-nbtn h-cam" title="Sacar una foto">${ic('camera')}</button>
        <button type="button" class="h-nbtn h-prev" title="Ambiente anterior">${ic('left')}</button>
        <button type="button" class="h-title" title="Elegir ambiente"><span class="h-tname">Living</span></button>
        <button type="button" class="h-nbtn h-next" title="Ambiente siguiente">${ic('right')}</button>
        <button type="button" class="h-nbtn h-menu" title="Más opciones">${ic('menu')}</button>
      </nav>
      <section class="h-scene" aria-label="La casa de tu mascota">
        <div class="h-wall"></div><div class="h-place"><div class="bgsky"></div><div class="bgground"></div></div><div class="h-floor"></div>
        <div class="h-props"></div>
        <div class="h-special"></div>
        <div class="h-nest" hidden>${NEST}</div>
        <div class="poops"></div>
        <div class="h-petbox"><button type="button" class="h-pet petsvg" aria-label="Acariciar a tu mascota"></button><div class="bubble" hidden></div></div>
        <div class="h-front"></div>
        <div class="h-fx"></div>
        <div class="h-dark" aria-hidden="true"></div>
        <button type="button" class="h-sarrow l" hidden aria-label="Lugar anterior">${ic('left')}</button><button type="button" class="h-sarrow r" hidden aria-label="Lugar siguiente">${ic('right')}</button>
        <div class="h-toast" hidden></div>
        <div class="h-eggbar" hidden><div class="eggrow"><span>Calor</span><span class="bar warmth"><i></i></span></div><div class="eggrow"><span>Nacimiento</span><span class="bar hatch"><i></i></span></div></div>
        <div class="fastbadge" aria-hidden="true">x120</div>
      </section>
      <footer class="h-bar">
        <button type="button" class="h-btn b-left"><span class="hb-ic"></span><span class="hb-lb"></span><span class="hb-badge" hidden></span></button>
        <div class="h-center"><button type="button" class="h-cnav h-cprev" aria-label="Anterior">${ic('left')}</button><button type="button" class="h-btn b-center"><span class="hb-ic"></span><span class="hb-lb"></span></button><button type="button" class="h-cnav h-cnext" aria-label="Siguiente">${ic('right')}</button></div>
        <button type="button" class="h-btn b-right"><span class="hb-ic"></span><span class="hb-lb"></span></button>
      </footer>
    </div>`);
    root.appendChild(el);
    const $ = (s) => el.querySelector(s);
    const E = {
      scene: $('.h-scene'), wall: $('.h-wall'), floor: $('.h-floor'), place: $('.h-place'), props: $('.h-props'), special: $('.h-special'), front: $('.h-front'),
      fx: $('.h-fx'), poops: $('.poops'), petbox: $('.h-petbox'), pet: $('.h-pet'), bubble: $('.bubble'), dark: $('.h-dark'), toast: $('.h-toast'), nest: $('.h-nest'),
      coins: $('.h-ncoins'), lv: $('.h-lv'), xp: $('.h-xp i'), tname: $('.h-tname'), prev: $('.h-prev'), next: $('.h-next'), title: $('.h-title'),
      bl: $('.b-left'), bc: $('.b-center'), br: $('.b-right'), cprev: $('.h-cprev'), cnext: $('.h-cnext'), center: $('.h-center'), sl: $('.h-sarrow.l'), sr: $('.h-sarrow.r'),
      bgsky: $('.h-place .bgsky'), bgground: $('.h-place .bgground'), eggbar: $('.h-eggbar'), top: $('.h-top'),
    };
    H.el = el;
    const view = new (UI().PetView)(E.pet);
    H.view = view;
    H.petBox = () => E.petbox;
    H.root = el;

    /* ---------- tamaño: todo se mide en "em" y la casa calcula el em según la pantalla ---------- */
    let W = 0, Hh = 0, sceneW = 0, sceneH = 0;
    function fit() {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      W = r.width; Hh = r.height;
      const fs = Math.max(11, Math.min(H.compact ? 17 : 26, W / 22.5, Hh / 37));
      const v = fs.toFixed(2) + 'px';
      if (el.style.fontSize !== v) el.style.fontSize = v;
      sceneW = E.scene.clientWidth; sceneH = E.scene.clientHeight;
      const th = E.top.offsetHeight + 'px';
      if (el.style.getPropertyValue('--toph') !== th) el.style.setProperty('--toph', th);
      sizePet();
      placePet(curX(), 0, true);
    }
    function sizePet() {
      const sp = spot(room());
      const p = C.state.pet;
      const egg = p && p.stage === 'egg';
      // el ancho del dibujo (240 de ancho por 200 de alto) sale del lugar que hay
      let w = Math.min(sceneW * 0.98, sceneH * 0.62 * 1.2, 34 * parseFloat(el.style.fontSize || 16)) * sp.k * (egg ? 0.55 : 1);
      if (p && !egg) w *= p.stage === 'baby' ? 1.15 : p.stage === 'young' ? 1.05 : 1;
      w = Math.max(90, Math.round(w));
      const v = w + 'px';
      if (E.petbox.style.width !== v) E.petbox.style.width = v;
      el.style.setProperty('--petw', v);
    }
    if (window.ResizeObserver) new ResizeObserver(fit).observe(el);
    window.addEventListener('resize', fit);
    requestAnimationFrame(fit);

    /* ---------- ambientes ---------- */
    const room = () => {
      const p = C.state.pet;
      if (p && p.stage === 'egg') return 'dormitorio';
      return C.ROOMS.includes(C.state.room) ? C.state.room : 'living';
    };
    let shownRoom = null, shownPlace = null;
    function drawRoom(force) {
      const id = room();
      const p = C.state.pet, egg = !!(p && p.stage === 'egg');
      const key = id + '|' + egg + '|' + (id === 'dormitorio' || id === 'cocina' ? HA.isNight() : '');
      if (!force && key === shownRoom) return;
      shownRoom = key;
      const R = HA.ROOMS[id];
      el.dataset.room = id;
      el.style.setProperty('--wall', R.wall || 'transparent');
      el.style.setProperty('--floorc', R.floor);
      el.style.setProperty('--bar', R.bar);
      el.style.setProperty('--top', R.top);
      el.style.setProperty('--titlec', R.title);
      E.wall.className = 'h-wall' + (R.wallPat ? ' wp-' + R.wallPat : '');
      E.wall.style.background = R.sky || '';
      E.floor.className = 'h-floor' + (R.floorPat ? ' fp-' + R.floorPat : '');
      setText(E.tname, egg ? 'Nido' : R.name);
      E.props.innerHTML = HA.props(id).map(([svg, left, bottom, hgt, cls]) =>
        `<div class="h-prop ${cls || ''}" style="left:${left}%;--pl:${left};bottom:calc(var(--floor-y) + ${bottom}em);height:${hgt}em">${svg}</div>`).join('');
      E.special.innerHTML = ''; E.front.innerHTML = '';
      if (id === 'patio') E.special.innerHTML = `<div class="h-goal">${HA.goalSVG()}</div>`;
      if (id === 'garaje') { E.special.innerHTML = `<div class="h-car back">${HA.carSVG(false)}</div>`; E.front.innerHTML = `<div class="h-car front">${HA.carSVG(true)}</div>`; }
      if (id === 'jardin') { E.special.innerHTML = '<div class="h-plots"></div>'; plotsKey = ''; }
      if (id === 'juegos' && ballOut) E.special.appendChild(ballEl());
      shownPlace = null;
      drawPlace();
      E.nest.hidden = !egg;
      setHidden(E.prev, egg); setHidden(E.next, egg);
      x = spot(id).x; placePet(x, 0, true);
      if (x > 62 && view.dir !== -1) { view.dir = -1; view.render(); } // del lado derecho, mira hacia el centro
      sizePet();
      buttons(true);
      renderPoops(true);
      if (id === 'jardin') renderPlots();
    }
    function drawPlace() {
      const isP = room() === 'paseo';
      setCls(E.scene, 'is-place', isP);
      const owned = places();
      setHidden(E.sl, !isP || owned.length < 2); setHidden(E.sr, !isP || owned.length < 2);
      if (!isP) return;
      const id = C.state.bg;
      if (id === shownPlace) return;
      shownPlace = id;
      E.scene.dataset.bg = id;
      E.bgsky.innerHTML = N.themes.sky(id);
      E.bgground.innerHTML = N.themes.ground(id);
    }
    const places = () => Object.keys(C.BACKGROUNDS).filter((k) => !C.BACKGROUNDS[k].hidden && C.state.bgOwned[k]);
    function go(id, dir) {
      if (!C.state.pet || C.state.pet.stage === 'egg') return;
      if (id === room()) return;
      C.act.setRoom(id);
      stopWalk(); clearTimeout(walkTimer);
      E.scene.classList.remove('slide-l', 'slide-r'); void E.scene.offsetWidth;
      E.scene.classList.add(dir < 0 ? 'slide-r' : 'slide-l');
      drawRoom(true);
      snd.play('tap');
      if (view.walking) { view.walking = false; view.render(); }
      schedule(3000);
      if (opts.onRoom) opts.onRoom(id);
    }
    const step = (d) => { const L = C.ROOMS, i = L.indexOf(room()); go(L[(i + d + L.length) % L.length], d); };
    H.go = go; H.room = room;
    E.prev.addEventListener('click', () => step(-1));
    E.next.addEventListener('click', () => step(1));
    E.title.addEventListener('click', () => { if (C.state.pet && C.state.pet.stage !== 'egg') { snd.play('tap'); UI().openSheet('rooms'); } });
    $('.h-cam').addEventListener('click', () => { snd.unlock(); takePhoto(); });
    $('.h-menu').addEventListener('click', () => { snd.unlock(); snd.play('tap'); UI().openSheet('more'); });
    $('.h-coins').addEventListener('click', () => { snd.unlock(); snd.play('tap'); UI().openSheet('shop'); });
    $('.h-level').addEventListener('click', () => { snd.unlock(); snd.play('tap'); if (C.state.pet && C.state.pet.stage !== 'egg' && !C.state.pet.dead) UI().openSheet('status', 'level'); });
    $('.h-stats').addEventListener('click', (e) => { const b = e.target.closest('.h-stat'); if (!b) return; snd.unlock(); snd.play('tap'); if (C.state.pet && C.state.pet.stage !== 'egg' && !C.state.pet.dead) UI().openSheet('status', b.dataset.k); });
    E.sl.addEventListener('click', () => switchPlace(-1));
    E.sr.addEventListener('click', () => switchPlace(1));
    function switchPlace(d) {
      const L = places(), i = Math.max(0, L.indexOf(C.state.bg));
      C.act.setBg(L[(i + d + L.length) % L.length]);
      snd.play('tap'); drawPlace();
      toast(C.BACKGROUNDS[C.state.bg].name);
    }
    // deslizar el dedo sobre el ambiente cambia de ambiente (como pasar de página)
    let swipe = null;
    E.scene.addEventListener('pointerdown', (e) => { if (e.target.closest('button,.h-prop.tap,.h-plot,.h-ball,.h-car')) return; swipe = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    E.scene.addEventListener('pointerup', (e) => {
      if (!swipe) return;
      const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y, dt = performance.now() - swipe.t; swipe = null;
      if (Math.abs(dx) > Math.max(60, sceneW * 0.18) && Math.abs(dy) < Math.abs(dx) * 0.6 && dt < 700) step(dx < 0 ? 1 : -1);
    });
    E.scene.addEventListener('pointercancel', () => { swipe = null; });

    /* ---------- a dónde mira: el dedo o el mouse ---------- */
    const look = { x: 0, y: 0, t: -1e9, cx: 0, cy: 0 };
    let lookOverride = null; // (por ejemplo: la tele, o la comida que estás arrastrando)
    function lookPoint(cx, cy) {
      const svg = E.pet.firstElementChild;
      if (!svg || !svg.getScreenCTM) return null;
      const m = svg.getScreenCTM(); if (!m) return null;
      const p = svg.createSVGPoint(); p.x = cx; p.y = cy;
      const q = p.matrixTransform(m.inverse());
      return q;
    }
    const onPointer = (e) => { look.cx = e.clientX; look.cy = e.clientY; look.t = performance.now(); if (anim) anim.kick(); };
    el.addEventListener('pointermove', onPointer, { passive: true });
    el.addEventListener('pointerdown', onPointer, { passive: true });
    H.lookAt = (cx, cy, ms) => { lookOverride = { cx, cy, until: performance.now() + (ms || 2000) }; };
    function lookTarget() {
      const t = performance.now();
      let cx, cy, tt;
      if (lookOverride && lookOverride.until > t) { cx = lookOverride.cx; cy = lookOverride.cy; tt = t; }
      else if (drag) { cx = drag.cx; cy = drag.cy; tt = t; }
      else { cx = look.cx; cy = look.cy; tt = look.t; }
      if (t - tt > 2600) return null;
      const q = lookPoint(cx, cy); if (!q) return null;
      // si lo que mira queda del otro lado, se da vuelta (si no está caminando ni haciendo algo)
      const svg = E.pet.firstElementChild, hx = +svg.dataset.hx;
      const side = q.x < hx - 40 ? -1 : q.x > hx + 40 ? 1 : 0;
      if (side && side !== view.dir && !walk && !view.busy) { if (!look.flipAt) look.flipAt = t + 450; else if (t > look.flipAt) { look.flipAt = 0; view.dir = side; view.render(); } }
      else look.flipAt = 0;
      return { x: q.x, y: q.y, t: tt };
    }

    /* ---------- animación ---------- */
    const anim = N.petAnim({
      svg: () => (el.isConnected && E.pet.firstElementChild && !H.paused ? E.pet.firstElementChild : null),
      view: () => view, look: lookTarget, ms: { active: 66, idle: 110, sleep: 400, egg: 80 },
      slow: () => !!(opts.covered && opts.covered()),
      saver: UI().saverOn,
      extra: (t) => { // el olorcito de las cacas
        const st = E.poops.querySelectorAll('.stink');
        if (!st.length) return;
        const k = 0.5 - 0.5 * Math.cos(Math.PI * 2 * t / 1.6);
        const tf = `translateY(${(-3 * k).toFixed(1)}px)`, op = (1 - 0.5 * k).toFixed(2);
        st.forEach((e) => { if (e.style.transform !== tf) { e.style.transform = tf; e.style.opacity = op; } });
      },
    });
    view.onSvg = () => anim.kick();
    H.kick = () => anim.kick();

    /* ---------- tocar a la mascota ---------- */
    let rub = null;
    E.pet.addEventListener('click', () => {
      snd.unlock();
      const p = C.state.pet;
      if (!p || p.dead) return;
      if (p.stage === 'egg') return UI().warmEgg();
      if (p.sleeping) return H.bubble('Shh… está durmiendo', 1600);
      view.setAct('jiggle', 900);
      const r = C.act.pet();
      if (r.ok) { UI().fx(E.petbox, 'love'); if (Math.random() < 0.3) UI().doIdle('special'); else { view.setTemp(Math.random() < 0.4 ? 'love' : 'happy', 1500); snd.play('voice', p.species); } }
    });
    // acariciar: pasar el dedo por encima (con el botón apretado)
    E.pet.addEventListener('pointerdown', (e) => { rub = { x: e.clientX, y: e.clientY, d: 0 }; });
    E.pet.addEventListener('pointermove', (e) => {
      if (!rub || drag) return;
      rub.d += Math.hypot(e.clientX - rub.x, e.clientY - rub.y); rub.x = e.clientX; rub.y = e.clientY;
      const p = C.state.pet;
      if (rub.d > 120 && p && !p.dead && p.stage !== 'egg' && !p.sleeping) {
        rub.d = 0;
        if (!soapMode() && C.act.pet().ok) { UI().fx(E.petbox, 'love'); view.setTemp('love', 1400); snd.play('voice', p.species); }
      }
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => E.pet.addEventListener(ev, () => { rub = null; }));

    /* ---------- botones de abajo según el ambiente ---------- */
    const open = (name, arg) => () => { snd.play('tap'); UI().openSheet(name, arg); };
    const SHOP = (tab) => ({ ic: 'shop', lb: 'Tienda', run: open('shop', tab) });
    const ROOM_BTNS = {
      cocina: { left: { ic: 'fridge', lb: 'Heladera', run: open('fridge') }, center: 'food', right: SHOP('comida') },
      bano: { left: { ic: 'shower', lb: 'Ducha', run: () => shower() }, center: { ic: 'soap', lb: 'Jabón', run: () => soapAuto(), drag: 'soap' }, right: SHOP('salud') },
      dormitorio: { left: { ic: 'wardrobe', lb: 'Armario', run: open('wardrobe') }, center: 'lamp', right: SHOP('ropa') },
      living: { left: { ic: 'album', lb: 'Álbum', run: open('album') }, center: { ic: 'music', lb: 'Música', run: () => music() }, right: SHOP() },
      juegos: { left: { ic: 'games', lb: 'Juegos', run: () => games() }, center: { ic: 'ball', lb: 'Pelota', run: () => toggleBall() }, right: SHOP('juegos') },
      laboratorio: { left: { ic: 'shelf', lb: 'Estante', run: open('shelf') }, center: 'meds', right: SHOP('salud') },
      jardin: { left: { ic: 'seeds', lb: 'Semillas', run: open('seeds') }, center: { ic: 'cloud', lb: 'Nube', run: () => rain() }, right: SHOP('huerta') },
      patio: { left: { ic: 'games', lb: 'Juegos', run: () => games() }, center: 'kick', right: SHOP('juegos') },
      paseo: { left: { ic: 'places', lb: 'Lugares', run: open('places') }, center: { ic: 'walk', lb: 'Pasear', run: () => stroll() }, right: SHOP('lugares') },
      garaje: { left: { ic: 'horn', lb: 'Bocina', run: () => honk() }, center: { ic: 'wheel', lb: 'Manejar', run: () => drive() }, right: SHOP('juegos') },
    };
    const EGG_BTNS = { left: { ic: 'menu', lb: 'Más', run: open('more') }, center: { ic: 'flame', lb: 'Dar calor', run: () => UI().warmEgg() }, right: SHOP() };
    let btnKey = '', curCenter = null, foodSel = null, medSel = null;
    function setBtn(b, d) {
      if (!d) { b.hidden = true; return; }
      b.hidden = false;
      setHTML(b.querySelector('.hb-ic'), d.html || ic(d.ic));
      setText(b.querySelector('.hb-lb'), d.lb);
      b._run = d.run;
    }
    const owned = (ids) => ids.filter((id) => (C.state.inv[id] || 0) > 0);
    function buttons(force) {
      const p = C.state.pet;
      const egg = p && p.stage === 'egg';
      const cfg = !p || p.dead ? null : egg ? EGG_BTNS : ROOM_BTNS[room()];
      let center = cfg && cfg.center, carousel = false;
      if (center === 'food' || center === 'meds') {
        const list = owned(center === 'food' ? C.FOOD_IDS : C.MEDS);
        let sel = center === 'food' ? foodSel : medSel;
        if (!list.includes(sel)) sel = list[0] || null;
        if (center === 'food') foodSel = sel; else medSel = sel;
        carousel = list.length > 1;
        if (!sel) center = center === 'food' ? { ic: 'plus', lb: 'Sin comida', run: open('shop', 'comida') } : { ic: 'plus', lb: 'Sin remedios', run: open('shop', 'salud') };
        else {
          const it = C.ITEMS[sel], sp = p ? p.species : 'dragon';
          const nm = sel === 'fav' ? C.SPECIES[sp].fav : it.name;
          center = { html: `<span class="hb-item">${art.itemSVG(sel, sp)}</span>`, lb: `${nm} x${C.state.inv[sel]}`, run: () => (cfg.center === 'food' ? feed(sel) : medicate(sel)), drag: cfg.center === 'food' ? 'food' : 'med', key: sel + C.state.inv[sel] };
        }
      } else if (center === 'lamp') {
        center = p && p.sleeping ? { ic: 'lampOff', lb: 'Prender', run: () => toggleSleep() } : { ic: 'lampOn', lb: 'Apagar', run: () => toggleSleep() };
      } else if (center === 'kick') {
        center = { ic: 'soccer', lb: 'Goles: ' + (C.state.stats.goals || 0), run: () => kick() };
      }
      const key = [room(), egg, !!p, p && p.dead, center && (center.key || center.lb), center && center.ic].join('|');
      if (!force && key === btnKey) return;
      btnKey = key;
      setBtn(E.bl, cfg && cfg.left); setBtn(E.bc, center); setBtn(E.br, cfg && cfg.right);
      curCenter = center;
      setHidden(E.cprev, !carousel); setHidden(E.cnext, !carousel);
      setCls(E.center, 'carousel', carousel);
      setCls(E.bc, 'draggable', !!(center && center.drag));
    }
    [E.bl, E.bc, E.br].forEach((b) => b.addEventListener('click', () => { snd.unlock(); if (b._dragged) { b._dragged = false; return; } if (b._run) b._run(); }));
    const cycle = (d) => {
      const isFood = (ROOM_BTNS[room()] || {}).center === 'food';
      const list = owned(isFood ? C.FOOD_IDS : C.MEDS); if (list.length < 2) return;
      const cur = isFood ? foodSel : medSel, i = Math.max(0, list.indexOf(cur)), n = list[(i + d + list.length) % list.length];
      if (isFood) foodSel = n; else medSel = n;
      snd.play('tap'); buttons(true);
      const p = C.state.pet;
      if (p && !p.sleeping && p.stage !== 'egg' && isFood) { view.setTemp('surprise', 700); }
    };
    E.cprev.addEventListener('click', () => cycle(-1));
    E.cnext.addEventListener('click', () => cycle(1));
    H.selectFood = (id) => { foodSel = id; buttons(true); };

    /* ---------- arrastrar comida (o el jabón) hasta la mascota ---------- */
    let drag = null;
    E.bc.addEventListener('pointerdown', (e) => {
      if (!curCenter || !curCenter.drag) return;
      drag = { kind: curCenter.drag, id: curCenter.drag === 'food' ? foodSel : curCenter.drag === 'med' ? medSel : 'soap', sx: e.clientX, sy: e.clientY, cx: e.clientX, cy: e.clientY, moving: false, ghost: null, lastSoap: 0 };
      try { E.bc.setPointerCapture(e.pointerId); } catch (_) { /* nada */ }
    });
    E.bc.addEventListener('pointermove', (e) => {
      if (!drag) return;
      drag.cx = e.clientX; drag.cy = e.clientY;
      if (!drag.moving && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 10) {
        drag.moving = true;
        const src = E.bc.querySelector('.hb-ic');
        drag.ghost = h(`<div class="h-ghost">${src.innerHTML}</div>`);
        el.appendChild(drag.ghost);
        const p = C.state.pet;
        if (p && !p.sleeping && !p.dead && drag.kind === 'food') view.setTemp('surprise', 60000);
      }
      if (drag.moving) {
        const r = el.getBoundingClientRect();
        drag.ghost.style.transform = `translate(${(e.clientX - r.left).toFixed(0)}px, ${(e.clientY - r.top).toFixed(0)}px) translate(-50%, -50%)`;
        anim.kick();
        const over = overPet(e.clientX, e.clientY);
        if (drag.kind === 'soap' && over) {
          const t = performance.now();
          if (t - drag.lastSoap > 140) { drag.lastSoap = t; addFoam(e.clientX, e.clientY); }
        }
        setCls(E.petbox, 'target', over && drag.kind !== 'soap');
      }
    });
    const endDrag = (e, cancel) => {
      if (!drag) return;
      const d = drag; drag = null;
      setCls(E.petbox, 'target', false);
      if (!d.moving) return;
      E.bc._dragged = true; setTimeout(() => { E.bc._dragged = false; }, 50);
      if (view.temp === 'surprise') { view.temp = null; view.render(); }
      const over = !cancel && overPet(e.clientX, e.clientY);
      if (d.ghost) {
        if (over && d.kind !== 'soap') d.ghost.remove();
        else { d.ghost.classList.add('back'); setTimeout(() => d.ghost.remove(), 260); }
      }
      if (over && d.kind === 'food') feed(d.id);
      else if (over && d.kind === 'med') medicate(d.id);
    };
    E.bc.addEventListener('pointerup', (e) => endDrag(e));
    E.bc.addEventListener('pointercancel', (e) => endDrag(e, true));
    function overPet(cx, cy) {
      const r = E.petbox.getBoundingClientRect();
      return cx > r.left + r.width * 0.12 && cx < r.right - r.width * 0.12 && cy > r.top + r.height * 0.05 && cy < r.bottom;
    }

    /* ---------- acciones de cada ambiente ---------- */
    function alive(msgIfSleep) {
      const p = C.state.pet;
      if (!p || p.dead || p.stage === 'egg') return null;
      if (msgIfSleep && p.sleeping) { H.bubble(msgIfSleep, 1800, true); return null; }
      return p;
    }
    function feed(id) {
      const p = alive('Está durmiendo. Despertalo primero.'); if (!p) return;
      const r = C.act.feed(id);
      UI().doAct(r, 'eat', id);
      if (!r.ok) { view.setTemp('sad', 900); return; }
      if (r.react === 'spicy') { setTimeout(() => { view.setTemp('spicy', 2200); if (p.species === 'dragon') view.setAct('special', 1800); snd.play('fire'); }, 900); }
      else if (r.react === 'sour') setTimeout(() => view.setTemp('sour', 1600), 900);
      else setTimeout(() => { if (!view.busy && !p.sleeping) view.setAct('lick', 1300); }, 2300);
      buttons(true);
    }
    function medicate(id) {
      const p = alive(); if (!p) return;
      const r = C.act.medicate(id);
      UI().doAct(r, 'heal');
      buttons(true);
    }
    H.feed = feed; H.medicate = medicate;
    // Baño: el jabón hace espuma sobre la mascota y la ducha la enjuaga (y la deja limpita)
    let foam = 0;
    const soapMode = () => room() === 'bano' && drag && drag.kind === 'soap';
    function addFoam(cx, cy) {
      const p = alive('Está durmiendo.'); if (!p) return;
      const r0 = E.petbox.getBoundingClientRect();
      const b = h('<i class="h-foam"></i>');
      b.style.left = ((cx - r0.left) / r0.width * 100).toFixed(1) + '%';
      b.style.top = ((cy - r0.top) / r0.height * 100).toFixed(1) + '%';
      b.style.setProperty('--s', (0.7 + Math.random() * 0.8).toFixed(2));
      E.petbox.appendChild(b); foam++;
      if (foam > 40) { const old = E.petbox.querySelector('.h-foam'); if (old) old.remove(); foam--; }
      if (C.act.toy('soap').ok) { snd.play('good'); if (Math.random() < 0.3) view.setTemp('happy', 900); }
    }
    function soapAuto() {
      const p = alive('Está durmiendo.'); if (!p) return;
      const r = E.petbox.getBoundingClientRect();
      for (let i = 0; i < 9; i++) setTimeout(() => addFoam(r.left + r.width * (0.3 + Math.random() * 0.4), r.top + r.height * (0.35 + Math.random() * 0.5)), i * 110);
      view.setTemp('happy', 1500);
    }
    function clearFoam() { E.petbox.querySelectorAll('.h-foam').forEach((f) => f.remove()); foam = 0; }
    let showering = false;
    function shower() {
      const p = alive('Está durmiendo.'); if (!p || showering) return;
      showering = true;
      const w = h(`<div class="h-water">${Array.from({ length: 22 }, (_, i) => `<i style="left:${(4 + i * 4.4).toFixed(1)}%;animation-delay:${(Math.random() * 0.6).toFixed(2)}s"></i>`).join('')}</div>`);
      E.petbox.appendChild(w);
      snd.play('bath');
      view.setTemp('happy', 1800);
      setTimeout(() => {
        w.remove(); clearFoam(); showering = false;
        const r = C.act.bath();
        if (r.ok) { snd.play('happy'); UI().fx(E.petbox, 'bath'); H.bubble(r.msg, 2000); }
        else if (r.msg) H.bubble(r.msg, 1600);
        view.setAct('shake', 1300);
      }, 1700);
    }
    H.shower = shower;
    function toggleSleep() {
      const p = alive(); if (!p) return;
      const was = p.sleeping;
      const r = C.act.sleep();
      if (r.ok) snd.play(was ? 'wake' : 'sleep');
      if (r.msg) H.bubble(r.msg, 2200, !r.ok);
      buttons(true);
    }
    H.toggleSleep = toggleSleep;
    function music() {
      const p = alive('Shh… está durmiendo'); if (!p) return;
      const r = C.act.toy('music');
      if (!r.ok && r.msg) { H.bubble(r.msg, 1800, true); return; }
      snd.play('dance');
      view.setAct('dance', 4200); view.setTemp('happy', 4200);
      notesFx(4000);
      if (r.ok) toast('+' + C.TOYS.music.fun + ' de diversión');
    }
    function notesFx(ms) {
      for (let i = 0; i < Math.round(ms / 450); i++) setTimeout(() => {
        const n = h(`<span class="h-note">${['♪', '♫', '♬'][i % 3]}</span>`);
        n.style.left = (20 + Math.random() * 60).toFixed(0) + '%';
        n.style.setProperty('--c', ['#ff5d9e', '#5b7cff', '#22b07d', '#ffc93c'][i % 4]);
        E.fx.appendChild(n); setTimeout(() => n.remove(), 1600);
      }, i * 450);
    }
    // tele del living: tocala y la mascota mira dibujitos
    E.props.addEventListener('click', (e) => {
      const tv = e.target.closest('.tv-prop'); if (tv) return watchTv(tv);
      if (e.target.closest('.fridge-prop')) return open('fridge')();
      if (e.target.closest('.shelf-prop')) return open('shelf')();
    });
    let tvT = 0;
    function watchTv(tv) {
      const p = alive('Shh… está durmiendo'); if (!p) return;
      snd.play('tap');
      tv.classList.add('on');
      clearTimeout(tvT); tvT = setTimeout(() => tv.classList.remove('on'), 8000);
      const r = tv.getBoundingClientRect();
      H.lookAt(r.left + r.width / 2, r.top + r.height * 0.3, 8000);
      view.setTemp('surprise', 1200);
      setTimeout(() => view.setTemp('happy', 6000), 1200);
      const res = C.act.toy('tv');
      if (res.ok) toast('¡Dibujitos! +' + C.TOYS.tv.fun + ' de diversión');
    }
    // Cuarto de juegos: pelota
    let ballOut = false, ballBusy = false;
    function ballEl() {
      const b = h(`<button type="button" class="h-ball" aria-label="Patear la pelota">${ic('ball')}</button>`);
      b.addEventListener('click', () => throwBall(b));
      return b;
    }
    function toggleBall() {
      const p = alive('Shh… está durmiendo'); if (!p) return;
      ballOut = !ballOut;
      const b = E.special.querySelector('.h-ball');
      if (ballOut && !b) { const nb = ballEl(); E.special.appendChild(nb); setTimeout(() => throwBall(nb), 250); }
      else if (!ballOut && b) b.remove();
    }
    function throwBall(b) {
      const p = alive('Shh… está durmiendo'); if (!p || ballBusy || !b.animate) return;
      ballBusy = true;
      const sr = E.scene.getBoundingClientRect(), br = b.getBoundingClientRect(), pr = E.petbox.getBoundingClientRect();
      const dx = pr.left + pr.width * 0.55 - (br.left + br.width / 2), dy = pr.top + pr.height * 0.25 - (br.top + br.height / 2);
      H.lookAt(br.left + br.width / 2, br.top, 1200);
      const a = b.animate([
        { transform: 'translate(0,0) rotate(0deg)' },
        { transform: `translate(${(dx * 0.5).toFixed(0)}px, ${(dy - sr.height * 0.25).toFixed(0)}px) rotate(200deg)`, offset: 0.45 },
        { transform: `translate(${dx.toFixed(0)}px, ${dy.toFixed(0)}px) rotate(360deg)`, offset: 0.7 },
        { transform: `translate(${(dx * 0.3).toFixed(0)}px, ${(-sr.height * 0.3).toFixed(0)}px) rotate(520deg)`, offset: 0.86 },
        { transform: 'translate(0,0) rotate(720deg)' },
      ], { duration: 1500, easing: 'ease-in-out' });
      setTimeout(() => { view.setAct('hop', 700); snd.play('good'); const r = C.act.toy('ball'); if (r.ok) view.setTemp('happy', 1200); else if (r.msg) H.bubble(r.msg, 1500, true); }, 1000);
      a.onfinish = () => { ballBusy = false; };
      setTimeout(() => { ballBusy = false; }, 1700);
    }
    function games() {
      const r = C.act.canPlay();
      if (!r.ok) { H.bubble(r.msg || 'Ahora no puede jugar', 2200, true); return; }
      snd.play('tap'); UI().openSheet('games');
    }
    // Patio: penales (la mascota ataja)
    let kicking = false;
    function kick() {
      const p = alive('Shh… está durmiendo'); if (!p || kicking) return;
      const sr = E.scene.getBoundingClientRect(), goal = E.special.querySelector('.h-goal');
      if (!goal) return;
      kicking = true;
      const gr = goal.getBoundingClientRect();
      const side = Math.floor(Math.random() * 3) - 1, high = Math.random() < 0.5;
      const tx = gr.left + gr.width * (0.5 + side * 0.33) - sr.left, ty = gr.top + gr.height * (high ? 0.3 : 0.72) - sr.top;
      const ball = h(`<div class="h-kickball">${ic('soccer')}</div>`);
      E.fx.appendChild(ball);
      const sx = sr.width / 2, sy = sr.height - 10;
      snd.play('tap');
      const dive = Math.floor(Math.random() * 3) - 1;
      const saved = dive === side && Math.random() < 0.85;
      setTimeout(() => { placePet(spot('patio').x + dive * 22, 220); view.dir = dive < 0 ? -1 : 1; view.setAct('hop', 600); }, 180);
      const anim2 = ball.animate([
        { transform: `translate(${sx}px, ${sy}px) translate(-50%,-50%) scale(1.25)` },
        { transform: `translate(${tx}px, ${ty}px) translate(-50%,-50%) scale(0.7)` },
      ], { duration: 520, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' });
      setTimeout(() => {
        const r = C.act.toy('kick', { goal: !saved });
        if (saved) { toast('¡Atajó!'); view.setTemp('happy', 1300); snd.play('good'); ball.animate([{ transform: `translate(${tx}px, ${ty}px) translate(-50%,-50%) scale(.7)` }, { transform: `translate(${tx + (Math.random() - 0.5) * 200}px, ${sy}px) translate(-50%,-50%) scale(1.1)` }], { duration: 500, fill: 'forwards' }); }
        else { toast('¡Gooool!'); view.setTemp('surprise', 1100); snd.play('coin'); goal.classList.remove('shake'); void goal.offsetWidth; goal.classList.add('shake'); }
        if (!r.ok && r.msg) H.bubble(r.msg, 1500, true);
        buttons(true);
      }, 540);
      setTimeout(() => { ball.remove(); placePet(spot('patio').x, 300); kicking = false; }, 1300);
      void anim2;
    }
    // Jardín: lluvia con la nube, plantar y cosechar
    let raining = false;
    function rain() {
      if (raining) return;
      const r = C.act.water();
      if (!r.ok) { if (r.msg) toast(r.msg); open('seeds')(); return; }
      raining = true;
      const c = h(`<div class="h-rain"><div class="h-cloud">${ic('cloud')}</div>${Array.from({ length: 18 }, (_, i) => `<i style="left:${(6 + i * 5).toFixed(0)}%;animation-delay:${(Math.random() * 0.5).toFixed(2)}s"></i>`).join('')}</div>`);
      E.special.appendChild(c);
      snd.play('bath');
      setTimeout(() => { c.remove(); raining = false; renderPlots(true); }, 2000);
      if (r.fun) { const p = C.state.pet; if (p && !p.sleeping) view.setTemp('happy', 1500); }
      toast('¡A regar! Crece 3 horas');
    }
    let plotsKey = '';
    function renderPlots(force) {
      const box = E.special.querySelector('.h-plots'); if (!box) return;
      const t = Date.now();
      const st = C.state.garden.plots.map((pl) => C.plotState(pl, t));
      const key = st.map((s) => (s ? [s.seed, Math.floor(s.pct * 20), s.ripe, s.wet].join() : '-')).join('|');
      if (!force && key === plotsKey) return;
      plotsKey = key;
      box.innerHTML = st.map((s, i) => `<button type="button" class="h-plot${s && s.ripe ? ' ripe' : ''}${s ? '' : ' empty'}" data-i="${i}" aria-label="Cantero ${i + 1}">${HA.plotSVG(s, s ? C.ITEMS[s.crop].emoji : '')}</button>`).join('');
    }
    E.special.addEventListener('click', (e) => {
      const b = e.target.closest('.h-plot'); if (!b) return;
      snd.unlock();
      const i = +b.dataset.i, pl = C.state.garden.plots[i];
      if (!pl) { if (H.seedSel && (C.state.inv[H.seedSel] || 0) > 0) plantAt(i, H.seedSel); else UI().openSheet('seeds', i); return; }
      const s = C.plotState(pl);
      if (s.ripe) {
        const r = C.act.harvest(i);
        if (r.ok) { snd.play('coin'); flyEmoji(b, C.ITEMS[r.crop].emoji, '+' + r.n); toast(r.msg); const p = C.state.pet; if (p && !p.sleeping && p.stage !== 'egg') view.setTemp('happy', 1500); }
        renderPlots(true); return;
      }
      toast(s.wet ? `${C.ITEMS[s.crop].name}: falta ${C.dur(s.left)} (tierra mojada)` : `${C.ITEMS[s.crop].name}: está seca. ¡Regá con la nube!`);
    });
    function plantAt(i, seed) {
      const r = C.act.plant(i, seed);
      if (r.ok) { snd.play('good'); toast(r.msg); if ((C.state.inv[seed] || 0) <= 0) H.seedSel = null; } else if (r.msg) toast(r.msg);
      renderPlots(true);
    }
    H.plantAt = plantAt;
    function flyEmoji(fromEl, e, txt) {
      const r0 = fromEl.getBoundingClientRect(), sr = el.getBoundingClientRect();
      const f = h(`<span class="h-fly">${art.emojiSVG(e)}<b>${esc(txt)}</b></span>`);
      f.style.left = (r0.left + r0.width / 2 - sr.left).toFixed(0) + 'px'; f.style.top = (r0.top - sr.top).toFixed(0) + 'px';
      el.appendChild(f); setTimeout(() => f.remove(), 1300);
    }
    // Paseo: sale a pasear por el lugar elegido
    function stroll() {
      const p = alive('Shh… está durmiendo'); if (!p) return;
      const r = C.act.toy('paseo');
      if (!r.ok && r.msg) { H.bubble(r.msg, 1800, true); return; }
      const sp = spot('paseo').x;
      startWalk(14, 1.4, () => startWalk(86, 1.4, () => startWalk(sp, 1.4, () => { view.setAct('hop', 900); view.setTemp('happy', 1500); })));
      toast(r.ok ? '¡Qué lindo paseo! +' + C.TOYS.paseo.fun + ' de diversión' : 'Ya paseó hace un rato: ahora pasea por gusto');
    }
    // Garaje
    function honk() {
      const p = alive(); if (!p) return;
      snd.play('honk');
      const car = E.front.querySelector('.h-car'); if (car) { car.classList.remove('honk'); void car.offsetWidth; car.classList.add('honk'); }
      if (!p.sleeping) { view.setTemp('surprise', 900); setTimeout(() => view.setTemp('happy', 1200), 900); }
      else H.bubble('¡Uy! Casi lo despertás', 1600);
    }
    function drive() {
      const p = alive('Está durmiendo.'); if (!p) return;
      if (UI().gameLocked('carrera')) { snd.play('tap'); UI().openSheet('games'); return; }
      const r = C.act.canPlay();
      if (!r.ok) { H.bubble(r.msg || 'Ahora no puede manejar', 2200, true); return; }
      UI().startGame('carrera');
    }
    function takePhoto() {
      const r = C.act.photo();
      if (!r.ok) { snd.play('bad'); return; }
      snd.play('coin');
      const fl = h('<div class="h-flash"></div>'); E.scene.appendChild(fl); setTimeout(() => fl.remove(), 500);
      view.setTemp('happy', 1500);
      toast(r.msg);
    }

    /* ---------- globito y avisos ---------- */
    let bubbleT = 0;
    H.bubble = function (text, ms, warn, action) {
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
      // que no se salga de la pantalla (la mascota puede estar en un costado)
      const br = E.bubble.getBoundingClientRect(), sr = E.scene.getBoundingClientRect();
      if (br.left < sr.left + 4) E.bubble.style.marginLeft = (sr.left + 4 - br.left) + 'px';
      else if (br.right > sr.right - 4) E.bubble.style.marginLeft = (sr.right - 4 - br.right) + 'px';
      clearTimeout(bubbleT);
      bubbleT = setTimeout(() => { E.bubble.hidden = true; }, ms || 2000);
      const p = C.state.pet;
      if (p && !p.sleeping && !p.dead && p.stage !== 'egg') view.talk(Math.min(1800, 300 + text.length * 55));
    };
    let toastT = 0;
    function toast(text) {
      E.toast.textContent = text; E.toast.hidden = false;
      E.toast.classList.remove('pop'); void E.toast.offsetWidth; E.toast.classList.add('pop');
      clearTimeout(toastT); toastT = setTimeout(() => { E.toast.hidden = true; }, 2200);
    }
    H.toast = toast;

    /* ---------- cacas ---------- */
    let poopKey = '';
    function renderPoops(force) {
      const p = C.state.pet;
      const list = p && !p.dead ? p.poops : [];
      const key = list.map((q) => q.id).join(',');
      if (!force && key === poopKey) return;
      poopKey = key;
      E.poops.innerHTML = list.map((q) => `<button type="button" class="poop" data-poop="${q.id}" style="left:${(q.x * 100).toFixed(1)}%" aria-label="Limpiar caca">${art.poopSVG()}</button>`).join('');
    }
    E.poops.addEventListener('click', (e) => {
      const b = e.target.closest('[data-poop]'); if (!b) return;
      snd.unlock();
      const r = C.act.clean(b.dataset.poop);
      if (r.ok) { snd.play('good'); renderPoops(true); }
    });
    H.onClean = () => renderPoops(true);
    H.onPetEvent = (e) => {
      if (e.type === 'poop') renderPoops(true);
      if (e.type === 'hatch' || e.type === 'grow') { drawRoom(true); sizePet(); }
    };

    /* ---------- barra de arriba ---------- */
    function hud() {
      const S = C.state, p = S.pet;
      setText(E.coins, S.coins);
      const live = p && !p.dead && p.stage !== 'egg';
      el.querySelectorAll('.h-stat').forEach((b) => {
        const k = b.dataset.k;
        const v = live ? Math.round(p[k]) : p && p.stage === 'egg' ? (k === 'energy' ? Math.round(p.egg.warmth) : k === 'health' ? Math.min(100, Math.round(p.egg.progress)) : 100) : 0;
        const fill = b.querySelector('.h-fill');
        const tf = `translateY(${100 - v}%)`;
        if (fill.style.transform !== tf) fill.style.transform = tf;
        const lvl = v < 25 ? 'low' : v < 50 ? 'mid' : 'ok';
        if (b.dataset.lvl !== lvl) { b.dataset.lvl = lvl; if (lvl === 'low') { b.classList.remove('ping'); void b.offsetWidth; b.classList.add('ping'); } }
        const ti = live ? `${STATS.find((s) => s.k === k).label}: ${v}% — tocá para ver qué hacer` : '';
        if (b.title !== ti) b.title = ti;
        b.dataset.v = v;
      });
      setCls(el, 'is-egg', !!(p && p.stage === 'egg'));
      setHidden(E.eggbar, !(p && p.stage === 'egg'));
      if (p && p.stage === 'egg') {
        const w = `translateX(${(Math.round(p.egg.warmth) - 100)}%)`, hb = `translateX(${(Math.min(100, Math.round(p.egg.progress)) - 100)}%)`;
        const wi = E.eggbar.querySelector('.warmth i'), hi = E.eggbar.querySelector('.hatch i');
        if (wi.style.transform !== w) wi.style.transform = w;
        if (hi.style.transform !== hb) hi.style.transform = hb;
      }
      setText(E.lv, live ? p.level : p && p.stage === 'egg' ? '0' : '-');
      const xpPct = live ? (p.level >= C.R.maxLevel ? 100 : Math.min(100, (p.xp / C.xpNeed(p.level)) * 100)) : 0;
      const tf = `translateX(${(xpPct - 100).toFixed(1)}%)`;
      if (E.xp.style.transform !== tf) E.xp.style.transform = tf;
    }

    /* ---------- movimiento (pasea un poquito por el ambiente) ---------- */
    let x = 50, walk = null, walkTimer = 0, nextT = 0, placed = '';
    function placePet(xPct, ms, force) {
      const sp = spot(room());
      const px = Math.round((xPct / 100) * sceneW);
      const v = `translate3d(${px}px, ${(-sp.up).toFixed(2)}em, 0) translateX(-50%)`;
      const tr = ms ? `transform ${Math.round(ms)}ms linear` : 'none';
      if (E.petbox.style.transition !== tr) E.petbox.style.transition = tr;
      if (!force && v === placed) return;
      placed = v;
      E.petbox.style.transform = v;
    }
    function curX() {
      if (!walk) return x;
      const k = Math.min(1, (performance.now() - walk.t0) / walk.dur);
      return walk.x0 + (walk.x1 - walk.x0) * k;
    }
    function free() {
      const p = C.state.pet;
      return !!(p && !p.dead && p.stage !== 'egg' && !p.sleeping && !UI().modalOpen && !drag && !kicking && !showering);
    }
    const fixedRoom = () => ['jardin', 'patio', 'garaje'].includes(room());
    function speed() {
      const p = C.state.pet;
      return (p.stage === 'baby' ? 7 : p.stage === 'young' ? 9 : 10) * (p.energy < 20 ? 0.5 : 1) * (p.species === 'turtle' ? 0.5 : 1);
    }
    function startWalk(to, mult, onArrive) {
      x = curX();
      clearTimeout(walkTimer); clearTimeout(nextT); nextT = 0;
      const dist = Math.abs(to - x);
      if (dist < 0.5) { stopWalk(); if (onArrive) onArrive(); return; }
      const dur = (dist / (speed() * (mult || 1))) * 1000;
      walk = { x0: x, x1: to, t0: performance.now(), dur, seek: !!onArrive };
      view.dir = to > x ? 1 : -1;
      view.walking = true; view.render();
      placePet(to, dur);
      walkTimer = setTimeout(() => {
        x = to; walk = null; view.walking = false; view.render(); placePet(x, 0);
        if (onArrive) onArrive();
        schedule(4000 + Math.random() * 8000);
      }, dur);
    }
    function stopWalk() {
      clearTimeout(walkTimer);
      if (!walk) return;
      x = curX(); walk = null;
      view.walking = false; view.render();
      placePet(x, 0, true);
    }
    function schedule(ms) {
      clearTimeout(nextT);
      nextT = setTimeout(() => {
        nextT = 0;
        if (walk) return;
        if (!free() || fixedRoom() || view.busy || document.hidden || UI().sheetOpen || H.paused) { schedule(3000); return; }
        const c = spot(room()).x, to = c - 16 + Math.random() * 32;
        if (Math.abs(to - x) > 6) startWalk(to); else schedule(2500);
      }, ms);
    }
    H.isIdle = () => !walk;
    H.onAsk = (need) => {
      if (need && need.level === 2 && free() && !fixedRoom()) { // urgente: viene al centro y salta
        const c = spot(room()).x;
        if (Math.abs(c - curX()) > 3) startWalk(c, 2, () => view.setAct('hop', 1000));
        else { stopWalk(); view.setAct('hop', 1000); }
        return;
      }
      stopWalk();
      schedule(6000);
    };
    H.onReset = () => { E.bubble.hidden = true; stopWalk(); clearFoam(); drawRoom(true); schedule(2000); };
    if (window.ResizeObserver) new ResizeObserver(() => { const w = E.scene.clientWidth; if (w && w !== sceneW) { sceneW = w; sceneH = E.scene.clientHeight; if (walk) stopWalk(); placePet(x, 0, true); sizePet(); } else { sceneH = E.scene.clientHeight; sizePet(); } }).observe(E.scene);

    /* ---------- actualizar (lo llama el ciclo del juego cada segundo y cuando algo cambia) ---------- */
    H.update = function () {
      const p = C.state.pet;
      drawRoom();
      drawPlace();
      hud();
      buttons();
      renderPoops();
      if (room() === 'jardin') renderPlots();
      setCls(E.scene, 'lights-off', !!(p && p.sleeping));
      setCls(E.scene, 'dead', !!(p && p.dead));
      E.petbox.dataset.stage = p ? p.stage : '';
      if (walk && !free() && !walk.seek) stopWalk();
      if (p && (p.stage === 'egg' || p.dead) && Math.abs(curX() - 50) > 0.5 && !walk) { x = 50; placePet(50, 600); }
      if (!walk && !nextT && free()) schedule(2500);
      view.tired = !!(p && !p.sleeping && p.stage !== 'egg' && p.energy < 30);
      view.render();
    };
    // en Windows la casa se pausa cuando el panel se cierra (no anima nada escondida)
    H.pause = (v) => { H.paused = !!v; if (!v) { fit(); anim.kick(); } };
    // teclado (Windows y compu): flechas para cambiar de ambiente
    window.addEventListener('keydown', (e) => {
      if (H.paused || !el.isConnected || UI().sheetOpen || UI().modalOpen || (e.target && e.target.closest && e.target.closest('input,textarea'))) return;
      if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
    });
    drawRoom(true);
    hud();
    schedule(2500);
    return H;
  };
})();
