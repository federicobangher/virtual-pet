/* Virtual Pet — animación de la mascota "a cuadros", compartida por el escritorio, la casa y las ventanas.
   En vez de dejar que el navegador anime el dibujo 60 (o 120) veces por segundo con CSS, que obliga a redibujar
   la mascota entera en cada cuadro, un reloj propio mueve sólo las partes que cambian unas pocas veces por
   segundo. Se ve igual de viva y gasta mucha menos batería y CPU.

   2.0: más vida en todas las especies y etapas.
   - Ojos: miran a donde está tu dedo o el mouse (y si no, miran a los costados), parpadean (a veces dos veces
     seguidas) y se entrecierran cuando está cansada.
   - Cabeza: acompaña la mirada, asiente cuando habla, se inclina con curiosidad.
   - Boca: se mueve cuando habla (pico incluido), mastica y se relame.
   - Patas: zapatean, patean, saludan y bailan.
   - Alas: aletean de a ratos, se estiran y saludan. Cola: se mueve con dos ritmos mezclados (más natural).
   - Gestos nuevos: bailar, sacudirse (después del baño), saludar, olfatear, relamerse, aletear, patear y
     "gelatina" (cuando la tocás).

   N.petAnim({
     svg: () => elementoSVG | null,   // el dibujo a animar (null: no hay nada que animar ahora)
     view: () => PetView,              // para saber cuándo empezó un gesto, si habla, si está cansada
     look: () => ({x, y, t}) | null,   // hacia dónde mirar (coordenadas del dibujo) y cuándo se movió el dedo
     ms: { active, idle, sleep, egg }, // milisegundos entre cuadros según lo que esté haciendo
     slow: () => bool,                 // tapada por una ventana: más despacio
     saver: () => bool,                // ahorro de batería: todavía más despacio
     extra(t),                         // algo más para animar en el mismo cuadro (las cacas, por ejemplo)
     autoStop: true,                   // se apaga sola cuando el dibujo desaparece (ventanas, juegos)
   }) → { kick(ahora), stop() }

   En segundo plano (app minimizada, pantalla apagada) no se dibuja nada: el reloj se detiene y vuelve
   a arrancar cuando la app se vuelve a ver. */
(function () {
  'use strict';
  const N = (window.N = window.N || {});
  const TAU = Math.PI * 2;
  const BLINK = 4.2, BLINK_AT = 4.0, BLINK_END = 4.18, BLINK2 = 0.3;
  const FID = 6.5; // cada cuánto puede hacer un "tic" (zapatear, aletear, mover la cola…)
  const wave = (t, per) => 0.5 - 0.5 * Math.cos(TAU * t / per); // 0..1..0
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const r1 = (v) => v.toFixed(1), r2 = (v) => v.toFixed(2), r3 = (v) => v.toFixed(3);
  const hash = (n, k) => { const x = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
  let reducedMq = null;
  try { reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) { /* sin matchMedia */ }
  const reduced = () => !!(reducedMq && reducedMq.matches);
  const ACTS = ['special', 'stretch', 'hop', 'scratch', 'look', 'dance', 'shake', 'wave', 'lick', 'jiggle', 'flap', 'kick', 'sniff'];
  const FIDGETS = ['none', 'tap', 'flutter', 'wag', 'tilt', 'blink2', 'lookup', 'ear', 'none', 'tap', 'wag', 'stomp'];
  const FDUR = { tap: 1.1, flutter: 0.9, wag: 1.4, tilt: 1.6, blink2: 0.6, lookup: 1.5, ear: 0.6, stomp: 1.0, none: 0 };

  N.petAnim = function (o) {
    const MS = Object.assign({ active: 100, idle: 200, sleep: 400, egg: 125 }, o.ms || {});
    let qc = { svg: null, q: {} };
    let seen = false, misses = 0, stopped = false;

    function animate(t) {
      const svg = o.svg();
      if (!svg) return 0;
      seen = true; misses = 0;
      const view = o.view ? o.view() : null;
      if (qc.svg !== svg) qc = { svg, q: {}, hx: +svg.dataset.hx || 100, hy: +svg.dataset.hy || 100, hr: +svg.dataset.hr || 30, dir: +svg.dataset.dir || 1 };
      const Q = (sel) => qc.q[sel] || (qc.q[sel] = svg.querySelectorAll(sel));
      const cl = svg.classList;
      const set = (sel, tf) => Q(sel).forEach((el) => { if (el.style.transform !== tf) el.style.transform = tf; });
      const fade = (el, v) => { if (el.style.opacity !== v) el.style.opacity = v; };
      const fadeAll = (sel, v) => Q(sel).forEach((el) => fade(el, v));
      if (cl.contains('egg')) {
        const per = parseFloat(svg.style.getPropertyValue('--wob')) || 2.4;
        const ph = (t % per) / per;
        let r = 0;
        if (ph > 0.7) { const k = (ph - 0.7) / 0.3; r = Math.sin(k * Math.PI * 3) * 7 * (1 - k); }
        set('.wobble', r ? `rotate(${r1(r)}deg)` : '');
        return ph > 0.66 ? MS.egg : Math.min(1500, (0.7 - ph) * per * 1000); // quieto entre bamboleos: no se dibuja
      }
      const pnow = performance.now();
      const has = (c) => cl.contains(c);
      const baby = has('st-baby'), adult = has('st-adult'), happy = has('mood-happy') || has('mood-love');
      const walk = has('walking'), fly = has('flying'), sleep = has('mood-sleep'), dead = has('mood-dead');
      const sick = has('mood-sick'), sad = has('mood-sad'), eat = has('mood-eat'), spicy = has('mood-spicy');
      const sp = has('sp-dragon') ? 'dragon' : has('sp-bird') ? 'bird' : has('sp-lizard') ? 'lizard' : 'turtle';
      const act = ACTS.find((a) => has('act-' + a)) || null;
      const at = (pnow - (view ? view.actT0 : 0)) / 1000; // tiempo desde que empezó el gesto
      const awake = !sleep && !dead;
      const talking = awake && view && view.talkUntil > pnow && !eat;
      const dir = qc.dir;
      // "tic" de reposo: cada tanto hace algo chiquito (si no está haciendo otra cosa)
      const seg = Math.floor(t / FID), ft = t - seg * FID;
      let fid = 'none';
      if (awake && !act && !walk && !fly && !eat) { fid = FIDGETS[Math.floor(hash(seg, 1) * FIDGETS.length)]; if (ft > FDUR[fid]) fid = 'none'; }
      // a dónde mira: el dedo / el mouse si se movió hace poco
      const L = awake && o.look ? o.look() : null;
      const tracking = !!(L && pnow - L.t < 2600);
      let busy = !!act || walk || fly || eat || talking || tracking || fid !== 'none' || spicy;

      /* ---- cuerpo ---- */
      let bob = '';
      if (act === 'stretch') { const k = Math.sin(Math.PI * Math.min(1, at / 1.5)); bob = `scale(${r3(1 + 0.13 * k)}, ${r3(1 - 0.12 * k)})`; }
      else if (act === 'hop') bob = `translateY(${r1(-24 * Math.abs(Math.sin(Math.PI * at / 0.5)))}px)`;
      else if (act === 'dance') { const b = Math.abs(Math.sin(Math.PI * t / 0.42)); bob = `translateY(${r1(-9 * b)}px) rotate(${r1(9 * Math.sin(Math.PI * t / 0.84))}deg) scale(${r3(1 + 0.04 * b)}, ${r3(1 - 0.04 * b)})`; }
      else if (act === 'shake') { const k = Math.max(0, 1 - at / 1.2); bob = `rotate(${r1(13 * k * Math.sin(TAU * at / 0.13))}deg)`; }
      else if (act === 'jiggle') { const k = Math.exp(-at * 4.5) * Math.sin(TAU * at / 0.32); bob = `scale(${r3(1 + 0.13 * k)}, ${r3(1 - 0.13 * k)})`; }
      else if (act === 'flap') bob = `translateY(${r1(-10 * Math.sin(Math.PI * Math.min(1, at / 1.4)))}px)`;
      else if (act === 'kick') { const k = at < 0.25 ? at / 0.25 : Math.max(0, 1 - (at - 0.25) / 0.35); bob = `rotate(${r1(-7 * k)}deg)`; }
      else if (act === 'sniff') bob = `rotate(${r1(3 * Math.sin(Math.PI * Math.min(1, at / 1.6)))}deg)`;
      // caminando: saltitos y un balanceo de lado a lado al compás de los pasos
      else if (walk) bob = `translateY(${r1(-6 * Math.abs(Math.sin(Math.PI * t / 0.42)))}px) rotate(${r1(2.6 * Math.sin(Math.PI * t / 0.42))}deg)`;
      else if (fly || dead) bob = `translateY(${r1(-7 * wave(t, dead ? 3 : 1.2))}px)`;
      else {
        // quieta: respira (dormida, más hondo y lento). Los bebés además pegan un saltito cada tanto; contenta rebota.
        const k = wave(t, sleep ? 3.8 : 2.6);
        let hop = 0, tx = 0;
        if (baby && !sleep) { const ph = (t % 3.4) / 3.4; if (ph < 0.14) hop = -7 * Math.sin(Math.PI * ph / 0.14); if (ph < 0.16 || ph > 0.97) busy = true; }
        if (happy && !baby) hop = -3 * Math.abs(Math.sin(Math.PI * t / 0.55));
        if (sick) { const sh = (t % 3) < 0.6; if (sh) { tx = 0.9 * Math.sin(t * 60); busy = true; } } // escalofríos
        if (fid === 'stomp') hop = -6 * Math.abs(Math.sin(Math.PI * ft / 0.25)) * (ft < 0.75 ? 1 : 0);
        const sx = 1 + (sleep ? 0.035 : 0.025) * k, sy = 1 - (sleep ? 0.04 : 0.028) * k;
        bob = `translate(${r1(tx)}px, ${r1(hop - (sleep ? 1.5 * k : 0))}px) scale(${r3(sx)}, ${r3(sy)})`;
      }
      set('.bob', bob);

      /* ---- patas ---- */
      let fa = '', fb = '';
      if (act === 'scratch') {
        const a = Math.sin(TAU * at / 0.18);
        fa = `translate(${r1(6 + a)}px, ${r1(-17 + 2 * a)}px) rotate(${(-22 + 4 * a).toFixed(0)}deg)`;
      } else if (walk || act === 'dance') {
        const per = act === 'dance' ? 0.42 : 0.42, a = Math.sin(TAU * t / per);
        fa = `translate(${r1(3 * a)}px, ${r1(-5 * Math.max(0, a))}px)`;
        fb = `translate(${r1(-3 * a)}px, ${r1(-5 * Math.max(0, -a))}px)`;
      } else if (act === 'kick') {
        const k = at < 0.22 ? at / 0.22 : Math.max(0, 1 - (at - 0.22) / 0.4);
        fa = `translate(${r1(10 * k)}px, ${r1(-9 * k)}px) rotate(${r1(-30 * k)}deg)`;
      } else if (fid === 'tap' || (eat && awake)) {
        // zapatea con una pata (comiendo, de contenta)
        const tt = fid === 'tap' ? ft : t;
        fa = `translateY(${r1(-4 * Math.max(0, Math.sin(TAU * tt / 0.36)))}px)`;
      } else if (fid === 'stomp') {
        const a = Math.sin(TAU * ft / 0.5);
        fa = `translateY(${r1(-4 * Math.max(0, a))}px)`; fb = `translateY(${r1(-4 * Math.max(0, -a))}px)`;
      } else if (awake && !fly) {
        // cambia el peso de una pata a la otra, muy de a poco
        const w = Math.sin(TAU * t / 7.3);
        fa = `translateX(${r1(0.8 * w)}px)`; fb = `translateX(${r1(-0.8 * w)}px)`;
      }
      set('.foot-a', fa); set('.foot-b', fb);
      // saludo: el dragón con el bracito, el pájaro con el ala, el lagarto y la tortuga con la pata de adelante
      if (act === 'wave' && sp !== 'dragon' && sp !== 'bird') {
        const k = Math.min(1, at / 0.3) * (at > 1.6 ? Math.max(0, 1 - (at - 1.6) / 0.3) : 1);
        set('.front', `translate(${r1(6 * k)}px, ${r1(-14 * k)}px) rotate(${r1(-38 * k + 14 * k * Math.sin(TAU * at / 0.45))}deg)`);
      }

      /* ---- alas ---- */
      if (!awake) set('.wing', sleep ? `rotate(${r1(-2 * wave(t, 3.8))}deg)` : '');
      else if (fly || act === 'flap' || (act === 'special' && sp === 'bird')) set('.wing', `rotate(${r1(12 - 44 * wave(t, act === 'flap' ? 0.24 : act ? 0.2 : 0.3))}deg)`);
      else if (act === 'dance' || act === 'hop' || happy) set('.wing', `rotate(${r1(-6 - 16 * wave(t, act === 'dance' ? 0.42 : 0.5))}deg)`);
      else if (act === 'wave' && sp === 'bird') set('.wing', `rotate(${r1(-40 + 22 * Math.sin(TAU * at / 0.4))}deg)`);
      else if (act === 'shake') set('.wing', `rotate(${r1(-20 * wave(t, 0.13))}deg)`);
      else if (fid === 'flutter') set('.wing', `rotate(${r1(-26 * wave(ft, 0.22))}deg)`);
      else set('.wing', `rotate(${r1(-9 * wave(t, walk ? 1 : 2.6))}deg)`);

      /* ---- cola: dos ritmos mezclados; más movida en los bebés, cuando está contenta o hace un "tic" ---- */
      let tailAmp = (baby ? 12 : adult ? 7 : 9) * (happy ? 1.4 : 1) * (sleep ? 0.5 : 1) * (fid === 'wag' ? 1.8 : 1) * (act === 'dance' ? 1.6 : 1);
      const tper = sleep ? 4 : happy || fid === 'wag' || act === 'dance' ? 0.9 : 2.2;
      let tail = -tailAmp * (0.65 * wave(t, tper) + 0.35 * wave(t + 0.37, tper * 0.43));
      if (sad) tail = 10 + 2 * Math.sin(TAU * t / 3); // triste: la cola caída
      if (dead) tail = 0;
      set('.tail', tail ? `rotate(${r1(tail)}deg)` : '');

      /* ---- ojos: a dónde mira ---- */
      if (awake) {
        let lx = 0, ly = 0;
        if (tracking) {
          const dx = (L.x - qc.hx) * dir, dy = L.y - qc.hy, d = qc.hr * 2.3;
          lx = clamp(dx / d, -1, 1) * qc.hr * 0.12; ly = clamp(dy / d, -1, 1) * qc.hr * 0.09;
        } else if (fid === 'lookup') ly = -qc.hr * 0.07;
        else if (act === 'sniff') ly = qc.hr * 0.05;
        else {
          const sg = Math.floor(t / 2.7), rnd = (n) => hash(sg, n);
          lx = rnd(1) < 0.45 ? 0 : rnd(2) < 0.5 ? -1.8 : 1.8; ly = rnd(3) < 0.6 ? 0 : rnd(4) < 0.5 ? -0.8 : 0.8;
        }
        set('.eye', lx || ly ? `translate(${r1(lx)}px, ${r1(ly)}px)` : '');
      } else set('.eye', '');
      const bp = t % BLINK, dbl = hash(Math.floor(t / BLINK), 9) < 0.3 || fid === 'blink2';
      const closed = (bp > BLINK_AT && bp < BLINK_END) || (dbl && bp > BLINK_AT - BLINK2 && bp < BLINK_END - BLINK2);
      const tired = awake && view && view.tired;
      set('.eyes.blink', closed ? 'scaleY(0.1)' : tired ? 'scaleY(0.62)' : act === 'jiggle' && at < 0.5 ? 'scaleY(0.55)' : '');

      /* ---- cabeza ---- */
      let head = '';
      if (act === 'scratch') head = `rotate(${r1(9 * Math.sin(Math.PI * Math.min(1, at / 1.5)))}deg)`;
      else if (has('mood-yawn')) head = `rotate(${r1(-7 * Math.sin(Math.PI * Math.min(1, at / 1.6)))}deg)`;
      else if (act === 'dance') head = `rotate(${r1(-9 * Math.sin(Math.PI * t / 0.42))}deg)`;
      else if (act === 'shake') head = `rotate(${r1(-10 * Math.max(0, 1 - at / 1.2) * Math.sin(TAU * at / 0.13))}deg)`;
      else if (act === 'sniff') head = `rotate(${r1(6 + 3 * Math.sin(TAU * at / 0.22))}deg)`;
      else if (act === 'lick') head = `rotate(${r1(-3 * Math.sin(TAU * at / 0.8))}deg)`;
      else if (eat) head = `rotate(${r1(6 * wave(t, 0.32))}deg)`;
      else if (spicy) head = `rotate(${r1(5 * Math.sin(TAU * t / 0.18))}deg)`;
      else if (happy) head = `rotate(${r1(-5 * Math.sin(TAU * t / 1.6))}deg)`;
      else if (talking) head = `rotate(${r1(2.5 * Math.sin(TAU * t / 0.55))}deg)`;
      else if (awake && tracking) {
        const dx = (L.x - qc.hx) * dir, dy = L.y - qc.hy;
        head = `rotate(${r1(clamp(dy / 80, -1, 1) * 7 * (dx >= 0 ? 1 : -1) + clamp(-dx / 160, -1, 1) * 2)}deg)`;
      } else if (fid === 'tilt') head = `rotate(${r1(-11 * Math.sin(Math.PI * Math.min(1, ft / 1.6)))}deg)`;
      else if (fid === 'lookup') head = `rotate(${r1(-6 * Math.sin(Math.PI * Math.min(1, ft / 1.5)))}deg)`;
      else if (sad || sick) head = `rotate(${r1(4 + 1.5 * Math.sin(TAU * t / 4))}deg)`;
      else if (awake) head = `rotate(${r1(2.5 * Math.sin(TAU * t / 5.3))}deg)`; // la cabeza se inclina apenas
      if (!(act === 'special' && sp === 'turtle')) set('.head', head);

      /* ---- boca ---- */
      // hablando: se abre y se cierra (con un ritmo irregular, como sílabas)
      const open = talking && (Math.sin(t * 23) + Math.sin(t * 37 + 1)) > 0.25;
      fadeAll('.talk', open ? '1' : '0');
      fadeAll('.mouth', open ? '0' : '1');
      set('.blo', open ? 'rotate(16deg)' : '');
      // relamerse: la lengua pasa por los labios
      const lk = act === 'lick' && at < 1.4;
      fadeAll('.lick', lk ? '1' : '0');
      if (lk) set('.lick', `rotate(${r1(-25 + 50 * wave(at, 0.7))}deg)`);
      const on = Math.floor(t / 0.16) % 2 === 0;
      Q('.chomp .open').forEach((e) => fade(e, on ? '1' : '0'));
      Q('.chomp .shut').forEach((e) => fade(e, on ? '0' : '1'));
      set('.peck', `rotate(${r1(8 * wave(t, 0.32))}deg)`);
      set('.tongue-out', `scaleY(${r2(0.8 + 0.25 * wave(t, 0.2))})`);

      /* ---- partes de cada especie ---- */
      set('.crest', `rotate(${r1(-6 * wave(t, happy || act === 'dance' ? 0.6 : 2.4) - (fid === 'ear' ? 10 * wave(ft, 0.3) : 0))}deg)`);
      set('.frill', `scale(${r3(1 + (fid === 'ear' || act === 'dance' ? 0.12 : 0.05) * wave(t, fid === 'ear' ? 0.3 : 3))})`);
      set('.ear', `rotate(${r1(fid === 'ear' ? -18 * wave(ft, 0.2) : sleep ? 0 : -5 * wave(t, 3.3))}deg)`);
      if (act === 'wave' && sp === 'dragon') set('.arm', `rotate(${r1(-70 + 22 * Math.sin(TAU * at / 0.42))}deg)`);
      else if (act === 'dance') set('.arm', `rotate(${r1(-40 * wave(t, 0.42))}deg)`);
      else set('.arm', happy ? `rotate(${r1(-18 * wave(t, 0.7))}deg)` : `rotate(${r1(-4 * wave(t, 3.1))}deg)`);
      Q('.zzz:not(.notes) .z').forEach((z, i) => {
        const ph = ((t + i * 0.8) % 2.4) / 2.4;
        fade(z, r2(0.5 + 0.5 * (ph < 0.25 ? ph / 0.25 : 1 - (ph - 0.25) / 0.75))); // nunca se borran: se ven sobre cualquier fondo
        const tf = `translate(0px, ${r1(4 - 18 * ph)}px) scale(${r2(0.7 + 0.4 * ph)})`;
        if (z.style.transform !== tf) z.style.transform = tf;
      });
      Q('.steam').forEach((e, i) => { const ph = ((t + i * 0.33) % 1) / 1; e.style.transform = `translate(0px, ${r1(-14 * ph)}px) scale(${r2(0.6 + 0.7 * ph)})`; fade(e, r2(1 - ph)); });
      set('.sweat', `translateY(${r1(8 * ((t % 1.4) / 1.4))}px)`);
      if (act === 'special') {
        if (sp === 'dragon') {
          const g = at < 0.27 ? at / 0.27 : at < 1.45 ? 1 : Math.max(0, 1 - (at - 1.45) / 0.35);
          Q('.flame').forEach((e) => { e.style.transform = `scale(${r2(g)}, ${r2(0.3 + 0.7 * g)})`; fade(e, r2(g)); });
          const fl = Math.sin(t * 40);
          set('.flame-in', `scale(${r3(1 + 0.07 * fl)}, ${r3(1 - 0.1 * fl)})`);
        } else if (sp === 'bird') {
          set('.bob', `translateY(${r1(-20 * Math.sin(Math.PI * Math.min(1, at / 2)))}px)`);
          Q('.notes .z').forEach((z, i) => {
            const ph = ((at + i * 0.4) % 1.2) / 1.2;
            fade(z, r2(ph < 0.25 ? ph / 0.25 : 1 - (ph - 0.25) / 0.75));
            z.style.transform = `translate(0px, ${r1(4 - 18 * ph)}px)`;
          });
        } else if (sp === 'turtle') {
          const k = at / 2.4;
          const [dx, dy, sc] = k < 0.2 ? [-24 * k / 0.2, 8 * k / 0.2, 1 - 0.45 * k / 0.2] : k < 0.55 ? [-24, 8, 0.55] : k < 0.8 ? [-24 + 26 * (k - 0.55) / 0.25, 8 - 10 * (k - 0.55) / 0.25, 0.55 + 0.48 * (k - 0.55) / 0.25] : [2 * (1 - (k - 0.8) / 0.2), -2 * (1 - (k - 0.8) / 0.2), 1.03 - 0.03 * (k - 0.8) / 0.2];
          set('.head', `translate(${r1(dx)}px, ${r1(dy)}px) scale(${r3(sc)})`);
        } else if (sp === 'lizard') {
          const ph = (at % 0.5) / 0.5;
          const k = at < 1.5 ? (ph < 0.35 ? ph / 0.35 : ph < 0.65 ? 1 : 1 - (ph - 0.65) / 0.35) : 0;
          set('.ltongue', `scaleX(${r2(k)})`);
        }
      }
      set('.dizzy', `rotate(${((t / 2.4) * 360 % 360).toFixed(0)}deg)`);
      set('.halo', `translateY(${r1(-7 * wave(t, 3))}px)`);
      set('.tear', `translateY(${r1(14 * ((t % 2) / 2))}px)`);
      Q('.twinkle').forEach((e, i) => { const k = wave(t + i * 0.6, 1.8); e.style.transform = `scale(${r2(0.78 + 0.27 * k)})`; fade(e, r2(0.7 + 0.3 * k)); }); // brillan sin desaparecer: son pintitas de la piel
      let next = sleep || dead ? MS.sleep : busy || has('mood-yawn') || act ? MS.active : MS.idle;
      // que el parpadeo no se pierda entre dos cuadros: un cuadro justo al cerrar los ojos y otro al abrirlos
      if (awake && Q('.eyes.blink').length) {
        const marks = dbl ? [BLINK_AT - BLINK2, BLINK_END - BLINK2, BLINK_AT, BLINK_END] : [BLINK_AT, BLINK_END];
        for (const m of marks) { const d = ((m - bp + BLINK) % BLINK) * 1000 + 15; if (d < next) next = d; }
      }
      // que el "tic" de reposo empiece a tiempo
      if (awake && !busy) { const toSeg = (FID - ft) * 1000 + 10; if (toSeg < next) next = toSeg; }
      return next;
    }

    const t0 = performance.now();
    let timer = 0, waitingVisible = false, lastRun = -1e9, dueAt = 0;
    function onVisible() {
      if (document.hidden || stopped) return;
      document.removeEventListener('visibilitychange', onVisible);
      waitingVisible = false;
      loop();
    }
    const schedule = (ms) => { clearTimeout(timer); dueAt = performance.now() + ms; timer = setTimeout(loop, ms); };
    function loop() {
      clearTimeout(timer); timer = 0;
      if (stopped) return;
      lastRun = performance.now();
      // en segundo plano no se dibuja nada: se espera a que la app se vuelva a ver (sin despertar al procesador)
      if (document.hidden) {
        if (!waitingVisible) { waitingVisible = true; document.addEventListener('visibilitychange', onVisible); }
        return;
      }
      let next = 300;
      const t = (performance.now() - t0) / 1000;
      try {
        // movimiento reducido (accesibilidad): la mascota queda quieta, con las Z de dormir a la vista
        if (reduced()) { animate(0); next = 2000; }
        else {
          next = animate(t);
          if (!next) { // no hay dibujo
            if (o.autoStop && (seen || ++misses > 20)) { stopped = true; return; }
            // (2.0.3) escondida (panel cerrado, mascota dentro de la casa): se fija de vez en cuando; cuando vuelve
            // a verse, kick() la despierta enseguida. Antes revisaba 3 veces por segundo para siempre.
            next = 1500;
          } else {
            if (o.extra) o.extra(t);
            if (o.slow && o.slow()) next = Math.max(next, 250);
            if (o.saver && o.saver()) next = Math.max(next * 2, 160);
          }
        }
      } catch (e) { /* seguir animando igual */ }
      schedule(Math.max(16, next));
    }
    loop();
    // kick: para que un cambio de dibujo (otro gesto, otra cara) se anime enseguida y no al cuadro siguiente.
    // (2.0.3) Como mucho un cuadro cada 45 ms: mover el mouse o el dedo por encima llamaba a kick() en cada
    // movimiento (60 a 120 veces por segundo) y la mascota se redibujaba entera cada vez. En Windows, con el panel
    // abierto, eso duplicaba el consumo de CPU sólo por pasar el mouse.
    // kick(true): el dibujo cambió (otra cara, otro gesto): se anima ya. kick(): el mouse o el dedo se movió (para
    // que los ojos lo sigan): alcanza con el ritmo normal de "moviéndose".
    const GAP = Math.max(45, MS.active * 0.9);
    return {
      kick(now) {
        if (stopped || waitingVisible) return;
        const t = performance.now(), wait = lastRun + (now ? 16 : GAP) - t;
        if (wait <= 0) { loop(); return; }
        if (!timer || dueAt > t + wait) schedule(wait);
      },
      stop() { stopped = true; clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible); },
      get running() { return !stopped; },
    };
  };
})();
