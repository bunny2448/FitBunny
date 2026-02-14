const CACHE_NAME = 'fitbunny-v23';

const OFFLINE_ASSETS = [
  './',
  'index.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  const isSameOrigin = url.origin === self.location.origin;
  
  // We skip intercepting .tsx and .ts in the Service Worker to let es-module-shims handle them
  // This avoids double-processing and MIME type mismatch errors in sandboxed environments
  const isModule = url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts');

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && isSameOrigin && !isModule) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => {
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      }))
  );
});