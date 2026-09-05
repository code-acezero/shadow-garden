// Shadow Garden PWA Service Worker (v6 - Clean Slate)
const CACHE_NAME = 'shadow-garden-pwa-v6';

self.addEventListener('install', (event) => {
  // Activate worker immediately without waiting
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          console.log('[SW] Purging cache store:', cache);
          return caches.delete(cache);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Do NOT intercept or cache Next.js chunks or HTML to prevent stale chunk 404s
self.addEventListener('fetch', () => {
  // Let the browser and Vercel CDN handle all requests natively
  return;
});
