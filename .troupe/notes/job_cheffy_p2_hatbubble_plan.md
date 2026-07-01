# Build Plan: Part 2 (hat-bubble) -- Cheffy.astro

**Builder scope: `src/components/Cheffy.astro` ONLY -- its markup (lines 68-116) and
its `<style>` block (lines 118-215).** Do NOT touch `tailwind.config.mjs`, add new
tokens, edit the panel/scrim, or touch any `<script>` behavior JS. All work is CSS +
(optional, tiny) SVG-path tweak. Grounded in
`notes/job_cheffy_p2_hatbubble_research.md`.

Confirmed facts you are building on (from research):
- There is **NO** `.cheffy-toggle` rule and **NO** `.cheffy-svg` sizing rule in the
  file today -- the SVG renders at the UA default ~300x150 (broken). You are adding
  these rules for the first time.
- Brand tokens are already in scope in this component (it already uses
  `--color-bg`, `--color-primary`, `--color-secondary`, `--color-accent`). Available:
  `--color-bg` #FAF8F3, `--color-bg-alt` #F5F2EB, `--color-border` #E8E3D8,
  `--color-primary` #494331, `--color-secondary` #F3CA40, `--color-secondary-hover`
  #d9b130, `--color-accent` #F08A4B.
- The existing reduced-motion sweep at lines 207-214 is a catch-all
  (`#cheffy, #cheffy *` with `!important`) -- **any** new keyframe you add inside
  `#cheffy` is auto-neutralized. You do NOT write a new reduced-motion rule.
- The 4 state->expr->mouth mappings already exist and are correct (lines 162-174).
  Do NOT rename states. There is NO 'sleepy' state.

---

## Step 1 -- SIZING: add `.cheffy-toggle` + `.cheffy-svg` box rules (crit 1)

There is currently no rule for either selector. Add a new block. Put it right after
the `.cheffy-root.cheffy-ready[data-corner=...]` rules (after line 147) so the
mount-contract rules stay grouped and the button rules read next.

```css
  /* --- hat-bubble button (part 2): sizing + bubble chrome --- */
  .cheffy-toggle {
    /* touch target + bubble: 72px circle, >=44px floor */
    width: 4.5rem;
    height: 4.5rem;
    min-width: 44px;
    min-height: 44px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    background: var(--color-bg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    transition: background-color 0.15s ease, box-shadow 0.15s ease,
                transform 0.1s ease;
  }

  .cheffy-svg {
    /* ACCEPTANCE ANCHOR: computed width must land in 56-64px. 60px = 3.75rem. */
    width: 3.75rem;
    height: 3.75rem;
    display: block;
  }
```

Rationale (grounded): the SVG box is 60px (satisfies the tester's "computed
`.cheffy-svg` width is 56-64px" check exactly). The button is 72px so a ~5px ring of
bubble background + border shows around the SVG box -- that ring is what makes it read
as a real *bubble button*, not just a floating hat. The hat glyph occupies ~58-64% of
the 200x200 viewBox (hat+band span y5-122, x32-160 per research), so inside the 60px
SVG the visible hat sits centered with transparent margin -- the bubble background
shows through that margin too, reinforcing the bubble. `min-width/min-height: 44px`
guarantees the touch-target floor even if rem scaling is ever reduced.

## Step 2 -- BUBBLE BUTTON: hover + press affordances (crit 2)

Add directly after the `.cheffy-toggle` block above. Use ONLY existing tokens for
color; the shadow is a hand-picked rgba (see GAP note -- no `--shadow-*` token exists,
this is expected and allowed).

```css
  .cheffy-toggle:hover {
    background: var(--color-bg-alt);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  }
  .cheffy-toggle:active {
    background: var(--color-bg-alt);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    transform: scale(0.95);
  }
  .cheffy-toggle:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
```

Notes:
- Press feedback is a `scale(0.95)` + tightened shadow ("button pressed down") rather
  than a jarring color flip -- reads as a physical press and keeps the brand palette
  calm. This resolves the research GAP "press-state color choice" (do NOT use
  `--color-secondary-hover`; the scale+shadow reads better and avoids a yellow flash).
- `:focus-visible` uses `--color-primary` -- keyboard-accessibility freebie, token-based,
  in-scope. Include it.
- The `transition` on the base rule already lists `transform` and `box-shadow`, so
  hover/press animate smoothly and reduced-motion collapses them via the existing sweep.

## Step 3 -- IDLE ANIMATION: transform-only bob keyframe (crit 3)

The blink keyframe already exists (lines 176-186) and is gated inside
`@media (prefers-reduced-motion: no-preference)`. Add the bob **adjacent to it, in the
SAME no-preference media block**, so both idle animations live together. Insert the
keyframe just before the existing `@keyframes cheffy-blink` (line 176) and add the bob
selector inside the existing `no-preference` media query (after the `.eye` rule, before
its closing brace on line 186):

```css
  @keyframes cheffy-bob {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-3px); }
  }
```

Then inside the EXISTING `@media (prefers-reduced-motion: no-preference) { ... }`
block (lines 180-186), add the bob selector alongside the blink `.eye` rule:

```css
    #cheffy[data-state="idle"] .cheffy-svg {
      animation: cheffy-bob 3s ease-in-out infinite;
    }
```

Rationale (grounded):
- `translateY` only -> **zero layout shift** (transform, not margin/top). Gentle 3px
  travel, 3s ease-in-out, infinite.
- Scoped to `.cheffy-svg` (NOT `#cheffy` root) so it never perturbs the
  `.cheffy-root.cheffy-ready { position: fixed }` mount contract. Research confirms
  transform on a fixed-positioned *ancestor* would be risky; scoping to the SVG child
  avoids that entirely.
- Gated to `data-state="idle"` only -- bob does not run in attention/dialogue/processing.
- **Do NOT add a `prefers-reduced-motion: reduce` rule for the bob.** The existing
  catch-all sweep (lines 207-214, `#cheffy *` + `!important`) already collapses it to
  0.01ms / 1 iteration. Adding another rule is redundant and risks conflicting.
- Blink and bob are both now inside `no-preference` AND both swept by the `reduce`
  block -> both satisfy "reduced-motion collapses them to instant."

## Step 4 -- EXPRESSION STATES: confirm distinctness (crit 4)

The mapping already exists and is correct (verified in research + CSS lines 162-174).
**No rename. No mapping change.** Confirmed full-combo distinctness at ~60px SVG:

| state       | eyes (expr)          | mouth              | dot | distinctness |
|-------------|----------------------|--------------------|-----|--------------|
| idle        | neutral (r=5 circle) | neutral (straight) | no  | baseline     |
| attention   | excited (r=6 circle) | surprised (circle) | YES | strongest    |
| dialogue    | neutral (r=5 circle) | smile (curve)      | no  | vs idle: mouth only |
| processing  | thinking (arc)       | neutral (straight) | no  | vs idle: eyes only |

All four are distinct as complete combos. Weakest pairwise is **idle vs dialogue**
(same neutral eyes; straight line vs curved smile mouth only). This is a real
visual-QA risk at 60px (research GAP).

Action for builder: after implementing Steps 1-3, run `npm run build`, then open the
built output (or dev server) and eyeball the four states by hand-setting
`data-state="idle|attention|dialogue|processing"` on `#cheffy` in devtools. If idle vs
dialogue does NOT read as clearly distinct, you MAY make the smile mouth more
pronounced -- a minimal path tweak on the existing `data-mouth="smile"` element ONLY
(line 104), e.g. deepen the curve `M86 74 q14 12 28 0` -> `M84 73 q16 14 32 0`. This is
in-scope ("refine only for distinctness, do not rename"). Do this ONLY if the render
proves it necessary; prefer no change if idle/dialogue already read distinct. Do NOT
touch eyes or any other mouth path.

## Step 5 -- NOTIFICATION DOT: confirm attention-only (crit 5)

Already correct and requires NO change (research (e), CSS lines 154, 159, 174):
- `.cheffy-dot { fill: var(--color-accent); }` (orange on cream -- good contrast)
- `#cheffy .cheffy-dot { display: none; }` default
- `#cheffy[data-state="attention"] .cheffy-dot { display: block; }` -- attention only
- At 60px SVG the dot (r=10 of 200) renders ~6px diameter -- small but visible.

Action: confirm the dot appears ONLY when `data-state="attention"` during the Step 4
eyeball pass. If (and only if) it reads muddy against the hat at 60px, you MAY add a
thin halo `stroke: var(--color-bg); stroke-width: 2;` to `.cheffy-dot` (line 154) --
token-based, in-scope. Prefer no change unless the render proves it necessary.

---

## Acceptance criteria (builder implements, tester proves)

1. `.cheffy-toggle` computed style has: `border-radius: 50%`, a non-transparent
   `background`, a non-`none` `box-shadow`, `width`/`height` >= 44px. GREP: a
   `.cheffy-toggle {` rule now exists (didn't before).
2. `.cheffy-toggle:hover` AND `.cheffy-toggle:active` rules both exist in the style
   block (grep the source).
3. `.cheffy-svg` computed `width` is between 56px and 64px inclusive (target 60px)
   and `> 0`. GREP: a `.cheffy-svg { width: ... }` rule now exists.
4. `@keyframes cheffy-bob` exists AND `@keyframes cheffy-blink` exists; the bob
   selector (`#cheffy[data-state="idle"] .cheffy-svg`) sits inside a
   `@media (prefers-reduced-motion: no-preference)` block; the `reduce` sweep at
   lines ~207-214 is unchanged and still present (so both are reduced-motion-gated).
5. Bob uses `transform: translateY(...)` only (grep the keyframe body) -- no
   top/margin/height -> zero layout shift.
6. The four `data-state` values (idle/attention/dialogue/processing) each render a
   distinct expr+mouth combo (verify by devtools state-swap; table above).
7. `.cheffy-dot` is `display: none` by default and `display: block` only under
   `#cheffy[data-state="attention"]` (unchanged; confirm still true).
8. `npm run build` passes. No console errors. No changes outside `Cheffy.astro`.
9. Mount contract intact: `.cheffy-root { display: none }` and
   `.cheffy-root.cheffy-ready { position: fixed }` rules are untouched; JS-off => Cheffy
   stays invisible (no visual regression vs master).

## Gotchas

- **Do NOT add a reduced-motion rule for the bob** -- the existing catch-all already
  covers it; a second rule is redundant.
- **Do NOT put the bob on `#cheffy` root** -- it must be on `.cheffy-svg` to avoid the
  `position: fixed` mount contract on `.cheffy-root`.
- **box-shadow uses a hand-picked rgba** -- no `--shadow-*` token exists in the repo
  (confirmed by research grep of tailwind.config.mjs + global.css). This is allowed and
  is NOT a token violation (crit4 is about NOT adding tailwind tokens; using rgba for a
  shadow adds nothing to tailwind).
- **Steps 4 & 5 are confirm-first**: only make the optional smile-deepen / dot-halo
  tweaks if the real 60px render proves them necessary. Default is no change.
- Keep the SVG width at 3.75rem (60px) -- do not drift below 3.5rem (56px) or above
  4rem (64px) or acceptance #3 fails.
