// NSTP System Service Worker - Development Mode
// Minimal service worker for development - lets Vite dev server handle requests

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - passthrough for development
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('<h1>Offline</h1>', { 
          headers: { 'Content-Type': 'text/html' }
        });
      })
    );
  }
  // All other requests pass through to network (no caching in dev mode)
});
