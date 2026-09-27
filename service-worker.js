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

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.link || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) => client.url.startsWith(self.location.origin));
      if (existingClient) {
        existingClient.navigate(targetUrl);
        return existingClient.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Push event for Web Push notifications
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'NSTP Notification', message: event.data ? event.data.text() : 'You have a new update.' };
  }
  const title = data.title || 'NSTP Update';
  const options = {
    body: data.message || data.body || 'You have a new notification.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.tag || `nstp-push-${Date.now()}`,
    data: { link: data.link || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle incoming messages from client to show notification via service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(self.registration.showNotification(title, options));
  }
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
