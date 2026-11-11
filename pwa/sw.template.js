// Service worker de la aplicación. No se edita en dist/: vite.config.js lo genera en cada compilación
// rellenando los dos marcadores de abajo: la versión (número + huella del contenido) y la lista de archivos.
const VERSION = '__VERSION__';
const CACHE = 'trifasico-' + VERSION;
const PRECACHE = __PRECACHE__;

// Instalación: descarga todo el sitio a una caché nueva. No toma el control por su cuenta: si ya hay una
// versión anterior en uso, espera a que la página lo pida (aviso «Hay una actualización»).
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('trifasico-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'GET_VERSION' && e.source) e.source.postMessage({ version: VERSION });
});

// Peticiones: primero la caché de esta versión (funciona sin red); si falta, la red.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const navegacion = req.mode === 'navigate';
  e.respondWith(caches.open(CACHE).then(async c => {
    const enCache = await (navegacion ? c.match('./index.html') : c.match(req));
    if (enCache) return enCache;
    try { return await fetch(req); } catch { return navegacion ? c.match('./index.html') : Response.error(); }
  }));
});
