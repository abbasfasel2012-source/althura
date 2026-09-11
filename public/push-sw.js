// Push + notification handling, imported by the generated Workbox service worker.
/* eslint-disable no-undef */

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'الذرى الذكية', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'الذرى الذكية';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      dir: 'rtl',
      lang: 'ar',
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          if ('navigate' in client && client.url !== target) client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true }).then((list) => {
      list.forEach((c) => c.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' }));
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
