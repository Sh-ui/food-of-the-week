// cheffyNotifications.ts -- client-side registration for the local-notifications
// action family (trigger-permission, notification-status, clear-reminders).
// Full design contract: ../../CHEFFY-SYSTEM.md > Feature: Local push notifications.
//
// BROWSER-ONLY DOM code. Deliberately self-contained: imports nothing from
// cheffyCalendarActions.ts or cheffyCalendar.ts (the latter calls Buffer.byteLength,
// a Node global Vite/Astro do not polyfill for the client bundle). The pure
// schedule math lives in cheffySchedule.ts; persistence lives in
// cheffyScheduleStore.ts (IndexedDB); delivery-while-closed lives in
// public/sw.js. This module's job is just the click-time UI glue: build the
// week's schedule from the build-time data islands, persist it, register the
// service worker (subpath-safe -- see the `base` helper below, this used to
// hardcode '/sw.js' and 404 under GH Pages' BASE_URL), arm periodic
// background sync as a best-effort extra, and keep a page-open setTimeout
// path for while the tab is actually open.

export {}; // force module scope so top-level names don't collide with sibling scripts

import { buildWeekSchedule, resolveNotificationConfig, type ScheduledNotification } from './cheffySchedule';
import { replaceSchedule, getSchedule, markFired, clearSchedule } from './cheffyScheduleStore';
// Client JSON import -- CheffyPanel does the same for the dialogue tree.
import config from '../data/cheffy-config.json';

// Module-top, order-safe registration helper -- works whether CheffyPanel's script
// (which defines window.registerCheffyAction) has run yet or not.
const w = window as any;
const register =
  w.registerCheffyAction ||
  ((name: string, fn: (ctx: any) => void) => {
    w.cheffyActions = w.cheffyActions || {};
    w.cheffyActions[name] = fn;
  });

interface CalendarIslandMeal {
  mealSlug: string;
  label: string;
  ics: string;
  googleUrl: string;
}

interface CalendarIsland {
  weekIcs: string;
  weekGoogleUrl: string | null;
  meals: CalendarIslandMeal[];
}

interface LunchWeekIslandDay {
  date: string;
  dow: string;
  name: string;
}

interface LunchWeekIsland {
  weekStart: string;
  days: LunchWeekIslandDay[];
}

function readIsland(): CalendarIsland {
  const el = document.getElementById('cheffy-week-ics');
  try {
    return JSON.parse(el?.textContent || '') as CalendarIsland;
  } catch {
    return { weekIcs: '', weekGoogleUrl: null, meals: [] };
  }
}

function readLunchIsland(): LunchWeekIsland {
  const el = document.getElementById('cheffy-lunch-week');
  try {
    return JSON.parse(el?.textContent || '') as LunchWeekIsland;
  } catch {
    return { weekStart: '', days: [] };
  }
}

const notifSupported = 'Notification' in window && 'serviceWorker' in navigator;

const MAX_TIMEOUT_MS = 2147483647; // setTimeout's 32-bit signed max

// Re-invoke safety -- clear any previously scheduled reminders before scheduling
// a fresh batch, so double-clicking "sync reminders" never double-fires.
const timers: number[] = [];

function setText(ctx: any, message: string): void {
  const textEl = ctx?.panel?.querySelector('.cheffy-text');
  if (textEl) textEl.textContent = message;
}

// Subpath-safe base path (GH Pages deploys under BASE_URL '/food-of-the-week/'
// in prod -- the old '/sw.js' registration 404s there).
const base = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : import.meta.env.BASE_URL + '/';

function scheduleUrls() {
  return { week: location.pathname, lunch: base + 'lunch/', home: base };
}

function clearTimers(): void {
  timers.forEach(clearTimeout);
  timers.length = 0;
}

function formatUpcoming(n: ScheduledNotification): string {
  const d = new Date(n.whenMs);
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  if (h === 0) h = 12;
  const mm = String(m).padStart(2, '0');
  return `${n.title} -- ${dow} ${h}:${mm} ${ampm}`;
}

register('trigger-permission', async (ctx: any) => {
  try {
    if (!notifSupported) {
      setText(ctx, "Reminders aren't supported in this browser.");
      return;
    }

    // Request permission first, before any other await, to stay inside the
    // user gesture from the button click.
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      setText(
        ctx,
        'No worries -- reminders are off. You can enable notifications in your browser settings anytime.'
      );
      return;
    }

    ctx?.setState?.('processing');

    const reg = await navigator.serviceWorker.register(base + 'sw.js');
    await navigator.serviceWorker.ready;

    const island = readIsland();
    const lunchIsland = readLunchIsland();

    const schedule = buildWeekSchedule({
      meals: island.meals.map((m) => ({ label: m.label, ics: m.ics })),
      lunchDays: lunchIsland.days,
      config: resolveNotificationConfig((config as any).notifications),
      urls: scheduleUrls(),
      now: Date.now(),
    });

    if (!schedule.length) {
      setText(ctx, "Nothing left to remind you about this week -- check back when the new menu lands.");
      ctx?.setState?.('dialogue');
      return;
    }

    const stored = schedule.map((n) => ({ ...n, fired: false, syncedAt: Date.now() }));
    await replaceSchedule(stored);

    // Harmless immediate delivery pass -- lets the SW catch anything already due.
    reg.active?.postMessage({ type: 'cheffy-check' });

    // Best-effort periodic background sync -- the whole point of this feature
    // (pings with the site closed) but never required for anything above.
    if ('periodicSync' in reg) {
      try {
        if ('permissions' in navigator) {
          await (navigator as any).permissions.query({ name: 'periodic-background-sync' as any });
        }
        await (reg as any).periodicSync.register('cheffy-schedule', { minInterval: 12 * 60 * 60 * 1000 });
      } catch {
        // unsupported/denied -- fine, sw wake + in-page timers still cover us
      }
    }

    // In-page precision path: fires immediately if the tab stays open.
    clearTimers();
    const now = Date.now();
    for (const n of schedule) {
      const delay = n.whenMs - now;
      if (delay < 0 || delay > MAX_TIMEOUT_MS) continue;
      const id = window.setTimeout(() => {
        reg
          .showNotification(n.title, { body: n.body, tag: n.tag, data: { url: n.url } } as any)
          .then(() => markFired(n.id))
          .catch(() => {});
      }, delay);
      timers.push(id);
    }

    const cookN = schedule.filter((n) => n.kind === 'cook').length;
    const lunchN = schedule.filter((n) => n.kind === 'lunch').length;
    const hasSync = schedule.some((n) => n.kind === 'sync');

    const segments: string[] = [];
    if (cookN) segments.push(`${cookN} cook times`);
    if (lunchN) segments.push(`${lunchN} lunches`);
    if (hasSync) segments.push("a nudge when next week's menu lands");

    let tail = '';
    if (segments.length === 1) {
      tail = segments[0];
    } else if (segments.length === 2) {
      tail = segments.join(' and ');
    } else if (segments.length > 2) {
      tail = segments.slice(0, -1).join(', ') + ', and ' + segments[segments.length - 1];
    }

    const message = tail
      ? `You're set! I queued ${schedule.length} reminders -- ${tail}. Tip: 'Add to Home Screen' helps reminders arrive with the site closed.`
      : `You're set! I queued ${schedule.length} reminders. Tip: 'Add to Home Screen' helps reminders arrive with the site closed.`;

    setText(ctx, message);
    ctx?.setState?.('dialogue');
  } catch {
    // Never throw -- CheffyPanel's dispatch try/catch is synchronous and would
    // not catch a rejected async promise here, so this handler must be fully
    // self-contained.
    setText(ctx, "Reminders aren't supported in this browser.");
    ctx?.setState?.('dialogue');
  }
});

register('notification-status', async (ctx: any) => {
  try {
    const entries = await getSchedule();
    if (!entries.length) {
      setText(ctx, 'No reminders synced yet. Want me to set this week up?');
      return;
    }

    const now = Date.now();
    const upcoming = entries
      .filter((n) => !n.fired && n.whenMs > now)
      .sort((a, b) => a.whenMs - b.whenMs);

    if (!upcoming.length) {
      setText(ctx, "This week's reminders are all done. Sync again when the new menu lands!");
      return;
    }

    setText(ctx, `You have ${upcoming.length} reminders coming up. Next: ${formatUpcoming(upcoming[0])}.`);
  } catch {
    setText(ctx, 'No reminders synced yet. Want me to set this week up?');
  }
});

register('clear-reminders', async (ctx: any) => {
  try {
    clearTimers();
    await clearSchedule();
    setText(ctx, 'Okay, reminders are off.');
  } catch {
    setText(ctx, 'Okay, reminders are off.');
  }
});
