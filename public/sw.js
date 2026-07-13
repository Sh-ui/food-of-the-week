// sw.js -- service worker for Cheffy's local cooking/lunch/sync reminders.
// Full design contract: ../CHEFFY-SYSTEM.md > Feature: Local push notifications.
//
// Opt-in, registered + permission requested through a Cheffy dialogue action
// (trigger-permission), never on page load. The schedule itself is built and
// persisted page-side (src/utils/cheffySchedule.ts + cheffyScheduleStore.ts);
// this worker's job is to deliver reminders that are due even when no tab is
// open -- on periodic background sync, on any wake (activate/message), and to
// focus/open the site on notification click. Best-effort, not guaranteed:
// Android/Chrome only wakes periodic sync opportunistically (network, charging,
// engagement heuristics). Late-but-delivered beats never.
//
// Plain JS, self-contained: a service worker cannot `import` the TS modules,
// so the IndexedDB constants + record shape are DUPLICATED here. Keep this in
// lockstep with src/utils/cheffyScheduleStore.ts -- DB_NAME/DB_VERSION/STORE
// and the StoredNotification fields (id, whenMs, title, body, url, tag, kind,
// fired, syncedAt) must match or delivery silently reads nothing/garbage.

const DB_NAME = 'cheffy-db';
const DB_VERSION = 1;
const STORE = 'schedule'; // keyPath 'id' -- see cheffyScheduleStore.ts

const STALE_MS = 24 * 60 * 60 * 1000; // don't surface reminders more than a day late

function openDb() {
  return new Promise((resolve, reject) => {
    let req;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      reject(err);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('indexedDB blocked'));
  });
}

function getAll(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function putAll(db, records) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const record of records) store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// Show every due, unfired, not-too-stale reminder; mark ALL due records fired
// (stale ones are skipped silently, never re-attempted). Entirely try/catch
// wrapped -- must never reject the event.waitUntil chain fatally.
async function deliverDue() {
  try {
    const db = await openDb();
    const all = await getAll(db);
    const now = Date.now();
    const due = all.filter((r) => r && !r.fired && typeof r.whenMs === 'number' && r.whenMs <= now);

    if (!due.length) {
      db.close();
      return;
    }

    for (const record of due) {
      try {
        if (now - record.whenMs <= STALE_MS) {
          await self.registration.showNotification(record.title || 'Cheffy', {
            body: record.body || '',
            tag: record.tag || record.id,
            data: { url: record.url || '/' },
          });
        }
      } catch {
        // showNotification failing shouldn't block marking the record fired
      }
      record.fired = true;
    }

    await putAll(db, due);
    db.close();
  } catch {
    // best-effort delivery -- never throw out of the event handler
  }
}

self.addEventListener('install', () => {
  // No precache yet -- Cheffy is progressive enhancement, the site is served
  // statically by GitHub Pages.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      await deliverDue();
    })()
  );
});

// Best-effort wake source: Android/Chrome periodic background sync.
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cheffy-schedule') {
    event.waitUntil(deliverDue());
  }
});

// Harmless immediate delivery pass, poked right after a sync from an open tab.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'cheffy-check') {
    event.waitUntil(deliverDue());
  }
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
