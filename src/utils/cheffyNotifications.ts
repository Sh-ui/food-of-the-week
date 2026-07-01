// cheffyNotifications.ts -- client-side registration for the local-notifications
// action family (trigger-permission).
// Full design contract: ../../CHEFFY-SYSTEM.md > Feature: Local push notifications.
//
// BROWSER-ONLY DOM code. Deliberately self-contained: imports nothing from
// cheffyCalendarActions.ts or cheffyCalendar.ts (the latter calls Buffer.byteLength,
// a Node global Vite/Astro do not polyfill for the client bundle). Cook times are
// recovered by parsing DTSTART out of the #cheffy-week-ics island's ICS strings --
// no parallel data source, no client-side recompute of the schedule.
//
// See notes/cheffy_p5_notif_plan.md for the full contract.

export {}; // force module scope so top-level names don't collide with sibling scripts

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

function readIsland(): CalendarIsland {
  const el = document.getElementById('cheffy-week-ics');
  try {
    return JSON.parse(el?.textContent || '') as CalendarIsland;
  } catch {
    return { weekIcs: '', weekGoogleUrl: null, meals: [] };
  }
}

// Returns epoch ms (UTC) for every DTSTART found in an ICS blob.
function dtstartsToEpochMs(ics: string): number[] {
  const re = /DTSTART:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/g;
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(ics))) {
    out.push(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
  }
  return out;
}

const notifSupported = 'Notification' in window && 'serviceWorker' in navigator;
const triggersSupported = notifSupported && 'showTrigger' in Notification.prototype;

const MAX_TIMEOUT_MS = 2147483647; // setTimeout's 32-bit signed max

// Re-invoke safety -- clear any previously scheduled reminders before scheduling
// a fresh batch, so double-clicking "turn on reminders" never double-fires.
const timers: number[] = [];

function setText(ctx: any, message: string): void {
  const textEl = ctx?.panel?.querySelector('.cheffy-text');
  if (textEl) textEl.textContent = message;
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

    await navigator.serviceWorker.register('/sw.js');
    const reg = await navigator.serviceWorker.ready;

    const island = readIsland();
    const entries: Array<{ label: string; whenMs: number }> = [];
    const sourceMeals = island.meals && island.meals.length ? island.meals : [];
    if (sourceMeals.length) {
      for (const meal of sourceMeals) {
        for (const whenMs of dtstartsToEpochMs(meal.ics)) {
          entries.push({ label: meal.label, whenMs });
        }
      }
    } else if (island.weekIcs) {
      for (const whenMs of dtstartsToEpochMs(island.weekIcs)) {
        entries.push({ label: '', whenMs });
      }
    }

    const now = Date.now();
    const upcoming = entries.filter(
      (e) => e.whenMs - now > 0 && e.whenMs - now <= MAX_TIMEOUT_MS
    );

    if (!upcoming.length) {
      setText(ctx, 'No upcoming cook times to remind you about this week.');
      ctx?.setState?.('dialogue');
      return;
    }

    timers.forEach(clearTimeout);
    timers.length = 0;

    for (const { label, whenMs } of upcoming) {
      const delay = whenMs - Date.now();
      if (triggersSupported) {
        // Dead/future-proof path: Notification Triggers is a discontinued API on
        // all real targets today, so this branch is inert -- kept only so the
        // feature self-heals if the API ever returns. `TimestampTrigger` is
        // referenced via `window as any` since it is absent from lib.dom types.
        reg
          .showNotification('Time to cook!', {
            body: label ? `${label} -- it's cooking time.` : "It's cooking time.",
            tag: `cheffy-cook-${whenMs}`,
            data: { url: location.href },
            showTrigger: new (window as any).TimestampTrigger(whenMs),
          } as any)
          .catch(() => {});
        continue;
      }
      const id = window.setTimeout(() => {
        reg
          .showNotification('Time to cook!', {
            body: label ? `${label} -- it's cooking time.` : "It's cooking time.",
            tag: `cheffy-cook-${whenMs}`,
            data: { url: location.href },
          })
          .catch(() => {});
      }, delay);
      timers.push(id);
    }

    setText(ctx, "Reminders on! I'll ping you at cook time -- keep this tab open.");
    ctx?.setState?.('dialogue');
  } catch {
    // Never throw -- CheffyPanel's dispatch try/catch is synchronous and would
    // not catch a rejected async promise here, so this handler must be fully
    // self-contained.
    setText(ctx, "Reminders aren't supported in this browser.");
    ctx?.setState?.('dialogue');
  }
});
