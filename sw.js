/* LOBAR — Service Worker: hace instalable la app y guarda la interfaz para abrir rápido.
   Los datos SIEMPRE van a Supabase por red (nunca se cachean). */
const CACHE = 'lobar-v3';
const ASSETS = ['./', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './logo-96.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Supabase (datos, fotos, auth): siempre por red, sin cache
  if (url.hostname.includes('supabase.co')) return;
  // Resto (html, iconos, fuentes): primero cache, si no está, red y guardar
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      if (res.ok && e.request.method === 'GET') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }))
  );
});