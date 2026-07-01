# BUILD blueprint -- Cheffy floating card panel (DoD criterion 3)

**For the next builder (Sonnet).** Presentation-only. Edit **ONLY**
`src/components/CheffyPanel.astro`: add ONE new `<style>` block (none exists today)
plus ONE scrim `<div>` in the markup. **ZERO** edits to `Cheffy.astro` (parts 1-2 own
it). **ZERO** behavior-JS changes -- do not touch CheffyPanel's `<script>`, do not add
any `panel.hidden` / `aria-expanded` mutation, do not re-implement open/close.

## Tagging / boundary (state this, do not act on it)
- This BUILD is deliberately **NOT `--criterion`-tagged** (`criterion: null`). Criterion 3
  is a **visual** criterion signed off ONLY by the later Opus 5b visual-review. It stays
  `pending` through build + test + audit; only the visual-review writes `done`. The
  build-audit here falsifies the *mechanical* acceptance below, not the aesthetic verdict.
- **Escalate trigger (research already cleared it):** the only sanctioned escalate for this
  part is "smooth CLOSE impossible without a `Cheffy.astro` toggle hook." Research finding (a)
  proved close animates with **zero** `Cheffy.astro` edits via `@starting-style` +
  `transition-behavior: allow-discrete` keyed off the native `[hidden]` attribute. So **do NOT
  escalate and do NOT edit `Cheffy.astro`.** If you find yourself wanting a toggle hook in
  `Cheffy.astro`, stop and escalate instead of editing the shared file.

## Verified ground truth (why the CSS-only approach is sound)
- `.cheffy-root` (`#cheffy`) = `position: fixed; z-index: 200`, corner-docked at `1.5rem`.
  It has **no** `transform` / `filter` / `will-change` / `contain` (confirmed in
  `Cheffy.astro` lines 118-264). Therefore a `position: fixed` descendant resolves its
  containing block against the **viewport**, not `#cheffy`. The card + scrim will span/inset
  the full viewport correctly.
  - **GOTCHA to preserve:** if any later part adds `transform`/`filter`/`will-change`/`contain`
    to `#cheffy` or an ancestor, `position: fixed` would collapse to that ancestor and break
    the overlay. Do not introduce any such property on `#cheffy` here. (Note it; do not fix.)
- `#cheffy` establishes the stacking context (z 200). Scrim + card z-index are only meaningful
  **relative to each other inside** `#cheffy` (research (b)). Page content sits below z 200,
  so the overlay is above the page; the mascot toggle is a sibling in the same context.
- `#cheffy-panel` renders with `hidden` in SSR (line 39). JS-off: `#cheffy` stays
  `display:none` (no `.cheffy-ready`), so panel + scrim never show -> site byte-identical to
  master. This is the JS-off acceptance path; the new CSS must not change it.
- Reduced motion is ALREADY covered: `Cheffy.astro` lines 256-263 sweep `#cheffy, #cheffy *`
  with `transition-duration: 0.01ms !important`. Panel + scrim are inside `#cheffy`, so their
  transitions collapse to instant automatically. The sweep sets *duration*, not
  `transition: none`, so `allow-discrete` display swaps still fire (just instantly). **Do NOT
  add a panel-scoped `prefers-reduced-motion` rule** (research (e)) -- it would be redundant.
- Tokens available (`src/styles/global.css` 14-27): `--color-primary`, `--color-secondary`,
  `--color-accent`, `--color-text`, `--color-text-light`, `--color-text-muted`, `--color-bg`,
  `--color-bg-alt`, `--color-border`, `--color-cooked-*`. All solid. **Use these ONLY -- no
  new tokens (that is crit4).** Scrim translucency comes from
  `color-mix(in srgb, var(--color-text) <pct>%, transparent)`, which introduces no token.

## Design overview
- `#cheffy-panel` **is** the floating inset card (no wrapper -- keeps markup minimal and does
  not disturb the JS that queries `.cheffy-node`/`.cheffy-options` inside it).
- Add ONE sibling `<div class="cheffy-scrim" aria-hidden="true">` **immediately AFTER** the
  `#cheffy-panel` closing `</div>` (so the CSS general-sibling combinator `~` can key its
  visibility off `#cheffy-panel[hidden]` with zero JS). Place it before/after the
  `#cheffy-archive-index` script -- either is fine since that script is display:none; simplest
  is right after `</div>` of the panel, before the `<script type="application/json"...>` line.
  **Do not** put the scrim inside `#cheffy-panel` (it must paint behind the card as a separate
  fixed layer, and it must survive `renderNode`'s `replaceChildren`, which only wipes
  `.cheffy-node`).

## Ordered build steps

### Step 1 -- add the scrim markup (minimal)
In `CheffyPanel.astro`, immediately after the `</div>` that closes `#cheffy-panel`
(currently line 64) add:
```astro
<div class="cheffy-scrim" aria-hidden="true"></div>
```
Nothing else in the markup changes. `aria-hidden="true"` because the scrim is decorative; the
dialog semantics live on `#cheffy-panel[role="dialog"]`.

### Step 2 -- add the `<style>` block (the whole deliverable)
Append a single `<style>` block to `CheffyPanel.astro` (Astro scopes it to this component).
Author it in these sub-sections:

**2a. Design tokens (component-local custom props, NOT global `--color-*` tokens):**
```css
#cheffy-panel {
  --cheffy-inset: clamp(0.75rem, 4vw, 1.5rem); /* uniform gap from every edge */
  --cheffy-card-w: 24rem;   /* 384px target width  */
  --cheffy-card-h: 34rem;   /* 544px target height */
}
```
These are private layout vars (allowed -- they are not color tokens; crit4 only forbids new
`--color-*`).

**2b. The inset floating card -- size that never goes fullscreen (research (c)):**
```css
#cheffy-panel {
  position: fixed;
  box-sizing: border-box;
  z-index: 2;                                   /* above scrim, inside #cheffy (z200) */
  width:  min(var(--cheffy-card-w), calc(100vw  - 2 * var(--cheffy-inset)));
  height: min(var(--cheffy-card-h), calc(100dvh - 2 * var(--cheffy-inset)));
  max-width:  calc(100vw  - 2 * var(--cheffy-inset)); /* redundant guard: never edge-to-edge */
  max-height: calc(100dvh - 2 * var(--cheffy-inset));
  display: flex;              /* base display for allow-discrete (see 2d) */
  flex-direction: column;
  overflow: auto;             /* long dialogue scrolls INSIDE the card */
  padding: 1rem;
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.22);
}
```
The `min(target, 100% - 2*inset)` formula is the crux: the card is the *smaller* of its target
size and the available space, so it is ALWAYS inset from all four edges by `--cheffy-inset`,
and it is the SAME inset card at every width -- never a fullscreen mode. `100dvh` (not `vh`)
so mobile browser chrome does not overflow the card.

**2c. Corner anchoring -- follow the mascot's `data-corner` (research (c)):**
`#cheffy-panel` is inside `#cheffy`, so select on the ancestor's attribute:
```css
#cheffy[data-corner="bottom-right"] #cheffy-panel { right: var(--cheffy-inset); bottom: var(--cheffy-inset); }
#cheffy[data-corner="bottom-left"]  #cheffy-panel { left:  var(--cheffy-inset); bottom: var(--cheffy-inset); }
#cheffy[data-corner="top-right"]    #cheffy-panel { right: var(--cheffy-inset); top:    var(--cheffy-inset); }
#cheffy[data-corner="top-left"]     #cheffy-panel { left:  var(--cheffy-inset); top:    var(--cheffy-inset); }
```
Default page uses `bottom-right` (`Cheffy.astro` line 28). Because the card is `position:fixed`
with only two edges pinned, the other two edges fall where its `width`/`height` end -- so the
scrim margin is guaranteed on all four sides.

**2d. Open/close animation -- zero `Cheffy.astro` edits (research (a)):**
```css
#cheffy-panel {
  /* (add to the same base rule as 2b) */
  transition: opacity 0.22s ease, transform 0.22s ease, display 0.22s allow-discrete;
}
@starting-style {
  #cheffy-panel:not([hidden]) { opacity: 0; transform: translateY(8px) scale(0.98); }
}
#cheffy-panel[hidden] {
  display: none;                 /* specificity 1,1,0 beats UA [hidden] 0,1,0 */
  opacity: 0;
  transform: translateY(8px) scale(0.98);
  pointer-events: none;
}
```
Open (`hidden` removed): `display:flex` applies immediately, opacity/transform animate up from
`@starting-style`. Close (`hidden` added): opacity/transform animate to the hidden values, then
`display:none` is deferred to transition-end by `allow-discrete`. **transform + opacity only ->
zero layout shift.** Under `prefers-reduced-motion: reduce`, the inherited `#cheffy *` sweep
forces `transition-duration: 0.01ms`, so both swaps are instant but still functional.

**2e. The scrim -- fixed dim layer, page visible around the card (research (b)):**
```css
.cheffy-scrim {
  position: fixed;
  inset: 0;
  z-index: 1;                    /* below card (z2), above page (page < z200) */
  display: block;                /* base display for allow-discrete */
  background: color-mix(in srgb, var(--color-text) 45%, transparent);
  transition: opacity 0.22s ease, display 0.22s allow-discrete;
}
@starting-style {
  #cheffy-panel:not([hidden]) ~ .cheffy-scrim { opacity: 0; }
}
#cheffy-panel[hidden] ~ .cheffy-scrim {
  display: none;
  opacity: 0;
  pointer-events: none;
}
```
Because SSR ships `#cheffy-panel[hidden]`, the scrim starts `display:none` -- correct default.
When the panel opens (`[hidden]` removed), the `~` rule stops matching, so the scrim reverts to
its base `display:block; opacity:1` and fades in. The `45%` mix keeps the page visible through
the scrim. Tune `40-55%` for taste; keep it a `color-mix` of `--color-text` + `transparent`
(no new token).

### Step 3 -- close affordance (research (d)) -- READ THE DECISION BELOW
The DoD needs a "clear close control routed through the existing close action/toggle path (no
new `panel.hidden` / `aria-expanded` mutation)." Two close paths ALREADY exist and require zero
new JS:
1. The dialogue **"close" option** -- data-driven; the `close` action is already registered
   (`CheffyPanel.astro` lines 229-231) and calls the existing `toggle.click()`. This is the
   primary in-panel close control. Confirm `src/data/cheffy-dialogue.json` exposes a close
   option on the start node; if it does, no work is needed. (Do NOT add JS to create one.)
2. The **mascot toggle** -- clicking it while open fires the existing `closePanel()`
   (`Cheffy.astro` 317-325). To make the mascot usable as a "click the mascot to dismiss"
   affordance while the scrim is up, raise it above the scrim in the NEW style block (CSS only,
   no JS, no `Cheffy.astro` edit):
   ```css
   #cheffy .cheffy-toggle { position: relative; z-index: 3; }
   ```
   This keeps the mascot clickable above the scrim; clicking it routes through the existing
   toggle handler.

**A visible X is NOT required** (research (d): "optional UX, not DoD requirement"), and adding a
*functional* X is out of scope here: any static X placed outside `.cheffy-node` is ignored by
the existing delegation (it guards on `nodeContainer.contains(target)`, line 217) and one
placed inside `.cheffy-node` is destroyed by `renderNode`'s `replaceChildren` (line 168) -- so
a working X would require new JS, which this part forbids. **Do not add an X.**

### DECISION -- "click-scrim-to-close" (flagged for builder + auditor)
The objective mentions click-scrim-to-close "routed through the existing toggle/close path."
A true scrim-click handler needs a JS listener (CSS/HTML alone cannot fire `toggle.click()`;
`label[for]` does not activate a `<button>`, and the existing delegation is guarded off the
scrim). That collides with this part's hard "no behavior-JS changes / style block + markup
only" scope. **Resolution: implement the zero-JS design above** -- scrim as a visual dim layer,
close via the existing dialogue "close" option + the mascot toggle raised above the scrim
(Step 3). This satisfies EVERY falsifiable acceptance criterion below (scrim-click-close is NOT
among them) and stays strictly presentation-only. Do **not** add a scrim listener; if a later
review insists on literal scrim-click-close, that is a behavior-JS change for a different
(part-2-owned) rung, not this one.

## Acceptance (what the Sonnet build-audit must be able to falsify)
1. **Computed `position: fixed`** on BOTH `#cheffy-panel` and `.cheffy-scrim` (DevTools computed
   tab, panel open).
2. **Four-edge inset with non-zero scrim margins** at 390 / 820 / 1440px viewport widths -- the
   card touches no viewport edge; visible scrim band on all four sides.
3. **Size within the min/max clamp** at all three widths. Expected computed values
   (`--cheffy-inset = clamp(0.75rem, 4vw, 1.5rem)`, target 384x544):
   - **~390px:** inset ~= 4vw = ~15.6px (between 12-24px). Width = `min(384, 390 - 31.2)` =
     **~358.8px** (near-fills but still inset -- SAME card, NOT fullscreen). Height =
     `min(544, 100dvh - 31.2)`.
   - **~820px:** inset clamps to 24px (4vw=32.8 > 1.5rem). Width = `min(384, 820 - 48)` =
     **384px** -- a floating corner card.
   - **~1440px:** inset 24px. Width = **384px** -- a floating corner card.
   - At every width, `width <= 100vw - 2*inset` and `height <= 100dvh - 2*inset` (never
     edge-to-edge).
4. **Scrim element present and visible** when the panel is open (a `.cheffy-scrim`,
   `position:fixed`, `inset:0`, semi-transparent), and `display:none` when the panel is closed.
5. **Open AND close both animate** (opacity + transform, no layout shift) under default motion;
   **both collapse to instant** under `prefers-reduced-motion: reduce` while the open/close
   visibility swap and the dialogue state swap still work.
6. **JS-off parity:** with JS disabled, `#cheffy` stays `display:none`, panel + scrim never
   render, and the page is byte-identical to master. Panel show/hide is driven only by the
   native `[hidden]` attribute (no new mutation of `panel.hidden` / `aria-expanded`).
7. **No new `--color-*` token** introduced; scrim translucency via `color-mix(... transparent)`
   of an existing token. **No `Cheffy.astro` edit.** **No CheffyPanel `<script>` edit.**

## Gotchas checklist
- Base `#cheffy-panel` must set a non-`none` `display` (e.g. `flex`) so `display 0.22s
  allow-discrete` has two states to transition between; `[hidden]` supplies the `none`.
- Keep `#cheffy-panel[hidden]` specificity above the UA `[hidden]` rule (the id selector does
  this) or the panel will not hide.
- Scrim MUST be a following sibling of `#cheffy-panel` for the `~` combinator; placing it
  before the panel breaks the CSS-only visibility toggle.
- Do not wrap or restructure `.cheffy-node` -- the runtime queries it (`panel.querySelector(
  '.cheffy-node')`, line 111) and re-renders it (line 168); a wrapper is unnecessary and risky.
- `100dvh` not `100vh` for height, so mobile URL-bar chrome does not push the card off-screen.
- Do not add a `prefers-reduced-motion` block here -- the inherited `#cheffy *` sweep already
  covers it; a duplicate could fight the cascade.
