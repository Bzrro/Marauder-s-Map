// Service worker de Mi Mapa — guarda en caché lo esencial de la app
// para que abra aunque no tengas señal en el momento. Los mapas nuevos,
// las rutas y las búsquedas de lugares siguen necesitando internet,
// porque dependen de servicios externos (OpenStreetMap, OSRM, Nominatim).

const CACHE_NAME = 'mi-mapa-cache-v1';
const ARCHIVOS_ESENCIALES = [
  './mi-mapa.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_ESENCIALES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo interceptamos pedidos a nuestro propio sitio (mismo origen).
  // Todo lo externo (mapas, rutas, búsquedas) sigue yendo directo a internet.
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((respuestaRed) => {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, respuestaRed.clone()));
            return respuestaRed;
          })
          .catch(() => cached); // sin internet: devolvemos lo que había en caché
        return cached || fetchPromise;
      })
    );
  }
});
