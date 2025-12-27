/**
 * Service Worker Registration Utility
 * Registers the service worker for PWA functionality
 */

export function registerSW() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered with scope:', registration.scope);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is available, show update notification
                  console.log('⏳ New content is available; please refresh.');
                  // You can trigger a UI notification here
                  if (window.confirm('New version available! Reload to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    });
  }
}

/**
 * Unregister the service worker
 */
export function unregisterSW() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('✅ Service Worker unregistered');
      })
      .catch((error) => {
        console.error('❌ Service Worker unregistration failed:', error);
      });
  }
}
