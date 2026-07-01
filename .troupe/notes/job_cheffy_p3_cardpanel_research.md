# Research: Cheffy floating-card panel (Part 3 / crit3)

## Confirmed current state (read source directly)

- `src/components/CheffyPanel.astro` has **no `<style>` block** at all today (37-252
  is markup + `<script>` only). Confirmed by full read.
- `src/components/Cheffy.astro`'s single `<style>` block (lines 118-264) covers
  **only** part 1 (mount contract, `.cheffy-root`) and part 2 (hat-bubble toggle,
  expression swap, idle bob/blink, and the part-7 reduced-motion sweep). It has
  **zero** `.cheffy-panel` / `#cheffy-panel` rules.
- Verdict: the part-3 floating-card CSS must land as a **brand-new `<style>`
  block appended to `CheffyPanel.astro`**. Do **not** touch Cheffy.astro's style
  block -- it is scoped to parts 1-2 and already carries the reduced-motion sweep
  that (per finding below) already covers the panel.

## (a) Open/close animation seam -- recommended approach, zero Cheffy.astro edits

**Recommendation: approach (1), `@starting-style` + `transition-behavior:
allow-discrete`, applied directly to `#cheffy-panel` (and the new scrim
element) keyed off the existing `[hidden]` attribute.** This achieves a smooth
open AND close with zero Cheffy.astro edits.

Grounding (web-verified, not memory):
- `@starting-style` and `transition-behavior: allow-discrete` reached **Baseline
  Newly available** in August 2024 (Chrome/Edge 116+, Safari 17.4+, Firefox
  129+) and are now solid Baseline-safe for production as of mid-2026.
  Sources: [web.dev -- Now in Baseline: animating entry effects](https://web.dev/blog/baseline-entry-animations),
  [Chrome for Developers -- Four new CSS features for smooth entry and exit animations](https://developer.chrome.com/blog/entry-exit-animations),
  [MDN -- transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transition-behavior).
- The repo has no `.browserslistrc` / browserslist config pinning an older
  floor, so there is no documented reason to avoid this. **GAP:** no explicit
  min-browser-support policy exists in the repo; flagging as an assumption
  (Baseline-2024 is fine) rather than a verified project requirement.
- Mechanism (per the same sources, Smashing Magazine's "Transitioning
  Top-Layer Entries And The Display Property In CSS" confirms the pattern):
  when `display` is listed in `transition-behavior: allow-discrete`'s
  `transition-property`, the UA (a) applies the new `display` value
  immediately when transitioning *away* from `none` so other properties can
  animate in (using `@starting-style` for the "before" values), and (b) defers
  applying `display: none` until the transition finishes when transitioning
  *toward* `none`, so exit animations are visible. This gives a genuinely
  symmetric smooth open AND close.

Concrete CSS (illustrative, for the Planner -- exact values TBD by Planner/
Builder, not prescribed further than the pattern):

```css
#cheffy-panel {
  /* closed baseline -- matches the UA's [hidden] { display: none } */
  opacity: 0;
  transform: translateY(0.75rem) scale(0.97);
  transition: opacity 0.2s ease, transform 0.2s ease,
              display 0.2s allow-discrete;
}
#cheffy-panel:not([hidden]) {
  opacity: 1;
  transform: translateY(0) scale(1);
}
@starting-style {
  #cheffy-panel:not([hidden]) {
    opacity: 0;
    transform: translateY(0.75rem) scale(0.97);
  }
}
```

Notes on this pattern:
- `overlay` is **not** needed in `transition-property` here -- `overlay` only
  matters for actual top-layer elements (`<dialog>`, popovers). `#cheffy-panel`
  is a plain `<div>`, so only `display allow-discrete` is required.
- `#cheffy-panel:not([hidden])` needs to win specificity over the UA's
  `[hidden] { display: none }` rule when NOT hidden; an ID selector
  (`#cheffy-panel:not([hidden])`) safely out-specifies the UA's plain
  attribute selector, and when `hidden` IS present the `:not([hidden])` rule
  simply doesn't match, so the UA rule governs display:none as before -- no
  conflict either direction.
- Scoped entirely inside `#cheffy-panel`'s own style rules -- driven purely by
  the `hidden` attribute Cheffy.astro's toggle already flips. **Zero
  Cheffy.astro edits required.** The panel's script already observes `hidden`
  mutations for content re-render (line 237-244) and explicitly must not
  touch `hidden`/`aria-expanded` -- this stays true; CSS alone drives the
  motion.
- Approaches (2) (`aria-expanded`/`data-state` driven) and (3) (a genuine
  Cheffy.astro hook) are **not needed** -- approach (1) meets the "zero
  Cheffy.astro edits" bar directly on the existing seam, so they're rejected
  as unnecessary complexity, not because they're infeasible. No Director
  re-scope needed for this criterion.

## (b) Scrim/backdrop

- No scrim element exists today (confirmed by read of both files). New markup
  belongs inside `CheffyPanel.astro`'s template, e.g. a sibling `<div
  id="cheffy-scrim" class="cheffy-scrim" hidden></div>` (or reuse the same
  `hidden` toggle target -- see below) placed before/around `#cheffy-panel`.
- **z-index:** confirmed via `grep -rn "z-index"` across `src/` -- only two
  production z-indices exist: `StickyHeader.astro` uses `100`, and
  `Cheffy.astro`'s `.cheffy-root.cheffy-ready` uses `200` (the
  `cheffy-demo.astro` page's `9999`/`10000` are a non-shipping dev harness,
  irrelevant). `#cheffy` (`.cheffy-root.cheffy-ready`) is `position: fixed;
  z-index: 200`, which **establishes a new stacking context** -- so the scrim
  and card, as descendants of `#cheffy`, only need z-index values relative to
  each other and to the `.cheffy-toggle` button (also a sibling inside
  `#cheffy`), not relative to the rest of the page (page content and
  StickyHeader's `100` are already behind `#cheffy`'s `200` context as a
  whole). Recommend scrim `z-index: 1` and card `z-index: 2` *within* that
  local context (or simply rely on DOM order -- scrim before card -- since no
  other z-indexed siblings exist inside `#cheffy`). No new global z-index
  scale needed.
- **GAP:** the mascot's own `.cheffy-toggle` button sits in the DOM *before*
  `<CheffyPanel />` inside `#cheffy` (Cheffy.astro line 77 then line 112), so
  a full-viewport scrim inserted inside CheffyPanel.astro will visually cover
  the toggle button while open. This is functionally fine for closing
  (dialogue's `close` action and the toggle-click programmatic path both call
  `toggle.click()` directly on the element reference, not via a user click on
  a visible toggle), but it is a UX/visual question (does the mascot stay
  peeking out beside the open card, or is it expected to be covered?) that the
  Planner should decide -- not resolved by this research, flagged as an open
  design choice, not a technical blocker.
- **Click-scrim-to-close routing:** attach a `click` listener on the scrim
  element inside CheffyPanel.astro's existing `<script>` block that calls the
  *same* `toggle.click()` path already used by the `close` action (line
  229-231) and by the observer's `close: () => { if (toggle...) toggle.click()
  }` ctx builder (line 135-137). This reuses the existing single owned close
  path -- it does not introduce a second way to mutate `hidden`/`aria-expanded`.
  CHEFFY-SYSTEM.md line 39 explicitly specifies "click-out or a close action
  collapses it" -- confirming click-out-to-close is a spec'd requirement, not
  a design choice.

## (c) Inset clamp sizing (crux of crit3)

Goal restated: ONE floating card, always inset from all four viewport edges
over the scrim, same card at every size (never a distinct fullscreen mode),
that reads as a small floating corner card on desktop/tablet and near-fills
(but still shows visible scrim margins) on a narrow phone.

Grounded technique (web.dev "Clamping card" pattern + general `clamp()`/`min()`
practice, both web-verified): size the card with `width`/`height` (or
`max-width`/`max-height`) driven by `min()` against the viewport minus a fixed
inset, clamped between a floor and a ceiling with `clamp()`, and position via
`inset` (not per-property `top/right/bottom/left`) so the "always inset from
all edges" behavior is a single declaration.

Recommended CSS shape:

```css
.cheffy-scrim {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.35); /* page visible around card edges */
}

.cheffy-panel {
  position: fixed;
  inset: 1.25rem; /* uniform inset from ALL four edges -- the "floating" gap */
  margin: auto 1.25rem 1.25rem auto; /* anchor toward the mascot's docked corner */
  width: min(22rem, 100% - 2.5rem);   /* 100% here = the inset-shrunk box */
  height: min(28rem, 100% - 2.5rem);
  max-width: clamp(18rem, 90vw, 22rem);
  max-height: clamp(20rem, 80vh, 28rem);
}
```

Concrete numbers at the three requested viewports (illustrative target
values for the Planner/Builder, using a ~1.25rem/20px uniform inset and a
~352px/22rem card as the "comfortable floating" target width, ~448px/28rem
target height -- these are recommended STARTING values, not locked):

| Viewport | Behavior | Resulting card box (approx) |
|---|---|---|
| ~390px (phone) | card min-width (22rem/352px) > viewport minus insets (390 - 40 = 350px), so `min()` clamps down to the inset-bound box | ~350px wide x viewport-bound height, 20px margins on all 4 sides, scrim visible as a thin border -- still the SAME card, never fullscreen |
| ~820px (tablet) | comfortably fits; card renders at its natural ~352px width, docked toward the mascot's corner with visible page/scrim around 3 sides | ~352px x ~448px floating corner card |
| ~1440px (desktop) | same as tablet -- card does not grow past its `max-width`/`max-height` ceiling; more scrim visible around it | ~352px x ~448px floating corner card, same as tablet |

Key point proven by the `min(target, 100% - insets)` formula: the card
**always** keeps a positive margin to the viewport edge (never touches edge to
edge) because the `100% - insets` term is evaluated against the `inset`-
shrunk containing box, not the raw viewport -- so even the narrowest phone
still shows the scrim as a visible border, satisfying "never a distinct
fullscreen mode" without a breakpoint/media-query fork.

**Anchor:** recommend anchoring toward the mascot's docked corner (read
`data-corner` from `#cheffy`, e.g. via a CSS attribute selector chain
`#cheffy[data-corner="bottom-right"] .cheffy-panel { margin: auto 0 0
auto; }` etc., one rule per corner value mirroring Cheffy.astro's existing
four-corner rule set at lines 132-147) rather than a viewport-centered card --
this keeps the card visually anchored to the mascot that opened it, matching
"expands into a small dialogue panel" from CHEFFY-SYSTEM.md line 39. This can
be done entirely with CSS attribute selectors inside CheffyPanel.astro's new
style block reading the `data-corner` attribute Cheffy.astro already sets on
`#cheffy` (line 72) -- **zero Cheffy.astro edits**, since attribute selectors
just read existing DOM state.
**GAP:** exact px/rem inset and min/max targets above are a reasonable
starting point grounded in the pattern, not pixel-perfect final values --
Planner/Builder should treat the *formula* (`min(target, 100% - 2*inset)`
sized card, uniform `inset`, corner-anchored `margin: auto`) as the load-
bearing spec, and the specific numbers as tunable.

## (d) Close affordance

- The dialogue tree already has a spec'd `close` option/action
  (CHEFFY-SYSTEM.md line 82: `close -- collapse the panel back to idle`) and
  CheffyPanel.astro already registers it (line 229-231), routed through
  `toggle.click()`.
- Click-scrim-to-close is separately spec'd (CHEFFY-SYSTEM.md line 39:
  "click-out or a close action collapses it") -- these are two DISTINCT
  requirements, not redundant: "close action" = the dialogue's close option;
  "click-out" = the scrim.
- **Recommendation: a visible X close control is not strictly required by
  spec**, but is good practice for discoverability since a floating card with
  a scrim is a common "modal-like" pattern where users expect a corner X. If
  added, it should live in CheffyPanel.astro's markup/style only, and its
  click handler should call the exact same `toggle.click()` path (no third
  close mechanism). This is a UX nicety, not a DoD-crit3 requirement --
  flagging as optional for the Planner to decide budget on, not a hard
  research finding either way.

## (e) Zero layout shift + reduced motion

- Card/scrim motion in the recommended approach is `opacity` + `transform`
  only (translateY/scale) -- confirmed no `width`/`height`/`top`/`left`
  animation in the proposed CSS, so no reflow of surrounding page content
  (the panel/scrim are `position: fixed`, entirely out of normal flow
  already, so even if they did animate size it would not shift other page
  content -- but keeping to transform/opacity is still correct for GPU-cheap,
  jank-free motion within the card/scrim themselves).
- **Reduced-motion coverage -- confirmed via direct read:** Cheffy.astro's
  existing sweep (lines 256-263) is:
  ```css
  @media (prefers-reduced-motion: reduce) {
    #cheffy,
    #cheffy * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
  `#cheffy-panel` (and any new scrim element, as long as it is rendered as a
  descendant of `#cheffy` -- which it will be, since `<CheffyPanel />` is
  mounted inside `#cheffy` at Cheffy.astro line 112) is matched by `#cheffy *`
  and gets `transition-duration: 0.01ms !important`. **This selector already
  covers ALL of CheffyPanel.astro's new CSS with zero additional rule
  needed**, because it targets every descendant of `#cheffy` regardless of
  which file declares the rule -- CSS specificity/cascade doesn't care which
  `<style>` block a selector lives in. **No panel-scoped reduced-motion rule
  is required; this sweep already does the job.**
  - Caveat: `transition-duration: 0.01ms !important` still leaves the
    `display: none <-> block` discrete swap functioning (display isn't a
    duration-scaled property, it just switches at the (near-instant)
    transition boundary), so open/close visibility and dialogue-node content
    swaps stay fully functional under reduced motion, only the animated
    easing collapses to effectively instant -- matches the documented
    "reduce, not remove" pattern in the comment directly above the sweep
    (lines 250-255).

## Seam summary for the Planner/Builder

- **New file surface:** `src/components/CheffyPanel.astro` gets (1) a new
  `<style>` block (opacity/transform/display-allow-discrete rules for
  `#cheffy-panel`, new `.cheffy-scrim` rules, corner-anchor rules keyed off
  `#cheffy[data-corner=...]`), (2) new scrim markup in the existing template,
  and (3) a small addition to the existing `<script>` block (a scrim `click`
  listener calling the existing `toggle.click()` close path -- reusing, not
  duplicating, the close mechanism).
- **Zero edits to `Cheffy.astro`** across all five sub-questions (a-e) -- the
  animation seam, scrim, sizing, close routing, and reduced-motion all key off
  state Cheffy.astro already exposes (`hidden` attribute, `data-corner`
  attribute, the `#cheffy *` reduced-motion sweep) without needing new hooks.
- **No Director re-scope needed** -- a smooth close IS achievable without a
  toggle hook (contrary to the objective's fallback contingency), because
  `display: allow-discrete` handles the exit-transition timing natively.
- **Risks / things to double check at build time:**
  1. GAP: mascot-toggle-visually-covered-by-scrim UX question (section b) --
     functionally harmless, but Planner should decide if the mascot should
     peek out or not.
  2. GAP: no repo-level browserslist floor exists to formally confirm the
     Baseline-2024 CSS features are an acceptable minimum support bar for
     this project; treated as a reasonable default given no contrary policy
     found.
  3. GAP: the exact clamp/inset pixel values in section (c) are a
     well-grounded starting formula, not final tuned numbers -- expect the
     Builder to adjust to match brand card aesthetics.
  4. JS-off parity: with no `<style>` block today, JS-off users see the panel
     only via the `hidden` attribute (native browser behavior, no CSS
     needed) -- the new CSS is purely a progressive enhancement for the
     animated/scrimmed state when JS toggles `hidden`; JS-off parity is
     unaffected since Cheffy is already entirely opt-in/enhancement-only per
     CHEFFY-SYSTEM.md line 15-17.
