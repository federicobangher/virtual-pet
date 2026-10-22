/* Virtual Pet — animación de la mascota "a cuadros", compartida por el escritorio y el celular.
   En vez de dejar que el navegador anime el dibujo 60 (o 120) veces por segundo con CSS, que obliga a redibujar
   la mascota entera en cada cuadro, un reloj propio mueve sólo las partes que cambian unas pocas veces por
   segundo. Se ve igual de viva y gasta mucha menos batería y CPU.

   N.petAnim({
     svg: () => elementoSVG | null,   // el dibujo a animar (null: no hay nada que animar ahora)
     view: () => PetView,              // para saber cuándo empezó un gesto
     ms: { active, idle, sleep, egg }, // milisegundos entre cuadros según lo que esté haciendo
     slow: () => bool,                 // tapada por una ventana: más despacio
     saver: () => bool,                // ahorro de batería: todavía más despacio
     extra(t),                         // algo más para animar en el mismo cuadro (las cacas, por ejemplo)
     autoStop: true,                   // se apaga sola cuando el dibujo desaparece (ventanas, juegos)
   }) → { kick(), stop() }

   En segundo plano (app minimizada, pantalla apagada) no se dibuja nada: el reloj se detiene y vuelve
   a arrancar cuando la app se vuelve a ver. */
(function () {
  'use strict';
  const N = (window.N = window.N || {});
  const TAU = Math.PI * 2;
  const BLINK = 4.2, BLINK_AT = 4.0, BLINK_END = 4.18;
  const wave = (t, per) => 0.5 - 0.5 * Math.cos(TAU * t / per); // 0..1..0
  let reducedMq = null;
  try { reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) { /* sin matchMedia */ }
  const reduced = () => !!(reducedMq && reducedMq.matches);

  N.petAnim = function (o) {
    const MS = Object.assign({ active: 100, idle: 200, sleep: 400, egg: 125 }, o.ms || {});
    let qc = { svg: null, q: {} };
    let seen = false, misses = 0, stopped = false;

    function animate(t) {
      const svg = o.svg();
      if (!svg) return 0;
      seen = true; misses = 0;
      const view = o.view ? o.view() : null;
      if (qc.svg !== svg) qc = { svg, q: {} };
      const Q = (sel) => qc.q[sel] || (qc.q[sel] = svg.querySelectorAll(sel));
      const cl = svg.classList;
      const set = (sel, tf) => Q(sel).forEach((el) => { if (el.style.transform !== tf) el.style.transform = tf; });
      const fade = (el, v) => { if (el.style.opacity !== v) el.style.opacity = v; };
      if (cl.contains('egg')) {
        const per = parseFloat(svg.style.getPropertyValue('--wob')) || 2.4;
        const ph = (t % per) / per;
        let r = 0;
        if (ph > 0.7) { const k = (ph - 0.7) / 0.3; r = Math.sin(k * Math.PI * 3) * 7 * (1 - k); }
        set('.wobble', r ? `rotate(${r.toFixed(1)}deg)` : '');
        return ph > 0.66 ? MS.egg : Math.min(1500, (0.7 - ph) * per * 1000); // quieto entre bamboleos: no se dibuja
      }
      let hopping = false;
      const baby = cl.contains('st-baby'), adult = cl.contains('st-adult'), happy = cl.contains('mood-happy');
      const walk = cl.contains('walking'), fly = cl.contains('flying'), sleep = cl.contains('mood-sleep'), dead = cl.contains('mood-dead');
      const at = (performance.now() - (view ? view.actT0 : 0)) / 1000; // tiempo desde que empezó el gesto
      const gesture = cl.contains('act-special') || cl.contains('act-stretch') || cl.contains('act-hop') || cl.contains('act-scratch') || cl.contains('mood-yawn') || cl.contains('act-look');
      if (cl.contains('act-stretch')) { const k = Math.sin(Math.PI * Math.min(1, at / 1.5)); set('.bob', `scale(${(1 + 0.13 * k).toFixed(3)}, ${(1 - 0.12 * k).toFixed(3)})`); }
      else if (cl.contains('act-hop')) set('.bob', `translateY(${(-24 * Math.abs(Math.sin(Math.PI * at / 0.5))).toFixed(1)}px)`);
      // caminando: saltitos y un balanceo de lado a lado al compás de los pasos
      else if (walk) set('.bob', `translateY(${(-6 * Math.abs(Math.sin(Math.PI * t / 0.42))).toFixed(1)}px) rotate(${(2.6 * Math.sin(Math.PI * t / 0.42)).toFixed(1)}deg)`);
      else if (fly || dead) set('.bob', `translateY(${(-7 * wave(t, dead ? 3 : 1.2)).toFixed(1)}px)`);
      else {
        // quieta: respira (dormida, más hondo y lento). Los bebés además pegan un saltito cada tanto.
        const k = wave(t, sleep ? 3.8 : 2.6);
        let hop = 0;
        if (baby && !sleep) { const ph = (t % 3.4) / 3.4; if (ph < 0.14) hop = -7 * Math.sin(Math.PI * ph / 0.14); hopping = ph < 0.16 || ph > 0.97; }
        const sx = 1 + (sleep ? 0.035 : 0.025) * k, sy = 1 - (sleep ? 0.04 : 0.028) * k;
        set('.bob', `translateY(${(hop - (sleep ? 1.5 * k : 0)).toFixed(1)}px) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`);
      }
      if (cl.contains('act-scratch')) {
        const a = Math.sin(TAU * at / 0.18);
        set('.foot-a', `translate(${(6 + a).toFixed(1)}px, ${(-17 + 2 * a).toFixed(1)}px) rotate(${(-22 + 4 * a).toFixed(0)}deg)`);
        set('.foot-b', '');
      } else if (walk) {
        const a = Math.sin(TAU * t / 0.42);
        set('.foot-a', `translate(${(3 * a).toFixed(1)}px, ${(-5 * Math.max(0, a)).toFixed(1)}px)`);
        set('.foot-b', `translate(${(-3 * a).toFixed(1)}px, ${(-5 * Math.max(0, -a)).toFixed(1)}px)`);
      } else set('.foot', '');
      if (sleep || dead) set('.wing', '');
      else set('.wing', fly ? `rotate(${(12 - 44 * wave(t, 0.3)).toFixed(1)}deg)` : `rotate(${(-9 * wave(t, walk ? 1 : 2.6)).toFixed(1)}deg)`);
      // la cola: más movida en los bebés y cuando está contenta
      const tailAmp = (baby ? 12 : adult ? 7 : 9) * (happy ? 1.4 : 1) * (sleep ? 0.5 : 1);
      set('.tail', `rotate(${(-tailAmp * wave(t, sleep ? 4 : happy ? 1.1 : 2.2)).toFixed(1)}deg)`);
      // mira para los costados cada tanto (los ojos se corren un poquito)
      if (!sleep && !dead) {
        const seg = Math.floor(t / 2.7), rnd = (n) => { const x = Math.sin(seg * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
        const lx = rnd(1) < 0.45 ? 0 : rnd(2) < 0.5 ? -1.8 : 1.8, ly = rnd(3) < 0.6 ? 0 : rnd(4) < 0.5 ? -0.8 : 0.8;
        set('.eye', lx || ly ? `translate(${lx}px, ${ly}px)` : '');
      } else set('.eye', '');
      set('.crest', `rotate(${(-6 * wave(t, happy ? 0.9 : 2.4)).toFixed(1)}deg)`);
      set('.frill', `scale(${(1 + 0.05 * wave(t, 3)).toFixed(3)})`);
      set('.arm', happy ? `rotate(${(-18 * wave(t, 0.7)).toFixed(1)}deg)` : `rotate(${(-4 * wave(t, 3.1)).toFixed(1)}deg)`);
      const bp = t % BLINK;
      set('.eyes.blink', bp > BLINK_AT && bp < BLINK_END ? 'scaleY(0.1)' : '');
      if (cl.contains('act-scratch')) set('.head', `rotate(${(9 * Math.sin(Math.PI * Math.min(1, at / 1.5))).toFixed(1)}deg)`);
      else if (cl.contains('mood-yawn')) set('.head', `rotate(${(-7 * Math.sin(Math.PI * Math.min(1, at / 1.6))).toFixed(1)}deg)`);
      else if (cl.contains('mood-happy')) set('.head', `rotate(${(-5 * Math.sin(TAU * t / 1.6)).toFixed(1)}deg)`);
      else if (cl.contains('mood-eat')) set('.head', `rotate(${(6 * wave(t, 0.32)).toFixed(1)}deg)`);
      else if (!sleep && !dead) set('.head', `rotate(${(2.5 * Math.sin(TAU * t / 5.3)).toFixed(1)}deg)`); // la cabeza se inclina apenas
      else set('.head', '');
      const on = Math.floor(t / 0.16) % 2 === 0;
      Q('.chomp .open').forEach((e) => fade(e, on ? '1' : '0'));
      Q('.chomp .shut').forEach((e) => fade(e, on ? '0' : '1'));
      set('.peck', `rotate(${(8 * wave(t, 0.32)).toFixed(1)}deg)`);
      Q('.zzz:not(.notes) .z').forEach((z, i) => {
        const ph = ((t + i * 0.8) % 2.4) / 2.4;
        fade(z, (0.5 + 0.5 * (ph < 0.25 ? ph / 0.25 : 1 - (ph - 0.25) / 0.75)).toFixed(2)); // nunca se borran: se ven sobre cualquier fondo
        const tf = `translate(0px, ${(4 - 18 * ph).toFixed(1)}px) scale(${(0.7 + 0.4 * ph).toFixed(2)})`;
        if (z.style.transform !== tf) z.style.transform = tf;
      });
      if (cl.contains('act-special')) {
        if (cl.contains('sp-dragon')) {
          const g = at < 0.27 ? at / 0.27 : at < 1.45 ? 1 : Math.max(0, 1 - (at - 1.45) / 0.35);
          Q('.flame').forEach((e) => { e.style.transform = `scale(${g.toFixed(2)}, ${(0.3 + 0.7 * g).toFixed(2)})`; fade(e, g.toFixed(2)); });
          const fl = Math.sin(t * 40);
          set('.flame-in', `scale(${(1 + 0.07 * fl).toFixed(3)}, ${(1 - 0.1 * fl).toFixed(3)})`);
        } else if (cl.contains('sp-bird')) {
          set('.wing', `rotate(${(12 - 44 * wave(t, 0.2)).toFixed(1)}deg)`);
          set('.bob', `translateY(${(-20 * Math.sin(Math.PI * Math.min(1, at / 2))).toFixed(1)}px)`);
          Q('.notes .z').forEach((z, i) => {
            const ph = ((at + i * 0.4) % 1.2) / 1.2;
            fade(z, (ph < 0.25 ? ph / 0.25 : 1 - (ph - 0.25) / 0.75).toFixed(2));
            z.style.transform = `translate(0px, ${(4 - 18 * ph).toFixed(1)}px)`;
          });
        } else if (cl.contains('sp-turtle')) {
          const k = at / 2.4;
          const [dx, dy, sc] = k < 0.2 ? [-24 * k / 0.2, 8 * k / 0.2, 1 - 0.45 * k / 0.2] : k < 0.55 ? [-24, 8, 0.55] : k < 0.8 ? [-24 + 26 * (k - 0.55) / 0.25, 8 - 10 * (k - 0.55) / 0.25, 0.55 + 0.48 * (k - 0.55) / 0.25] : [2 * (1 - (k - 0.8) / 0.2), -2 * (1 - (k - 0.8) / 0.2), 1.03 - 0.03 * (k - 0.8) / 0.2];
          set('.head', `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${sc.toFixed(3)})`);
        } else if (cl.contains('sp-lizard')) {
          const ph = (at % 0.5) / 0.5;
          const k = at < 1.5 ? (ph < 0.35 ? ph / 0.35 : ph < 0.65 ? 1 : 1 - (ph - 0.65) / 0.35) : 0;
          set('.ltongue', `scaleX(${k.toFixed(2)})`);
        }
      }
      set('.dizzy', `rotate(${((t / 2.4) * 360 % 360).toFixed(0)}deg)`);
      set('.halo', `translateY(${(-7 * wave(t, 3)).toFixed(1)}px)`);
      set('.tear', `translateY(${(14 * ((t % 2) / 2)).toFixed(1)}px)`);
      Q('.twinkle').forEach((e, i) => { const k = wave(t + i * 0.6, 1.8); e.style.transform = `scale(${(0.78 + 0.27 * k).toFixed(2)})`; fade(e, (0.7 + 0.3 * k).toFixed(2)); }); // brillan sin desaparecer: son pintitas de la piel
      let next = sleep || dead ? MS.sleep : walk || fly || gesture || hopping || cl.contains('mood-eat') ? MS.active : MS.idle;
      // que el parpadeo no se pierda entre dos cuadros: un cuadro justo al cerrar los ojos y otro al abrirlos
      if (!sleep && !dead && Q('.eyes.blink').length) {
        if (bp > BLINK_AT && bp < BLINK_END) next = Math.min(next, (BLINK_END - bp) * 1000 + 15);
        else { const toBlink = ((BLINK_AT - bp + BLINK) % BLINK) * 1000 + 15; if (toBlink < next) next = toBlink; }
      }
      return next;
    }

    const t0 = performance.now();
    let timer = 0, waitingVisible = false;
    function onVisible() {
      if (document.hidden || stopped) return;
      document.removeEventListener('visibilitychange', onVisible);
      waitingVisible = false;
      loop();
    }
    function loop() {
      clearTimeout(timer); timer = 0;
      if (stopped) return;
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
            next = 300;
          } else {
            if (o.extra) o.extra(t);
            if (o.slow && o.slow()) next = Math.max(next, 250);
            if (o.saver && o.saver()) next = Math.max(next * 2, 160);
          }
        }
      } catch (e) { /* seguir animando igual */ }
      timer = setTimeout(loop, next);
    }
    loop();
    // kick: para que un cambio de dibujo (otro gesto, otra cara) se anime enseguida y no al cuadro siguiente
    return {
      kick() { if (stopped) return; if (!waitingVisible) loop(); },
      stop() { stopped = true; clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible); },
      get running() { return !stopped; },
    };
  };
})();
