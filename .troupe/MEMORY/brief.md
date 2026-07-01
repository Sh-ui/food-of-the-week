# Brief -- Cheffy PRESENTATION-polish DoD (troupe/polish-the-cheffy-module-s-presentation)

State-of-the-world orienting doc for the Director. This DoD was RE-AIMED: the earlier
9-criterion *behavior* DoD is DONE and superseded. Do NOT rebuild behavior. Build only the
missing visual/layout/presentation layer per CHEFFY-SYSTEM.md.

## DoD progress: 0/6 flipped, part 1 mechanically complete -- criterion 1 still `pending`
(awaits mandatory Opus visual-review sign-off per its own text, not a Sonnet-only pass)

Part 1 (floating-mascot) is DONE end-to-end and audit-passed: `job_cheffy_p1_mascot_plan`,
`_research`, `_build`, `_test` are all `done`, both `_build` and `_test` audits are `pass`.
`#cheffy` is now `position:fixed`, corner-docked via `data-corner` (default bottom-right,
z-index 200), out of document flow, present on every page, and hidden/inert with JS off
(`.cheffy-root{display:none}` default, `initCheffy()` adds `.cheffy-ready` after DOM
verification). Only `src/components/Cheffy.astro` changed (one `<style>` block + one JS
line). `reconcile-dod` was run this Strike and correctly left criterion 1 `pending` --
DoD text mandates the criteria 1-4 checkboxes are signed off ONLY by the Opus
visual-review verdict (criterion 6/5b), not by Sonnet build/test audits alone. Next up:
Director arms part 2 (hat-bubble).

`state.json.dod_progress` reseeded to SIX pending criteria (all `pending`):

1. floating-mascot -- #cheffy position:fixed, corner-docked (data-corner, default bottom-right),
   z-above content, out of flow, on every page; JS-off leaves it hidden/inert, site byte-identical to master.
2. hat-bubble -- chef-hat SVG at real visible size (~56-64px) in a circular bubble button
   (bg/shadow/hover/press); idle blink+float micro-animation plays; 4 expression states visually
   distinct; attention shows notification dot.
3. floating-card-panel -- ONE inset floating card that SCALES across all viewports over a visible
   scrim; min/max clamp; on a phone it near-fills but stays the same inset floating card (never a
   distinct fullscreen mode); opens over content, clear close affordance, smooth open/close.
4. polish -- brand tokens (tailwind.config.mjs colors), spacing, typography consistent; no layout
   shift on load/open; prefers-reduced-motion collapses motion to instant, layout/state swaps intact.
5. screenshot-gate -- add scripts/screenshot-cheffy.mjs (Playwright headless-Chrome): boot built
   site, capture into committed docs/cheffy-shots/ 9 PNGs (mascot idle / mascot attention / panel-open,
   each at ~390 / ~820 / ~1440 px).
6. visual-review (5b) -- MANDATORY Opus visual-review rung: an Opus actor (troupe-opus/Planner or
   Director, NOT Sonnet/host/Producer) opens each committed PNG with the Read tool and judges
   criteria 1-4 against actual pixels per breakpoint/state; records per-criterion PASS/FAIL to
   notes/cheffy-visual-review.md. Criteria 1-4 are signed off ONLY by this Opus verdict --
   computed-style or Sonnet-only passes do NOT satisfy them.

## Decomposition (already armed)

Six hexagonal parts, one per criterion. SERIALIZE the build order -- every visual part edits the
same CSS surface (Cheffy.astro / CheffyPanel.astro `<style>`), so parallel builds would conflict.
Current next_task: part 1 (floating-mascot) research.

## Key files (behavior already built here -- edit presentation only)

- src/components/Cheffy.astro -- corner mascot SVG + `<style>` (mascot visuals live here)
- src/components/CheffyPanel.astro -- dialogue panel (add panel layout/scrim/animation here)
- src/layouts/Layout.astro -- single `<Cheffy />` mount (already wired; leave)
- tailwind.config.mjs -- brand color tokens for the polish criterion
- scripts/screenshot-cheffy.mjs -- TO ADD (screenshot-gate)
- docs/cheffy-shots/ -- TO ADD, commit the 9 PNGs
- notes/cheffy-visual-review.md -- TO ADD, Opus verdict

## Done =

`npm run build` (astro check && astro build) passes, no console errors on any page, the Opus
visual-review verdict PASSES criteria 1-4 at all three breakpoints against the committed
screenshots, and the site behaves exactly like master with Cheffy JS disabled.
