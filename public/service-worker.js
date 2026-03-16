const CACHE_NAME = 'bk-cache-v14';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Installs the service worker and caches core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activates the service worker and cleans up old caches
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

// Intercepts fetch requests and serves from cache if available (Network First strategy for HTML/JSON, Cache First for static assets)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Use Network First for API data or HTML
  if (url.pathname.endsWith('.json') || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache the response
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache First for everything else (CSS, JS, Fonts, Images)
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request)
            .then((response) => {
              if (response && response.status === 200 && response.type === 'basic') {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              // Optional: Return a fallback image if image request fails
            });
        })
    );
  }
});
