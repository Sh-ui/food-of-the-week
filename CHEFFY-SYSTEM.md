# Cheffy System

> Source of truth for the **Cheffy** corner assistant. Supersedes the
> `getting-cheffy` / `troupe/polish-*` branch spec (kept in git history).

Cheffy is an animated SVG chef-hat character in the corner of every page. Mostly
idle, he perks up on a new week, opens a speech-bubble dialogue on click, and
offers utilities built on the week's meal plan: calendar export (ICS / Google,
alarm included), weekly-synced local reminders (cook times + mom's lunches + a
re-sync nudge), grocery-checklist export/import, and in-panel archive
browsing/search.

**Progressive enhancement only.** The site works fully without him: with JS off
the mount stays `display:none` with zero layout impact.

## Architecture -- hexagonal units

Every unit is a discrete module with no knowledge of the others; `Cheffy.astro`
is the only adapter that binds them to the DOM. Swap or reuse any of them freely.

| Unit | Kind | Role |
|------|------|------|
| `src/utils/cheffyRig.ts` | pure code | Geometry. Flat numeric params -> SVG attrs (paths, transforms, lid clip polygons). No DOM. |
| `src/data/cheffy-poses.json` | **data** | Named expressions as partial param sets + aliases. Edit numbers, get new faces. |
| `src/utils/cheffyMotion.ts` | pure code | Generic spring engine + self-stopping rAF loop. Knows nothing about Cheffy. |
| `src/utils/cheffyBehavior.ts` | pure code | Ambient personality director: blink/glance/bounce/doze events on randomized timers per mode. |
| `src/data/cheffy-dialogue.json` | **data** | The dialogue tree: nodes, options, `goto`/`action`, per-node `expression`. |
| `src/data/cheffy-config.json` | **data** | Presentation: chip vs free-float, ink/chip colors, default corner + personality. |
| `src/utils/cheffyDialogue.ts` | pure code | Tree traversal, validation helpers, archive search, dynamic `#` node builders (browse/preview/results). |
| `src/utils/cheffyState.ts` | pure code | Week identity + visited-weeks helpers. |
| `src/utils/cheffySchedule.ts` | pure code | Week reminder schedule: cook times (ICS DTSTARTs) + daily lunches + the end-of-week re-sync nudge -> one sorted `ScheduledNotification[]`. |
| `src/utils/cheffyScheduleStore.ts` | adapter | IndexedDB persistence for the synced schedule (`cheffy-db`/`schedule`; constants duplicated in `public/sw.js` -- keep in lockstep). |
| `src/utils/cheffyCalendar.ts` | pure code (Node-only) | Markdown -> cooking events -> ICS (with VALARM) / Google URL. Never import client-side. |
| `src/utils/cheffyCalendarActions.ts` | adapter | Registers `generate-ics`, `generate-ics-meal`, `open-google-calendar` handlers. |
| `src/utils/cheffyNotifications.ts` | adapter | Registers `trigger-permission` (weekly sync), `notification-status`, `clear-reminders`. |
| `src/utils/cheffyChecklist.ts` | adapter | Registers `export-checklist`, `import-checklist`. |
| `src/components/Cheffy.astro` | adapter | Mounts the SVG rig; binds springs + behavior + state machine. |
| `src/components/CheffyPanel.astro` | adapter | Speech-bubble panel + dialogue runtime + action registry. |
| `src/components/CheffyStatic.astro` | adapter | SSR-only frozen pose render (gallery, docs art). |

### The two ports

1. **DOM attributes on `#cheffy`** -- the mascot's entire inbound interface:
   `data-state` (state machine) and `data-expr-override` (per-dialogue-node
   expression). The panel never imports mascot code; it sets attributes.
2. **`window.registerCheffyAction(name, fn)`** -- the action registry. Feature
   modules plug handlers in at module load; the panel dispatches option
   `action` values against it and falls back gracefully when unregistered.

## Visual rig

One persistent set of shapes, morphed by ~21 numeric params (see `RigParams`):

- **Hat**: the EXACT header icon (Tabler chef-hat path from
  StickyHeader.astro) scaled into rig space -- never redrawn. Static.
- **Brim**: ONE squared-off (butt-capped) stroke, always. Straight = sharp
  brim bar; bent = the same bar curving into a smile/frown mouth (end faces
  stay square); slid up = the icon's band (plain-icon mode). `brimDy`,
  `brimBend`, `brimLen`, `brimW`.
- **Eyes**: constant-size circles -- they NEVER scale or squash. All emotion
  is occlusion via lid clip polygons (`lidTop/Bot/Angle`: blink/wink bands,
  sleepy domes, scowl brows) or position (gaze `lookX/Y`; they hide *inside*
  the hat via `eyesDy` because they paint underneath it).
- **Figure**: whole-mascot `bob`, `tilt`, `squash` (anchored at bottom center)
  for bounces and squash-and-stretch.

Springs (`cheffyMotion`) tween every param; each pose picks a `motion` feel
(`soft`/`default`/`snappy`). `prefers-reduced-motion`: poses snap instantly,
ambience is disabled ("reduce, not remove" -- all states stay reachable).

### Editing expressions

Open `src/data/cheffy-poses.json`, tweak numbers or add a pose (any subset of
rig params), optionally alias it. Reference it from a dialogue node's
`expression`. Unknown names fall back to `neutral`. The `/cheffy-demo` gallery
shows every pose statically, plus live controls against the real instance.

## State machine

| State | When | Look |
|-------|------|------|
| `idle` | default | `neutral` (or `hidden` on dormant pages, `sleepy` when dozed off) |
| `attention` | first visit of a new week (never on dormant pages) | `excited` + accent dot, lively ambience |
| `dialogue` | panel open | `happy`, ambience paused, per-node `expression` overrides |
| `processing` | async action running | `thinking` |

Week identity: slugified `h1` -> `visitedWeeks` map in localStorage.

## Ambient personality

`cheffy-config.json` sets the default; Layout passes `cheffyPersonality` per
page (archives are `dormant`).

- **dormant** -- plain tucked hat; peeks (`happy`) on hover; no timers.
- **subtle** -- occasional blink, rare glance, dozes to `sleepy` after ~60s
  idle; wakes on scroll/pointer. Default everywhere.
- **lively** -- frequent blinks/glances + occasional bounce; auto-selected
  while in `attention`, reverts once the week is visited.

Eyes track the pointer within ~260px of the mascot in idle.

## Dialogue tree

`src/data/cheffy-dialogue.json` -- human-editable. Node shape:
`{ text, expression?, input?, options: [{ label, goto? | action? }] }`.
Valid `action` values live in `VALID_ACTIONS` (`cheffyDialogue.ts`) and must
have a registered handler: `generate-ics`, `generate-ics-meal`,
`open-google-calendar`, `trigger-permission`, `notification-status`,
`clear-reminders`, `navigate-to-archive`, `navigate-to-lunch`,
`export-checklist`, `import-checklist`, `close`.

### Dynamic nodes (`#` gotos)

A `goto` starting with `#` is resolved at runtime by `resolveDynamicNode()`
(`cheffyDialogue.ts`) instead of the static tree -- pure builders that turn the
build-time archive index into panel nodes:

- `#archive-browse:<page>` -- paginated newest-first week list
- `#archive-week:<slug>` -- one week's preview (title + meals + "Take me there")
- `#archive-results:<query>` -- ranked search hits (the `search` node's input
  routes here on Enter; title matches outrank meal-only matches)

Static and dynamic gotos point at each other freely; unresolvable refs land on
a graceful fallback node. `findDanglingGotos()` skips `#` refs.

Calendar actions need the page's week Markdown: pages pass `cheffyFilename`
to `Layout`, which threads it to the build-time calendar island. Pages without
it get cleanly no-op calendar handlers.

## Feature: Local reminders

The weekly sync model -- reminders are LOCAL (no push server; GitHub Pages is
static) and only ever know the currently-published week:

1. `Cheffy.astro` embeds two build-time islands: `#cheffy-week-ics` (cook
   times) and `#cheffy-lunch-week` (mom's 7 lunches from `lunch-week.json`).
2. "Sync this week's reminders" (`trigger-permission`) asks permission, then
   `cheffySchedule.ts` builds the flat schedule: every cook time, one lunch
   ping per day (`notifications.lunchTime` knob, default 11:00; drop them
   entirely with `notifications.lunchEnabled: false`), and a final
   "New week is up!" nudge on the first `syncReminder.dow`+`time` (default
   Sunday 09:00) strictly after everything else -- the loop that brings the
   user back to re-sync each week.
3. The schedule persists to IndexedDB (`cheffyScheduleStore.ts`);
   `public/sw.js` delivers due-unfired entries on ANY wake -- periodic
   background sync (`cheffy-schedule` tag, installed-PWA best-effort), SW
   activate, or a page poke -- with a 24h staleness window. An open tab keeps
   millisecond precision via setTimeout. Late-but-delivered beats never.
4. `manifest.webmanifest` + `public/icons/` make the site installable
   ("Add to Home Screen" materially improves closed-site delivery on Android).
5. The never-miss channel stays the calendar: exported ICS now carries a
   VALARM per event (`notifications.calendarAlarmMinutes` knob, default 15).

Knobs live in `cheffy-config.json` under `notifications`, fail-soft resolved
by `resolveNotificationConfig()`. Delivery honesty: `notification-status`
("What's coming up?") reads the store; `clear-reminders` wipes it.

## Dev surface

- `/cheffy-demo` -- static pose gallery + live pose/event/mode/state controls.
- `/cheffy-lab` -- anatomy tuning bench: reference sheet (public/cheffy-ref.png)
  vs live rig grid, every skeleton dimension on a knob (`window.lab` API);
  bake winning numbers into `ANATOMY`.
- `window.cheffy` -- debug seam: `setExpr`, `setState`, `blink`, `bounce`,
  `setMode`, `poses`, `_debug` (springs/paint/loop internals for tests).
  NOTE: rAF is suspended in hidden tabs; drive `_debug.springs.tick()` +
  `_debug.paint()` manually when screenshotting from automation.
