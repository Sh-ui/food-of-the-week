// sw.js -- service worker for Cheffy local cooking-time notifications.
// Full design contract: ../CHEFFY-SYSTEM.md > Feature: Local push notifications.
//
// Opt-in, local-only: registered + permission requested through a Cheffy dialogue
// action (trigger-permission), never on page load. Scheduling itself happens
// page-side via setTimeout + reg.showNotification (best-effort, foreground-only;
// the Notification Triggers API is a discontinued proposal and is not relied on
// here). This worker's job is just to focus/open the week on notification click.

self.addEventListener('install', () => {
  // No precache yet -- Cheffy is progressive enhancement, the site is served
  // statically by GitHub Pages.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Focus an already-open tab for this site if one exists, else open the week URL.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of wins) {
      if ('focus' in c) { try { await c.focus(); } catch (_) {} return; }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
