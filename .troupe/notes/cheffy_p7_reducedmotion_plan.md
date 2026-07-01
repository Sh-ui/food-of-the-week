# Part 7 -- reduced-motion sweep: BUILD BLUEPRINT

JOB_ID: cheffy_p7_reducedmotion_plan
Branch: troupe/fully-build-the-cheffy-module-on
Grounding: notes/cheffy_p7_reducedmotion_research.md (full inventory of the motion surface)

## TL;DR for the builder

CSS-only sweep. Add ONE `@media (prefers-reduced-motion: reduce)` guard block to the
`<style>` of `src/components/Cheffy.astro`. That is the entire change. Do NOT touch
`CheffyPanel.astro` (it has no `<style>` block and no motion -- see note below). Do NOT
touch `Layout.astro` (part 9). Do NOT change the existing `cheffy-blink` / `no-preference`
block -- it is already correct; leave it byte-for-byte.

## Why this is small (read before you doubt the plan)

The research (auto-attached) verified via full-file reads + repo-wide grep that the ENTIRE
Cheffy motion surface is exactly ONE animation:

- `@keyframes cheffy-blink` + its `@media (prefers-reduced-motion: no-preference)` gate,
  Cheffy.astro lines 146-156. It animates `transform: scaleY()` on the idle eyes only.
  It is ALREADY reduced-motion-safe: under `reduce`, the `no-preference` media query does
  not match, so the animation is simply never applied. No layout shift (transform on an
  SVG circle with `transform-box: fill-box`).

Everything else the OBJECTIVE listed (dot pulse, processing spinner, panel open/close
transition, dialogue/expression transitions, hover/focus transitions) DOES NOT EXIST in the
code. The dot, expression/mouth swaps and panel open/close are all instant, non-animated
state changes (`display` toggles at Cheffy.astro:126-169; `panel.hidden` flip at the JS
open/close, Cheffy.astro:215-226). There is nothing there to neutralize.

So the sweep = (1) leave the one correct existing gate alone, and (2) add a single
defensive cross-cutting guard that catches any motion on the Cheffy subtree -- current
(none beyond the gated blink) or accidentally re-introduced later -- without ever hiding
content or shifting layout. This satisfies CHEFFY-SYSTEM.md line 40 ("no idle motion" under
reduced-motion) and line 147 ("prefers-reduced-motion honored; no layout shift") for the
whole Cheffy surface, not just the one animation.

## Step 1 -- add the guard block (Cheffy.astro `<style>` ONLY)

Insert the following block inside the existing `<style>` in `src/components/Cheffy.astro`
(the block spans lines 118-170). Put it at the END of the `<style>`, AFTER the existing
`data-expr-override` rules (i.e. after current line 169, before the closing `</style>` on
line 170). Do NOT place it before/inside the existing `no-preference` block.

```css
  /* --- reduced-motion sweep (part 7): neutralize ALL motion on the Cheffy    */
  /* subtree without hiding content or shifting layout. Scoped to #cheffy so it */
  /* never reaches the rest of the page (Layout is part 9). "Reduce, not remove"*/
  /* pattern: animations collapse to an instant end-state (0.01ms, single run)  */
  /* and transitions become instant -- opacity/visibility/display state swaps   */
  /* stay fully functional, only their motion stops.                            */
  @media (prefers-reduced-motion: reduce) {
    #cheffy,
    #cheffy * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
```

### Why these exact declarations

- `animation-duration: 0.01ms !important; animation-iteration-count: 1 !important` -- the
  canonical "reduce not remove" pattern (MDN / web.dev): any animation runs once, instantly
  reaching its end-state, instead of never running. Safer than blanket `animation: none`
  because if a future animation encodes a meaningful end-state, that end-state is still
  reached. For the current `cheffy-blink` this is moot (it is not applied under `reduce` at
  all via the `no-preference` gate) -- the guard is a catch-all, not a fix for a live bug.
- `transition-duration: 0.01ms !important` -- makes any transition instant. There are zero
  transitions today; this is purely defensive so a later hover/focus/reveal transition on
  this subtree is auto-covered.
- `!important` -- required so the guard wins over any inline `style="animation:..."` or
  more-specific rule a later part might add. This is the published defensive pattern; it is
  safe here because the block is scoped to `#cheffy` and only touches timing properties.
- Scope `#cheffy, #cheffy *` (NOT global `*`) -- keeps the sweep inside the Cheffy boundary.
  Do not broaden to the whole document; page-level reduced-motion is part 9 (Layout).
- Astro scopes component `<style>` automatically; `#cheffy` and its SVG children all render
  inside this component, so scoping applies cleanly. `CheffyPanel` elements are a separate
  scope, but they have no motion, so they need no coverage.

### Do NOT
- Do NOT edit or "modernize" the existing `@keyframes cheffy-blink` block or its
  `@media (prefers-reduced-motion: no-preference)` wrapper (lines 146-156). It is already
  correct; changing it is churn and risks regressing the idle-blink acceptance.
- Do NOT use `display: none`, `visibility: hidden`, or collapse any `height`/`width`/
  `max-height` in the guard -- that would hide content or shift layout. Timing props only.
- Do NOT add JS, HTML/DOM changes, new files, or new elements.

## Step 2 -- CheffyPanel.astro: NO EDIT (documented no-op)

`src/components/CheffyPanel.astro` has NO `<style>` block and NO CSS animation/transition
anywhere (verified in research). Do NOT create a `<style>` block there just to satisfy the
"both files" wording of the brief -- an empty guard over a file with zero motion is pure
churn. The panel's open/close is a `panel.hidden` attribute flip (instant, owned by
Cheffy.astro's JS) and its dialogue re-renders are instant `replaceChildren()` DOM swaps --
both already reduced-motion-safe by construction. Leave this file untouched.

## Acceptance (checkable)

1. `src/components/Cheffy.astro` gains exactly ONE new `@media (prefers-reduced-motion:
   reduce)` block, scoped to `#cheffy, #cheffy *`, containing only `animation-duration`,
   `animation-iteration-count`, and `transition-duration` declarations. No other prop.
2. The existing lines 146-156 (`cheffy-blink` + `no-preference` gate) are UNCHANGED.
3. `src/components/CheffyPanel.astro` is UNCHANGED (no `<style>` block created).
4. `src/layouts/Layout.astro` is UNCHANGED.
5. No JS, no DOM/HTML edits, no new files.
6. `npm run build` succeeds with no errors.
7. Manual/dev check with OS "reduce motion" ON (macOS: System Settings > Accessibility >
   Display > Reduce motion): the idle mascot eyes do NOT blink; the notification dot,
   expression/mouth swaps, and panel open/close still work and appear INSTANTLY (nothing
   hidden, no layout shift, no console errors). With reduce OFF, the idle blink still runs.

## Gotchas

- The guard and the existing `no-preference` block are mutually exclusive media queries --
  they never both apply, so there is no cascade conflict. Confirm you did not accidentally
  nest one inside the other.
- Keep hyphen-minus only in comments/CSS (no Unicode dashes).
- Astro scoped-style: the selector `#cheffy *` is fine; do not switch it to a global
  `:where(*)` or unscoped selector that would leak past the Cheffy subtree.
