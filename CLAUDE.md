# CLAUDE.md

This file orients Claude Code for working in this repository. It covers the **weekly meal-planning workflow** — the core recurring work here. (Conventions for the Astro website/code itself still live in `.cursor/rules/`; consult those when modifying the site, not when planning meals.)

## What this repo is

A meal-planning system for a household that cooks dinner family-style on a **fan/cai** framework. `FOOD-OF-THE-WEEK.md` at the root is the single source of truth for the current week; it's published to a live Astro site for the family to read. Each finished week is moved into `archive/`.

## Read these first (canonical references)

Before brainstorming, writing, or editing any meal, load context in this order:

1. **`brainstorming/idea-basis/cooking-identity.md`** — the cook's full profile: household, instincts, equipment, cuisine range, protein habits, budget/energy posture. This is the soul of every decision. **Always read it first.**
2. **`brainstorming/idea-basis/fan-cai-paradigm.md`** — the structural logic for fan, cai, anchor, soup, and table service.
3. **The most recent file(s) in `archive/`** — the canonical example of current structure and voice. **Most recent week wins** any time a written rule and an actual recent file disagree.
4. Other `brainstorming/idea-basis/` files as relevant (`table-frames.md`, `cai-portion-guide.md`, `sous-vide-additives.md`).

The meals in `archive/` are already written well. **Reuse before rewriting** — copy-paste a proven meal and adjust only what this week needs, rather than authoring from scratch.

## The cook, in brief

(Full detail in `cooking-identity.md` — this is just the orientation.)

- **Household:** plan for **6–8** by default, but **confirm headcount every week** (it varies; e.g. a recent week was a family of 4). Helpers: Dad (chopping/prep), sister (rice cooker, simple tasks).
- **Thinks like a chef, not a recipe-follower.** Recipes are sketches — ratios and flavor instincts over exact measurements. Three movers in every dish: a flavor base (aromatics/fats), a structural ingredient (protein/starch/veg), a finishing accent (acid/herb/crunch).
- **Cuisine-agnostic fusion.** A week might pair a Japanese night, a Tuscan braise, and Mexican tostadas. Variety in technique/cuisine/fan — never two similar meals back-to-back.
- **The F-Word ethos:** keep humble food's soul, add one or two deliberate touches (a finishing sauce, a sharp/crunchy contrast) that make it feel composed.
- **Energy and budget vary week to week.** Match ambition to the cook's stated situation. When money's tight, lean on what's on hand and make grocery trips surgical. When energy's low, bought convenience over from-scratch, no judgment.

## Fan / Cai framework (the meal shape)

Each dinner is a decomposed meal served family-style from a lazy susan, not one big plate per person:

- **Fan** — the staple grain, personal bowl as home base. Rice ~75% of the time; rotate farro/polenta/noodles/bread/couscous to prevent fatigue.
- **Cai** — 2–3 small, intensely flavored shared dishes. Together they *are* the meal; everyone makes a first pass across the full set.
- **Anchor** — one cai is the high-impact, freshly-cooked star (this bridges Western expectations). Patterns: wok stir-fry, steamed dish, cast-iron sear, oven roast, braise.
- **Soup** — a light soup at *some* nights, often from a frozen concentrated base cube. Optional — omit the field entirely on no-soup nights (don't write "None").
- **One-pot / build-your-own exceptions** — pasta, chili, tacos, pitas relax the structure; the pot or the spread is the meal.

## Sunday batch prep (the keystone)

The weeknight workflow only works because of Sunday prep: vacuum-seal/freeze cai components, season/bag proteins, make soup-base cubes, prep pickles and sauces. Weeknights then become: reheat bags, rice cooker on, soup cube in boiling water, **one active cooking task (the anchor)**.

**But prep weight is a per-week choice — always confirm it.** Some weeks the cook wants full sous-vide batching; some weeks "keep it light" means steaming a vegetable day-of instead of an SV bag, and skipping pre-made dressings. **Never assume sous-vide.** Ask what they're willing to prep today, and let anything they skip become a day-of step.

## Weekly workflow

**Default: chat-driven.** This is the flow to reach for:

1. **Lock the constraints first** — headcount, proteins on hand vs. needed, what's in the freezer/pantry, harissa-and-such on hand, budget, and the cook's energy this week.
2. **Pull from the archive.** Search `archive/` for meals matching the cook's asks (a specific dish, a protein, a pantry item). Cite exact file + `## Section` so meals can be copy-pasted.
3. **Resolve real forks with `AskUserQuestion`.** Use multi-step questions for genuine decisions — prep level, which cai, substitutions, scheduling — rather than guessing. Batch related questions; recommend a first option. This question-driven scaffolding is what makes the result fit without rework.
4. **Produce a scaffold before assembling** — a blueprint listing each locked meal, its source file/section, and explicit *keep verbatim* vs. *rewrite* notes, plus the Sunday prep and a merged grocery list. Get a thumbs-up.
5. **Assemble** `FOOD-OF-THE-WEEK.md` — copy-paste proven meals verbatim where they're good; apply only the targeted rewrites the week requires (swapped sides, substituted ingredients, lighter prep). Merge and categorize the grocery list.

**Heavier ideation:** the `brainstorming/` folder is available for free-form work. Root of `brainstorming/` is the current week's scratch space (any format); `brainstorming/old-ideas/` archives past scratch; `brainstorming/idea-basis/` is reference material (don't treat it as weekly scratch). Move root files to `old-ideas/` when starting fresh.

**Surface assumptions and contradictions.** If something is implied but unstated, or a request conflicts with what's on hand or already written, say so and ask — "this is implied, did you also want…?" That check-in is wanted, not an interruption.

## `FOOD-OF-THE-WEEK.md` structure

Use the most recent `archive/` file as the live template. Skeleton:

```
<!-- https://sh-ui.github.io/food-of-the-week/ -->

# Week of [Month DD-DD, YYYY]

## Grocery List
### Produce / ### Protein / ### Dairy / ### Pantry   (only categories that have items)
- [ ] Item - quantity/detail        (to buy)
- [x] Item                          (on hand)

---

## Sunday Prep
##### BatchDay
###### saturday: ... / sunday: ...

### Prep Checklist
### Workflow
### Protein Bags / ### Cai Bags / ### Soup Bases   (as applicable)

---

## [Meal Name]
##### [Codename]
###### [sous-chef night briefing]

#### Anchor:
#### Fan:
#### Cai:
#### Soup:        (omit entirely on no-soup nights)

### Already Prepped
- **Component** from Sunday.

### Sous Chef - Prep        (checklist; heavy nights only)
- [ ] Atomic task

### Sous Chef - Assembly    (composed cai builds + timing pegs)

### Chef - Wok Sequence  /  ### Chef - Cooking  /  ### Chef - Finishing
... ending with a **Table**: layout line.
```

### Heading and field conventions

- **`#` H1** — one per file, the week date range.
- **`##` H2** — Grocery List and each meal. Meals get **descriptive names only** — no "Meal 1:", no colon.
- **`#####` H5 codename** — immediately after the meal H2. Signals the night's shape: `WokNight` (wok-sequenced dishes), `Prep&Heat[+]` (family-delegated prep + oven/stove finish), `ChefDish[+]` (chef solo), `BatchDay` (Sunday prep). `+` marks rising day-ahead/hands-on effort.
- **`######` H6 briefing** — directly under the codename. A **sous-chef workflow fragment**: short phrases joined by ` + `, ordered by when the sous chef does each thing, with clock pegs only when they matter (`5:30 rice`, `bag in bath PM`). Example: `prep + bean salad + 5:30 boil`.
  - **Do NOT use the `⏱` stopwatch symbol or any duration in H6.** It's a workflow briefing, not a chef time-estimate. (This supersedes older files/commits that experimented with `⏱` — drop it.)
- **`####` H4 fields** — `Anchor:` / `Fan:` / `Cai:` / `Soup:`. Colon on the heading line; content on the next line. Consecutive H4s render as one card. Anchor = the louder cai / star dish; Cai = the shared supporting dishes.
- **`###` H3** — instruction sections (below) and grocery categories.
- **`---`** between meals for raw-readability (ignored by the parser/site).

### Grocery list

- Only include categories that have items. Custom categories (Dairy, Frozen) are fine.
- `- [ ]` = need to buy, `- [x]` = on hand. On-hand items go in their natural category — no separate "already have" section.
- Omit always-stocked flavor-cabinet staples (soy, oils, vinegars, salt, common spices) entirely unless worth a reminder.

### Three-phase recipe instructions

Reflect the real workflow (full detail in `.cursor/rules/recipe-instruction-format.mdc`):

- **`### Already Prepped`** — bulleted list of Sunday components used tonight, with storage state.
- **`### Sous Chef - Prep` / `### Sous Chef - Assembly`** — what helpers do before the chef cooks. Simple nights collapse to one Sous Chef section; heavy nights split into a `- [ ]` Prep checklist + a composed Assembly section with `**Dish name**:` builds and timing pegs.
- **`### Chef - Wok Sequence` / `### Chef - Cooking` / `### Chef - Finishing`** — the cook's active work, ending in a **`Table`:** layout line. On wok nights label dishes `**Wok dish 1 -- [name]**`, etc.

**Markdown emphasis conventions:** `**bold**` for every ingredient name; `*italic*` for sensory/technique/timing cues (*ripping hot*, *low*, *charred*); `***bold-italic***` only for critical action moments (***Taste***, ***probe***), used sparingly.

## Archiving lifecycle

When starting a new week:

1. `git mv FOOD-OF-THE-WEEK.md archive/YYYYMMDD-descriptive-kebab.md`, where the date is the **start date** of that week and the slug summarizes its meals (e.g. `20260517-tamal-parm-tilapia-dal.md`). This matches current practice and preserves history. (An older rule specified `YYYYMMDDsummary.md` — superseded; follow the recent archive naming.)
2. **Preserve `✓` markers** on cooked-meal headings (`## ✓ Meal Name`) — archives are a record of what was actually cooked, and recent archives keep them. (An older rule said to strip them — superseded.)
3. Write the new week's `FOOD-OF-THE-WEEK.md`.

Cooked meals in the *current* file are marked with a leading `✓` in the H2 (`## ✓ Orange Chicken`) — not strikethrough.

## Tone

Collaborative and direct. Give a recommendation rather than an exhaustive survey of options. No required preamble or per-reply rule-acknowledgment ritual. Don't reflexively agree — if an idea has a flaw or a request conflicts with constraints, say so plainly and propose the better path — but lead with helpfulness, not friction.

## Working with the published site

If asked to change the Astro site, parser, print logic, styling, or versioning — not the meal content — consult `.cursor/rules/` (`core-development`, `tailwind-implementation`, `print-sections`, `version-management`, `cross-branch-fixes`, `code-review-mode`). Those remain the authority for code work; this file does not duplicate them.
