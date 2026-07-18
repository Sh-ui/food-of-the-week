# Lunch System (`/lunch`)

A simple, self-rotating lunch planner for mom, baked into Food of the Week. One easy
carb + protein lunch per day, pulled from a big rotating list, with the week's ingredients
auto-added to the main grocery list.

Live page: **`/lunch`** (e.g. `food.schuepbach.work/lunch`). It is `noindex` so search
engines skip it, but anyone with the link can reach it (GitHub Pages is public).

## It rides along automatically

You don't run anything by hand. The lunch generator is wired into the build as a
**`prebuild`** hook, so **every time you build or deploy Food of the Week it regenerates
itself**:

```
edit FOOD-OF-THE-WEEK.md  →  git push  →  GitHub Action runs `npm run build`
                                          →  prebuild rebuilds the lunch pool + this week
                                          →  site deploys with /lunch and the grocery section fresh
```

Local `npm run dev` and `npm run build` do the same via `predev` / `prebuild`. Nothing to
remember, nothing to commit back.

**The current week is FROZEN:** the committed `src/data/lunch-week.json` is the source of
truth for its own week. As long as it covers the current week (and its item ids still
exist in the pool), every build reuses it verbatim -- pool or config edits mid-week can
NEVER reshuffle what mom already saw. Past weeks recorded in `src/data/lunch-history.json`
are trusted the same way. Only the Sunday rollover selects a new week, deterministically
(same date + same committed state + same config => same plan, in CI and locally). Grocery
additions are rebuilt from the frozen day ids each run, so `/lunch` and the grocery
section can never disagree. To reshuffle the current week on purpose:
`npm run lunch:generate -- --force` (then commit).

## The knobs — `src/data/lunch-config.json`

Twist these between runs; changes take effect on the next build. Item ids come from
`src/data/lunch-pool.json`.

| Knob | What it does |
|------|--------------|
| `exclude` | Item ids to **never** serve (snooze / dislike). `["jerky-trailmix"]` |
| `boost` | Favorites — come back ~3 weeks sooner. `["greekyogurt-berries"]` |
| `pin` | Force items on a specific week (by its Sunday). `{ "2026-07-05": ["eggs-celery-carrots"] }` |
| `autoGrocery` | Default state of the green "Lunch" grocery section (true = shown). |
| `itemsPerWeek` | Lunches per week (7 = one per day). |
| `rotation.maxPerProtein` / `maxSomeEffort` / `maxGrainBase` / `softTarget` | Per-week variety guardrails. |
| `startDate` | The anchor Sunday for the rotation — don't change casually. |

Every field has a matching `_field` note in the JSON explaining it.

## The big list — `src/data/lunch-pool.json`

52 lunches: 35 from mom's nutritionist handout (`brainstorming/mom-lunch-source.md`),
7 ported from `lunch-buddy`, 10 from the wider web (ADA / Healthline). All carb + protein,
controlled-carb, high-fiber/healthy-fat, easy/soft-prep.

Don't hand-edit the pool JSON — edit the builder and let the build regenerate it:

```bash
# edit scripts/build-lunch-pool.mjs to add/change a lunch, then just build/push.
# (the prebuild hook runs build-lunch-pool.mjs for you; npm run lunch:pool to do it manually.)
```

Each lunch carries: `fridge` (what mom pulls out), `protein` + `base` (variety control),
`carbServings`, `effort` (easy/some), `soft`, and `grocery` (ingredients → Produce /
Protein / Dairy / Frozen / Pantry). New items join the rotation automatically.

## How selection works (`scripts/generate-lunch-week.mjs`)

Replays week-by-week from `startDate`, each week:

1. Rank items by weeks-since-last-served (longest wait first); boosted items get a head
   start; ties gently prefer easy + soft, then a stable per-week shuffle for variety.
2. Apply any `pin` for the week, then greedily fill to `itemsPerWeek` honoring the caps.
3. Nudge toward `softTarget`. Aggregate + dedupe the grocery list.

The final replayed week is the one shown. Verified: weeks don't repeat until the pool
cycles, and re-running a week is byte-identical.

## Files

| File | Purpose |
|------|---------|
| `src/data/lunch-config.json` | **The knobs** (the only file you normally touch) |
| `src/data/lunch-pool.json` | The big list (generated from the builder) |
| `src/data/lunch-week.json` | This week's plan + grocery additions (**committed state** -- frozen for its week) |
| `src/data/lunch-history.json` | Which items served which week (**committed state** -- authoritative past) |
| `scripts/build-lunch-pool.mjs` | Defines the pool |
| `scripts/generate-lunch-week.mjs` | Deterministic rotation engine |
| `src/pages/lunch.astro` | Mom's `/lunch` page (cool mint theme, `noindex`) |
| `src/components/LunchGroceryAddon.astro` | Toggleable grocery section on the home page |
| `brainstorming/mom-lunch-source.md` | The nutritionist handout, transcribed |

Wiring: `package.json` `predev`/`prebuild` run the generator; `index.astro` passes
`showLunchAddon`; `Layout.astro` supports `noindex`; `Footer.astro` links `/lunch`.

## Notes

- Carb counts are **estimates** (1 serving ≈ 15 g carbs). Always check the label.
- Knob and pool changes take effect from the **next** week's selection; the current week
  stays frozen. `exclude` still stops an item's *future* appearances immediately, but the
  frozen week keeps showing it until Sunday (use `--force` if it must go now).
- Privacy: `noindex, nofollow`, only linked from the footer. For a hard lock later, put the
  site behind Cloudflare Access or a static password.

### Sources for the web-expanded items
American Diabetes Association (diabetes.org, diabetesfoodhub.org); Healthline; Taste of
Home; Apple and Mint; Milk & Honey Nutrition.
