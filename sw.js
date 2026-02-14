const CACHE_NAME = 'fitbunny-v21';

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
  // Clean the path of query parameters for extension checking
  const cleanPath = url.pathname.split('?')[0];
  const isModule = cleanPath.endsWith('.tsx') || cleanPath.endsWith('.ts');

  if (isSameOrigin && isModule) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (!response || !response.ok) return response;

          // Force the MIME type for JavaScript modules
          const content = await response.text();
          const headers = new Headers(response.headers);
          headers.set('Content-Type', 'application/javascript; charset=utf-8');
          
          return new Response(content, {
            status: response.status,
            statusText: response.statusText,
            headers: headers
          });
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // General fetch strategy: Network first, then cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && isSameOrigin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => {
        if (cached) return cached;
        // Navigation fallback
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      }))
  );
});