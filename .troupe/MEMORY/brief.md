# Brief -- Cheffy module build (getting-cheffy branch)

State-of-the-world orienting doc for the Director. Source: RESEARCH/PLAN/BUILD/TEST jots for
all 9 parts, compressed and pruned after audit-pass at this Strike.

## DoD progress: 9/9 criteria done -- DoD COMPLETE

All nine CHEFFY-SYSTEM.md acceptance criteria are `done` in `state.json.dod_progress`
(reconciled this Strike): calendar-engine, mascot-state-machine, dialogue-panel,
calendar-actions, local-notifications, checklist-export-import, reduced-motion,
animated-readme-svg, pe-build-gate. All 45 queue jobs (research/plan/build/test/audit across
9 parts + bootstrap decompose) are `status: done`, 0 queued/active/blocked/failed. Nothing
left to arm on this DoD. `production_active` is left `true` in `state.json` -- flip is a
Director sign-off decision, not unilaterally taken by Strike; the next Director pass should
review and close out (PR proposal already flagged on CALLBOARD by the prior Strike).

## What shipped in part 7 (reduced-motion) -- closed this Strike

- CSS-only sweep, `Cheffy.astro`'s `<style>` block ONLY. Research (full-file reads +
  repo-wide grep) found the entire Cheffy motion surface is exactly one animation
  (`@keyframes cheffy-blink`, idle eye `transform: scaleY()`), already correctly gated by
  its own `@media (prefers-reduced-motion: no-preference)` block -- left byte-for-byte
  untouched. Everything else in the OBJECTIVE (dot pulse, processing spinner, panel
  open/close transition, dialogue/expression transitions, hover/focus transitions) does not
  exist in code -- those are all instant `display`/`hidden` state flips, nothing to
  neutralize.
- Added ONE defensive cross-cutting guard at the end of the `<style>` block: `@media
  (prefers-reduced-motion: reduce) { #cheffy, #cheffy * { animation-duration: 0.01ms
  !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms
  !important; } }` -- "reduce, not remove" pattern (state swaps stay functional, only
  motion stops), scoped to `#cheffy` so it never reaches the rest of the page.
  `CheffyPanel.astro` untouched (no `<style>` block, no motion). `Layout.astro` untouched
  (that's part 9). Audit-passed, build-verified.

## What shipped in part 9 (pe-build-gate) -- closed this Strike, DoD-closing part

- Exactly two lines added to `src/layouts/Layout.astro`: the `Cheffy` import grouped with
  the existing frontmatter imports, and `<Cheffy />` placed as the last child of `<body>`
  (root level, sibling of `<slot />`, not nested in page content) -- one mount per page via
  the shared Layout. Bare `<Cheffy />` is correct: all three component props
  (`enabled`/`corner`/`filename`) are optional with working defaults, no prop threading
  needed from Layout.
- `npm run build` (`astro check && astro build`) confirmed clean: 0 errors/0 warnings/0
  hints across 32 files checked, 28 pages built. Master-parity held -- the mount is inert
  without JS, no existing markup restyled (Cheffy's CSS is fully scoped to
  `.cheffy-*`/`#cheffy`), no `<head>` changes.
- This was the final DoD-closing action -- all 9 CHEFFY-SYSTEM.md criteria now `done`.

## What shipped earlier (parts 1-6, 8) -- summary retained from prior Strikes

- **Part 1 (calendar-engine)**: `src/utils/cheffyCalendar.ts` -- pure, zero-relative-import,
  markdown-lexing time extraction (`extractCookingEvents`), hand-rolled RFC 5545 ICS builder
  (`buildIcs`, add-all + per-recipe mini via the same fn), Google Calendar template URL
  (`googleCalendarUrl`), `deriveWeekStart` helper. No new deps beyond `marked` (already a
  runtime dep).
- **Part 2 (mascot-state-machine)**: `src/components/Cheffy.astro` -- corner chef-hat SVG
  with CSS-driven expression swaps, explicit `idle/attention/dialogue/processing` state
  machine on `#cheffy[data-state]` (`processing` a documented no-op hook for later parts),
  `visitedWeeks` localStorage keyed off `deriveWeekId` (reuses `GroceryList.astro`'s exact
  slug rule). Pure helper `src/utils/cheffyState.ts` for weekId/visitedWeeks logic.
- **Part 3 (dialogue-panel)**: `src/utils/cheffyDialogue.ts` (pure tree-traversal/search
  helpers) + `src/data/cheffy-dialogue.json` (authored tree, no dangling gotos) +
  `CheffyPanel.astro` became the client runtime (build-time archive index island, node
  rendering, goto nav, free-text search, and the `window.registerCheffyAction` dispatch
  registry seam that parts 4-6 plug into without reworking the panel).
- **Part 4 (calendar-actions)**: `src/utils/cheffyCalendarActions.ts` (new, 102 lines) wires
  the part-1 engine into `generate-ics` (add-all download, per-recipe mini export, Google
  Calendar link) via the registry seam. Per-week `CookingEvent` data reaches it via a
  build-time data island on each page.
- **Part 5 (local-notifications)**: `src/utils/cheffyNotifications.ts` registers
  `trigger-permission` (self-contained, does NOT import `cheffyCalendar.ts` which uses
  `Buffer`); parses `DTSTART` directly from the existing `#cheffy-week-ics` island rather
  than adding a new island field. Feature-detects Notification Triggers (found effectively
  dead in target browsers) with a `setTimeout` fallback, clean no-op on unsupported/denied,
  whole handler try/catch-wrapped. `public/sw.js` gained a real `notificationclick`
  (focus-existing-tab via `clients.matchAll`, fallback `clients.openWindow`).
- **Part 6 (checklist-export-import)**: `src/utils/cheffyChecklist.ts` registers
  `export-checklist` (JSON + Markdown Blob downloads) and `import-checklist`
  (paste-based, merge/overwrite), reproducing `GroceryList.astro`'s exact localStorage
  contract (key `grocery-list-${slugifyWeekTitle}`, `Set` of
  `${category}::${index}::${item}` strings). Import UI is a dynamically-appended
  textarea + buttons (not wired through the dialogue's `input:true` node) to avoid editing
  `CheffyPanel.astro`.
- **Part 8 (animated-readme-svg)**: `src/assets/cheffy-animated.svg` -- 60-line SMIL demo
  loop reusing part 2's expression groups, 8 `<animate>` on `opacity`/`ry` only (no external
  refs), embedded in `README.md` line 11. Fully decoupled from the rest of Cheffy -- no
  site-behavior/build-gate impact.

All parts audit-passed and build-verified (`npm run build` clean throughout); no committed
test framework in this repo by design -- TEST rungs used ephemeral, uncommitted Node
verification scripts, with `npm run build` as the durable pass/fail gate per
CHEFFY-SYSTEM.md's acceptance bar.

## Open items for the Producer / next Director pass

- **DOM smoke-test harness (happy-dom/Playwright) for the interactive panel** -- raised by a
  prior Strike, still unanswered by the Producer. The window it was raised for (more
  handlers stacking onto the panel) is now closed since the DoD is complete; a "yes" today
  would open a separate post-DoD test-infra follow-up, not a gate on shipping. Still on
  CALLBOARD as a `gate` entry pending a reply -- not pruned (unresolved, Strike does not
  unilaterally resolve Producer gates).
- **PR proposal**: DoD is complete; the next Director pass should review the 9/9 sign-off
  and decide on `production_active` + PR out of `getting-cheffy`.
- No `.troupe/metrics.jsonl` telemetry file has ever existed on this project --
  `state.json.aggregates` remain at zero across every Strike; nothing to recompute.

## Process notes

- DoD was decomposed into 9 hexagonal parts (1 per criterion), armed serially via
  `next_assignment.json`, audited individually. `pe-build-gate` (part 9) was correctly
  sequenced LAST, after `reduced-motion` (part 7), per the process constraint carried
  through every prior brief.
- Working tree at this Strike: `.troupe/queue.json` (job-status writes from the p7/p9
  rungs) plus `src/data/lunch-history.json`/`src/data/lunch-week.json` (unrelated, routine
  weekly-content-generator churn, not Cheffy) are the only diffs against the last commit.

## 2026-07-01 -- /troupe walkthrough (trust=auto) finding + fix

Walkthrough verified the Cheffy DoD with the build gate + 3 cold isolated auditors.
Result: 8/9 criteria genuinely done as recorded; **calendar-actions (part 4) was NOT
truly done** despite its `done` mark.

- Defect: `Cheffy.astro` gates calendar-island build on `if (filename)`, but `<Cheffy />`
  was mounted in `Layout.astro` with no props and no page threaded `filename`. So the ICS
  island was empty on every page and `generate-ics`/`-meal`/`open-google-calendar` no-op'd
  in production. Build stayed green because Cheffy degrades silently -- why the gate missed it.
- Fix (this pass, verified against built HTML): added `cheffyFilename` prop to `Layout.astro`,
  passed to `<Cheffy filename={...} />`; threaded `FOOD-OF-THE-WEEK.md` (index), `WEEKEND.md`
  (weekend), and `filename` (archive/[slug]). lunch/fancai correctly omit it. `dist/index.html`,
  `dist/weekend`, `dist/archive/*` now each emit one real `BEGIN:VCALENDAR` island; lunch/fancai
  emit zero. `npm run build` still 0/0/0, 28 pages, exit 0. DoD now truly 9/9.
- Also corrected the stale "STUB / not mounted" header comment in `Cheffy.astro`.
- Walkthrough written to `docs/walkthroughs/cheffy-module.md`.

Process note: this is the "don't trust the builder" catch working as intended -- a criterion
marked `done` that passed the build but was dead end-to-end, surfaced only by cold audit.
