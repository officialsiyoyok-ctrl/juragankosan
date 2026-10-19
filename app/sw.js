/**
 * Juragankosan Production Service Worker
 * 100% Offline-First PWA Cache Engine
 * Target Domain: app.juragankosan.id
 */

const CACHE_NAME = 'juragankos-prod-v2.2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icons/favicon.svg',
  './css/main.css?v=6.2',
  './css/components.css?v=6.2',
  './css/print.css?v=6.2',
  './js/app.js?v=6.2',
  './js/state.js?v=6.2',
  './js/utils/formatter.js?v=6.2',
  './js/utils/modal.js?v=6.2',
  './js/utils/whatsapp.js?v=6.2',
  './js/utils/license.js?v=6.2',
  './js/utils/appLock.js?v=6.2',
  './js/utils/onboarding.js?v=6.2',
  './js/utils/leadCapture.js?v=6.2',
  './js/views/dashboardView.js?v=6.2',
  './js/views/roomsView.js?v=6.2',
  './js/views/tenantsView.js?v=6.2',
  './js/views/billsView.js?v=6.2',
  './js/views/financialView.js?v=6.2',
  './js/views/expensesView.js?v=6.2',
  './js/views/settingsView.js?v=6.2',
  './js/views/backupView.js?v=6.2'
];

// 1. Install Event: Pre-cache core shell & assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Juragankosan SW: Some static assets failed to pre-cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up outdated legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Network-First with Cache Fallback for dynamic fresh updates & offline support
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  // Ignore non-http schemes (e.g. chrome-extension, data)
  if (!url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses for subsequent offline usage
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If network request fails (e.g. offline), serve from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If offline navigation request, fallback to root index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
