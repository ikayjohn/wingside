// Wingside Service Worker for PWA functionality
// Caching strategy: Network First with Cache fallback

const CACHE_NAME = 'wingside-v1';
const urlsToCache = [
  '/',
  '/order',
  '/my-account/dashboard',
  '/api/flavors',
  '/api/products',
  '/api/categories',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network First strategy with Cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external resources (CDNs, Supabase, etc.)
  if (url.origin !== location.origin) {
    // For API calls to Supabase, use Network Only
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(
        fetch(request).catch((error) => {
          console.error('API fetch failed:', error);
          return new Response(JSON.stringify({ error: 'Network error' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );
      return;
    }
    return;
  }

  // For static assets and pages, use Network First with Cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response since it can only be consumed once
        const responseToCache = response.clone();

        // Add the response to the cache
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If not in cache and offline, return offline page
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }

          return new Response('Offline - No cached data available', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});

// Background sync for failed requests (experimental)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  // Implementation for syncing failed order requests when back online
  // This would integrate with your order submission logic
  console.log('Syncing orders...');
}
