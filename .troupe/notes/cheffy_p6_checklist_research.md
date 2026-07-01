# Research: grocery checklist export + import (cheffy_p6_checklist_research)

## (a) GroceryList.astro localStorage contract -- EXACT

File: `src/components/GroceryList.astro` (script block, lines 44-68).

**Key derivation** (`getStorageKey()`, lines 45-50):
```js
function getStorageKey(): string {
  const weekElement = document.querySelector('h1');
  const weekTitle = weekElement?.textContent || 'current-week';
  return `grocery-list-${weekTitle.toLowerCase().replace(/\s+/g, '-')}`;
}
```
- Reads the page's `<h1>` text (the week title), lowercases it, collapses whitespace runs to single hyphens. NOT stripped of punctuation, NOT hyphen-collapsed beyond `\s+`. Prefix is the literal string `grocery-list-`.
- This is BYTE-IDENTICAL to `slugifyWeekTitle()` in `src/utils/cheffyState.ts` (`title.toLowerCase().replace(/\s+/g, '-')`) -- that file's own doc comment says so explicitly ("Reproduce EXACTLY the GroceryList/MealCard slug rule. MUST stay byte-identical"). So the reusable/exportable piece already exists: `grocery-list-${slugifyWeekTitle(weekTitleText)}` reproduces GroceryList's key exactly, using the existing util instead of re-deriving it inline in a third file.
- **GAP:** `getStorageKey()` itself is NOT exported from GroceryList.astro -- it's private to that component's inline `<script>` closure. A new checklist-actions module cannot import it directly; it must either (1) recompute the key via `grocery-list-${slugifyWeekTitle(h1.textContent)}` using the already-shared `cheffyState.ts` util (recommended -- zero new duplication, single already-blessed source), or (2) GroceryList.astro would need to export the helper (bigger, riskier touch to a component not otherwise in scope). Recommend (1): import `slugifyWeekTitle` from `../utils/cheffyState` and prefix `grocery-list-`.

**Stored value shape** (`loadCheckedItems`/`saveCheckedItems`, lines 52-61):
- `localStorage.getItem(key)` -> a JSON string that `JSON.parse`s into a plain array of strings, wrapped into a `Set<string>` in memory: `stored ? new Set(JSON.parse(stored)) : new Set()`.
- Saved as `JSON.stringify([...checked])` -- i.e. the persisted value is literally `["cat::0::item text", "cat::1::other item", ...]`, a JSON array of item-keys. It is NOT an object/map, NOT a nested structure -- just a flat string array.

**Item-key shape** (`getItemKey()`, lines 63-68):
```js
`${category}::${index}::${item}`
```
where `category` = `checkbox.dataset.category` (the category name, e.g. "Produce"), `index` = `checkbox.dataset.index` (the item's index within that category, stringified), `item` = `checkbox.dataset.item` (the item's display text). Delimiter is the literal `::` (double colon), used twice per key.

These `data-*` attributes are rendered directly onto each `.grocery-checkbox` input in the template (lines 25-32): `data-category={category.name} data-index={index} data-item={item.text} data-globally-checked=...`.

**Single source of truth to reuse:** key = `grocery-list-${slugifyWeekTitle(weekTitleFromH1)}`; value = JSON array of `${category}::${index}::${item}` strings representing the CHECKED items only (unchecked items are simply absent from the array). Any export/import code must read/write this exact key and this exact array-of-strings shape -- do not invent a parallel key or a richer value shape (e.g. don't wrap in `{checked: [...]}`).

## (b) Enumerating current week's grocery items + checked state

There is no client-exposed JS array of "all items" anywhere at runtime -- `GroceryList.astro`'s Astro frontmatter receives `categories: ListCategory[]` (from `weekParser.ts`) at BUILD time and renders it straight to static HTML (SSR only; no data island is emitted for it, unlike the calendar feature's `#cheffy-week-ics` JSON island). So the only way to enumerate items client-side (from a Cheffy action, which lives in `Cheffy.astro`/`CheffyPanel.astro`, a sibling component with no access to GroceryList's props) is to **read the rendered DOM**, exactly as `LunchGroceryAddon.astro` and GroceryList's own script do:

```js
document.querySelectorAll('.grocery-item')      // one per item, li wrapper
// each contains: label > input.grocery-checkbox[data-category][data-index][data-item][data-globally-checked]
//                and span.item-text (display text, same as data-item)
```

To build category-grouped export data:
```js
const checked = loadCheckedItemsForCurrentKey(); // Set<string>, derived per (a)
const byCategory = new Map<string, {text: string, checked: boolean}[]>();
document.querySelectorAll<HTMLInputElement>('.grocery-checkbox').forEach((cb) => {
  const category = cb.dataset.category ?? '';
  const itemKey = `${category}::${cb.dataset.index}::${cb.dataset.item}`;
  const isChecked = checked.has(itemKey);           // or just cb.checked (live DOM state, same after init)
  (byCategory.get(category) ?? byCategory.set(category, []).get(category)!)
    .push({ text: cb.dataset.item ?? '', checked: isChecked });
});
```
`cb.checked` (live DOM property) and `checked.has(itemKey)` (localStorage-derived) will agree after `GroceryList.astro`'s own `initializeCheckboxes()` has run on page load, since that function sets `checkbox.checked = true` for every stored key. Either read is safe; reading localStorage directly is more robust to script-ordering, since it doesn't depend on GroceryList's init script having already run in the DOM at the moment Cheffy's `export-checklist` handler fires (it will have, in practice, given normal page load order, but is not a documented contract -- so **prefer re-deriving from localStorage** over trusting `cb.checked`, mirroring GroceryList's own pattern of always calling `loadCheckedItems()` fresh rather than trusting live DOM state).

**GAP:** `GroceryList.astro` is only rendered on pages that include it (home/weekend/lunch/fancai plan pages, presumably not e.g. an empty/no-plan page). If Cheffy's checklist panel opens on a page with no `#grocery-list` DOM present at all (0 `.grocery-item` matches), `export-checklist` must handle the "nothing to export" case gracefully (same pattern as calendar-actions' `NO_TIMES_MESSAGE` no-op-with-message), not throw.

**Week id for the export payload:** reuse `slugifyWeekTitle(document.querySelector('h1')?.textContent || 'current-week')` (from `cheffyState.ts`, same util as (a)) as the `weekId` field in the export JSON -- this is also what `Cheffy.astro` itself already uses for `visitedWeeks`, so it's a third confirmation this is the app's single canonical week-id derivation, safe to lean on further.

## (c) Two export formats

**JSON export** -- CHEFFY-SYSTEM.md's own spec (line 115): "week id + task states, so a checklist can be re-imported elsewhere." Recommended shape (matches the localStorage array-of-keys shape 1:1, so round-trip is trivial and does not require inventing new semantics):
```json
{
  "weekId": "week-of-june-30",
  "storageKey": "grocery-list-week-of-june-30",
  "checked": ["Produce::0::2 onions", "Dairy::1::Milk"],
  "categories": [
    { "name": "Produce", "items": [{ "text": "2 onions", "checked": true }, ...] },
    { "name": "Dairy",   "items": [{ "text": "Milk", "checked": true }, ...] }
  ]
}
```
- `checked` (flat key array) is the field the IMPORT path actually needs (it's literally the localStorage value) -- this is the load-bearing field.
- `categories` (full item list with per-item checked flag) is included for human/debugging value and so a JSON import into a DIFFERENT week (different item ordering/content) can still be sanity-checked, but is not required for the merge/overwrite mechanics, which operate purely on the `checked` key array.
- `storageKey`/`weekId` let import validate "this export is for the currently-displayed week" vs. warn the user it's from a different week (still importable, since keys stay comparable strings, but the categories/indices may not line up with the current page's items if the week's markdown changed).

**Markdown export** -- CHEFFY-SYSTEM.md line 116: "Markdown checkbox format (`- [x] item`) for pasting anywhere." Recommended shape, grouped by category heading (matches the site's own grocery-list visual grouping):
```markdown
# Grocery Checklist -- Week of June 30

## Produce
- [x] 2 onions
- [ ] 1 head garlic

## Dairy
- [x] Milk
```
This format is plain, human-pasteable, and (per (d) below) is one of the two candidate PASTE-BACK-IN formats for import.

Both exports should be produced client-side and offered as file downloads via a `Blob` + `URL.createObjectURL` + synthetic `<a download>` click, the exact pattern already used by `downloadIcs()` in `cheffyCalendarActions.ts` (lines 45-55) -- reuse that same download-trigger idiom (a new `download(fileName, text, mimeType)` helper generalizing `downloadIcs`, or a local copy scoped to the new checklist-actions file, since `cheffyCalendarActions.ts` explicitly avoids being imported into other bundles for Node-global reasons stated in its header comment -- the safer move is a small local copy, not a cross-import).

## (d) Import UX inside the node-based dialogue panel

**Free-text input mechanism (confirmed):** `cheffy-dialogue.json`'s `search` node sets `"input": true`. In `CheffyPanel.astro`, both the SSR fallback (line 43-45) and the client runtime's `renderNode()` (lines 175-193) check `node.input` and, if true, render a single `<input type="text" class="cheffy-input">`. The CLIENT runtime wires that input's `keydown` (Enter key only) to look up `bestArchiveMatch()` and dispatch a hard-coded `navigate-to-archive` action (lines 181-191) -- this Enter-key wiring is CURRENTLY SPECIFIC to the `search` node's use case, NOT generic. There is no existing generic "on-submit, dispatch action X with the raw text" wiring for arbitrary `input:true` nodes.

**GAP / decision needed for Planner:** to reuse the SAME `input:true` mechanism for checklist import (paste JSON or paste Markdown into the free-text box, then submit), `CheffyPanel.astro`'s `renderNode()` Enter-key handler needs to become node-aware -- e.g. read a new per-node field like `"inputAction": "import-checklist"` from the dialogue node data and dispatch THAT action with the raw text, instead of always calling `navigate-to-archive`. This is a small, additive change to `CheffyPanel.astro`'s client script (the `if (node.input)` block, lines 175-193) plus a matching addition to the `checklist` node in `cheffy-dialogue.json` (which the task's OBJECTIVE already anticipated -- "an import affordance may need a small option/node added to that checklist node"). This is the cleanest way to stay within the existing node-based/data-driven pattern without adding a `<input type="file">` (file inputs are heavier: need FileReader, an "Import from file" separate button, and don't fit the existing single-text-input-per-node UI at all). **Recommend: paste-text into the existing `input:true` textbox, not a file picker** -- it's a strictly smaller diff, matches the existing UI affordance 1:1, and CHEFFY-SYSTEM.md's own spec language ("Export plain text: Markdown checkbox format... for pasting anywhere") signals paste-based, not file-based, round-tripping was the intended UX.

**Format the pasted text should accept:** recommend the importer sniff for either serialized format the user might paste back in (both are text, both came out of the two export buttons) -- if `JSON.parse` succeeds and yields a `checked: string[]` field, treat as JSON import; otherwise, try to parse `- [x] item` / `- [ ] item` Markdown checkbox lines to reconstruct a checked-keys array by matching item text against the CURRENT page's rendered `.grocery-item` texts (category/index recovered by matching the item's display text against the currently rendered items -- lossy if the week's items changed since export, but usable). **GAP:** Markdown import is inherently fuzzier (loses category/index precision, matches on item text only) -- flag to Planner whether Markdown import is even required by DoD, or whether "import" only needs to round-trip the JSON export (CHEFFY-SYSTEM.md's Acceptance section line 145 says "Checklist export (JSON + Markdown) and import (merge/overwrite) round-trip the existing grocery-list state" -- read literally this requires import to work from EITHER exported format, but JSON-only import would be a materially smaller, more reliable slice; worth an explicit Planner call on whether Markdown-paste import is in scope for this pass or a stretch item).

**Merge vs overwrite semantics (as instructed):**
- **Merge** = `newChecked = union(existingLocalStorageSet, importedCheckedKeys)` -- i.e. `loadCheckedItems()` (per (a)) unioned with the imported key array, then `saveCheckedItems(union)`. Items already checked locally stay checked; imported checked items get added; nothing gets unchecked.
- **Overwrite** = `newChecked = new Set(importedCheckedKeys)` written directly via `saveCheckedItems()`, fully replacing whatever was in localStorage for that key -- items checked locally but absent from the import become unchecked.
- Both operations write to the SAME storage key from (a) (`grocery-list-${slugifyWeekTitle(...)}`) for the CURRENTLY DISPLAYED week -- import is scoped to "the current week's checklist," matching the export's `weekId` field, not a cross-week write. **GAP:** decide (Planner-level) whether to warn/block import if the imported payload's `weekId`/`storageKey` doesn't match the current page's derived key (e.g. user imported a JSON exported from a different week) -- recommend a lightweight text warning in `.cheffy-text`, not a hard block, since the item text-matching still degrades gracefully.
- After a successful import, the checklist DOM must reflect the new state immediately -- since `GroceryList.astro`'s `initializeCheckboxes()` only runs once on page load and owns its own closure (no exported re-init function), the cleanest way to make already-rendered checkboxes reflect a Cheffy-driven import without touching GroceryList.astro's script is a **full page reload** (`window.location.reload()`) after `saveCheckedItems()`-equivalent write, exactly the same "write to storage, then reload to reflect" idiom already implicit in how `GroceryList.astro`'s init only runs on load. **GAP:** alternatively, dispatch a custom DOM event (e.g. `window.dispatchEvent(new CustomEvent('cheffy:checklist-updated'))`) and have `GroceryList.astro`'s script listen for it and re-run `initializeCheckboxes()` -- this avoids a reload but DOES require a (small, additive) touch to `GroceryList.astro` itself, which the OBJECTIVE's CONTEXT_FILES list already includes, so it's in scope if the Planner prefers no-reload UX. Flagging both options; reload is the zero-touch-to-GroceryList option, the custom-event listener is the no-reload option.

## (e) Registration/mount seam (order-safe pattern, confirmed)

`src/utils/cheffyCalendarActions.ts` (lines 13-21) establishes the exact order-safe registration idiom to copy verbatim for a new `src/utils/cheffyChecklistActions.ts`:
```js
const w = window as any;
const register =
  w.registerCheffyAction ||
  ((name: string, fn: (ctx: any) => void) => {
    w.cheffyActions = w.cheffyActions || {};
    w.cheffyActions[name] = fn;
  });
```
then `register('export-checklist', (ctx) => { ... })` and (new) `register('import-checklist', (ctx) => { ... })` (or a single `inputAction`-driven handler per (d), name TBD by Planner -- `cheffy-dialogue.json`'s own `_actions` comment (line 8) already lists `export-checklist` as a valid action name but not yet an import one; that comment string will need an addition, e.g. `... | export-checklist | import-checklist | close`).

Mount seam: `Cheffy.astro` appends ONE bundled `<script>import '../utils/cheffyCalendarActions';</script>` per action-family module (lines 244-256 show TWO such blocks already, one for calendar actions, one for notifications) -- the new checklist actions module gets its own THIRD such block:
```astro
<script>
  import '../utils/cheffyChecklistActions';
</script>
```
appended alongside the existing two, per the OBJECTIVE's instruction ("mounted by a single bundled import appended to Cheffy.astro").

**`ctx` contract available to the new handler** (from `CheffyPanel.astro` `buildCtx()`, lines 126-140): `{ root, panel, dialogue, nodeId, index, setState, renderNode, close, ...extra }` -- `panel.querySelector('.cheffy-text')` is how calendar-actions writes status messages back into the dialogue (e.g. `NO_TIMES_MESSAGE` pattern); reuse the same `.cheffy-text` textContent-write idiom for checklist export/import success/error/"nothing to export" messaging, and `ctx.setState('processing')` / `ctx.setState('dialogue')` around the download/import work, exactly as `generate-ics` does (lines 66-68 of cheffyCalendarActions.ts).

## Summary for the Planner

- **Key:** `` `grocery-list-${slugifyWeekTitle(h1Text)}` `` -- reuse `slugifyWeekTitle` from `cheffyState.ts`; do not invent a new key or re-derive the slug rule a third time.
- **Value:** flat JSON array of `${category}::${index}::${item}` strings (checked items only) -- reuse verbatim, do not wrap.
- **Enumeration:** DOM query on `.grocery-checkbox[data-category][data-index][data-item]` (no build-time data island exists for grocery items, unlike calendar's ICS island) -- must handle zero-items-on-page gracefully.
- **Export formats:** JSON (`{weekId, storageKey, checked, categories}`) and Markdown (`# heading` + `## category` + `- [x]/[ ] item` lines) -- both via `Blob`+`<a download>`, same idiom as `downloadIcs()` (local copy, not cross-import, per that file's Node-global warning).
- **Import surface:** reuse the existing `input:true` free-text box pattern (no file picker) -- requires a small additive change to `CheffyPanel.astro`'s `renderNode()` Enter-key handling to become node-action-aware (new `inputAction` field on dialogue nodes) plus a new/edited node in `cheffy-dialogue.json` for the checklist import affordance. JSON-paste import is the reliable case; Markdown-paste import is fuzzier (text-match against current DOM) -- flag to Planner whether both are truly required by the DoD wording or JSON-only is an acceptable first slice.
- **Merge/overwrite:** merge = union of key-sets; overwrite = direct replace; both write to the SAME per-week key from (a). Post-import UI refresh needs either a full reload (zero GroceryList.astro touch) or a custom-event listener added to GroceryList.astro (no-reload UX) -- Planner should pick one.
- **Registration:** new `src/utils/cheffyChecklistActions.ts` using the identical order-safe `register()` idiom as `cheffyCalendarActions.ts`, mounted via one new bundled `<script>import '../utils/cheffyChecklistActions';</script>` block appended to `Cheffy.astro` alongside the existing two action-family imports. `cheffy-dialogue.json`'s `_actions` doc-comment string needs the new action name(s) appended.
</content>
