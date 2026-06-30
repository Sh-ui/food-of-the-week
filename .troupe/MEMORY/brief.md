# Brief -- Cheffy module build (getting-cheffy branch)

State-of-the-world orienting doc for the Director. Source: RESEARCH/PLAN/BUILD/TEST jots for
part 1/9, compressed and pruned after audit-pass at this Strike.

## DoD progress: 1/9 criteria done

- **DONE -- calendar-engine**: `src/utils/cheffyCalendar.ts` (audit-passed, build-verified).
- 8 remaining, all `pending`: mascot-state-machine, dialogue-panel, calendar-actions,
  local-notifications, checklist-export-import, reduced-motion, animated-readme-svg,
  pe-build-gate (final wiring + `npm run build` gate -- do this last).

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
  endings (the original stub's bug -- bare `\n` -- is fixed), 75-octet line folding, text
  escaping, UTC `Z` datetimes only (no VTIMEZONE/TZID). Works for both add-all (whole list) and
  per-recipe mini export (single-event array) via the same function.
- `googleCalendarUrl(event: CookingEvent): string` -- `calendar.google.com/calendar/render`
  template URL, shares the same `toIcsUtc()` formatter as `buildIcs` (single source of truth for
  date formatting).
- `deriveWeekStart(markdown, filename?): Date | null` -- exported pure helper (beyond the 3
  stubbed exports), title-first then archive-filename-prefix fallback. Needed by the next part
  (calendar-actions) that wires this into the pages.

Verified via an ephemeral (uncommitted) Node script against real `FOOD-OF-THE-WEEK.md` content --
all structural ICS/URL/escaping/event-extraction assertions passed. No test framework was added,
per the DoD's "no console errors / build passes" bar -- `npm run build` is the only durable gate.

## Open GAPs/decisions surfaced for later parts (not blocking, but relevant)

- **Signature kept as raw markdown + Date**, not the parsed `ContentSection[]` research floated --
  the calendar-actions wiring part must `fs.readFileSync` the same file each page already passes
  to `parseWeekPlan(filename)` and call `extractCookingEvents(raw, deriveWeekStart(raw, filename) ?? <fallback>)`.
  Call sites: `src/pages/index.astro` (default `FOOD-OF-THE-WEEK.md`), `src/pages/weekend.astro`
  (`WEEKEND.md`), `src/pages/archive/[slug].astro` (`filename` prop).
- No timezone data exists anywhere in source content -- all clock times assumed local
  build/runtime timezone (accepted as fine for a single-household app).
- One archive file (`archive/20250105-bison-chicken-sausage.md`) has a filename/H1-title year
  mismatch; `deriveWeekStart` resolves title-wins per that file's likely-correct authored intent.
- VALARM reminders and DESCRIPTION fields are optional nice-to-haves, not built -- only relevant
  if local-notifications or calendar-actions parts want a "before" reminder later.

## Process notes

- DoD is decomposed into 9 hexagonal parts (1 per criterion), armed one at a time via
  `next_assignment.json`; this Strike closes part 1. Director re-arms part 2 (mascot-state-machine)
  next.
- No test framework in this repo by design -- TEST rungs use ephemeral throwaway verification
  scripts (scratchpad/Node, not committed, not vitest/jest), with `npm run build` as the durable
  pass/fail gate per CHEFFY-SYSTEM.md's acceptance bar.
