# Brief -- Cheffy PRESENTATION-polish DoD (troupe/polish-the-cheffy-module-s-presentation)

State-of-the-world orienting doc for the Director. This DoD was RE-AIMED: the earlier
9-criterion *behavior* DoD is DONE and superseded. Do NOT rebuild behavior. Build only the
missing visual/layout/presentation layer per CHEFFY-SYSTEM.md.

## DoD progress: 0/6 flipped -- criteria 1-4 stay `pending` until Opus visual-review (5b)

**Important:** the DoD text mandates criteria 1-4 are signed off ONLY by the mandatory
Opus visual-review verdict (criterion 6/5b) -- NOT by Sonnet build/test audits alone, even
when those audits pass clean. Do not hand-flip 1-4 to `done` on audit-pass; `reconcile-dod`
correctly leaves them `pending` because no job is tagged with `criterion` (untagged =
no-op by design). Only criterion 6 (or possibly 5, the screenshot-gate's own Sonnet-audit
half 5a) should ever flip via reconcile once the Opus rung runs and records its verdict.

Parts 1-3 are all done end-to-end and audit-passed:
- `job_cheffy_p1_mascot_{plan,research,build,test}` -- all `done`, both `_build` and
  `_test` audits `pass`. `#cheffy` is `position:fixed`, corner-docked via `data-corner`
  (default bottom-right, z-index 200), out of document flow, present on every page,
  hidden/inert with JS off. Only `src/components/Cheffy.astro` changed.
- `job_cheffy_p2_hatbubble_{plan,research,build,test}` -- all `done`, both `_build` and
  `_test` audits `pass`. Hat-bubble sizing/shadow/hover, blink+float micro-animation,
  4 expression states, notification dot -- all landed in `src/components/Cheffy.astro`
  markup (lines ~68-116) + `<style>` block. Builder scope was explicitly Cheffy.astro
  only; no touches to `tailwind.config.mjs` or the panel/scrim or behavior `<script>`.
  The existing catch-all `#cheffy, #cheffy *` reduced-motion sweep already neutralizes
  any new keyframes -- no new reduced-motion rule was needed.
- `job_cheffy_p3_cardpanel_{research,plan,build,test}` -- all `done`, `_build` audit
  `pass` (took 2 attempts: first cold audit caught a missing reduced-motion collapse on
  the new scrim/card transitions; rebuild added a `prefers-reduced-motion` block
  (0.01ms transition-duration on `#cheffy-panel` and `.cheffy-scrim`) and re-audit
  passed clean). `_test` (32/32 checks) confirmed on first pass. Landed entirely in
  `src/components/CheffyPanel.astro` -- ONE new `<style>` block + a sibling
  `.cheffy-scrim` div, zero edits to `Cheffy.astro` or behavior JS. Design: `#cheffy-panel`
  IS the inset floating card, sized via `min(target, 100% - 2*inset)` so it's always
  inset from all 4 edges (never fullscreen) at 390/820/1440px; corner-anchored to match
  `data-corner`; scrim is a following-sibling `~` combinator keyed off `#cheffy-panel[hidden]`
  (CSS-only visibility, no new JS); open/close animates via `@starting-style` +
  `transition-behavior: allow-discrete` on the native `[hidden]` swap (transform+opacity
  only, zero layout shift); inherits the existing `#cheffy, #cheffy *` reduced-motion
  sweep for panel content but needed its OWN explicit reduced-motion rule for the
  scrim/card's own transition-duration (that's what the rebuild fixed). Close routes
  through the existing dialogue "close" option + the mascot toggle raised to
  `z-index: 3` above the scrim -- no scrim-click JS added (deliberately out of scope,
  documented as a decision in the plan note before it was pruned).

Criteria 1-3 are NOT flipped `done` in `state.json.dod_progress` yet (still `pending`)
-- all wait on the single Opus visual-review rung (criterion 6) that judges 1-4 together
against committed screenshots. This is by design (untagged builds = reconcile-dod no-op).

**PRODUCER HOLD IS SET** (`.troupe/PRODUCER-HOLD.md`, set 2026-07-01): the Producer
directed the loop to wind down after part 3 reached a clean boundary and NOT arm parts
4-6 until they explicitly resume with `/troupe`. Part 3 has now reached that clean
boundary (audit-passed, test-passed, this Strike settled it) -- the HOST must hold the
baton here, not spawn the next Stage Manager. Do not arm part 4 until the hold file is
deleted by the Producer.

Next up (once resumed): Director arms **part 4 (polish -- brand tokens/spacing/typography)**.

## Decomposition (already armed)

Six hexagonal parts, one per criterion. SERIALIZE the build order -- every visual part
edits the same CSS surface (Cheffy.astro / CheffyPanel.astro `<style>`), so parallel
builds would conflict. Parts 1-3 done; part 4 (polish) is next, likely touching
`tailwind.config.mjs` + both component `<style>` blocks.

## Key files (behavior already built here -- edit presentation only)

- `src/components/Cheffy.astro` -- corner mascot SVG + hat-bubble `<style>` (parts 1-2
  landed here, DONE -- leave alone unless a later part needs to touch shared tokens)
- `src/components/CheffyPanel.astro` -- dialogue panel (part 3 target: layout/scrim/animation)
- `src/layouts/Layout.astro` -- single `<Cheffy />` mount (already wired; leave)
- `tailwind.config.mjs` -- brand color tokens for the polish criterion (part 4)
- `scripts/screenshot-cheffy.mjs` -- TO ADD (screenshot-gate, part 5)
- `docs/cheffy-shots/` -- TO ADD, commit the 9 PNGs (part 5)
- `notes/cheffy-visual-review.md` -- TO ADD, Opus verdict (part 6/5b)

## Done =

`npm run build` (astro check && astro build) passes, no console errors on any page, the
Opus visual-review verdict PASSES criteria 1-4 at all three breakpoints against the
committed screenshots, and the site behaves exactly like master with Cheffy JS disabled.

## Arming gotchas (workshop 2026-07-01)

- Test rungs MUST be armed `dispatch: TEST`, not `BUILD`. P1/P2 `_test` jobs were armed
  as BUILD (a verify-objective routed into the builder lane); P3 corrected this to TEST.
  When arming P4/P5/P5b, use TEST for verify rungs, BUILD only for implement rungs.
- P5b visual-review is dispatched to an OPUS actor (troupe-opus/Planner or the Director),
  never Sonnet -- it is the ONLY sign-off for visual criteria 1-4.
