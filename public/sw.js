// sw.js -- service worker for Cheffy local cooking-time notifications. STUB / SCAFFOLD.
// Full design contract: ../CHEFFY-SYSTEM.md > Feature: Local push notifications.
//
// Opt-in, local-only: registered + permission requested through a Cheffy dialogue
// action (trigger-permission), never on page load. Uses Notification Triggers /
// Alarm API where available; degrades cleanly where not (e.g. iOS Safari).

self.addEventListener('install', () => {
  // No precache yet -- Cheffy is progressive enhancement, the site is served
  // statically by GitHub Pages. TODO(cheffy): skipWaiting + any caching strategy.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// TODO(cheffy): schedule local reminders for extracted cooking times via the
// Notification Triggers API, and handle notificationclick to focus/open the week.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
});
