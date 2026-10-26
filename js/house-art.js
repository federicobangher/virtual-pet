/* Virtual Pet — dibujos de la casa: los ambientes (paredes, piso y muebles) y los botones grandes de juguete.
   Todo es SVG generado por código (sin imágenes), así pesa poco y se ve nítido en cualquier pantalla. */
(function () {
  'use strict';
  const N = (window.N = window.N || {});
  const INK = '#2a1f3d';
  const sv = (vb, inner, extra) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"${extra || ''}>${inner}</svg>`;
  const EF = () => (N.art && N.art.EMOJI_FONT) || 'font-family="sans-serif"';

  /* ---------------- botones de juguete (64×64) ---------------- */
  const I = {
    fridge: `<rect x="14" y="4" width="36" height="56" rx="6" fill="#d9f3d0" stroke="${INK}" stroke-width="3"/><path d="M14 24h36" stroke="${INK}" stroke-width="3"/><rect x="42" y="11" width="3.5" height="9" rx="1.5" fill="${INK}"/><rect x="42" y="30" width="3.5" height="14" rx="1.5" fill="${INK}"/><path d="M20 9h10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
    shower: `<path d="M18 60V20q0-12 14-12h6" stroke="#e8394a" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M18 60V20q0-12 14-12h6" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".35"/><path d="M33 10q14-6 22 6 4 6-2 8L33 24z" fill="#ff5d6c" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><g fill="#7fd3ff"><circle cx="40" cy="32" r="2.4"/><circle cx="48" cy="36" r="2.4"/><circle cx="56" cy="30" r="2.4"/><circle cx="44" cy="44" r="2.4"/><circle cx="54" cy="44" r="2.4"/></g>`,
    soap: `<g transform="rotate(-18 32 36)"><rect x="8" y="20" width="48" height="30" rx="10" fill="#7fc8ff" stroke="${INK}" stroke-width="3"/><rect x="14" y="24" width="36" height="10" rx="5" fill="#bfe6ff"/><text x="32" y="44" font-size="12" font-weight="800" text-anchor="middle" fill="#2a6fd0" font-family="Grandstander, sans-serif">JABÓN</text></g><circle cx="52" cy="12" r="6" fill="#fff" stroke="#9cd" stroke-width="2"/><circle cx="42" cy="8" r="3.5" fill="#fff" stroke="#9cd" stroke-width="1.6"/>`,
    wardrobe: `<rect x="10" y="4" width="44" height="54" rx="4" fill="#c98b4a" stroke="${INK}" stroke-width="3"/><path d="M32 6v50" stroke="${INK}" stroke-width="3"/><circle cx="28" cy="32" r="2.5" fill="${INK}"/><circle cx="36" cy="32" r="2.5" fill="${INK}"/><rect x="14" y="56" width="6" height="6" fill="${INK}"/><rect x="44" y="56" width="6" height="6" fill="${INK}"/><path d="M15 10h12M37 10h12" stroke="#f0c48c" stroke-width="3" stroke-linecap="round"/>`,
    lampOn: `<path d="M18 30h28L40 8H24z" fill="#ffd23f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M32 30v20" stroke="${INK}" stroke-width="4"/><ellipse cx="32" cy="55" rx="14" ry="5" fill="#8a5a3c" stroke="${INK}" stroke-width="3"/><path d="M12 38l-6 4M52 38l6 4M32 36v4" stroke="#ffb703" stroke-width="3" stroke-linecap="round"/>`,
    lampOff: `<path d="M18 30h28L40 8H24z" fill="#8b84a6" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M32 30v20" stroke="${INK}" stroke-width="4"/><ellipse cx="32" cy="55" rx="14" ry="5" fill="#8a5a3c" stroke="${INK}" stroke-width="3"/><path d="M46 8a9 9 0 1 0 9 12 7 7 0 0 1-9-12z" fill="#ffe08a" stroke="${INK}" stroke-width="2"/>`,
    album: `<rect x="8" y="8" width="48" height="48" rx="6" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="14" y="14" width="36" height="28" rx="3" fill="#8fd3ff"/><circle cx="24" cy="24" r="4.5" fill="#ffd23f"/><path d="M14 42l12-12 9 8 6-5 9 9z" fill="#6cc04a"/><path d="M14 50h22" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    music: `<rect x="6" y="20" width="52" height="34" rx="8" fill="#ff8a3d" stroke="${INK}" stroke-width="3"/><circle cx="22" cy="37" r="9" fill="${INK}"/><circle cx="22" cy="37" r="4" fill="#ffd23f"/><rect x="36" y="28" width="16" height="6" rx="2" fill="#fff3c4"/><circle cx="40" cy="44" r="3" fill="#fff3c4"/><circle cx="48" cy="44" r="3" fill="#fff3c4"/><path d="M16 20l20-14" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    controller: `<path d="M14 22h36a10 10 0 0 1 10 10l2 14a7 7 0 0 1-12 5l-6-6H20l-6 6a7 7 0 0 1-12-5l2-14a10 10 0 0 1 10-10z" fill="url(#rb)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M18 30v10M13 35h10" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><circle cx="44" cy="31" r="3" fill="#fff"/><circle cx="50" cy="37" r="3" fill="#fff"/><defs><linearGradient id="rb" x1="0" x2="1"><stop offset="0" stop-color="#ff5d73"/><stop offset=".33" stop-color="#ffc93c"/><stop offset=".66" stop-color="#22b07d"/><stop offset="1" stop-color="#5b7cff"/></linearGradient></defs>`,
    ball: `<circle cx="32" cy="32" r="24" fill="#ff4f4f" stroke="${INK}" stroke-width="3"/><path d="M14 22q18 10 36 0M12 38q20 12 40 0" stroke="#fff" stroke-width="4" fill="none"/><ellipse cx="24" cy="20" rx="5" ry="3" fill="#fff" opacity=".6"/>`,
    soccer: `<circle cx="32" cy="32" r="24" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M32 22l9 6-3 10H26l-3-10z" fill="${INK}"/><path d="M32 22V9M41 28l12-4M38 38l7 11M26 38l-7 11M23 28l-12-4" stroke="${INK}" stroke-width="2.5"/>`,
    shelf: `<rect x="8" y="6" width="48" height="54" rx="4" fill="#ffcf5a" stroke="${INK}" stroke-width="3"/><path d="M8 24h48M8 42h48" stroke="${INK}" stroke-width="3"/><path d="M15 22v-8h6v8zM28 22l3-10 3 10z" fill="#ff5d73"/><circle cx="44" cy="17" r="5" fill="#5b7cff"/><rect x="14" y="30" width="8" height="10" rx="2" fill="#22b07d"/><path d="M30 40l4-10 4 10z" fill="#ff8a3d"/><rect x="42" y="29" width="7" height="11" rx="2" fill="#a07bff"/><rect x="16" y="48" width="12" height="9" rx="2" fill="#7fc8ff"/><rect x="36" y="48" width="12" height="9" rx="2" fill="#ff8fb8"/>`,
    seeds: `<path d="M14 12h36l-3 46H17z" fill="#f3e3c3" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M14 12h36v8H14z" fill="#c98b4a" stroke="${INK}" stroke-width="3"/><path d="M32 52V36" stroke="#3f8a2a" stroke-width="3" stroke-linecap="round"/><path d="M32 40q-10-2-10-10 10 0 10 10zM32 38q10-2 10-10-10 0-10 10z" fill="#6cc04a" stroke="#3f8a2a" stroke-width="2"/>`,
    cloud: `<g fill="#fff" stroke="${INK}" stroke-width="3"><path d="M14 40a10 10 0 0 1 2-20 14 14 0 0 1 27-4 11 11 0 0 1 9 20 6 6 0 0 1-4 4H16a8 8 0 0 1-2 0z"/></g><g fill="#5fb4f0"><path d="M20 48l-3 8M32 48l-3 8M44 48l-3 8" stroke="#5fb4f0" stroke-width="4" stroke-linecap="round"/></g>`,
    places: `<rect x="6" y="10" width="52" height="44" rx="6" fill="#bfe8ff" stroke="${INK}" stroke-width="3"/><path d="M6 42l14-14 10 10 8-6 20 16v2a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6z" fill="#6cc04a" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="44" cy="22" r="6" fill="#ffd23f"/>`,
    walk: `<path d="M10 40q2-12 14-12l8 2q10-6 14 4l6 4q6 2 6 8v4H10z" fill="#ff5d9e" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M10 48h48" stroke="${INK}" stroke-width="3"/><rect x="10" y="48" width="48" height="6" rx="3" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M28 34l3 4M34 32l3 4" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
    horn: `<path d="M8 26h10l20-14v40L18 38H8z" fill="#ffd23f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M46 22q8 10 0 20M52 16q14 16 0 32" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    wheel: `<circle cx="32" cy="32" r="24" fill="none" stroke="#e8394a" stroke-width="8"/><circle cx="32" cy="32" r="24" fill="none" stroke="${INK}" stroke-width="2" opacity=".4"/><circle cx="32" cy="32" r="7" fill="#e8394a" stroke="${INK}" stroke-width="2.5"/><path d="M10 30h15M39 30h15M32 39v15" stroke="#e8394a" stroke-width="6"/>`,
    shop: `<path d="M10 24h44v34H10z" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="16" y="30" width="22" height="20" fill="#bfe8ff" stroke="${INK}" stroke-width="2.5"/><path d="M42 30h8v28h-8z" fill="#f0e6d8" stroke="${INK}" stroke-width="2.5"/><path d="M6 24l6-14h40l6 14z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M12 10l-2 14M22 10l-2 14M32 10v14M42 10l2 14M52 10l2 14" stroke="#ff4f4f" stroke-width="5"/><path d="M6 24q4 6 8 0 4 6 8 0 4 6 8 0 4 6 8 0 4 6 8 0 4 6 8 0 4 6 8 0" fill="#ff4f4f" stroke="${INK}" stroke-width="2"/>`,
    flame: `<path d="M32 60c-12 0-18-8-18-18 0-12 10-16 10-30 8 5 11 12 11 18 3-3 5-6 5-10 6 6 8 14 8 22 0 10-6 18-16 18z" fill="#ff8a3d" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M32 56c-6 0-9-4-9-9 0-6 5-8 6-14 6 4 12 8 12 15 0 5-4 8-9 8z" fill="#ffd23f"/>`,
    camera: `<rect x="6" y="18" width="52" height="36" rx="5" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M20 18l4-8h16l4 8" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="36" r="11" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="32" cy="36" r="6" fill="none" stroke="${INK}" stroke-width="2.5"/>`,
    menu: `<circle cx="32" cy="32" r="26" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M20 23h24M20 32h24M20 41h24" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`,
    left: `<rect x="5" y="5" width="54" height="54" rx="9" fill="#fff" stroke="${INK}" stroke-width="3.5"/><path d="M38 16L22 32l16 16" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 22L26 32l10 10" stroke="#fff" stroke-width="0" fill="none"/>`,
    right: `<rect x="5" y="5" width="54" height="54" rx="9" fill="#fff" stroke="${INK}" stroke-width="3.5"/><path d="M26 16l16 16-16 16" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    plus: `<rect x="5" y="5" width="54" height="54" rx="9" fill="#fff" stroke="${INK}" stroke-width="3.5"/><path d="M32 16v32M16 32h32" stroke="#22b07d" stroke-width="9" stroke-linecap="round"/><path d="M32 16v32M16 32h32" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".25"/>`,
    games: `<rect x="8" y="10" width="48" height="44" rx="8" fill="#5b7cff" stroke="${INK}" stroke-width="3"/><g fill="#fff"><rect x="14" y="16" width="16" height="14" rx="3"/><rect x="34" y="16" width="16" height="14" rx="3"/><rect x="14" y="34" width="16" height="14" rx="3"/><rect x="34" y="34" width="16" height="14" rx="3"/></g><circle cx="22" cy="23" r="4" fill="#ff5d73"/><path d="M38 28l4-8 4 8z" fill="#ffc93c"/><rect x="18" y="37" width="8" height="8" fill="#22b07d"/><path d="M38 41h8M42 37v8" stroke="#ff8a3d" stroke-width="3"/>`,
    broom: `<path d="M44 6L28 34" stroke="#a86d3a" stroke-width="5" stroke-linecap="round"/><path d="M22 30l14 8-6 20q-14-2-22-12z" fill="#ffd23f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M14 46l10-6M18 52l10-8M24 56l8-10" stroke="#c98a12" stroke-width="2"/>`,
    swing: `<path d="M10 6h44" stroke="#8a5a3c" stroke-width="6" stroke-linecap="round"/><path d="M20 6v36M44 6v36" stroke="${INK}" stroke-width="2.5"/><rect x="14" y="40" width="36" height="7" rx="3" fill="#ff5d73" stroke="${INK}" stroke-width="3"/>`,
    tv: `<rect x="6" y="14" width="52" height="38" rx="6" fill="#3d3550" stroke="${INK}" stroke-width="3"/><rect x="12" y="20" width="40" height="26" rx="3" fill="#7fd3ff"/><path d="M24 6l8 8 8-8" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M18 52l-4 8M46 52l4 8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  };
  function icon(name) { return sv('0 0 64 64', I[name] || ''); }

  /* ---------------- ambientes ----------------
     Cada ambiente: nombre, colores (pared, piso, barras) y muebles. Los muebles se ubican en % del ancho y en "em"
     (que la casa calcula según el tamaño de la pantalla), así entran igual en un celular, una tablet o el panel de Windows. */
  const sky = (a, b) => `linear-gradient(${a}, ${b})`;
  const ROOMS = {
    cocina: { name: 'Cocina', wall: '#ff8f87', wallPat: 'stripes', floor: '#e8eef6', floorPat: 'checker', bar: '#9c4646', top: '#ffd0cc', title: '#ffe9e7' },
    bano: { name: 'Baño', wall: '#36d3ea', wallPat: 'tiles', floor: '#1fa9be', floorPat: 'tiles', bar: '#0f8496', top: '#c4f6fd', title: '#e6fcff' },
    dormitorio: { name: 'Dormitorio', wall: '#8b79ee', wallPat: 'stars', floor: '#b07a4f', floorPat: 'wood', bar: '#4f3fa8', top: '#d9d2ff', title: '#f0edff' },
    living: { name: 'Living', wall: '#ffb84d', wallPat: 'diamonds', floor: '#a86a3a', floorPat: 'wood', bar: '#b86b12', top: '#ffe3b3', title: '#fff4e0' },
    juegos: { name: 'Cuarto de juegos', wall: '#3b2a6b', wallPat: 'confetti', floor: '#ff5d9e', floorPat: 'mat', bar: '#24184a', top: '#cdbfff', title: '#f1ecff' },
    laboratorio: { name: 'Laboratorio', wall: '#ff6fae', wallPat: 'dots', floor: '#c94a86', floorPat: 'tiles', bar: '#93295c', top: '#ffc9e1', title: '#fff0f7' },
    jardin: { name: 'Jardín', outdoor: true, sky: sky('#6cc6ff', '#c8ecff'), floor: '#6cc04a', floorPat: 'grass', bar: '#3a7f25', top: '#c8ecff', title: '#effaff' },
    patio: { name: 'Patio', outdoor: true, sky: sky('#45a9ff', '#a8dcff'), floor: '#3fae3f', floorPat: 'stripes-grass', bar: '#24782a', top: '#c3e4ff', title: '#effaff' },
    paseo: { name: 'Paseo', outdoor: true, place: true, floor: 'transparent', bar: '#2a5fb0', top: '#cfe6ff', title: '#effaff' },
    garaje: { name: 'Garaje', wall: '#9aa3b8', wallPat: 'garage', floor: '#6b7280', floorPat: 'concrete', bar: '#3c4252', top: '#e3e7ef', title: '#f4f6fa' },
  };

  const win = (night) => `<rect x="4" y="4" width="92" height="82" rx="6" fill="#fff" stroke="${INK}" stroke-width="4"/><rect x="11" y="11" width="78" height="68" fill="${night ? '#24204a' : '#9ad8ff'}"/>` +
    (night ? '<circle cx="66" cy="30" r="9" fill="#fff3c4"/><circle cx="62" cy="27" r="9" fill="#24204a"/><g fill="#fff"><circle cx="24" cy="24" r="1.6"/><circle cx="40" cy="44" r="1.3"/><circle cx="74" cy="58" r="1.5"/><circle cx="30" cy="62" r="1.2"/></g>'
      : '<circle cx="70" cy="28" r="9" fill="#ffd23f"/><g fill="#fff"><ellipse cx="34" cy="34" rx="14" ry="6"/><circle cx="28" cy="30" r="6"/><circle cx="38" cy="28" r="7"/></g><path d="M11 64q20-12 39 0t39 0v15H11z" fill="#8fd16a"/>') +
    `<path d="M50 11v68M11 45h78" stroke="#fff" stroke-width="5"/><path d="M50 11v68M11 45h78" stroke="${INK}" stroke-width="1.5" opacity=".25"/><rect x="0" y="84" width="100" height="8" rx="3" fill="#fff" stroke="${INK}" stroke-width="3"/>`;

  // Muebles: [svg, left %, bottom (em desde el piso; negativo = sobre el piso), alto em, clase extra]
  const P = {
    cocina: () => [
      [sv('0 0 100 94', win(isNight())), 6, 9.5, 6.2, 'pw'],
      [sv('0 0 90 120', `<rect x="4" y="4" width="82" height="112" rx="8" fill="#e9f7e4" stroke="${INK}" stroke-width="4"/><path d="M4 44h82" stroke="${INK}" stroke-width="4"/><rect x="70" y="16" width="6" height="18" rx="3" fill="${INK}"/><rect x="70" y="56" width="6" height="30" rx="3" fill="${INK}"/><path d="M14 14h20" stroke="#fff" stroke-width="5" stroke-linecap="round"/><rect x="14" y="62" width="14" height="10" rx="3" fill="#ff8a3d"/><circle cx="40" cy="70" r="5" fill="#ff5d5d"/>`), 4, 0, 9.5, 'fridge-prop tap'],
      [sv('0 0 160 70', `<rect x="4" y="18" width="152" height="48" rx="6" fill="#d97b4a" stroke="${INK}" stroke-width="4"/><rect x="0" y="6" width="160" height="14" rx="5" fill="#f4ead2" stroke="${INK}" stroke-width="4"/><circle cx="40" cy="42" r="6" fill="${INK}"/><circle cx="120" cy="42" r="6" fill="${INK}"/><path d="M80 22v40" stroke="${INK}" stroke-width="3"/>`), 70, 0, 4.6],
      [sv('0 0 70 50', `<path d="M8 22h54v14a12 12 0 0 1-12 12H20A12 12 0 0 1 8 36z" fill="#5b7cff" stroke="${INK}" stroke-width="4"/><path d="M2 22h66" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M26 16q4-8 0-14M40 16q4-8 0-14" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`), 80, 4.6, 2.2],
    ],
    bano: () => [
      [sv('0 0 80 100', `<rect x="6" y="6" width="68" height="88" rx="34" fill="#e6fbff" stroke="${INK}" stroke-width="4"/><rect x="14" y="14" width="52" height="72" rx="26" fill="#bdeffa"/><path d="M24 30q10-10 20 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`), 78, 7.5, 6, 'pw'],
      [sv('0 0 200 90', `<path d="M8 22h184v24a40 40 0 0 1-40 40H48A40 40 0 0 1 8 46z" fill="#fff" stroke="${INK}" stroke-width="4"/><rect x="2" y="14" width="196" height="12" rx="6" fill="#fff" stroke="${INK}" stroke-width="4"/><g fill="#fff" stroke="#9cd" stroke-width="2"><circle cx="50" cy="12" r="9"/><circle cx="66" cy="8" r="7"/><circle cx="82" cy="12" r="8"/><circle cx="140" cy="10" r="8"/></g><path d="M40 86l-8 4M160 86l8 4" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`), 2, 0, 4.3],
      [sv('0 0 60 140', `<path d="M14 136V40q0-30 28-30h8" stroke="#c3cad6" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M42 4q16 0 16 16H34q0-16 8-16z" fill="#ff5d6c" stroke="${INK}" stroke-width="3"/>`), 4, 4, 9, 'shower-prop'],
      [sv('0 0 60 70', `<rect x="10" y="4" width="40" height="22" rx="6" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M4 30h52a26 26 0 0 1-52 0z" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M22 60h16v8H22z" fill="#fff" stroke="${INK}" stroke-width="4"/>`), 86, 0, 3.6],
    ],
    dormitorio: () => [
      [sv('0 0 100 94', win(true)), 70, 9.5, 6, 'pw'],
      [sv('0 0 220 110', `<rect x="10" y="10" width="20" height="96" rx="6" fill="#a86a3a" stroke="${INK}" stroke-width="4"/><rect x="190" y="40" width="20" height="66" rx="6" fill="#a86a3a" stroke="${INK}" stroke-width="4"/><rect x="24" y="52" width="176" height="34" rx="8" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M60 50h140v36H60z" fill="#ff8fb8" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M60 62h140" stroke="#ff5d9e" stroke-width="4"/><ellipse cx="44" cy="54" rx="18" ry="10" fill="#fff" stroke="${INK}" stroke-width="4"/>`), 0, 0, 5.8],
      [sv('0 0 60 100', `<path d="M14 40h32L40 8H20z" fill="#ffd23f" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M30 40v44" stroke="${INK}" stroke-width="5"/><ellipse cx="30" cy="90" rx="18" ry="6" fill="#8a5a3c" stroke="${INK}" stroke-width="4"/>`), 86, 0, 5.4, 'lamp-prop'],
      [sv('0 0 90 60', `<rect x="4" y="8" width="82" height="48" rx="4" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M14 46l18-22 14 14 10-8 22 16" stroke="#6b5f80" stroke-width="4" fill="none" stroke-linejoin="round"/><circle cx="66" cy="22" r="6" fill="#ffd23f"/>`), 8, 11, 3.2, 'pw'],
    ],
    living: () => [
      [sv('0 0 200 110', `<rect x="10" y="20" width="180" height="56" rx="18" fill="#5b7cff" stroke="${INK}" stroke-width="4"/><rect x="2" y="44" width="40" height="52" rx="14" fill="#4c6af0" stroke="${INK}" stroke-width="4"/><rect x="158" y="44" width="40" height="52" rx="14" fill="#4c6af0" stroke="${INK}" stroke-width="4"/><rect x="34" y="60" width="132" height="34" rx="10" fill="#6f8cff" stroke="${INK}" stroke-width="4"/><path d="M100 62v30" stroke="${INK}" stroke-width="3"/><path d="M24 96v10M176 96v10" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`), 0, 0, 5.4],
      [sv('0 0 140 130', `<rect x="10" y="4" width="120" height="84" rx="10" fill="#3d3550" stroke="${INK}" stroke-width="4"/><rect class="tv-screen" x="20" y="14" width="100" height="64" rx="6" fill="#26304a"/><g class="tv-show" opacity="0"><rect x="20" y="14" width="100" height="64" rx="6" fill="#7fd3ff"/><circle class="tv-sun" cx="94" cy="32" r="9" fill="#ffd23f"/><path d="M20 66q25-16 50 0t50 0v12H20z" fill="#6cc04a"/><g class="tv-guy"><circle cx="54" cy="52" r="10" fill="#ff8fb8" stroke="${INK}" stroke-width="2.5"/><circle cx="51" cy="50" r="1.8" fill="${INK}"/><circle cx="58" cy="50" r="1.8" fill="${INK}"/><path d="M50 56q4 3 8 0" stroke="${INK}" stroke-width="1.8" fill="none"/></g></g><rect x="30" y="92" width="80" height="34" rx="6" fill="#a86a3a" stroke="${INK}" stroke-width="4"/><circle cx="70" cy="109" r="4" fill="${INK}"/>`), 78, 0, 7, 'tv-prop tap'],
      [sv('0 0 60 120', `<path d="M10 116h40" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M30 116V60" stroke="#6b3d16" stroke-width="5"/><circle cx="30" cy="40" r="26" fill="#3fae3f" stroke="${INK}" stroke-width="4"/><circle cx="20" cy="32" r="8" fill="#6cd06c"/>`), 40, 0, 5.6, 'side'],
      [sv('0 0 100 70', `<rect x="4" y="4" width="92" height="62" rx="6" fill="#ffe08a" stroke="${INK}" stroke-width="4"/><circle cx="34" cy="36" r="14" fill="#ff5d9e"/><circle cx="62" cy="30" r="10" fill="#5b7cff"/><path d="M50 56l12-14 14 14z" fill="#22b07d"/>`), 12, 9, 3.6, 'pw'],
    ],
    juegos: () => [
      [sv('0 0 140 100', `<rect x="4" y="22" width="132" height="74" rx="8" fill="#ffc93c" stroke="${INK}" stroke-width="4"/><path d="M4 44h132" stroke="${INK}" stroke-width="4"/><rect x="58" y="36" width="24" height="16" rx="4" fill="#ff5d73" stroke="${INK}" stroke-width="3"/><circle cx="34" cy="16" r="14" fill="#5b7cff" stroke="${INK}" stroke-width="4"/><path d="M90 22l14-20 14 20z" fill="#22b07d" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><rect x="104" y="6" width="22" height="18" rx="3" fill="#ff8a3d" stroke="${INK}" stroke-width="3" transform="rotate(12 115 15)"/>`), 2, 0, 4.4],
      [sv('0 0 80 100', `<rect x="4" y="4" width="72" height="92" rx="6" fill="#fff" stroke="${INK}" stroke-width="4"/><text x="40" y="46" font-size="34" text-anchor="middle" font-family="Grandstander, sans-serif" font-weight="800" fill="#ff5d9e">GO!</text><path d="M16 66h48M16 78h30" stroke="#5b7cff" stroke-width="6" stroke-linecap="round"/>`), 80, 8, 4.4, 'pw'],
      [sv('0 0 120 60', `<path d="M10 52q50-60 100 0" stroke="#ffd23f" stroke-width="10" fill="none"/><path d="M22 52q38-44 76 0" stroke="#ff5d73" stroke-width="10" fill="none"/><path d="M34 52q26-28 52 0" stroke="#5b7cff" stroke-width="10" fill="none"/>`), 8, 11, 3.6, 'pw'],
    ],
    laboratorio: () => [
      [sv('0 0 120 140', `<rect x="4" y="4" width="112" height="132" rx="6" fill="#ffd9ec" stroke="${INK}" stroke-width="4"/><path d="M4 48h112M4 92h112" stroke="${INK}" stroke-width="4"/><rect x="16" y="20" width="14" height="26" rx="3" fill="#5b7cff" stroke="${INK}" stroke-width="3"/><path d="M44 46l8-24 8 24z" fill="#22b07d" stroke="${INK}" stroke-width="3"/><circle cx="88" cy="34" r="11" fill="#ffc93c" stroke="${INK}" stroke-width="3"/><rect x="18" y="62" width="22" height="28" rx="4" fill="#ff8a3d" stroke="${INK}" stroke-width="3"/><path d="M60 90l10-24 10 24z" fill="#a07bff" stroke="${INK}" stroke-width="3"/><rect x="88" y="66" width="16" height="24" rx="3" fill="#ff5d73" stroke="${INK}" stroke-width="3"/><rect x="20" y="104" width="80" height="24" rx="4" fill="#fff" stroke="${INK}" stroke-width="3"/>`), 3, 0, 8.4, 'shelf-prop tap'],
      [sv('0 0 160 70', `<rect x="4" y="10" width="152" height="56" rx="6" fill="#e6e1f2" stroke="${INK}" stroke-width="4"/><rect x="0" y="4" width="160" height="12" rx="5" fill="#fff" stroke="${INK}" stroke-width="4"/>`), 72, 0, 3.6],
      [sv('0 0 70 90', `<path d="M24 6h22v26l18 40a10 10 0 0 1-9 14H15a10 10 0 0 1-9-14l18-40z" fill="#f4fbff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M12 62h46l6 12a8 8 0 0 1-7 10H13a8 8 0 0 1-7-10z" fill="#7dff9a"/><g class="bubbles" fill="#fff"><circle class="lb1" cx="30" cy="56" r="3"/><circle class="lb2" cx="40" cy="48" r="2.4"/><circle class="lb3" cx="34" cy="38" r="2"/></g>`), 82, 3.6, 3.2, 'flask-prop'],
    ],
    jardin: () => [
      [sv('0 0 240 60', `<g fill="#fff" stroke="#d8cfc0" stroke-width="2">${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 20 + 4} 60 V14 l8 -10 l8 10 V60 Z"/>`).join('')}<rect x="0" y="22" width="240" height="8"/><rect x="0" y="42" width="240" height="8"/></g>`), 0, 0, 3.4, 'fence wide'],
      [sv('0 0 80 50', `<g fill="#fff" opacity=".95"><ellipse cx="40" cy="34" rx="34" ry="14"/><circle cx="28" cy="26" r="14"/><circle cx="48" cy="22" r="17"/></g>`), 8, 13, 2.6, 'cloudy'],
      [sv('0 0 80 50', `<g fill="#fff" opacity=".9"><ellipse cx="40" cy="34" rx="34" ry="14"/><circle cx="28" cy="26" r="14"/><circle cx="48" cy="22" r="17"/></g>`), 66, 15, 2, 'cloudy'],
      [sv('0 0 60 60', `<circle cx="30" cy="30" r="18" fill="#ffd23f"/><circle cx="30" cy="30" r="26" fill="#ffd23f" opacity=".25"/>`), 84, 14.5, 3, 'psun'],
    ],
    patio: () => [
      [trees(), 0, 0, 5.4, 'trees wide'],
      [sv('0 0 80 50', `<g fill="#fff" opacity=".95"><ellipse cx="40" cy="34" rx="34" ry="14"/><circle cx="28" cy="26" r="14"/><circle cx="48" cy="22" r="17"/></g>`), 14, 13, 2.4, 'cloudy'],
    ],
    paseo: () => [],
    garaje: () => [], // (el portón, las herramientas, el auto y los conos los pone house.js, a la medida del auto)
  };
  function trees() {
    let s = '';
    for (let i = 0; i < 16; i++) {
      const x = i * 26 + (i % 2) * 8, h = 70 + (i * 37) % 30;
      s += `<g><rect x="${x + 17}" y="${110 - 10}" width="7" height="12" fill="#7a4a24"/><path d="M${x + 20} ${110 - h} l18 ${h * 0.45} h-8 l12 ${h * 0.45} h-44 l12 -${h * 0.45} h-8 z" fill="${i % 3 ? '#2e9a3e' : '#3fb34f'}" stroke="#1d6b2a" stroke-width="2" stroke-linejoin="round"/></g>`;
    }
    return sv('0 0 420 112', s, ' preserveAspectRatio="xMidYMax slice"');
  }
  function isNight() { const h = new Date().getHours(); return h >= 20 || h < 7; }

  // Arco de fútbol del patio (va detrás de la mascota, que ataja)
  function goalSVG() {
    return sv('0 0 300 130', `<defs><pattern id="net" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 0l12 12M12 0L0 12" stroke="#fff" stroke-width="1.3" opacity=".55"/></pattern></defs>` +
      `<rect x="14" y="14" width="272" height="112" fill="url(#net)"/><rect x="14" y="14" width="272" height="112" fill="#fff" opacity=".08"/>` +
      `<path d="M14 128V14h272v114" stroke="#7a4a24" stroke-width="12" fill="none" stroke-linejoin="round"/><path d="M14 128V14h272v114" stroke="${INK}" stroke-width="2" fill="none" opacity=".35"/>`, ' preserveAspectRatio="none"');
  }
  // Auto del garaje: descapotable. Atrás va el respaldo del asiento; adelante, las puertas, el parabrisas y las ruedas
  // (la mascota va sentada en el medio y se le ve de la cintura para arriba).
  function carSVG(front) {
    if (!front) return sv('0 0 320 150', `<path d="M96 96 Q92 54 120 52 L150 52 Q160 54 160 66 L160 96 Z" fill="#e8394a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M106 60 Q118 56 148 58" stroke="#ff7a85" stroke-width="5" fill="none" stroke-linecap="round"/>`);
    return sv('0 0 320 150', `<path d="M222 92 L244 50 Q248 44 254 48 L258 52 L240 92 Z" fill="#bfe6ff" stroke="#9aa3b8" stroke-width="4" stroke-linejoin="round" opacity=".85"/>` +
      `<path d="M18 124 Q10 96 34 90 L286 86 Q312 90 306 124 Z" fill="#fff" stroke="#9aa3b8" stroke-width="5" stroke-linejoin="round"/>` +
      `<path d="M30 92 Q160 82 296 90" stroke="#c3cad6" stroke-width="5" fill="none"/><path d="M150 102h46" stroke="#c3cad6" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M296 100l10 4" stroke="#ffd23f" stroke-width="7" stroke-linecap="round"/><path d="M20 102l10-2" stroke="#e8394a" stroke-width="7" stroke-linecap="round"/>` +
      `<circle cx="74" cy="124" r="23" fill="${INK}"/><circle cx="74" cy="124" r="10" fill="#e8eef6"/><circle cx="246" cy="124" r="23" fill="${INK}"/><circle cx="246" cy="124" r="10" fill="#e8eef6"/>`);
  }
  // Garaje (2.0.2): portón levadizo, tablero de herramientas, cono y cubiertas
  const garageDoorSVG = () => sv('0 0 200 140', `<rect x="3" y="3" width="194" height="137" rx="3" fill="#7d879c" stroke="${INK}" stroke-width="5"/><rect x="12" y="12" width="176" height="128" fill="#d5dbe6"/>` +
    Array.from({ length: 8 }, (_, i) => `<path d="M12 ${28 + i * 15}h176" stroke="#a7b0c2" stroke-width="4"/>`).join('') + `<rect x="86" y="118" width="28" height="7" rx="3" fill="${INK}"/>`, ' preserveAspectRatio="none"');
  const toolsSVG = () => sv('0 0 120 70', `<rect x="3" y="3" width="114" height="64" rx="5" fill="#b07a4a" stroke="${INK}" stroke-width="4"/>` +
    `<g stroke="${INK}" stroke-width="3" stroke-linecap="round"><path d="M22 14v34" stroke="#e8eef6" stroke-width="6"/><rect x="15" y="44" width="14" height="14" rx="3" fill="#e8394a"/>` +
    `<path d="M48 14l0 40" stroke="#c3cad6" stroke-width="5"/><circle cx="48" cy="14" r="7" fill="none" stroke="#c3cad6" stroke-width="5"/>` +
    `<path d="M70 12l10 10-16 30" stroke="#ffd23f" stroke-width="6"/><path d="M96 12v18M90 30h12v20a6 6 0 0 1-12 0z" fill="#5b7cff"/></g>`);
  const coneSVG = () => sv('0 0 50 60', `<path d="M10 56h30l-4-42H14z" fill="#ff7a2e" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M12 38h26M14 24h22" stroke="#fff" stroke-width="5"/><rect x="4" y="52" width="42" height="7" rx="3" fill="#ff7a2e" stroke="${INK}" stroke-width="3"/>`);
  const tiresSVG = () => sv('0 0 70 60', `<g stroke="${INK}" stroke-width="4"><ellipse cx="35" cy="46" rx="31" ry="11" fill="#3a3f4b"/><ellipse cx="35" cy="30" rx="31" ry="11" fill="#3a3f4b"/><ellipse cx="35" cy="14" rx="31" ry="11" fill="#4a5060"/></g><ellipse cx="35" cy="14" rx="13" ry="4.5" fill="#1f2229"/>`);
  // Canteros de la huerta
  function plotSVG(state, cropEmoji) {
    const VB = '0 -40 100 140';
    const dirt = `<ellipse cx="50" cy="78" rx="44" ry="14" fill="${state && state.wet ? '#5a3a22' : '#8a5a3c'}" stroke="${INK}" stroke-width="3"/><ellipse cx="50" cy="74" rx="34" ry="8" fill="${state && state.wet ? '#6b4428' : '#a06a44'}"/>`;
    if (!state) return sv(VB, dirt + `<path d="M40 74h20" stroke="#6b4428" stroke-width="3" stroke-linecap="round"/>`);
    const k = state.pct;
    const h = 14 + 72 * Math.min(1, k);
    let plant = `<path d="M50 74V${f(74 - h)}" stroke="#3f8a2a" stroke-width="4" stroke-linecap="round"/>`;
    const leaf = (y, s, d) => `<path d="M50 ${f(y)} q${f(-14 * s * d)} ${f(-4 * s)} ${f(-16 * s * d)} ${f(-14 * s)} q${f(14 * s * d)} ${f(-2 * s)} ${f(16 * s * d)} ${f(14 * s)} z" fill="#6cc04a" stroke="#3f8a2a" stroke-width="2"/>`;
    plant += leaf(74 - h * 0.35, 0.6 + k * 0.5, 1) + leaf(74 - h * 0.6, 0.5 + k * 0.5, -1);
    if (k > 0.5) plant += leaf(74 - h * 0.85, 0.4 + k * 0.4, 1);
    if (state.ripe) plant += `<text x="50" y="${f(74 - h + 16)}" font-size="40" text-anchor="middle" ${EF()}>${cropEmoji}</text>`;
    else if (k > 0.66) plant += `<circle cx="50" cy="${f(74 - h)}" r="6" fill="#ffd23f" stroke="#c98a12" stroke-width="2"/>`;
    const drops = state.wet ? `<g fill="#7fd3ff"><circle cx="20" cy="70" r="2.5"/><circle cx="82" cy="72" r="2.5"/></g>` : '';
    return sv(VB, dirt + plant + drops, ' style="overflow:visible"');
  }
  const f = (n) => Math.round(n * 10) / 10;

  N.houseArt = { icon, ROOMS, props: (id) => (P[id] ? P[id]() : []), goalSVG, carSVG, plotSVG, isNight, garageDoorSVG, toolsSVG, coneSVG, tiresSVG };
})();
