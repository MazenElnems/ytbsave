self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('ytbsave-cache').then((cache) => {
      return cache.addAll([
        '/Ytbsave',
        '/Ytbsave/index.html',
        '/Ytbsave/manifest.webmanifest',
        '/Ytbsave/logo.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== 'ytbsave-cache') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
