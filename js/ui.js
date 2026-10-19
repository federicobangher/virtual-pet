/* Virtual Pet — interfaz compartida: panel, hojas, ventanas, efectos y ciclo principal.
   Cada modo (cuarto / escritorio) aporta un "host" que sabe dónde mostrar las cosas. */
(function () {
  'use strict';
  const N = window.N;
  const C = N.core, art = N.art, snd = N.sound;

  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = (n, cls) => art.icon(n, cls);
  // Escriben en la página sólo si el valor cambió (así el navegador no recalcula nada de más cada segundo)
  const setText = (el, v) => { v = String(v); if (el.textContent !== v) el.textContent = v; };
  const setW = (el, pct) => { const v = pct + '%'; if (el.style.width !== v) el.style.width = v; };
  const setHTML = (el, html) => { if (el._html !== html) { el._html = html; el.innerHTML = html; } };
  const coinIc = () => `<span class="coin-ic">${art.itemSVG('coin')}</span>`;

  const METERS = [
    { k: 'food', label: 'Comida', icon: 'food' },
    { k: 'energy', label: 'Energía', icon: 'bolt' },
    { k: 'fun', label: 'Diversión', icon: 'play' },
    { k: 'hygiene', label: 'Higiene', icon: 'bath' },
    { k: 'health', label: 'Salud', icon: 'heart' },
  ];

  /* ============ vista de la mascota ============ */
  class PetView {
    constructor(el) { this.el = el; this.key = ''; this.temp = null; this.tempUntil = 0; this.dir = 1; this.walking = false; this.flying = false; this.act = null; this.actUntil = 0; this.actT0 = 0; }
    setTemp(mood, ms) { this.temp = mood; this.tempUntil = Date.now() + ms; this.render(); }
    // gesto corto (estirarse, rascarse, saltito…)
    setAct(name, ms) { this.act = name; this.actUntil = Date.now() + ms; this.actT0 = performance.now(); this.render(); }
    get busy() { return !!(this.temp || (this.act && Date.now() < this.actUntil)); }
    render(force) {
      const S = C.state, p = S.pet;
      if (!p) { if (this.key !== 'none') { this.el.innerHTML = ''; this.key = 'none'; } return; }
      let key, svg = null;
      if (p.stage === 'egg') {
        const pr = p.egg.progress > 75 ? 2 : p.egg.progress > 45 ? 1 : 0;
        key = `egg|${p.species}|${pr}|${Math.round(p.egg.warmth / 25)}`;
        if (force || key !== this.key) svg = art.eggSVG({ species: p.species, progress: p.egg.progress, warmth: p.egg.warmth });
      } else {
        let m = C.mood(p);
        if (this.temp && Date.now() < this.tempUntil && !p.dead && !p.sleeping) m = this.temp; else this.temp = null;
        if (this.act && (Date.now() >= this.actUntil || p.sleeping || p.dead)) this.act = null;
        key = [p.species, p.stage, p.variant, m, this.dir, this.walking, this.flying, S.wearing, this.act].join('|');
        if (force || key !== this.key) svg = art.petSVG({ species: p.species, stage: p.stage, variant: p.variant, mood: m, dir: this.dir, accessory: S.wearing, walking: this.walking, flying: this.flying, act: this.act });
      }
      if (svg) { this.el.innerHTML = svg; this.key = key; if (this.onSvg) this.onSvg(); }
    }
  }

  /* ============ efectos ============ */
  function fx(box, kind, opts) {
    if (!box) return;
    opts = opts || {};
    const make = (html, cls, dx, dy, delay) => {
      const e = h(`<div class="fx ${cls}">${html}</div>`);
      e.style.left = (50 + (dx || 0)) + '%';
      e.style.top = (opts.top != null ? opts.top : 35) + (dy || 0) + '%';
      e.style.animationDelay = (delay || 0) + 's';
      box.appendChild(e);
      setTimeout(() => e.remove(), 2200 + (delay || 0) * 1000);
    };
    if (kind === 'love') for (let i = 0; i < 3; i++) make(ic('heart'), 'fx-heart', -18 + i * 18, -i * 4, i * 0.15);
    if (kind === 'eat') make(art.itemSVG(opts.item || 'fruit', C.state.pet && C.state.pet.species), 'fx-food', 22, 6);
    if (kind === 'bath') for (let i = 0; i < 9; i++) make('', 'fx-bubble', -30 + Math.random() * 60, Math.random() * 40, Math.random() * 0.6);
    if (kind === 'heal') for (let i = 0; i < 5; i++) make(ic('star'), 'fx-star', -30 + i * 15, Math.random() * 30, i * 0.1);
    if (kind === 'warm') make(ic('warm'), 'fx-warm', -10 + Math.random() * 20, 10);
    if (kind === 'coins') make(`+${opts.n} ${coinIc()}`, 'fx-coins', 0, -10);
  }

  /* ============ panel ============ */
  const P = {};
  function buildPanel(root) {
    root.innerHTML = '';
    P.hud = h(`<div class="hud">
        <div class="who"><span class="pname"></span><span class="chip pstage"></span></div>
        <button class="coins" type="button" title="Tus monedas — abrir la tienda">${coinIc()}<b class="ncoins">0</b></button>
      </div>`);
    P.level = h(`<div class="level" hidden><span class="lvnum">Nivel 0</span><span class="bar xp" title="Puntos para el próximo nivel"><i></i></span><span class="lvnext"></span></div>`);
    P.meters = h(`<div class="meters" role="list"></div>`);
    METERS.forEach((m) => {
      P.meters.appendChild(h(`<div class="meter m-${m.k}" role="listitem" title="${m.label}"><span class="mi">${ic(m.icon)}</span><span class="bar"><i></i></span><span class="ml">${m.label}</span></div>`));
    });
    P.eggbar = h(`<div class="eggbar" hidden><div class="eggrow"><span>Calor</span><span class="bar warmth"><i></i></span></div><div class="eggrow"><span>Nacimiento</span><span class="bar hatch"><i></i></span></div></div>`);
    P.actions = h(`<div class="actions"></div>`);
    root.append(P.hud, P.level, P.meters, P.eggbar, P.actions);
    P.hud.querySelector('.coins').addEventListener('click', () => openSheet('shop'));
    P.lastActKey = '';
  }

  const ACTIONS = [
    { id: 'food', label: 'Comer', icon: 'food', run: () => openSheet('food') },
    { id: 'play', label: 'Jugar', icon: 'play', run: () => { const r = C.act.canPlay(); if (!r.ok) return say(r.msg, true); openSheet('games'); } },
    { id: 'bath', label: 'Bañar', icon: 'bath', run: () => doAct(C.act.bath(), 'bath') },
    { id: 'clean', label: 'Limpiar', icon: 'clean', run: () => { const r = C.act.clean(); if (r.ok) { snd.play('good'); host().onClean && host().onClean(); } else say(r.msg, true); } },
    { id: 'sleep', label: 'Dormir', icon: 'sleep', run: () => { const was = C.state.pet.sleeping; const r = C.act.sleep(); if (r.ok) snd.play(was ? 'wake' : 'sleep'); say(r.msg, !r.ok); } },
    { id: 'med', label: 'Remedio', icon: 'med', run: () => openSheet('meds') },
    { id: 'shop', label: 'Tienda', icon: 'shop', run: () => openSheet('shop') },
    { id: 'more', label: 'Más', icon: 'more', run: () => openSheet('more') },
  ];
  const EGG_ACTIONS = [
    { id: 'warm', label: 'Dar calor', icon: 'warm', big: true, run: () => warmEgg() },
    { id: 'shop', label: 'Tienda', icon: 'shop', run: () => openSheet('shop') },
    { id: 'more', label: 'Más', icon: 'more', run: () => openSheet('more') },
  ];

  function warmEgg() {
    const r = C.act.warm();
    if (r.ok) { snd.play('warm'); fx(host().petBox(), 'warm'); if (r.msg) say(r.msg); }
  }

  function doAct(r, anim, item) {
    if (!r.ok) { if (r.msg) say(r.msg, true); return r; }
    if (anim === 'bath') { snd.play('bath'); fx(host().petBox(), 'bath'); host().view().setTemp('happy', 2500); }
    if (anim === 'eat') { snd.play('eat'); fx(host().petBox(), 'eat', { item }); host().view().setTemp('eat', 2200); }
    if (anim === 'heal') { snd.play('happy'); fx(host().petBox(), 'heal'); host().view().setTemp('happy', 2500); }
    if (r.msg) say(r.msg);
    return r;
  }

  function updatePanel() {
    const S = C.state, p = S.pet;
    if (!P.hud) return;
    setText(P.hud.querySelector('.ncoins'), S.coins);
    setText(P.hud.querySelector('.pname'), p ? p.name : 'Virtual Pet');
    const chip = P.hud.querySelector('.pstage');
    setText(chip, p ? (p.dead ? 'En el cielo' : p.stage === 'egg' ? 'Huevo' : C.stageName(p.stage) + ' · ' + C.ageText(p)) : '');
    chip.hidden = !p;
    const egg = p && p.stage === 'egg';
    P.meters.hidden = !p || egg || p.dead;
    P.level.hidden = !p || egg || p.dead;
    if (p && !egg && !p.dead) {
      const max = p.level >= C.R.maxLevel;
      setText(P.level.querySelector('.lvnum'), 'Nivel ' + p.level);
      setW(P.level.querySelector('.xp i'), max ? 100 : Math.min(100, Math.round((p.xp / C.xpNeed(p.level)) * 1000) / 10));
      setText(P.level.querySelector('.lvnext'), max ? '¡Máximo!' : Math.floor(p.xp) + ' / ' + C.xpNeed(p.level));
      P.level.classList.toggle('max', max);
    }
    P.eggbar.hidden = !egg;
    if (p && !egg) {
      METERS.forEach((m) => {
        const v = Math.round(p[m.k]);
        const el = P.meters.querySelector('.m-' + m.k);
        setW(el.querySelector('i'), v);
        el.classList.toggle('low', v < 25);
        const ti = `${m.label}: ${v}%`;
        if (el.title !== ti) el.title = ti;
      });
    }
    if (egg) {
      setW(P.eggbar.querySelector('.warmth i'), Math.round(p.egg.warmth));
      setW(P.eggbar.querySelector('.hatch i'), Math.min(100, Math.round(p.egg.progress)));
    }
    // botones
    const list = !p || p.dead ? [] : egg ? EGG_ACTIONS : ACTIONS;
    const key = list.map((a) => a.id).join(',');
    if (key !== P.lastActKey) {
      P.actions.innerHTML = '';
      list.forEach((a) => {
        const b = h(`<button type="button" class="act act-${a.id}${a.big ? ' big' : ''}"><span class="ai">${ic(a.icon)}</span><span class="al">${a.label}</span><span class="badge" hidden></span></button>`);
        b.addEventListener('click', () => { snd.unlock(); snd.play('tap'); a.run(); });
        P.actions.appendChild(b);
      });
      P.lastActKey = key;
      P.actions.classList.toggle('egg-actions', egg);
    }
    if (p && !egg && !p.dead) {
      const sl = P.actions.querySelector('.act-sleep');
      setText(sl.querySelector('.al'), p.sleeping ? 'Despertar' : 'Dormir');
      setHTML(sl.querySelector('.ai'), ic(p.sleeping ? 'wake' : 'sleep'));
      const cb = P.actions.querySelector('.act-clean .badge');
      cb.hidden = !p.poops.length; setText(cb, p.poops.length);
      const mb = P.actions.querySelector('.act-med .badge');
      mb.hidden = !p.sick; setText(mb, '!');
      const fb = P.actions.querySelector('.act-food .badge');
      fb.hidden = !(p.food < 25); setText(fb, '!');
      P.actions.querySelectorAll('.act').forEach((b) => {
        const id = b.className.match(/act-(\w+)/)[1];
        b.classList.toggle('dim', p.sleeping && ['food', 'play', 'bath'].includes(id));
      });
    }
  }

  /* ============ mensajes ============ */
  function say(text, warn, ms, action) {
    if (!text) return;
    host().bubble(text, ms || (warn ? 2600 : 2000), warn, action);
  }

  /* ============ pedidos de la mascota ============ */
  // Qué hacer con cada pedido (el botón del globito y el ícono sobre la cabeza)
  const NEED_ACTIONS = {
    food: { label: 'Dar de comer', icon: 'food', run: () => openSheet('food') },
    energy: { label: 'A dormir', icon: 'sleep', run: () => { const r = C.act.sleep(); if (r.ok) snd.play('sleep'); say(r.msg, !r.ok); } },
    fun: { label: 'Jugar', icon: 'play', run: () => { const r = C.act.canPlay(); if (!r.ok) return say(r.msg, true); openSheet('games'); } },
    hygiene: { label: 'Bañar', icon: 'bath', run: () => doAct(C.act.bath(), 'bath') },
    poop: { label: 'Limpiar', icon: 'clean', run: () => { const r = C.act.clean(); if (r.ok) { snd.play('good'); host().onClean && host().onClean(); } } },
    sick: { label: 'Dar remedio', icon: 'med', run: () => openSheet('meds') },
    health: { label: 'Dar vitaminas', icon: 'med', run: () => openSheet('meds') },
  };
  const askLevel = {};
  let lastAsk = 0, needEl = null, needShown = '';
  function ask(need, t) {
    lastAsk = t;
    const p = C.state.pet;
    const a = NEED_ACTIONS[need.id];
    const action = a ? { label: a.label, run: () => { snd.unlock(); snd.play('tap'); a.run(); } } : null;
    say(need.text, need.level === 2, 7000, action);
    snd.play(need.level === 2 ? 'alert' : 'voice', p.species);
    host().onAsk && host().onAsk(need, action);
    if (need.level === 2) notify(need);
  }
  // Ícono sobre la cabeza con lo que necesita (se puede tocar)
  function updateNeedIcon(nd) {
    const box = host().petBox();
    if (!box) return;
    if (!needEl || !box.contains(needEl)) {
      needEl = h(`<button type="button" class="needicon" hidden aria-label="Lo que necesita"></button>`);
      needEl.addEventListener('click', (e) => { e.stopPropagation(); const a = NEED_ACTIONS[needEl.dataset.need]; if (a) { snd.unlock(); snd.play('tap'); a.run(); } });
      box.appendChild(needEl);
      needShown = '';
    }
    const top = nd[0];
    placeNeedIcon(box);
    const key = top ? top.id + top.level : '';
    if (key === needShown) return;
    needShown = key;
    needEl.hidden = !top;
    if (!top) return;
    const a = NEED_ACTIONS[top.id];
    needEl.dataset.need = top.id;
    needEl.classList.toggle('urgent', top.level === 2);
    needEl.title = a ? a.label : '';
    needEl.innerHTML = ic(a ? a.icon : 'help');
  }
  // El ícono va al lado de la cabeza, del lado de la cara
  function placeNeedIcon(box) {
    const svg = box.querySelector('svg.pet');
    if (!svg || !svg.dataset.hx) return;
    const hx = +svg.dataset.hx, ht = +svg.dataset.ht, hr = +svg.dataset.hr, dir = +svg.dataset.dir;
    const x = hx + dir * hr * 1.45, y = ht + hr * 0.8;
    // el globito de diálogo sale justo arriba de la cabeza (sirve para cualquier especie y etapa)
    const bub = Math.round(Math.min(92, Math.max(30, (1 - ht / 200) * 100 + 3)));
    if (box._bub == null || Math.abs(box._bub - bub) > 3) { box._bub = bub; box.style.setProperty('--bub', bub + '%'); }
    needEl.style.left = ((x + 20) / 240 * 100).toFixed(1) + '%';
    needEl.style.top = (y / 200 * 100).toFixed(1) + '%';
  }
  /* ============ gestos de reposo (como Neko) ============ */
  let nextIdle = Date.now() + 8000;
  function idleActs(t) {
    const p = C.state.pet, v = H.view();
    if (!p || p.dead || p.stage === 'egg' || p.sleeping || p.sick || modalOpen || (sheetName && H.kind === 'room')) return;
    if (!H.isIdle || !H.isIdle() || v.busy) return;
    if (t < nextIdle) return;
    nextIdle = t + 9000 + Math.random() * 15000;
    const tired = p.energy < 45 || C.isNight(t);
    const sad = C.mood(p) === 'sad';
    const pool = tired ? ['yawn', 'yawn', 'stretch', 'look', 'special'] : sad ? ['look', 'yawn', 'scratch'] : ['stretch', 'scratch', 'look', 'butterfly', 'hop', 'yawn', 'butterfly', 'special', 'special', 'special'];
    doIdle(pool[Math.floor(Math.random() * pool.length)]);
  }
  function doIdle(a) {
    const v = H.view();
    if (a === 'yawn') { v.actT0 = performance.now(); v.setTemp('yawn', 1700); }
    else if (a === 'stretch') v.setAct('stretch', 1600);
    else if (a === 'scratch') v.setAct('scratch', 1500);
    else if (a === 'hop') { v.setAct('hop', 1000); v.setTemp('happy', 1100); }
    else if (a === 'look') {
      const d0 = v.dir;
      v.setAct('look', 2300);
      setTimeout(() => { v.dir = -d0; v.render(); }, 500);
      setTimeout(() => { v.dir = d0; v.render(); }, 1300);
      setTimeout(() => { v.dir = -d0; v.render(); }, 1800);
      setTimeout(() => { v.dir = d0; v.render(); }, 2200);
    } else if (a === 'butterfly') butterfly();
    else if (a === 'special') special();
  }
  // El truco de cada especie: el dragón tira fuego, el pájaro canta y aletea,
  // la tortuga esconde la cabeza y el lagarto saca la lengua.
  const SPECIAL = {
    dragon: { ms: 1800, mood: 'happy', sound: 'fire' },
    bird: { ms: 2000, mood: 'happy', sound: 'song' },
    turtle: { ms: 2400, mood: null, sound: 'hide' },
    lizard: { ms: 1600, mood: 'happy', sound: 'tongue' },
  };
  function special() {
    const p = C.state.pet, v = H.view();
    if (!p || p.dead || p.stage === 'egg' || p.sleeping) return;
    const sp = SPECIAL[p.species];
    v.setAct('special', sp.ms);
    if (sp.mood) v.setTemp(sp.mood, sp.ms);
    snd.play(sp.sound);
  }
  // Una mariposa pasa volando y la mascota la mira y la sigue con la vista
  function butterfly() {
    const box = H.petBox(), v = H.view();
    if (!box || !box.animate) return;
    const W = box.clientWidth, Hh = box.clientHeight;
    const el = h(`<div class="butterfly">${art.butterflySVG()}</div>`);
    box.appendChild(el);
    const pts = [[-0.35, 0.3], [0.15, -0.15], [0.85, 0.05], [0.55, -0.3], [0.05, 0.2], [0.75, -0.1], [1.3, -0.45]];
    const kf = pts.map(([x, y], i) => ({ transform: `translate(${(x * W).toFixed(0)}px, ${(y * Hh).toFixed(0)}px)`, opacity: i === 0 || i === pts.length - 1 ? 0 : 1 }));
    const anim = el.animate(kf, { duration: 6000, easing: 'ease-in-out' });
    v.setAct('look', 6000);
    v.setTemp('happy', 6000);
    const times = [0, 1000, 2000, 3000, 4000, 5000];
    times.forEach((ms, i) => setTimeout(() => {
      const [x0] = pts[i], [x1] = pts[i + 1];
      v.dir = x1 > x0 ? 1 : -1; v.render();
    }, ms));
    anim.onfinish = () => el.remove();
    setTimeout(() => el.remove(), 6500);
  }

  function checkNeeds(t) {
    const p = C.state.pet;
    if (!p || p.dead || p.stage === 'egg') { updateNeedIcon([]); Object.keys(askLevel).forEach((k) => delete askLevel[k]); return; }
    const nd = C.needs(p);
    updateNeedIcon(nd);
    // un pedido nuevo (o que se volvió urgente) se dice enseguida
    let fresh = null;
    nd.forEach((x) => { if (x.level > (askLevel[x.id] || 0) && (!fresh || x.level > fresh.level)) fresh = x; });
    Object.keys(askLevel).forEach((k) => { if (!nd.find((x) => x.id === k)) delete askLevel[k]; });
    nd.forEach((x) => { askLevel[x.id] = x.level; });
    if (modalOpen || sheetName) return;
    if (fresh && t - lastAsk > 4000) return ask(fresh, t);
    if (!nd.length) return;
    // y después lo recuerda cada tanto
    const every = (nd[0].level === 2 ? 25e3 : 50e3) * (H.kind === 'desktop' ? 1.4 : 1);
    if (t - lastAsk > every) ask(nd[0], t);
  }

  /* ============ hojas ============ */
  let sheetName = null;
  function openSheet(name, arg) {
    sheetName = name;
    const b = SHEETS[name];
    if (!b) return;
    const r = b(arg);
    host().sheet(r.title, r.node, { onClose: () => { sheetName = null; if (currentSheet === r) currentSheet = null; if (r.onClose) r.onClose(); }, wide: r.wide });
    currentSheet = r;
  }
  let currentSheet = null;
  function closeSheet() { sheetName = null; host().sheetClose(); }
  function refreshSheet() {
    if (!sheetName || !currentSheet || currentSheet.live === false) return;
    if (currentSheet.refresh) currentSheet.refresh();
  }

  function itemRow(id, mode) {
    const it = C.ITEMS[id], S = C.state, sp = S.pet ? S.pet.species : 'dragon';
    const name = id === 'fav' ? C.SPECIES[sp].fav : it.name;
    const qty = S.inv[id] || 0;
    const owned = it.kind === 'wear' && S.owned[id];
    let btn;
    if (mode === 'use') {
      btn = qty > 0
        ? `<button type="button" class="btn primary" data-use="${id}">${it.kind === 'food' ? 'Dar' : 'Usar'}</button>`
        : `<button type="button" class="btn" data-buy="${id}" ${S.coins < it.price ? 'disabled' : ''}>Comprar ${it.price}${coinIc()}</button>`;
    } else if (it.kind === 'wear') {
      btn = owned
        ? `<button type="button" class="btn ${S.wearing === id ? '' : 'primary'}" data-wear="${id}">${S.wearing === id ? 'Quitar' : 'Poner'}</button>`
        : `<button type="button" class="btn" data-buy="${id}" ${S.coins < it.price ? 'disabled' : ''}>${it.price}${coinIc()}</button>`;
    } else {
      btn = `<button type="button" class="btn" data-buy="${id}" ${S.coins < it.price ? 'disabled' : ''}>${it.price}${coinIc()}</button>`;
    }
    const q = it.kind !== 'wear' ? `<span class="qty">${qty ? 'Tenés ' + qty : 'No tenés'}</span>` : owned ? '<span class="qty">Es tuyo</span>' : '';
    return `<div class="item"><span class="item-art">${art.itemSVG(id, sp)}</span><span class="item-txt"><b>${esc(name)}</b><small>${esc(it.desc)}</small>${q}</span>${btn}</div>`;
  }

  /* Fondos del cuarto: tarjetas con miniatura. Sólo en el modo cuarto (celular / navegador). */
  function bgGrid() {
    const S = C.state;
    return '<div class="bg-grid">' + Object.keys(C.BACKGROUNDS).map((id) => {
      const b = C.BACKGROUNDS[id], mine = S.bgOwned[id], on = S.bg === id;
      const btn = on ? '<button type="button" class="btn" disabled>En uso</button>'
        : mine ? `<button type="button" class="btn primary" data-bg="${id}">Usar</button>`
        : `<button type="button" class="btn" data-buybg="${id}" ${S.coins < b.price ? 'disabled' : ''}>${b.price}${coinIc()}</button>`;
      return `<div class="bg-card ${on ? 'on' : ''} ${mine ? '' : 'locked'}"><span class="bg-thumb" aria-hidden="true">${N.themes.thumb(id)}${mine ? '' : `<span class="bg-lock">${ic('lock')}</span>`}</span><b>${esc(b.name)}</b><small>${b.price ? esc(b.desc) : 'Gratis'}</small>${btn}</div>`;
    }).join('') + '</div>';
  }
  function bindBg(node, after) {
    node.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.buybg) {
        snd.unlock();
        const r = C.act.buyBg(b.dataset.buybg);
        if (r.ok) { snd.play('coin'); say('¡Qué lindo lugar!'); } else { snd.play('bad'); say(r.msg, true); }
      } else if (b.dataset.bg) {
        snd.unlock(); C.act.setBg(b.dataset.bg); snd.play('tap');
      } else return;
      after && after();
    });
  }

  function bindItems(node, after) {
    node.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      snd.unlock();
      if (b.dataset.buy) {
        const r = C.act.buy(b.dataset.buy);
        if (r.ok) snd.play('coin'); else { snd.play('bad'); say(r.msg, true); }
      } else if (b.dataset.use) {
        const id = b.dataset.use, it = C.ITEMS[id];
        if (it.kind === 'food') { const r = doAct(C.act.feed(id), 'eat', id); if (r.ok) { closeSheet(); return; } }
        else { const r = doAct(C.act.medicate(id), 'heal'); if (r.ok) { closeSheet(); return; } }
      } else if (b.dataset.wear) {
        C.act.wear(b.dataset.wear); snd.play('tap');
      } else return;
      after && after();
    });
  }

  const SHEETS = {
    food() {
      const node = h('<div class="list"></div>');
      const render = () => { setHTML(node, ['fruit', 'fav', 'cake'].map((id) => itemRow(id, 'use')).join('')); };
      render(); bindItems(node, render);
      return { title: '¿Qué le das de comer?', node, refresh: render };
    },
    meds() {
      const node = h('<div class="list"></div>');
      const render = () => {
        const p = C.state.pet;
        setHTML(node, (p && p.sick ? '<p class="note warn">Está enfermo: dale el remedio.</p>' : '<p class="note">El remedio sólo sirve si está enfermo. Las vitaminas recuperan salud.</p>') +
          ['medicine', 'vitamins'].map((id) => itemRow(id, 'use')).join(''));
      };
      render(); bindItems(node, render);
      return { title: 'Botiquín', node, refresh: render };
    },
    shop() {
      const node = h('<div class="list"></div>');
      const render = () => {
        setHTML(node, `<p class="note">Tenés <b>${C.state.coins}</b>${coinIc()} — ganás más jugando y entrando todos los días.</p>` +
          '<h4>Comida</h4>' + ['fruit', 'fav', 'cake'].map((id) => itemRow(id, 'shop')).join('') +
          '<h4>Salud</h4>' + ['medicine', 'vitamins'].map((id) => itemRow(id, 'shop')).join('') +
          '<h4>Accesorios</h4>' + ['bow', 'scarf', 'hat', 'glasses', 'crown'].map((id) => itemRow(id, 'shop')).join('') +
          (host().kind === 'room' ? `<h4>${ic('image')} Fondos</h4>` + bgGrid() : ''));
      };
      render(); bindItems(node, render); bindBg(node, render);
      return { title: 'Tienda', node, refresh: render };
    },
    games() {
      const node = h(`<div class="games">
        <button type="button" class="game-card" data-g="catch"><span class="gc-art">${art.itemSVG('fruit')}</span><b>Atrapá la comida</b><small>Mové la canasta y atrapá todo lo rico. ¡Cuidado con las piedras!</small></button>
        <button type="button" class="game-card" data-g="guess"><span class="gc-art">${ic('back')}${ic('back', 'flipx')}</span><b>¿Para dónde mira?</b><small>Adiviná hacia qué lado va a mirar. 5 rondas.</small></button>
        <button type="button" class="game-card" data-g="memory"><span class="gc-art">${art.itemSVG('cake')}</span><b>Memoria</b><small>Dá vuelta las cartas y encontrá los pares de comida.</small></button>
        <button type="button" class="game-card" data-g="bubbles"><span class="gc-art">${ic('bath')}</span><b>Burbujas</b><small>Reventá todas las burbujas que puedas. Las doradas valen más.</small></button>
      </div>`);
      node.addEventListener('click', (e) => {
        const b = e.target.closest('[data-g]'); if (!b) return;
        snd.play('tap');
        startGame(b.dataset.g);
      });
      return { title: 'Jugar', node, live: false };
    },
    more() {
      const node = h('<div class="more"></div>');
      const desk = host().kind === 'desktop';
      const render = () => {
        const S = C.state, st = S.settings, p = S.pet;
        const owned = Object.keys(S.owned);
        const achList = C.ACHIEVEMENTS.filter((a) => S.achievements[a.id] || !(desk && a.roomOnly));
        const nAch = achList.filter((a) => S.achievements[a.id]).length, totAch = achList.length;
        setHTML(node, `
          <section class="row more-top"><button type="button" class="btn" data-open="achievements">${ic('star')} Logros <span class="cnt">${nAch}/${totAch}</span></button><button type="button" class="btn" data-open="album">${ic('book')} Álbum <span class="cnt">${S.album.length}</span></button></section>
          ${p && !p.dead ? `<section><h4>${ic('pencil')} Nombre</h4><form class="rename"><input id="rename" maxlength="16" value="${esc(p.name)}" aria-label="Nombre de la mascota"><button class="btn" type="submit">Cambiar</button></form></section>` : ''}
          ${desk ? '' : `<section class="bg-sec"><h4>${ic('image')} Fondo del cuarto</h4>${bgGrid()}</section>`}
          <section><h4>${ic('shirt')} Accesorios</h4>${owned.length ? '<div class="list">' + owned.map((id) => itemRow(id, 'shop')).join('') + '</div>' : '<p class="note">Todavía no compraste accesorios. Están en la tienda.</p>'}</section>
          <section><h4>${ic('gear')} Ajustes</h4>
            ${toggle('sound', 'Sonido', st.sound)}
            ${toggle('notify', desk ? 'Avisos de Windows cuando necesita algo' : 'Avisos cuando necesita algo', st.notify)}
            ${desk ? toggle('follow', 'Que me siga el puntero del mouse', st.follow) : ''}
            ${desk ? toggle('onTop', 'Siempre visible (arriba de las ventanas)', st.onTop !== false) : ''}
            ${desk ? toggle('wander', 'Que pasee sola por todo el escritorio', st.wander) : ''}
            ${desk ? toggle('autostart', 'Abrir Virtual Pet al iniciar Windows', !!st.autostart) : ''}
          </section>
          <section><h4>${ic('book')} Recuerdos</h4>${S.memorial.length ? '<ul class="memo">' + S.memorial.map((m) => `<li><b>${esc(m.name)}</b> · ${C.SPECIES[m.species].name} · vivió ${ageOf(m.age)} <small>${new Date(m.diedAt).toLocaleDateString()}</small></li>`).join('') + '</ul>' : '<p class="note">Acá van a quedar las mascotas que ya no están.</p>'}</section>
          <section><h4>${ic('help')} Cómo se juega</h4><div class="help">${HELP}</div></section>
          <section class="backup"><h4>${ic('gift')} Copia de seguridad</h4>
            <p class="note">Guardá tu partida en un archivo para no perderla o pasarla a otra computadora.</p>
            <div class="row"><button type="button" class="btn" data-export>Guardar copia</button><button type="button" class="btn" data-import>Recuperar copia</button></div>
            <input type="file" id="import-file" accept=".json,application/json" hidden>
            <div class="confirm-import" hidden><p class="note warn">Se va a reemplazar la partida actual por la del archivo.</p><div class="row"><button type="button" class="btn danger-fill" data-import-yes>Recuperar</button><button type="button" class="btn" data-import-no>Cancelar</button></div></div>
          </section>
          <section class="about"><h4>${ic('heart')} Acerca de</h4>
            <p class="about-txt"><b>${N.APP.name}</b> · versión ${N.APP.version}<br>Creado por <b>${N.APP.author}</b></p>
          </section>
          <section class="reset"><h4>${ic('reset')} Empezar de nuevo</h4>
            <p class="note">Borra la mascota, el nivel, las monedas, lo comprado y los recuerdos, y te deja elegir otro huevo. Los ajustes se mantienen.</p>
            <button type="button" class="btn ghost danger" data-reset>Restablecer todo de cero</button>
            <div class="confirm" hidden><p class="note warn">¿Seguro? Esto no se puede deshacer.</p><div class="row"><button type="button" class="btn danger-fill" data-reset-yes>Sí, borrar todo</button><button type="button" class="btn" data-reset-no>Cancelar</button></div></div>
          </section>
          ${desk ? `<section class="row"><button type="button" class="btn ghost" data-quit>${ic('power')} Cerrar Virtual Pet</button><button type="button" class="btn ghost" data-uninstall>Desinstalar</button></section>` : ''}`);
      };
      render();
      node.addEventListener('submit', (e) => { e.preventDefault(); const r = C.act.rename(node.querySelector('#rename').value); say(r.ok ? '¡Me gusta mi nombre!' : r.msg, !r.ok); });
      node.addEventListener('change', (e) => {
        const t = e.target;
        if (t.id === 'import-file' && t.files && t.files[0]) {
          const fr = new FileReader();
          fr.onload = () => { pendingImport = String(fr.result || ''); node.querySelector('.confirm-import').hidden = false; };
          fr.readAsText(t.files[0]);
          t.value = '';
          return;
        }
        if (!t.dataset.set) return;
        const k = t.dataset.set;
        C.act.setting(k, t.checked);
        if (k === 'notify' && t.checked) askNotify();
        host().onSetting && host().onSetting(k, t.checked);
      });
      node.addEventListener('click', (e) => {
        if (e.target.closest('[data-quit]')) host().quit && host().quit();
        if (e.target.closest('[data-uninstall]')) host().uninstall && host().uninstall();
        const box = node.querySelector('.reset');
        if (e.target.closest('[data-reset]')) { box.querySelector('[data-reset]').hidden = true; box.querySelector('.confirm').hidden = false; }
        if (e.target.closest('[data-reset-no]')) { box.querySelector('[data-reset]').hidden = false; box.querySelector('.confirm').hidden = true; }
        if (e.target.closest('[data-reset-yes]')) { snd.play('tap'); closeSheet(); C.act.resetAll(); }
        const op = e.target.closest('[data-open]'); if (op) { snd.play('tap'); openSheet(op.dataset.open); return; }
        if (e.target.closest('[data-export]')) exportSave();
        if (e.target.closest('[data-import]')) node.querySelector('#import-file').click();
        if (e.target.closest('[data-import-no]')) { node.querySelector('.confirm-import').hidden = true; pendingImport = null; }
        if (e.target.closest('[data-import-yes]')) {
          const r = pendingImport ? C.importState(pendingImport) : { ok: false, msg: '' };
          pendingImport = null;
          closeSheet();
          say(r.msg || 'No se pudo leer el archivo.', !r.ok, 3000);
          if (r.ok) snd.play('happy');
        }
      });
      bindItems(node, render); bindBg(node, render);
      return { title: 'Más', node, refresh: () => { if (!node.contains(document.activeElement)) render(); } };
    },
  };
  let pendingImport = null;
  function exportSave() {
    const txt = C.exportState();
    const p = C.state.pet;
    const name = 'virtual-pet-' + (p ? p.name.replace(/[^\w\u00C0-\u017F-]+/g, '_') + '-' : '') + C.dayKey(Date.now()) + '.json';
    const doneMsg = (ok) => say(ok ? 'Copia guardada' : 'No se guardó la copia', !ok, 2500);
    if (host().saveFile) return host().saveFile(name, txt).then(doneMsg).catch(() => doneMsg(false));
    if (N.cloudDownloads) return N.cloudDownloads.save({ filename: name, data: txt }).then(() => doneMsg(true)).catch(() => doneMsg(false));
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' }));
      a.download = name; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      doneMsg(true);
    } catch (e) { doneMsg(false); }
  }
  SHEETS.achievements = function () {
    const node = h('<div class="ach-list"></div>');
    const render = () => {
      const got = C.state.achievements;
      const list = C.ACHIEVEMENTS.filter((a) => got[a.id] || !(a.roomOnly && host().kind === 'desktop'));
      setHTML(node, `<p class="note">${list.filter((a) => got[a.id]).length} de ${list.length} logros. Cada logro da monedas.</p>` +
        list.map((a) => `<div class="ach ${got[a.id] ? 'on' : ''}"><span class="ach-ic">${ic(got[a.id] ? 'star' : 'help')}</span><span class="ach-txt"><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span><span class="ach-prize">${got[a.id] ? new Date(got[a.id]).toLocaleDateString() : '+' + a.coins + coinIc()}</span></div>`).join(''));
    };
    render();
    return { title: 'Logros', node, refresh: render };
  };
  SHEETS.album = function () {
    const node = h('<div class="album"></div>');
    const render = () => {
      const S = C.state, p = S.pet;
      const canShoot = p && !p.dead && p.stage !== 'egg';
      setHTML(node, (canShoot ? `<button type="button" class="btn primary" data-photo>${ic('star')} Sacar una foto</button>` : '') +
        (S.album.length ? '<div class="album-grid">' + S.album.map((ph) => `<figure class="photo"><div class="ph-pet">${art.petSVG({ species: ph.species, stage: ph.stage, variant: ph.variant, mood: 'happy', accessory: ph.accessory })}</div><figcaption><span><b>${esc(ph.name)}</b> · ${C.stageName(ph.stage)}${ph.level != null ? ' · Nv ' + ph.level : ''}</span><small>${new Date(ph.t).toLocaleDateString()}</small></figcaption></figure>`).join('') + '</div>'
          : '<p class="note">Cuando tu mascota nace y cuando crece, se guarda una foto acá. También podés sacar fotos cuando quieras.</p>'));
    };
    render();
    node.addEventListener('click', (e) => { if (e.target.closest('[data-photo]')) { const r = C.act.photo(); if (r.ok) { snd.play('coin'); render(); } } });
    return { title: 'Álbum', node, refresh: render };
  };
  function toggle(k, label, on) {
    return `<label class="toggle"><span>${label}</span><input type="checkbox" data-set="${k}" id="set-${k}" ${on ? 'checked' : ''}><i></i></label>`;
  }
  function ageOf(ms) { return C.ageText({ age: ms || 0 }); }
  const HELP = `<p>Tu mascota tiene cinco necesidades que bajan con el tiempo, aunque cierres el juego: <b>comida, energía, diversión, higiene y salud</b>.</p>
    <p>Si la descuidás se enferma. Si se enferma y no le das el remedio, o pasa mucho tiempo sin comer, la salud baja. <b>Si la salud llega a cero, se muere</b> y tenés que esperar <b>24 horas</b> para empezar con un huevo nuevo.</p>
    <p>Tiene <b>niveles del 0 al 100</b>. Sube de nivel cuando la cuidás y lo necesitaba (darle de comer cuando tiene hambre, bañarla cuando está sucia, jugar cuando se aburre, limpiar, dejarla dormir cuando está cansada) y con el tiempo, si está bien atendida. Cada nivel da monedas, y cada 10 niveles hay un premio grande.</p>
    <p>Crece de <b>bebé</b> a <b>joven</b> en el nivel 5 y a <b>adulto</b> en el nivel 20. Si la cuidaste muy bien, de adulta tiene una <b>forma brillante</b>.</p>
    <p>Cuando necesita algo, te lo pide con un globito y un ícono sobre la cabeza. Tocalos y lo atendés al instante.</p>
    <p>Cada especie tiene su personalidad: el <b>dragón</b> es comilón, el <b>pájaro</b> se aburre rápido, el <b>lagarto</b> es dormilón y la <b>tortuga</b> es paciente y casi no se enferma.</p>
    <p>Sigue el horario real: <b>de noche</b> se cansa más rápido y te pide dormir. Si nadie la atiende, se duerme sola, y a la mañana se despierta. Durmiendo gasta mucho menos. Limpiá la caca seguido, que la enferma.</p>
    <p>Si necesita algo urgente, te viene a buscar. Cuando está tranquila bosteza, se estira, se rasca y persigue mariposas.</p>
    <p>En <b>Más</b> están los <b>logros</b>, el <b>álbum</b> de fotos y la <b>copia de seguridad</b> de la partida.</p>
    <p>Entrá todos los días para cobrar el <b>premio diario</b>: cuantos más días seguidos, más monedas.</p>`;

  /* ============ minijuegos ============ */
  function startGame(id) {
    const r = C.act.canPlay();
    if (!r.ok) { say(r.msg, true); closeSheet(); return; }
    const node = h('<div class="game-host"></div>');
    let game = null;
    const finish = (score, max) => {
      const res = C.act.gameResult(score, max);
      if (!res.ok) { closeSheet(); return; }
      const ok = score / max >= 0.5;
      snd.play(ok ? 'happy' : 'sad');
      node.innerHTML = `<div class="game-over"><div class="go-pet"></div><h3>${ok ? '¡Muy bien!' : '¡Buen intento!'}</h3><p>Puntaje: <b>${score}</b> de ${max}</p><p class="won">+${res.coins} ${coinIc()} · más diversión</p>
        <div class="row"><button type="button" class="btn primary" data-again>Jugar otra vez</button><button type="button" class="btn" data-close>Listo</button></div></div>`;
      const v = new PetView(node.querySelector('.go-pet')); v.setTemp(ok ? 'happy' : 'sad', 9e9); v.render(true);
      node.querySelector('[data-again]').onclick = () => startGame(id);
      node.querySelector('[data-close]').onclick = () => closeSheet();
    };
    sheetName = 'game';
    currentSheet = { live: false };
    host().sheet({ catch: 'Atrapá la comida', guess: '¿Para dónde mira?', memory: 'Memoria', bubbles: 'Burbujas' }[id], node, { onClose: () => { sheetName = null; game && game.stop(); }, wide: true });
    game = N.games[id](node, finish);
  }

  /* ============ ventanas (modales) ============ */
  const queue = [];
  let modalOpen = null;
  function pushModal(build) { queue.push(build); pump(); }
  function pump() {
    if (modalOpen || !queue.length) return;
    const build = queue.shift();
    const m = build();
    if (!m) return pump();
    modalOpen = m;
    host().modal(m.node, { persistent: m.persistent });
    m.node.addEventListener('click', (e) => {
      if (e.target.closest('[data-ok]')) { snd.unlock(); if (m.onOk && m.onOk() === false) return; closeModal(); }
    });
  }
  function closeModal() { modalOpen = null; host().modalClose(); setTimeout(() => { pump(); flow(); }, 50); }

  function adoptModal() {
    let pick = null;
    const node = h(`<div class="modal adopt">
      <h2>Elegí tu huevo</h2>
      <p class="sub">Va a nacer, crecer y depender de vos. ¡Cuidalo bien!</p>
      <div class="eggs">${Object.keys(C.SPECIES).map((k) => `<button type="button" class="egg-pick" data-sp="${k}"><span class="ep-art">${art.eggSVG({ species: k, progress: 0, warmth: 30 })}</span><b>${C.SPECIES[k].name}</b><small>${C.SPECIES[k].hint}</small></button>`).join('')}</div>
      <label class="field"><span>¿Cómo se va a llamar?</span><input id="adopt-name" maxlength="16" placeholder="Escribí un nombre" autocomplete="off"></label>
      <p class="err" hidden></p>
      <button type="button" class="btn primary big" data-ok disabled>Empezar</button></div>`);
    node.addEventListener('click', (e) => {
      const b = e.target.closest('.egg-pick'); if (!b) return;
      snd.unlock(); snd.play('tap');
      pick = b.dataset.sp;
      node.querySelectorAll('.egg-pick').forEach((x) => x.classList.toggle('on', x === b));
      node.querySelector('[data-ok]').disabled = false;
      const inp = node.querySelector('#adopt-name');
      if (!inp.value) inp.placeholder = { dragon: 'Ej.: Chispa', bird: 'Ej.: Pío', lizard: 'Ej.: Lagartijo', turtle: 'Ej.: Manuelita' }[pick];
    });
    return {
      node, persistent: true, kind: 'adopt',
      onOk: () => {
        const inp = node.querySelector('#adopt-name');
        const name = inp.value.trim() || inp.placeholder.replace('Ej.: ', '');
        const r = C.act.adopt(pick, name);
        if (!r.ok) { const e = node.querySelector('.err'); e.hidden = false; e.textContent = r.msg; return false; }
        snd.play('happy');
        return true;
      },
    };
  }

  function dailyModal(r) {
    const dots = Array.from({ length: 7 }, (_, i) => `<span class="dot ${i < ((r.streak - 1) % 7) + 1 ? 'on' : ''}">${i + 1}</span>`).join('');
    const bonus = r.bonus && r.bonus.medicine ? '<p class="bonus">¡Semana completa! Además: 1 remedio y 2 de su comida favorita.</p>' : '';
    const node = h(`<div class="modal daily"><span class="big-ic">${ic('gift')}</span><h2>Premio diario</h2>
      <p class="prize">+${r.coins} ${coinIc()}</p>${bonus}
      <div class="streak">${dots}</div>
      <p class="sub">${r.streak === 1 ? 'Primer día de tu racha.' : `¡${r.streak} días seguidos!`} Mañana ganás ${r.nextCoins}${coinIc()} si volvés.</p>
      <button type="button" class="btn primary big" data-ok>¡Gracias!</button></div>`);
    snd.play('coin');
    return { node };
  }

  function deathModal() {
    const p = C.state.pet;
    if (!p || !p.dead) return null;
    const cause = { hambre: 'Pasó demasiado tiempo sin comer.', enfermedad: 'Estaba enfermo y no recibió su remedio.', descuido: 'Necesitaba más cuidados.' }[p.cause] || '';
    const node = h(`<div class="modal death"><div class="grave">${art.graveSVG(p.species)}</div>
      <h2>${esc(p.name)} se fue al cielo de las mascotas</h2>
      <p class="sub">Vivió ${C.ageText(p)}. ${cause}</p>
      <p class="sub">Vas a poder empezar con un huevo nuevo en <b>24 horas</b>. Mientras tanto podés seguir entrando para cobrar tu premio diario.</p>
      <button type="button" class="btn primary big" data-ok>Despedirme</button></div>`);
    return { node, persistent: true, onOk: () => { C.act.farewell(); return true; } };
  }

  let lockTimer = null;
  function lockedModal() {
    const S = C.state;
    const last = S.memorial[0];
    const node = h(`<div class="modal locked"><div class="grave">${art.graveSVG(last ? last.species : 'dragon')}</div>
      <h2>${last ? 'Extrañamos a ' + esc(last.name) : 'Hay que esperar'}</h2>
      <p class="sub">Un huevo nuevo va a llegar en</p>
      <p class="countdown">--:--:--</p>
      <p class="sub">Cuidá mejor a la próxima mascota: comida, baño, juegos y remedio si se enferma.</p>
      <button type="button" class="btn primary big" data-ok disabled>Elegir huevo nuevo</button></div>`);
    const upd = () => {
      const left = S.lockUntil - Date.now();
      const cd = node.querySelector('.countdown');
      if (left <= 0) { cd.textContent = '¡Ya está!'; node.querySelector('[data-ok]').disabled = false; clearInterval(lockTimer); return; }
      const s = Math.floor(left / 1000);
      cd.textContent = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((x) => String(x).padStart(2, '0')).join(':');
    };
    clearInterval(lockTimer); lockTimer = setInterval(upd, 1000); upd();
    return { node, persistent: true, kind: 'locked', onOk: () => { if (C.isLocked()) return false; clearInterval(lockTimer); return true; } };
  }

  function eventModal(e) {
    const p = C.state.pet;
    if (!p) return null;
    let title, sub;
    if (e.type === 'hatch') { title = `¡Nació ${esc(p.name)}!`; sub = 'Ahora depende de vos. Dale de comer, jugá con él y no te olvides de limpiar.'; }
    else if (e.type === 'grow' && e.stage === 'young') { title = `¡${esc(p.name)} creció!`; sub = 'Ya es joven. Sigue necesitando tus cuidados.'; }
    else if (e.type === 'grow') { title = `¡${esc(p.name)} es adulto!`; sub = e.variant === 'shiny' ? '¡Lo cuidaste tan bien que tiene una forma brillante!' : 'Ya es grande. ¡Felicitaciones por cuidarlo!'; }
    else return null;
    const node = h(`<div class="modal celebrate"><div class="cel-pet"></div><h2>${title}</h2><p class="sub">${sub}</p>${e.coins ? `<p class="prize small">+${e.coins} ${coinIc()}</p>` : ''}<button type="button" class="btn primary big" data-ok>¡Genial!</button></div>`);
    const v = new PetView(node.querySelector('.cel-pet')); v.setTemp('happy', 9e9); v.render(true);
    snd.play(e.type === 'hatch' ? 'hatch' : 'grow');
    return { node };
  }

  function levelModal(e) {
    const p = C.state.pet;
    if (!p) return null;
    const max = e.level >= C.R.maxLevel;
    const node = h(`<div class="modal celebrate"><div class="cel-pet"></div><span class="lvbadge">${e.level}</span><h2>${max ? '¡' + esc(p.name) + ' llegó al nivel máximo!' : '¡' + esc(p.name) + ' llegó al nivel ' + e.level + '!'}</h2>
      <p class="sub">${max ? 'Nivel 100: sos un cuidador de leyenda.' : 'Seguí cuidándolo para llegar al nivel 100.'}</p><p class="prize small">+${e.coins} ${coinIc()}</p><button type="button" class="btn primary big" data-ok>¡Genial!</button></div>`);
    const v = new PetView(node.querySelector('.cel-pet')); v.setTemp('happy', 9e9); v.render(true);
    snd.play('grow');
    return { node };
  }

  function offlineModal(events, gap) {
    const p = C.state.pet;
    if (!p || p.dead || p.stage === 'egg') return null;
    const n = (t) => events.filter((e) => e.type === t).length;
    const lines = [];
    if (n('poop')) lines.push(`Hizo caca ${n('poop') > 1 ? n('poop') + ' veces' : 'una vez'}.`);
    if (n('sick')) lines.push('Se enfermó.');
    if (n('collapse')) lines.push('Se quedó dormido de cansancio.');
    if (n('levelup')) lines.push(`Subió al nivel ${p.level}.`);
    const nd = C.needs(p);
    if (!lines.length && !nd.length) return null;
    const hrs = gap / C.HOUR;
    const node = h(`<div class="modal offline"><div class="cel-pet"></div><h2>Mientras no estabas…</h2><p class="sub">Pasaron ${hrs < 1 ? Math.round(gap / C.MIN) + ' minutos' : hrs < 48 ? Math.round(hrs) + ' horas' : Math.round(hrs / 24) + ' días'}.</p>
      <ul class="news">${lines.map((l) => `<li>${l}</li>`).join('')}${nd.map((x) => `<li class="need">${esc(x.text)}</li>`).join('')}</ul>
      <button type="button" class="btn primary big" data-ok>Voy a cuidarlo</button></div>`);
    const v = new PetView(node.querySelector('.cel-pet')); v.render(true);
    return { node };
  }

  /* ============ flujo ============ */
  let flowShown = null;
  function flow() {
    if (modalOpen || queue.length) return;
    const S = C.state;
    if (S.pet && S.pet.dead) { pushModal(deathModal); return; }
    if (!S.pet) { pushModal(C.isLocked() ? lockedModal : adoptModal); return; }
    flowShown = null;
  }

  function checkDaily() {
    if (C.dailyPending()) {
      const r = C.claimDaily();
      if (r) { queue.unshift(() => dailyModal(r)); if (!modalOpen) pump(); }
    }
  }

  /* ============ avisos ============ */
  const lastNotify = {};
  function askNotify() {
    if (host().kind === 'desktop') return;
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {}
  }
  function notify(need) {
    const S = C.state;
    if (!S.settings.notify || !S.pet) return;
    const t = Date.now();
    if (lastNotify[need.id] && t - lastNotify[need.id] < 30 * C.MIN) return;
    lastNotify[need.id] = t;
    const title = S.pet.name;
    if (host().notify) return host().notify(title, need.text);
    if (!document.hidden) return;
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, { body: need.text, icon: 'icons/icon-192.png', tag: 'vpet-' + need.id }));
      } else new Notification(title, { body: need.text, icon: 'icons/icon-192.png' });
    } catch (e) {}
  }

  /* ============ ciclo principal ============ */
  let H = null;
  const host = () => H;
  let lastSave = 0, lastDayCheck = 0, loops = 0;

  function onEvent(e) {
    const p = C.state.pet;
    if (e.type === 'hatch' || e.type === 'grow') { H.view().render(true); pushModal(() => eventModal(e)); }
    else if (e.type === 'sick') { snd.play('alert'); say('No me siento bien…', true); }
    else if (e.type === 'poop') { snd.play('tap'); }
    else if (e.type === 'collapse') { say('Se quedó dormido de cansancio', true); }
    else if (e.type === 'wake') { snd.play('wake'); say(e.morning ? '¡Buen día! Ya es de mañana' : '¡Buen día!'); }
    else if (e.type === 'death') { snd.play('death'); C.save(); flow(); }
    else if (e.type === 'achievement') {
      snd.play('coin');
      fx(H.petBox(), 'coins', { n: e.coins });
      setTimeout(() => say('Nuevo logro: ' + e.name + ' (+' + e.coins + ' monedas)', false, 3500), 400);
    }
    else if (e.type === 'nightSleep') { snd.play('sleep'); say('Ya es de noche… se quedó dormido', false, 3000); }
    else if (e.type === 'levelup') {
      fx(H.petBox(), 'coins', { n: e.coins });
      setTimeout(special, 300);
      if (e.level % 10 === 0 || e.level === C.R.maxLevel) pushModal(() => levelModal(e));
      else { snd.play('happy'); say('¡Subí al nivel ' + e.level + '!', false, 3000); }
    }
    if (p && e.type !== 'death') H.onPetEvent && H.onPetEvent(e);
  }

  function loop() {
    if (C.tick() === null) { onResume(); return; }
    const t = Date.now();
    updatePanel();
    H.update && H.update();
    checkNeeds(t);
    idleActs(t);
    if (t - lastSave > 15e3) { lastSave = t; C.save(); }
    if (t - lastDayCheck > 60e3) { lastDayCheck = t; checkDaily(); }
    if (sheetName && sheetName !== 'game' && ++loops % 5 === 0) refreshSheet();
    flow();
  }

  function onResume() {
    const r = C.resume();
    r.events.forEach((e) => { if (e.type === 'hatch' || e.type === 'grow') pushModal(() => eventModal(e)); });
    const lv = r.events.filter((e) => e.type === 'levelup' && (e.level % 10 === 0 || e.level === C.R.maxLevel)).pop();
    if (lv) pushModal(() => levelModal(lv));
    if (r.gap > 20 * C.MIN && r.events.length >= 0) {
      const ev = r.events;
      pushModal(() => offlineModal(ev, r.gap));
    }
    checkDaily();
    flow();
    updatePanel();
    H.view().render(true);
  }

  function start(hostImpl) {
    H = hostImpl;
    C.load();
    N.on('event', onEvent);
    N.on('change', () => { updatePanel(); refreshSheet(); H.update && H.update(); });
    N.on('reset', () => {
      Object.keys(askLevel).forEach((k) => delete askLevel[k]);
      // si se cargó otra partida (copia de seguridad, nube) con mascota, ya no hace falta elegir huevo ni esperar
      if (modalOpen && (modalOpen.kind === 'adopt' || modalOpen.kind === 'locked') && C.state.pet) { clearInterval(lockTimer); closeModal(); }
      H.onReset && H.onReset(); H.view().render(true); flow();
    });
    H.init();
    buildPanel(H.panelRoot());
    onResume();
    setInterval(loop, 1000);
    document.addEventListener('visibilitychange', () => { if (document.hidden) C.save(); else onResume(); });
    window.addEventListener('pagehide', () => C.save());
    window.addEventListener('beforeunload', () => C.save());
    // Modo de prueba: Ctrl+Shift+D acelera el tiempo x120
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        C.timeScale = C.timeScale === 1 ? 120 : 1;
        say(C.timeScale === 1 ? 'Tiempo normal' : 'Modo prueba: tiempo x120');
        document.body.classList.toggle('fast', C.timeScale !== 1);
      }
    });
  }

  N.ui = { start, doIdle: (a) => doIdle(a), PetView, fx, say, openSheet, closeSheet, h, esc, ic, coinIc, warmEgg, doAct, pushModal, flow, get modalOpen() { return modalOpen; }, get sheetOpen() { return sheetName; } };
})();
