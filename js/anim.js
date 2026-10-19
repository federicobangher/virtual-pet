/* Virtual Pet — animación de la mascota "a cuadros", compartida por el escritorio y el celular.
   En vez de dejar que el navegador anime el dibujo 60 veces por segundo con CSS (que obliga a redibujar
   la mascota entera en cada cuadro), un reloj propio mueve sólo las partes que cambian, unas pocas veces
   por segundo. Se ve igual de viva y gasta mucha menos batería y CPU.
   N.petAnim({ svg: () => elementoSVG|null, view: () => PetView, ms: { active, idle, sleep, egg }, extra(t) }) */
(function () {
  'use strict';
  const N = (window.N = window.N || {});
  const TAU = Math.PI * 2;
  const wave = (t, per) => 0.5 - 0.5 * Math.cos(TAU * t / per); // 0..1..0
  const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

  N.petAnim = function (o) {
    const MS = Object.assign({ active: 100, idle: 200, sleep: 400, egg: 125 }, o.ms || {});
    let qc = { svg: null, q: {} };

    function animate(t) {
      const svg = o.svg();
      if (!svg) return 300;
      const view = o.view();
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
        return ph > 0.66 ? MS.egg : Math.min(400, (0.7 - ph) * per * 1000); // quieto entre bamboleos
      }
      const walk = cl.contains('walking'), fly = cl.contains('flying'), sleep = cl.contains('mood-sleep'), dead = cl.contains('mood-dead');
      const at = (performance.now() - (view ? view.actT0 : 0)) / 1000; // tiempo desde que empezó el gesto
      const gesture = cl.contains('act-special') || cl.contains('act-stretch') || cl.contains('act-hop') || cl.contains('act-scratch') || cl.contains('mood-yawn');
      if (cl.contains('act-stretch')) { const k = Math.sin(Math.PI * Math.min(1, at / 1.5)); set('.bob', `scale(${(1 + 0.13 * k).toFixed(3)}, ${(1 - 0.12 * k).toFixed(3)})`); }
      else if (cl.contains('act-hop')) set('.bob', `translateY(${(-24 * Math.abs(Math.sin(Math.PI * at / 0.5))).toFixed(1)}px)`);
      else if (walk) set('.bob', `translateY(${(-6 * Math.abs(Math.sin(Math.PI * t / 0.42))).toFixed(1)}px)`);
      else if (fly || dead) set('.bob', `translateY(${(-7 * wave(t, dead ? 3 : 1.2)).toFixed(1)}px)`);
      else { const k = wave(t, sleep ? 3.8 : 2.6); set('.bob', `scale(${(1 + 0.025 * k).toFixed(3)}, ${(1 - 0.028 * k).toFixed(3)})`); }
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
      set('.tail', `rotate(${(-7 * wave(t, sleep ? 4 : 2.2)).toFixed(1)}deg)`);
      const bp = t % 4.2;
      set('.eyes.blink', bp > 4.0 && bp < 4.18 ? 'scaleY(0.1)' : '');
      if (cl.contains('act-scratch')) set('.head', `rotate(${(9 * Math.sin(Math.PI * Math.min(1, at / 1.5))).toFixed(1)}deg)`);
      else if (cl.contains('mood-yawn')) set('.head', `rotate(${(-7 * Math.sin(Math.PI * Math.min(1, at / 1.6))).toFixed(1)}deg)`);
      else if (cl.contains('mood-happy')) set('.head', `rotate(${(-5 * Math.sin(TAU * t / 1.6)).toFixed(1)}deg)`);
      else if (cl.contains('mood-eat')) set('.head', `rotate(${(6 * wave(t, 0.32)).toFixed(1)}deg)`);
      else set('.head', '');
      const on = Math.floor(t / 0.16) % 2 === 0;
      Q('.chomp .open').forEach((e) => fade(e, on ? '1' : '0'));
      Q('.chomp .shut').forEach((e) => fade(e, on ? '0' : '1'));
      set('.peck', `rotate(${(8 * wave(t, 0.32)).toFixed(1)}deg)`);
      Q('.zzz:not(.notes) .z').forEach((z, i) => {
        const ph = ((t + i * 0.8) % 2.4) / 2.4;
        fade(z, (ph < 0.25 ? ph / 0.25 : 1 - (ph - 0.25) / 0.75).toFixed(2));
        z.style.transform = `translate(0px, ${(4 - 18 * ph).toFixed(1)}px) scale(${(0.7 + 0.4 * ph).toFixed(2)})`;
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
      Q('.twinkle').forEach((e, i) => { const k = wave(t + i * 0.6, 1.8); e.style.transform = `scale(${(0.4 + 0.7 * k).toFixed(2)})`; fade(e, (0.3 + 0.7 * k).toFixed(2)); });
      return sleep || dead ? MS.sleep : walk || fly || gesture || cl.contains('mood-eat') ? MS.active : MS.idle;
    }

    const t0 = performance.now();
    let timer = 0;
    function loop() {
      let next = 300;
      const t = (performance.now() - t0) / 1000;
      try {
        if (document.hidden) next = 1000; // en segundo plano no se dibuja nada
        else if (reduced()) next = 1000;
        else {
          next = animate(t);
          if (o.extra) o.extra(t);
          if (o.slow && o.slow()) next = Math.max(next, 250); // tapada por una ventana: más despacio
        }
      } catch (e) { /* seguir animando igual */ }
      timer = setTimeout(loop, next);
    }
    loop();
    // para que un cambio de dibujo (otro gesto, otra cara) se anime enseguida y no al cuadro siguiente
    return { kick() { clearTimeout(timer); loop(); } };
  };
})();
