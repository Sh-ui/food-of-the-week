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

Part 1 (floating-mascot) and Part 2 (hat-bubble) are BOTH done end-to-end and
audit-passed:
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

Neither criterion 1 nor 2 is flipped `done` in `state.json.dod_progress` yet -- both wait
on the single Opus visual-review rung (criterion 6) that judges all of 1-4 together
against committed screenshots.

Next up: Director arms **part 3 (floating-card-panel)**.

## Decomposition (already armed)

Six hexagonal parts, one per criterion. SERIALIZE the build order -- every visual part
edits the same CSS surface (Cheffy.astro / CheffyPanel.astro `<style>`), so parallel
builds would conflict. Parts 1-2 done; part 3 (floating-card-panel) is next, touching
`CheffyPanel.astro` (dialogue panel layout/scrim/animation).

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
