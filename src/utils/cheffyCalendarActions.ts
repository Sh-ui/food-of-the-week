// cheffyCalendarActions.ts -- client-side registration for the calendar-actions
// family (generate-ics, generate-ics-meal, open-google-calendar).
// Full design contract: ../../CHEFFY-SYSTEM.md > Feature: Calendar event sync.
//
// BROWSER-ONLY DOM code. Deliberately imports NOTHING runtime from
// cheffyCalendar.ts (that module calls Buffer.byteLength, a Node global Vite/Astro
// do not polyfill for the client bundle). All ICS/Google-URL strings are computed
// at Astro BUILD TIME (see Cheffy.astro) and consumed here purely as strings via
// the #cheffy-week-ics JSON data island.
//
// See notes/job_cheffy_calactions_plan.md for the full contract.

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

function downloadIcs(fileName: string, icsText: string): void {
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0); // revoke next tick so the download starts
}

const NO_TIMES_MESSAGE = 'No cooking times found this week.';

register('generate-ics', (ctx: any) => {
  const island = readIsland();
  if (!island.weekIcs) {
    const textEl = ctx.panel?.querySelector('.cheffy-text');
    if (textEl) textEl.textContent = NO_TIMES_MESSAGE;
    return;
  }
  ctx.setState?.('processing');
  downloadIcs('week.ics', island.weekIcs);
  ctx.setState?.('dialogue');
});

register('generate-ics-meal', (ctx: any) => {
  const island = readIsland();
  const nodeEl = ctx.panel?.querySelector('.cheffy-node');
  if (!island.meals.length) {
    const textEl = ctx.panel?.querySelector('.cheffy-text');
    if (textEl) textEl.textContent = NO_TIMES_MESSAGE;
    return;
  }
  if (!nodeEl) return;

  const list = document.createElement('ul');
  for (const meal of island.meals) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cheffy-meal-export';
    btn.textContent = meal.label;
    btn.addEventListener('click', () => {
      downloadIcs(`${meal.mealSlug}.ics`, meal.ics);
    });
    li.appendChild(btn);
    list.appendChild(li);
  }
  nodeEl.appendChild(list);
});

register('open-google-calendar', (_ctx: any) => {
  const island = readIsland();
  if (island.weekGoogleUrl) {
    window.open(island.weekGoogleUrl, '_blank', 'noopener');
  }
});
