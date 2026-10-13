/**
 * Tech Wash Progressive Web App Service Worker
 * Provides offline caching, lightning-fast native app launching, and background sync.
 */

const CACHE_NAME = 'techwash-pwa-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/techwashlogo.webp',
  '/techwash_hero_cutout.webp'
];

// Install Event: Cache Core Static Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Some assets failed to pre-cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Cleanup Stale Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Same-Origin Only Network-First with Cache Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);

  // Ignore cross-origin requests (Firestore WebChannel streams, Google Maps, fonts, CDNs) and API endpoints
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // For local media files, cache first with network fallback
  if (url.pathname.endsWith('.webp') || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first strategy for same-origin navigation and assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
