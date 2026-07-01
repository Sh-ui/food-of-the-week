# Research: floating-mascot DoD criterion 1 (Cheffy positioning/JS-off contract)

## (a) Mount mechanism -- server-rendered, not JS-injected

`#cheffy` is **fully server-rendered (SSR/build-time) markup**, unconditionally emitted
into every page's `<body>`:

- `src/layouts/Layout.astro:40` -- `<Cheffy filename={cheffyFilename} />` inside `<body>`,
  right after `<slot />` (i.e. after the page content / footer, still document-order last
  in body).
- `src/components/Cheffy.astro:68-116` -- Astro component-script conditional
  (`{enabled && (...)}`), which is a **build-time** branch, not client JS. When
  `enabled` (default `true`), the `<div id="cheffy" class="cheffy-root" data-corner="bottom-right"
  data-state="idle" ...>` + toggle `<button class="cheffy-toggle">` + full SVG + `<CheffyPanel />`
  are baked straight into the static HTML.
- Verified in the actual `npm run` / `npx astro build` output
  (`dist/index.html`): `#cheffy` markup is present verbatim, right after `</footer>`,
  before `</body>`.
- `master` (062da44) has **zero** Cheffy references anywhere (`Layout.astro` on master has
  no `Cheffy` import/mount at all). So the working branch's rendered HTML can never be
  raw-byte-identical to master's HTML -- extra markup always exists. "Byte-identical"
  must mean **rendered/visual output identical** (zero layout impact, zero visible
  content, zero interactivity) with JS off, not literal source-byte equality. See (c).

### Current CSS -- THE GAP

`Cheffy.astro`'s `<style>` block (lines 118-185) and `CheffyPanel.astro` (no `<style>`
block at all) contain **zero positioning CSS**. Confirmed by grep across
`src/**/*.astro` and `src/styles/global.css` for `cheffy-root`, `data-corner`, or any
`#cheffy` position rule -- none exist. The only `#cheffy`-scoped CSS today is the
expression/mouth swap (`display:none`/`block` per `[data-expr]`/`[data-mouth]`), the
blink keyframe, and the reduced-motion sweep.

Consequence, confirmed in `dist/_astro/*.css` (grep for `w7q7yrvc`, Cheffy's Astro
scope hash): no `position`, no `top/right/bottom/left`, no `z-index`, no `display:none`
default for `.cheffy-root` anywhere in the compiled CSS.

**Net effect today:** `#cheffy` renders as a plain in-flow block at the very end of
`<body>` on every page -- visible (idle state shows neutral eyes + closed mouth via the
existing display:block state rules), full-width per default block/button styling, no
docking, no z-index, no hide-until-JS gate. This is true **both with and without JS**
(JS never touches visibility/positioning; JS only flips `data-state` and toggles the
panel's `hidden` attribute). Criterion 1 is currently 0% implemented -- not a tweak,
a from-scratch addition.

One partial mitigation already in place: `CheffyPanel.astro:39` gives `#cheffy-panel`
the native HTML `hidden` attribute by default, so the dialogue panel itself is
correctly inert without JS (browsers hide `[hidden]` natively, no CSS/JS needed). Only
the root `#cheffy` container (icon + toggle button) is the open problem.

## (b) What the fixed/corner/z-index contract concretely needs

Required per DoD criterion 1: `position:fixed`, docked to `data-corner` (default
bottom-right), z-indexed above page content, out of document flow, present on every
page.

Minimal CSS to add to `Cheffy.astro`'s existing `<style>` block (same file already
owns all other `#cheffy` state CSS -- keep it in one place, same pattern as the
existing `[data-state=...]` / `[data-expr-override=...]` attribute-selector style):

```css
.cheffy-root {
  position: fixed;
  z-index: <N>;              /* see below */
  /* display:none by default -- see (c), JS adds the reveal class */
}
.cheffy-root[data-corner="bottom-right"] { bottom: 1rem; right: 1rem; }
.cheffy-root[data-corner="bottom-left"]  { bottom: 1rem; left: 1rem; }
.cheffy-root[data-corner="top-right"]    { top: 1rem; right: 1rem; }
.cheffy-root[data-corner="top-left"]     { top: 1rem; left: 1rem; }
```

`position:fixed` alone already removes the box from normal document flow regardless of
`data-corner`, so "out of document flow" falls out for free once this lands -- no
separate mechanism needed.

**z-index ceiling, grounded in the actual codebase** (`grep -rn "z-index" src`):
- `StickyHeader.astro:140` -- `.sticky-header { position: fixed; ...; z-index: 100; }`
  (full-width fixed header, pinned to viewport top).
- `StickyHeader.astro:370` -- `.section-dropdown { position: absolute; ...; z-index: 10; }`
  (a dropdown menu, scoped inside the header's own stacking context, so it only needs
  to beat siblings within the header -- not a site-wide ceiling).
- **No modal component exists anywhere in this codebase today** (`grep -rln "modal|<dialog"
  src` -> zero hits). CHEFFY-SYSTEM.md's "above page content, below modals" is a
  forward-looking design note for a UI element that has not been built yet, not an
  existing constraint to code against.
- The only other z-index in the tree (`9999`/`10000`) is in `src/pages/cheffy-demo.astro`
  -- a standalone debug/demo harness page with its own ad hoc toggle overlay, unrelated
  to the real Layout-mounted `#cheffy` stacking contract (that page mounts the same
  `#cheffy` via `<Layout>` too, so whatever z-index Cheffy gets should still clear that
  page's own content, but the 9999/10000 values belong to the demo page's *own* debug
  UI, not a ceiling Cheffy must respect).
- **Recommendation:** give `.cheffy-root` a z-index clearly above the sticky header
  (`>100`, e.g. `200`) but with headroom below a conventional modal tier (commonly
  `1000+`). This satisfies "above page content" now and leaves room for "below modals"
  once a modal component is actually built -- there is nothing in the repo today that
  needs `#cheffy` to be *beneath*, so this is a forward-compat headroom choice, not a
  currently-enforced constraint. On `top-right`/`top-left` corners, this z-index also
  needs to clear the sticky header's own `z-index:100` since those corners spatially
  overlap the header's fixed band -- another reason `>100` is required, not just
  "above default body content."

## (c) The crux: JS-off "hidden/inert" + byte-identical to master

**Current mechanism: none.** There is no JS-added class, no default-hidden CSS rule,
and no `<noscript>` fallback anywhere in `Cheffy.astro` gating `#cheffy`'s visibility.
The client `<script>` block (lines 187-257) only ever touches `data-state` and the
panel's `hidden` attribute -- it never adds/removes a visibility class on `#cheffy`
itself. So today: JS-on and JS-off render **identically** (both fully visible,
unstyled, in-flow) -- which is itself proof the "hidden without JS" contract is
unimplemented, not just imperfect.

**What's needed -- the standard default-hidden / JS-reveals pattern**, minimal and
consistent with the file's existing conventions (it already timestamps state via a
`data-*` attribute the client script sets, e.g. `data-state`):

1. CSS default: `.cheffy-root { display: none; ... }` (folded into the same rule as
   the `position:fixed` block in (b)).
2. In the existing `initCheffy()` function (`Cheffy.astro:205`), as close to the top as
   possible (right after the `if (!root) return` / `!toggle || !panel` early-outs, so a
   later error can't leave it half-hidden-half-broken), add:
   `root.classList.add('cheffy-ready');` -- or equivalently a `data-js-ready` attribute,
   matching the file's existing `data-*` idiom.
3. CSS reveal: `.cheffy-root.cheffy-ready { display: block; }` (or `flex`, whatever the
   final layout of the toggle button needs).

This directly satisfies "hidden/inert": with JS off, `display:none` -> zero box, zero
paint, zero layout impact, not focusable/tabbable (removed from tab order), and the
already-native `[hidden]` on `#cheffy-panel` is doubly inert underneath it. With JS on,
the reveal happens once `initCheffy()` confirms `#cheffy` + its required children
(`.cheffy-toggle`, `#cheffy-panel`) actually exist -- so a page where Cheffy's DOM is
malformed/missing stays correctly hidden rather than showing a broken half-built
widget (this already matches the function's existing `if (!root) return` /
`if (!toggle || !panel) return` fail-safe pattern).

**On "byte-identical to master":** since master has no Cheffy markup at all, raw HTML
source bytes can never match. Read pragmatically (and consistent with
CHEFFY-SYSTEM.md's own Acceptance section: "behaves exactly like master when Cheffy's
JS is disabled... no layout shift or console errors"), this means: with JS disabled,
the **rendered/visual page** (computed layout, visible content, interactive surface)
must be indistinguishable from master. `display:none` achieves that precisely --
CSS-off (no-CSS) is a separate, extremely unlikely edge case (this project ships
Tailwind + hand-authored `<style>` per component; a fully CSS-off browser would also
break the rest of the site's layout, not just Cheffy, so it's out of scope for this
DoD line, which is specifically about *JS*-off).

## Seam files (where the fix belongs)

- `src/components/Cheffy.astro` -- **the only file that needs source changes**:
  - `<style>` block (~line 118 onward): add `.cheffy-root` fixed-position + per-corner
    + z-index + default `display:none` rules, alongside the existing state-driven CSS.
  - `<script>` block (~`initCheffy()`, line 205): add the one-line `cheffy-ready`
    class/attribute toggle near the top of the function.
- `src/layouts/Layout.astro` -- no change needed; already mounts `<Cheffy />` once,
  present on every page via the shared layout (confirmed: `cheffy-demo.astro`, `index`,
  `weekend`, `lunch`, `fancai`, `archive/*` all route through this one `Layout.astro`).
- `tailwind.config.mjs` -- no change needed for this criterion; it's a plain
  hand-authored `<style>` block in the Astro component (scoped CSS), not a Tailwind
  utility class, so no new Tailwind token/utility is required. (Only used here to
  confirm the z-index ceiling picture -- no existing `zIndex` theme extension exists in
  `tailwind.config.mjs`, so there's no site-wide token to reuse/collide with.)
- `src/components/CheffyPanel.astro` -- no change needed; its native `[hidden]`
  attribute on `#cheffy-panel` already correctly no-JS-hides the dialogue panel. It
  will also inherit the parent `#cheffy`'s `display:none` when JS is off, so it's
  doubly covered.

## Risks / things to watch when building this

- Order matters: the `cheffy-ready` class add must happen **before** the existing
  `setState(initialStateFor(isNew))` call so there's no flash of default idle content
  before corner-docking CSS applies (cosmetic only, not a DoD blocker, but worth
  sequencing correctly since it's a one-line change either way).
- `display:none` on `.cheffy-root` must not collide with the per-state child
  `display:none/block` rules already scoped to `#cheffy[data-state=...] [data-expr=...]`
  etc. -- those are all descendant selectors scoped under `#cheffy[data-state=...]`, so
  they're irrelevant while the parent itself is `display:none` (no cascade conflict;
  child display rules simply don't matter until the parent is shown).
- The reduced-motion sweep (`@media (prefers-reduced-motion: reduce) { #cheffy, #cheffy * {...} }`,
  line 177-184) and the blink `@media (prefers-reduced-motion: no-preference)` rule
  (line 150-156) are untouched by this change -- they only affect animation timing on
  an already-visible element, no interaction with the new `display:none`/`cheffy-ready`
  gate.
- No modal component exists yet in this repo, so "below modals" cannot be verified
  against a real element -- flag this as a documentation/forward-compat note rather
  than a testable constraint for this PR.
- `npm run build` (`astro check && astro build`) currently fails `astro check` due to
  **pre-existing TypeScript errors in `src/pages/cheffy-demo.astro`** (missing
  `cheffySetState` type on `HTMLElement`, ~4 errors) -- unrelated to this criterion,
  not touched by this research, and not part of the presentation-only positioning
  fix. `npx astro build` (skipping the `astro check` gate) succeeds cleanly and was
  used to produce the `dist/` output inspected above. Flag this to whoever builds
  Criterion 1 (or a later part) so it doesn't block their `npm run build` step
  unexpectedly -- it's a pre-existing gap in this branch's demo page, not something
  this research introduced.
