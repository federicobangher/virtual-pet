/* Virtual Pet — service worker: guarda el juego para que funcione sin internet. */
const VERSION = 'vpet-v1.11.1';
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './css/pet.css', './css/style.css',
  './js/art.js', './js/core.js', './js/platform.js', './js/sound.js', './js/anim.js', './js/ui.js', './js/billing.js', './js/games.js', './js/themes.js', './js/room.js', './js/desktop.js', './js/boot.js',
  './fonts/grandstander-latin-800-normal.woff2', './fonts/nunito-latin-600-normal.woff2', './fonts/nunito-latin-800-normal.woff2',
  './icons/icon-192.png', './icons/icon-256.png', './icons/icon-512.png', './icons/maskable-512.png',
];
self.addEventListener('install', (e) => {
  // cache: 'reload' = pedir cada archivo de nuevo al servidor. Sin esto, la versión nueva podía guardar
  // archivos viejos que el navegador tenía en su caché (GitHub Pages los guarda 10 minutos) y quedaban
  // mezclados archivos de dos versiones: el juego fallaba o "se colgaba" después de actualizar.
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow('./index.html');
  }));
});
