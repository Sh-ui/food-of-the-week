# Research: Part 2 (hat-bubble) -- Cheffy.astro

Seam file: `src/components/Cheffy.astro` (markup lines 68-116, style block lines 118-215).
No other file needs to change for this part -- confirmed by grep across the codebase
for `cheffy-toggle`/`cheffy-svg` (only `Cheffy.astro` defines/consumes them;
`CheffyPanel.astro` is a sibling, unrelated markup).

## (a) SIZING -- current state, exact facts

- `.cheffy-svg` (`src/components/Cheffy.astro:79`): `viewBox="0 0 200 200"`. **No CSS
  rule sets `.cheffy-svg` width/height anywhere in the file.** An SVG with no
  explicit width/height and a viewBox renders at its intrinsic default -- in
  practice browsers fall back to the CSS-replaced-element default of
  **300x150px** (the viewBox aspect ratio is ignored for sizing purposes, only
  `preserveAspectRatio` affects placement inside that box, not the box size
  itself). So today the SVG is almost certainly a large, oddly-proportioned
  rectangle, NOT a small ~60px icon.
- `.cheffy-toggle` (line 77, `<button type="button" class="cheffy-toggle" ...>`):
  **zero CSS rules exist for `.cheffy-toggle`** anywhere in the style block (grep
  confirms no `.cheffy-toggle {` selector). It renders as a bare unstyled
  `<button>` -- default UA button padding/border/background, sized by its content
  (the oversized SVG), not touch-target-sized at all.
- GAP resolved via grounding, not assumption: this is 100% confirmed by reading
  the full style block (lines 118-215) -- there is no `.cheffy-toggle` or
  `.cheffy-svg` sizing rule in the file today.

**Minimal edit needed:**
```css
.cheffy-toggle {
  width: 3.5rem;   /* 56px -- touch target, >=44px */
  height: 3.5rem;
  padding: 0;
  border: none;
  cursor: pointer;
}
.cheffy-svg {
  width: 60px;     /* visible hat ~56-64px, sits inside the 56px button
                       with a hair of padding via viewBox whitespace, or size
                       svg to exactly fill the button -- see note below */
  height: 60px;
  display: block;
}
```
Note: the hat glyph itself does not fill the full 200x200 viewBox (hat path
spans roughly x:2-198,y:5-125; band to y:122; dot at cx150/cy30/r10 extends to
y:20-40, x:140-160 -- all within the 200x200 box with margin). Setting
`.cheffy-svg` to `width/height: 60px` (matching `.cheffy-toggle`'s 56-64px
target, or slightly larger so the toggle padding/border doesn't clip it) makes
the whole 200x200 box scale to 60px, landing the visible hat comfortably in the
56-64px range as the DoD asks. Recommend toggle >= svg size (e.g. toggle
`3.5rem`/56px, svg `56px` exactly, `display:block` on both, no padding) so
there's no accidental clipping and the touch target equals the visible glyph
size -- simplest, matches DoD literally ("lands the visible hat at ~56-64px
inside a touch-friendly >=44px target").

## (b) BUBBLE BUTTON -- brand tokens confirmed available

`src/styles/global.css:14-27` defines CSS custom properties sourced straight
from `tailwind.config.mjs` `theme.extend.colors`:
```
--color-primary:         #494331  (dark brown -- used for hat stroke/eyes/mouth)
--color-primary-hover:   #3a3626
--color-secondary:       #F3CA40  (yellow -- hat band fill)
--color-secondary-hover: #d9b130
--color-accent:          #F08A4B  (orange -- notification dot fill)
--color-bg:               #FAF8F3 (cream -- hat fill)
--color-bg-alt:           #F5F2EB
--color-border:           #E8E3D8
--color-text / -light / -muted also exist
```
All already in scope globally (defined at `:root` presumably in global.css, not
scoped) -- Cheffy.astro already consumes `--color-bg`, `--color-primary`,
`--color-secondary`, `--color-accent` for the hat/eyes/mouth/dot fills (lines
150-154), so token availability inside this component is already proven, no
import needed.

**Minimal bubble edit** (added to the same `.cheffy-toggle` rule from (a)):
```css
.cheffy-toggle {
  border-radius: 50%;
  background: var(--color-bg);           /* or --color-bg-alt for slight contrast */
  box-shadow: 0 2px 8px rgba(0,0,0,0.15); /* no existing --shadow-* token found --
                                              see GAP below */
  transition: background-color .15s ease, transform .1s ease, box-shadow .15s ease;
}
.cheffy-toggle:hover {
  background: var(--color-bg-alt);
  box-shadow: 0 4px 12px rgba(0,0,0,0.18);
}
.cheffy-toggle:active {
  background: var(--color-secondary-hover);  /* or scale-down for press feedback */
  transform: scale(0.96);
}
```
GAP: no `--shadow-*` design token exists in `tailwind.config.mjs` or
`global.css` (grepped both) -- box-shadow will need a hand-picked rgba value
(acceptable, no token to violate) or the Planner may choose to omit shadow
entirely and rely on a border/background-only bubble. Flagging as a build
decision, not a blocker.

## (c) IDLE ANIMATION -- blink confirmed, bob keyframe specified

- `cheffy-blink` keyframe **exists** (`Cheffy.astro:176-179`), applied only to
  `#cheffy[data-state="idle"] [data-expr="neutral"] .eye`, gated inside
  `@media (prefers-reduced-motion: no-preference)` (lines 180-186) -- confirmed
  it is NOT applied unconditionally; it's already properly gated.
- Reduced-motion sweep exists at lines 207-214:
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
  This is a **catch-all** on `#cheffy, #cheffy *` -- confirmed it WILL neutralize
  any new animation added anywhere inside `#cheffy` (including a bob on
  `.cheffy-toggle` or `.cheffy-svg`) automatically via `!important`, with zero
  additional work needed. No new reduced-motion rule required for the bob.

**Minimal bob/float edit** (transform-only, zero layout shift -- add adjacent
to the existing blink block, same `no-preference` media query):
```css
@keyframes cheffy-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3px); }
}
@media (prefers-reduced-motion: no-preference) {
  #cheffy[data-state="idle"] .cheffy-svg {
    animation: cheffy-bob 3s ease-in-out infinite;
  }
}
```
Applying the bob to `.cheffy-svg` (or `.cheffy-toggle`) rather than the whole
`#cheffy` root avoids interfering with `.cheffy-root.cheffy-ready`'s
`position: fixed` mount contract -- `transform: translateY()` on a
`fixed`-positioned ancestor is safe (doesn't break `position:fixed` itself,
only affects rendering of that element and descendants), but scoping to the
SVG/button child is cleaner and keeps the bob independent of the panel
positioning. Only fires in `idle` state (matches DoD "idle animation" framing);
does not need to run during attention/dialogue/processing.

## (d) EXPRESSION STATES -- exact state->expr->mouth mapping (verified in CSS)

Confirmed by reading lines 162-171 directly (this is the CURRENT, already-wired
mapping -- no code change needed here per objective, just confirmation):

| `data-state`  | eyes (`data-expr`) | mouth (`data-mouth`) |
|---------------|---------------------|------------------------|
| `idle`        | `neutral`           | `neutral`               |
| `attention`   | `excited`           | `surprised`             |
| `dialogue`    | `neutral`           | `smile`                 |
| `processing`  | `thinking`          | `neutral`               |

Confirmed: exactly 4 states, matching DoD ("idle/attention/dialogue/processing"),
**no 'sleepy' state exists in the CSS or the JS** (`initCheffy`'s `setState`
type is `'idle' | 'attention' | 'dialogue' | 'processing'`, `Cheffy.astro:249`)
-- confirms the DoD instruction not to invent one is already structurally
enforced; nothing to change.

**Visual distinctness at real render size (~56-64px):**
- `idle` (neutral eyes: r=5 circles + straight-line mouth `M88 76 h24`) vs
  `dialogue` (same neutral eyes, but curved smile mouth `M86 74 q14 12 28 0`) --
  distinct via mouth shape alone (straight line vs. curve), same eyes. At 56px
  render, a straight 24-unit line (scaled to ~7px) vs. a curved arc is a small
  but perceptible difference -- GAP: this is the weakest pairwise distinction
  of the four; whether it reads clearly at 56-64px is a visual-QA call the
  Planner/builder should verify by rendering, not something CSS grounding
  alone can guarantee. Flagging as risk, not blocking.
- `attention` (excited eyes: r=6, larger + surprised mouth: open circle r=5,
  no fill) is the most distinct -- bigger eyes, round open mouth, PLUS the
  notification dot only shows here (see (e)) -- strongly differentiated.
- `processing` (thinking eyes: curved paths, no blink animation since blink is
  scoped to `[data-expr="neutral"]` only + neutral mouth) is distinct via eye
  shape (arcs vs. circles) -- also visually clear.

No CSS/markup change required for (d) itself -- objective asks to *confirm*
the mapping, which is done above. The only interaction with (a)/(b)/(c) is
that shrinking the SVG down to 56-64px (from today's unstyled ~300x150
default) is what will make these state differences legible in the first
place -- currently, at the oversized unstyled render size, distinctness is
moot because sizing itself is broken (see GAP in (a)).

## (e) NOTIFICATION DOT -- confirmed size/position/contrast

- Markup: `<circle class="cheffy-dot" data-part="notification-dot" cx="150"
  cy="30" r="10"/>` (`Cheffy.astro:109`) -- in the 200x200 viewBox coordinate
  space, so at final ~56-64px render size the dot is roughly
  `10/200 * 60 = 3px` radius (~6px diameter) -- small but should remain
  visible at that scale; matches typical badge-dot sizing.
- Visibility: `display: none` by default (line 159, `#cheffy .cheffy-dot`),
  shown only via `#cheffy[data-state="attention"] .cheffy-dot { display: block;
  }` (line 174) -- confirmed dot appears ONLY in `attention` state, nowhere
  else. No JS-side toggling of the dot exists (grep shows no `.cheffy-dot`
  reference in the `<script>` blocks) -- purely CSS-driven via the state
  attribute, consistent with the rest of the expression-swap system.
- Position: top-right-ish of the hat (cx=150 of 200 width, cy=30 of 200
  height) -- sits above/right of the hat band, doesn't overlap eyes/mouth.
- Fill: `var(--color-accent)` (#F08A4B orange) against `var(--color-bg)`
  (#FAF8F3 cream) hat fill or the new bubble background (also likely
  `--color-bg`/`--color-bg-alt`) -- orange-on-cream is a reasonably high
  contrast pairing (WCAG contrast for a small decorative UI badge, not text,
  so AA text-contrast ratios don't strictly apply, but the hue/lightness gap
  is visually sufficient). No stroke/outline on the dot currently -- GAP: at
  ~6px diameter with no outline, on a hat with `stroke: var(--color-primary)`
  (dark brown) 4px-wide strokes nearby, the dot may want a thin
  `stroke: var(--color-bg)` or similar halo to stay crisp against the hat
  fill/band boundary if it happens to sit near an edge -- current cx/cy (150,
  30) puts it just outside the hat's rounded top-right, likely clear of the
  hat outline, but this is a fine-grain visual-QA item, not a code-fact gap.

## Risk assessment -- Part 1 mount contract / JS-off parity

- **Mount contract (Part 1, lines 119-147):** `.cheffy-root { display: none; }`
  by default, `.cheffy-root.cheffy-ready { display: block; position: fixed; }`
  added by JS. None of the (a)-(e) edits touch `.cheffy-root` or its
  `cheffy-ready`/`data-corner` rules -- all new/changed rules scope to
  `.cheffy-toggle`, `.cheffy-svg`, and a new `cheffy-bob` keyframe on a
  descendant. **No risk** to the mount contract: adding `width/height` to
  `.cheffy-toggle`/`.cheffy-svg` only affects the button's own box size, not
  its `display`/`position` semantics; the parent `.cheffy-root` positioning is
  untouched.
- **JS-off parity:** JS-off means `.cheffy-root` never gets `.cheffy-ready`
  added, so it stays `display: none` -- entirely invisible regardless of what
  CSS exists inside it. Sizing/bubble/bob CSS changes are dormant and
  irrelevant when JS is off. **No risk.**
- **Reduced-motion:** the existing blanket sweep (`#cheffy, #cheffy *` with
  `!important`, lines 207-214) already covers any new animation added anywhere
  inside `#cheffy`, confirmed above in (c) -- the new `cheffy-bob` keyframe
  needs no additional reduced-motion rule of its own. **No risk**, but the
  Planner/builder should still visually verify (not just trust the selector)
  since `!important` + wildcard is powerful but worth a real render check.
- **CheffyPanel.astro / behavior JS:** not touched, not referenced by any of
  the (a)-(e) edits -- confirmed via grep that `.cheffy-toggle`/`.cheffy-svg`
  selectors appear only in `Cheffy.astro`, and the JS `initCheffy()` function
  (lines 235-282) only reads `.cheffy-toggle` as a selector target for
  event listeners / `aria-expanded`, never depends on its computed
  size/shape/background -- purely presentational, safe to restyle.

## Summary of gaps (for the Planner)

- `GAP`: `.cheffy-toggle` press-state background color choice
  (`--color-secondary-hover` suggested above) is a judgment call, not a
  grounded fact -- any existing token works, Planner should pick.
- `GAP`: no `--shadow-*` token exists in the codebase for the bubble's
  box-shadow; a hand-picked rgba value is the only option (or omit shadow).
- `GAP`: whether `idle` vs `dialogue` (same eyes, only mouth differs: straight
  line vs. curved smile) reads as clearly distinct at 56-64px render is a
  visual-QA call, not something groundable from source alone -- flag for the
  builder to eyeball after implementing.
- `GAP`: exact target size within DoD's 56-64px range (this note recommends
  56px/`3.5rem` as the simplest anchor matching the 44px+ touch-target floor
  with margin) -- Planner can pick anywhere in 56-64px, all equally supported
  by the evidence above.
