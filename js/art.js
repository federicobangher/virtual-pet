/* Virtual Pet — arte vectorial de las mascotas (SVG generado por código).
   Todas las mascotas miran a la derecha; dir=-1 las espeja.
   viewBox 0 0 200 200, el piso está en y≈190. */
(function () {
  'use strict';
  const N = (window.N = window.N || {});

  const PAL = {
    dragon: {
      normal: { body: '#ef5d3f', dark: '#b73827', belly: '#ffd79c', horn: '#fff0c8', wing: '#c4402d', wingIn: '#ff9a6b', cheek: '#ff8fa0', spike: '#ffb547' },
      shiny: { body: '#7b61ff', dark: '#4732c0', belly: '#ffe38f', horn: '#ffc93c', wing: '#5a45d6', wingIn: '#b9abff', cheek: '#ff9ed8', spike: '#ffc93c' },
    },
    bird: {
      baby: { body: '#ffd84d', dark: '#e9a91c', belly: '#fff3b8', beak: '#ff9f1c', leg: '#f08a1c', cheek: '#ff9b9b', crest: '#ffc21f' },
      normal: { body: '#4fa8ff', dark: '#2a6fd0', belly: '#e3f3ff', beak: '#ffa62b', leg: '#f08a1c', cheek: '#ff9bb0', crest: '#ff5d73', tail1: '#2a6fd0', tail2: '#7dd3fc', tail3: '#ff5d73' },
      shiny: { body: '#ff6a3d', dark: '#cf3517', belly: '#ffe7a3', beak: '#ffd23f', leg: '#c9541c', cheek: '#ffc0a8', crest: '#ffd23f', tail1: '#ffd23f', tail2: '#ff3d3d', tail3: '#ff9f1c' },
    },
    turtle: {
      normal: { body: '#8fd18a', dark: '#4f9a4a', belly: '#f6d38b', shell: '#c98a42', plate: '#a86a2c', rim: '#f6d38b', cheek: '#ff9fa8', tongue: '#ff7d8f' },
      shiny: { body: '#9be0c9', dark: '#3f9c86', belly: '#ffe9a8', shell: '#ffb703', plate: '#fb8500', rim: '#fff1c2', cheek: '#ffb0c8', tongue: '#ff7d8f' },
    },
    lizard: {
      normal: { body: '#7ccb5b', dark: '#4a9637', belly: '#eef8d4', spot: '#5aa83f', crest: '#f59e3b', cheek: '#ff9fa8', tongue: '#ff6b8b' },
      shiny: { body: '#33c3c9', dark: '#1d8794', belly: '#e2fbfb', spot: '#ff7bb0', crest: '#ffcf3f', cheek: '#ffb0d0', tongue: '#ff6b8b' },
    },
  };

  const INK = '#2b1d1f';
  const f = (n) => Math.round(n * 10) / 10;

  function palette(species, stage, variant) {
    if (species === 'bird' && stage === 'baby') return PAL.bird.baby;
    return PAL[species][variant === 'shiny' ? 'shiny' : 'normal'];
  }

  /* ---------------- cara ---------------- */
  function face(h, mood, c, kind, eyeScale) {
    const { x: hx, y: hy, r } = h;
    const es = eyeScale || 1;
    const rx = r * 0.13 * es, ry = r * 0.17 * es;
    const ey = hy - r * 0.04;
    const eyes = [hx - r * 0.3, hx + r * 0.36];
    const sw = f(r * 0.075);
    let out = '';

    // mejillas
    const ck = mood === 'sick' ? 'fill="#9bd36a" opacity=".6"' : 'fill="url(#__ID__k)"';
    out += `<ellipse class="cheek" cx="${f(eyes[0] - r * 0.12)}" cy="${f(ey + r * 0.3)}" rx="${f(r * 0.17)}" ry="${f(r * 0.11)}" ${ck}/>`;
    out += `<ellipse class="cheek" cx="${f(eyes[1] + r * 0.14)}" cy="${f(ey + r * 0.3)}" rx="${f(r * 0.17)}" ry="${f(r * 0.11)}" ${ck}/>`;

    // ojos
    let eyeSvg = '';
    eyes.forEach((ex, i) => {
      if (mood === 'happy' || mood === 'eat') {
        eyeSvg += `<path d="M${f(ex - rx * 1.1)} ${f(ey + ry * 0.35)} Q${f(ex)} ${f(ey - ry * 1.1)} ${f(ex + rx * 1.1)} ${f(ey + ry * 0.35)}" stroke="${INK}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
      } else if (mood === 'sleep' || mood === 'yawn') {
        eyeSvg += `<path d="M${f(ex - rx * 1.1)} ${f(ey)} Q${f(ex)} ${f(ey + ry * 0.9)} ${f(ex + rx * 1.1)} ${f(ey)}" stroke="${INK}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
      } else if (mood === 'dead') {
        const d = rx * 0.9;
        eyeSvg += `<path d="M${f(ex - d)} ${f(ey - d)} L${f(ex + d)} ${f(ey + d)} M${f(ex + d)} ${f(ey - d)} L${f(ex - d)} ${f(ey + d)}" stroke="${INK}" stroke-width="${sw}" stroke-linecap="round"/>`;
      } else if (mood === 'sick') {
        eyeSvg += `<ellipse cx="${f(ex)}" cy="${f(ey + ry * 0.2)}" rx="${f(rx)}" ry="${f(ry * 0.6)}" fill="${INK}"/>`;
        eyeSvg += `<path d="M${f(ex - rx * 1.5)} ${f(ey - ry * 0.25)} L${f(ex + rx * 1.5)} ${f(ey - ry * 0.25)}" stroke="${c.dark}" stroke-width="${f(sw * 1.1)}" stroke-linecap="round"/>`;
      } else {
        const sad = mood === 'sad';
        const k = sad ? 0.85 : 1;
        eyeSvg += `<g class="eye"><ellipse cx="${f(ex)}" cy="${f(ey)}" rx="${f(rx * k)}" ry="${f(ry * k)}" fill="${INK}"/>` +
          `<ellipse cx="${f(ex)}" cy="${f(ey + ry * 0.45)}" rx="${f(rx * 0.62 * k)}" ry="${f(ry * 0.32 * k)}" fill="#5b3fa8" opacity=".55"/>` +
          `<g class="look"><circle cx="${f(ex + rx * 0.35)}" cy="${f(ey - ry * 0.42)}" r="${f(rx * 0.42)}" fill="#fff"/>` +
          `<circle cx="${f(ex - rx * 0.35)}" cy="${f(ey + ry * 0.4)}" r="${f(rx * 0.18)}" fill="#fff" opacity=".8"/></g></g>`;
        if (sad) {
          const inner = i === 0 ? 1 : -1; // ceja: extremo interno más alto
          const x1 = ex - rx * 1.3, x2 = ex + rx * 1.3;
          const yIn = ey - ry * 2.0, yOut = ey - ry * 1.35;
          eyeSvg += `<path d="M${f(x1)} ${f(inner === 1 ? yOut : yIn)} L${f(x2)} ${f(inner === 1 ? yIn : yOut)}" stroke="${INK}" stroke-width="${f(sw * 0.8)}" stroke-linecap="round"/>`;
        }
      }
    });
    out += `<g class="eyes${mood === 'normal' || mood === 'sad' ? ' blink' : ''}">${eyeSvg}</g>`;
    if (mood === 'sad') {
      out += `<path class="tear" d="M${f(eyes[0] - rx * 0.4)} ${f(ey + ry * 1.1)} q${f(-r * 0.06)} ${f(r * 0.14)} 0 ${f(r * 0.17)} q${f(r * 0.06)} ${f(-r * 0.03)} 0 ${f(-r * 0.17)}z" fill="#7cc7ff"/>`;
    }
    if (mood === 'sick') {
      out += `<path d="M${f(hx + r * 0.75)} ${f(hy - r * 0.55)} q${f(-r * 0.09)} ${f(r * 0.17)} 0 ${f(r * 0.22)} q${f(r * 0.09)} ${f(-r * 0.05)} 0 ${f(-r * 0.22)}z" fill="#8fd3ff" stroke="#fff" stroke-width="1"/>`;
    }

    // boca
    const mx = hx + r * 0.06, my = hy + r * 0.36;
    if (kind === 'beak') {
      out += beak(mx, my - r * 0.06, r, mood, c);
    } else {
      if (kind === 'snout') {
        out += `<circle cx="${f(mx - r * 0.08)}" cy="${f(my - r * 0.14)}" r="${f(r * 0.03)}" fill="${c.dark}"/><circle cx="${f(mx + r * 0.1)}" cy="${f(my - r * 0.14)}" r="${f(r * 0.03)}" fill="${c.dark}"/>`;
      }
      out += mouth(mx, my, r, mood, kind === 'lizard' ? c.tongue : '#ff7d8f');
    }
    return out;
  }

  function mouth(mx, my, r, mood, tongue) {
    const sw = f(r * 0.06);
    const w = r * 0.16;
    if (mood === 'happy') {
      return `<path d="M${f(mx - w * 1.15)} ${f(my - r * 0.02)} Q${f(mx)} ${f(my + r * 0.34)} ${f(mx + w * 1.15)} ${f(my - r * 0.02)} Z" fill="#7a2630"/>` +
        `<ellipse cx="${f(mx + r * 0.02)}" cy="${f(my + r * 0.13)}" rx="${f(w * 0.55)}" ry="${f(r * 0.06)}" fill="${tongue}"/>`;
    }
    if (mood === 'eat') {
      return `<g class="chomp"><path class="open" d="M${f(mx - w)} ${f(my - r * 0.02)} Q${f(mx)} ${f(my + r * 0.36)} ${f(mx + w)} ${f(my - r * 0.02)} Z" fill="#7a2630"/>` +
        `<path class="shut" d="M${f(mx - w)} ${f(my + r * 0.04)} Q${f(mx)} ${f(my + r * 0.12)} ${f(mx + w)} ${f(my + r * 0.04)}" stroke="${INK}" stroke-width="${sw}" fill="none" stroke-linecap="round"/></g>`;
    }
    if (mood === 'sad') {
      return `<path d="M${f(mx - w)} ${f(my + r * 0.1)} Q${f(mx)} ${f(my - r * 0.04)} ${f(mx + w)} ${f(my + r * 0.1)}" stroke="${INK}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
    }
    if (mood === 'sick') {
      const s = w / 2;
      return `<path d="M${f(mx - w)} ${f(my + r * 0.06)} q${f(s / 2)} ${f(-r * 0.06)} ${f(s)} 0 t${f(s)} 0 t${f(s)} 0 t${f(s)} 0" stroke="${INK}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
    }
    if (mood === 'sleep') {
      return `<ellipse cx="${f(mx)}" cy="${f(my + r * 0.06)}" rx="${f(r * 0.05)}" ry="${f(r * 0.06)}" fill="#7a2630"/>`;
    }
    if (mood === 'yawn') {
      return `<ellipse cx="${f(mx)}" cy="${f(my + r * 0.12)}" rx="${f(w * 0.8)}" ry="${f(r * 0.2)}" fill="#7a2630"/>` +
        `<ellipse cx="${f(mx)}" cy="${f(my + r * 0.24)}" rx="${f(w * 0.5)}" ry="${f(r * 0.07)}" fill="${tongue}"/>`;
    }
    if (mood === 'dead') {
      return `<path d="M${f(mx - w * 0.8)} ${f(my + r * 0.06)} L${f(mx + w * 0.8)} ${f(my + r * 0.06)}" stroke="${INK}" stroke-width="${sw}" stroke-linecap="round"/>`;
    }
    return `<path d="M${f(mx - w)} ${f(my)} Q${f(mx)} ${f(my + r * 0.16)} ${f(mx + w)} ${f(my)}" stroke="${INK}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
  }

  function beak(bx, by, r, mood, c) {
    const L = r * 0.34, H = r * 0.15;
    const open = mood === 'happy' || mood === 'eat' || mood === 'yawn';
    const upper = `<path d="M${f(bx - L * 0.45)} ${f(by - H)} Q${f(bx + L * 0.5)} ${f(by - H * 0.9)} ${f(bx + L * 0.75)} ${f(by + H * 0.25)} Q${f(bx + L * 0.1)} ${f(by + H * 0.25)} ${f(bx - L * 0.45)} ${f(by + H * 0.1)} Z" fill="${c.beak}" stroke="${shade(c.beak)}" stroke-width="1.2" stroke-linejoin="round"/>`;
    const dy = open ? H * 0.9 : 0;
    const lower = `<path d="M${f(bx - L * 0.4)} ${f(by + H * 0.2 + dy * 0.3)} Q${f(bx + L * 0.25)} ${f(by + H * 0.4 + dy)} ${f(bx + L * 0.5)} ${f(by + H * 0.35 + dy * 0.6)} Q${f(bx + L * 0.05)} ${f(by + H * 1.3 + dy)} ${f(bx - L * 0.4)} ${f(by + H * 0.8 + dy * 0.6)} Z" fill="${shade(c.beak, 0.92)}" stroke="${shade(c.beak)}" stroke-width="1.2" stroke-linejoin="round"/>`;
    let inside = '';
    if (open) inside = `<ellipse cx="${f(bx)}" cy="${f(by + H * 0.6)}" rx="${f(L * 0.35)}" ry="${f(H * 0.7)}" fill="#7a2630"/>`;
    const cls = mood === 'eat' ? ' class="peck"' : '';
    return `<g${cls}>${inside}${lower}${upper}</g>`;
  }

  function shade(hex, k) {
    k = k || 0.78;
    const n = parseInt(hex.slice(1), 16);
    const cl = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
    const r = cl((n >> 16) & 255), g = cl((n >> 8) & 255), b = cl(n & 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  /* ---------------- partes comunes ---------------- */
  function foot(cx, cy, rx, ry, col, cls) {
    return `<ellipse class="${cls}" cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${col}" style="transform-origin:${f(cx)}px ${f(cy)}px"/>`;
  }

  function batWing(px, py, s, c, cls) {
    // ala de murciélago anclada en (px,py), apunta hacia arriba-izquierda
    const p = (x, y) => `${f(px + x * s)} ${f(py + y * s)}`;
    const outer = `M${p(0, 0)} C${p(-8, -18)} ${p(-22, -38)} ${p(-34, -46)} C${p(-36, -36)} ${p(-44, -30)} ${p(-50, -28)} C${p(-46, -18)} ${p(-50, -10)} ${p(-56, -4)} C${p(-40, -6)} ${p(-22, 4)} ${p(-6, 10)} Z`;
    const inner = `M${p(-4, 2)} C${p(-12, -14)} ${p(-22, -30)} ${p(-32, -40)} C${p(-32, -32)} ${p(-38, -26)} ${p(-44, -24)} C${p(-40, -16)} ${p(-42, -10)} ${p(-46, -5)} C${p(-32, -4)} ${p(-18, 4)} ${p(-6, 8)} Z`;
    const ribs = `M${p(-2, 2)} L${p(-34, -44)} M${p(-3, 3)} L${p(-48, -27)} M${p(-4, 5)} L${p(-54, -5)}`;
    return `<g class="${cls}" style="transform-origin:${f(px)}px ${f(py)}px"><path d="${outer}" fill="${c.wing}"/><path d="${inner}" fill="${c.wingIn}" opacity=".85"/><path d="${ribs}" stroke="${c.wing}" stroke-width="${f(1.6 * s)}" fill="none" stroke-linecap="round"/></g>`;
  }

  function featherWing(cx, cy, s, c, cls, rot) {
    const pathD = `M0 0 C-6 -14 -30 -18 -44 -6 C-40 -2 -38 2 -40 6 C-34 6 -32 10 -34 14 C-26 14 -14 14 0 8 Z`;
    return `<g class="${cls}" style="transform-origin:${f(cx)}px ${f(cy)}px"><g transform="translate(${f(cx)} ${f(cy)}) rotate(${rot || 0}) scale(${s})">` +
      `<path d="${pathD}" fill="${c.dark}"/><path d="M-6 2 C-16 -6 -28 -6 -38 -2" stroke="${c.body}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>` +
      `<path d="M-8 7 C-18 4 -26 6 -34 9" stroke="${c.body}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/></g></g>`;
  }

  /* ---------------- DRAGÓN ---------------- */
  function dragon(stage, c, mood) {
    const G = {
      baby: { b: [98, 160, 36, 29], h: [108, 116, 36], wing: [80, 142, 0.42], tail: 'M70 172 Q44 182 34 160 Q48 170 66 156 Z', feet: [[84, 186, 12, 6], [114, 187, 12, 6]], horn: 0.6, eye: 1.15 },
      young: { b: [95, 152, 41, 34], h: [120, 100, 31], wing: [82, 128, 0.68], tail: 'M62 166 Q30 184 14 160 Q12 152 6 146 Q18 148 24 156 Q36 168 58 146 Z', feet: [[80, 184, 14, 7], [116, 185, 14, 7]], horn: 0.85, eye: 1.0, neck: true, spikes: 3 },
      adult: { b: [92, 146, 48, 40], h: [130, 80, 31], wing: [80, 116, 0.98], tail: 'M54 162 Q20 192 2 156 Q-2 146 -6 136 Q8 140 12 150 Q24 170 52 138 Z', feet: [[76, 184, 16, 8], [118, 185, 16, 8]], horn: 1.1, eye: 0.95, neck: true, spikes: 4, snout: true },
    }[stage];
    const [bx, by, brx, bry] = G.b;
    const [hx, hy, hr] = G.h;
    let s = '';
    // la punta de la cola va dentro del mismo grupo que la cola: así se mueven juntas (antes quedaba suelta en el aire)
    s += `<g class="tail" style="transform-origin:${bx - brx * 0.6}px ${by + 8}px"><path d="${G.tail}" fill="${c.body}" stroke="${c.dark}" stroke-width="1.5"/>`;
    if (stage === 'adult') s += `<path d="M-4 141 C-22 140 -22 118 -12 110 C-9 122 2 126 6 133 Z" fill="${c.dark}"/>`;
    if (stage === 'young') s += `<path d="M8 149 C-6 150 -8 134 0 128 C2 137 10 140 13 144 Z" fill="${c.dark}"/>`;
    s += '</g>';
    s += batWing(G.wing[0], G.wing[1], G.wing[2], c, 'wing wing-back');
    s += foot(G.feet[0][0], G.feet[0][1], G.feet[0][2], G.feet[0][3], c.dark, 'foot foot-b');
    // espinas del lomo
    if (G.spikes) {
      for (let i = 0; i < G.spikes; i++) {
        const t = (i + 0.6) / (G.spikes + 0.4);
        const ang = Math.PI * (1.12 - t * 0.55);
        const px = bx + Math.cos(ang) * brx * 0.98, py = by - Math.sin(ang) * bry * 0.98;
        const sz = 7 + (stage === 'adult' ? 3 : 0);
        s += `<path d="M${f(px - sz)} ${f(py + 3)} L${f(px - 2)} ${f(py - sz * 1.3)} L${f(px + sz * 0.7)} ${f(py + 4)} Z" fill="${c.spike}" stroke="${c.dark}" stroke-width="1"/>`;
      }
    }
    if (G.neck) {
      s += `<path d="M${bx + brx * 0.25} ${by - bry * 0.7} Q${hx - hr * 0.6} ${hy + hr * 0.2} ${hx - hr * 0.2} ${hy + hr * 0.4} L${hx + hr * 0.3} ${hy + hr * 0.7} Q${bx + brx * 0.85} ${by - bry * 0.1} ${bx + brx * 0.75} ${by + bry * 0.15} Z" fill="${c.body}"/>`;
    }
    s += `<ellipse cx="${bx}" cy="${by}" rx="${brx}" ry="${bry}" fill="${c.body}"/>`;
    s += `<ellipse cx="${bx + brx * 0.28}" cy="${by + bry * 0.16}" rx="${f(brx * 0.52)}" ry="${f(bry * 0.66)}" fill="${c.belly}"/>`;
    if (stage !== 'baby') {
      for (let i = -1; i <= 1; i++) s += `<path d="M${f(bx + brx * 0.28 - brx * 0.38)} ${f(by + bry * 0.16 + i * bry * 0.24)} Q${f(bx + brx * 0.28)} ${f(by + bry * 0.16 + i * bry * 0.24 + 4)} ${f(bx + brx * 0.28 + brx * 0.38)} ${f(by + bry * 0.16 + i * bry * 0.24)}" stroke="${shade(c.belly, 0.85)}" stroke-width="1.6" fill="none"/>`;
      // bracito
      const ax = bx + brx * 0.78, ay = by - bry * 0.02;
      s += `<path class="arm" style="transform-origin:${f(ax - 3)}px ${f(ay - 3)}px" d="M${f(ax - 5)} ${f(ay - 6)} Q${f(ax + 12)} ${f(ay - 2)} ${f(ax + 10)} ${f(ay + 12)} Q${f(ax + 4)} ${f(ay + 15)} ${f(ax + 1)} ${f(ay + 8)} Q${f(ax - 2)} ${f(ay + 2)} ${f(ax - 6)} ${f(ay + 2)} Z" fill="${c.body}" stroke="${c.dark}" stroke-width="1.3" stroke-linejoin="round"/>`;
    }
    s += foot(G.feet[1][0], G.feet[1][1], G.feet[1][2], G.feet[1][3], c.dark, 'foot foot-a');
    // cabeza
    let head = '';
    const hs = G.horn;
    head += `<path d="M${f(hx - hr * 0.45)} ${f(hy - hr * 0.7)} q${f(-6 * hs)} ${f(-16 * hs)} ${f(-16 * hs)} ${f(-22 * hs)} q${f(4 * hs)} ${f(12 * hs)} ${f(2 * hs)} ${f(26 * hs)} z" fill="${c.horn}" stroke="${shade(c.horn, 0.8)}" stroke-width="1.2"/>`;
    head += `<path d="M${f(hx + hr * 0.12)} ${f(hy - hr * 0.86)} q${f(-4 * hs)} ${f(-17 * hs)} ${f(-13 * hs)} ${f(-25 * hs)} q${f(5 * hs)} ${f(13 * hs)} ${f(5 * hs)} ${f(27 * hs)} z" fill="${c.horn}" stroke="${shade(c.horn, 0.8)}" stroke-width="1.2"/>`;
    // aletas de oreja
    head += `<path d="M${f(hx - hr * 0.86)} ${f(hy - hr * 0.1)} l${f(-hr * 0.42)} ${f(-hr * 0.22)} l${f(hr * 0.12)} ${f(hr * 0.38)} z" fill="${c.wingIn}" stroke="${c.dark}" stroke-width="1"/>`;
    head += `<circle cx="${hx}" cy="${hy}" r="${hr}" fill="${c.body}"/>`;
    if (G.snout) head += `<ellipse cx="${f(hx + hr * 0.2)}" cy="${f(hy + hr * 0.42)}" rx="${f(hr * 0.62)}" ry="${f(hr * 0.4)}" fill="${shade(c.body, 1.06)}"/>`;
    head += face({ x: hx, y: hy, r: hr }, mood, c, 'snout', G.eye);
    s += `<g class="head" style="transform-origin:${hx}px ${hy + hr}px">${head}${HEADSLOT}</g>`;
    return { svg: s, head: { x: hx, y: hy, r: hr, top: hy - hr - 6 * hs }, frontWing: '' };
  }

  /* ---------------- PÁJARO ---------------- */
  function bird(stage, c, mood) {
    let s = '';
    if (stage === 'baby') {
      const hx = 102, hy = 140, hr = 36;
      s += foot(88, 187, 9, 5, c.leg, 'foot foot-b') + foot(114, 187, 9, 5, c.leg, 'foot foot-a');
      s += `<path d="M88 112 q-4 -16 6 -22 q-1 10 5 20 z M97 110 q3 -19 16 -20 q-7 9 -5 21 z" fill="${c.crest}"/>`;
      s += `<circle cx="100" cy="146" r="40" fill="${c.body}"/>`;
      s += `<ellipse cx="106" cy="164" rx="24" ry="18" fill="${c.belly}"/>`;
      s += featherWing(72, 156, 0.55, c, 'wing wing-front', -20);
      s += `<g class="head" style="transform-origin:100px 186px">${face({ x: hx, y: hy, r: hr }, mood, c, 'beak', 1.15)}${HEADSLOT}</g>`;
      return { svg: s, head: { x: hx, y: hy - 6, r: hr, top: 104 } };
    }
    const G = stage === 'young'
      ? { b: [96, 148, 36, 33], h: [116, 102, 28], legs: [[88, 178], [108, 178]], legLen: 10, tailLen: 0.7, crest: 0.8, wing: [86, 142, 0.85] }
      : { b: [92, 138, 42, 38], h: [124, 82, 29], legs: [[82, 174], [106, 174]], legLen: 14, tailLen: 1.15, crest: 1.25, wing: [80, 130, 1.05] };
    const [bx, by, brx, bry] = G.b;
    const [hx, hy, hr] = G.h;
    // cola
    const tl = G.tailLen;
    const tx = bx - brx * 0.82, ty = by + bry * 0.25;
    s += `<g class="tail" style="transform-origin:${f(tx)}px ${f(ty)}px">`;
    [[c.tail3, 18, -10], [c.tail2, 8, 0], [c.tail1, -4, 10]].forEach(([col, a, dy]) => {
      s += `<path d="M${f(tx + 6)} ${f(ty - 4)} Q${f(tx - 30 * tl)} ${f(ty - 8 + dy - a * 0.2)} ${f(tx - 52 * tl)} ${f(ty + 18 * tl + dy)} Q${f(tx - 26 * tl)} ${f(ty + 12 + dy * 0.4)} ${f(tx + 8)} ${f(ty + 8)} Z" fill="${col}"/>`;
    });
    s += `</g>`;
    // patas
    G.legs.forEach(([lx, ly], i) => {
      s += `<g class="foot ${i ? 'foot-a' : 'foot-b'}" style="transform-origin:${lx}px ${ly}px"><path d="M${lx} ${ly} L${lx} ${ly + G.legLen} M${lx} ${ly + G.legLen} l9 2 M${lx} ${ly + G.legLen} l-6 3 M${lx} ${ly + G.legLen} l4 5" stroke="${c.leg}" stroke-width="3.5" stroke-linecap="round" fill="none"/></g>`;
    });
    // cuerpo
    s += `<path d="M${hx - hr * 0.5} ${hy + hr * 0.5} Q${bx + brx * 0.9} ${by - bry * 0.6} ${bx + brx * 0.85} ${by} L${bx} ${by} Z" fill="${c.body}"/>`;
    s += `<ellipse cx="${bx}" cy="${by}" rx="${brx}" ry="${bry}" fill="${c.body}"/>`;
    s += `<ellipse cx="${bx + brx * 0.3}" cy="${by + bry * 0.18}" rx="${f(brx * 0.5)}" ry="${f(bry * 0.66)}" fill="${c.belly}"/>`;
    s += featherWing(G.wing[0], G.wing[1], G.wing[2], c, 'wing wing-front', -14);
    // cabeza
    let head = '';
    const cs = G.crest;
    head += `<g class="crest" style="transform-origin:${f(hx)}px ${f(hy - hr * 0.8)}px">`;
    [[-0.25, -26, 0], [0.05, -32, 6], [0.32, -24, 12]].forEach(([ox, len, rot]) => {
      const x0 = hx + hr * ox, y0 = hy - hr * 0.85;
      head += `<path d="M${f(x0 - 4)} ${f(y0 + 4)} Q${f(x0 - 12 * cs + rot * 0.2)} ${f(y0 + len * cs * 0.6)} ${f(x0 - 10 * cs + rot)} ${f(y0 + len * cs)} Q${f(x0 + 2 + rot * 0.3)} ${f(y0 + len * cs * 0.5)} ${f(x0 + 5)} ${f(y0 + 4)} Z" fill="${c.crest}"/>`;
    });
    head += `</g>`;
    head += `<circle cx="${hx}" cy="${hy}" r="${hr}" fill="${c.body}"/>`;
    head += `<ellipse cx="${f(hx + hr * 0.15)}" cy="${f(hy + hr * 0.25)}" rx="${f(hr * 0.62)}" ry="${f(hr * 0.55)}" fill="${c.belly}" opacity=".55"/>`;
    head += face({ x: hx, y: hy, r: hr }, mood, c, 'beak', 1.05);
    s += `<g class="head" style="transform-origin:${hx}px ${hy + hr}px">${head}${HEADSLOT}</g>`;
    return { svg: s, head: { x: hx, y: hy, r: hr, top: hy - hr - 18 * cs } };
  }

  /* ---------------- LAGARTO ---------------- */
  function lizard(stage, c, mood) {
    const G = {
      baby: { b: [96, 168, 36, 21], h: [124, 136, 32], tail: 'M64 172 Q38 186 30 168 Q26 154 40 154 Q50 156 46 164 Q42 170 50 170 Q58 168 64 162 Z', legs: [[74, 184], [114, 185]], eye: 1.3, spots: 3 },
      young: { b: [90, 160, 46, 24], h: [138, 126, 28], tail: 'M50 166 Q20 190 6 166 Q0 148 18 146 Q32 148 26 160 Q22 168 32 168 Q42 166 50 154 Z', legs: [[62, 182], [116, 183]], eye: 1.15, spots: 4, crest: 4 },
      adult: { b: [86, 152, 54, 28], h: [146, 112, 30], tail: 'M40 160 Q4 194 -10 160 Q-14 136 8 136 Q26 138 18 154 Q14 164 26 162 Q36 160 40 144 Z', legs: [[52, 178], [118, 179]], eye: 1.1, spots: 5, crest: 6, frill: true },
    }[stage];
    const [bx, by, brx, bry] = G.b;
    const [hx, hy, hr] = G.h;
    let s = '';
    s += `<path class="tail" d="${G.tail}" fill="${c.body}" stroke="${c.dark}" stroke-width="1.5" style="transform-origin:${bx - brx * 0.7}px ${by}px"/>`;
    // patas traseras (atrás)
    const leg = (lx, ly, cls) => `<g class="foot ${cls}" style="transform-origin:${lx}px ${ly - 10}px"><path d="M${lx - 7} ${ly - 14} Q${lx - 9} ${ly - 2} ${lx - 4} ${ly + 4} L${lx + 8} ${ly + 4} Q${lx + 9} ${ly - 4} ${lx + 7} ${ly - 14} Z" fill="${c.dark}"/>` +
      `<circle cx="${lx - 3}" cy="${ly + 5}" r="3" fill="${c.dark}"/><circle cx="${lx + 3}" cy="${ly + 6}" r="3" fill="${c.dark}"/><circle cx="${lx + 9}" cy="${ly + 5}" r="3" fill="${c.dark}"/></g>`;
    s += leg(G.legs[0][0] + 12, G.legs[0][1] - 2, 'foot-a');
    s += leg(G.legs[1][0] + 12, G.legs[1][1] - 2, 'foot-b');
    // cresta del lomo
    if (G.crest) {
      for (let i = 0; i < G.crest; i++) {
        const t = (i + 0.5) / G.crest;
        const ang = Math.PI * (0.95 - t * 0.6);
        const px = bx + Math.cos(ang) * brx * 0.96, py = by - Math.sin(ang) * bry * 0.96;
        s += `<path d="M${f(px - 6)} ${f(py + 3)} L${f(px)} ${f(py - 9)} L${f(px + 6)} ${f(py + 3)} Z" fill="${c.crest}"/>`;
      }
    }
    if (G.frill) {
      const fx = hx - hr * 0.3, fy = hy + 6, R = hr * 1.32;
      let pts = [];
      const a0 = Math.PI * 0.62, a1 = Math.PI * 1.9, n = 13;
      for (let i = 0; i <= n; i++) {
        const a = a0 + (a1 - a0) * (i / n);
        const rr = i % 2 ? R * 0.84 : R;
        pts.push(`${f(fx + Math.cos(a) * rr)} ${f(fy + Math.sin(a) * rr)}`);
      }
      s += `<g class="frill" style="transform-origin:${f(fx)}px ${f(fy)}px"><path d="M${f(fx)} ${f(fy)} L${pts.join(' L')} Z" fill="${c.crest}" stroke="${shade(c.crest, 0.8)}" stroke-width="1.5" stroke-linejoin="round"/>`;
      for (let i = 0; i <= n; i += 2) {
        const a = a0 + (a1 - a0) * (i / n);
        s += `<path d="M${f(fx + Math.cos(a) * R * 0.3)} ${f(fy + Math.sin(a) * R * 0.3)} L${f(fx + Math.cos(a) * R * 0.92)} ${f(fy + Math.sin(a) * R * 0.92)}" stroke="${shade(c.crest, 0.8)}" stroke-width="1.6" stroke-linecap="round"/>`;
      }
      s += `</g>`;
    }
    // cuerpo
    s += `<path d="M${bx + brx * 0.4} ${by - bry * 0.8} Q${hx - hr * 0.9} ${hy - hr * 0.2} ${hx - hr * 0.3} ${hy + hr * 0.2} L${hx} ${hy + hr * 0.8} Q${bx + brx * 0.9} ${by + bry * 0.4} ${bx + brx * 0.7} ${by + bry * 0.6} Z" fill="${c.body}"/>`;
    s += `<ellipse cx="${bx}" cy="${by}" rx="${brx}" ry="${bry}" fill="${c.body}"/>`;
    s += `<ellipse cx="${bx + brx * 0.1}" cy="${by + bry * 0.42}" rx="${f(brx * 0.78)}" ry="${f(bry * 0.48)}" fill="${c.belly}"/>`;
    for (let i = 0; i < G.spots; i++) {
      const sx = bx - brx * 0.6 + (i / Math.max(1, G.spots - 1)) * brx * 1.1;
      const sy = by - bry * (0.35 + 0.15 * (i % 2));
      s += `<ellipse cx="${f(sx)}" cy="${f(sy)}" rx="${f(4 + (i % 2) * 1.5)}" ry="${f(3 + (i % 2))}" fill="${c.spot}"/>`;
    }
    // patas delanteras
    s += leg(G.legs[0][0], G.legs[0][1], 'foot-b');
    s += leg(G.legs[1][0], G.legs[1][1], 'foot-a');
    // cabeza
    let head = `<circle cx="${hx}" cy="${hy}" r="${hr}" fill="${c.body}"/>`;
    head += `<ellipse cx="${f(hx + hr * 0.1)}" cy="${f(hy + hr * 0.5)}" rx="${f(hr * 0.7)}" ry="${f(hr * 0.35)}" fill="${c.belly}" opacity=".7"/>`;
    head += `<circle cx="${f(hx - hr * 0.55)}" cy="${f(hy - hr * 0.5)}" r="${f(hr * 0.12)}" fill="${c.spot}"/><circle cx="${f(hx - hr * 0.2)}" cy="${f(hy - hr * 0.75)}" r="${f(hr * 0.09)}" fill="${c.spot}"/>`;
    head += face({ x: hx, y: hy, r: hr }, mood, c, 'lizard', G.eye);
    s += `<g class="head" style="transform-origin:${hx}px ${hy + hr}px">${head}${HEADSLOT}</g>`;
    return { svg: s, head: { x: hx, y: hy, r: hr, top: hy - hr } };
  }

  /* ---------------- TORTUGA ---------------- */
  function turtle(stage, c, mood) {
    const G = {
      baby: { sh: [94, 168, 34, 30], h: [134, 146, 27], eye: 1.25, leg: 0.8 },
      young: { sh: [92, 166, 44, 36], h: [146, 136, 25], eye: 1.1, leg: 1 },
      adult: { sh: [88, 164, 56, 46], h: [156, 122, 27], eye: 1.0, leg: 1.2 },
    }[stage];
    const [cx, cy, rx, ry] = G.sh;
    const [hx, hy, hr] = G.h;
    const id = 'tt' + Math.random().toString(36).slice(2, 7);
    const L = G.leg;
    let s = '';
    // colita
    s += `<path class="tail" d="M${f(cx - rx + 4)} ${f(cy - 2)} L${f(cx - rx - 12 * L)} ${f(cy + 6)} L${f(cx - rx + 6)} ${f(cy + 8)} Z" fill="${c.body}" stroke="${c.dark}" stroke-width="1.2" stroke-linejoin="round" style="transform-origin:${f(cx - rx + 4)}px ${f(cy + 3)}px"/>`;
    // patas de atrás (más oscuras, detrás)
    const leg = (lx, cls, col) => `<g class="foot ${cls}" style="transform-origin:${f(lx)}px ${f(cy + 6)}px"><path d="M${f(lx - 9 * L)} ${f(cy)} L${f(lx - 10 * L)} ${f(cy + 18 * L)} Q${f(lx)} ${f(cy + 23 * L)} ${f(lx + 10 * L)} ${f(cy + 18 * L)} L${f(lx + 9 * L)} ${f(cy)} Z" fill="${col}"/>` +
      `<circle cx="${f(lx - 5 * L)}" cy="${f(cy + 19 * L)}" r="${f(1.8 * L)}" fill="#fff" opacity=".8"/><circle cx="${f(lx)}" cy="${f(cy + 20.5 * L)}" r="${f(1.8 * L)}" fill="#fff" opacity=".8"/><circle cx="${f(lx + 5 * L)}" cy="${f(cy + 19 * L)}" r="${f(1.8 * L)}" fill="#fff" opacity=".8"/></g>`;
    s += leg(cx - rx * 0.35, 'foot-a', c.dark) + leg(cx + rx * 0.75, 'foot-b', c.dark);
    // cuello y cabeza (detrás del caparazón por abajo)
    s += `<path d="M${f(cx + rx * 0.6)} ${f(cy - ry * 0.05)} Q${f(hx - hr * 0.9)} ${f(hy + hr * 0.2)} ${f(hx - hr * 0.3)} ${f(hy + hr * 0.6)} L${f(hx + hr * 0.2)} ${f(hy + hr * 0.95)} Q${f(cx + rx * 0.95)} ${f(cy + 6)} ${f(cx + rx * 0.7)} ${f(cy + 8)} Z" fill="${c.body}"/>`;
    // patas de adelante
    s += leg(cx - rx * 0.62, 'foot-b', c.body) + leg(cx + rx * 0.45, 'foot-a', c.body);
    // caparazón
    const dome = `M${f(cx - rx)} ${f(cy)} A${rx} ${ry} 0 0 1 ${f(cx + rx)} ${f(cy)} Z`;
    s += `<clipPath id="${id}"><path d="${dome}"/></clipPath>`;
    s += `<path d="${dome}" fill="${c.shell}"/>`;
    let plates = '';
    const pr = rx * 0.32, pcx = cx + rx * 0.02, pcy = cy - ry * 0.48;
    const hex = (x, y, r) => { let d = ''; for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; d += (i ? 'L' : 'M') + f(x + Math.cos(a) * r) + ' ' + f(y + Math.sin(a) * r * 0.82); } return d + 'Z'; };
    plates += `<path d="${hex(pcx, pcy, pr)}" fill="${c.plate}" opacity=".55"/>`;
    [[-1.75, 0.55], [1.75, 0.55], [-0.9, 1.35], [0.9, 1.35], [0, 1.9], [-2.6, 1.6], [2.6, 1.6]].forEach(([dx, dy]) => {
      plates += `<path d="${hex(pcx + dx * pr, pcy + dy * pr * 0.82, pr * 0.92)}" fill="none" stroke="${c.plate}" stroke-width="${f(2.2 * L)}"/>`;
    });
    plates += `<path d="${hex(pcx, pcy, pr)}" fill="none" stroke="${c.plate}" stroke-width="${f(2.4 * L)}"/>`;
    s += `<g clip-path="url(#${id})">${plates}<ellipse cx="${f(cx - rx * 0.35)}" cy="${f(cy - ry * 0.7)}" rx="${f(rx * 0.28)}" ry="${f(ry * 0.14)}" fill="#fff" opacity=".28" transform="rotate(-20 ${f(cx - rx * 0.35)} ${f(cy - ry * 0.7)})"/></g>`;
    s += `<path d="${dome}" fill="none" stroke="${shade(c.shell, 0.7)}" stroke-width="2"/>`;
    // borde del caparazón
    s += `<rect x="${f(cx - rx - 5)}" y="${f(cy - 5)}" width="${f(rx * 2 + 10)}" height="${f(11 * L)}" rx="${f(5.5 * L)}" fill="${c.rim}" stroke="${shade(c.rim, 0.75)}" stroke-width="1.5"/>`;
    for (let i = 1; i < 6; i++) { const x = cx - rx - 5 + (rx * 2 + 10) * i / 6; s += `<path d="M${f(x)} ${f(cy - 4)} L${f(x)} ${f(cy - 5 + 11 * L)}" stroke="${shade(c.rim, 0.75)}" stroke-width="1.2"/>`; }
    // cabeza
    let head = `<circle cx="${hx}" cy="${hy}" r="${hr}" fill="${c.body}"/>`;
    head += `<circle cx="${f(hx - hr * 0.45)}" cy="${f(hy - hr * 0.55)}" r="${f(hr * 0.1)}" fill="${c.dark}" opacity=".5"/><circle cx="${f(hx - hr * 0.15)}" cy="${f(hy - hr * 0.75)}" r="${f(hr * 0.08)}" fill="${c.dark}" opacity=".5"/>`;
    head += face({ x: hx, y: hy, r: hr }, mood, c, 'lizard', G.eye);
    s += `<g class="head" style="transform-origin:${hx}px ${hy + hr}px">${head}${HEADSLOT}</g>`;
    return { svg: s, head: { x: hx, y: hy, r: hr, top: hy - hr } };
  }

  const HEADSLOT = '<!--ACC-->';

  /* ---------------- accesorios ---------------- */
  function accessory(id, h) {
    const { x, y, r, top } = h;
    const ey = y - r * 0.04;
    switch (id) {
      case 'hat': {
        const bx = x - r * 0.05, by = top + 4;
        return `<g transform="rotate(-12 ${f(bx)} ${f(by)})"><path d="M${f(bx - r * 0.38)} ${f(by)} L${f(bx)} ${f(by - r * 0.95)} L${f(bx + r * 0.38)} ${f(by)} Z" fill="#7b61ff"/>` +
          `<path d="M${f(bx - r * 0.25)} ${f(by - r * 0.32)} L${f(bx + r * 0.25)} ${f(by - r * 0.32)} M${f(bx - r * 0.13)} ${f(by - r * 0.62)} L${f(bx + r * 0.13)} ${f(by - r * 0.62)}" stroke="#ffd23f" stroke-width="${f(r * 0.1)}"/>` +
          `<circle cx="${f(bx)}" cy="${f(by - r * 0.98)}" r="${f(r * 0.12)}" fill="#ff5d73"/></g>`;
      }
      case 'bow': {
        const bx = x + r * 0.5, by = y - r * 0.78;
        return `<g transform="rotate(18 ${f(bx)} ${f(by)})"><path d="M${f(bx)} ${f(by)} L${f(bx - r * 0.42)} ${f(by - r * 0.26)} L${f(bx - r * 0.42)} ${f(by + r * 0.26)} Z M${f(bx)} ${f(by)} L${f(bx + r * 0.42)} ${f(by - r * 0.26)} L${f(bx + r * 0.42)} ${f(by + r * 0.26)} Z" fill="#ff5d9e" stroke="#c9306e" stroke-width="1.5" stroke-linejoin="round"/><circle cx="${f(bx)}" cy="${f(by)}" r="${f(r * 0.1)}" fill="#c9306e"/></g>`;
      }
      case 'glasses': {
        const e1 = x - r * 0.3, e2 = x + r * 0.36, gr = r * 0.22;
        return `<g><path d="M${f(e1 + gr)} ${f(ey)} L${f(e2 - gr)} ${f(ey)}" stroke="${INK}" stroke-width="2.5"/>` +
          `<rect x="${f(e1 - gr)}" y="${f(ey - gr * 0.8)}" width="${f(gr * 2)}" height="${f(gr * 1.6)}" rx="${f(gr * 0.5)}" fill="#1d1d2b" stroke="${INK}" stroke-width="2"/>` +
          `<rect x="${f(e2 - gr)}" y="${f(ey - gr * 0.8)}" width="${f(gr * 2)}" height="${f(gr * 1.6)}" rx="${f(gr * 0.5)}" fill="#1d1d2b" stroke="${INK}" stroke-width="2"/>` +
          `<path d="M${f(e1 - gr * 0.5)} ${f(ey - gr * 0.3)} l${f(gr * 0.5)} ${f(-gr * 0.3)} M${f(e2 - gr * 0.5)} ${f(ey - gr * 0.3)} l${f(gr * 0.5)} ${f(-gr * 0.3)}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/></g>`;
      }
      case 'crown': {
        const bx = x, by = top + 6, w = r * 0.62, hh = r * 0.5;
        return `<g><path d="M${f(bx - w)} ${f(by)} L${f(bx - w)} ${f(by - hh)} L${f(bx - w * 0.5)} ${f(by - hh * 0.45)} L${f(bx)} ${f(by - hh * 1.1)} L${f(bx + w * 0.5)} ${f(by - hh * 0.45)} L${f(bx + w)} ${f(by - hh)} L${f(bx + w)} ${f(by)} Z" fill="#ffc93c" stroke="#c98a12" stroke-width="1.8" stroke-linejoin="round"/>` +
          `<circle cx="${f(bx)}" cy="${f(by - hh * 0.35)}" r="${f(r * 0.09)}" fill="#ff5d73"/><circle cx="${f(bx - w * 0.55)}" cy="${f(by - hh * 0.25)}" r="${f(r * 0.06)}" fill="#4fa8ff"/><circle cx="${f(bx + w * 0.55)}" cy="${f(by - hh * 0.25)}" r="${f(r * 0.06)}" fill="#4fa8ff"/></g>`;
      }
      case 'scarf': {
        const nx = x - r * 0.1, ny = y + r * 0.95;
        return `<g><path d="M${f(nx - r * 0.75)} ${f(ny - r * 0.12)} Q${f(nx)} ${f(ny + r * 0.25)} ${f(nx + r * 0.8)} ${f(ny - r * 0.15)} L${f(nx + r * 0.8)} ${f(ny + r * 0.12)} Q${f(nx)} ${f(ny + r * 0.5)} ${f(nx - r * 0.75)} ${f(ny + r * 0.15)} Z" fill="#2ec4b6"/>` +
          `<path d="M${f(nx - r * 0.45)} ${f(ny + r * 0.2)} l${f(-r * 0.15)} ${f(r * 0.55)} l${f(r * 0.28)} ${f(r * 0.04)} l${f(r * 0.05)} ${f(-r * 0.5)} Z" fill="#26a69a"/></g>`;
      }
      case 'flower': {
        const cx = x - r * 0.38, cy = top + r * 0.14, pr = r * 0.13, d = r * 0.17;
        const petals = [0, 72, 144, 216, 288].map((a) => `<circle cx="${f(cx + Math.cos((a - 90) * Math.PI / 180) * d)}" cy="${f(cy + Math.sin((a - 90) * Math.PI / 180) * d)}" r="${f(pr)}" fill="#fff" stroke="#e6d8f2" stroke-width="1.2"/>`).join('');
        return `<g>${petals}<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.11)}" fill="#ffc93c" stroke="#d99a1a" stroke-width="1.2"/></g>`;
      }
      case 'cap': {
        const by = top + r * 0.3, w = r * 0.66;
        return `<g><path d="M${f(x - w)} ${f(by)} Q${f(x - w)} ${f(by - r * 0.62)} ${f(x)} ${f(by - r * 0.62)} Q${f(x + w)} ${f(by - r * 0.62)} ${f(x + w)} ${f(by)} Z" fill="#e63946" stroke="#9d1d2a" stroke-width="1.8" stroke-linejoin="round"/>` +
          `<path d="M${f(x + w * 0.55)} ${f(by - r * 0.04)} Q${f(x + w * 1.25)} ${f(by - r * 0.12)} ${f(x + w * 1.55)} ${f(by + r * 0.08)} Q${f(x + w * 1.1)} ${f(by + r * 0.14)} ${f(x + w * 0.55)} ${f(by + r * 0.06)} Z" fill="#c1121f" stroke="#9d1d2a" stroke-width="1.6" stroke-linejoin="round"/>` +
          `<path d="M${f(x - w * 0.15)} ${f(by - r * 0.6)} Q${f(x + w * 0.1)} ${f(by - r * 0.3)} ${f(x + w * 0.05)} ${f(by)}" stroke="#ff8fa0" stroke-width="1.5" fill="none"/><circle cx="${f(x)}" cy="${f(by - r * 0.63)}" r="${f(r * 0.07)}" fill="#9d1d2a"/></g>`;
      }
      case 'headphones': {
        const hy = y - r * 0.05, w = r * 0.92;
        return `<g><path d="M${f(x - w)} ${f(hy)} Q${f(x - w)} ${f(top - r * 0.22)} ${f(x)} ${f(top - r * 0.22)} Q${f(x + w)} ${f(top - r * 0.22)} ${f(x + w)} ${f(hy)}" stroke="#2b2d42" stroke-width="${f(r * 0.13)}" fill="none" stroke-linecap="round"/>` +
          `<rect x="${f(x - w - r * 0.14)}" y="${f(hy - r * 0.2)}" width="${f(r * 0.28)}" height="${f(r * 0.42)}" rx="${f(r * 0.1)}" fill="#ff5d9e" stroke="#2b2d42" stroke-width="1.8"/>` +
          `<rect x="${f(x + w - r * 0.14)}" y="${f(hy - r * 0.2)}" width="${f(r * 0.28)}" height="${f(r * 0.42)}" rx="${f(r * 0.1)}" fill="#ff5d9e" stroke="#2b2d42" stroke-width="1.8"/></g>`;
      }
      case 'wizard': {
        const bx = x - r * 0.02, by = top + 7, w = r * 0.5, hh = r * 1.25;
        const star = (sx, sy, k) => `<path d="M${f(sx)} ${f(sy - 5 * k)} L${f(sx + 1.5 * k)} ${f(sy - 1.5 * k)} L${f(sx + 5 * k)} ${f(sy)} L${f(sx + 1.5 * k)} ${f(sy + 1.5 * k)} L${f(sx)} ${f(sy + 5 * k)} L${f(sx - 1.5 * k)} ${f(sy + 1.5 * k)} L${f(sx - 5 * k)} ${f(sy)} L${f(sx - 1.5 * k)} ${f(sy - 1.5 * k)} Z" fill="#ffd23f"/>`;
        return `<g transform="rotate(-8 ${f(bx)} ${f(by)})"><path d="M${f(bx - w)} ${f(by)} Q${f(bx - w * 0.2)} ${f(by - hh * 0.55)} ${f(bx + w * 0.25)} ${f(by - hh)} Q${f(bx + w * 0.35)} ${f(by - hh * 0.5)} ${f(bx + w)} ${f(by)} Z" fill="#4c3bbd" stroke="#2a1f6e" stroke-width="1.8" stroke-linejoin="round"/>` +
          star(bx - w * 0.2, by - hh * 0.32, r * 0.05) + star(bx + w * 0.35, by - hh * 0.15, r * 0.035) + star(bx + w * 0.05, by - hh * 0.62, r * 0.03) +
          `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="${f(r * 0.78)}" ry="${f(r * 0.15)}" fill="#3a2c9a" stroke="#2a1f6e" stroke-width="1.8"/></g>`;
      }
      default:
        return '';
    }
  }

  /* ---------------- extras de estado ---------------- */
  /* ---------------- trucos especiales de cada especie ---------------- */
  // Se dibujan dentro de la cabeza (sin espejar): la cara mira a la derecha.
  function specialSVG(species, stage, h) {
    const { x: hx, y: hy, r } = h;
    const mx = hx + r * 0.06, my = hy + r * 0.36;
    if (species === 'dragon') {
      const L = r * (stage === 'baby' ? 1.1 : 1.9), W = r * (stage === 'baby' ? 0.32 : 0.48);
      const bx = mx + r * 0.12, by = my + r * 0.08;
      const p = (x, y) => `${f(bx + x * L)} ${f(by + y * W)}`;
      const flame = (k, col) => `<path d="M${p(0, -0.25 * k)} Q${p(0.45, -1 * k)} ${p(1 * k, -0.45 * k)} Q${p(0.82 * k, 0)} ${p(1.02 * k, 0.4 * k)} Q${p(0.5, 1 * k)} ${p(0, 0.25 * k)} Z" fill="${col}"/>`;
      const sparks = [[0.7, -1.2], [1.05, 0.9], [1.2, -0.3], [0.45, 1.3]].map(([x, y], i) => `<circle cx="${f(bx + x * L)}" cy="${f(by + y * W)}" r="${f(r * 0.06)}" fill="${i % 2 ? '#ffd23f' : '#ff7a1a'}"/>`).join('');
      return `<g class="flame" style="transform-origin:${f(bx)}px ${f(by)}px"><g class="flame-in" style="transform-origin:${f(bx)}px ${f(by)}px">` +
        flame(1, '#ff5a1f') + flame(0.75, '#ff9f1c') + flame(0.48, '#ffe066') + sparks + `</g></g>`;
    }
    if (species === 'lizard') {
      const L = r * 1.35, ty = my + r * 0.1;
      return `<g class="ltongue" style="transform-origin:${f(mx)}px ${f(ty)}px"><path d="M${f(mx)} ${f(ty)} Q${f(mx + L * 0.55)} ${f(ty + r * 0.12)} ${f(mx + L)} ${f(ty)} M${f(mx + L)} ${f(ty)} l${f(r * 0.2)} ${f(-r * 0.16)} M${f(mx + L)} ${f(ty)} l${f(r * 0.2)} ${f(r * 0.14)}" stroke="#ff5f87" stroke-width="${f(r * 0.11)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>`;
    }
    return '';
  }

  // Estrellitas de la forma brillante: son parte del dibujo, como pintitas doradas en la piel. Una va en la cabeza
  // (dentro del grupo .head: se inclina con ella) y las otras en el lomo (dentro de .bob: se mueven con el cuerpo).
  // Los lugares los calcula tools/estrellas.py para que queden siempre sobre la piel en todas las poses.
  const SHINY_SPOTS = {
    dragon: { baby: [['h', 108, 106], ['t', 72, 158], ['t', 82, 154]], young: [['h', 128, 86], ['t', 68, 140], ['t', 88, 132]], adult: [['h', 138, 62], ['t', 64, 132], ['t', 114, 120]] },
    bird: { baby: [['t', 104, 124], ['t', 122, 124]], young: [['h', 124, 84], ['t', 82, 126], ['t', 88, 128]], adult: [['h', 132, 62], ['t', 78, 112], ['t', 98, 112]] },
    lizard: { baby: [['h', 134, 116]], young: [['h', 146, 108], ['t', 54, 158], ['t', 90, 144]], adult: [['h', 154, 94], ['t', 46, 148], ['t', 124, 146]] },
    turtle: { baby: [['h', 142, 132]], young: [['h', 154, 124], ['t', 114, 144]], adult: [['h', 164, 110], ['t', 58, 146], ['t', 122, 146]] },
  };

  function shinyStar(x, y, k, n) {
    const p = (dx, dy) => `${f(x + dx * k)} ${f(y + dy * k)}`;
    return `<path class="twinkle t${n}" d="M${p(0, -7)} L${p(1.8, -1.8)} L${p(7, 0)} L${p(1.8, 1.8)} L${p(0, 7)} L${p(-1.8, 1.8)} L${p(-7, 0)} L${p(-1.8, -1.8)} Z" fill="#fffbe0" stroke="#ffc928" stroke-width="1.1" stroke-linejoin="round"/>`;
  }
  function overlays(mood, head, variant, dir, act, species) {
    dir = dir === -1 ? -1 : 1;
    let s = '';
    if (act === 'special' && species === 'bird') {
      // notas musicales: el pájaro canta
      const nx = head.x + dir * head.r * 0.7, ny = head.top + head.r * 0.2;
      const nt = (cls, dx, dy, size, ch) => `<g transform="translate(${f(nx + dir * dx)} ${f(ny - dy)})"><g class="z note ${cls}"><text x="0" y="0" text-anchor="middle" font-size="${size}" fill="#ff5d9e" stroke="#fff" stroke-width="${f(size / 7)}" paint-order="stroke" font-weight="800">${ch}</text></g></g>`;
      s += `<g class="zzz notes">` + nt('z1', 0, 0, 20, '♪') + nt('z2', 16, 18, 24, '♫') + nt('z3', 32, 34, 22, '♪') + `</g>`;
    }
    const tx = head.x + head.r * 0.7, ty = head.top - 4;
    if (mood === 'sleep') {
      // Las Z salen de arriba de la cabeza, del lado de la cara, y suben alejándose
      // (arrancan apenas arriba de la cabeza, corridas hacia el lado de la cara, para no quedar tapadas por cuernos o cresta)
      const zx = head.x + dir * head.r * 0.8, zy = head.top - 2;
      const zt = (cls, dx, dy, size, ch) => `<g transform="translate(${f(zx + dir * dx)} ${f(zy - dy)})"><g class="z ${cls}"><text x="0" y="0" text-anchor="middle" font-size="${size}" stroke="#2a1f3d" stroke-width="${f(size / 5)}" stroke-linejoin="round" paint-order="stroke">${ch}</text></g></g>`;
      s += `<g class="zzz" font-family="Grandstander, Baloo 2, Trebuchet MS, sans-serif" font-weight="800" fill="#a9b6ff">` +
        zt('z1', 0, 0, 21, 'z') + zt('z2', 15, 17, 26, 'z') + zt('z3', 32, 36, 33, 'Z') + `</g>`;
    }
    if (mood === 'sick') {
      const cx = head.x, cy = head.top - 10;
      s += `<g class="dizzy" style="transform-origin:${f(cx)}px ${f(cy)}px">` +
        `<path d="M${f(cx - 14)} ${f(cy)} a14 6 0 1 0 28 0 a14 6 0 1 0 -28 0" stroke="#8bc34a" stroke-width="2.5" fill="none" stroke-dasharray="6 5"/>` +
        `<circle cx="${f(cx + 14)}" cy="${f(cy)}" r="3.5" fill="#8bc34a"/><circle cx="${f(cx - 14)}" cy="${f(cy)}" r="3" fill="#8bc34a"/></g>`;
    }
    if (mood === 'dead') {
      s += `<ellipse class="halo" cx="${f(head.x)}" cy="${f(head.top - 10)}" rx="${f(head.r * 0.65)}" ry="${f(head.r * 0.18)}" fill="none" stroke="#ffd23f" stroke-width="5"/>`;
    }
    return s;
  }

  /* ---------------- API ---------------- */
  // opts: { species, stage, variant, mood, dir, accessory, walking, flying }
  // Volumen: cada parte del cuerpo se pinta con un degradé (más clara arriba a la izquierda, donde "da la luz",
  // y un poco más oscura en el borde), las mejillas se esfuman y la cabeza tiene un brillo. Mismo dibujo, más lindo.
  let gid = 0;
  function volumeDefs(id, c) {
    const rg = (n, a, b, d) => `<radialGradient id="${id}${n}" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="${a}"/><stop offset=".58" stop-color="${b}"/><stop offset="1" stop-color="${d}"/></radialGradient>`;
    let s = '<defs>' + rg('b', shade(c.body, 1.16), c.body, shade(c.body, 0.84));
    if (c.belly) s += rg('l', shade(c.belly, 1.05), c.belly, shade(c.belly, 0.9));
    if (c.shell) s += rg('s', shade(c.shell, 1.18), c.shell, shade(c.shell, 0.82));
    s += `<radialGradient id="${id}k"><stop offset="0" stop-color="${c.cheek}" stop-opacity=".9"/><stop offset="1" stop-color="${c.cheek}" stop-opacity="0"/></radialGradient></defs>`;
    return s;
  }
  function petSVG(o) {
    const c = palette(o.species, o.stage, o.variant);
    const fn = { dragon, bird, lizard, turtle }[o.species];
    const r = fn(o.stage, c, o.mood);
    const id = 'pv' + (++gid).toString(36);
    const h0 = r.head;
    const gloss = `<ellipse class="gloss" cx="${f(h0.x - h0.r * 0.36)}" cy="${f(h0.y - h0.r * 0.5)}" rx="${f(h0.r * 0.3)}" ry="${f(h0.r * 0.15)}" fill="#fff" opacity=".32" transform="rotate(-32 ${f(h0.x - h0.r * 0.36)} ${f(h0.y - h0.r * 0.5)})"/>`;
    const acc = o.accessory ? accessory(o.accessory, r.head) : '';
    const special = o.act === 'special' ? specialSVG(o.species, o.stage, r.head) : '';
    let headStars = '', bodyStars = '';
    if (o.variant === 'shiny' && o.mood !== 'dead') {
      const spots = (SHINY_SPOTS[o.species] || {})[o.stage] || [];
      spots.forEach(([w, x, y], i) => { const st = shinyStar(x, y, w === 'h' ? 0.62 : 0.72, i + 1); if (w === 'h') headStars += st; else bodyStars += st; });
    }
    const body = (r.svg + bodyStars).replace(HEADSLOT, gloss + headStars + acc + special)
      .split(`fill="${c.body}"`).join(`fill="url(#${id}b)"`)
      .split(`fill="${c.belly}"`).join(`fill="url(#${id}l)"`)
      .split(c.shell ? `fill="${c.shell}"` : '\u0000').join(`fill="url(#${id}s)"`)
      .split('__ID__').join(id);
    const flip = o.dir === -1 ? ' transform="translate(200 0) scale(-1 1)"' : '';
    const cls = ['pet', 'sp-' + o.species, 'st-' + o.stage, 'mood-' + o.mood];
    if (o.walking) cls.push('walking');
    if (o.flying) cls.push('flying');
    if (o.act) cls.push('act-' + o.act);
    const shadowW = ({ baby: 34, young: 44, adult: 54 }[o.stage] || 40) * (o.species === 'turtle' ? 1.15 : 1);
    const fh = flipHead(r.head, o.dir);
    // posición de la cabeza (para ubicar cosas cerca: el ícono de pedidos, etc.)
    const hd = ` data-hx="${f(fh.x)}" data-ht="${f(fh.top)}" data-hr="${f(fh.r)}" data-dir="${o.dir === -1 ? -1 : 1}"`;
    return `<svg class="${cls.join(' ')}" viewBox="-20 0 240 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"${hd}>` + volumeDefs(id, c) +
      `<ellipse class="shadow" cx="100" cy="191" rx="${shadowW}" ry="6" fill="#000" opacity=".16"/>` +
      `<g class="flipper"${flip}><g class="bob">${body}</g></g>` +
      `<g class="pfx">${overlays(o.mood, flipHead(r.head, o.dir), o.variant, o.dir, o.act, o.species)}</g></svg>`;
  }
  function flipHead(h, dir) {
    if (dir !== -1) return h;
    return { x: 200 - h.x, y: h.y, r: h.r, top: h.top };
  }

  /* ---------------- HUEVOS ---------------- */
  const EGG = {
    dragon: { shell: '#ffb08a', dark: '#e0603d', pat: 'scales' },
    bird: { shell: '#bfe3ff', dark: '#5aa6e8', pat: 'speckles' },
    lizard: { shell: '#f3efd6', dark: '#6dbb4c', pat: 'spots' },
    turtle: { shell: '#f4e4c1', dark: '#b07a3a', pat: 'hex' },
  };
  function eggPattern(sp) {
    const e = EGG[sp];
    let s = '';
    if (e.pat === 'scales') {
      for (let row = 0; row < 4; row++) {
        for (let i = -2; i <= 2; i++) {
          const x = 100 + i * 15 + (row % 2) * 7.5, y = 106 + row * 18;
          s += `<path d="M${x - 7} ${y} Q${x} ${y + 9} ${x + 7} ${y}" stroke="${e.dark}" stroke-width="2.2" fill="none" opacity=".55"/>`;
        }
      }
    } else if (e.pat === 'hex') {
      const hx = (x, y, r) => { let d = ''; for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; d += (i ? 'L' : 'M') + (x + Math.cos(a) * r).toFixed(1) + ' ' + (y + Math.sin(a) * r).toFixed(1); } return d + 'Z'; };
      [[100, 108], [84, 128], [116, 128], [100, 148], [84, 168], [116, 168], [68, 148], [132, 148], [100, 186]].forEach(([x, y]) => {
        s += `<path d="${hx(x, y, 10)}" fill="${e.dark}" opacity=".18" stroke="${e.dark}" stroke-width="1.6" stroke-opacity=".5"/>`;
      });
    } else if (e.pat === 'speckles') {
      [[84, 110, 3], [110, 100, 2.5], [120, 128, 3.5], [92, 140, 2.5], [76, 132, 2], [106, 160, 3], [128, 150, 2], [88, 168, 2.5], [100, 120, 2]].forEach(([x, y, r]) => {
        s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${e.dark}" opacity=".7"/>`;
      });
    } else {
      [[86, 112, 7, 5], [116, 104, 5, 4], [122, 140, 8, 6], [84, 150, 6, 5], [104, 170, 7, 4], [100, 132, 4, 3]].forEach(([x, y, rx, ry]) => {
        s += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${e.dark}" opacity=".8"/>`;
      });
    }
    return s;
  }
  // o: { species, progress 0-100, warmth 0-100 }
  function eggSVG(o) {
    const e = EGG[o.species];
    const id = 'eg' + Math.random().toString(36).slice(2, 7);
    let cracks = '';
    if (o.progress > 45) cracks += `<path d="M100 92 l-6 12 l8 6 l-7 12" stroke="#5a3b2e" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (o.progress > 75) cracks += `<path d="M66 140 l10 -4 l4 8 l10 -6 l6 6" stroke="#5a3b2e" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M128 118 l-8 6 l4 8" stroke="#5a3b2e" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    const warm = Math.max(0, Math.min(1, (o.warmth || 0) / 100));
    const speed = o.progress > 75 ? 0.6 : o.progress > 45 ? 1.1 : 2.4;
    return `<svg class="pet egg" viewBox="-20 0 240 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="--wob:${speed}s">` +
      `<defs><radialGradient id="${id}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="${id}g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffcf5a" stop-opacity="${f(0.55 * warm)}"/><stop offset="1" stop-color="#ffcf5a" stop-opacity="0"/></radialGradient></defs>` +
      `<circle cx="100" cy="136" r="78" fill="url(#${id}g)"/>` +
      `<ellipse class="shadow" cx="100" cy="191" rx="34" ry="6" fill="#000" opacity=".16"/>` +
      `<clipPath id="${id}c"><path d="M100 84 C130 84 142 130 142 150 C142 174 124 190 100 190 C76 190 58 174 58 150 C58 130 70 84 100 84 Z"/></clipPath>` +
      `<g class="wobble" style="transform-origin:100px 188px">` +
      `<path d="M100 84 C130 84 142 130 142 150 C142 174 124 190 100 190 C76 190 58 174 58 150 C58 130 70 84 100 84 Z" fill="${e.shell}"/>` +
      `<g clip-path="url(#${id}c)">${eggPattern(o.species)}${cracks}</g>` +
      `<path d="M100 84 C130 84 142 130 142 150 C142 174 124 190 100 190 C76 190 58 174 58 150 C58 130 70 84 100 84 Z" fill="none" stroke="${e.dark}" stroke-width="2.5"/>` +
      `<path d="M100 84 C130 84 142 130 142 150 C142 174 124 190 100 190 C76 190 58 174 58 150 C58 130 70 84 100 84 Z" fill="url(#${id})"/>` +
      `</g></svg>`;
  }

  /* ---------------- ícono de caca ---------------- */
  function poopSVG() {
    return `<svg viewBox="0 0 60 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
      `<path d="M10 44 Q4 44 6 37 Q8 31 16 31 Q12 24 20 20 Q24 17 28 18 Q26 10 34 7 Q36 14 40 18 Q48 21 44 30 Q54 32 52 39 Q50 45 44 45 Z" fill="#8a5a3c" stroke="#5e3a24" stroke-width="2" stroke-linejoin="round"/>` +
      `<circle cx="23" cy="33" r="2.6" fill="#2b1d1f"/><circle cx="35" cy="33" r="2.6" fill="#2b1d1f"/><path d="M24 39 Q29 42 34 39" stroke="#2b1d1f" stroke-width="2" fill="none" stroke-linecap="round"/>` +
      `<path class="stink" d="M18 6 q-4 -3 0 -6 M48 10 q-4 -3 0 -6" stroke="#9bbf5a" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
  }

  /* ---------------- mariposa (para jugar) ---------------- */
  function butterflySVG() {
    return `<svg viewBox="0 0 40 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
      `<g class="bf-l" style="transform-origin:20px 16px"><path d="M19 15 C10 0 0 4 3 13 C5 19 13 18 19 16 Z" fill="#ff8fd0" stroke="#c9306e" stroke-width="1.4"/><path d="M19 17 C11 18 5 24 9 29 C13 32 18 24 19 18 Z" fill="#ffc93c" stroke="#c98a12" stroke-width="1.4"/></g>` +
      `<g class="bf-r" style="transform-origin:20px 16px"><path d="M21 15 C30 0 40 4 37 13 C35 19 27 18 21 16 Z" fill="#ff8fd0" stroke="#c9306e" stroke-width="1.4"/><path d="M21 17 C29 18 35 24 31 29 C27 32 22 24 21 18 Z" fill="#ffc93c" stroke="#c98a12" stroke-width="1.4"/></g>` +
      `<rect x="18.6" y="8" width="2.8" height="18" rx="1.4" fill="#2b1d1f"/><path d="M19.5 8 Q17 3 14 2 M20.5 8 Q23 3 26 2" stroke="#2b1d1f" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>`;
  }

  /* ---------------- lápida ---------------- */
  function graveSVG(species) {
    const e = EGG[species] || EGG.dragon;
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
      `<ellipse cx="100" cy="186" rx="70" ry="10" fill="#6aa84f" opacity=".5"/>` +
      `<path d="M58 186 L58 92 Q58 50 100 50 Q142 50 142 92 L142 186 Z" fill="#b8b4c7" stroke="#7d7891" stroke-width="3"/>` +
      `<path d="M100 74 L100 112 M86 88 L114 88" stroke="#7d7891" stroke-width="6" stroke-linecap="round"/>` +
      `<circle cx="78" cy="168" r="7" fill="${e.dark}"/><circle cx="124" cy="172" r="6" fill="#ff8fa0"/><circle cx="92" cy="176" r="5" fill="#ffd23f"/>` +
      `<path d="M70 186 q2 -12 6 -14 M130 186 q-1 -10 4 -12" stroke="#4f8a3a" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
  }

  /* ---------------- íconos de interfaz ---------------- */
  const IC = {
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    food: '<path d="M7 3v8a3 3 0 0 0 6 0V3M10 3v18M18 3c-2 0-3 3-3 7s1 4 3 4v7" />',
    play: '<circle cx="12" cy="12" r="8"/><path d="M4.5 9.5c4 1.5 11 1.5 15 0M4.5 14.5c4-1.5 11-1.5 15 0M12 4c-2 3-2 13 0 16"/>',
    bath: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="6" r="2"/><circle cx="15" cy="13" r="4"/><circle cx="7" cy="16" r="2.5"/>',
    clean: '<path d="M14 3l-4 9M7 12h10l2 9H5z M9 16v5M13 16v5"/>',
    sleep: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    wake: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    med: '<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-40 12 12)"/><path d="M9.3 9.3l5.4 5.4"/>',
    shop: '<path d="M4 8h16l-1 12H5zM8 8V6a4 4 0 0 1 8 0v2"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    warm: '<path d="M12 21c-4 0-6-3-6-6 0-4 4-6 4-11 3 2 4 5 4 7 1-1 2-2 2-4 2 2 2 5 2 8 0 3-2 6-6 6z"/>',
    heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    sound: '<path d="M4 9h4l5-4v14l-5-4H4zM16 9c1.5 1.5 1.5 4.5 0 6M19 6c3 3 3 9 0 12"/>',
    mute: '<path d="M4 9h4l5-4v14l-5-4H4zM16 9l5 6M21 9l-5 6"/>',
    gift: '<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12M12 9c-2-4-7-5-7-2s5 2 7 2c2 0 7 1 7-2s-5-2-7 2z"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    shirt: '<path d="M8 3l-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3c-1 2-2 3-4 3s-3-1-4-3z"/>',
    book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
    mouse: '<rect x="6" y="3" width="12" height="18" rx="6"/><path d="M12 7v4"/>',
    walk: '<circle cx="13" cy="4" r="2"/><path d="M9 21l3-7 3 3v5M7 12l3-4h4l3 4M12 14l-1-6"/>',
    power: '<path d="M12 3v9M6.3 6.3a8 8 0 1 0 11.4 0"/>',
    reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/>',
    pin: '<path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    jump: '<path d="M4 20h16M7 16c1-6 4-9 9-9M14 4l3 3-3 3"/>',
    leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15zM5 19l8-8"/>',
  };
  function icon(name, cls) {
    return `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[name] || ''}</svg>`;
  }

  /* Ilustraciones de objetos de la tienda (color) */
  function itemSVG(id, species) {
    const w = (inner) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
    switch (id) {
      case 'fruit': return w('<path d="M24 14c-6-4-16-2-16 10 0 10 7 18 12 18 2 0 3-1 4-1s2 1 4 1c5 0 12-8 12-18 0-12-10-14-16-10z" fill="#ff5d5d"/><path d="M24 14c0-4 2-7 5-8" stroke="#6b4226" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M26 10c4-4 9-3 10-1-3 3-7 3-10 1z" fill="#6cc04a"/><ellipse cx="16" cy="22" rx="3" ry="5" fill="#fff" opacity=".45"/>');
      case 'fav':
        if (species === 'bird') return w('<path d="M8 26h32c0 9-7 15-16 15S8 35 8 26z" fill="#c98b4a"/><path d="M8 26h32" stroke="#9a6430" stroke-width="2"/><g fill="#f1d27a">' + [[14, 22], [20, 20], [26, 21], [32, 22], [17, 25], [24, 24], [30, 25], [22, 17], [28, 18]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="1.8"/>`).join('') + '</g>');
        if (species === 'turtle') return w('<path d="M24 42C10 40 6 26 12 14c4 6 6 8 12 8s8-2 12-8c6 12 2 26-12 28z" fill="#7cc95a"/><path d="M24 40C14 36 12 26 16 18c3 4 5 6 8 6s5-2 8-6c4 8 2 18-8 22z" fill="#a8e07a"/><path d="M24 40V22M24 30l-6-6M24 34l6-7" stroke="#4f9a3a" stroke-width="2" fill="none" stroke-linecap="round"/>');
        if (species === 'lizard') return w('<ellipse cx="22" cy="26" rx="11" ry="6" fill="#6b8f3a"/><circle cx="34" cy="24" r="5" fill="#7ea548"/><circle cx="36" cy="22.5" r="1.4" fill="#222"/><path d="M38 20q6-8 8-4M37 19q2-9 6-8M16 30l-5 7M22 31l-2 8M28 30l3 7M14 22q-6-6-10-3" stroke="#4a6a24" stroke-width="2" fill="none" stroke-linecap="round"/>');
        return w('<path d="M30 8c8 0 12 8 8 16-3 6-10 8-16 6l-8 8c-2 3-7 1-6-3-4 0-5-5-2-6l8-8c-2-6 2-13 16-13z" fill="#c8693a"/><path d="M30 12c5 0 7 5 5 10" stroke="#e8955f" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="10" cy="40" r="4" fill="#f4ead2"/><circle cx="6" cy="36" r="3.5" fill="#f4ead2"/>');
      case 'cake': return w('<path d="M8 28h32v12H8z" fill="#ffd9a8"/><path d="M8 28c4 4 8-2 12 2s8-2 12 2 8-2 8-4V22H8z" fill="#ff8fb8"/><path d="M8 34h32" stroke="#f5b97a" stroke-width="2"/><rect x="22.5" y="12" width="3" height="10" rx="1" fill="#7b61ff"/><path d="M24 6c2 2 2 4 0 5-2-1-2-3 0-5z" fill="#ffc93c"/>');
      case 'medicine': return w('<g transform="rotate(-35 24 24)"><rect x="8" y="17" width="32" height="14" rx="7" fill="#fff" stroke="#c9c3d6" stroke-width="1.5"/><path d="M24 17h9a7 7 0 0 1 0 14h-9z" fill="#ff5d73"/></g>');
      case 'vitamins': return w('<path d="M18 6h12v6l8 14v12a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V26l8-14z" fill="#e8f7ff" stroke="#9ccbe8" stroke-width="2"/><path d="M11 28h26v10a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4z" fill="#42d392"/><circle cx="20" cy="34" r="2" fill="#fff" opacity=".7"/><rect x="17" y="4" width="14" height="4" rx="1.5" fill="#7b61ff"/>');
      case 'hat': return w('<path d="M12 40L24 6l12 34z" fill="#7b61ff"/><path d="M15.5 30h17M19 20h10" stroke="#ffd23f" stroke-width="3"/><circle cx="24" cy="6" r="4" fill="#ff5d73"/>');
      case 'bow': return w('<path d="M24 24L8 14v20zM24 24l16-10v20z" fill="#ff5d9e" stroke="#c9306e" stroke-width="2" stroke-linejoin="round"/><circle cx="24" cy="24" r="4" fill="#c9306e"/>');
      case 'glasses': return w('<path d="M18 22h12" stroke="#2b1d1f" stroke-width="3"/><rect x="5" y="16" width="14" height="12" rx="4" fill="#1d1d2b"/><rect x="29" y="16" width="14" height="12" rx="4" fill="#1d1d2b"/><path d="M8 20l3-2M32 20l3-2" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>');
      case 'crown': return w('<path d="M8 36V14l8 9 8-13 8 13 8-9v22z" fill="#ffc93c" stroke="#c98a12" stroke-width="2" stroke-linejoin="round"/><circle cx="24" cy="26" r="3" fill="#ff5d73"/><circle cx="14" cy="29" r="2" fill="#4fa8ff"/><circle cx="34" cy="29" r="2" fill="#4fa8ff"/>');
      case 'scarf': return w('<path d="M6 16q18 10 36 0v8q-18 10-36 0z" fill="#2ec4b6"/><path d="M14 24l-4 16h7l3-14z" fill="#26a69a"/><path d="M12 30h6M11 35h6" stroke="#bff3ec" stroke-width="1.5"/>');
      case 'flower': return w('<g fill="#fff" stroke="#e6d8f2" stroke-width="1.5">' + [0, 72, 144, 216, 288].map((a) => `<circle cx="${(24 + Math.cos((a - 90) * Math.PI / 180) * 10).toFixed(1)}" cy="${(22 + Math.sin((a - 90) * Math.PI / 180) * 10).toFixed(1)}" r="7.5"/>`).join('') + '</g><circle cx="24" cy="22" r="6" fill="#ffc93c" stroke="#d99a1a" stroke-width="1.5"/><path d="M24 33v12" stroke="#4a9637" stroke-width="3" stroke-linecap="round"/>');
      case 'cap': return w('<path d="M8 30Q8 10 24 10Q38 10 38 30Z" fill="#e63946" stroke="#9d1d2a" stroke-width="2"/><path d="M30 29Q40 26 46 33Q38 35 30 33Z" fill="#c1121f" stroke="#9d1d2a" stroke-width="2" stroke-linejoin="round"/><circle cx="23" cy="10" r="2.5" fill="#9d1d2a"/>');
      case 'headphones': return w('<path d="M9 30V24a15 15 0 0 1 30 0v6" stroke="#2b2d42" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="4" y="26" width="10" height="15" rx="4" fill="#ff5d9e" stroke="#2b2d42" stroke-width="2"/><rect x="34" y="26" width="10" height="15" rx="4" fill="#ff5d9e" stroke="#2b2d42" stroke-width="2"/>');
      case 'wizard': return w('<path d="M10 38Q20 22 28 4Q30 22 38 38Z" fill="#4c3bbd" stroke="#2a1f6e" stroke-width="2" stroke-linejoin="round"/><ellipse cx="24" cy="38" rx="20" ry="5" fill="#3a2c9a" stroke="#2a1f6e" stroke-width="2"/><path d="M21 24l1.3 2.7 2.7 1.3-2.7 1.3-1.3 2.7-1.3-2.7-2.7-1.3 2.7-1.3z" fill="#ffd23f"/><circle cx="28" cy="16" r="1.5" fill="#ffd23f"/>');
      case 'coin': return w('<circle cx="24" cy="24" r="17" fill="#ffc93c" stroke="#d99a1a" stroke-width="3"/><circle cx="24" cy="24" r="11" fill="none" stroke="#ffe08a" stroke-width="2"/><path d="M24 16l2.4 5 5.4.6-4 3.7 1.1 5.3L24 28l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z" fill="#fff3c4"/>');
      default: return w('');
    }
  }

  N.art = { petSVG, eggSVG, poopSVG, graveSVG, butterflySVG, icon, itemSVG, palette, EGG };
})();
