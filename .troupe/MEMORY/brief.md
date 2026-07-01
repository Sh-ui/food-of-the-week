# Brief -- Cheffy module build (getting-cheffy branch)

State-of-the-world orienting doc for the Director. Source: RESEARCH/PLAN/BUILD/TEST jots for
parts 1-3/9, compressed and pruned after audit-pass at this Strike.

## DoD progress: 3/9 criteria done

- **DONE -- calendar-engine**: `src/utils/cheffyCalendar.ts` (audit-passed, build-verified).
- **DONE -- mascot-state-machine**: `src/components/Cheffy.astro` (audit-passed, build-verified).
- **DONE -- dialogue-panel**: `src/components/CheffyPanel.astro` runtime + `src/data/cheffy-dialogue.json`
  authored tree + `src/utils/cheffyDialogue.ts` (audit-passed, build-verified).
- 6 remaining, all `pending`: calendar-actions, local-notifications,
  checklist-export-import, reduced-motion, animated-readme-svg, pe-build-gate (final
  wiring + `npm run build` gate -- do this last).

## What shipped in part 1 (calendar-engine)

`src/utils/cheffyCalendar.ts` implements, pure/dependency-free (only `marked`, already a
runtime dep -- no new deps, no test framework):

- `extractCookingEvents(markdown: string, weekStart: Date): CookingEvent[]` -- self-contained
  markdown lexing via `marked.lexer()` (does NOT import `weekParser.ts` -- a local `slugify` is
  inlined instead, specifically so the file has zero relative imports and can be `import`ed
  directly by Node's native TS-stripping runtime in a no-framework test script). Walks H2 meals
  (skips first H2 = grocery list), scans the H6 quickRead line first, then prose, then a
  "dinner time" semantic fallback, for clock times. Bare `H:MM` with no AM/PM defaults to PM
  (dinner-prep app convention).
- `buildIcs(events: CookingEvent[]): string` -- hand-rolled RFC 5545 VCALENDAR/VEVENT, CRLF line
  endings, 75-octet line folding, text escaping, UTC `Z` datetimes only (no VTIMEZONE/TZID).
  Works for both add-all (whole list) and per-recipe mini export (single-event array) via the
  same function.
- `googleCalendarUrl(event: CookingEvent): string` -- `calendar.google.com/calendar/render`
  template URL, shares the same `toIcsUtc()` formatter as `buildIcs` (single source of truth for
  date formatting).
- `deriveWeekStart(markdown, filename?): Date | null` -- exported pure helper (beyond the 3
  stubbed exports), title-first then archive-filename-prefix fallback. Needed by the
  calendar-actions part that wires this into the pages.

## What shipped in part 2 (mascot-state-machine)

`src/components/Cheffy.astro` replaces the stub with:

- A real corner chef-hat SVG mascot with NAMED eye/mouth/notification-dot parts, using brand
  color tokens; expressions swap purely via CSS keyed on `data-state`/`data-expression`.
- The explicit state machine -- exactly one of `idle`, `attention`, `dialogue`, `processing` on
  `#cheffy[data-state]`. `processing` is a documented no-op hook for later parts
  (calendar-actions, local-notifications) to flip -- part 2 does not trigger it itself.
- `visitedWeeks` localStorage logic keyed off `deriveWeekId`, which reuses the SAME slug rule as
  `GroceryList.astro` (page H1 lowercased, spaces to hyphens) -- no parallel week-identity
  namespace introduced. First sight of a new week enters `attention` + notification dot; opening
  or dismissing the panel marks the week visited and returns to `idle`.
- Toggle button opens/closes `#cheffy-panel` (sets `aria-expanded`, toggles `hidden`) = the
  `dialogue` state -- this is ONLY visibility wiring; the dialogue node tree/nav/search
  (part 3, dialogue-panel) is untouched.
- Pure helper `src/utils/cheffyState.ts` (zero relative imports, same pattern as part 1) exports
  `deriveWeekId` + the `visitedWeeks` decision helpers, verified by an ephemeral Node script
  against a real week H1.
- `prefers-reduced-motion` disables idle motion with no layout shift.
- Confirmed intact: `Cheffy` is still NOT mounted in `Layout.astro` (deferred to the final
  pe-build-gate part) -- site behaves exactly like master.

Both parts verified via ephemeral (uncommitted) Node scripts, not a committed test framework --
`npm run build` remains the only durable gate per the DoD's acceptance bar.

## What shipped in part 3 (dialogue-panel)

- `src/utils/cheffyDialogue.ts` -- NEW pure, zero-relative-import util (mirrors
  `cheffyState.ts`/`cheffyCalendar.ts`): `getNode`, `findDanglingGotos`, `usedActions`,
  `matchArchive`, `bestArchiveMatch`, plus the 5-value `VALID_ACTIONS` const
  (`generate-ics`/`trigger-permission`/`navigate-to-archive`/`export-checklist`/`close`).
  Verified by an ephemeral Node TEST script (dangling-goto check, action-coverage check,
  search-match fixtures).
- `src/data/cheffy-dialogue.json` -- fleshed into the real authored tree (root -> calendar/
  notifications/checklist/search/close), no dangling goto ids; expressions limited to
  `neutral|excited|thinking` only (the SVG has no `sleepy` group).
- `src/components/CheffyPanel.astro` -- became the client-side dialogue RUNTIME: build-time
  archive index (reuses `parseWeekPlan`, same pattern as `archive/[slug].astro`, slug =
  filename stem not a re-slugified title) inlined as a JSON data island; a bundled `<script>`
  does node rendering/goto navigation, free-text search -> `navigate-to-archive`, and an
  idempotent `window.cheffyActions` / `window.registerCheffyAction` dispatch registry with a
  graceful "coming soon" default -- this is the documented seam parts 4/5/6 (calendar-actions,
  local-notifications, checklist-export-import) plug their handlers into WITHOUT reworking the
  panel. This part registers only the two pure-navigation actions it owns: `close` (reuses the
  part-2 toggle/closePanel path) and `navigate-to-archive`.
- `src/components/Cheffy.astro` -- CSS-only additive edit: a `data-expr-override` style block
  so the dialogue runtime can drive per-node mascot expression without touching part-2 JS or
  the `idle/attention/dialogue/processing` state machine itself.
- Part-2 open/close/state behavior confirmed unchanged; `Cheffy` still NOT mounted in
  `Layout.astro` (deferred to the final pe-build-gate part).

## Open decision surfaced for the Producer (unresolved, see CALLBOARD)

- Whether to add a light DOM smoke-test harness (happy-dom/Playwright) now that the panel has
  real interactive nav/search/action-dispatch logic with only `astro check` + manual audit
  coverage, before parts 4-6 stack more handlers on it. Not yet answered -- do not duplicate
  this decision elsewhere; it lives on the CALLBOARD until the Producer replies.

## Open GAPs/decisions surfaced for later parts (not blocking, but relevant)

- **cheffyCalendar signature kept as raw markdown + Date**, not the parsed `ContentSection[]`
  research floated -- the calendar-actions wiring part must `fs.readFileSync` the same file each
  page already passes to `parseWeekPlan(filename)` and call
  `extractCookingEvents(raw, deriveWeekStart(raw, filename) ?? <fallback>)`. Call sites:
  `src/pages/index.astro` (default `FOOD-OF-THE-WEEK.md`), `src/pages/weekend.astro`
  (`WEEKEND.md`), `src/pages/archive/[slug].astro` (`filename` prop).
- No timezone data exists anywhere in source content -- all clock times assumed local
  build/runtime timezone (accepted as fine for a single-household app).
- One archive file (`archive/20250105-bison-chicken-sausage.md`) has a filename/H1-title year
  mismatch; `deriveWeekStart` resolves title-wins per that file's likely-correct authored intent.
- VALARM reminders and DESCRIPTION fields are optional nice-to-haves, not built -- only relevant
  if local-notifications or calendar-actions parts want a "before" reminder later.
- `processing` state on `#cheffy` is a live hook, unused so far -- calendar-actions and
  local-notifications are the expected next consumers.
- `cheffyState.ts` (weekId + visitedWeeks helpers), `cheffyCalendar.ts` (time/ICS helpers), and
  now `cheffyDialogue.ts` (tree traversal + search) are the three pure, zero-relative-import
  utils established so far; later parts should follow the same seam pattern (importable,
  no-framework-testable) where practical.
- **The action-dispatch registry is the real integration seam for parts 4/5/6**: register a
  handler via `window.registerCheffyAction(name, fn)` where `name` is one of
  `generate-ics`/`trigger-permission`/`export-checklist`; the handler receives
  `{ root, panel, dialogue, nodeId, index, slug?, query?, setState, renderNode, close }`. Do NOT
  rework `CheffyPanel.astro` to add these -- register from each part's own new/existing file
  (e.g. `cheffyCalendar.ts` or a small init script) so the panel stays untouched by parts 4-6.
  Errors thrown inside a registered handler are caught and logged, never crash the panel.

## Process notes

- DoD is decomposed into 9 hexagonal parts (1 per criterion), armed one at a time via
  `next_assignment.json`; this Strike closes part 3 (dialogue-panel). Director re-arms next --
  any of calendar-actions / local-notifications / checklist-export-import can now register
  against the part-3 action-dispatch seam; reduced-motion, animated-readme-svg, and
  pe-build-gate remain independent of that seam.
- No test framework in this repo by design -- TEST rungs use ephemeral throwaway verification
  scripts (scratchpad/Node, not committed, not vitest/jest), with `npm run build` as the durable
  pass/fail gate per CHEFFY-SYSTEM.md's acceptance bar.
- No `.troupe/metrics.jsonl` telemetry file exists yet -- `state.json.aggregates` remain at zero;
  nothing to recompute this Strike.
