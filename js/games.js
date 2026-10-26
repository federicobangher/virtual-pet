/* Virtual Pet — minijuegos. Cada juego recibe un contenedor y una función finish(score, max). */
(function () {
  'use strict';
  const N = window.N;
  const art = N.art, snd = N.sound;

  /* 2.0.2: cada juego ocupa todo el lugar libre (celular parado o acostado, tablet, la tarjeta de Windows).
     .g-stage es el área de juego: se mide al empezar y otra vez si se gira la pantalla o cambia el tamaño. */
  const cleanups = (root) => (root._cleanup = root._cleanup || []);
  function onStage(root, fn) {
    const st = root.querySelector('.g-stage');
    let w = -1, h = -1;
    const measure = () => {
      if (!st.isConnected) return;
      const nw = Math.floor(st.clientWidth), nh = Math.floor(st.clientHeight);
      if (nw === w && nh === h) return;
      w = nw; h = nh;
      if (w < 40 || h < 40) return;
      st.classList.toggle('land', w > h * 1.2);
      fn(w, h);
    };
    let ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(() => measure()); ro.observe(st); } else window.addEventListener('resize', measure);
    measure();
    cleanups(root).push(() => { if (ro) ro.disconnect(); else window.removeEventListener('resize', measure); });
  }
  /* Lienzo: el campo mide como mínimo 360×420 "puntos" (los de siempre) y se estira hacia donde sobra lugar
     (más alto en un celular parado, más ancho acostado o en una tablet). Se dibuja a la resolución real de la
     pantalla (nítido) pero sin pasarse de ~1,3 millones de píxeles (para no gastar batería de más). */
  function fitCanvas(cv, root, o) {
    o = o || {};
    const st = root.querySelector('.g-stage');
    let aw = st.clientWidth - 4, ah = st.clientHeight - 4;
    if (!(aw > 80 && ah > 80)) { aw = 360; ah = 420; }
    const s = Math.min(aw / 360, ah / 420);
    const W = Math.round(Math.max(360, Math.min(o.maxW || 640, aw / s))), H = Math.round(Math.max(420, Math.min(o.maxH || 760, ah / s)));
    let k = Math.min(2, Math.max(1, (window.devicePixelRatio || 1) * s));
    if (W * H * k * k > 1.3e6) k = Math.max(1, Math.sqrt(1.3e6 / (W * H)));
    const setRes = (kk) => { cv.width = Math.round(W * kk); cv.height = Math.round(H * kk); cv.getContext('2d').setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0); };
    setRes(k);
    onStage(root, (w, h) => { const z = Math.min((w - 4) / W, (h - 4) / H); cv.style.width = Math.floor(W * z) + 'px'; cv.style.height = Math.floor(H * z) + 'px'; });
    // Celular lento: si en los primeros segundos no llega a ~45 cuadros por segundo, se dibuja con menos resolución
    if (k > 1.2) {
      let n = 0, t0 = 0, alive = true, raf = 0;
      const probe = (t) => {
        if (!alive || !cv.isConnected) return;
        if (!t0) t0 = t;
        if (++n < 90) { raf = requestAnimationFrame(probe); return; }
        if ((t - t0) / (n - 1) > 22) { setRes(Math.max(1, k * 0.6)); cv.dataset.lowres = '1'; }
      };
      setTimeout(() => { if (alive) raf = requestAnimationFrame(probe); }, 800);
      cleanups(root).push(() => { alive = false; cancelAnimationFrame(raf); });
    }
    return { W, H };
  }
  // Escribe un número en pantalla sólo si cambió
  const show = (el) => { let last = null; return (v) => { if (v !== last) { last = v; el.textContent = v; } }; };
  /* (2.0.2) Rendimiento: cada dibujo SVG se pasa a mapa de bits UNA vez, al tamaño en que se usa (w×h puntos, al
     doble de resolución). Dibujar el SVG en cada cuadro era lo que más gastaba en los juegos con lienzo.
     Una imagen rota (SVG mal formado) no se dibuja: antes hacía fallar drawImage y congelaba el juego. */
  const ready = (im) => !!im._ok;
  function imgFromSVG(svg, w, h) {
    w = w || 64; h = h || 64;
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * 2); c.height = Math.ceil(h * 2); c._ok = false;
    const im = new Image();
    im.onload = () => { try { c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); c._ok = true; } catch (e) { /* queda sin dibujar */ } };
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return c;
  }
  // El fondo fijo lo pinta la pantalla (CSS) y el lienzo sólo se borra: más barato que rellenar todo en cada cuadro
  const bgOf = (cv, css) => { cv.style.background = css; };

  /* ---------- Atrapá la comida ---------- */
  function catchGame(root, finish) {
    const sp = N.core.state.pet ? N.core.state.pet.species : 'dragon';
    root.innerHTML = `<div class="g-wrap g-play"><div class="g-top"><span>Puntos <b class="sc">0</b></span><span>Tiempo <b class="tm">25</b></span></div>
      <div class="g-stage"><canvas class="g-canvas" aria-label="Juego: atrapá la comida"></canvas></div>
      <p class="g-hint">Mové el dedo o el mouse para llevar la canasta.</p></div>`;
    const cv = root.querySelector('canvas'), g = cv.getContext('2d');
    const { W, H } = fitCanvas(cv, root), FALL = H / 420; // (en un campo más alto las cosas caen más rápido: tardan lo mismo)
    const showSc = show(root.querySelector('.sc')), showTm = show(root.querySelector('.tm'));
    bgOf(cv, 'linear-gradient(#bfe8ff, #e9f8ff)');
    const imgs = {
      fruit: imgFromSVG(art.itemSVG('fruit', sp), 44, 44),
      fav: imgFromSVG(art.itemSVG('fav', sp), 44, 44),
      cake: imgFromSVG(art.itemSVG('cake', sp), 44, 44),
      rock: imgFromSVG('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M8 34c-2-8 4-18 14-20 9-2 18 4 18 13 0 8-6 13-16 13-9 0-14-1-16-6z" fill="#8d8a9c" stroke="#5f5c70" stroke-width="2.5"/><path d="M16 24c3-3 7-4 10-3" stroke="#b9b6c7" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>', 44, 44),
    };
    let played = 0, basket = W / 2, score = 0, items = [], t0 = performance.now(), last = t0, spawnT = 0, running = true, raf = 0, flash = 0;
    const DUR = 25000;
    const MAX = 30;
    const setX = (clientX) => {
      const r = cv.getBoundingClientRect();
      basket = Math.max(36, Math.min(W - 36, ((clientX - r.left) / r.width) * W));
    };
    cv.addEventListener('pointermove', (e) => setX(e.clientX));
    cv.addEventListener('pointerdown', (e) => { setX(e.clientX); try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
    cv.style.touchAction = 'none';

    function frame(now) {
      if (!running) return;
      if (now - last < 14) { raf = requestAnimationFrame(frame); return; } // pantallas de 90/120 Hz: ~60 cuadros alcanzan
      const raw = Math.max(0, now - last), dt = Math.min(50, raw); last = now;
      const el = (played += Math.min(250, raw)); // tiempo jugado (si la app pasa a segundo plano, el reloj se pausa)
      const speedUp = 1 + el / DUR;
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnT = 520 / speedUp;
        const r = Math.random();
        const kind = r < 0.22 ? 'rock' : r < 0.5 ? 'fav' : r < 0.62 ? 'cake' : 'fruit';
        items.push({ x: 24 + Math.random() * (W - 48), y: -30, vy: (0.12 + Math.random() * 0.07) * speedUp * FALL, kind, rot: Math.random() * 6 });
      }
      // fondo
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#9fd67a'; g.fillRect(0, H - 26, W, 26);
      if (flash > 0) { g.fillStyle = `rgba(255,80,90,${flash / 400})`; g.fillRect(0, 0, W, H); flash -= dt; }
      // objetos
      items.forEach((it) => {
        it.y += it.vy * dt; it.rot += dt * 0.002;
        g.save(); g.translate(it.x, it.y); g.rotate(Math.sin(it.rot) * 0.3);
        if (ready(imgs[it.kind])) g.drawImage(imgs[it.kind], -22, -22, 44, 44);
        g.restore();
        if (it.y > H - 70 && it.y < H - 40 && Math.abs(it.x - basket) < 44 && !it.done) {
          it.done = true;
          if (it.kind === 'rock') { score = Math.max(0, score - 2); flash = 400; snd.play('bad'); }
          else { score += it.kind === 'fav' ? 2 : 1; snd.play('good'); }
          showSc(score);
        }
      });
      items = items.filter((it) => !it.done && it.y < H + 30);
      // canasta
      g.save(); g.translate(basket, H - 50);
      g.fillStyle = '#c98b4a'; g.strokeStyle = '#8a5a2b'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(-40, -12); g.lineTo(40, -12); g.lineTo(30, 18); g.lineTo(-30, 18); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = '#a8703a'; g.lineWidth = 2;
      for (let i = -24; i <= 24; i += 12) { g.beginPath(); g.moveTo(i, -10); g.lineTo(i * 0.78, 16); g.stroke(); }
      g.beginPath(); g.moveTo(-36, -2); g.lineTo(36, -2); g.stroke();
      g.restore();
      showTm(Math.max(0, Math.ceil((DUR - el) / 1000)));
      if (el >= DUR) { running = false; finish(Math.min(score, MAX), MAX); return; }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    root._game = { get items() { return items; }, get basket() { return basket; }, W, H }; // para las pruebas automáticas
    return { stop() { running = false; cancelAnimationFrame(raf); } };
  }

  /* ---------- ¿Para dónde mira? ---------- */
  function guessGame(root, finish) {
    const ROUNDS = 5;
    let round = 0, score = 0, busy = false, alive = true;
    root.innerHTML = `<div class="g-wrap g-guess"><div class="g-top"><span>Ronda <b class="rd">1</b>/${ROUNDS}</span><span>Aciertos <b class="sc">0</b></span></div>
      <div class="g-stage"><div class="gg-pet"></div></div><p class="gg-msg">¿Para qué lado va a mirar?</p>
      <div class="row gg-btns"><button type="button" class="btn big" data-d="-1">${N.ui.ic('back')} Izquierda</button><button type="button" class="btn big" data-d="1">Derecha ${N.ui.ic('back', 'flipx')}</button></div></div>`;
    const petBox = root.querySelector('.gg-pet');
    const view = N.ui.liveView(petBox);
    const msg = root.querySelector('.gg-msg');
    onStage(root, (w, h) => { petBox.style.width = Math.floor(Math.min(w, h * 1.2, 640)) + 'px'; });
    root.querySelector('.gg-btns').addEventListener('click', (e) => {
      const b = e.target.closest('[data-d]');
      if (!b || busy) return;
      busy = true;
      const guess = +b.dataset.d;
      const real = Math.random() < 0.5 ? -1 : 1;
      view.dir = real;
      const hit = guess === real;
      if (hit) score++;
      view.setTemp(hit ? 'happy' : 'sad', 1100);
      snd.play(hit ? 'good' : 'bad');
      msg.textContent = hit ? '¡Acertaste!' : 'Uy, miró para el otro lado';
      root.querySelector('.sc').textContent = score;
      setTimeout(() => {
        if (!alive) return;
        round++;
        if (round >= ROUNDS) { finish(score, ROUNDS); return; }
        root.querySelector('.rd').textContent = round + 1;
        view.temp = null; view.render();
        msg.textContent = '¿Para qué lado va a mirar?';
        busy = false;
      }, 1200);
    });
    return { stop() { alive = false; } };
  }

  /* ---------- Memoria ---------- */
  function memoryGame(root, finish) {
    const sp = N.core.state.pet ? N.core.state.pet.species : 'dragon';
    const kinds = ['fruit', 'fav', 'cake', 'medicine', 'vitamins', 'crown'];
    const deck = kinds.concat(kinds).map((k, i) => ({ k, i })).sort(() => Math.random() - 0.5);
    const LIMIT = 60;
    let open = [], found = 0, moves = 0, busy = false, alive = true;
    root.innerHTML = `<div class="g-wrap g-memory"><div class="g-top"><span>Pares <b class="sc">0</b>/6</span><span>Tiempo <b class="tm">${LIMIT}</b></span></div>
      <div class="g-stage"><div class="mem-grid">${deck.map((c, n) => `<button type="button" class="mem-card" data-n="${n}" aria-label="Carta"><span class="mem-back">?</span><span class="mem-front">${art.itemSVG(c.k, sp)}</span></button>`).join('')}</div></div>
      <p class="g-hint">Encontrá los pares en menos de un minuto.</p></div>`;
    // las 12 cartas en 4×3, 3×4 o 6×2: la forma en que salgan más grandes
    const grid = root.querySelector('.mem-grid');
    onStage(root, (w, h) => {
      const gap = Math.max(6, Math.min(14, Math.min(w, h) * 0.02));
      let best = null;
      for (const [c, r] of [[4, 3], [3, 4], [6, 2]]) { const cw = Math.min((w - (c - 1) * gap) / c, ((h - (r - 1) * gap) / r) * 0.75, 170); if (!best || cw > best.cw) best = { c, cw }; }
      grid.style.gap = gap + 'px';
      grid.style.gridTemplateColumns = `repeat(${best.c}, ${Math.floor(best.cw)}px)`;
      grid.style.fontSize = Math.round(best.cw * 0.32) + 'px';
    });
    const end = () => {
      if (!alive) return; alive = false; clearInterval(timer);
      const mistakes = Math.max(0, moves - found);
      const score = Math.min(10, Math.round(found * 1.25 + (found === 6 ? Math.max(0, 2.5 - mistakes * 0.25) : 0)));
      setTimeout(() => finish(score, 10), 500);
    };
    // (2.0.2) el reloj cuenta sólo el tiempo jugado: si la app pasa a segundo plano, se pausa (antes seguía corriendo)
    let played = 0, last = Date.now();
    const timer = setInterval(() => {
      const n = Date.now(); played += Math.min(500, Math.max(0, n - last)); last = n;
      const left = Math.max(0, LIMIT - Math.floor(played / 1000));
      const el = root.querySelector('.tm'); if (el) el.textContent = left;
      if (left <= 0) end();
    }, 250);
    root.querySelector('.mem-grid').addEventListener('click', (e) => {
      const b = e.target.closest('.mem-card');
      if (!b || busy || !alive || b.classList.contains('up')) return;
      b.classList.add('up'); snd.play('tap');
      open.push(b);
      if (open.length < 2) return;
      moves++;
      const [a, c] = open; open = [];
      if (deck[a.dataset.n].k === deck[c.dataset.n].k) {
        found++; a.classList.add('done'); c.classList.add('done'); snd.play('good');
        root.querySelector('.sc').textContent = found;
        if (found === 6) end();
      } else {
        busy = true;
        setTimeout(() => { a.classList.remove('up'); c.classList.remove('up'); busy = false; }, 700);
      }
    });
    root._game = { deck };
    return { stop() { alive = false; clearInterval(timer); } };
  }

  /* ---------- Burbujas ---------- */
  function bubblesGame(root, finish) {
    root.innerHTML = `<div class="g-wrap g-play"><div class="g-top"><span>Puntos <b class="sc">0</b></span><span>Tiempo <b class="tm">20</b></span></div>
      <div class="g-stage"><canvas class="g-canvas" aria-label="Juego: reventá burbujas"></canvas></div>
      <p class="g-hint">Tocá las burbujas. Las doradas valen 3; las verdes, que tienen olor a caca, te restan.</p></div>`;
    const cv = root.querySelector('canvas'), g = cv.getContext('2d');
    const { W, H } = fitCanvas(cv, root), DUR = 20000, MAX = 30, RISE = H / 420;
    const showSc = show(root.querySelector('.sc')), showTm = show(root.querySelector('.tm'));
    bgOf(cv, 'linear-gradient(#9fdcff, #5fb4f0)');
    let played = 0, items = [], score = 0, t0 = performance.now(), last = t0, spawn = 0, running = true, raf = 0, pops = [];
    cv.style.cursor = 'pointer';
    cv.addEventListener('pointerdown', (e) => {
      const r = cv.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
      for (let i = items.length - 1; i >= 0; i--) {
        const b = items[i];
        if (Math.hypot(b.x - x, b.y - y) <= b.r + 6) {
          items.splice(i, 1);
          pops.push({ x: b.x, y: b.y, r: b.r, t: 0, kind: b.kind });
          if (b.kind === 'bad') { score = Math.max(0, score - 2); snd.play('bad'); }
          else { score += b.kind === 'gold' ? 3 : 1; snd.play('good'); }
          showSc(score);
          break;
        }
      }
    });
    function frame(now) {
      if (!running) return;
      if (now - last < 14) { raf = requestAnimationFrame(frame); return; }
      const raw = Math.max(0, now - last), dt = Math.min(50, raw); last = now;
      const el = (played += Math.min(250, raw)); // tiempo jugado (si la app pasa a segundo plano, el reloj se pausa)
      spawn -= dt;
      if (spawn <= 0) {
        spawn = 380 - Math.min(180, el / 100);
        const r = Math.random();
        items.push({ x: 30 + Math.random() * (W - 60), y: H + 30, r: 16 + Math.random() * 14, vy: (0.06 + Math.random() * 0.06 + el / 400000) * RISE, wob: Math.random() * 6, kind: r < 0.12 ? 'gold' : r < 0.27 ? 'bad' : 'ok' });
      }
      g.clearRect(0, 0, W, H);
      items.forEach((b) => {
        b.y -= b.vy * dt; b.wob += dt * 0.004;
        const x = b.x + Math.sin(b.wob) * 6;
        const col = b.kind === 'gold' ? 'rgba(255,201,60,.55)' : b.kind === 'bad' ? 'rgba(130,190,70,.55)' : 'rgba(255,255,255,.35)';
        g.beginPath(); g.arc(x, b.y, b.r, 0, Math.PI * 2); g.fillStyle = col; g.fill();
        g.lineWidth = 2.5; g.strokeStyle = b.kind === 'gold' ? '#d99a1a' : b.kind === 'bad' ? '#5a8a2a' : 'rgba(255,255,255,.9)'; g.stroke();
        g.beginPath(); g.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.22, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,.85)'; g.fill();
        if (b.kind === 'bad') { g.fillStyle = '#5e3a24'; g.font = 'bold ' + Math.round(b.r) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('~', x, b.y + 2); }
      });
      items = items.filter((b) => b.y > -40);
      pops.forEach((p) => { p.t += dt; const k = p.t / 250; g.beginPath(); g.arc(p.x, p.y, p.r * (1 + k), 0, Math.PI * 2); g.strokeStyle = `rgba(255,255,255,${Math.max(0, 1 - k)})`; g.lineWidth = 2; g.stroke(); });
      pops = pops.filter((p) => p.t < 250);
      showTm(Math.max(0, Math.ceil((DUR - el) / 1000)));
      if (el >= DUR) { running = false; finish(Math.min(score, MAX), MAX); return; }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    root._game = { get items() { return items; }, W, H };
    return { stop() { running = false; cancelAnimationFrame(raf); } };
  }

  /* ---------- Simón dice (se desbloquea con monedas) ---------- */
  function simonGame(root, finish) {
    const PADS = [{ ic: 'food' }, { ic: 'sleep' }, { ic: 'bath' }, { ic: 'play' }];
    const MAXR = 10;
    root.innerHTML = `<div class="g-wrap g-simon"><div class="g-top"><span>Ronda <b class="rd">1</b></span><span>Récord <b class="best">0</b></span></div>
      <div class="g-stage"><div class="simon">${PADS.map((p, i) => `<button type="button" class="s${i}" data-i="${i}" aria-label="Botón ${i + 1}" disabled>${N.ui.ic(p.ic)}</button>`).join('')}</div></div>
      <p class="gg-msg">Mirá bien…</p></div>`;
    const btns = [...root.querySelectorAll('.simon button')], msg = root.querySelector('.gg-msg');
    const pad = root.querySelector('.simon');
    onStage(root, (w, h) => { pad.style.width = Math.floor(Math.min(w, h, 720)) + 'px'; });
    let seq = [], pos = 0, alive = true, timers = [], best = 0;
    const later = (fn, ms) => { const t = setTimeout(() => { if (alive) fn(); }, ms); timers.push(t); };
    const light = (i, ms) => { btns[i].classList.add('on'); snd.play('note', i); later(() => btns[i].classList.remove('on'), ms); };
    const lock = (v) => btns.forEach((b) => { b.disabled = v; });
    function play() {
      lock(true); msg.textContent = 'Mirá bien…';
      root.querySelector('.rd').textContent = seq.length;
      const step = Math.max(320, 620 - seq.length * 30);
      seq.forEach((i, k) => later(() => light(i, step * 0.6), 500 + k * step));
      later(() => { lock(false); pos = 0; msg.textContent = '¡Ahora vos!'; }, 500 + seq.length * step);
    }
    function next() { seq.push(Math.floor(Math.random() * 4)); play(); }
    root.querySelector('.simon').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || b.disabled || !alive) return;
      const i = +b.dataset.i;
      light(i, 220);
      if (i !== seq[pos]) {
        lock(true); snd.play('bad'); msg.textContent = '¡Uy! Era otro';
        const score = seq.length - 1;
        later(() => finish(Math.min(score, MAXR), MAXR), 900);
        return;
      }
      pos++;
      if (pos === seq.length) {
        best = seq.length; root.querySelector('.best').textContent = best;
        lock(true); msg.textContent = '¡Bien!';
        if (seq.length >= MAXR) { snd.play('happy'); later(() => finish(MAXR, MAXR), 700); return; }
        later(next, 700);
      }
    });
    next();
    root._game = { get seq() { return seq; } };
    return { stop() { alive = false; timers.forEach(clearTimeout); } };
  }

  /* ---------- Salto (se desbloquea con monedas) ---------- */
  function jumpGame(root, finish) {
    const S0 = N.core.state, p = S0.pet;
    root.innerHTML = `<div class="g-wrap g-play"><div class="g-top"><span>Saltos <b class="sc">0</b></span><span>Vidas <b class="lv">3</b></span><span>Tiempo <b class="tm">25</b></span></div>
      <div class="g-stage"><canvas class="g-canvas g-jump" aria-label="Juego: saltá las piedras"></canvas></div>
      <p class="g-hint">Tocá o hacé clic (o la barra espaciadora) para saltar cuando se acerque una piedra.</p></div>`;
    const cv = root.querySelector('canvas'), g = cv.getContext('2d');
    const { W, H } = fitCanvas(cv, root), DUR = 25000, MAX = 12, GY = H - 70; // salen ~15 piedras: 12 ya es puntaje perfecto
    const showSc = show(root.querySelector('.sc')), showTm = show(root.querySelector('.tm')), showLv = show(root.querySelector('.lv'));
    const petImg = imgFromSVG(art.petSVG({ species: p ? p.species : 'dragon', stage: p && p.stage !== 'egg' ? p.stage : 'baby', variant: p ? p.variant : 'normal', mood: 'happy', dir: 1, accessory: S0.wearing, walking: true }).replace('<svg ', '<svg width="240" height="200" '), 132, 110);
    const rockImg = imgFromSVG('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 40"><path d="M4 38c-2-10 6-24 18-26 11-2 22 6 22 16 0 8-6 10-18 10z" fill="#8d8a9c" stroke="#5f5c70" stroke-width="2.5"/><path d="M14 24c3-3 7-4 10-3" stroke="#b9b6c7" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>', 48, 40);
    bgOf(cv, 'linear-gradient(#bfe8ff, #fff3d6)');
    // La mascota se dibuja en un cuadro de 132×110 pero el cuerpo ocupa el centro: el choque usa sólo el cuerpo
    const PW = 132, PH = 110, PX = 30, BX0 = PX + PW * 0.36, BX1 = PX + PW * 0.66;
    const V0 = -1.05, GRAV = 0.0025, AIR = 2 * -V0 / GRAV; // ~0,84 s en el aire y ~220 px de alto: da tiempo de sobra para pasar una piedra
    let pairNext = false, y = 0, vy = 0, rocks = [], spawn = 1400, score = 0, lives = 3, hurt = 0, played = 0, last = performance.now(), running = true, raf = 0, scroll = 0, queued = -1;
    let sp = 0.2;
    const st = { get y() { return y; }, get rocks() { return rocks; }, get score() { return score; }, get lives() { return lives; }, get sp() { return sp; }, get petOk() { return ready(petImg); }, BX0, BX1, W, H };
    // Si toca un poquito antes de caer, salta apenas toca el piso (antes el toque se perdía)
    const jump = () => { if (!running) return; if (y >= -1) { vy = V0; y = -0.01; queued = -1; snd.play('tap'); } else queued = played; };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });
    const onKey = (e) => { if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); if (!e.repeat) jump(); } };
    window.addEventListener('keydown', onKey);
    cv.style.touchAction = 'none';
    function frame(now) {
      if (!running) return;
      if (now - last < 14) { raf = requestAnimationFrame(frame); return; }
      const raw = Math.max(0, now - last), dt = Math.min(40, raw); last = now;
      const el = (played += Math.min(250, raw));
      sp = 0.2 + el / 100000; // la velocidad sube de a poco (0,20 → 0,45 px/ms)
      if (y < 0 || vy < 0) { vy += GRAV * dt; y += vy * dt; if (y >= 0) { y = 0; vy = 0; if (queued >= 0 && played - queued < 180) jump(); queued = -1; } }
      // piedras: separadas en distancia (no en tiempo) para que siempre se puedan saltar de a una o de a dos juntas
      spawn -= sp * dt;
      if (spawn <= 0) {
        const pair = !pairNext && el > 8000 && Math.random() < 0.18; // a veces dos piedras chicas pegadas
        const w = pair || pairNext ? 26 + Math.random() * 6 : 30 + Math.random() * 14;
        rocks.push({ x: W + 10, w, h: w * 0.83, passed: false });
        // la distancia a la próxima siempre deja aterrizar y volver a saltar
        spawn = pair ? w + 2 : sp * AIR + 140 + Math.random() * 200;
        pairNext = pair;
      }
      for (const r of rocks) {
        r.x -= sp * dt;
        // choque: el cuerpo pisa la piedra y los pies están más bajos que el 70 % de su altura
        const hit = r.x + r.w * 0.15 < BX1 && r.x + r.w * 0.85 > BX0 && -y < r.h * 0.7;
        if (hit && !r.hit) { r.hit = true; if (hurt <= 0) { lives--; hurt = 900; snd.play('bad'); showLv(lives); } } // la piedra que se atraviesa parpadeando no suma
        if (!r.passed && r.x + r.w < BX0) { r.passed = true; if (!r.hit) { score++; showSc(score); snd.play('good'); } }
      }
      rocks = rocks.filter((r) => r.x > -60);
      if (hurt > 0) hurt -= dt;
      scroll = (scroll + sp * dt) % 40;
      // dibujo
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#9fd67a'; g.fillRect(0, GY, W, H - GY);
      g.fillStyle = '#7cbf5a'; for (let x = -scroll; x < W; x += 40) g.fillRect(x, GY + 8, 20, 4);
      if (ready(rockImg)) for (const r of rocks) g.drawImage(rockImg, r.x, GY - r.h + 4, r.w, r.h);
      // sombra en el piso: ayuda a medir el salto
      g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse((BX0 + BX1) / 2, GY + 4, 26 * (1 + y / 400), 5, 0, 0, Math.PI * 2); g.fill();
      if (!(hurt > 0 && Math.floor(hurt / 120) % 2)) { if (ready(petImg)) g.drawImage(petImg, PX, GY - PH + 6 + y, PW, PH); }
      showTm(Math.max(0, Math.ceil((DUR - el) / 1000)));
      if (el >= DUR || lives <= 0) { running = false; window.removeEventListener('keydown', onKey); finish(Math.min(score, MAX), MAX); return; }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    root._game = st; // para las pruebas automáticas
    return { stop() { running = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); } };
  }


  /* ===================== 2.0: juegos nuevos ===================== */
  const petOf = () => { const S0 = N.core.state, p = S0.pet; return { species: p ? p.species : 'dragon', stage: p && p.stage !== 'egg' ? p.stage : 'baby', variant: p ? p.variant : 'normal', accessory: S0.wearing }; };
  const petImgOf = (mood, w) => imgFromSVG(art.petSVG(Object.assign(petOf(), { mood: mood || 'happy', dir: 1 })).replace('<svg ', '<svg width="240" height="200" '), w || 120, (w || 120) / 1.2);
  const emojiImg = (e) => imgFromSVG(art.emojiSVG(e).replace('<svg ', '<svg width="96" height="96" '), 44, 44);
  const later = (list, fn, ms) => { const t = setTimeout(fn, ms); list.push(t); return t; };

  /* ---------- Penales: pateás al arco y tu mascota ataja ---------- */
  function golGame(root, finish) {
    const SHOTS = 5;
    root.innerHTML = `<div class="g-wrap g-gol"><div class="g-top"><span>Tiro <b class="rd">1</b>/${SHOTS}</span><span>Goles <b class="sc">0</b></span></div>
      <div class="g-stage"><div class="gol-field"><div class="gol-goal">${N.houseArt.goalSVG()}<div class="gol-keeper"></div>${[0, 1, 2, 3, 4, 5].map((i) => `<button type="button" class="gol-zone z${i}" data-z="${i}" aria-label="Patear acá"></button>`).join('')}</div><div class="gol-ball">${N.houseArt.icon('soccer')}</div></div></div>
      <p class="gg-msg">Tocá dónde querés patear</p></div>`;
    const field = root.querySelector('.gol-field');
    onStage(root, (w, h) => { field.style.width = Math.floor(Math.min(w, h, 760)) + 'px'; });
    const keeper = root.querySelector('.gol-keeper'), ball = root.querySelector('.gol-ball'), msg = root.querySelector('.gg-msg'), goal = root.querySelector('.gol-goal');
    const kv = N.ui.liveView(keeper);
    let shot = 0, goals = 0, busy = false, alive = true; const timers = [], hist = [];
    goal.addEventListener('click', (e) => {
      const b = e.target.closest('[data-z]'); if (!b || busy || !alive) return;
      busy = true;
      const z = +b.dataset.z, col = z % 3, row = Math.floor(z / 3);
      // la mascota se tira: a veces adivina, y si repetís mucho el mismo lado te lee
      const fav = hist.length >= 2 && hist[hist.length - 1] % 3 === hist[hist.length - 2] % 3 ? hist[hist.length - 1] % 3 : null;
      let dive = fav != null && Math.random() < 0.7 ? fav : Math.floor(Math.random() * 3);
      if (Math.random() < 0.12) dive = col; // de vez en cuando adivina igual
      hist.push(z);
      const saved = dive === col && !(row === 0 && Math.random() < 0.35); // arriba es más difícil de atajar
      const gr = goal.getBoundingClientRect(), br = b.getBoundingClientRect(), fr = ball.getBoundingClientRect();
      const tx = br.left + br.width / 2 - (fr.left + fr.width / 2), ty = br.top + br.height / 2 - (fr.top + fr.height / 2);
      keeper.style.transform = `translateX(${(dive - 1) * gr.width * 0.3}px) translateY(${row === 0 ? -gr.height * 0.12 : 0}px) rotate(${(dive - 1) * 22}deg)`;
      snd.play('tap');
      if (ball.animate) ball.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${tx}px, ${ty}px) scale(.62)` }], { duration: 420, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' });
      later(timers, () => {
        shot++;
        if (saved) { msg.textContent = '¡Atajó!'; kv.setTemp('happy', 900); snd.play('bad'); }
        else { goals++; msg.textContent = '¡Gooool!'; kv.setTemp('surprise', 900); snd.play('good'); goal.classList.remove('shake'); void goal.offsetWidth; goal.classList.add('shake'); }
        root.querySelector('.sc').textContent = goals;
      }, 440);
      later(timers, () => {
        if (!alive) return;
        if (shot >= SHOTS) { finish(goals, SHOTS); return; }
        root.querySelector('.rd').textContent = shot + 1;
        keeper.style.transform = ''; if (ball.getAnimations) ball.getAnimations().forEach((a) => a.cancel());
        msg.textContent = 'Tocá dónde querés patear'; busy = false;
      }, 1300);
    });
    root._game = { get busy() { return busy; }, get shot() { return shot; } };
    return { stop() { alive = false; timers.forEach(clearTimeout); } };
  }

  /* ---------- Ta-te-tí contra tu mascota (3 rondas) ---------- */
  function tatetiGame(root, finish) {
    const ROUNDS = 3, MAX = ROUNDS * 2;
    root.innerHTML = `<div class="g-wrap g-tateti"><div class="g-top"><span>Ronda <b class="rd">1</b>/${ROUNDS}</span><span>Puntos <b class="sc">0</b></span></div>
      <div class="g-stage"><div class="ttt-vs"><span class="ttt-me">Vos <b>✕</b></span><div class="ttt-pet"></div><span class="ttt-it"><b>◯</b> Mascota</span></div>
      <div class="ttt">${Array.from({ length: 9 }, (_, i) => `<button type="button" data-i="${i}" aria-label="Casilla ${i + 1}"></button>`).join('')}</div></div>
      <p class="gg-msg">Te toca: poné tu ✕</p></div>`;
    const cells = [...root.querySelectorAll('.ttt button')], msg = root.querySelector('.gg-msg');
    const pv = N.ui.liveView(root.querySelector('.ttt-pet'));
    const boardEl = root.querySelector('.ttt'), vs = root.querySelector('.ttt-vs');
    onStage(root, (w, h) => {
      const land = w > h * 1.2; // acostado: la mascota al costado del tablero
      const size = Math.floor(Math.max(150, Math.min(land ? w - 180 : w, land ? h : h - vs.offsetHeight - 10, 680)));
      boardEl.style.width = size + 'px'; boardEl.style.fontSize = Math.round(size * 0.17) + 'px';
    });
    const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    let board, round = 0, score = 0, busy = false, alive = true; const timers = [];
    const win = (b, m) => L.some((l) => l.every((i) => b[i] === m));
    const full = (b) => b.every((x) => x);
    function minimax(b, me) {
      if (win(b, 'o')) return { s: 1 }; if (win(b, 'x')) return { s: -1 }; if (full(b)) return { s: 0 };
      let best = { s: me ? -2 : 2, i: -1 };
      b.forEach((v, i) => { if (v) return; b[i] = me ? 'o' : 'x'; const r = minimax(b, !me); b[i] = null; if (me ? r.s > best.s : r.s < best.s) best = { s: r.s, i }; });
      return best;
    }
    function draw() { cells.forEach((c, i) => { c.textContent = board[i] === 'x' ? '✕' : board[i] === 'o' ? '◯' : ''; c.className = board[i] ? 'm' + board[i] : ''; /* (no 'x': esa clase es la del botón de cerrar la hoja) */ c.disabled = !!board[i] || busy; }); }
    function start() { board = Array(9).fill(null); busy = false; msg.textContent = 'Te toca: poné tu ✕'; root.querySelector('.rd').textContent = round + 1; draw(); }
    function endRound(res) {
      busy = true; draw();
      if (res === 'x') { score += 2; msg.textContent = '¡Le ganaste!'; pv.setTemp('sad', 1200); snd.play('good'); }
      else if (res === 'o') { msg.textContent = 'Ganó tu mascota'; pv.setTemp('happy', 1200); snd.play('bad'); }
      else { score += 1; msg.textContent = 'Empate'; snd.play('tap'); }
      root.querySelector('.sc').textContent = score;
      later(timers, () => { if (!alive) return; round++; if (round >= ROUNDS) finish(score, MAX); else start(); }, 1400);
    }
    root.querySelector('.ttt').addEventListener('click', (e) => {
      const c = e.target.closest('[data-i]'); if (!c || busy || !alive) return;
      const i = +c.dataset.i; if (board[i]) return;
      board[i] = 'x'; snd.play('tap');
      if (win(board, 'x')) return endRound('x');
      if (full(board)) return endRound('-');
      busy = true; draw(); msg.textContent = 'Está pensando…';
      later(timers, () => {
        if (!alive) return;
        // juega bien casi siempre, pero a veces se distrae (así se le puede ganar)
        const free = board.map((v, k) => (v ? -1 : k)).filter((k) => k >= 0);
        const j = Math.random() < 0.62 ? minimax(board.slice(), true).i : free[Math.floor(Math.random() * free.length)];
        board[j] = 'o'; busy = false;
        if (win(board, 'o')) return endRound('o');
        if (full(board)) return endRound('-');
        msg.textContent = 'Te toca: poné tu ✕'; draw();
      }, 650);
    });
    start();
    root._game = { get board() { return board; }, get busy() { return busy; } };
    return { stop() { alive = false; timers.forEach(clearTimeout); } };
  }

  /* ---------- Topos: tocá los topos, no a tu mascota ---------- */
  function toposGame(root, finish) {
    const DUR = 25000, MAX = 20;
    root.innerHTML = `<div class="g-wrap g-topos"><div class="g-top"><span>Topos <b class="sc">0</b></span><span>Tiempo <b class="tm">25</b></span></div>
      <div class="g-stage"><div class="holes">${Array.from({ length: 9 }, (_, i) => `<button type="button" class="hole" data-i="${i}" aria-label="Pozo ${i + 1}"><span class="who"></span><span class="dirt"></span></button>`).join('')}</div></div>
      <p class="g-hint">Tocá a los topos cuando asoman. Si tocás a tu mascota, perdés 2.</p></div>`;
    const holes = [...root.querySelectorAll('.hole')];
    const holesEl = root.querySelector('.holes');
    onStage(root, (w, h) => { holesEl.style.width = Math.floor(Math.min(w, h, 760)) + 'px'; });
    const petSvg = art.petSVG(Object.assign(petOf(), { mood: 'happy', dir: 1 }));
    let score = 0, alive = true, t0 = Date.now(), played = 0, last = Date.now(); const timers = [], up = {};
    const showSc = show(root.querySelector('.sc')), showTm = show(root.querySelector('.tm'));
    function pop() {
      if (!alive) return;
      const free = holes.map((_, i) => i).filter((i) => !up[i]);
      if (free.length) {
        const i = free[Math.floor(Math.random() * free.length)], isPet = Math.random() < 0.2;
        up[i] = isPet ? 'pet' : 'mole';
        const w = holes[i].querySelector('.who');
        w.innerHTML = isPet ? petSvg : `<span class="mole">${art.emojiSVG('🐹')}</span>`;
        holes[i].classList.add('up');
        const stay = Math.max(520, 1100 - played / 40);
        later(timers, () => { if (up[i]) { delete up[i]; holes[i].classList.remove('up', 'hit'); } }, stay);
      }
      later(timers, pop, Math.max(330, 700 - played / 60) * (0.7 + Math.random() * 0.6));
    }
    root.querySelector('.holes').addEventListener('pointerdown', (e) => {
      const b = e.target.closest('.hole'); if (!b || !alive) return;
      const i = +b.dataset.i, w = up[i]; if (!w) return;
      delete up[i]; b.classList.add('hit');
      if (w === 'pet') { score = Math.max(0, score - 2); snd.play('bad'); } else { score++; snd.play('good'); }
      showSc(score);
      later(timers, () => b.classList.remove('up', 'hit'), 180);
    });
    const tick = setInterval(() => {
      const n = Date.now(), raw = n - last; last = n; played += Math.min(250, raw);
      showTm(Math.max(0, Math.ceil((DUR - played) / 1000)));
      if (played >= DUR) { alive = false; clearInterval(tick); timers.forEach(clearTimeout); finish(Math.min(score, MAX), MAX); }
    }, 100);
    later(timers, pop, 500);
    root._game = { get up() { return up; } };
    void t0;
    return { stop() { alive = false; clearInterval(tick); timers.forEach(clearTimeout); } };
  }

  /* ---------- Pileta: saltá de flotador en flotador ---------- */
  function piletaGame(root, finish) {
    root.innerHTML = `<div class="g-wrap g-play"><div class="g-top"><span>Saltos <b class="sc">0</b></span><span>Vidas <b class="lv">3</b></span><span>Tiempo <b class="tm">40</b></span></div>
      <div class="g-stage"><canvas class="g-canvas g-jump" aria-label="Juego: pileta"></canvas></div>
      <p class="g-hint">Tocá para saltar al flotador de arriba cuando pase justo por encima.</p></div>`;
    const cv = root.querySelector('canvas'), g = cv.getContext('2d');
    const { W, H } = fitCanvas(cv, root, { maxW: 520 }), MAX = 12, ROW = 120, PW = 100, PH = 84, DUR = 40000;
    const showSc = show(root.querySelector('.sc')), showLv = show(root.querySelector('.lv')), showTm = show(root.querySelector('.tm'));
    let played = 0;
    const petImg = petImgOf('happy', PW), sadImg = petImgOf('sad', PW);
    bgOf(cv, '#4fc3f7');
    // flotadores: uno por fila; cada uno va y viene a su velocidad
    const rows = [];
    const mk = (k) => ({ x: 60 + Math.random() * (W - 120), v: (0.07 + Math.random() * 0.06 + k * 0.004) * (Math.random() < 0.5 ? -1 : 1), w: Math.max(70, 110 - k * 3) });
    for (let k = 0; k < 20; k++) rows.push(mk(k));
    rows[0].v = 0; rows[0].x = W / 2;
    let cur = 0, score = 0, lives = 3, cam = 0, jump = null, splash = 0, running = true, raf = 0, last = performance.now(), wob = 0;
    const lane = (k) => H - 70 - (k * ROW) + cam;
    const doJump = () => { if (!running || jump || splash > 0) return; jump = { t: 0, from: rows[cur].x }; snd.play('tap'); };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); doJump(); });
    const onKey = (e) => { if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); if (!e.repeat) doJump(); } };
    window.addEventListener('keydown', onKey);
    cv.style.touchAction = 'none';
    function frame(now) {
      if (!running) return;
      if (now - last < 14) { raf = requestAnimationFrame(frame); return; }
      const raw = Math.max(0, now - last), dt = Math.min(40, raw); last = now; wob += dt;
      played += Math.min(250, raw);
      showTm(Math.max(0, Math.ceil((DUR - played) / 1000)));
      if (played >= DUR && !jump) { running = false; window.removeEventListener('keydown', onKey); finish(Math.min(score, MAX), MAX); return; }
      rows.forEach((r, k) => { if (k <= cur - 1 || (jump && k === cur + 1)) return; r.x += r.v * dt; // (mientras salta, el flotador de destino se queda quieto)
        if (r.x < r.w / 2 + 6 || r.x > W - r.w / 2 - 6) { r.v *= -1; r.x = Math.max(r.w / 2 + 6, Math.min(W - r.w / 2 - 6, r.x)); } });
      let px = rows[cur].x, py = lane(cur);
      if (jump) {
        jump.t += dt;
        const k = Math.min(1, jump.t / 520);
        px = jump.from; // salta derecho para arriba: tiene que caer justo sobre el flotador
        py = lane(cur) + (lane(cur + 1) - lane(cur)) * k - Math.sin(Math.PI * k) * 40;
        if (k >= 1) {
          const target = rows[cur + 1];
          if (Math.abs(target.x - jump.from) < target.w / 2 + 6) { cur++; score++; showSc(score); snd.play('good'); }
          else { lives--; showLv(lives); splash = 900; snd.play('bad'); }
          jump = null;
          if (score >= MAX || lives <= 0) { running = false; window.removeEventListener('keydown', onKey); setTimeout(() => finish(Math.min(score, MAX), MAX), 500); }
        }
      }
      if (splash > 0) splash -= dt;
      // la cámara sigue a la mascota
      const want = cur * ROW; cam += (want - cam) * Math.min(1, dt / 160);
      g.clearRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 3;
      // (2.0.2) todas las olas en un solo trazo (antes, uno por fila)
      g.beginPath();
      for (let y = (cam % 40) - 40; y < H; y += 40) { g.moveTo(0, y + Math.sin((wob / 10) / 30) * 4); for (let x = 24; x <= W + 24; x += 24) g.lineTo(x, y + Math.sin((x + wob / 10) / 30) * 4); }
      g.stroke();
      rows.forEach((r, k) => {
        const y = lane(k); if (y < -40 || y > H + 40) return;
        g.fillStyle = k % 2 ? '#ffd23f' : '#ff5d73'; g.strokeStyle = '#2a1f3d'; g.lineWidth = 3;
        g.beginPath(); g.ellipse(r.x, y, r.w / 2, 16, 0, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = '#4fc3f7'; g.beginPath(); g.ellipse(r.x, y - 2, r.w / 4, 6, 0, 0, Math.PI * 2); g.fill();
      });
      if (splash > 0) {
        g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(px + Math.cos(i) * 30 * (1 - splash / 900), lane(cur) - 30 * (1 - splash / 900) + i * 3, 5, 0, Math.PI * 2); g.fill(); }
      } else {
        const im = ready(petImg) ? petImg : null;
        if (im) g.drawImage(splash > 0 ? sadImg : im, px - PW / 2, py - PH + 14, PW, PH);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    root._game = { get rows() { return rows; }, get cur() { return cur; }, get jumping() { return !!jump; }, get splash() { return splash; }, jump: doJump, W, H };
    return { stop() { running = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); } };
  }

  /* ---------- Carrera: manejá y esquivá los conos ---------- */
  function carreraGame(root, finish) {
    root.innerHTML = `<div class="g-wrap g-play"><div class="g-top"><span>Puntos <b class="sc">0</b></span><span>Vidas <b class="lv">3</b></span><span>Tiempo <b class="tm">30</b></span></div>
      <div class="g-stage"><canvas class="g-canvas g-jump" aria-label="Juego: carrera"></canvas></div>
      <p class="g-hint">Tocá a la izquierda o a la derecha para cambiar de carril (o usá las flechas).</p></div>`;
    const cv = root.querySelector('canvas'), g = cv.getContext('2d');
    const { W, H } = fitCanvas(cv, root, { maxW: 560 }), DUR = 30000, MAX = 25, LANES = [W * 0.2, W * 0.5, W * 0.8];
    const showSc = show(root.querySelector('.sc')), showLv = show(root.querySelector('.lv')), showTm = show(root.querySelector('.tm'));
    const petImg = petImgOf('happy', 88);
    const cone = emojiImg('🚧'), coin = imgFromSVG(art.itemSVG('coin').replace('<svg ', '<svg width="96" height="96" '), 44, 44);
    bgOf(cv, 'linear-gradient(90deg, #6cc04a 5%, #5a6170 5% 95%, #6cc04a 95%)');
    let lane = 1, x = LANES[1], items = [], spawn = 600, score = 0, lives = 3, hurt = 0, played = 0, last = performance.now(), running = true, raf = 0, road = 0;
    const move = (d) => { if (!running) return; lane = Math.max(0, Math.min(2, lane + d)); snd.play('tap'); };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); const r = cv.getBoundingClientRect(); move(e.clientX - r.left < r.width / 2 ? -1 : 1); });
    const onKey = (e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); } if (e.key === 'ArrowRight') { e.preventDefault(); move(1); } };
    window.addEventListener('keydown', onKey);
    cv.style.touchAction = 'none';
    function frame(now) {
      if (!running) return;
      if (now - last < 14) { raf = requestAnimationFrame(frame); return; }
      const raw = Math.max(0, now - last), dt = Math.min(40, raw); last = now;
      const el = (played += Math.min(250, raw)), sp = 0.22 + el / 90000;
      x += (LANES[lane] - x) * Math.min(1, dt / 90);
      road = (road + sp * dt) % 60;
      spawn -= sp * dt;
      if (spawn <= 0) {
        const free = [0, 1, 2].sort(() => Math.random() - 0.5);
        const n = Math.random() < 0.3 && el > 6000 ? 2 : 1; // a veces dos conos: siempre queda un carril libre
        for (let i = 0; i < n; i++) items.push({ lane: free[i], y: -30, kind: 'cone' });
        if (Math.random() < 0.5) items.push({ lane: free[2], y: -90, kind: 'coin' });
        spawn = 170 + Math.random() * 120;
      }
      const carY = H - 70;
      items.forEach((it) => {
        it.y += sp * dt;
        if (!it.done && Math.abs(it.y - carY) < 34 && Math.abs(LANES[it.lane] - x) < 42) {
          it.done = true;
          if (it.kind === 'coin') { score += 2; showSc(score); snd.play('coin'); }
          else if (hurt <= 0) { lives--; hurt = 1000; showLv(lives); snd.play('bad'); }
        }
        if (!it.passed && it.kind === 'cone' && it.y > carY + 30) { it.passed = true; if (!it.done) { score++; showSc(score); } }
      });
      items = items.filter((it) => it.y < H + 40 && !(it.done && it.kind === 'coin'));
      if (hurt > 0) hurt -= dt;
      // dibujo
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#fff'; for (let y = -60 + road; y < H; y += 60) { g.fillRect(W * 0.35 - 3, y, 6, 30); g.fillRect(W * 0.65 - 3, y, 6, 30); }
      items.forEach((it) => { const im = it.kind === 'coin' ? coin : cone; if (ready(im)) g.drawImage(im, LANES[it.lane] - 22, it.y - 22, 44, 44); });
      if (!(hurt > 0 && Math.floor(hurt / 120) % 2)) {
        g.save(); g.translate(x, carY);
        g.fillStyle = '#e8394a'; g.strokeStyle = '#2a1f3d'; g.lineWidth = 3;
        g.beginPath(); g.roundRect ? g.roundRect(-30, -30, 60, 74, 14) : g.rect(-30, -30, 60, 74); g.fill(); g.stroke();
        g.fillStyle = '#2a1f3d'; [[-34, -18], [26, -18], [-34, 22], [26, 22]].forEach(([a, b2]) => g.fillRect(a, b2, 8, 16));
        if (ready(petImg)) g.drawImage(petImg, -44, -62, 88, 73);
        g.restore();
      }
      showTm(Math.max(0, Math.ceil((DUR - el) / 1000)));
      if (el >= DUR || lives <= 0) { running = false; window.removeEventListener('keydown', onKey); finish(Math.min(score, MAX), MAX); return; }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    root._game = { get items() { return items; }, get lane() { return lane; }, set lane(v) { lane = v; }, LANES, W, H };
    return { stop() { running = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); } };
  }

  /* ---------- Salta nubes: rebotá de nube en nube hacia arriba ---------- */
  function nubesGame(root, finish) {
    root.innerHTML = `<div class="g-wrap g-play"><div class="g-top"><span>Altura <b class="sc">0</b></span><span>Tiempo <b class="tm">40</b></span></div>
      <div class="g-stage"><canvas class="g-canvas g-jump" aria-label="Juego: salta nubes"></canvas></div>
      <p class="g-hint">Mantené apretado a la izquierda o a la derecha (o las flechas) para moverte.</p></div>`;
    const cv = root.querySelector('canvas'), g = cv.getContext('2d');
    const { W, H } = fitCanvas(cv, root, { maxW: 420 }), DUR = 40000, MAX = 30, PW = 70, PH = 58; // (más ancho sería imposible llegar de una punta a la otra)
    const showSc = show(root.querySelector('.sc')), showTm = show(root.querySelector('.tm'));
    const petImg = petImgOf('happy', PW);
    let skyKey = '';
    let clouds = [], px = W / 2, py = H - 120, vy = -0.75, steer = 0, cam = 0, best = 0, played = 0, last = performance.now(), running = true, raf = 0;
    for (let i = 0; i < 9; i++) clouds.push({ x: 40 + Math.random() * (W - 80), y: H - 40 - i * 62, w: 74, n: i });
    clouds[0].x = W / 2;
    const GRAV = 0.0019, BOUNCE = -0.86;
    const setSteer = (e) => { const r = cv.getBoundingClientRect(); steer = e.clientX - r.left < r.width / 2 ? -1 : 1; };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); setSteer(e); try { cv.setPointerCapture(e.pointerId); } catch (_) { /* nada */ } });
    cv.addEventListener('pointermove', (e) => { if (e.buttons) setSteer(e); });
    ['pointerup', 'pointercancel'].forEach((ev) => cv.addEventListener(ev, () => { steer = 0; }));
    const kd = (e) => { if (e.key === 'ArrowLeft') { steer = -1; e.preventDefault(); } if (e.key === 'ArrowRight') { steer = 1; e.preventDefault(); } };
    const ku = (e) => { if ((e.key === 'ArrowLeft' && steer < 0) || (e.key === 'ArrowRight' && steer > 0)) steer = 0; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    cv.style.touchAction = 'none';
    const end = () => { running = false; window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); finish(Math.min(best, MAX), MAX); };
    function frame(now) {
      if (!running) return;
      if (now - last < 14) { raf = requestAnimationFrame(frame); return; }
      const raw = Math.max(0, now - last), dt = Math.min(40, raw); last = now;
      const el = (played += Math.min(250, raw));
      px += steer * 0.32 * dt; if (px < -20) px = W + 20; if (px > W + 20) px = -20;
      const vy0 = vy; vy += GRAV * dt; py += vy * dt;
      // rebota sólo cayendo sobre una nube
      if (vy > 0) for (const c of clouds) { if (vy0 >= 0 && Math.abs(px - c.x) < c.w / 2 + 12 && py >= c.y - 6 && py - vy * dt <= c.y + 4) { vy = BOUNCE; py = c.y - 6; if (c.n > best) { best = c.n; showSc(best); snd.play('good'); } break; } }
      // la cámara sube cuando la mascota pasa de la mitad
      const top = H * 0.42; if (py < top) { const d = top - py; py = top; clouds.forEach((c) => { c.y += d; }); cam += d; }
      clouds = clouds.filter((c) => c.y < H + 30);
      while (clouds.length < 9) { const hi = clouds.reduce((m, c) => Math.min(m, c.y), H), n = clouds.reduce((m, c) => Math.max(m, c.n), 0) + 1; clouds.push({ x: 40 + Math.random() * (W - 80), y: hi - 56 - Math.random() * 22, w: Math.max(50, 76 - n), n }); }
      // el cielo se oscurece al subir: se cambia de a poquito (no en cada cuadro)
      const hue = Math.round(205 - Math.min(60, cam / 80)), lum = Math.round(72 - Math.min(30, cam / 200)), sk = hue + '|' + lum;
      if (sk !== skyKey) { skyKey = sk; bgOf(cv, `linear-gradient(hsl(${hue}, 85%, ${lum}%), #e6f6ff)`); }
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#fff'; g.strokeStyle = 'rgba(42,31,61,.25)'; g.lineWidth = 2;
      clouds.forEach((c) => { g.beginPath(); g.ellipse(c.x, c.y, c.w / 2, 11, 0, 0, Math.PI * 2); g.arc(c.x - c.w * 0.18, c.y - 6, 10, 0, Math.PI * 2); g.arc(c.x + c.w * 0.14, c.y - 8, 12, 0, Math.PI * 2); g.fill(); });
      if (ready(petImg)) g.drawImage(petImg, px - PW / 2, py - PH + 8, PW, PH);
      showTm(Math.max(0, Math.ceil((DUR - el) / 1000)));
      if (py > H + 40 || el >= DUR) { end(); return; }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    root._game = { get clouds() { return clouds; }, get px() { return px; }, get py() { return py; }, get vy() { return vy; }, set steer(v) { steer = v; }, get best() { return best; }, W, H };
    return { stop() { running = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); } };
  }

  // al cerrar el juego también se deja de medir la pantalla
  const wrap = (fn) => (root, finish) => {
    const g = fn(root, (score, max) => { (root._cleanup || []).splice(0).forEach((f) => f()); finish(score, max); });
    return { stop() { g.stop(); (root._cleanup || []).splice(0).forEach((f) => f()); } };
  };
  const ALL = { catch: catchGame, guess: guessGame, memory: memoryGame, bubbles: bubblesGame, simon: simonGame, jump: jumpGame, gol: golGame, tateti: tatetiGame, topos: toposGame, pileta: piletaGame, carrera: carreraGame, nubes: nubesGame };
  N.games = {};
  Object.keys(ALL).forEach((k) => { N.games[k] = wrap(ALL[k]); });
})();
