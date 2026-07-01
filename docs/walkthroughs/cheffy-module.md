# Cheffy module -- verified walkthrough

**Verified 9/9 | DoD status: all 9 criteria met (calendar-actions defect found in this
walkthrough and fixed + re-verified this pass)**

Branch: `getting-cheffy`.
Verification: `npm run build` run to completion (exit 0) + 3 cold, isolated read-only
auditors (worktree `troupe-sonnet`) fanned across the load-bearing criteria. Depth = auto.
The auditors caught calendar-actions as dead-in-production (see criterion 4); it was fixed
during reconcile and the fix verified against the built HTML.

---

## Executive summary (Producer terms)

Cheffy ("Chef-E") is a corner chef-hat mascot for the Food of the Week site. It is a
**progressive-enhancement layer**: with its JavaScript disabled the site builds and behaves
exactly like `master`. The build is clean (`astro check`: 0 errors / 0 warnings / 0 hints;
`astro build`: 28 pages, exit 0), and 8 of the 9 acceptance criteria are real and verified
against the actual files.

**One criterion was not truly done when this walkthrough started** and is now fixed. The
calendar *engine* (ICS generation, time extraction, Google Calendar links) was real and
correct in isolation, but it was **never fed data in the running site** -- so "add to
calendar" silently produced nothing on every page. The build still passed because Cheffy
degrades quietly by design, which is exactly why the "9/9 done" state did not catch it. The
fix (threading each cooking-week page's Markdown path into `<Cheffy />`) landed during
reconcile and is verified below.

---

## How it works (architecture)

Cheffy is a single Astro island mounted once, site-wide, in `src/layouts/Layout.astro:35`
(`<Cheffy />`). It is composed of:

- **`Cheffy.astro`** -- the corner SVG mascot + state-machine host. Renders the hat, wires a
  4-state machine, and (when given a `filename`) builds a **build-time calendar data island**
  that the client reads.
- **`CheffyPanel.astro`** -- the dialogue panel: consumes `cheffy-dialogue.json`, renders
  nodes, handles `goto` navigation + free-text archive search, and dispatches actions via a
  `window.cheffyActions` registry.
- **`cheffy-dialogue.json`** -- the data-driven conversation tree (5 nodes: root, calendar,
  notifications, checklist, search).
- **`src/utils/` modules** -- `cheffyState.ts` (pure state helpers), `cheffyCalendar.ts`
  (UI-independent ICS/Google engine), `cheffyCalendarActions.ts`, `cheffyChecklist.ts`,
  `cheffyNotifications.ts`, `cheffyDialogue.ts`. Handlers register themselves as module
  side-effects imported by `Cheffy.astro`.
- **`public/sw.js`** -- service worker for opt-in local reminders.
- **`cheffy-animated.svg`** -- SMIL demo loop embedded in `README.md`.

The whole system is keyed off the existing per-week `localStorage` id (`visitedWeeks`), and
reuses site conventions (GroceryList's storage key, `parseWeekPlan`/`weekParser.ts`).

---

## Criterion-by-criterion (the receipts)

Every "VERIFIED" line below was independently confirmed by a cold auditor that did not build
the code, with a file:line citation.

### 1. calendar-engine -- VERIFIED
`cheffyCalendar.ts` extracts meal times from week Markdown via `marked.lexer` with a layered
fallback chain (structured override -> headline clock -> prose clock -> dinner default,
`cheffyCalendar.ts:190-288`). ICS output is RFC 5545-correct: full VCALENDAR/VEVENT scaffold,
per-event `UID`/`DTSTAMP`/`DTSTART`/`DTEND`, CRLF joins, and 75-octet line folding
(`:304-323`). Google Calendar template URL is correct format (`:334-342`). Module is
UI-independent (only imports `marked`). No stubs.

### 2. mascot-state-machine -- VERIFIED
Real 4-state machine `setState('idle'|'attention'|'dialogue'|'processing')`
(`Cheffy.astro:217-219`), transitions wired to real events (first paint, panel open/close,
processing seam at `:249`). Expression states are real SVG element toggles via CSS attribute
selectors (`:132-169`). Keyed off `localStorage` `visitedWeeks` (`:191-203`) with pure
helpers in `cheffyState.ts:20-35`.

### 3. dialogue-panel -- VERIFIED
`cheffy-dialogue.json` is a real node tree with `goto` + action options. `CheffyPanel.astro`
consumes it, navigates via `goto` (`:220-221`), implements the free-text search node against a
build-time archive index reusing the site's `parseWeekPlan` (`:23-36`, `:175-193`), and
dispatches actions through `window.cheffyActions` with a non-throwing "coming soon" fallback
(`:142-153`). SSR-safe: panel starts `hidden`, no broken server-rendered state with JS off.

### 4. calendar-actions -- VERIFIED (defect found + fixed this pass)
The panel wiring was always real: dialogue options `generate-ics` / `generate-ics-meal` /
`open-google-calendar` (`cheffy-dialogue.json:26-28`) dispatch to handlers registered in
`cheffyCalendarActions.ts` (Blob/anchor downloads + `window.open` for Google).

**Defect found:** `Cheffy.astro:40` gates all calendar-island construction on `if (filename)`,
and no page passed `filename` to `<Cheffy />` (`Layout.astro` mounted it with zero props). So
`calendarIsland` was always empty and the three calendar actions no-op'd on every page.
Silent by design -> the build gate never caught it.

**Fix (this pass):** added a `cheffyFilename` prop to `Layout.astro`, passed into
`<Cheffy filename={cheffyFilename} />`, and threaded each cooking-week page's Markdown source:
`index.astro` -> `FOOD-OF-THE-WEEK.md`, `weekend.astro` -> `WEEKEND.md`,
`archive/[slug].astro` -> its `filename`. `lunch`/`fancai` intentionally omit it (no cooking
week) and cleanly stay empty.

**Verified against built HTML** after rebuild: `dist/index.html`, `dist/weekend/index.html`,
and a sampled `dist/archive/*/index.html` each contain exactly one real `BEGIN:VCALENDAR`
island; `dist/lunch` and `dist/fancai` correctly contain zero. A real prefilled Google URL is
emitted, e.g. `...render?action=TEMPLATE&text=Fennel%20Pasta%20--%205%3A30%20noodle%20water&dates=20260629T213000Z/20260629T214200Z`.

### 5. local-notifications -- VERIFIED
`sw.js` is a real service worker (install/activate/notificationclick). Permission requested
**only** inside the `trigger-permission` action handler
(`cheffyNotifications.ts:72-92`), which fires **only** from a dialogue button click
(`CheffyPanel.astro:215-224`) -- never on page load. Guarded by a feature-check
(`'Notification' in window && 'serviceWorker' in navigator`, `:58`); degrades cleanly.

### 6. checklist-export-import -- VERIFIED
Real JSON + Markdown serializers (`cheffyChecklist.ts:95-113`), import parser with JSON-first
then Markdown-checkbox fallback (`:121-146`), `merge`/`overwrite` modes (`:236-256`). Reuses
GroceryList's exact storage contract: `grocery-list-${slug}` key is byte-identical between
`cheffyChecklist.ts:28-30` and `GroceryList.astro:49`.

### 7. reduced-motion -- VERIFIED
Real `@media (prefers-reduced-motion: reduce)` block neutralizing animation/transition
durations (`Cheffy.astro:177-184`), plus a `no-preference` gate wrapping the blink keyframes
(`:150-156`). No display/opacity removal -> no layout shift.

### 8. animated-readme-svg -- VERIFIED
`cheffy-animated.svg` contains real SMIL (`<animate>` on opacity/ry, `repeatCount="indefinite"`).
Embedded in `README.md:10-14` with fixed width/height (no layout shift).

### 9. pe-build-gate -- VERIFIED (build) / as-reported (console-clean)
`npm run build` run to completion: `astro check` 0/0/0, `astro build` 28 pages, exit 0. Cheffy
client chunks actually emitted (`cheffyState`, `Cheffy` x2, `CheffyPanel`). `<Cheffy />` mounted
at `Layout.astro:35`. Master-parity-with-JS-off holds. "No console errors on any page" is taken
as reported (not browser-verified this pass); the calendar gap degrades silently, so it does not
throw.

---

## The proof (tally)

- **Ledger:** criteria 9, verified 9, partial 0, unverified 0 (calendar-actions verified after
  the in-pass fix; 8/9 before it).
- **Build:** `npm run build` exit 0; `astro check` 0 errors/0 warnings/0 hints; 28 pages.
- **Auditors:** 3 cold isolated `troupe-sonnet` worktree auditors, all criteria cited to
  file:line; the calendar defect was falsified independently and re-confirmed by hand.
- **Files changed:** 24 commits, 3955 insertions vs `master`. Cheffy source: `Cheffy.astro`
  (278), `CheffyPanel.astro` (252), `cheffyCalendar.ts` (342), `cheffyChecklist.ts` (281),
  `cheffyNotifications.ts` (162), `cheffyCalendarActions.ts` (102), `cheffyDialogue.ts` (78),
  `cheffy-dialogue.json` (58), `cheffyState.ts` (35), `sw.js` (31), `cheffy-animated.svg` (60).

---

## Risks / tech-debt

1. **[RESOLVED this pass] `filename` never threaded to `<Cheffy />`.** Fixed by adding the
   `cheffyFilename` Layout prop and threading it from the three cooking-week pages; verified
   against built HTML. No longer outstanding.
2. **Stale in-file docs.** `Cheffy.astro:2-7` "STUB / SCAFFOLD / not mounted" header corrected
   this pass. `TODOS.md` phase 3/4 boxes are still unchecked despite the code shipping --
   cosmetic bookkeeping drift, not carried forward as a blocker.
3. **`VALID_ACTIONS` stale** (`cheffyDialogue.ts:15`) -- missing `generate-ics-meal`,
   `open-google-calendar`, `import-checklist`; used only by a test-rung helper, not runtime.
4. **No automated tests** for Cheffy (no `*cheffy*.test.*`); `npm run build` is the only gate,
   by design. A DOM smoke harness is parked on the callboard as a post-ship follow-up.
5. **Dead-but-disclosed** Notification Triggers API branch (`cheffyNotifications.ts:126-140`) --
   honestly commented as inert on current browsers.
