# Research: calendar-actions (part 4/9) seam + data-path

LEASE_OWNER: stage-manager-20260701T024853Z-pid11717

## 1. Part-3 registration seam (CheffyPanel.astro, client `<script>`)

- `window.cheffyActions: Record<string, (ctx) => void>` and
  `window.registerCheffyAction(name, fn)` are defined at module top of
  CheffyPanel's bundled client script (not `is:inline`, real ES `import`s work).
- `dispatchAction(name, ctx)` looks up `window.cheffyActions[name]`; falls back to
  `defaultAction` ("That's coming soon!") if unregistered -- panel never throws.
- `buildCtx(nodeId, extra?)` constructs the ctx object passed to every handler:
  `{ root, panel, dialogue, nodeId, index, setState, renderNode, close, ...extra }`.
  Confirmed fields today: `root` (#cheffy el), `panel` (#cheffy-panel el), `dialogue`
  (full parsed tree), `nodeId`, `index` (ArchiveEntry[] build-time archive index),
  `setState` (= `root.cheffySetState`, the part-2 state hook), `renderNode`, `close`.
  `slug`/`query` are only added via `extra` for `navigate-to-archive` (from the
  free-text input's `bestArchiveMatch`).
  **There is no `events`/week-data field in ctx today** -- a new handler must source
  its own week data (see #2), not expect it on ctx.
- Two actions are already registered inline in CheffyPanel's script:
  `close` and `navigate-to-archive`. These are explicitly commented
  "Part-3-owned actions: pure navigation, zero Cheffy.astro JS edits." -- i.e. the
  pattern of registering from inside CheffyPanel's own script is the PART-3
  convention, but the objective/brief for part 4 explicitly requires CheffyPanel.astro
  stay untouched, so `generate-ics` (and later `trigger-permission`,
  `export-checklist`) must be registered from a **new, separate client script**, not
  by editing this file. `window.registerCheffyAction` is a documented public seam
  precisely so later parts can do this without touching the panel.

## 2. Runtime data path for CookingEvents -> generate-ics (Cheffy not yet in Layout)

Findings:
- `Cheffy.astro` is an explicit STUB, "NOT yet mounted in Layout.astro -- wiring is
  the final build-out step" (its own header comment). `Layout.astro` today has no
  `<Cheffy />`, only `<slot />`. None of index.astro / weekend.astro /
  archive/[slug].astro reference Cheffy or CheffyPanel at all yet.
- CHEFFY-SYSTEM.md is explicit that Cheffy "reads the already-parsed week data (the
  same source the page renders from -- weekParser.ts output) so his calendar/
  notification times stay in sync with what is on screen. No second source of
  truth," and that final wiring mounts `<Cheffy />` once from Layout.
- **`parseWeekPlan()`/`parsePagePlan()` do NOT retain the raw markdown string or the
  resolved filename on the returned `WeekPlan`/`PagePlan` object** (checked
  `src/utils/weekParser.ts:83-134`) -- `extractCookingEvents(markdown, weekStart)`
  needs the raw markdown text, which none of the 3 call sites currently hold as a
  reusable value; `parsePagePlan` reads it internally via `fs.readFileSync` and
  discards it.
- CheffyPanel.astro already establishes the exact pattern to reuse: a build-time
  Astro frontmatter block (Node context, `fs`/`path` available) computes derived
  data and serializes it into the page as
  `<script type="application/json" id="..." set:html={JSON.stringify(...)} />`,
  which the client script then does `document.getElementById(id)` +
  `JSON.parse(el.textContent)` to consume (see `#cheffy-archive-index`). This is the
  established, audited convention for "build-time-computed data -> client script"
  in this codebase; part 4 should reuse it rather than invent a new mechanism.

Recommendation for the Planner (since editing CheffyPanel.astro is out of scope and
Layout.astro final-mount is a later part, not part 4):
- Add a **new, small build-time data source** -- either a tiny new Astro component
  (e.g. `CheffyCalendarData.astro`, rendered next to `<Cheffy />` wherever it ends up
  mounted) or inline in `Cheffy.astro`'s own frontmatter -- that: (a) re-reads the
  same markdown file each page already resolves (`fs.readFileSync(path.join(
  process.cwd(), filename))`, mirroring `weekParser.ts`'s own read, NOT a new
  parser), (b) calls `deriveWeekStart(markdown, filename)` then
  `extractCookingEvents(markdown, weekStart)`, and (c) emits a
  `<script type="application/json" id="cheffy-week-events" set:html={...}>` data
  island with the resulting `CookingEvent[]` (serialize `start` as an ISO string;
  `Date` doesn't round-trip through `JSON.stringify`/`JSON.parse` -- the new client
  init file must `new Date(iso)` it back).
- This requires each page (index.astro/weekend.astro/archive/[slug].astro) to keep
  passing the *same* `filename` it already resolves through to wherever this new
  data component/Cheffy is eventually mounted -- e.g. a `filename` prop threaded
  through `Layout.astro` -> `<Cheffy filename={...} />` at final-wiring time. Since
  Layout-mounting is out of scope for part 4, the Planner should build this data
  component so it accepts a `filename`/`markdown` prop now (import-ready, unit
  test-able against a fixture path) without forcing Layout/page edits in this part
  -- OR explicitly flag "Layout mount + filename prop threading" as follow-up scope
  for whichever part does final wiring, if the Director's slicing expects it later.
  **GAP:** the OBJECTIVE's 9-part plan isn't visible to this rung -- confirm with the
  Planner/Director which later part (likely the "final Layout wiring" part) owns
  actually mounting `<Cheffy filename={...} />` per page vs. part 4 doing it now.
- The **registration** of `generate-ics` (and friends) belongs in a **new client
  script/init file** (e.g. `src/utils/cheffyCalendarActions.ts` imported by a
  `<script>` tag in the new data component, or a plain `<script>` block in that
  component) that: reads `#cheffy-week-events` via DOM lookup (not via ctx, since
  ctx has no events field and CheffyPanel's ctx shape is not being changed),
  reconstructs `CookingEvent[]`, and calls `window.registerCheffyAction('generate-
  ics', (ctx) => {...})`. `cheffyCalendar.ts` itself should stay UI/DOM-free per its
  own header contract ("Pure... no DOM/browser APIs, no Astro") -- do not add
  `window.registerCheffyAction` calls inside `cheffyCalendar.ts`; put the
  registration glue in the new init file, which imports the pure functions from
  `cheffyCalendar.ts`.

## 3. The three parseWeekPlan(filename) call sites

- `src/pages/index.astro`: `await parseWeekPlan()` (default arg) -> reads
  `FOOD-OF-THE-WEEK.md` at repo root (`process.cwd()`-relative). No `filename`
  variable is retained in scope today (default arg only) -- the new data component
  would need `'FOOD-OF-THE-WEEK.md'` hardcoded or the page updated to pass it
  explicitly if threading a `filename` prop downstream.
- `src/pages/weekend.astro`: `await parseWeekPlan('WEEKEND.md')` -- filename literal
  present in the call, same discard problem as above.
- `src/pages/archive/[slug].astro`: `getStaticPaths()` builds `props: { filename:
  \`archive/${file}\` }` per route; frontmatter destructures `const { filename } =
  Astro.props` then calls `parseWeekPlan(filename)`. This is the ONE call site that
  already holds `filename` as a named variable ready to pass down to a child
  component/prop without modification of the parsing call itself.
- `deriveWeekStart(markdown, filename)` (in cheffyCalendar.ts) mirrors the archive
  filename convention already used by `weekParser.ts`/CheffyPanel's archive index
  (`YYYYMMDD-` prefix fallback) and the "Week of ..." H1 title parse (primary) --
  consistent with all 3 files' actual markdown content (checked H1 pattern exists
  in the template convention referenced by weekParser.ts's own docstring).

## 4. Browser mechanics for ICS download / Google Calendar open

Standard, well-established browser APIs -- no web-check needed, these are stable:
- Download an in-memory string as a file: `new Blob([icsText], { type:
  'text/calendar;charset=utf-8' })` -> `URL.createObjectURL(blob)` -> a
  programmatically-clicked `<a href={url} download="week.ics">` -> then
  `URL.revokeObjectURL(url)` after the click (next tick / `setTimeout(...,0)` is the
  common-enough pattern to avoid revoking before the download starts in all
  browsers).
- Per-recipe mini export: same Blob/anchor pattern with a single-event `CookingEvent[]`
  (`buildIcs([event])`) and a per-meal filename (e.g. `${mealSlug}.ics`).
  **GAP:** `src/data/cheffy-dialogue.json` today has NO dialogue node/option that
  targets a single meal for a mini export -- only the week-level "Add all events" ->
  `generate-ics` node exists (`calendar` node). The per-recipe export entry point
  (a dialogue node with per-meal buttons, or a UI element outside the dialogue tree
  entirely, e.g. a button on each meal card) is not yet decided/scaffolded anywhere
  in the repo. Flag for Planner: either add per-meal option(s) to the dialogue JSON
  in this part, or explicitly defer per-recipe export to a later part while
  `generate-ics` (week-level "add all") ships now.
- Google Calendar: `window.open(googleCalendarUrl(event), '_blank', 'noopener')` (or
  plain `<a target="_blank" rel="noopener">`) -- `googleCalendarUrl` only builds a
  URL string, no download involved, so no Blob needed for that path.

## 5. cheffyCalendar.ts client-bundle import safety -- CRITICAL FINDING

**`buildIcs()` is NOT safely importable into a browser/client bundle as-is.**
Traced: `buildIcs` -> `foldLine(line)` -> `Buffer.byteLength(line, 'utf8')` (used
twice in `foldLine`, lines ~59 and ~67 of cheffyCalendar.ts). `Buffer` is a Node.js
global; this project's bundler is Vite (via Astro, confirmed in
`astro.config.mjs` -- `output: 'static'`, no polyfill plugin present, `package.json`
has no `buffer`/`vite-plugin-node-polyfills` dependency). Vite/Rollup do **not**
auto-polyfill Node core globals for the client -- unpolyfilled `Buffer` usage throws
`ReferenceError: Buffer is not defined` at runtime in the browser (verified via web
search against current Vite guidance/discussions on this exact failure mode; this
is a long-standing, well-documented Vite behavior, not something that changed
recently). Every other exported function is client-safe:
  - `extractCookingEvents` uses `marked.lexer(...)` only -- `marked`'s lexer has no
    Node-only API surface, safe to bundle client-side.
  - `deriveWeekStart` is pure regex/Date, no Node API.
  - `googleCalendarUrl` calls `eventEnd()` + `toIcsUtc()` (Date math, string
    padding) -- no `Buffer`, safe client-side.
  - Only `buildIcs` (via `foldLine`) is unsafe.

**Recommendation:** since `cheffyCalendar.ts` is already audit-passed and the brief
implies it stays as-is for this part, do NOT edit it in part 4. Instead run
`buildIcs()` at **Astro build time** (Node/SSR context, where `Buffer` exists) in
the same new frontmatter data component from #2, and embed the **pre-built ICS
text** (full-week "add all" string, and optionally per-meal mini-export strings
keyed by `mealSlug`) directly into a build-time data island alongside/instead of the
raw `CookingEvent[]`. The new client init file's `generate-ics` handler then only
needs to read the pre-built ICS string and do the Blob+anchor-download -- it never
needs to call `buildIcs()` itself, sidestepping the Buffer problem entirely without
touching the audited module. If the Planner still wants `buildIcs` importable
client-side for flexibility (e.g. dynamic per-meal mini-export chosen at click
time rather than precomputed for every meal), flag that as a follow-up fix to
`cheffyCalendar.ts` (`Buffer.byteLength(str, 'utf8')` -> `new
TextEncoder().encode(str).length`, a browser+Node-universal UTF-8 byte-length
primitive) rather than working around it in the caller -- but that is a change to
the audited file, outside this rung's read-only research scope, so it is reported
as a GAP/option, not applied.

## Summary recommendation for the Planner

1. New file `src/utils/cheffyCalendarActions.ts` (or similarly named init) --
   imports pure functions from `cheffyCalendar.ts`, calls
   `window.registerCheffyAction('generate-ics', ...)` and (later parts)
   `'export-checklist'`/`'trigger-permission'`. Does NOT touch CheffyPanel.astro.
2. New tiny Astro component (or Cheffy.astro frontmatter, if Cheffy.astro edits are
   in scope for this part) that at BUILD TIME: re-reads the page's markdown file,
   calls `deriveWeekStart` + `extractCookingEvents` + `buildIcs` (Node context, safe
   for Buffer), and emits a JSON data island (`<script type="application/json"
   id="cheffy-week-ics">`) with the finished ICS text (+ optionally raw events for
   any client-only needs like a per-event Google Calendar link). Loads the client
   init script from #1.
3. `generate-ics` handler (browser): `document.getElementById('cheffy-week-ics')`
   -> Blob + `URL.createObjectURL` + anchor `download` click, no `buildIcs()` call
   in the browser -- avoids the Buffer ReferenceError.
4. Confirm with Planner/Director: (a) which part actually threads `filename` through
   Layout -> Cheffy (page-level wiring) since part 4's OBJECTIVE frames this as
   NOT-yet-mounted; (b) whether a per-recipe mini-export dialogue entry point needs
   to be added to `cheffy-dialogue.json` in this part or is deferred.

Sources checked (web): Vite/Rollup do not polyfill Node's `Buffer` by default for
client bundles -- https://github.com/vitejs/vite/discussions/2785,
https://github.com/vitejs/vite/discussions/6180, https://web3auth.io/docs/troubleshooting/vite-issues.
