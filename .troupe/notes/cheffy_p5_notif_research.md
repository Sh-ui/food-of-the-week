# cheffy_p5_notif_research -- findings

JOB_ID: cheffy_p5_notif_research
LEASE_OWNER: stage-manager-20260701T113718Z-pid28325

## (a) Browser flow -- confirmed, standard, still current

1. `navigator.serviceWorker.register('/sw.js')` -- registers `public/sw.js` (already
   scaffolded, stub). Standard SW registration; MDN confirms API unchanged.
2. `Notification.requestPermission()` -- must be called from a user gesture (the
   `trigger-permission` dialogue button click satisfies this). Returns a Promise
   resolving `'granted' | 'denied' | 'default'`. No changes vs. training-era docs.
3. `ServiceWorkerRegistration.showNotification(title, options)` -- called on the
   *registration* object (`await navigator.serviceWorker.ready` or the object
   returned by `register()`), not on `new Notification()`, because the latter is
   unsupported inside a service worker and the point here is a notification that
   can fire from the SW context. This is the only viable path for anything beyond
   "immediate, foreground-only" notifications.

Source: MDN `ServiceWorkerRegistration.showNotification()`.

## (b) Notification Triggers API (TimestampTrigger / showTrigger) -- DEAD, do not build on it

**Confirmed via Chrome for Developers' own docs (developer.chrome.com/docs/web-platform/notification-triggers), fetched live:**

> "The development of Notification Triggers API, part of Google's capabilities
> project, has ended. It wasn't clear that we could provide consistent and
> reliable experiences across platforms."

- Only Chrome ever had an *experimental* implementation, gated behind an **origin
  trial** (originally slated through Chrome 83, Feb 2020). It never shipped as a
  standard, unflagged feature in any browser -- not desktop Chrome, not Chrome for
  Android, not any other engine.
- The origin trial has concluded; **no new production trial tokens are issued**.
  Without a valid token (which a public site like this cannot obtain today), the
  feature is either absent (`'showTrigger' in Notification.prototype` -> `false`)
  or present-but-inert/throwing depending on Chrome version/flag state.
- Even during the trial, Chrome's own docs noted a platform inconsistency that
  contributed to killing the project: "On desktop, notification triggers fire
  only if Chrome is running. On Android, they fire regardless." -- i.e. it was
  never a reliable "closed-tab, closed-app" scheduler even where it worked.
- **GAP (resolved by this research, not an assumption):** treat Notification
  Triggers as permanently unavailable for this build on real Chrome/Pixel today.
  Do not gate a "real" code path behind it expecting it to activate later --
  build the feature-detect as a hard `false` in current Chrome, but keep the
  branch because it costs nothing and self-heals if the field somehow reappears
  under a different name.

### Feature-detection shape (confirmed from Chrome's own docs, exact snippet)

```js
const triggersSupported = 'showTrigger' in Notification.prototype;
```

### If it were supported (kept only as a dead branch / future-proofing)

```js
registration.showNotification(title, {
  body,
  tag,
  showTrigger: new TimestampTrigger(timestampMs),
});
```

### Real fallback path for this app: setTimeout while the page is open

Given (b) above, the *only* mechanism that will actually fire on Android Chrome /
Pixel today is:

1. `Notification.requestPermission()` granted.
2. `setTimeout(() => registration.showNotification(...), msUntilCookTime)`,
   scheduled from the **page** (not the SW) while the tab/PWA is open.
3. Cap: `setTimeout` delays are throttled/clamped by the browser when the tab is
   backgrounded (Chrome's timer throttling in inactive tabs, and full suspension
   once the tab/process is killed) -- this is a **best-effort, page-must-stay-open**
   reminder, explicitly not a "close the tab and get notified later" guarantee.
   The CHEFFY-SYSTEM.md language ("Use the Notification Triggers / Alarm API
   where available ... Graceful degradation ... browsers without support get a
   clear 'not supported here' path") should be read in light of this: on today's
   real Chrome, "where available" is never true, so this degrades straight to
   the setTimeout fallback, not to the trigger path, for every real user.
4. On `notificationclick` (already stubbed in `sw.js`), close the notification and
   optionally focus/open the week -- unchanged, still correct.

### No-op path where unsupported

Guard, in order, before offering `trigger-permission` as a live action:

```js
const notifSupported = 'Notification' in window;
const swSupported = 'serviceWorker' in navigator;
if (!notifSupported || !swSupported) {
  // clean no-op: show "not supported here" text, no button/permission prompt
}
```

- `'Notification' in window` is false on iOS Safari (out of scope per OBJECTIVE,
  but the same guard is what naturally excludes it -- no iOS-specific branch
  needed, it just falls through this generic check).
- On Android Chrome / Pixel (the actual target): both `Notification` and
  `serviceWorker` exist, `Notification.requestPermission()` works from a user
  gesture, `showNotification` works. `showTrigger` feature-detects `false` (per
  (b)) so the code should always take the `setTimeout` branch there, never a
  "supported" trigger branch, on this target today.

### Degradation matrix

| Environment | `Notification` in window | `serviceWorker` in navigator | `showTrigger` in `Notification.prototype` | Path taken |
|---|---|---|---|---|
| Android Chrome / Pixel (target) | yes | yes | **no** (dead API, confirmed above) | `setTimeout` fallback, page must stay open |
| Desktop Chrome | yes | yes | no (same reason) | `setTimeout` fallback |
| Any browser missing `Notification` or SW (e.g. iOS Safari, very old browsers) | no / no | -- | -- | clean no-op: "not supported here" message, no button wired to a live handler |
| Hypothetical future browser that resurrects trigger support | yes | yes | yes | dead branch above fires (harmless, no code changes needed to benefit) |

## (c) Times-data source -- reuse the existing `#cheffy-week-ics` island, with one small addition

Confirmed by reading `src/components/Cheffy.astro` and
`src/utils/cheffyCalendarActions.ts`:

- The island is built at **Astro build time** (Node/SSR context, in
  `Cheffy.astro`'s frontmatter) from `extractCookingEvents()` /
  `src/utils/cheffyCalendar.ts`, and serialized into a
  `<script type="application/json" id="cheffy-week-ics">` data island via
  `set:html={JSON.stringify(calendarIsland)}`.
- Client code (`cheffyCalendarActions.ts`) reads it with
  `document.getElementById('cheffy-week-ics')` + `JSON.parse(el.textContent)`.
- **Exact shape currently on the page (`CalendarIsland` in
  `cheffyCalendarActions.ts`, matches `calendarIsland` in `Cheffy.astro`):**

```ts
interface CalendarIslandMeal {
  mealSlug: string;
  label: string;
  ics: string;       // full VEVENT block, RFC 5545 text
  googleUrl: string;  // Google Calendar template link
}
interface CalendarIsland {
  weekIcs: string;               // whole-week ICS (all events)
  weekGoogleUrl: string | null;
  meals: CalendarIslandMeal[];
}
```

- **Gap: no raw timestamp is exposed today.** The underlying
  `CookingEvent` (in `cheffyCalendar.ts`) does carry `start: Date` and
  `durationMinutes?: number`, but by the time it reaches the client island it has
  already been serialized into ICS text (`DTSTART:YYYYMMDDTHHMMSSZ` inside the
  `ics` string) and a Google Calendar URL. Neither is a convenient scheduling
  primitive for `setTimeout(fn, ms)` -- you'd have to regex-parse ICS `DTSTART`
  client-side to recover a timestamp.
- **Recommendation (reuse, with one small field added, not a parallel island):**
  add a `startIso: string` (or `startEpochMs: number`) field per meal (and
  optionally one for the week's first event) directly onto the *existing*
  `CalendarIslandMeal`/`CalendarIsland` shapes in `Cheffy.astro`'s island-building
  code, sourced straight from `events[i].start` (already a `Date`, already in
  scope right next to where `ics`/`googleUrl` are built -- zero new parsing, zero
  new data source). This keeps "one state store" / "no second source of truth"
  as CHEFFY-SYSTEM.md requires, and gives the notification handler a plain
  `new Date(startIso).getTime() - Date.now()` to feed `setTimeout`. No new
  island, no new build-time file read, no schema duplication.

## Seam confirmation -- registration pattern (already correct, reuse verbatim)

- `cheffyCalendarActions.ts` establishes the order-safe pattern:

```ts
const w = window as any;
const register =
  w.registerCheffyAction ||
  ((name: string, fn: (ctx: any) => void) => {
    w.cheffyActions = w.cheffyActions || {};
    w.cheffyActions[name] = fn;
  });
```

  This works regardless of whether `CheffyPanel`'s script (which defines
  `window.registerCheffyAction`) has run yet. A new
  `src/utils/cheffyNotificationActions.ts` should copy this exact block
  (not import it -- `cheffyCalendarActions.ts` explicitly avoids being an import
  target per its own header comment about staying dependency-free of
  `cheffyCalendar.ts`'s Node-only code; the same isolation logic applies here:
  keep the notifications action file self-contained) and register a single
  action: `register('trigger-permission', async (ctx) => { ... })`.
- **Mounting:** `Cheffy.astro` currently only wires calendar actions (grep found
  `// Registers the calendar-actions handlers` around line 245, one bundled
  `<script>` import). The Planner should append **one single bundled import
  line** for the new file (mirroring however the existing calendar-actions
  import line is written -- e.g. `import '../utils/cheffyCalendarActions'` /
  `import '../utils/cheffyCalendarActions.ts'` inside Cheffy.astro's own
  `<script>` block) so both actions co-register on page load, order-safe. Read
  the exact existing import line in `Cheffy.astro` around line 245 before
  writing the new one to match syntax precisely.
- **Dialogue tree:** confirmed in `src/data/cheffy-dialogue.json` -- the
  `notifications` node and `"action": "trigger-permission"` option **already
  exist** (added ahead of this feature). No dialogue JSON changes needed; only
  the action-handler implementation + SW logic + island field addition are new
  work.
- `public/sw.js` is a stub today: `install` (skipWaiting, no precache -- correct,
  static GH Pages site, progressive enhancement), `activate` (clients.claim),
  and an empty `notificationclick` handler (closes the notification, no
  focus/open-week logic yet). The real scheduling work (per (b) above) happens
  in the **page**, not the SW -- the SW's job is just to host `showNotification`
  (so notifications look like app notifications, not `new Notification()` calls)
  and to handle `notificationclick`.

## Deliverables summary for the Planner

1. **APIs to use:** `navigator.serviceWorker.register('/sw.js')` (already present),
   `Notification.requestPermission()` (call from the `trigger-permission` click
   handler), `registration.showNotification(title, options)` (via
   `navigator.serviceWorker.ready`), `setTimeout` for scheduling on today's
   Chrome/Pixel.
2. **Feature-detect exactly as:**
   ```js
   const notifSupported = 'Notification' in window && 'serviceWorker' in navigator;
   const triggersSupported = notifSupported && 'showTrigger' in Notification.prototype;
   ```
   `triggersSupported` will be `false` in real-world testing today (confirmed
   dead API) -- code should not assume it ever becomes true, but the branch
   costs nothing to keep.
3. **Degradation matrix:** see table above. Target (Android Chrome/Pixel) always
   takes the `setTimeout` branch; no-`Notification`/no-SW browsers get a clean
   "not supported here" message with no live handler wired.
4. **Times-data path:** reuse `#cheffy-week-ics`, add `startIso`/`startEpochMs`
   per meal (and week) at the point `calendarIsland` is built in `Cheffy.astro`'s
   frontmatter, sourced from the already-in-scope `CookingEvent.start`. Do not
   add a parallel data island.
5. **Registration seam:** new `src/utils/cheffyNotificationActions.ts`, copying
   the order-safe `register`/`window.registerCheffyAction` shim from
   `cheffyCalendarActions.ts` verbatim, registering `trigger-permission`; one new
   bundled `<script>` import line appended in `Cheffy.astro` next to the existing
   calendar-actions import. Dialogue node/action id already exist in
   `cheffy-dialogue.json` -- no changes there.

## Sources

- [Notification Triggers API | Web Platform | Chrome for Developers](https://developer.chrome.com/docs/web-platform/notification-triggers) -- fetched live; confirms development ended, origin-trial-only, feature-detect snippet, platform-inconsistency quote.
- [ServiceWorkerRegistration: showNotification() method - MDN](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification)
- [chromestatus.com feature entry for Notification Triggers](https://chromestatus.com/feature/5133150283890688)
