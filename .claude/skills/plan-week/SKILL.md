---
name: plan-week
description: Plan this week's meals by mining the archive. Use when the user wants to pull meals from past weeks, pick meals for the week, build / brainstorm the weekly meal plan, choose what to cook, or assemble FOOD-OF-THE-WEEK.md from previous dinners. Drives an interactive drill-down -> checkbox pick -> dial-in flow over archive/*.md.
---

# Plan the week from the archive

This skill turns the ~80 dinners sitting in `archive/*.md` into an interactive
picker. A small parser (`parse-archive.mjs`) reads every archived week and
emits each meal at a high level -- name, codename/technique, anchor/fan/cai,
and derived facets (protein, cuisine, fan type). You then run a four-phase
conversation: **load context -> drill down -> check off meals -> dial in** for
this week's Sunday prep and ingredient reality.

The parser is the harness. `AskUserQuestion` is the interaction surface. The
output is a draft week written to `brainstorming/`.

All paths below are relative to the repo root
(`/Users/ianschuepbach/CodeProjects/food-of-the-week`). The parser lives at
`.claude/skills/plan-week/parse-archive.mjs`.

## Prerequisites

Node 18+ (repo runs on Node 23). No install step -- the parser is dependency-free
(`node:fs`/`node:path` only). Run everything from the repo root.

## The driver: parse-archive.mjs

```bash
node .claude/skills/plan-week/parse-archive.mjs --facets
```

Prints the filterable values and how many archived meals carry each -- this is
your menu for building the drill-down questions:

```
Meals in scope: 83

PROTEIN:
  legume (20)
  pork (18)
  chicken (16)
  ...
CUISINE:
  east-asian (28)
  italian (17)
  ...
TECHNIQUE:
  Prep&Heat (26)
  SousVidePrep (14)
  ...
```

List meals (newest first), filtered by any combination of facets:

```bash
node .claude/skills/plan-week/parse-archive.mjs --list --protein=chicken --cuisine=east-asian --limit=6
```

```
[20260517] Wok Chicken Parm -- Sous-vide chicken thigh chunks wok-seared with garlic...
         id=20260517-wok-chicken-parm  (WokNightPrep, chicken, legume, italian, east-asian)
[20260503] Orange Chicken -- Cornstarch-crusted chicken thigh with orange sauce...
         id=20260503-orange-chicken  (WokNight, chicken, legume, mexican-latin, east-asian)
...
```

Pull one meal's full recipe (all fields) once it's selected:

```bash
node .claude/skills/plan-week/parse-archive.mjs --id=20260517-tilapia --full
```

**Flags:** `--list` (human view) / `--facets` (filter menu) / default = compact
JSON / `--full` = JSON with full anchor/fan/cai/soup text. Filters:
`--protein` `--cuisine` `--fan` `--technique` (comma-separated = OR within a
facet; AND across facets), `--since=YYYYMMDD` `--until=YYYYMMDD` `--limit=N`
`--id=<meal-id>`. Facet values come from `--facets`; technique matches loosely
(`--technique=wok` hits `WokNight` and `WokNightPrep`).

## Run (agent path): the four-phase flow

### Phase 0 -- Load context

Before suggesting anything, read (per the repo's meal-planning rules):
1. `brainstorming/idea-basis/cooking-identity.md` -- the cook's profile.
2. `FOOD-OF-THE-WEEK.md` -- what's planned right now (the H1 is the current week; don't repeat last week's proteins/techniques back-to-back).
3. `brainstorming/stuff-we-have.txt` -- current ingredient/stock reality for the dial-in.

Then get the menu of what the archive can offer:

```bash
node .claude/skills/plan-week/parse-archive.mjs --facets
```

### Phase 1 -- Drill down (AskUserQuestion, single/multi select)

Ask the user how they want to narrow the ~80 meals. Make the **axis itself**
a choice so the picker bends to their mood. A good first call asks 1-2
questions, e.g.:

- Q "How many people this week?" header `Headcount` -- e.g. `6-8 (full house)`,
  `4-5`, `2-3`. This is a real lever: it sets both the **portion scale** and the
  **per-night dish count**. Default 6-8 is the full table (anchor + fan + 2-3 cai
  + optional soup). A smaller count scales portions down AND trims the spread --
  4 people is comfortably **one anchor + one fan + two cai (one acting as the
  side)**, no soup. Carry the answer into Phase 3 so quantities and dish count
  both shrink; don't just halve amounts and keep five dishes per night.
- Q "What's driving this week's pull?" header `Axis` -- options like
  `By protein`, `By cuisine`, `By technique / effort`, `Recent favorites` (use
  `--since`), `Surprise mix`.
- Q "Which proteins are you feeling?" header `Protein` `multiSelect:true` --
  options seeded from the `--facets` PROTEIN list (top 4 by count; "Other" is
  always offered automatically).

Translate answers into a filtered list:

```bash
node .claude/skills/plan-week/parse-archive.mjs --list --protein=chicken,pork --since=20260101
```

Aim to land a candidate pool of ~8-16 meals. If a filter returns too many,
add a facet or `--since`; too few, drop one.

### Phase 2 -- Check off meals (AskUserQuestion, multiSelect checkboxes)

Present the candidate pool as checkboxes so the user picks the specific dinners
for the week (target 4-5 meals; that's the household's weekly count).

`AskUserQuestion` allows **max 4 options per question and max 4 questions per
call** -- so a single call holds at most 16 checkbox items. Chunk the pool into
groups of 4 across multiple `multiSelect:true` questions in one call (e.g. 12
candidates -> 3 questions of 4). Use the meal `summary` as the label and keep
the `id` in the description so you can fetch the full recipe next.

### Phase 3 -- Dial in (conversation, then write the draft)

For each checked meal, fetch the full recipe and adapt it to *this* week:

```bash
node .claude/skills/plan-week/parse-archive.mjs --id=20260503-orange-chicken --full
```

Do this as a final short `AskUserQuestion` round (the dial-in levers), then
talk through, per the cook's identity and `stuff-we-have.txt`:
- **Scale to headcount** -- apply the Phase 1 headcount answer: scale every
  quantity AND trim the per-night dish count (4 people = anchor + fan + 2 cai,
  no soup). State the scaling in the writeup so the cook sees it.
- **Sunday/weekend batch prep** -- which cai/protein bags get prepped, what
  thaws when, the BatchDay shape.
- **Remixing** -- swap fan (rice <-> noodles) or cai based on stock and
  preference; reuse shared produce across nights; avoid repeating last week.
- **Weekly shape** -- two proteins in different preparations, a non-rice fan,
  technique/cuisine rotation (see `meal-planning-philosophy.mdc`).

### Phase 4 -- Finalize into FOOD-OF-THE-WEEK.md

When the user signs off, publish (this is the terminal step they trigger):

1. **Archive the current week first** (it's the source of truth being replaced).
   Copy `FOOD-OF-THE-WEEK.md` to `archive/YYYYMMDD-descriptive-slug.md` (start
   date of the week being archived; match the existing descriptive-slug naming,
   not the rule's literal `summary.md`). **Strip the `✓` cooked markers** from
   the H2 headings and the leading HTML comment -- they must use UTF-8-aware
   `perl`, plain `sed`/`perl` silently miss the multibyte `✓`:
   ```bash
   perl -CSD -i -pe 's{^## \x{2713} }{## };' archive/YYYYMMDD-slug.md
   ```
2. **Write the new `FOOD-OF-THE-WEEK.md`** in the structure the
   `.cursor/rules/*.mdc` rules define (H1 week range; Grocery List with only
   the categories that have items, `[x]` for on-hand; Weekend Prep/BatchDay;
   then meals with H5 codename + H6 sous-chef briefing + H4 Anchor/Fan/Cai +
   three-phase instructions). Use only keyboard hyphens (` -- `), never Unicode
   dashes.
3. **Validate**: `npm run build` (the site parses `FOOD-OF-THE-WEEK.md` at
   build -- a clean build means the structure parsed), and confirm zero
   forbidden chars: `grep -cP '[\x{2013}\x{2014}\x{2212}\x{2713}]' FOOD-OF-THE-WEEK.md`.
4. **Commit** the new plan and the archived file together.

If the user only wants to explore, stop after Phase 3 and drop the draft in
`brainstorming/` instead -- finalizing is opt-in.

## Gotchas

- **Two archive eras.** Newer files use `## Meal Name` + an H5 codename and
  `#### Anchor/Fan/Cai` fields; older files use `## Meal N: Name` with
  `#### Protein/Ingredients/Description`. The parser handles both: it strips the
  `Meal N:` prefix, and falls back to the `Description` field for the summary
  when there's no anchor. Old meals have `technique: null` (no codename existed
  yet).
- **`✓` cooked markers persist in some archives** even though the archiving rule
  says to strip them. The parser removes a leading `✓` from meal names.
- **Prep sections are not meals.** `## Grocery List`, `## Sunday Prep`,
  `## Weekend Prep`, `## Prep Day`, and anything with a `BatchDay` codename are
  filtered out. 83 meals remain across the archive.
- **Field text stops at the next `### ` heading.** Without that boundary the
  `cai` field swallows the entire `### Already Prepped` / instruction body.
  If you edit the parser, keep the H3 guard.
- **Facets are keyword heuristics, so they over-match.** `legume` is the biggest
  bucket (20) partly because `chili`, `bean`, `feta`, and `frittata` all trip
  it; a tomato-heavy dish can read `mexican-latin` off `chipotle`. Treat facets
  as a coarse sieve for the drill-down, not ground truth -- the user's checkbox
  pick in Phase 2 is the real filter.
- **AskUserQuestion caps: 4 options/question, 4 questions/call (16 items).**
  A "longish" candidate pool must be chunked across questions. Don't try to
  cram more than 4 options into one question.
- **Headcount scales dishes, not just grams.** When the table shrinks (in-laws
  away, etc.), don't just reduce quantities -- also drop the third cai and the
  soup. The archive recipes are written for the full 6-8 house; a 4-person week
  is leaner per night, not just smaller.
- **Always archive before you overwrite `FOOD-OF-THE-WEEK.md`.** It's the only
  copy of the outgoing week. Copy -> strip `✓` (UTF-8 `perl -CSD`) -> then
  write the new week. Skipping this loses the prior plan.

## Troubleshooting

- **Empty output / `0 meals`** after filtering: the facet value was misspelled
  or the `--since` window excluded everything. Re-run `--facets` (it respects
  active filters and shows what's actually in scope) and check spelling against
  it.
- **`--id` returns nothing:** ids are `YYYYMMDD-kebab-name`. Copy the exact `id=`
  string from `--list` output rather than guessing.
- **`Cannot find module` / archive not found:** the parser resolves
  `archive/` three directories up from itself. Run it from anywhere, but the
  skill must stay at `.claude/skills/plan-week/`.
