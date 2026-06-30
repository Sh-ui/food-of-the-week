# Cheffy System (`Cheffy` corner assistant)

> Spec / source of truth for the **Cheffy** module on the `getting-cheffy` branch.
> This is the more ambitious feature set deliberately kept off `master` (see the
> note at the bottom of `master`'s `TODOS.md`). The roadmap checklist lives in this
> branch's [`TODOS.md`](TODOS.md); the design contract lives here.

Cheffy is an animated SVG chef-hat character that lives in a corner of the Food of
the Week site. He is a friendly, mostly-idle mascot that comes to attention on a
new week, expands into a small dialogue panel on click, and offers a few genuinely
useful utilities built on top of the week's meal plan: add cooking times to your
calendar, opt into local cooking-time notifications, and export/import the grocery
and prep checklists.

Cheffy must be **progressive enhancement only**: the site works fully without him.
He is layered on top of the existing static Astro build (zero-JS by default), so if
his script fails or the browser is unsupported, nothing else breaks.

## Where he fits

- Rendered once from the base layout (`src/layouts/Layout.astro`), so he appears on
  every page (home, weekend, lunch, fancai, archive) unless a page opts out.
- He reads the already-parsed week data (the same source the page renders from --
  `weekParser.ts` output) so his calendar/notification times stay in sync with what
  is on screen. No second source of truth.
- Visual language matches the existing brand: the chef-hat already used in the
  sticky header, the palette in `tailwind.config.mjs`, the rounded-card look.

## Character and UI

A single SVG chef hat with a simple face. Expressions are driven by swapping a small
number of named parts (eyes + mouth), not by redrawing the whole hat.

- **Expressions:** neutral, excited, thinking, sleepy, plus a blink animation.
- **Mouth states:** neutral, smile, surprised, frown.
- **Notification dot:** a small badge on the hat when Cheffy has something new to
  say (e.g. first visit of a new week).
- **Placement:** fixed in a screen corner (bottom-right by default), above page
  content, below modals; click-to-expand into a small dialogue panel; click-out or
  a close action collapses it. Respects `prefers-reduced-motion` (no idle motion).

### Animated demo loop (for the README)

A standalone `src/assets/cheffy-animated.svg` using SMIL animations: blink -> look
left -> look right -> return to idle, with a 2-3 second pause before the loop
restarts. Used as the hero/marketing image in the README. This file is self-contained
(no external CSS/JS) so it animates inline on GitHub and on the page.

## State machine

Cheffy is a small explicit state machine. Exactly one state at a time.

| State | When | Look |
|-------|------|------|
| `idle` | Default. Nothing pending. | Neutral, occasional blink. |
| `attention` | First visit of a new week (week id not in `visitedWeeks`). | Excited expression + notification dot. |
| `dialogue` | Panel open, options visible. | Neutral/smile, panel expanded. |
| `processing` | An action is running (generating ICS, etc.). | Thinking expression. |

- Week identity comes from the current week id already used elsewhere in the app
  (the same key the grocery list uses for its per-week localStorage namespace).
- Track seen weeks in `localStorage` under `visitedWeeks[weekId]`. On first sight of
  a new week, enter `attention`; once the panel is opened (or dismissed) for that
  week, mark it visited and fall back to `idle`.

## Dialogue system

A small, data-driven dialogue tree -- **not** hard-coded UI. The tree is authored as
JSON (`src/data/cheffy-dialogue.json`) so copy and options can change without touching
component code.

- **Schema (stub in the data file):** nodes keyed by id; each node has display text,
  an expression to show, and a list of options. Each option has a label and either a
  `goto` (another node id) or an `action`.
- **Text input:** at least one node type accepts free text for search / navigation
  (e.g. jump to an archived week or a meal by name).
- **Action handlers** (the option `action` values the runtime must implement):
  - `generate-ics` -- build and download an ICS for the week's cooking times.
  - `trigger-permission` -- run the notification permission flow.
  - `navigate-to-archive` -- go to an archived week (uses the existing archive routes).
  - `export-checklist` -- export grocery/prep checklist state.
  - `close` -- collapse the panel back to idle.

## Feature: Calendar event sync

Turn the week's cooking/prep times into calendar events.

- **Time extraction from the Markdown** (the same content the site already parses):
  - clock times, e.g. `3:00 PM`, `5:30`
  - semantic times, e.g. "dinner time" -> a configurable default
  - durations, e.g. "30 minutes" -> event length
  - an optional structured `{time: ...}` annotation authors can drop in for precision
- **ICS generation:** build a valid `.ics` for all of the week's events ("Add all
  events"), plus a per-recipe mini ICS export for a single meal.
- **Google Calendar:** an "Add all events" link using Google's calendar template URL
  as a no-download alternative.
- Lives in `src/utils/cheffyCalendar.ts` so it is unit-testable independent of the UI.

## Feature: Local push notifications

Opt-in, local-only reminders for cooking times -- no server, no account.

- Service worker registered at `public/sw.js`.
- Permission is requested **through a Cheffy dialogue action** (`trigger-permission`),
  never on page load.
- Use the Notification Triggers / Alarm API where available to schedule local
  reminders for the extracted cooking times.
- **Graceful degradation:** browsers without support (notably iOS Safari) get a clear
  "not supported here" path instead of a broken button. Never block the rest of Cheffy.

## Feature: Checklist import / export

Move grocery + prep checklist state between devices.

- **Export JSON:** week id + task states, so a checklist can be re-imported elsewhere.
- **Export plain text:** Markdown checkbox format (`- [x] item`) for pasting anywhere.
- **Import:** read an exported JSON back in, with a merge-vs-overwrite choice.
- Reuses the existing grocery-list localStorage state (see `GroceryList.astro`) as the
  source of checkbox truth -- one state store, not a parallel one.

## Files (to be created by the build-out)

| File | Purpose |
|------|---------|
| `src/components/Cheffy.astro` | Corner mascot container + state-machine host. |
| `src/components/CheffyPanel.astro` | The expand-on-click dialogue panel. |
| `src/assets/cheffy-animated.svg` | SMIL demo loop for the README. |
| `src/data/cheffy-dialogue.json` | The dialogue tree (data, not code). |
| `src/utils/cheffyCalendar.ts` | Time extraction + ICS/Google Calendar generation. |
| `public/sw.js` | Service worker for local notifications. |

Wiring (final): `Layout.astro` mounts `<Cheffy />` once; `Cheffy.astro` imports the
dialogue JSON and the calendar util; `README.md` embeds `cheffy-animated.svg`.

## Acceptance (Definition of Done)

- Site builds clean (`npm run build`, i.e. `astro check && astro build`) and behaves
  exactly like `master` when Cheffy's JS is disabled.
- Cheffy renders in the corner on every page, idle by default, `attention` on a fresh
  week, and opens/closes a dialogue panel.
- `generate-ics` downloads a valid ICS covering the week's extracted times; the
  per-recipe mini export works; the Google Calendar link opens prefilled.
- The notification permission flow runs only from the dialogue, schedules a local
  reminder where supported, and degrades cleanly where not.
- Checklist export (JSON + Markdown) and import (merge/overwrite) round-trip the
  existing grocery-list state.
- `prefers-reduced-motion` is honored; no layout shift or console errors on any page.
- README shows the animated Cheffy demo.

## Notes

- Progressive enhancement is the hard rule: Cheffy never gates core content.
- Keep one source of truth: week times come from the existing parser, checkbox state
  from the existing grocery localStorage, week id from the existing per-week key.
- Match the existing component conventions (see `LunchGroceryAddon.astro`,
  `Footer.astro`) and the Tailwind-config-driven color system (see `README.md`).
</content>
</invoke>
