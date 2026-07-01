# cheffy_p5_notif_plan -- build blueprint (local notifications)

JOB_ID: cheffy_p5_notif_plan
For: the builder of the local-notifications part. Read this, then execute. Research
grounding: notes/cheffy_p5_notif_research.md (auto-attached). Key APIs and the
"Notification Triggers is a DEAD API" finding come from there -- do not re-research.

## Scope / boundary (do not cross)

Touch ONLY these three files:
1. NEW `src/utils/cheffyNotifications.ts` -- the client action handler.
2. `public/sw.js` -- real `notificationclick`; leave install/activate as-is.
3. `src/components/Cheffy.astro` -- append ONE new bundled `<script>` import block
   (mirror lines 244-249). NOTHING ELSE in this file.

Do NOT edit `CheffyPanel.astro` or `cheffy-dialogue.json` -- the `notifications`
node and the `"action": "trigger-permission"` option already exist
(dialogue.json lines 32-39; action listed in `_actions` line 8). Do NOT edit
Cheffy.astro's frontmatter or the `#cheffy-week-ics` island shape (boundary =
single import line only).

## CRITICAL boundary consequence -- how to get cook timestamps

The research note (c) suggested adding a `startIso` field to the island. **That is
OUT OF BOUNDS here** (it edits Cheffy.astro frontmatter). Instead, recover each
cook time by parsing the `DTSTART` line already present inside the island's
`ics` strings. This is string/number-only math -- no `Buffer`, no import of
`cheffyCalendar.ts` (that module uses `Buffer.byteLength`, a Node global absent
from the client bundle -- see cheffyCalendarActions.ts header comment, lines 4-9).

Confirmed format (cheffyCalendar.ts:40-44, emitted at 315): every VEVENT carries
`DTSTART:YYYYMMDDTHHMMSSZ` in UTC, unfolded (short line). Parse with:

```ts
// returns epoch ms (UTC) for every DTSTART found in an ICS blob
function dtstartsToEpochMs(ics: string): number[] {
  const re = /DTSTART:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/g;
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(ics))) {
    out.push(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
  }
  return out;
}
```

## Data source: reuse `#cheffy-week-ics` (same island cheffyCalendarActions reads)

Copy the island read pattern from cheffyCalendarActions.ts:36-43 verbatim
(`document.getElementById('cheffy-week-ics')` + `JSON.parse(el.textContent)`,
try/catch -> empty island). The `CalendarIsland` shape (cheffyCalendarActions.ts:23-34):
`{ weekIcs, weekGoogleUrl, meals: [{ mealSlug, label, ics, googleUrl }] }`.

Schedule from `island.meals`: for each meal, take `dtstartsToEpochMs(meal.ics)` and
pair each timestamp with `meal.label` for a friendly notification body. (Fall back
to `island.weekIcs` only if `meals` is empty.) One source of truth -- no parallel
island, no client recompute of the schedule.

## Registration seam (order-safe, copy verbatim)

Copy the module-top shim from cheffyCalendarActions.ts:15-21 EXACTLY (do not import
that file -- keep this module self-contained per the same Node-isolation rationale):

```ts
const w = window as any;
const register =
  w.registerCheffyAction ||
  ((name: string, fn: (ctx: any) => void) => {
    w.cheffyActions = w.cheffyActions || {};
    w.cheffyActions[name] = fn;
  });
```

Register exactly one action: `register('trigger-permission', async (ctx: any) => { ... })`.

`ctx` surface (from CheffyPanel.astro buildCtx, lines 126-140): `{ root, panel,
dialogue, nodeId, index, setState, renderNode, close }`. For messages, write to
`ctx.panel?.querySelector('.cheffy-text')` -- mirror cheffyCalendarActions.ts:62-64.

## Feature detection (exact -- from research (b), Triggers is DEAD)

```ts
const notifSupported = 'Notification' in window && 'serviceWorker' in navigator;
const triggersSupported = notifSupported && 'showTrigger' in Notification.prototype;
```

On the real target (Android Pixel + Chrome) `triggersSupported` is `false` today
(confirmed dead API). Keep the trigger branch as a harmless dead/future-proof path
but expect every real user to hit the `setTimeout` fallback. Do NOT design an
iOS-specific branch -- `'Notification' in window` naturally excludes iOS Safari via
the generic no-op path.

## `trigger-permission` handler -- ordered steps

The handler is `async`. IMPORTANT gotcha: CheffyPanel's dispatchAction
(CheffyPanel.astro:142-153) wraps the call in a synchronous try/catch, which does
NOT catch a rejected async promise. So this handler must be **self-contained
try/catch around its whole body** -- an unhandled rejection would trip the
"no console errors" non-negotiable. Never throw; never touch `panel.hidden`.

1. `if (!notifSupported)` -> write "Reminders aren't supported in this browser."
   to `.cheffy-text` and `return`. No permission prompt, no SW register. (This is
   the clean no-op path; also covers iOS Safari.)
2. Request permission BEFORE any `await` on other work, to stay inside the user
   gesture from the button click:
   `const perm = await Notification.requestPermission();`
   (Calling `requestPermission()` synchronously at the top of the handler preserves
   the gesture; do not `await serviceWorker.register` before this call.)
3. `if (perm !== 'granted')` -> write "No worries -- reminders are off. You can
   enable notifications in your browser settings anytime." and `return`.
4. Register + wait for the SW:
   `await navigator.serviceWorker.register('/sw.js');`
   `const reg = await navigator.serviceWorker.ready;`
5. Read island, build the `{ label, whenMs }[]` list via `dtstartsToEpochMs`.
6. For each entry compute `delay = whenMs - Date.now()`; schedule only if
   `delay > 0 && delay <= 2147483647` (setTimeout's max signed-32-bit; larger
   delays overflow and fire immediately -- week events are always within days, so
   this just guards garbage). Skip past events silently.
   ```ts
   setTimeout(() => {
     reg.showNotification("Time to cook!", {
       body: label ? `${label} -- it's cooking time.` : "It's cooking time.",
       tag: `cheffy-cook-${whenMs}`,      // dedupe identical reminders
       data: { url: location.href },       // week URL for notificationclick
     }).catch(() => {});                    // never throw from the timer
   }, delay);
   ```
7. Re-invoke safety: keep a module-level `const timers: number[] = []`; at the top
   of a successful scheduling run, `timers.forEach(clearTimeout); timers.length = 0;`
   then push each new id. Prevents double reminders if the user clicks twice.
8. Success message to `.cheffy-text`: "Reminders on! I'll ping you at cook time --
   keep this tab open." (Reflects the page-must-stay-open caveat from research (b):
   `setTimeout` is throttled/killed when the tab is backgrounded/closed; this is
   best-effort, NOT a closed-tab scheduler. Do not promise closed-tab delivery.)
9. If `island.meals` is empty / no future times: write "No upcoming cook times to
   remind you about this week." and return gracefully.

Optional nicety (not required): `ctx.setState?.('processing')` before the awaits and
`ctx.setState?.('dialogue')` after, mirroring cheffyCalendarActions.ts:66-68.

## Dead trigger branch (keep, costs nothing)

Inside the per-event loop, `if (triggersSupported)` you MAY call
`reg.showNotification(title, { ..., showTrigger: new (window as any).TimestampTrigger(whenMs) })`
instead of setTimeout. Reference `TimestampTrigger` via `(window as any)` so
`astro check` (TS) does not error on the missing lib type. Since `triggersSupported`
is `false` on all real targets, this branch is inert -- it exists only to self-heal
if the API ever returns. Simplest acceptable alternative: skip the branch entirely
and always use setTimeout; the research confirms that is the only path that fires
today. Either is acceptable -- do NOT block on it.

## public/sw.js -- notificationclick (real) + minimal surface

Keep `install` (skipWaiting) and `activate` (clients.claim) unchanged. Replace the
stub `notificationclick` (currently just `event.notification.close()`) with
focus-or-open-the-week:

```js
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
```

No `push` handler (there is no push server) and no `message`->showNotification hook
is needed: the PAGE calls `reg.showNotification(...)` directly (ServiceWorker-
Registration.showNotification is callable from the page context). Keep sw.js minimal.
Remove the two `TODO(cheffy)` comments that referenced Notification Triggers, or
update the top comment to say scheduling is page-side setTimeout (best-effort,
Triggers API is discontinued) -- but this is public/ JS, not type-checked; keep it
plain valid JS.

## Cheffy.astro mount -- ONE new bundled script block

After the existing calendar-actions block (lines 244-249), append a new block that
mirrors it exactly:

```astro
<script>
  // Registers the notifications handler (trigger-permission) against the
  // part-3 action-dispatch registry. Bundled (not is:inline) so the ES import
  // resolves; module-load side effect only.
  import '../utils/cheffyNotifications';
</script>
```

This is the only change to Cheffy.astro. Bundled import = runs only when Cheffy
mounts (progressive enhancement); Cheffy stays NOT mounted in Layout.astro, so
master-parity holds with Cheffy JS disabled.

## Acceptance (checkable)

- [ ] `npm run build` green (astro check then astro build -- no TS errors, no build
      errors). Watch: `TimestampTrigger` referenced only via `(window as any)`;
      handler typed `async (ctx: any)`; `w`/`register` copied as `window as any`.
- [ ] Only 3 files changed: `public/sw.js`, new `src/utils/cheffyNotifications.ts`,
      `src/components/Cheffy.astro` (one appended script block). `git diff --stat`
      shows nothing else -- especially NOT CheffyPanel.astro / cheffy-dialogue.json
      / Cheffy.astro frontmatter / the island shape / Layout.astro.
- [ ] No console errors in any path: unsupported browser, permission denied,
      permission granted, empty island, double-click on "Turn on reminders".
      (Verified by the self-contained try/catch + `.catch(() => {})` on the timer
      and showNotification.)
- [ ] Handler never touches `panel.hidden`; graceful in-panel `.cheffy-text`
      message in every branch; never blocks the panel.
- [ ] Cheffy still NOT mounted in Layout.astro; rendered pages byte-identical to
      master with Cheffy JS disabled (the new import only loads inside Cheffy).
- [ ] `cheffyNotifications.ts` imports nothing from `cheffyCalendar.ts` (no Buffer
      in the client bundle); all schedule math is string/number based.

## Gotchas recap (most likely to bite)

1. Async handler + synchronous dispatch try/catch = own try/catch is MANDATORY,
   else an unhandled rejection = console error = fails a non-negotiable.
2. Call `Notification.requestPermission()` before awaiting SW register, or you may
   lose the user-gesture requirement on some Chrome versions.
3. Timestamps come from parsing island `ics` `DTSTART` (UTC), NOT from a new island
   field -- adding a field is out of boundary.
4. `setTimeout` is best-effort/foreground; message must not promise closed-tab
   reminders. Notification Triggers is a discontinued API -- do not build a live
   path expecting it to work.
5. Guard `delay > 0 && delay <= 2147483647`; clear prior timers on re-invoke.
