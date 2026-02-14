
const CACHE_NAME = 'fitbunny-v9';

// Assets to cache for offline backup
const OFFLINE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  // Intercept TSX/TS files to fix potential MIME type issues (mostly for GitHub Pages)
  if (url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts')) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (!response.ok) return response;
          
          // Check if we actually need to override (if it's already JS, don't touch it)
          const contentType = response.headers.get('Content-Type');
          if (contentType && (contentType.includes('javascript') || contentType.includes('ecmascript'))) {
            return response;
          }

          // Force the correct MIME type
          const newHeaders = new Headers(response.headers);
          newHeaders.set('Content-Type', 'application/javascript');
          
          const blob = await response.blob();
          return new Response(blob, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          });
        })
        .catch((err) => {
          console.error('SW Fetch Error for module:', url.href, err);
          return caches.match(event.request);
        })
    );
    return;
  }

  // Standard caching strategy for other assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
