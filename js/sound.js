/* Virtual Pet — sonidos sintetizados (sin archivos). */
(function () {
  'use strict';
  const N = (window.N = window.N || {});
  let ctx = null, master = null, unlocked = false;
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, () => { unlocked = true; }, { capture: true, passive: true }));
  function ac() {
    if (!unlocked) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  // Después de sonar, el audio se apaga solo: un AudioContext prendido mantiene despierto el parlante
  // del celular y gasta batería aunque no suene nada.
  let idleT = 0, busyUntil = 0;
  function sleepLater(dur) {
    if (!ctx) return;
    busyUntil = Math.max(busyUntil, ctx.currentTime + dur);
    clearTimeout(idleT);
    idleT = setTimeout(function check() {
      if (!ctx) return;
      if (ctx.currentTime < busyUntil) { idleT = setTimeout(check, (busyUntil - ctx.currentTime) * 1000 + 300); return; }
      if (ctx.state === 'running') ctx.suspend().catch(() => {});
    }, (dur + 1.5) * 1000);
  }
  const enabled = () => !N.core || !N.core.state || N.core.state.settings.sound;

  function tone(freq, dur, opt) {
    const c = ac(); if (!c) return;
    opt = opt || {};
    const t0 = c.currentTime + (opt.at || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = opt.type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (opt.to) o.frequency.exponentialRampToValueAtTime(opt.to, t0 + dur);
    const v = opt.vol == null ? 1 : opt.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
    o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (e) {} };
    sleepLater((opt.at || 0) + dur + 0.05);
  }
  function seq(notes, type, step, vol) { notes.forEach((f, i) => f && tone(f, step * 1.3, { at: i * step, type, vol })); }

  const FX = {
    tap: () => tone(660, 0.06, { type: 'triangle', vol: 0.5 }),
    coin: () => { tone(988, 0.08, { type: 'square', vol: 0.35 }); tone(1319, 0.18, { type: 'square', vol: 0.35, at: 0.08 }); },
    eat: () => { for (let i = 0; i < 3; i++) tone(180 + Math.random() * 60, 0.07, { type: 'square', vol: 0.4, at: i * 0.18 }); },
    happy: () => seq([523, 659, 784, 1047], 'triangle', 0.09, 0.6),
    sad: () => seq([440, 392, 330], 'sine', 0.18, 0.5),
    alert: () => { tone(880, 0.12, { type: 'triangle', vol: 0.6 }); tone(660, 0.16, { type: 'triangle', vol: 0.6, at: 0.14 }); },
    bath: () => { for (let i = 0; i < 6; i++) tone(500 + Math.random() * 700, 0.08, { at: i * 0.07, to: 1400, vol: 0.35 }); },
    sleep: () => seq([392, 330, 262], 'sine', 0.22, 0.4),
    wake: () => seq([262, 330, 392], 'triangle', 0.12, 0.5),
    warm: () => tone(300, 0.25, { type: 'sine', to: 520, vol: 0.4 }),
    hatch: () => seq([523, 0, 523, 659, 784, 0, 659, 1047], 'square', 0.1, 0.35),
    grow: () => seq([392, 494, 587, 784, 0, 784, 988, 1175, 1568], 'triangle', 0.09, 0.55),
    death: () => seq([392, 370, 349, 330, 0, 262], 'sine', 0.32, 0.5),
    bad: () => tone(160, 0.22, { type: 'sawtooth', vol: 0.3, to: 90 }),
    good: () => tone(880, 0.09, { type: 'triangle', vol: 0.5, to: 1320 }),
    note: (i) => tone([392, 494, 587, 698][i] || 440, 0.28, { type: 'triangle', vol: 0.55 }),
    // trucos especiales
    fire: () => {
      tone(200, 0.6, { type: 'sawtooth', to: 70, vol: 0.35 });
      for (let i = 0; i < 8; i++) tone(300 + Math.random() * 500, 0.05, { type: 'square', at: 0.1 + i * 0.12, vol: 0.12 });
    },
    song: () => seq([1568, 1760, 2093, 1760, 0, 2349, 2093, 1760, 2093], 'sine', 0.13, 0.35),
    // 2.0: música para bailar (living) y la bocina del auto (garaje)
    dance: () => { const b = [262, 0, 330, 392, 0, 330, 440, 392]; seq(b.concat(b), 'triangle', 0.24, 0.45); for (let i = 0; i < 16; i++) tone(110, 0.06, { type: 'square', at: i * 0.24, vol: 0.18 }); },
    honk: () => { tone(415, 0.18, { type: 'square', vol: 0.35 }); tone(415, 0.28, { type: 'square', at: 0.24, vol: 0.35 }); },
    hide: () => { tone(500, 0.18, { type: 'triangle', to: 220, vol: 0.4 }); tone(260, 0.16, { type: 'triangle', at: 1.4, to: 620, vol: 0.4 }); },
    tongue: () => { for (let i = 0; i < 3; i++) tone(900, 0.08, { type: 'sine', at: i * 0.5, to: 1900, vol: 0.3 }); },
    voice: (sp) => {
      if (sp === 'bird') { tone(1800, 0.08, { to: 2600, vol: 0.4 }); tone(2000, 0.1, { at: 0.11, to: 2900, vol: 0.4 }); }
      else if (sp === 'turtle') { tone(520, 0.12, { type: 'sine', to: 420, vol: 0.4 }); tone(440, 0.16, { type: 'sine', at: 0.14, to: 360, vol: 0.35 }); }
      else if (sp === 'lizard') { for (let i = 0; i < 3; i++) tone(1200, 0.025, { type: 'square', at: i * 0.06, vol: 0.25 }); }
      else { tone(220, 0.28, { type: 'sawtooth', to: 140, vol: 0.25 }); tone(330, 0.12, { type: 'triangle', at: 0.05, to: 260, vol: 0.3 }); }
    },
  };

  N.sound = {
    play(name, arg) { if (!enabled()) return; try { FX[name] && FX[name](arg); } catch (e) { /* sin audio */ } },
    // (con el sonido apagado no se crea el audio: en Windows eso levanta un proceso más de Chromium)
    unlock() { unlocked = true; if (!enabled()) return; try { ac(); } catch (e) {} },
  };
})();
