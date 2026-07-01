# Blueprint: floating-mascot (DoD criterion 1) -- builder spec

**Scope (BOUNDARY -- do not exceed):** make `#cheffy` `position:fixed`, corner-docked
(honoring `data-corner`, default bottom-right), z-indexed above page content, out of
document flow, present on every page, and hidden/inert with JS off so the rendered page
matches master. **Only `src/components/Cheffy.astro` changes.** Do NOT touch the SVG
hat/bubble sizing or animation (crit 2), the panel scaling/scrim (crit 3), brand
tokens/typography (crit 4), or the screenshot script (crit 5). No Tailwind config change,
no Layout change, no CheffyPanel change.

---

## Change 1 -- CSS: add positioning + JS-off hide gate to the `<style>` block

**File:** `src/components/Cheffy.astro`
**Where:** at the TOP of the existing `<style>` block, immediately after the opening
`<style>` tag on line 118 and BEFORE the `/* fills/strokes -- brand tokens */` comment
(line 119). Keep it in this one file -- it already owns every other `#cheffy` rule.

**Insert exactly:**

```css
  /* --- part 1: viewport docking + JS-off hide gate --- */
  /* Default HIDDEN: with JS off, #cheffy paints nothing, takes no space, is not */
  /* tabbable -> rendered page matches master. JS adds .cheffy-ready to reveal.  */
  .cheffy-root { display: none; }
  .cheffy-root.cheffy-ready { display: block; }

  /* Fixed to the viewport (also removes it from document flow) + above page   */
  /* content. z-index 200 clears the sticky header (z-index:100) so top-corner */
  /* docking overlaps it cleanly, with headroom below a future modal tier.     */
  .cheffy-root.cheffy-ready {
    position: fixed;
    z-index: 200;
  }

  /* Per-corner docking, driven by the server-rendered data-corner attribute.  */
  .cheffy-root[data-corner="bottom-right"] { bottom: 1rem; right: 1rem; }
  .cheffy-root[data-corner="bottom-left"]  { bottom: 1rem; left: 1rem; }
  .cheffy-root[data-corner="top-right"]    { top: 1rem; right: 1rem; }
  .cheffy-root[data-corner="top-left"]     { top: 1rem; left: 1rem; }
```

Notes for the builder:
- Put `position:fixed` + `z-index` on the `.cheffy-ready` variant (not bare
  `.cheffy-root`) so the JS-off state is a plain `display:none` with zero positioning
  side effects -- cleanest possible "inert" contract. The corner offset rules can stay
  on bare `.cheffy-root[data-corner=...]` (they only apply once `display` is not none).
- `display: block` is correct here -- the root is a container whose only visible child
  is `.cheffy-toggle`; do NOT set width/height/flex/sizing (that is crit 2's job).
- Do NOT alter, reorder, or reindent any existing rule (the `[data-expr]`/`[data-mouth]`
  state rules, blink keyframe, reduced-motion sweep). They are descendant selectors under
  `#cheffy[data-state=...]` and never conflict with the parent's `display:none`.
- `data-corner` is already emitted server-side on line 72 (`data-corner={corner}`,
  default `'bottom-right'` from line 28) -- no markup change needed.

## Change 2 -- JS: reveal the mascot once init succeeds

**File:** `src/components/Cheffy.astro`, inside `initCheffy()` (starts line 205).
**Where:** immediately AFTER the existing early-out guard on line 210
(`if (!toggle || !panel) return;`) and BEFORE the `const weekId = ...` line 212. This
placement means the mascot is revealed only after `#cheffy` AND its required children
(`.cheffy-toggle`, `#cheffy-panel`) are confirmed present, and BEFORE the first
`setState(...)` call (line 222) so there is no flash of undocked content.

**Insert exactly one line (matching the file's 4-space indent inside the function):**

```js
    root.classList.add('cheffy-ready');                  // reveal now DOM is verified -- JS-off stays hidden
```

Do NOT change any other line in the `<script>` block. `root` is already defined (line
206) and non-null past the line-207 guard.

---

## Why this satisfies the DoD line

- **position:fixed** -> Change 1, on `.cheffy-ready`.
- **docked to a screen corner honoring data-corner (default bottom-right)** -> the four
  `[data-corner=...]` offset rules; server default is already `bottom-right`.
- **z-indexed above page content** -> `z-index:200` (> sticky header's 100).
- **out of document flow** -> falls out of `position:fixed` for free.
- **present on every page** -> already mounted once in `Layout.astro` (all routes go
  through it); no change needed.
- **JS-off hidden/inert, site byte-identical to master** -> `.cheffy-root{display:none}`
  default; the reveal class is added only by `initCheffy()`. With JS off: zero box, zero
  paint, not tabbable. (`#cheffy-panel` also carries native `[hidden]` and inherits the
  parent's `display:none`, so it is doubly inert.) "Byte-identical" = rendered/visual
  parity with master (master ships no Cheffy markup, so raw-byte HTML equality is
  impossible and not the intended reading -- confirmed against CHEFFY-SYSTEM.md's own
  acceptance wording "behaves exactly like master when Cheffy's JS is disabled... no
  layout shift or console errors").

---

## Acceptance -- checkable by builder + tester

Build with `npx astro build` (NOT `npm run build`): `astro check` fails on PRE-EXISTING
unrelated TS errors in `src/pages/cheffy-demo.astro` -- that is not this part's concern;
do not fix or touch that file.

1. **CSS present in output:** after build, the compiled Cheffy-scoped CSS in
   `dist/_astro/*.css` contains `position:fixed`, `z-index:200`, and the four
   `data-corner` offset rules for `.cheffy-root`. (grep the dist css.)
2. **JS-off = hidden:** load any built page with JavaScript disabled -> `#cheffy` has
   computed `display:none`, occupies zero layout space, and is not reachable by Tab. The
   page's visible content + layout is indistinguishable from master (no mascot, no
   trailing in-flow block after the footer, no layout shift).
3. **JS-on = docked:** with JS enabled, `#cheffy` gains class `cheffy-ready`, computed
   `position` is `fixed`, and it sits in the bottom-right corner (~1rem inset) above page
   content, including above the sticky header when scrolled.
4. **data-corner honored:** rendering with `corner="top-left"` (e.g. the cheffy-demo or a
   manual prop test) docks the element to the top-left inset instead. (Attribute-selector
   correctness -- can be verified by toggling `data-corner` in devtools on a JS-on page.)
5. **No console errors** on load with JS on, and no regression to existing state/expression
   behavior (idle eyes/mouth still render once revealed).
6. **Diff is minimal:** exactly one `<style>` insertion block + exactly one added JS line,
   both in `src/components/Cheffy.astro`. No other file changed.

## Files
- CHANGE: `/Users/ianschuepbach/Developer/food-of-the-week/src/components/Cheffy.astro`
  (style block ~line 118; `initCheffy()` after line 210).
- NO CHANGE (confirmed): `src/layouts/Layout.astro`, `src/components/CheffyPanel.astro`,
  `tailwind.config.mjs`, `src/pages/cheffy-demo.astro`.
