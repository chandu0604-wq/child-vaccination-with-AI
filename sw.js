const CACHE_NAME = 'cvm-v1.0.3-' + Date.now(); // Version-based cache busting

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([
    './', './index.html', './styles.css?v=1.0.3', './app.js?v=1.0.3', './manifest.json'
  ])));
  self.skipWaiting(); // Force activation
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control immediately
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  
  // Always try network first for dynamic content
  e.respondWith(
    fetch(req).then((res) => {
      // Cache successful responses
      if (res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => {
      // Fallback to cache if network fails
      return caches.match(req);
    })
  );
});


