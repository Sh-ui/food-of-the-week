# Cheffy reduced-motion coverage research (part 7)

JOB_ID: cheffy_p7_reducedmotion_research
Scope: full inventory of CSS animation/transition surface in
`src/components/Cheffy.astro` and `src/components/CheffyPanel.astro`, after
parts 2-6 have landed on `troupe/fully-build-the-cheffy-module-on`.

## Headline finding

The premise in the task brief ("part 5 possibly added new @keyframes for a
notification-dot pulse", "processing spinner", "panel open/close transition",
"dialogue node/expression transitions", "hover/focus transitions") does **not
match the current code**. I read both files in full (Cheffy.astro: 263
lines, CheffyPanel.astro: 252 lines) and grepped the whole `src/` tree for
`animation|transition|@keyframes|prefers-reduced-motion`. Result:

- **Exactly one** CSS animation exists in the whole Cheffy surface: the
  part-2 `cheffy-blink` keyframe on the idle eyes.
- **CheffyPanel.astro has no `<style>` block at all** -- zero CSS in that
  file, animated or not.
- Parts 3-6 (calendar-actions, notifications, checklist export/import) are
  handler-registration modules only (`cheffyCalendarActions.ts`,
  `cheffyNotifications.ts`, `cheffyChecklist.ts`); none of them touch CSS,
  inline `style`, or `classList` to add motion. Confirmed via `grep -n
  "style\.\|\.style\b\|transition\|opacity"` on all three -- no matches.
- The "notification dot", "panel open/close", and "processing/attention
  state" are all implemented as instant, non-animated state changes today:
  `display: none/block` toggles (dot, expression/mouth swap) and
  `panel.hidden = true/false` (panel open/close, JS in Cheffy.astro
  `openPanel`/`closePanel`, lines 215-226). There is no spinner element, no
  pulse keyframe, no transition property anywhere in `src/styles/global.css`
  either (checked -- Tailwind directives + CSS custom properties only, no
  `transition`/`animation`/`:hover`/`:focus` rules).

So there is currently **nothing new to gate** from parts 3-6 -- the
reduced-motion surface has not grown since part 2. This is good news for the
Planner: the "cross-cutting sweep" reduces to (a) confirming the part-2
technique is still correct/complete, and (b) documenting that no further
gating is needed today, OR -- if the Planner/Director intends part 7 to
*add* the missing spinner/pulse/transition polish AND gate it in the same
pass -- flagging that as new scope beyond "sweep existing coverage." See GAP
below.

## (a) Complete inventory: every @keyframes / animation / transition

| # | File | Lines | Rule |
|---|------|-------|------|
| 1 | `Cheffy.astro` | 146-149 | `@keyframes cheffy-blink { 0%,92%,100% scaleY(1); 95% scaleY(0.1) }` |
| 2 | `Cheffy.astro` | 150-156 | `@media (prefers-reduced-motion: no-preference) { #cheffy[data-state="idle"] [data-expr="neutral"] .eye { animation: cheffy-blink 4.5s ease-in-out infinite; transform-box/transform-origin } }` |

That's it. No other `animation:`, `transition:`, or `@keyframes` token exists
in either file (verified with `grep -n "@keyframes\|animation\|transition\|prefers-reduced-motion"` on both files -- `Cheffy.astro` matched only lines
146/150/154; `CheffyPanel.astro` matched nothing).

Non-animated but state-changing rules in `Cheffy.astro`'s `<style>` (lines
118-170), for completeness since these are the "swap" surfaces the OBJECTIVE
worried about:

- Lines 127-129: `[data-expr]`, `[data-mouth]`, `.cheffy-dot` default to
  `display: none`.
- Lines 132-144: per-`data-state` `display: block` overrides for eyes /
  mouth / notification dot (idle / dialogue / attention / processing).
- Lines 158-169: `data-expr-override` variant of the same swap, driven by
  CheffyPanel's dialogue runtime (`root.setAttribute('data-expr-override',
  node.expression || 'neutral')`, CheffyPanel.astro line 165).

All of these are already **instant** (`display` toggle, no transition
attached) -- there is nothing to neutralize for reduced motion because
nothing animates them.

Panel open/close (`Cheffy.astro` lines 214-226): `panel.hidden =
false/true` -- a plain HTML `hidden` attribute flip. No CSS transition
targets `.cheffy-panel` (confirmed: no `<style>` block in
`CheffyPanel.astro` at all). Already instant/reduced-motion-safe by
construction.

## (b) Already-covered vs uncovered -- coverage table

| Selector / rule | Motion? | Currently gated by `prefers-reduced-motion`? | Status |
|---|---|---|---|
| `#cheffy[data-state="idle"] [data-expr="neutral"] .eye` (`cheffy-blink`, Cheffy.astro:151-155) | Yes -- `animation` | Yes -- wrapped in `@media (prefers-reduced-motion: no-preference)` (opt-in pattern; functionally equivalent to gating inside `reduce`, arguably safer default) | **Covered** |
| `.cheffy-dot` show/hide (Cheffy.astro:129,144) | No -- `display` toggle only | N/A (no motion to gate) | **N/A -- no pulse animation exists** |
| Expression (`[data-expr]`) swap, incl. `data-expr-override` (Cheffy.astro:127-135,158-164) | No -- `display` toggle only | N/A | **N/A -- no transition exists** |
| Mouth (`[data-mouth]`) swap (Cheffy.astro:128,138-141,167-169) | No -- `display` toggle only | N/A | **N/A -- no transition exists** |
| Panel open/close (`panel.hidden`, Cheffy.astro:215-226) | No -- `hidden` attribute toggle | N/A | **N/A -- no transition exists** |
| `.cheffy-toggle` / `.cheffy-option` hover/focus | No CSS rules for `:hover`/`:focus` exist in either file or `global.css` | N/A | **N/A -- no rule exists** |
| Processing "spinner" | No spinner element or CSS exists anywhere in the codebase | N/A | **N/A -- feature does not exist** |

Nothing is "uncovered." The only motion in the surface is item 1, and it is
already covered. There is zero new/uncovered CSS from parts 3-6 because
parts 3-6 added no CSS at all (JS action-handler modules only).

## (c) Correct reduced-motion technique (no layout shift)

Confirmed pattern already in use, matches current best practice
(MDN / web.dev, spot-checked -- the two viable no-layout-shift techniques
are (i) opt-in animation only inside `@media (prefers-reduced-motion:
no-preference)` as done here, or (ii) always define the animation but
neutralize it inside `@media (prefers-reduced-motion: reduce) { animation:
none; }` / `transition: none;`, never toggling `display`, `visibility`
dimensions, or removing the element):

- Keep the animated property itself non-layout-affecting: `cheffy-blink`
  animates `transform: scaleY(...)` on an SVG circle (`transform-box:
  fill-box`), which never affects layout/box size -- correct choice already.
- Gate with `animation: none` (or omit the animation entirely, as done via
  the `no-preference` wrapper) rather than `display: none` -- correct,
  already the pattern.
- For any *future* opacity/visibility-based reveal (e.g. if a spinner or
  pulse is added later), the safe technique is: keep `opacity`/`visibility`
  transitions gated by `prefers-reduced-motion: reduce { transition: none }`
  while the underlying `display`/state swap (which is what actually shows
  content) stays as an instant attribute/class toggle exactly as
  `Cheffy.astro` already does for expression/mouth/dot swaps and panel
  `hidden`. Never collapse `height`/`width`/`max-height` to 0 as the
  "closed" state -- that reintroduces layout shift on the reduced-motion
  path if a transition is later added on those properties.

## GAP

- **GAP: the OBJECTIVE assumes new animations exist from parts 3-6 (dot
  pulse, spinner, panel transition, hover/focus transitions) that are not
  present in the current code.** I verified this via full-file reads of
  both components plus a repo-wide grep for
  `animation|transition|@keyframes|prefers-reduced-motion` and a targeted
  check of `global.css` and the three part-3/5/6 TS handler modules (no
  `style`/`classList` motion side effects in any of them). If the Planner's
  intent for part 7 is purely "sweep existing coverage," there is nothing
  left to do beyond confirming/documenting the above (this note serves that
  purpose). If the Planner's intent is instead "add the missing visual
  polish (dot pulse, spinner, panel transition) AND gate it," that is new
  feature scope, not a reduced-motion sweep, and the Planner should
  explicitly decide and scope that separately rather than have it implied
  by "coverage."
- **GAP: CHEFFY-SYSTEM.md's only reduced-motion acceptance bullets** are
  line 40 ("Respects `prefers-reduced-motion` (no idle motion)") and line
  147 ("`prefers-reduced-motion` is honored; no layout shift or console
  errors on any page"). Both bullets are satisfied by the current code as-is
  for the *idle-motion* case specifically named in line 40; line 147's
  broader phrasing ("on any page") is trivially satisfied only because no
  other motion exists yet anywhere in the app to violate it. Web-checked
  best practice was not otherwise needed since the no-layout-shift pattern
  (transform-based animation + `no-preference` gate, non-dimensional
  display/hidden swaps) is unambiguous and already correctly applied.

## Deliverable for the Planner

Given the above, there is no cross-cutting CSS sweep required across the two
files today -- coverage is already 100% of existing motion. Recommend the
Planner either (1) close part 7 as a verification/documentation pass citing
this note, or (2) explicitly re-scope part 7 to *add* new motion (spinner /
pulse / panel transition) if that visual polish is actually desired, in
which case the technique in section (c) above is the pattern to build it
with from day one (gate at creation, not as a retrofit).
