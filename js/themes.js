/* Virtual Pet — fondos para el modo cuarto (celular). Cada fondo tiene dos capas:
   "cielo" (lo de arriba del horizonte) y "suelo" (lo de abajo). El horizonte queda siempre al 70 % de la escena. */
(function () {
  'use strict';
  const N = (window.N = window.N || {});
  const svg = (vb, inner, align) => `<svg viewBox="${vb}" preserveAspectRatio="${align}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
  const sky = (inner) => svg('0 0 400 350', inner, 'xMidYMax slice');
  const ground = (inner) => svg('0 0 400 150', inner, 'xMidYMin slice');
  const grad = (id, a, b, vertical) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${vertical === false ? 1 : 0}" y2="${vertical === false ? 0 : 1}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const cloud = (x, y, k) => `<g fill="#fff" opacity=".92"><ellipse cx="${x}" cy="${y}" rx="${30 * k}" ry="${13 * k}"/><circle cx="${x - 12 * k}" cy="${y - 8 * k}" r="${13 * k}"/><circle cx="${x + 9 * k}" cy="${y - 11 * k}" r="${16 * k}"/></g>`;
  const flower = (x, y, c) => `<g><circle cx="${x}" cy="${y}" r="3.2" fill="#ffd23f"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + Math.cos(a * Math.PI / 180) * 5).toFixed(1)}" cy="${(y + Math.sin(a * Math.PI / 180) * 5).toFixed(1)}" r="3.4" fill="${c}"/>`).join('')}</g>`;
  const rnd = (seed) => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

  const ART = {
    jardin: {
      sky: () => sky(grad('jg', '#7fcbff', '#d6f1ff') + `<rect width="400" height="350" fill="url(#jg)"/>` +
        `<g class="tsun"><circle cx="330" cy="70" r="34" fill="#ffd23f"/><circle cx="330" cy="70" r="46" fill="#ffd23f" opacity=".25"/></g>` + cloud(90, 80, 1.1) + cloud(230, 50, 0.8) +
        `<ellipse cx="80" cy="350" rx="190" ry="90" fill="#a5dc7e"/><ellipse cx="330" cy="355" rx="200" ry="80" fill="#8ccf6a"/>` +
        `<g fill="#fff" stroke="#d8cfc0" stroke-width="1.5">${Array.from({ length: 20 }, (_, i) => `<path d="M${i * 21 + 4} 350 V302 l7 -9 l7 9 V350 Z"/>`).join('')}<rect x="0" y="314" width="400" height="7"/><rect x="0" y="334" width="400" height="7"/></g>` +
        flower(40, 290, '#ff8fb8') + flower(70, 300, '#fff') + flower(352, 296, '#ff8fb8') + flower(375, 288, '#c39bff')),
      ground: () => ground(grad('jgr', '#7cc95a', '#5aa83f') + `<rect width="400" height="150" fill="url(#jgr)"/>` +
        `<ellipse cx="200" cy="95" rx="120" ry="26" fill="#d9c8a3" opacity=".7"/>` +
        (() => { const r = rnd(7); let s = ''; for (let i = 0; i < 40; i++) { const x = r() * 400, y = 8 + r() * 135; s += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l3 -9 l3 9" stroke="#4a9637" stroke-width="2" fill="none" stroke-linecap="round"/>`; } return s; })() +
        flower(30, 40, '#ff8fb8') + flower(370, 60, '#fff') + flower(60, 120, '#c39bff') + flower(340, 125, '#ff8fb8') + flower(300, 25, '#ffd23f')),
    },
    playa: {
      sky: () => sky(grad('pg', '#5cc0ff', '#ffe9c7') + `<rect width="400" height="350" fill="url(#pg)"/>` +
        `<circle class="tsun" cx="80" cy="85" r="32" fill="#ffd23f"/>` + cloud(260, 70, 0.9) +
        `<path d="M300 268 q30 -40 70 0 Z" fill="#5aa86a"/><path d="M335 262 q-4 -30 2 -44 m0 0 q14 -4 24 6 m-24 -6 q-14 -6 -24 4 m24 -4 q4 -14 16 -18 m-16 18 q-6 -14 -18 -16" stroke="#3f7a3a" stroke-width="4" fill="none" stroke-linecap="round"/>` +
        `<rect x="0" y="262" width="400" height="88" fill="#2fa7d9"/><rect x="0" y="262" width="400" height="10" fill="#7fd0f0" opacity=".7"/>` +
        `<g stroke="#bfeaff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"><path d="M30 295 q10 -6 20 0 t20 0"/><path d="M190 310 q10 -6 20 0 t20 0"/><path d="M300 330 q10 -6 20 0 t20 0"/><path d="M110 335 q10 -6 20 0 t20 0"/></g>` +
        `<path d="M150 285 l22 -34 v34 Z" fill="#fff"/><path d="M146 287 h34 l-5 8 h-24 Z" fill="#e0603d"/>`),
      ground: () => ground(grad('pgr', '#f6dc9c', '#e8c47a') + `<rect width="400" height="150" fill="url(#pgr)"/>` +
        `<path d="M0 0 H400 V10 ${Array.from({ length: 20 }, (_, i) => `q-10 10 -20 0`).join(' ')} Z" fill="#fff" opacity=".85"/>` +
        (() => { const r = rnd(3); let s = ''; for (let i = 0; i < 50; i++) s += `<circle cx="${(r() * 400).toFixed(0)}" cy="${(14 + r() * 130).toFixed(0)}" r="1.6" fill="#c9a35c"/>`; return s; })() +
        `<path d="M60 110 l5 -12 l5 12 l-13 -8 h16 Z" fill="#ff8a3d"/><path d="M330 70 q10 -16 20 0 q-10 6 -20 0 Z" fill="#ffb0c8" stroke="#e07a9c" stroke-width="1.5"/><path d="M290 130 q8 -12 16 0 q-8 5 -16 0 Z" fill="#fff3d6" stroke="#d9b47a" stroke-width="1.5"/>`),
    },
    bosque: {
      sky: () => sky(grad('bg', '#a8dcc0', '#e8f6ec') + `<rect width="400" height="350" fill="url(#bg)"/>` +
        `<circle class="tsun" cx="300" cy="80" r="28" fill="#fff6c9" opacity=".9"/>` +
        (() => { let s = ''; const tree = (x, h, c) => `<path d="M${x} ${350 - h} l${h * 0.32} ${h * 0.55} h-${h * 0.12} l${h * 0.2} ${h * 0.45} h-${h * 0.8} l${h * 0.2} -${h * 0.45} h-${h * 0.12} Z" fill="${c}"/>`;
          [[20, 170], [80, 210], [150, 160], [230, 220], [300, 180], [370, 200]].forEach(([x, h]) => (s += tree(x, h, '#8fbf9a')));
          [[-10, 230], [60, 190], [340, 240], [400, 200]].forEach(([x, h]) => (s += tree(x, h, '#4f8a5c')));
          return s; })()),
      ground: () => ground(grad('bgr', '#6a9a52', '#4f7d3d') + `<rect width="400" height="150" fill="url(#bgr)"/>` +
        (() => { const r = rnd(11); let s = ''; for (let i = 0; i < 35; i++) { const x = (r() * 400).toFixed(0), y = (10 + r() * 135).toFixed(0); s += `<ellipse cx="${x}" cy="${y}" rx="4" ry="2" fill="${r() > 0.5 ? '#c98a42' : '#a86a2c'}" transform="rotate(${(r() * 180).toFixed(0)} ${x} ${y})"/>`; } return s; })() +
        `<g><rect x="40" y="40" width="8" height="18" rx="3" fill="#f4ead2"/><path d="M30 44 q14 -24 28 0 Z" fill="#e74c3c"/><circle cx="38" cy="38" r="2.5" fill="#fff"/><circle cx="48" cy="36" r="2" fill="#fff"/></g>` +
        `<g><rect x="346" y="96" width="7" height="15" rx="3" fill="#f4ead2"/><path d="M337 100 q12 -20 24 0 Z" fill="#e74c3c"/><circle cx="345" cy="94" r="2" fill="#fff"/></g>` +
        `<g><rect x="250" y="20" width="80" height="20" rx="10" fill="#8a5a3c"/><ellipse cx="330" cy="30" rx="8" ry="10" fill="#c99a6a"/><ellipse cx="330" cy="30" rx="4" ry="5" fill="#8a5a3c"/></g>`),
    },
    castillo: {
      sky: () => sky(`<rect width="400" height="350" fill="#9a93b3"/>` +
        (() => { let s = ''; for (let row = 0; row < 15; row++) for (let i = -1; i < 11; i++) s += `<rect x="${i * 40 + (row % 2) * 20 + 1}" y="${row * 24 + 1}" width="38" height="22" rx="2" fill="${(row + i) % 3 ? '#a8a1c0' : '#8f88aa'}"/>`; return s; })() +
        `<path d="M160 330 V150 a40 40 0 0 1 80 0 V330 Z" fill="#3b3156"/><path d="M168 322 V152 a32 32 0 0 1 64 0 V322 Z" fill="#141a46"/><circle cx="210" cy="190" r="10" fill="#fff5c8"/><circle cx="185" cy="240" r="1.5" fill="#fff"/><circle cx="215" cy="270" r="1.5" fill="#fff"/>` +
        `<g><rect x="54" y="40" width="44" height="120" fill="#7b61ff"/><path d="M54 160 l22 -18 l22 18 Z" fill="#9a93b3"/><circle cx="76" cy="90" r="12" fill="#ffd23f"/><rect x="48" y="34" width="56" height="8" rx="3" fill="#6b4226"/></g>` +
        `<g><rect x="302" y="40" width="44" height="120" fill="#e74c3c"/><path d="M302 160 l22 -18 l22 18 Z" fill="#9a93b3"/><path d="M324 78 l6 12 h-12 Z" fill="#ffd23f"/><rect x="296" y="34" width="56" height="8" rx="3" fill="#6b4226"/></g>` +
        `<g><rect x="118" y="220" width="10" height="34" fill="#6b4226"/><path d="M123 202 q-12 14 0 22 q12 -8 0 -22 Z" fill="#ff8a3d"/><path d="M123 210 q-6 8 0 12 q6 -4 0 -12 Z" fill="#ffd23f"/></g>` +
        `<g><rect x="272" y="220" width="10" height="34" fill="#6b4226"/><path d="M277 202 q-12 14 0 22 q12 -8 0 -22 Z" fill="#ff8a3d"/><path d="M277 210 q-6 8 0 12 q6 -4 0 -12 Z" fill="#ffd23f"/></g>`),
      ground: () => ground(`<rect width="400" height="150" fill="#7d7891"/>` +
        (() => { let s = ''; for (let row = 0; row < 5; row++) for (let i = -1; i < 9; i++) s += `<rect x="${i * 50 + (row % 2) * 25 + 1}" y="${row * 30 + 1}" width="48" height="28" rx="3" fill="${(row + i) % 2 ? '#8a84a0' : '#757089'}"/>`; return s; })() +
        `<path d="M120 0 H280 L320 150 H80 Z" fill="#c0392b"/><path d="M130 0 H270 L306 150 H94 Z" fill="none" stroke="#ffd23f" stroke-width="3"/>`),
    },
    volcan: {
      sky: () => sky(grad('vg', '#ff8a5b', '#ffd6a0') + `<rect width="400" height="350" fill="url(#vg)"/>` +
        `<g fill="#9a8a90" opacity=".85"><circle cx="230" cy="70" r="26"/><circle cx="255" cy="50" r="30"/><circle cx="282" cy="72" r="24"/><circle cx="215" cy="40" r="18"/></g>` +
        `<path d="M60 350 L210 130 h40 L400 350 Z" fill="#5a3b4a"/><path d="M210 130 h40 l-6 14 q-14 -6 -28 0 Z" fill="#ff5a1f"/>` +
        `<path d="M222 140 q4 40 -12 80 q-10 30 4 60" stroke="#ff7a1a" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M240 142 q10 30 2 60" stroke="#ffb547" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        `<path d="M-20 350 L80 240 L180 350 Z" fill="#6e4a5c"/>`),
      ground: () => ground(`<rect width="400" height="150" fill="#4a3a44"/>` +
        `<g stroke="#ff7a1a" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"><path d="M20 40 l30 10 l20 -8 l26 14"/><path d="M260 30 l20 16 l34 -4 l20 12"/><path d="M120 110 l24 -8 l30 10 l18 -6"/><path d="M320 120 l22 6 l30 -10"/></g>` +
        `<g fill="#3a2c35"><ellipse cx="80" cy="90" rx="16" ry="7"/><ellipse cx="350" cy="80" rx="12" ry="5"/><ellipse cx="220" cy="140" rx="20" ry="6"/></g>`),
    },
    espacio: {
      sky: () => sky(grad('eg', '#0b1033', '#2a1f5c') + `<rect width="400" height="350" fill="url(#eg)"/>` +
        (() => { const r = rnd(5); let s = ''; for (let i = 0; i < 70; i++) s += `<circle cx="${(r() * 400).toFixed(0)}" cy="${(r() * 340).toFixed(0)}" r="${(0.6 + r() * 1.6).toFixed(1)}" fill="#fff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`; return s; })() +
        `<circle cx="120" cy="120" r="70" fill="#7b61ff" opacity=".18"/><circle cx="300" cy="230" r="90" fill="#ff5d9e" opacity=".12"/>` +
        `<g transform="translate(0 70)"><circle cx="300" cy="110" r="38" fill="#ff8fd0"/><path d="M262 104 q38 -10 76 0" stroke="#d65aa6" stroke-width="5" fill="none"/><ellipse cx="300" cy="114" rx="64" ry="14" fill="none" stroke="#ffd23f" stroke-width="5" transform="rotate(-14 300 114)"/></g>` +
        `<circle cx="80" cy="150" r="14" fill="#dfe3ff"/><circle cx="76" cy="146" r="3" fill="#b9bfe6"/>`),
      ground: () => ground(grad('egr', '#c9c4d8', '#9d97b3') + `<rect width="400" height="150" fill="url(#egr)"/>` +
        `<g fill="#8b85a3"><ellipse cx="70" cy="40" rx="30" ry="9"/><ellipse cx="300" cy="100" rx="40" ry="12"/><ellipse cx="190" cy="20" rx="16" ry="5"/><ellipse cx="360" cy="30" rx="14" ry="4"/><ellipse cx="120" cy="125" rx="22" ry="6"/></g>` +
        `<g fill="#b3adc6"><ellipse cx="70" cy="37" rx="24" ry="6"/><ellipse cx="300" cy="96" rx="32" ry="8"/></g>`),
    },
  };

  // El cuarto de siempre se dibuja con CSS en la escena; esto es sólo su miniatura para la tienda.
  const ROOM_THUMB = svg('0 0 160 100', `<rect width="160" height="70" fill="#c9ebda"/>` +
    `<g fill="#fff" opacity=".5">${Array.from({ length: 24 }, (_, i) => `<circle cx="${(i % 8) * 20 + 6}" cy="${Math.floor(i / 8) * 20 + 8}" r="2"/>`).join('')}</g>` +
    `<path d="M16 58 V28 a18 18 0 0 1 36 0 V58 Z" fill="#7fcbff" stroke="#fff" stroke-width="4"/><circle cx="42" cy="26" r="6" fill="#ffd23f"/>` +
    `<rect x="112" y="16" width="30" height="22" rx="3" fill="#fff" stroke="#b9874f" stroke-width="3"/><rect x="117" y="21" width="20" height="12" fill="#9fd67a"/>` +
    `<path d="M84 0 V14" stroke="#3b2f4a" stroke-width="2"/><path d="M74 24 q10 -14 20 0 Z" fill="#ffd23f" stroke="#3b2f4a" stroke-width="2"/>` +
    `<rect y="70" width="160" height="30" fill="#e0b075"/><rect y="68" width="160" height="4" fill="#b9874f"/><ellipse cx="80" cy="88" rx="46" ry="6" fill="#ffb0bd"/>`, 'xMidYMid slice');

  // Cada dibujo usa degradados con id; como el mismo fondo puede estar a la vez en la escena y en la tienda, los ids se renumeran en cada uso.
  let uid = 0;
  const uniq = (s) => { const n = ++uid; return s.replace(/(id="|url\(#)([a-z]+)/g, `$1$2-${n}`); };

  N.themes = {
    has: (id) => !!ART[id],
    sky: (id) => (ART[id] ? uniq(ART[id].sky()) : ''),
    ground: (id) => (ART[id] ? uniq(ART[id].ground()) : ''),
    // Miniatura: cielo arriba (70 %) y suelo abajo (30 %), igual que en la escena
    thumb(id) {
      if (!ART[id]) return ROOM_THUMB;
      return `<span class="bgt-sky">${this.sky(id)}</span><span class="bgt-ground">${this.ground(id)}</span>`;
    },
  };
})();
