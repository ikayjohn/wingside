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

// Push notification event
self.addEventListener('push', (event) => {
  try {
    let data = {
      title: 'Wingside Notification',
      body: 'You have a new notification',
      icon: '/logo.png',
      badge: '/badge-icon.png',
      data: {},
    };

    if (event.data) {
      try {
        data = { ...data, ...event.data.json() };
      } catch (e) {
        console.error('Error parsing push data:', e);
      }
    }

    const options = {
      body: data.body,
      icon: data.icon || '/logo.png',
      badge: data.badge || '/badge-icon.png',
      image: data.image,
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      tag: data.tag || 'general-notification',
      timestamp: data.timestamp || Date.now(),
      vibrate: data.vibrate || [200, 100, 200],
    };

    // Add URL if provided
    if (data.url) {
      options.data.url = data.url;
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Push event error:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notification = event.notification;
  const data = notification.data || {};

  // Handle action clicks
  if (event.action) {
    if (event.action === 'copy' && data.discountCode) {
      // Copy discount code to clipboard
      event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clients) => {
          // Focus or open a window and copy the code
          if (clients.length > 0) {
            return clients[0].focus().then((client) => {
              // Send message to client to copy code
              client.postMessage({
                type: 'COPY_CODE',
                code: data.discountCode,
              });
              return client;
            });
          } else {
            return self.clients.openWindow('/');
          }
        })
      );
      return;
    }
  }

  // Default behavior: open the URL or focus the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const url = data.url || '/';

      // If there's an existing window, focus it and navigate
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then((focusedClient) => {
            if (url !== '/') {
              focusedClient.navigate(url);
            }
            return focusedClient;
          });
        }
      }

      // If no existing window, open a new one
      if ('openWindow' in self.clients) {
        return self.clients.openWindow(url);
      }

      return Promise.resolve();
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
