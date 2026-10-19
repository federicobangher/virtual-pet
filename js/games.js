/* Virtual Pet — minijuegos. Cada juego recibe un contenedor y una función finish(score, max). */
(function () {
  'use strict';
  const N = window.N;
  const art = N.art, snd = N.sound;

  // El lienzo se dibuja a la resolución real de la pantalla (nítido en celulares) con las mismas coordenadas de siempre
  function hiDPI(cv) {
    const W = cv.width, H = cv.height, k = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    if (k > 1) { cv.width = Math.round(W * k); cv.height = Math.round(H * k); cv.getContext('2d').setTransform(k, 0, 0, k, 0, 0); }
    return { W, H };
  }
  // Escribe un número en pantalla sólo si cambió
  const show = (el) => { let last = null; return (v) => { if (v !== last) { last = v; el.textContent = v; } }; };
  function imgFromSVG(svg) {
    const im = new Image();
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return im;
  }

  /* ---------- Atrapá la comida ---------- */
  function catchGame(root, finish) {
    const sp = N.core.state.pet ? N.core.state.pet.species : 'dragon';
    root.innerHTML = `<div class="g-catch"><div class="g-top"><span>Puntos <b class="sc">0</b></span><span>Tiempo <b class="tm">25</b></span></div>
      <canvas class="g-canvas" width="360" height="420" aria-label="Juego: atrapá la comida"></canvas>
      <p class="g-hint">Mové el dedo o el mouse para llevar la canasta.</p></div>`;
    const cv = root.querySelector('canvas'), g = cv.getContext('2d');
    const { W, H } = hiDPI(cv);
    const showSc = show(root.querySelector('.sc')), showTm = show(root.querySelector('.tm'));
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#bfe8ff'); grd.addColorStop(1, '#e9f8ff');
    const imgs = {
      fruit: imgFromSVG(art.itemSVG('fruit', sp)),
      fav: imgFromSVG(art.itemSVG('fav', sp)),
      cake: imgFromSVG(art.itemSVG('cake', sp)),
      rock: imgFromSVG('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M8 34c-2-8 4-18 14-20 9-2 18 4 18 13 0 8-6 13-16 13-9 0-14-1-16-6z" fill="#8d8a9c" stroke="#5f5c70" stroke-width="2.5"/><path d="M16 24c3-3 7-4 10-3" stroke="#b9b6c7" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>'),
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
      const raw = Math.max(0, now - last), dt = Math.min(50, raw); last = now;
      const el = (played += Math.min(250, raw)); // tiempo jugado (si la app pasa a segundo plano, el reloj se pausa)
      const speedUp = 1 + el / DUR;
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnT = 520 / speedUp;
        const r = Math.random();
        const kind = r < 0.22 ? 'rock' : r < 0.5 ? 'fav' : r < 0.62 ? 'cake' : 'fruit';
        items.push({ x: 24 + Math.random() * (W - 48), y: -30, vy: (0.12 + Math.random() * 0.07) * speedUp, kind, rot: Math.random() * 6 });
      }
      // fondo
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.fillStyle = '#9fd67a'; g.fillRect(0, H - 26, W, 26);
      if (flash > 0) { g.fillStyle = `rgba(255,80,90,${flash / 400})`; g.fillRect(0, 0, W, H); flash -= dt; }
      // objetos
      items.forEach((it) => {
        it.y += it.vy * dt; it.rot += dt * 0.002;
        g.save(); g.translate(it.x, it.y); g.rotate(Math.sin(it.rot) * 0.3);
        if (imgs[it.kind].complete) g.drawImage(imgs[it.kind], -22, -22, 44, 44);
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
    return { stop() { running = false; cancelAnimationFrame(raf); } };
  }

  /* ---------- ¿Para dónde mira? ---------- */
  function guessGame(root, finish) {
    const ROUNDS = 5;
    let round = 0, score = 0, busy = false, alive = true;
    root.innerHTML = `<div class="g-guess"><div class="g-top"><span>Ronda <b class="rd">1</b>/${ROUNDS}</span><span>Aciertos <b class="sc">0</b></span></div>
      <div class="gg-pet"></div><p class="gg-msg">¿Para qué lado va a mirar?</p>
      <div class="row gg-btns"><button type="button" class="btn big" data-d="-1">${N.ui.ic('back')} Izquierda</button><button type="button" class="btn big" data-d="1">Derecha ${N.ui.ic('back', 'flipx')}</button></div></div>`;
    const view = new N.ui.PetView(root.querySelector('.gg-pet'));
    view.render(true);
    const msg = root.querySelector('.gg-msg');
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
    let open = [], found = 0, moves = 0, busy = false, alive = true, t0 = Date.now();
    root.innerHTML = `<div class="g-memory"><div class="g-top"><span>Pares <b class="sc">0</b>/6</span><span>Tiempo <b class="tm">${LIMIT}</b></span></div>
      <div class="mem-grid">${deck.map((c, n) => `<button type="button" class="mem-card" data-n="${n}" aria-label="Carta"><span class="mem-back">?</span><span class="mem-front">${art.itemSVG(c.k, sp)}</span></button>`).join('')}</div>
      <p class="g-hint">Encontrá los pares en menos de un minuto.</p></div>`;
    const end = () => {
      if (!alive) return; alive = false; clearInterval(timer);
      const mistakes = Math.max(0, moves - found);
      const score = Math.min(10, Math.round(found * 1.25 + (found === 6 ? Math.max(0, 2.5 - mistakes * 0.25) : 0)));
      setTimeout(() => finish(score, 10), 500);
    };
    const timer = setInterval(() => {
      const left = Math.max(0, LIMIT - Math.floor((Date.now() - t0) / 1000));
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
    return { stop() { alive = false; clearInterval(timer); } };
  }

  /* ---------- Burbujas ---------- */
  function bubblesGame(root, finish) {
    root.innerHTML = `<div class="g-catch"><div class="g-top"><span>Puntos <b class="sc">0</b></span><span>Tiempo <b class="tm">20</b></span></div>
      <canvas class="g-canvas" width="360" height="420" aria-label="Juego: reventá burbujas"></canvas>
      <p class="g-hint">Tocá las burbujas. Las doradas valen 3; las verdes, que tienen olor a caca, te restan.</p></div>`;
    const cv = root.querySelector('canvas'), g = cv.getContext('2d');
    const { W, H } = hiDPI(cv), DUR = 20000, MAX = 30;
    const showSc = show(root.querySelector('.sc')), showTm = show(root.querySelector('.tm'));
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#9fdcff'); grd.addColorStop(1, '#5fb4f0');
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
      const raw = Math.max(0, now - last), dt = Math.min(50, raw); last = now;
      const el = (played += Math.min(250, raw)); // tiempo jugado (si la app pasa a segundo plano, el reloj se pausa)
      spawn -= dt;
      if (spawn <= 0) {
        spawn = 380 - Math.min(180, el / 100);
        const r = Math.random();
        items.push({ x: 30 + Math.random() * (W - 60), y: H + 30, r: 16 + Math.random() * 14, vy: 0.06 + Math.random() * 0.06 + el / 400000, wob: Math.random() * 6, kind: r < 0.12 ? 'gold' : r < 0.27 ? 'bad' : 'ok' });
      }
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
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
    return { stop() { running = false; cancelAnimationFrame(raf); } };
  }

  N.games = { catch: catchGame, guess: guessGame, memory: memoryGame, bubbles: bubblesGame };
})();
