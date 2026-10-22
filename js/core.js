/* Virtual Pet — motor del juego: reglas, tiempo, guardado. Sin dependencias de interfaz. */
(function () {
  'use strict';
  const N = (window.N = window.N || {});
  const MIN = 60e3, HOUR = 3600e3, DAY = 24 * HOUR;
  N.APP = { name: 'Virtual Pet', version: '1.11.6', author: 'Facundo Bangher' };

  const SPECIES = {
    dragon: { name: 'Dragón', fav: 'Carne asada', egg: 'Huevo escamado', hint: 'Comilón: le da hambre seguido' },
    bird: { name: 'Pájaro', fav: 'Semillas', egg: 'Huevo celeste', hint: 'Juguetón: se aburre rápido' },
    lizard: { name: 'Lagarto', fav: 'Grillos', egg: 'Huevo manchado', hint: 'Dormilón: se cansa antes' },
    turtle: { name: 'Tortuga', fav: 'Lechuga', egg: 'Huevo de arena', hint: 'Paciente: casi no se enferma' },
  };
  // Personalidad: multiplica lo rápido que baja cada necesidad
  const TRAITS = {
    dragon: { food: 1.2 },
    bird: { fun: 1.4 },
    lizard: { energy: 1.3 },
    turtle: { food: 0.85, fun: 0.85, hygiene: 0.85, energy: 0.85, sick: 0.5 },
  };
  const trait = (p, k) => ((TRAITS[p.species] || {})[k] || 1);

  /* Logros */
  const ACHIEVEMENTS = [
    { id: 'hatch', name: '¡Nació!', desc: 'Hacé nacer tu primer huevo', coins: 10, test: (s) => s.stats.hatched >= 1 },
    { id: 'young', name: 'Creciendo', desc: 'Llegá a la etapa joven', coins: 20, test: (s) => s.stats.grewYoung >= 1 },
    { id: 'adult', name: 'Grandote', desc: 'Llegá a la etapa adulta', coins: 40, test: (s) => s.stats.grewAdult >= 1 },
    { id: 'shiny', name: 'Brillante', desc: 'Conseguí la forma brillante', coins: 80, test: (s) => s.stats.shiny >= 1 },
    { id: 'lv10', name: 'Nivel 10', desc: 'Llegá al nivel 10', coins: 20, test: (s) => s.stats.maxLevel >= 10 },
    { id: 'lv25', name: 'Nivel 25', desc: 'Llegá al nivel 25', coins: 40, test: (s) => s.stats.maxLevel >= 25 },
    { id: 'lv50', name: 'Nivel 50', desc: 'Llegá al nivel 50', coins: 80, test: (s) => s.stats.maxLevel >= 50 },
    { id: 'lv100', name: 'Leyenda', desc: 'Llegá al nivel 100', coins: 200, test: (s) => s.stats.maxLevel >= 100 },
    { id: 'week', name: 'Una semana juntos', desc: 'Que tu mascota cumpla 7 días', coins: 50, test: (s) => s.stats.maxAgeDays >= 7 },
    { id: 'streak7', name: 'Fiel', desc: 'Entrá 7 días seguidos', coins: 30, test: (s) => s.daily.streak >= 7 },
    { id: 'streak30', name: 'Inseparables', desc: 'Entrá 30 días seguidos', coins: 150, test: (s) => s.daily.streak >= 30 },
    { id: 'chef', name: 'Chef', desc: 'Dale de comer 50 veces', coins: 30, test: (s) => s.stats.feeds >= 50 },
    { id: 'bath', name: 'Impecable', desc: 'Bañalo 20 veces', coins: 30, test: (s) => s.stats.baths >= 20 },
    { id: 'poop', name: 'Limpia-cacas', desc: 'Limpiá 30 cacas', coins: 30, test: (s) => s.stats.cleans >= 30 },
    { id: 'doctor', name: 'Doctor', desc: 'Curalo 5 veces', coins: 30, test: (s) => s.stats.cures >= 5 },
    { id: 'gamer', name: 'Jugador', desc: 'Jugá 25 partidas', coins: 30, test: (s) => s.stats.games >= 25 },
    { id: 'style', name: 'Con estilo', desc: 'Comprá un accesorio', coins: 10, test: (s) => Object.keys(s.owned).length >= 1 },
    { id: 'collector', name: 'Coleccionista', desc: 'Comprá todos los accesorios', coins: 100, test: (s) => Object.keys(ITEMS).filter((k) => ITEMS[k].kind === 'wear').every((k) => s.owned[k]) },
    { id: 'arcade', name: 'Fichines', desc: 'Desbloqueá todos los minijuegos', coins: 60, test: (s) => Object.keys(GAMES).every((k) => !GAMES[k].price || (s.gamesOwned && s.gamesOwned[k])) },
    { id: 'decor', name: 'Decorador', desc: 'Desbloqueá todos los fondos del cuarto', coins: 100, roomOnly: true, test: (s) => Object.keys(BACKGROUNDS).every((k) => s.bgOwned && s.bgOwned[k]) },
    { id: 'zoo', name: 'Zoológico', desc: 'Criá las 4 especies', coins: 100, test: (s) => Object.keys(s.stats.species).length >= 4 },
  ];
  const isNight = (t) => { const h = new Date(t).getHours(); return h >= 22 || h < 7; };
  // Saludo según la hora (al despertarse): de 6 a 12 "Buenos días", de 12 a 20 "Buenas tardes" y si no "Buenas noches"
  const greeting = (t) => { const h = new Date(t == null ? Date.now() : t).getHours(); return h >= 6 && h < 12 ? 'Buenos días' : h >= 12 && h < 20 ? 'Buenas tardes' : 'Buenas noches'; };

  /* Fondos del cuarto (celular). El primero es gratis; los demás se desbloquean con monedas. */
  const BACKGROUNDS = {
    cuarto: { name: 'Cuarto', price: 0, desc: 'Su habitación de siempre.' },
    jardin: { name: 'Jardín', price: 60, desc: 'Pasto, flores y sol.', outdoor: true },
    playa: { name: 'Playa', price: 90, desc: 'Arena, mar y un velerito.', outdoor: true },
    bosque: { name: 'Bosque', price: 90, desc: 'Pinos, hojas y hongos.', outdoor: true },
    castillo: { name: 'Castillo', price: 150, desc: 'Antorchas y alfombra roja.' },
    volcan: { name: 'Volcán', price: 150, desc: 'Ideal para un dragón.', outdoor: true },
    espacio: { name: 'Espacio', price: 200, desc: 'Entre planetas y estrellas.' },
  };
  const ITEMS = {
    fruit: { name: 'Fruta', price: 5, kind: 'food', food: 25, health: 2, desc: 'Llena un poco y es sana.' },
    fav: { name: 'Su comida favorita', price: 12, kind: 'food', food: 45, fun: 10, desc: 'Llena mucho y lo pone contento.' },
    cake: { name: 'Torta', price: 8, kind: 'food', food: 12, fun: 22, health: -4, desc: 'Lo divierte, pero no es sana.' },
    medicine: { name: 'Remedio', price: 15, kind: 'med', cure: true, health: 20, desc: 'Cura la enfermedad.' },
    vitamins: { name: 'Vitaminas', price: 20, kind: 'med', health: 35, desc: 'Recupera salud.' },
    hat: { name: 'Gorrito de fiesta', price: 40, kind: 'wear', desc: 'Para los cumpleaños.' },
    bow: { name: 'Moño', price: 30, kind: 'wear', desc: 'Un toque elegante.' },
    scarf: { name: 'Bufanda', price: 35, kind: 'wear', desc: 'Para el invierno.' },
    glasses: { name: 'Anteojos de sol', price: 50, kind: 'wear', desc: 'Muy canchero.' },
    crown: { name: 'Corona', price: 120, kind: 'wear', desc: 'Para la realeza.' },
    flower: { name: 'Flor', price: 45, kind: 'wear', desc: 'Una margarita en la cabeza.' },
    cap: { name: 'Gorra', price: 60, kind: 'wear', desc: 'Con visera, para el sol.' },
    headphones: { name: 'Auriculares', price: 90, kind: 'wear', desc: 'Para escuchar música.' },
    wizard: { name: 'Gorro de mago', price: 160, kind: 'wear', desc: 'Con estrellas mágicas.' },
  };
  // Orden en que se muestran los accesorios en la tienda
  const WEAR = ['bow', 'scarf', 'hat', 'flower', 'glasses', 'cap', 'headphones', 'crown', 'wizard'];

  /* Minijuegos: los primeros son gratis; los demás se desbloquean con monedas. */
  const GAMES = {
    catch: { name: 'Atrapá la comida', price: 0 },
    guess: { name: '¿Para dónde mira?', price: 0 },
    memory: { name: 'Memoria', price: 0 },
    bubbles: { name: 'Burbujas', price: 0 },
    simon: { name: 'Simón dice', price: 80 },
    jump: { name: 'Salto', price: 120 },
  };

  /* Paquetes de monedas que se compran con dinero real (sólo en la app de Android, con Google Play).
     "sku" es el ID del producto en Play Console: tiene que ser exactamente igual allá. */
  const PACKS = [
    { sku: 'monedas_chico', name: 'Bolsita de monedas', coins: 300 },
    { sku: 'monedas_mediano', name: 'Cofre de monedas', coins: 800, tag: '+15 % de regalo' },
    { sku: 'monedas_grande', name: 'Tesoro de monedas', coins: 2000, tag: '+40 % de regalo' },
  ];

  // Reglas (por hora de juego). Ajustables en un solo lugar.
  const R = {
    startCoins: 60,
    startInv: { fruit: 3, fav: 1, medicine: 1 },
    stageMul: { baby: 1.15, young: 1.05, adult: 1.0 },
    // Crecimiento por nivel (y una edad mínima, para que no crezca en minutos)
    lvYoung: 5, lvAdult: 20, maxLevel: 100,
    minAgeYoung: 2 * HOUR, minAgeAdult: 24 * HOUR,
    xpPerHourCared: 5,
    // (despierta: la comida pide a las ~4 h, la diversión a las ~5 h, la higiene a las ~7 h y el sueño a las ~8 h;
    //  de noche se cansa antes y duerme toda la noche)
    awake: { food: 13, fun: 12, hygiene: 8, energy: 8 },
    // durmiendo recupera la energía en 2 a 3 horas (de noche igual sigue durmiendo hasta la mañana)
    asleep: { food: 3.5, fun: 1.5, hygiene: 2, energy: -30 },
    poopHygiene: 4,
    // sin ningún cuidado se muere en ~7 días (antes era ~1 día)
    healthDmg: { sick: 0.2, food: 0.2, energy: 0.12, hygiene: 0.12, fun: 0.08 },
    healthRegen: 4,
    lockout: 0, // después de despedirla se puede empezar enseguida con un huevo nuevo (antes había que esperar 24 h)
    maxPoops: 4,
    shinyCare: 62,
  };

  const clamp = (v) => (v < 0 ? 0 : v > 100 ? 100 : v);
  const now = () => Date.now();

  /* --------- eventos --------- */
  const listeners = {};
  N.on = (ev, fn) => ((listeners[ev] = listeners[ev] || []).push(fn), fn);
  N.emit = (ev, data) => (listeners[ev] || []).slice().forEach((fn) => { try { fn(data); } catch (e) { console.error(e); if (N.platform && N.platform.logError) N.platform.logError(e && e.message, 'evento ' + ev); } });

  /* --------- estado --------- */
  function freshState() {
    return {
      v: 1, coins: R.startCoins, inv: Object.assign({}, R.startInv), owned: {}, wearing: null, bgOwned: { cuarto: true }, bg: 'cuarto', gamesOwned: {}, purchases: {},
      daily: { last: null, streak: 0 }, pet: null, lockUntil: 0, memorial: [],
      settings: { sound: true, follow: false, notify: true, wander: true, onTop: true, saver: false },
      lastSeen: now(), totalGames: 0,
      stats: freshStats(), achievements: {}, album: [],
    };
  }
  function freshStats() {
    return { hatched: 0, grewYoung: 0, grewAdult: 0, shiny: 0, maxLevel: 0, maxAgeDays: 0, feeds: 0, baths: 0, cleans: 0, cures: 0, games: 0, species: {} };
  }

  function newPet(species, name) {
    return {
      id: Math.random().toString(36).slice(2, 10), species, name: (name || '').trim().slice(0, 16) || SPECIES[species].name,
      stage: 'egg', created: now(), age: 0, egg: { warmth: 35, progress: 0 },
      food: 80, energy: 90, fun: 75, hygiene: 100, health: 100,
      sick: false, sleeping: false, poops: [], digest: 0, careSum: 0, careN: 0, variant: 'normal',
      level: 0, xp: 0, lastPetXP: 0, lastInteract: now(),
      lastPet: 0, dead: false, diedAt: 0, cause: '',
    };
  }

  const KEY = 'nido.save.v1';
  let S = null;
  let storageOk = true;
  let loadInfo = { fromStorage: false, lastSeen: 0 };

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { storageOk = false; }
    if (raw) {
      try { S = Object.assign(freshState(), JSON.parse(raw)); } catch (e) {
        // partida dañada: se guarda aparte (por las dudas) y se empieza de nuevo
        try { localStorage.setItem(KEY + '.danada', raw); } catch (e2) {}
        S = freshState();
      }
    } else S = freshState();
    migrate(S);
    loadInfo = { fromStorage: !!raw, lastSeen: S.lastSeen };
    return S;
  }
  // Completa datos que faltan en partidas de versiones anteriores (o importadas)
  function migrate(st) {
    const f = freshState();
    const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
    st.settings = Object.assign(f.settings, obj(st.settings));
    st.stats = Object.assign(freshStats(), obj(st.stats));
    st.stats.species = obj(st.stats.species);
    st.album = Array.isArray(st.album) ? st.album : [];
    st.inv = obj(st.inv); st.owned = obj(st.owned); st.achievements = obj(st.achievements);
    st.gamesOwned = obj(st.gamesOwned); st.purchases = obj(st.purchases);
    Object.keys(st.owned).forEach((k) => { if (!ITEMS[k] || ITEMS[k].kind !== 'wear') delete st.owned[k]; });
    Object.keys(st.gamesOwned).forEach((k) => { if (!GAMES[k]) delete st.gamesOwned[k]; });
    st.memorial = (Array.isArray(st.memorial) ? st.memorial : []).filter((m) => m && SPECIES[m.species]);
    st.album = st.album.filter((ph) => ph && SPECIES[ph.species]);
    st.daily = Object.assign({ last: null, streak: 0 }, obj(st.daily));
    if (typeof st.daily.streak !== 'number' || !(st.daily.streak >= 0)) st.daily.streak = 0;
    st.bgOwned = Object.assign({ cuarto: true }, obj(st.bgOwned));
    if (!BACKGROUNDS[st.bg] || !st.bgOwned[st.bg]) st.bg = 'cuarto';
    const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
    st.coins = Math.max(0, Math.floor(num(st.coins, R.startCoins)));
    Object.keys(st.inv).forEach((k) => { st.inv[k] = Math.max(0, Math.floor(num(st.inv[k], 0))); });
    if (st.wearing && !st.owned[st.wearing]) st.wearing = null;
    st.lockUntil = num(st.lockUntil, 0);
    // ya no hay espera después de una muerte: una partida vieja que estaba esperando queda libre
    if (st.lockUntil > now() + R.lockout) st.lockUntil = now() + R.lockout;
    if (st.pet && (typeof st.pet !== 'object' || !SPECIES[st.pet.species])) st.pet = null;
    if (st.pet) {
      const d = newPet(st.pet.species, typeof st.pet.name === 'string' ? st.pet.name : '');
      // partidas de antes de los niveles: el nivel sale de la etapa
      if (st.pet.level == null) { const sg = st.pet.stage; st.pet.level = sg === 'adult' ? R.lvAdult : sg === 'young' ? R.lvYoung : 0; st.pet.xp = 0; st.pet.lastPetXP = 0; }
      st.pet = Object.assign(newPet(st.pet.species, ''), st.pet); // d queda con los valores por defecto
      const q = st.pet;
      q.name = String(q.name || d.name).slice(0, 16);
      ['food', 'energy', 'fun', 'hygiene', 'health'].forEach((k) => { q[k] = clamp(num(q[k], d[k])); });
      ['age', 'digest', 'careSum', 'careN', 'xp', 'created', 'lastPet', 'lastPetXP'].forEach((k) => { q[k] = Math.max(0, num(q[k], d[k])); });
      if (!['egg', 'baby', 'young', 'adult'].includes(q.stage)) q.stage = 'baby';
      if (!Array.isArray(q.poops)) q.poops = [];
      q.poops = q.poops.filter((x) => x && typeof x.x === 'number').slice(0, R.maxPoops);
      if (!q.egg || typeof q.egg !== 'object') q.egg = { warmth: 35, progress: q.stage === 'egg' ? 0 : 100 };
      q.egg.warmth = clamp(num(q.egg.warmth, 35)); q.egg.progress = Math.max(0, num(q.egg.progress, 0));
      if (q.level != null) q.level = Math.max(0, Math.min(R.maxLevel, Math.floor(num(q.level, 0))));
    }
    const p = st.pet;
    if (p) {
      if (p.level == null) { p.level = p.stage === 'adult' ? R.lvAdult : p.stage === 'young' ? R.lvYoung : 0; p.xp = 0; p.lastPetXP = 0; }
      if (!p.lastInteract) p.lastInteract = now();
      if (p.stage !== 'egg') {
        if (!st.stats.hatched) st.stats.hatched = 1;
        st.stats.species[p.species] = 1;
        if (p.stage !== 'baby' && !st.stats.grewYoung) st.stats.grewYoung = 1;
        if (p.stage === 'adult' && !st.stats.grewAdult) st.stats.grewAdult = 1;
        if (p.variant === 'shiny' && !st.stats.shiny) st.stats.shiny = 1;
        if (!st.album.length && !p.dead) st.album.push(photo(p, st.wearing));
      }
    }
    return st;
  }
  function photo(p, acc) {
    return { species: p.species, stage: p.stage, variant: p.variant, name: p.name, accessory: acc || null, level: p.level, t: now() };
  }
  function save() {
    if (!S) return;
    S.lastSeen = now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { storageOk = false; }
  }

  /* --------- utilidades --------- */
  function dayKey(t) {
    const d = new Date(t);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function isLocked() {
    if (S.lockUntil > now() + R.lockout) S.lockUntil = now() + R.lockout;
    return !S.pet && S.lockUntil > now();
  }

  function mood(p) {
    if (!p) return 'normal';
    if (p.dead) return 'dead';
    if (p.sleeping) return 'sleep';
    if (p.sick) return 'sick';
    const low = Math.min(p.food, p.fun, p.hygiene, p.energy);
    if (low < 22) return 'sad';
    const avg = (p.food + p.fun + p.hygiene + p.energy + p.health) / 5;
    if (avg > 78) return 'happy';
    return 'normal';
  }

  /* Pedidos de la mascota. level 1 = lo pide; level 2 = lo pide con urgencia. */
  const ASKS = {
    sick: { urgent: ['Me siento mal… ¿me das el remedio?', 'Estoy enfermito… necesito un remedio'] },
    food: { ask: 45, urgentAt: 20, a: ['Me está dando hambre…', '¿Me das algo de comer?', 'Mmm… ¿qué hay para comer?'], u: ['¡Tengo mucha hambre!', '¡Comida, por favor! ¡Me muero de hambre!'] },
    energy: { ask: 35, urgentAt: 15, a: ['Estoy cansado… ¿me hacés dormir?', 'Uaaah… tengo sueño', '¿Apagamos la luz un rato?'], u: ['¡Me caigo de sueño!', 'No doy más… necesito dormir'] },
    poop: {},
    hygiene: { ask: 45, urgentAt: 20, a: ['Me siento sucio… ¿me bañás?', '¿Me das un baño?'], u: ['¡Necesito un baño ya!', '¡Qué olor! Bañame, por favor'] },
    fun: { ask: 40, urgentAt: 18, a: ['¿Jugamos un rato?', 'Me aburro… ¿jugamos?', '¡Quiero jugar!'], u: ['¡Estoy re aburrido!', 'Nadie juega conmigo…'] },
    health: { ask: 40, urgentAt: 20, a: ['Estoy un poco débil… ¿unas vitaminas?'], u: ['Estoy muy débil…'] },
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function needs(p) {
    const out = [];
    if (!p || p.dead || p.stage === 'egg') return out;
    if (p.sick) out.push({ id: 'sick', level: 2, text: pick(ASKS.sick.urgent) });
    if (p.sleeping) return out; // durmiendo no pide nada (salvo si está enfermo)
    const lv = (id, v) => { const a = ASKS[id]; if (v < a.urgentAt) out.push({ id, level: 2, text: pick(a.u) }); else if (v < a.ask) out.push({ id, level: 1, text: pick(a.a) }); };
    lv('food', p.food);
    if (isNight(now()) && p.energy >= ASKS.energy.urgentAt && p.energy < 75) out.push({ id: 'energy', level: 1, text: pick(['Ya es de noche… ¿me hacés dormir?', 'Uaaah… es tarde, tengo sueño', 'Está oscuro… ¿vamos a dormir?']) });
    else lv('energy', p.energy);
    if (p.poops.length >= 2) out.push({ id: 'poop', level: 2, text: '¡Hay mucha caca! Limpiá, por favor' });
    else if (p.poops.length === 1) out.push({ id: 'poop', level: 1, text: 'Hice caca… ¿la limpiás?' });
    lv('hygiene', p.hygiene);
    lv('fun', p.fun);
    if (!p.sick) lv('health', p.health);
    return out.sort((a, b) => b.level - a.level);
  }

  /* Niveles: de 0 a 100. Se ganan puntos cuidándolo y con el tiempo, si está bien cuidado. */
  const xpNeed = (lv) => 15 + 3 * lv;
  function addXP(p, n, events) {
    if (!p || p.dead || p.stage === 'egg' || n <= 0 || p.level >= R.maxLevel) return;
    p.xp += n;
    while (p.level < R.maxLevel && p.xp >= xpNeed(p.level)) {
      p.xp -= xpNeed(p.level);
      p.level++;
      events.push({ type: 'levelup', level: p.level });
    }
    if (p.level >= R.maxLevel) p.xp = 0;
  }
  function checkGrowth(p, events) {
    if (!p || p.dead) return;
    if (p.stage === 'baby' && p.level >= R.lvYoung && p.age >= R.minAgeYoung) { p.stage = 'young'; events.push({ type: 'grow', stage: 'young' }); }
    else if (p.stage === 'young' && p.level >= R.lvAdult && p.age >= R.minAgeAdult) {
      p.stage = 'adult';
      p.variant = careAvg(p) >= R.shinyCare ? 'shiny' : 'normal';
      events.push({ type: 'grow', stage: 'adult', variant: p.variant });
    }
  }
  // Premios en monedas por crecer, nacer o subir de nivel
  function rewardEvents(events) {
    events.forEach((e) => {
      if (e.coins != null) return;
      if (e.type === 'grow') e.coins = e.stage === 'young' ? 30 : e.variant === 'shiny' ? 100 : 50;
      else if (e.type === 'hatch') e.coins = 10;
      else if (e.type === 'levelup') e.coins = 5 + Math.floor(e.level / 2) + (e.level % 10 === 0 ? 50 : 0);
      else return;
      S.coins += e.coins;
    });
  }
  // Estadísticas, álbum y logros a partir de los eventos
  function recordEvents(events) {
    const p = S.pet;
    events.forEach((e) => {
      if (e.type === 'hatch' && p) { S.stats.hatched++; S.stats.species[p.species] = 1; S.album.unshift(photo(p, S.wearing)); }
      if (e.type === 'grow' && p) {
        if (e.stage === 'young') S.stats.grewYoung++;
        if (e.stage === 'adult') { S.stats.grewAdult++; if (e.variant === 'shiny') S.stats.shiny++; }
        S.album.unshift(photo(p, S.wearing));
      }
    });
    S.album = S.album.slice(0, 60);
  }
  function checkAchievements() {
    const p = S.pet;
    if (p && !p.dead) {
      S.stats.maxLevel = Math.max(S.stats.maxLevel, p.level || 0);
      if (p.stage !== 'egg') S.stats.maxAgeDays = Math.max(S.stats.maxAgeDays, Math.floor(p.age / DAY));
    }
    const got = [];
    ACHIEVEMENTS.forEach((a) => {
      if (S.achievements[a.id]) return;
      let pass = false;
      try { pass = a.test(S); } catch (e) { pass = false; }
      if (pass) { S.achievements[a.id] = now(); S.coins += a.coins; got.push({ type: 'achievement', id: a.id, name: a.name, desc: a.desc, coins: a.coins }); }
    });
    got.forEach((e) => N.emit('event', e));
    return got;
  }
  // Suma puntos por una acción y avisa a la interfaz (subidas de nivel, crecimiento)
  function gain(n) {
    const p = S.pet;
    const ev = [];
    addXP(p, n, ev);
    checkGrowth(p, ev);
    rewardEvents(ev);
    recordEvents(ev);
    ev.forEach((e) => N.emit('event', e));
    checkAchievements();
  }

  function ageText(p) {
    const h = p.age / HOUR;
    if (h < 1) return Math.max(1, Math.floor(p.age / MIN)) + ' min';
    if (h < 48) return Math.floor(h) + ' h';
    return Math.floor(h / 24) + ' días';
  }
  function stageName(st) { return { egg: 'Huevo', baby: 'Bebé', young: 'Joven', adult: 'Adulto' }[st]; }
  function careAvg(p) { return p.careN > 0 ? p.careSum / p.careN : 70; }

  // Dormir da puntos al despertarse, y sólo si se había ido a dormir cansada y descansó de verdad
  // (así no se puede subir de nivel apretando "Dormir" y "Despertar" muchas veces).
  function startSleep(p, night) { p.sleeping = true; p.sleptAtNight = !!night; p.sleepE0 = p.energy; }
  function wakeXP(p) {
    const e0 = p.sleepE0;
    p.sleepE0 = null;
    return e0 != null && e0 < 45 && p.energy - e0 >= 35 ? 8 : 0;
  }

  /* --------- simulación --------- */
  // Avanza la mascota dtMs de tiempo de juego. events: array donde se acumulan eventos.
  function step(p, dtMs, events, rand, simT) {
    rand = rand || Math.random;
    simT = simT || now();
    if (!p || p.dead) return;
    const dtH = dtMs / HOUR;

    if (p.stage === 'egg') {
      const dtMin = dtMs / MIN;
      p.egg.warmth = clamp(p.egg.warmth - 2.5 * dtMin);
      p.egg.progress += (4 + p.egg.warmth / 8) * dtMin;
      if (p.egg.progress >= 100) {
        p.stage = 'baby'; p.age = 0; p.egg.progress = 100;
        p.food = 70; p.energy = 85; p.fun = 80; p.hygiene = 100; p.health = 100;
        events.push({ type: 'hatch' });
      }
      return;
    }

    p.age += dtMs;
    const m = R.stageMul[p.stage] || 1;
    const night = isNight(simT);
    const hour = new Date(simT).getHours();
    if (p.sleeping) {
      p.food = clamp(p.food - R.asleep.food * m * trait(p, 'food') * dtH);
      p.fun = clamp(p.fun - R.asleep.fun * dtH);
      p.hygiene = clamp(p.hygiene - R.asleep.hygiene * dtH);
      p.energy = clamp(p.energy - R.asleep.energy * dtH);
      // si se durmió de noche, sigue durmiendo hasta la mañana aunque ya haya descansado
      if (p.energy >= 100 && !(p.sleptAtNight && night)) { p.sleeping = false; p.sleptAtNight = false; addXP(p, wakeXP(p), events); events.push({ type: 'wake' }); }
      // a la mañana se despierta sola si ya descansó
      else if (hour >= 7 && hour < 11 && p.energy >= 60 && p.sleptAtNight) { p.sleeping = false; p.sleptAtNight = false; addXP(p, wakeXP(p), events); events.push({ type: 'wake', morning: true }); }
    } else {
      const nightTired = night ? 1.5 : 1; // de noche se cansa más rápido
      p.food = clamp(p.food - R.awake.food * m * trait(p, 'food') * dtH);
      p.fun = clamp(p.fun - R.awake.fun * m * trait(p, 'fun') * dtH);
      p.hygiene = clamp(p.hygiene - R.awake.hygiene * trait(p, 'hygiene') * dtH);
      p.energy = clamp(p.energy - R.awake.energy * m * trait(p, 'energy') * nightTired * dtH);
      if (p.energy <= 0) { startSleep(p, night); p.fun = clamp(p.fun - 10); events.push({ type: 'collapse' }); }
      // de noche, si nadie le presta atención por un rato, se duerme sola
      else if (night && p.energy < 80 && simT - (p.lastInteract || 0) > 30 * MIN) { startSleep(p, true); events.push({ type: 'nightSleep' }); }
      // caca
      if (p.digest > 20 && p.poops.length < R.maxPoops && rand() < Math.min(0.95, p.digest / 90) * 0.7 * dtH) {
        p.digest = Math.max(0, p.digest - 45);
        p.poops.push({ id: Math.random().toString(36).slice(2, 8), x: 0.12 + rand() * 0.76 });
        events.push({ type: 'poop' });
      }
    }
    p.hygiene = clamp(p.hygiene - p.poops.length * R.poopHygiene * dtH);

    // enfermedad
    if (!p.sick) {
      const hz = (0.01 + (p.hygiene < 30 ? 0.12 : 0) + p.poops.length * 0.05 + (p.food < 15 ? 0.08 : 0) + (p.energy < 10 ? 0.05 : 0) + (p.health < 40 ? 0.05 : 0)) * trait(p, 'sick');
      if (rand() < hz * dtH) { p.sick = true; events.push({ type: 'sick' }); }
    }

    // salud
    const D = R.healthDmg;
    const dmg = (p.sick ? D.sick : 0) + (p.food <= 0 ? D.food : 0) + (p.energy <= 0 ? D.energy : 0) + (p.hygiene <= 0 ? D.hygiene : 0) + (p.fun <= 0 ? D.fun : 0);
    if (dmg > 0) p.health = clamp(p.health - dmg * dtH);
    else if (p.food > 35 && p.fun > 35 && p.hygiene > 35 && p.energy > 15) p.health = clamp(p.health + R.healthRegen * dtH);

    p.careSum += ((p.food + p.energy + p.fun + p.hygiene + p.health) / 5 - (p.sick ? 15 : 0)) * dtH;
    p.careN += dtH;
    if (!p.sick && p.food > 40 && p.energy > 30 && p.fun > 40 && p.hygiene > 40) addXP(p, R.xpPerHourCared * dtH, events);

    // crecimiento
    checkGrowth(p, events);

    // muerte
    if (p.health <= 0) {
      p.dead = true; p.sleeping = false;
      p.cause = p.sick ? 'enfermedad' : p.food <= 0 ? 'hambre' : 'descuido';
      events.push({ type: 'death' });
    }
  }

  // Avanza el mundo desde lastSeen hasta ahora (catch-up offline) o un dt dado.
  function advance(dtMs, opts) {
    const events = [];
    const p = S.pet;
    if (!p || p.dead) return events;
    let left = Math.max(0, dtMs);
    const chunk = opts && opts.chunk ? opts.chunk : MIN;
    // límite de seguridad: 30 días
    left = Math.min(left, 30 * DAY);
    let simT = (opts && opts.live) ? now() : now() - left; // al ponerse al día, simula la hora real de cada momento
    while (left > 0 && !p.dead) {
      const d = Math.min(chunk, left);
      simT += d;
      step(p, d, events, null, (opts && opts.live) ? now() : simT);
      left -= d;
    }
    rewardEvents(events);
    recordEvents(events);
    if (p.dead && !p.diedAt) {
      p.diedAt = now();
      S.lockUntil = p.diedAt + R.lockout;
    }
    checkAchievements();
    return events;
  }

  let timeScale = 1;
  let lastTick = 0;
  // Devuelve null si pasó demasiado tiempo desde la última vuelta (la compu se suspendió o el celular
  // congeló la app): en ese caso hay que llamar a resume(), que simula ese rato como "mientras no estabas".
  function tick() {
    const t = now();
    if (!lastTick) { lastTick = t; return []; }
    const real = t - lastTick;
    if (real > 2 * MIN) return null;
    lastTick = t;
    if (real <= 0) return [];
    const ev = advance(real * timeScale, { chunk: 10e3 * Math.max(1, timeScale), live: timeScale === 1 });
    if (S) S.lastSeen = t; // lo simulado llega hasta acá (así resume() no lo vuelve a contar)
    ev.forEach((e) => N.emit('event', e));
    if (ev.length) N.emit('change');
    return ev;
  }

  // Al abrir o volver a la app: simular el tiempo que pasó.
  function resume() {
    const t = now();
    let gap = t - (S.lastSeen || t);
    if (gap < 0) gap = 0; // reloj atrasado: no se simula nada
    lastTick = t;
    const ev = gap > 2000 ? advance(gap) : [];
    S.lastSeen = t;
    return { gap, events: ev };
  }

  /* --------- predicción (para programar avisos con la app cerrada) --------- */
  // Simula una copia de la mascota hacia adelante, sin azar, y devuelve cuándo va a empezar a pedir cada cosa.
  // [{ id: 'food', level: 1|2, at: ms }] ordenado por hora. No toca la partida.
  function predict(horizonMs, stepMs) {
    const out = [];
    if (!S || !S.pet || S.pet.dead || S.pet.stage === 'egg') return out;
    const p = JSON.parse(JSON.stringify(S.pet));
    const st = stepMs || 5 * MIN, end = Math.min(horizonMs || DAY, 8 * DAY); // (sin cuidados tarda ~7 días en morir)
    const seen = {};
    let t = now();
    const lowRand = () => 1; // sin cacas ni enfermedades sorpresa: avisa lo que seguro va a pasar
    for (let el = 0; el < end && !p.dead; el += st) {
      t += st;
      step(p, st, [], lowRand, t);
      if (p.sleeping) continue;
      const lv = (id, v) => { const a = ASKS[id]; return v < a.urgentAt ? 2 : v < a.ask ? 1 : 0; };
      [['food', p.food], ['energy', p.energy], ['fun', p.fun], ['hygiene', p.hygiene], ['health', p.health]].forEach(([id, v]) => {
        const l = lv(id, v);
        if (l && (seen[id] || 0) < l) { seen[id] = l; out.push({ id, level: l, at: t }); }
      });
    }
    if (p.dead) out.push({ id: 'death', level: 3, at: t });
    return out.sort((a, b) => a.at - b.at);
  }

  /* --------- cómo está y qué hacer (para los porcentajes y la ayuda de nivel) --------- */
  // "~40 min", "~2 h", "~1 h 30 min"
  function dur(ms) {
    const m = Math.max(1, Math.round(ms / MIN));
    if (m < 55) return '~' + (m < 10 ? m : Math.round(m / 5) * 5) + ' min';
    const h = Math.floor(m / 60), r = Math.round((m - h * 60) / 15) * 15;
    if (r === 60) return '~' + (h + 1) + ' h';
    return '~' + h + ' h' + (r ? ' ' + r + ' min' : '');
  }
  // Todo lo que muestra la hoja "Cómo está": % de cada barra, cuánto falta, cuándo va a pedir y qué hacer
  // (los puntos salen de las mismas reglas de las acciones de arriba)
  function advice(opts) {
    const p = S && S.pet;
    if (!p || p.dead || p.stage === 'egg') return null;
    const t = now(), sleeping = p.sleeping, sick = p.sick;
    const pr = opts && opts.quick ? [] : predict(DAY, 10 * MIN);
    const askIn = (id) => { const e = pr.find((x) => x.id === id && x.level === 1) || pr.find((x) => x.id === id); return e ? e.at - t : null; };
    const inv = (k) => S.inv[k] || 0;
    const fullSleep = (100 - p.energy) / -R.asleep.energy * HOUR;
    const meters = {};
    const mk = (k, todo, xp, extra) => {
      const v = Math.round(p[k]), a = ASKS[k];
      const status = v < a.urgentAt ? 'urgent' : v < a.ask ? 'ask' : 'ok';
      const asks = status === 'ok' && !sleeping ? askIn(k) : null;
      meters[k] = Object.assign({ k, v, missing: 100 - v, status, todo, xp: xp || 0, asksIn: asks }, extra || {});
    };
    // comida
    {
      const f = p.food, xp = f < 50 ? 8 : f < 80 ? 3 : 0;
      const n = Math.ceil((100 - f) / ITEMS.fruit.food);
      mk('food', f >= 96 ? 'Está lleno.' : sleeping ? 'Cuando se despierte, dale de comer.'
        : `Dale de comer: una fruta llena ${ITEMS.fruit.food}% y su comida favorita ${ITEMS.fav.food}%` + (f < 80 ? ` (para llenarlo: ${n} fruta${n > 1 ? 's' : ''}).` : '.')
        + (!inv('fruit') && !inv('fav') ? ' No te queda comida: comprá en la tienda.' : ''), xp,
      { xpText: f < 50 ? 'Con hambre (menos de 50%) suma 8 puntos, 10 con su favorita' : f < 80 ? 'Ahora suma 3 puntos; con hambre (menos de 50%) suma 8' : 'Con hambre (menos de 50%) suma 8 puntos' });
    }
    // energía
    {
      const e = p.energy;
      const todo = sleeping ? `Está durmiendo: se llena en ${dur(fullSleep)}` + (isNight(t) ? ' (de noche duerme hasta la mañana).' : '.')
        : e > 85 ? 'Tiene energía de sobra: todavía no quiere dormir.'
        : e >= 60 ? `Todavía no necesita dormir (para llenarla le faltan ${dur(fullSleep)} de sueño).`
        : `Dejalo dormir ${dur(fullSleep)} para llenarla (dormido recupera ${-R.asleep.energy}% por hora).`;
      const xpOk = (sleeping ? p.sleepE0 != null && p.sleepE0 < 45 : e < 45);
      mk('energy', todo, 0, { sleepFor: fullSleep, xpText: xpOk ? `Si duerme al menos ${dur(35 / -R.asleep.energy * HOUR)} seguidos suma 8 puntos al despertar` : 'Si lo hacés dormir cuando está cansado (menos de 45%) suma 8 puntos al despertar' });
      if (!sleeping && e < 45) meters.energy.xp = 8;
    }
    // diversión
    {
      const f = p.fun;
      mk('fun', sleeping ? 'Cuando se despierte, jugá con él.' : f >= 96 ? 'Está re contento.'
        : 'Jugá un minijuego (sube 15% a 35%) o acaricialo (+3%).', f < 60 ? 5 : 1,
      { xpText: f < 60 ? 'Aburrido (menos de 60%): cada juego suma 5 a 17 puntos según cómo te vaya' : 'Ahora un juego suma 1 a 4 puntos; aburrido (menos de 60%) suma 5 a 17' });
    }
    // higiene
    {
      const g = p.hygiene, np = p.poops.length;
      mk('hygiene', (np ? `Limpiá la caca (${np}): ensucia y lo puede enfermar. ` : '') + (g >= 95 ? 'Está limpito.' : sleeping ? 'Cuando se despierte, bañalo.' : 'Bañalo: queda en 100%.'),
        (g < 50 ? 8 : g < 75 ? 3 : 0) + 4 * np,
        { xpText: 'Bañarlo sucio (menos de 50%) suma 8 puntos; cada caca que limpiás, 4' });
    }
    // salud
    {
      const h = p.health;
      const todo = sick ? 'Está enfermo: dale el remedio' + (inv('medicine') ? '.' : ' (comprá uno en la tienda).')
        : h < 98 && h < 60 ? 'Está débil: dale vitaminas' + (inv('vitamins') ? '.' : ' (en la tienda).') + ' También se recupera sola si comida, diversión e higiene están arriba de 35%.'
        : h < 98 ? 'Se recupera sola si comida, diversión e higiene están arriba de 35%.'
        : 'Está sano. Para que no se enferme: limpiá la caca y no lo dejes sucio ni con hambre.';
      mk('health', todo, sick ? 15 : h < 60 ? 5 : 0, { sick, xpText: 'Curarlo suma 15 puntos; vitaminas con la salud baja (menos de 60%), 5' });
      if (sick) meters.health.status = 'urgent';
    }
    // nivel
    const max = p.level >= R.maxLevel, need = xpNeed(p.level), left = max ? 0 : Math.max(0, need - p.xp);
    const cared = !sick && p.food > 40 && p.energy > 30 && p.fun > 40 && p.hygiene > 40;
    const tips = [];
    const add = (xp, text, nowOk) => tips.push({ xp, text, now: !!nowOk });
    if (!sleeping) {
      if (sick) add(15, 'Dale el remedio', true);
      if (p.food < 50) add(8, 'Dale de comer', true);
      if (p.energy < 45) add(8, `Hacelo dormir ${dur(fullSleep)}`, true);
      if (p.hygiene < 50) add(8, 'Bañalo', true);
      if (p.poops.length) add(4 * p.poops.length, 'Limpiá la caca', true);
      if (p.fun < 60 && !sick && p.energy >= 12) add('5–17', 'Jugá un minijuego', true);
      if (!sick && p.health < 60) add(5, 'Dale vitaminas', true);
    } else if (p.sleepE0 != null && p.sleepE0 < 45) add(8, `Dejalo dormir: se despierta solo en ${dur(fullSleep)}`, true);
    const stageNext = p.stage === 'baby' ? { lv: R.lvYoung, name: 'joven', minAge: R.minAgeYoung } : p.stage === 'young' ? { lv: R.lvAdult, name: 'adulto', minAge: R.minAgeAdult } : null;
    let ptsToStage = 0;
    if (stageNext) { for (let l = p.level; l < stageNext.lv; l++) ptsToStage += xpNeed(l); ptsToStage = Math.max(0, Math.ceil(ptsToStage - p.xp)); }
    const level = {
      level: p.level, xp: Math.floor(p.xp), need, left: Math.ceil(left), max, pct: max ? 100 : Math.floor((p.xp / need) * 100),
      cared, passiveIn: cared && !max ? left / R.xpPerHourCared * HOUR : null, perHour: R.xpPerHourCared,
      tips,
      stage: stageNext && { name: stageNext.name, lv: stageNext.lv, pts: ptsToStage, waitAge: Math.max(0, stageNext.minAge - p.age) },
    };
    return { meters, level, sleeping, sick };
  }
  // Una sola línea para debajo de la barra de nivel: lo más útil para sumar puntos ahora
  const NAMES = { food: 'la comida', energy: 'la energía', fun: 'la diversión', hygiene: 'la higiene' };
  function xpTip() {
    const a = advice({ quick: true });
    if (!a) return null;
    const L = a.level, p = S.pet;
    if (L.max) return { text: '¡Llegó al nivel máximo!', xp: 0 };
    const t = L.tips[0];
    if (t) return { text: t.text, xp: t.xp };
    if (L.cared) return { text: `Bien cuidado suma ${L.perHour} por hora: sube en ${dur(L.passiveIn)}`, xp: 0, passive: true };
    if (a.sleeping) return { text: 'Durmiendo: al despertar, cuidalo para sumar puntos', xp: 0 };
    if (p.sick) return { text: 'Curalo para que vuelva a sumar puntos', xp: 0 };
    const low = Object.keys(NAMES).filter((k) => p[k] <= (k === 'energy' ? 30 : 40)).sort((x, y) => p[x] - p[y])[0];
    return { text: low ? `Subí ${NAMES[low]} (${Math.round(p[low])}%) para que sume ${L.perHour} por hora` : 'Cuidalo para sumar puntos', xp: 0 };
  }

  /* --------- premio diario --------- */
  // (si el reloj se atrasó y "hoy" quedó antes del último cobro, no se vuelve a cobrar)
  function dailyPending() { const d = dayKey(now()); return d !== S.daily.last && !(S.daily.last && d < S.daily.last); }
  function claimDaily() {
    const today = dayKey(now());
    if (!dailyPending()) return null;
    const y = dayKey(now() - DAY);
    const streak = S.daily.last === y ? S.daily.streak + 1 : 1;
    let coins = 20 + 5 * Math.min(streak - 1, 6);
    const bonus = {};
    if (streak % 7 === 0) { coins += 30; bonus.medicine = 1; bonus.fav = 2; }
    S.daily = { last: today, streak };
    S.coins += coins;
    Object.keys(bonus).forEach((k) => (S.inv[k] = (S.inv[k] || 0) + bonus[k]));
    save();
    gain(10);
    checkAchievements();
    save();
    N.emit('change');
    return { coins, streak, bonus, nextCoins: 20 + 5 * Math.min(streak, 6) };
  }

  /* --------- acciones --------- */
  const ok = (msg, extra) => Object.assign({ ok: true, msg }, extra || {});
  const no = (msg) => ({ ok: false, msg });
  function alive() { return S.pet && !S.pet.dead; }
  function done(r) {
    if (r.ok) {
      if (S.pet && !S.pet.dead) S.pet.lastInteract = now();
      checkAchievements();
      save(); N.emit('change');
    }
    return r;
  }

  const A = {
    adopt(species, name) {
      if (S.pet && !S.pet.dead) return no('Ya tenés una mascota.');
      if (isLocked()) return no('Todavía no podés adoptar otra mascota.');
      if (!SPECIES[species]) return no('Elegí una especie.');
      S.pet = newPet(species, name);
      S.lockUntil = 0;
      return done(ok('¡Cuidá bien tu huevo!'));
    },
    warm() {
      const p = S.pet;
      if (!alive() || p.stage !== 'egg') return no('');
      p.egg.warmth = clamp(p.egg.warmth + 14);
      p.egg.progress += 0.6;
      return done(ok(p.egg.warmth >= 95 ? '¡Está calentito!' : ''));
    },
    feed(itemId) {
      const p = S.pet, it = ITEMS[itemId];
      if (!alive() || p.stage === 'egg') return no('');
      if (!it || it.kind !== 'food') return no('Eso no se come.');
      if (p.sleeping) return no('Está durmiendo. Despertalo primero.');
      if ((S.inv[itemId] || 0) <= 0) return no('No te queda. Comprá en la tienda.');
      if (p.food >= 96 && itemId !== 'cake') return no('¡Estoy lleno!');
      S.inv[itemId]--;
      const f0 = p.food;
      p.food = clamp(p.food + it.food);
      if (it.fun) p.fun = clamp(p.fun + it.fun);
      if (it.health) p.health = clamp(p.health + it.health);
      p.digest += it.food;
      S.stats.feeds++;
      const r = done(ok('¡Ñam!', { anim: 'eat' }));
      gain(f0 < 50 ? (itemId === 'fav' ? 10 : 8) : f0 < 80 ? 3 : 0);
      return r;
    },
    medicate(itemId) {
      const p = S.pet, it = ITEMS[itemId];
      if (!alive() || p.stage === 'egg') return no('');
      if (!it || it.kind !== 'med') return no('');
      if ((S.inv[itemId] || 0) <= 0) return no('No te queda. Comprá en la tienda.');
      if (it.cure && !p.sick) return no('No está enfermo. Guardá el remedio para cuando lo necesite.');
      if (!it.cure && p.health >= 98) return no('Ya tiene la salud completa.');
      S.inv[itemId]--;
      const weak = p.health < 60;
      if (it.cure) { p.sick = false; S.stats.cures++; }
      p.health = clamp(p.health + it.health);
      const r = done(ok(it.cure ? '¡Se curó!' : '¡Más fuerte!', { anim: 'happy' }));
      gain(it.cure ? 15 : weak ? 5 : 0);
      return r;
    },
    bath() {
      const p = S.pet;
      if (!alive() || p.stage === 'egg') return no('');
      if (p.sleeping) return no('Está durmiendo.');
      if (p.hygiene >= 95) return no('Ya está limpito.');
      const h0 = p.hygiene;
      p.hygiene = 100;
      S.stats.baths++;
      p.fun = clamp(p.fun + (p.species === 'lizard' || p.species === 'turtle' ? 6 : -2));
      const r = done(ok('¡Qué limpito!', { anim: 'bath' }));
      gain(h0 < 50 ? 8 : h0 < 75 ? 3 : 0);
      return r;
    },
    clean(poopId) {
      const p = S.pet;
      if (!alive() || !p.poops.length) return no('No hay nada para limpiar.');
      const n = poopId ? 1 : p.poops.length;
      p.poops = poopId ? p.poops.filter((x) => x.id !== poopId) : [];
      S.stats.cleans += n;
      p.hygiene = clamp(p.hygiene + 4 * n);
      const r = done(ok(''));
      gain(4 * n);
      return r;
    },
    sleep() {
      const p = S.pet;
      if (!alive() || p.stage === 'egg') return no('');
      if (p.sleeping) {
        p.sleeping = false;
        const xp = wakeXP(p);
        if (p.energy < 40) { p.fun = clamp(p.fun - 8); return done(ok(`Mmm… ${greeting(now()).toLowerCase()}. Se despertó de mal humor`)); }
        const r = done(ok(`¡${greeting(now())}!`));
        if (xp) gain(xp);
        return r;
      }
      if (p.energy > 85) return no('¡No tengo sueño!');
      startSleep(p, isNight(now()));
      return done(ok('Dulces sueños…'));
    },
    pet() {
      const p = S.pet;
      if (!alive() || p.stage === 'egg') return no('');
      const t = now();
      if (t - p.lastPet < 3000) return no('');
      p.lastPet = t;
      if (p.sleeping) return no('');
      p.fun = clamp(p.fun + 3);
      const r = done(ok('', { anim: 'love' }));
      if (t - (p.lastPetXP || 0) > 10 * MIN) { p.lastPetXP = t; gain(1); }
      return r;
    },
    canPlay() {
      const p = S.pet;
      if (!alive() || p.stage === 'egg') return no('');
      if (p.sleeping) return no('Está durmiendo.');
      if (p.sick) return no('Está enfermo, no tiene ganas de jugar.');
      if (p.energy < 12) return no('Está muy cansado para jugar.');
      return ok('');
    },
    gameResult(score, max) {
      const p = S.pet;
      if (!alive()) return no('');
      const ratio = Math.max(0, Math.min(1, score / Math.max(1, max)));
      const coins = Math.round(4 + ratio * 16);
      const bored = p.fun < 60;
      p.fun = clamp(p.fun + 15 + ratio * 20);
      // jugar cansa, da hambre y ensucia
      p.energy = clamp(p.energy - 10);
      p.food = clamp(p.food - 6);
      p.hygiene = clamp(p.hygiene - 5);
      S.coins += coins;
      S.totalGames++;
      S.stats.games++;
      const r = done(ok('', { coins }));
      gain(bored ? Math.round(5 + ratio * 12) : Math.round(1 + ratio * 3));
      return r;
    },
    buy(itemId, qty) {
      const it = ITEMS[itemId];
      qty = Math.floor(Number(qty) || 1);
      if (!it || qty < 1 || qty > 99 || (it.kind === 'wear' && qty !== 1)) return no('');
      if (it.kind === 'wear' && S.owned[itemId]) return no('Ya lo tenés.');
      const cost = it.price * qty;
      if (S.coins < cost) return no('No te alcanzan las monedas.');
      S.coins -= cost;
      if (it.kind === 'wear') { S.owned[itemId] = true; S.wearing = itemId; }
      else S.inv[itemId] = (S.inv[itemId] || 0) + qty;
      return done(ok('¡Comprado!'));
    },
    wear(itemId) {
      if (itemId && !S.owned[itemId]) return no('');
      S.wearing = S.wearing === itemId ? null : itemId;
      return done(ok(''));
    },
    // Fondos: comprar uno lo deja puesto; elegir uno que ya es tuyo es gratis
    buyBg(id) {
      const b = BACKGROUNDS[id];
      if (!b) return no('');
      if (S.bgOwned[id]) return no('Ya lo tenés.');
      if (S.coins < b.price) return no('No te alcanzan las monedas.');
      S.coins -= b.price;
      S.bgOwned[id] = true; S.bg = id;
      return done(ok('¡Fondo nuevo!'));
    },
    setBg(id) {
      if (!BACKGROUNDS[id] || !S.bgOwned[id]) return no('');
      S.bg = id;
      return done(ok(''));
    },
    // Minijuegos que se desbloquean con monedas
    buyGame(id) {
      const g = GAMES[id];
      if (!g) return no('');
      if (!g.price || S.gamesOwned[id]) return no('Ya lo tenés.');
      if (S.coins < g.price) return no('No te alcanzan las monedas.');
      S.coins -= g.price;
      S.gamesOwned[id] = true;
      return done(ok('¡Juego nuevo!'));
    },
    // Acredita una compra con dinero real (paquete de monedas). Cada compra tiene un ID único (el de Google Play):
    // si llega dos veces (por ejemplo, al reabrir la app antes de que Google la confirme), se acredita una sola vez.
    grantPurchase(txId, sku, qty) {
      const pack = PACKS.find((x) => x.sku === sku);
      txId = String(txId || '');
      if (!pack || !txId) return no('Compra desconocida.');
      if (S.purchases[txId]) return ok('', { dup: true, coins: 0 });
      qty = Math.max(1, Math.min(20, Math.floor(Number(qty) || 1)));
      const coins = pack.coins * qty;
      S.purchases[txId] = { sku, qty, coins, t: now() };
      // se guardan sólo las últimas 300 compras (alcanza de sobra para reconocer repetidas)
      const ids = Object.keys(S.purchases);
      if (ids.length > 300) ids.sort((a, b) => (S.purchases[a].t || 0) - (S.purchases[b].t || 0)).slice(0, ids.length - 300).forEach((k) => delete S.purchases[k]);
      S.coins += coins;
      return done(ok('¡Gracias por tu compra!', { coins }));
    },
    rename(name) {
      if (!S.pet) return no('');
      const n = (name || '').trim().slice(0, 16);
      if (!n) return no('Escribí un nombre.');
      S.pet.name = n;
      return done(ok(''));
    },
    // Despedir a la mascota fallecida: pasa a los recuerdos y se puede elegir otro huevo enseguida.
    farewell() {
      const p = S.pet;
      if (!p || !p.dead) return no('');
      S.memorial.unshift({ name: p.name, species: p.species, stage: p.stage, age: p.age, diedAt: p.diedAt, cause: p.cause });
      S.memorial = S.memorial.slice(0, 30);
      S.pet = null;
      if (!S.lockUntil) S.lockUntil = (p.diedAt || now()) + R.lockout;
      return done(ok(''));
    },
    // Borra todo y vuelve a elegir mascota (conserva sólo los ajustes y el día del premio diario)
    resetAll() {
      const keep = { settings: S.settings, daily: S.daily, purchases: S.purchases };
      S = Object.assign(freshState(), keep);
      save();
      N.emit('reset');
      N.emit('change');
      return ok('');
    },
    // Sacar una foto para el álbum
    photo() {
      const p = S.pet;
      if (!alive() || p.stage === 'egg') return no('');
      S.album.unshift(photo(p, S.wearing));
      S.album = S.album.slice(0, 60);
      return done(ok('¡Foto guardada en el álbum!'));
    },
    setting(key, val) {
      S.settings[key] = val;
      return done(ok(''));
    },
  };

  /* --------- copia de seguridad --------- */
  function exportState() {
    save();
    return JSON.stringify({ app: 'virtual-pet', format: 1, exportedAt: new Date().toISOString(), state: S }, null, 1);
  }
  function importState(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { return no('El archivo no es una copia de Virtual Pet.'); }
    const st = data && (data.app === 'virtual-pet' || data.app === 'nido') && data.state; // 'nido' = copias de versiones anteriores
    if (!st || typeof st !== 'object' || typeof st.coins !== 'number') return no('El archivo no es una copia de Virtual Pet.');
    if (st.pet && !SPECIES[st.pet.species]) return no('La copia está dañada.');
    S = migrate(Object.assign(freshState(), st));
    // la mascota sigue tal como estaba en la copia: no se le cobra el tiempo que pasó desde que se guardó
    // (antes, recuperar una copia vieja la encontraba muerta de hambre)
    S.lastSeen = now();
    save();
    N.emit('reset');
    N.emit('change');
    return ok('¡Partida recuperada!');
  }

  N.core = {
    SPECIES, ITEMS, BACKGROUNDS, GAMES, PACKS, WEAR, R, HOUR, MIN, DAY, predict, ASKS,
    load, save, resume, tick, advance, step, claimDaily, dailyPending,
    mood, needs, greeting, ageText, xpNeed, advice, xpTip, dur, addXP, isNight, exportState, importState, ACHIEVEMENTS, TRAITS, checkAchievements, stageName, careAvg, isLocked, dayKey, newPet, freshState,
    get state() { return S; },
    set state(v) { S = v; },
    get storageOk() { return storageOk; },
    get loadInfo() { return loadInfo; },
    KEY,
    get timeScale() { return timeScale; },
    set timeScale(v) { timeScale = v; },
    act: A,
  };
})();
