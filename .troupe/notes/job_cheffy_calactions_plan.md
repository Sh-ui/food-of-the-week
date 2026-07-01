# Build blueprint -- calendar-actions wiring (part 4/9)

Foreman's blueprint for the builder. Scope is FIXED: wire the `generate-ics` family
(add-all ICS, per-recipe mini ICS, Google Calendar link) into the part-3 action
registry, fed by per-week `CookingEvent`s, WITHOUT editing `CheffyPanel.astro` and
WITHOUT mounting Cheffy in `Layout.astro` (that is part 9). Consume the audit-passed
`cheffyCalendar.ts` as-is.

Grounded on `notes/job_cheffy_calactions_research.md` (auto-attached) + direct reads
of `CheffyPanel.astro`, `cheffyCalendar.ts`, `Cheffy.astro`, `cheffy-dialogue.json`,
`CHEFFY-SYSTEM.md`, `package.json`.

---

## Key decisions (resolving the two research GAPs)

1. **CRITICAL -- Buffer trap.** `buildIcs()` -> `foldLine()` calls `Buffer.byteLength`
   (a Node global). Vite/Astro do NOT polyfill `Buffer` for the client bundle, so
   importing `buildIcs`/`extractCookingEvents`/`deriveWeekStart` into a browser script
   throws `ReferenceError: Buffer is not defined` at runtime. RESOLUTION: run ALL of
   `cheffyCalendar.ts` at Astro BUILD TIME (Node context, in `Cheffy.astro`
   frontmatter) and embed only finished **strings** (ICS text + Google URLs) in a JSON
   data island. The client handler file imports **nothing runtime** from
   `cheffyCalendar.ts` -- `import type` only. Do NOT edit `cheffyCalendar.ts`.

2. **Host = `Cheffy.astro`, not a new component.** `CHEFFY-SYSTEM.md` says final wiring
   is "`Cheffy.astro` imports ... the calendar util." Editing `Cheffy.astro` is allowed
   (only `CheffyPanel.astro` is off-limits). Put the build-time data island + the client
   init `<script>` inside `Cheffy.astro` so part 9 gets one mount point. Add a
   `filename?: string` prop, GUARDED so the still-unmounted stub keeps building when
   `filename` is undefined.

3. **GAP resolved -- who threads `filename` / mounts Cheffy: part 9, not part 4.** Part 4
   makes `Cheffy.astro` prop-ready (`filename`) and guards the absent case. Part 9
   (pe-build-gate / final Layout wiring) owns adding `<Cheffy filename={...} />` to
   Layout and threading each page's resolved filename. Until then the island is empty
   and handlers no-op gracefully -- nothing throws. See "Follow-up for Director" below.
   No Director escalation needed; this is inside the part-4 boundary as stated.

4. **GAP resolved -- per-recipe entry point.** The static dialogue tree cannot enumerate
   this week's meals, and `CheffyPanel.astro` (the renderer) is off-limits. RESOLUTION:
   add options to the existing `calendar` dialogue node and have a `generate-ics-meal`
   handler inject a per-meal button list into the open panel at click time (buttons use
   a distinct class + direct listeners so they do NOT collide with the panel's delegated
   `.cheffy-option` dispatch). Per-meal ICS strings are prebuilt at build time.

5. **Registration seam.** `window.registerCheffyAction(name, fn)` (defined at module top
   of CheffyPanel's script) is the public port; `dispatchAction` reads
   `window.cheffyActions[name]` at click time. Registering from a separate client script
   is exactly the intended pattern. To be robust against script execution order, the new
   file registers via a fallback that also works if `registerCheffyAction` is not yet
   defined (see snippet). Unregistered actions fall through to the graceful default, so
   the panel never throws before/without part 9.

---

## Files to touch (exactly three; everything else is OFF-LIMITS)

### A. NEW `src/utils/cheffyCalendarActions.ts` -- client init (browser, DOM-only)

Purpose: register the three handlers on `window`. Pure DOM. **No runtime import from
`cheffyCalendar.ts`** (types only). Reads the build-time data island; never calls
`buildIcs`.

- Module-top, order-safe registration helper:
  ```ts
  const w = window as any;
  const register = w.registerCheffyAction
    || ((name: string, fn: (ctx: any) => void) => {
         w.cheffyActions = w.cheffyActions || {};
         w.cheffyActions[name] = fn;
       });
  ```
- Data-island reader (typed to the contract below):
  ```ts
  interface CalendarIsland {
    weekIcs: string;
    weekGoogleUrl: string | null;
    meals: Array<{ mealSlug: string; label: string; ics: string; googleUrl: string }>;
  }
  function readIsland(): CalendarIsland {
    const el = document.getElementById('cheffy-week-ics');
    try { return JSON.parse(el?.textContent || '') as CalendarIsland; }
    catch { return { weekIcs: '', weekGoogleUrl: null, meals: [] }; }
  }
  ```
- Blob download helper:
  ```ts
  function downloadIcs(fileName: string, icsText: string): void {
    const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0); // revoke next tick so the download starts
  }
  ```
- `register('generate-ics', (ctx) => {...})`: read island; if `!weekIcs` set the panel
  text to a friendly "No cooking times found this week." (via
  `ctx.panel.querySelector('.cheffy-text')`) and return; else optionally flip processing
  state around the download: `ctx.setState?.('processing'); downloadIcs('week.ics',
  weekIcs); ctx.setState?.('dialogue');`.
- `register('generate-ics-meal', (ctx) => {...})`: read `island.meals`; if empty, show
  the same friendly message. Else build a `<ul>` and one `<button type="button"
  class="cheffy-meal-export">` per meal (label = `meal.label`), each with a DIRECT
  `click` listener calling `downloadIcs(`${meal.mealSlug}.ics`, meal.ics)`. Append the
  `<ul>` into `ctx.panel.querySelector('.cheffy-node')`. Do NOT use class
  `cheffy-option` (it would be swallowed by the panel's delegated dispatch).
- `register('open-google-calendar', (ctx) => {...})`: if `island.weekGoogleUrl`,
  `window.open(url, '_blank', 'noopener')`.

Notes: `ctx` shape (from `buildCtx`) = `{ root, panel, dialogue, nodeId, index,
setState, renderNode, close }`. There is NO `events` field on ctx -- source data from
the island only. `ctx.setState` = the part-2 `root.cheffySetState` hook (may be
undefined if part-2 host absent -> optional-chain it).

### B. EDIT `src/components/Cheffy.astro` -- build-time island + load the client script

Frontmatter (Node/SSR = `Buffer` available = safe to call `buildIcs`):
```ts
import fs from 'fs';
import path from 'path';
import { deriveWeekStart, extractCookingEvents, buildIcs, googleCalendarUrl }
  from '../utils/cheffyCalendar';
```
Add `filename?: string` to `Props` and destructure it. Build a GUARDED island:
```ts
let calendarIsland: {
  weekIcs: string;
  weekGoogleUrl: string | null;
  meals: Array<{ mealSlug: string; label: string; ics: string; googleUrl: string }>;
} = { weekIcs: '', weekGoogleUrl: null, meals: [] };

if (filename) {
  try {
    const md = fs.readFileSync(path.join(process.cwd(), filename), 'utf-8');
    const weekStart = deriveWeekStart(md, filename);
    if (weekStart) {
      const events = extractCookingEvents(md, weekStart);
      if (events.length) {
        calendarIsland.weekIcs = buildIcs(events);
        calendarIsland.weekGoogleUrl = googleCalendarUrl(events[0]);
        const bySlug = new Map<string, typeof events>();
        for (const ev of events) {
          const key = ev.mealSlug || 'cooking';
          (bySlug.get(key) ?? bySlug.set(key, []).get(key)!).push(ev);
        }
        calendarIsland.meals = [...bySlug.entries()].map(([mealSlug, evs]) => ({
          mealSlug,
          label: (evs[0].title.split(' -- ')[0] || mealSlug).trim(),
          ics: buildIcs(evs),
          googleUrl: googleCalendarUrl(evs[0]),
        }));
      }
    }
  } catch { /* leave empty island -- never break the build */ }
}
```
Inside the `#cheffy` div (near `<CheffyPanel />`), emit the island (mirror
CheffyPanel's `is:inline set:html` JSON convention):
```astro
<script type="application/json" id="cheffy-week-ics" is:inline
        set:html={JSON.stringify(calendarIsland)} />
```
Add a bundled module script (NOT `is:inline`, so the ES import resolves) to load the
registrations:
```astro
<script>
  import '../utils/cheffyCalendarActions';
</script>
```
Do NOT change the existing part-2 state `<script>` or the `cheffySetState` hook.

### C. EDIT `src/data/cheffy-dialogue.json` -- expose the two new entry points

In the `calendar` node, replace its `options` with:
```json
"options": [
  { "label": "Add all events", "action": "generate-ics" },
  { "label": "Export a single meal", "action": "generate-ics-meal" },
  { "label": "Open in Google Calendar", "action": "open-google-calendar" },
  { "label": "Back", "goto": "root" }
]
```
Update the top-level `_actions` doc string to append `generate-ics-meal` and
`open-google-calendar` to the valid-action list. Keep the file valid JSON. Do NOT
touch the `notifications` or `checklist` nodes.

---

## Data-island contract (the per-page seam)

`#cheffy-week-ics` (JSON, one per rendered page once part 9 mounts Cheffy):
```ts
{
  weekIcs: string,               // buildIcs(allEvents); '' when no events / no filename
  weekGoogleUrl: string | null,  // googleCalendarUrl(earliest event); null when none
  meals: Array<{
    mealSlug: string,            // stable key from cheffyCalendar slugify
    label: string,               // button text (meal title, time-suffix stripped)
    ics: string,                 // buildIcs(events for this meal) -- single/mini export
    googleUrl: string            // googleCalendarUrl(first event of this meal)
  }>
}
```
All values are strings/null -- **no `Date`** crosses the island (Dates do not round-trip
through JSON). By construction the client never needs `new Date(...)`.

---

## Acceptance checks (for the builder)

1. `npm run build` (= `astro check && astro build`) passes clean -- types OK, guarded
   `Cheffy.astro` frontmatter compiles, dialogue JSON parses.
2. Buffer-safety (the critical one): `src/utils/cheffyCalendarActions.ts` contains NO
   `buildIcs`, `extractCookingEvents`, `deriveWeekStart`, or `Buffer` reference, and any
   import from `cheffyCalendar` is `import type` only. (grep-assert.)
3. Off-limits files are byte-unchanged: `CheffyPanel.astro`, `Layout.astro`, all
   `src/pages/*`, `cheffyCalendar.ts`, `public/sw.js`, `GroceryList.astro`. (git diff.)
4. `cheffy-dialogue.json`: `calendar` node exposes the 3 action options + Back;
   `_actions` string updated; file still valid JSON.
5. Registration is order-safe: uses the `window.registerCheffyAction || fallback`
   pattern and guards `cheffyActions ||= {}`.
6. OPTIONAL dev smoke (MUST be reverted before finishing -- do not commit): temporarily
   add `<Cheffy filename="FOOD-OF-THE-WEEK.md" />` to `src/pages/index.astro`,
   `npm run dev`, open Cheffy -> "Add cooking times to my calendar":
   - "Add all events" downloads `week.ics` containing `BEGIN:VCALENDAR` + `>=1`
     `BEGIN:VEVENT`.
   - "Export a single meal" lists meal buttons; clicking one downloads a
     single-event `<mealSlug>.ics`.
   - "Open in Google Calendar" opens a prefilled `calendar.google.com/render?...` tab.
   Revert the temp mount.

---

## Gotchas

- NEVER import `buildIcs` (or any Buffer-touching fn) into the client file -- runtime
  `Buffer is not defined`. `astro build` will NOT catch this; it only surfaces in the
  browser. Enforce by review + grep (check #2).
- Injected per-meal buttons must NOT use class `cheffy-option` -- the panel's delegated
  click handler would treat them as `goto`/`action` and swallow them. Use
  `cheffy-meal-export` + direct listeners.
- `renderNode()` (owned by CheffyPanel) does `replaceChildren()` on navigation, wiping
  injected meal buttons. That is fine -- they regenerate the next time
  "Export a single meal" is clicked. Do not try to persist them.
- `URL.revokeObjectURL` on the next tick (`setTimeout(..., 0)`), never synchronously, or
  some browsers cancel the download.
- Google Calendar TEMPLATE URLs are single-event only -- "Open in Google Calendar" opens
  the earliest event, not the whole week. Documented API limitation; matches
  `googleCalendarUrl`'s single-event signature. (Full-week goes via the ICS path.)
- `extractCookingEvents` intentionally SKIPS the first H2 (grocery section); meals begin
  at the 2nd H2. A meal with no parseable time yields no event -> it simply won't appear
  in `meals[]`. Empty week -> empty island -> handlers show the friendly no-times message.
- Guard the `filename` read: until part 9 threads it, `filename` is undefined and the
  island stays empty -- the stub must keep building.

---

## Follow-up for the Director (later part, NOT part 4)

Part 9 (pe-build-gate / final Layout wiring) must mount `<Cheffy filename={...} />` in
`Layout.astro` and thread each page's already-resolved filename down:
`index.astro` -> `'FOOD-OF-THE-WEEK.md'`; `weekend.astro` -> `'WEEKEND.md'`;
`archive/[slug].astro` -> the `filename` prop it already holds in frontmatter. Only then
does `#cheffy-week-ics` populate and the handlers run end-to-end. Part 4 delivers the
prop-ready component and does not wire Layout or pages.
