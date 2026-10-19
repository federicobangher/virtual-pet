/* Virtual Pet — modo "cuarto": la mascota vive en su habitación (celular, tablet, navegador). */
(function () {
  'use strict';
  const N = window.N;
  const C = N.core, UI = N.ui, snd = N.sound;

  const NEST = `<svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="100" cy="34" rx="86" ry="20" fill="#b9874f"/>
    <ellipse cx="100" cy="28" rx="70" ry="13" fill="#7a5530"/>
    <g stroke="#e0b47a" stroke-width="3" stroke-linecap="round" fill="none">
      <path d="M20 34 q30 -10 60 2"/><path d="M60 46 q40 -14 84 -2"/><path d="M120 30 q30 -6 62 6"/><path d="M30 42 q24 6 48 0"/><path d="M128 46 q20 4 40 -6"/>
    </g>
    <g stroke="#9c6c3a" stroke-width="2.5" stroke-linecap="round" fill="none"><path d="M16 30 l-8 -6"/><path d="M184 32 l9 -5"/><path d="M40 48 l-6 6"/><path d="M160 48 l7 6"/></g></svg>`;

  const host = { kind: 'room' };
  let E = {}, view;
  let x = 50, target = 50, walking = false, idleUntil = 0, lastFrame = 0, poopKey = '', sceneW = 0, placed = '';

  host.init = function () {
    document.body.classList.add('mode-room');
    const app = document.getElementById('app');
    app.innerHTML = `
      <main class="room-app">
        <section class="scene" aria-label="Cuarto de la mascota">
          <div class="wall"></div>
          <div class="window" aria-hidden="true"><div class="sky"><span class="sun"></span><span class="moon"></span><i class="st s1"></i><i class="st s2"></i><i class="st s3"></i><span class="cloud"></span></div><span class="sill"></span></div>
          <div class="frame" aria-hidden="true"><span></span></div>
          <div class="lamp" aria-hidden="true"><span class="cord"></span><span class="shade"></span><span class="glow"></span></div>
          <div class="floor" aria-hidden="true"></div>
          <div class="rug" aria-hidden="true"></div>
          <div class="bgsky" aria-hidden="true"></div>
          <div class="bgground" aria-hidden="true"></div>
          <div class="bgstars" aria-hidden="true"></div><span class="bgmoon" aria-hidden="true"></span>
          <div class="poops"></div>
          <div class="nest" hidden>${NEST}</div>
          <div class="petbox"><button type="button" class="petsvg" aria-label="Acariciar a tu mascota"></button><div class="bubble" hidden></div></div>
          <div class="dark" aria-hidden="true"></div>
          <div class="fastbadge" aria-hidden="true">x120</div>
        </section>
        <section class="panel"></section>
      </main>
      <div class="sheet-wrap" hidden><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><header><h3 id="sheet-title"></h3><button type="button" class="x" aria-label="Cerrar">${UI.ic('close')}</button></header><div class="sheet-body"></div></div></div>
      <div class="modal-wrap" hidden><div class="modal-box" role="dialog" aria-modal="true"></div></div>`;
    E = {
      scene: app.querySelector('.scene'), petbox: app.querySelector('.petbox'), petsvg: app.querySelector('.petsvg'),
      bubble: app.querySelector('.bubble'), bgsky: app.querySelector('.bgsky'), bgground: app.querySelector('.bgground'), poops: app.querySelector('.poops'), nest: app.querySelector('.nest'),
      panel: app.querySelector('.panel'), sheetWrap: app.querySelector('.sheet-wrap'), sheetBody: app.querySelector('.sheet-body'),
      sheetTitle: app.querySelector('#sheet-title'), modalWrap: app.querySelector('.modal-wrap'), modalBox: app.querySelector('.modal-box'),
    };
    view = new UI.PetView(E.petsvg);
    // la mascota se anima con el reloj de js/anim.js: 24 cuadros por segundo moviéndose, 12 quieta, 5 dormida
    const pa = N.petAnim({
      svg: () => E.petsvg.firstElementChild, view: () => view, ms: { active: 42, idle: 83, sleep: 200, egg: 63 },
      slow: () => !E.sheetWrap.hidden || !E.modalWrap.hidden,
      pauseHidden: true, respectReduced: true,
      extra: (t) => { // el olorcito de las cacas
        const st = E.poops.querySelectorAll('.stink');
        if (!st.length) return;
        const k = 0.5 - 0.5 * Math.cos(Math.PI * 2 * t / 1.6);
        const tf = `translateY(${(-3 * k).toFixed(1)}px)`, op = (1 - 0.5 * k).toFixed(2);
        st.forEach((e) => { e.style.transform = tf; e.style.opacity = op; });
      },
    });
    view.onSvg = () => pa.kick();
    // ancho de la escena en píxeles (para mover la mascota con transform, sin recalcular el diseño)
    if (window.ResizeObserver) new ResizeObserver(() => { sceneW = E.scene.clientWidth; placePet(true); }).observe(E.scene);
    sceneW = E.scene.clientWidth;
    E.petbox.style.left = '0'; placePet(true);

    E.petsvg.addEventListener('click', () => {
      snd.unlock();
      const p = C.state.pet;
      if (!p || p.dead) return;
      if (p.stage === 'egg') return UI.warmEgg();
      if (p.sleeping) return host.bubble('Shh… está durmiendo', 1600);
      const r = C.act.pet();
      if (r.ok) { UI.fx(E.petbox, 'love'); if (Math.random() < 0.35) UI.doIdle('special'); else { view.setTemp('happy', 1500); snd.play('voice', p.species); } }
    });
    E.poops.addEventListener('click', (e) => {
      const b = e.target.closest('[data-poop]'); if (!b) return;
      snd.unlock();
      const r = C.act.clean(b.dataset.poop);
      if (r.ok) { snd.play('good'); renderPoops(true); }
    });
    E.sheetWrap.addEventListener('click', (e) => { if (e.target === E.sheetWrap || e.target.closest('.x')) host.sheetClose(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !E.sheetWrap.hidden) host.sheetClose(); });
    wake();
  };

  host.panelRoot = () => E.panel;
  host.petBox = () => E.petbox;
  host.view = () => view;

  let bubbleT = 0;
  host.bubble = function (text, ms, warn, action) {
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
    E.bubble.classList.remove('pop'); void E.bubble.offsetWidth; E.bubble.classList.add('pop');
    clearTimeout(bubbleT);
    bubbleT = setTimeout(() => { E.bubble.hidden = true; }, ms || 2000);
  };

  let sheetOpts = null;
  host.sheet = function (title, node, opts) {
    if (sheetOpts && sheetOpts.onClose) { const f = sheetOpts.onClose; sheetOpts = null; f(); }
    sheetOpts = opts || {};
    E.sheetTitle.textContent = title;
    E.sheetBody.replaceChildren(node);
    E.sheetWrap.hidden = false;
    E.sheetWrap.classList.toggle('wide', !!sheetOpts.wide);
    E.sheetBody.scrollTop = 0;
  };
  host.sheetClose = function () {
    E.sheetWrap.hidden = true;
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
  host.onClean = () => renderPoops(true);
  let seekHop = false;
  host.onAsk = (need) => {
    if (need && need.level === 2) { // urgente: viene corriendo al frente y salta
      target = 50; seekHop = true;
      if (Math.abs(target - x) > 3) { walking = true; view.dir = target > x ? 1 : -1; wake(); } else { view.setAct('hop', 1000); seekHop = false; }
      return;
    }
    if (walking) { walking = false; view.walking = false; }
    idleUntil = performance.now() + 6000;
  };
  host.isIdle = () => !walking;
  host.onReset = () => { E.bubble.hidden = true; x = 50; placePet(true); renderPoops(true); };
  host.onPetEvent = (e) => { if (e.type === 'poop') renderPoops(true); };

  function renderPoops(force) {
    const p = C.state.pet;
    const list = p && !p.dead ? p.poops : [];
    const key = list.map((q) => q.id).join(',');
    if (!force && key === poopKey) return;
    poopKey = key;
    E.poops.innerHTML = list.map((q) => `<button type="button" class="poop" data-poop="${q.id}" style="left:${(q.x * 100).toFixed(1)}%" aria-label="Limpiar caca">${N.art.poopSVG()}</button>`).join('');
  }

  function skyClass() {
    const hr = new Date().getHours();
    return hr >= 7 && hr < 18 ? 'day' : hr >= 18 && hr < 20 ? 'dusk' : 'night';
  }

  // Fondo elegido: el cuarto se dibuja con CSS; los demás son dos capas SVG (cielo y suelo)
  let bgNow = null;
  function applyBg() {
    const id = C.BACKGROUNDS[C.state.bg] ? C.state.bg : 'cuarto';
    if (id === bgNow) return;
    bgNow = id;
    E.scene.dataset.bg = id;
    E.scene.classList.toggle('outdoor', !!C.BACKGROUNDS[id].outdoor);
    E.bgsky.innerHTML = N.themes.sky(id);
    E.bgground.innerHTML = N.themes.ground(id);
  }

  host.update = function () {
    const p = C.state.pet;
    applyBg();
    E.scene.classList.toggle('lights-off', !!(p && p.sleeping));
    E.scene.dataset.sky = skyClass();
    E.nest.hidden = !(p && p.stage === 'egg');
    E.scene.classList.toggle('has-egg', !!(p && p.stage === 'egg'));
    E.scene.classList.toggle('dead', !!(p && p.dead));
    E.petbox.dataset.stage = p ? p.stage : '';
    renderPoops();
    view.render();
  };

  // La mascota se ubica con transform (no con "left"): moverla no obliga a recalcular el diseño de la página.
  function placePet(force) {
    const px = Math.round((x / 100) * sceneW);
    const v = `translate3d(${px}px,0,0) translateX(-50%)`;
    if (!force && v === placed) return;
    placed = v;
    E.petbox.style.transform = v;
  }

  // Movimiento: a 60 cuadros por segundo sólo mientras camina; quieta, revisa 4 veces por segundo si sale a pasear.
  let raf = 0, idleT = 0;
  function wake() { if (!raf) { clearTimeout(idleT); idleT = 0; lastFrame = 0; raf = requestAnimationFrame(anim); } }
  function anim(t) {
    raf = 0;
    const dt = lastFrame ? Math.min(100, t - lastFrame) / 1000 : 0;
    lastFrame = t;
    const p = C.state.pet;
    let moving = false;
    const free = p && !p.dead && p.stage !== 'egg' && !p.sleeping && (!view.busy || seekHop);
    if (!free) {
      if (walking) { walking = false; view.walking = false; }
      if (p && (p.stage === 'egg' || p.dead) && Math.abs(50 - x) > 0.05) { x += (50 - x) * Math.min(1, dt * 3); moving = true; }
    } else {
      const now = performance.now();
      if (!walking && now > idleUntil && !document.hidden) {
        target = 26 + Math.random() * 48;
        if (Math.abs(target - x) > 6) { walking = true; view.dir = target > x ? 1 : -1; }
        else idleUntil = now + 2000;
      }
      if (walking) {
        const sp = (p.stage === 'baby' ? 6 : p.stage === 'young' ? 8 : 9) * (p.energy < 20 ? 0.5 : 1) * (p.species === 'turtle' ? 0.5 : 1) * (seekHop ? 2 : 1);
        const d = target - x;
        const stepX = Math.sign(d) * sp * dt;
        if (Math.abs(stepX) >= Math.abs(d)) { x = target; walking = false; idleUntil = now + 2500 + Math.random() * 6000; if (seekHop) { seekHop = false; view.setAct('hop', 1000); } }
        else x += stepX;
        moving = walking;
      }
      view.walking = walking;
    }
    placePet();
    view.render();
    if (moving) raf = requestAnimationFrame(anim);
    else { lastFrame = 0; idleT = setTimeout(() => { idleT = 0; wake(); }, 250); }
  }

  N.roomHost = host;
})();
