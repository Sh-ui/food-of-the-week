// cheffyScheduleStore.ts -- client-side IndexedDB persistence for Cheffy's
// notification schedule.
// Full design contract: ../../CHEFFY-SYSTEM.md > Feature: Local push notifications.
//
// Promise-wrapped raw IndexedDB, no dependencies. Exists so a synced schedule
// survives page reloads/tab closes and is readable from public/sw.js (a
// service worker cannot import TS modules, so IT DUPLICATES the DB_NAME /
// DB_VERSION / STORE constants and the StoredNotification record shape --
// see the matching comment at the top of public/sw.js. If you change the
// shape or bump the schema here, update sw.js in lockstep or delivery will
// silently read the wrong fields.
//
// Fail-soft throughout: private-browsing/blocked/unsupported IndexedDB never
// throws out of these functions -- callers get an empty array / false / a
// swallowed no-op instead, matching the "never throw" discipline the rest of
// the Cheffy notification stack follows.

import type { ScheduledNotification } from './cheffySchedule';

export type StoredNotification = ScheduledNotification & {
  fired: boolean;
  syncedAt: number; // epoch ms this record was written, for future pruning/debugging
};

export const DB_NAME = 'cheffy-db';
export const DB_VERSION = 1;
export const STORE = 'schedule'; // keyPath 'id'

/** True if this browser context has IndexedDB at all (feature test, not a guarantee it works). */
export function idbSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!idbSupported()) {
      reject(new Error('indexedDB unsupported'));
      return;
    }
    let req: IDBOpenDBRequest;
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

/** Clear the store then put every entry. Returns false on any failure (never throws). */
export async function replaceSchedule(entries: StoredNotification[]): Promise<boolean> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      store.clear();
      for (const entry of entries) store.put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}

/** All stored entries, or [] on any failure/unsupported environment. Never throws. */
export async function getSchedule(): Promise<StoredNotification[]> {
  try {
    const db = await openDb();
    const out = await new Promise<StoredNotification[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as StoredNotification[]) ?? []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return out;
  } catch {
    return [];
  }
}

/** Best-effort mark-as-fired by id. Swallows all errors -- never throws. */
export async function markFired(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const record = getReq.result as StoredNotification | undefined;
        if (record) {
          record.fired = true;
          store.put(record);
        }
      };
      getReq.onerror = () => reject(getReq.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  } catch {
    // best-effort -- swallow
  }
}

/** Wipe the whole schedule store. Returns false on any failure (never throws). */
export async function clearSchedule(): Promise<boolean> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}
