# Food of the Week

> Weekly meal planning system for a household of 6-8

**[View or Edit This Week's Plan](FOOD-OF-THE-WEEK.md)** ⇒ [Live Site at food.schuepbach.work](https://sh-ui.github.io/food-of-the-week)

![Version](https://img.shields.io/badge/version-1.7.0-blue.svg)
![Status](https://img.shields.io/website?url=https://sh-ui.github.io/food-of-the-week&label=status&up_color=success&down_color=critical&up_message=active&down_message=down)

## About

A weekly meal planning system built with Astro that transforms a single structured markdown file into a published website with interactive grocery lists, printable recipes, and a hero quick-read summary. Built around a fan/cai family dinner model for a household of 6-8.

## How This Household Cooks

### Fan/Cai Structure

Every dinner follows a fan/cai framework rather than "one big dish per plate":

- **Fan** (staple grain) - rice most nights, rotated with farro, polenta, noodles, or bread to prevent fatigue
- **Cai** (shared dishes) - 2-3 small, intensely flavored dishes served family-style from the center of the table on a lazy susan
- **Anchor dish** - one of the cai dishes that reads as the high-impact star of the night; bridges Western expectations
- **Soup** - a light soup at some meals, built quickly from batch-prepped concentrated base cubes

The fan/cai structure is cuisine-agnostic - it accepts any flavor tradition. What stays constant is the shared table logic, not the cuisine. See the [fan/cai article](https://sh-ui.github.io/food-of-the-week/fancai) for the full background.

### Sunday Batch Prep

The keystone that makes the weeknight workflow sustainable. Each Sunday:

- Vacuum seal and freeze 4-6 cai components (braised veg, seasoned greens, stewed beans, slow-cooked proteins)
- Pre-season and bag proteins for the week
- Prep concentrated soup base cubes, freeze
- Make condiments, pickles, and sauces that last the week

Weeknight workflow becomes: daytime sous vide reheat of frozen cai bags, rice cooker on, soup cubes thawing, then one active cooking task - the anchor/cai finishing.

### Delegation Model

Each recipe has three phases:

- **Already Prepped** - Sunday prep components that are ready: what's in the fridge/freezer tonight
- **Sous Chef** - tasks done before the primary cook arrives (rice on, bags in bath, fresh prep, quick assembly)
- **Chef** - active hands-on cooking (wok, cast iron, oven); ends with a table layout line

### Equipment

Sous vide circulator (with remote app), vacuum sealer, wok, rice cooker, convection oven, kitchen torch, lazy susan, large ice cube trays for soup base freezing.

### Proteins

Often from ButcherBox deliveries - frozen, portioned, vacuum sealed. Thaw time is factored into the week's sequence.

## Weekly Workflow

1. **Brainstorm** - Plan meals in the `brainstorming/` folder
2. **Sunday Prep** - Batch cook, seal, and freeze the week's cai components and protein bags
3. **Finalize** - Structure the plan in `FOOD-OF-THE-WEEK.md` with all required sections
4. **Add Quick Reads** - Add H5 codename + H6 timing under each meal heading
5. **Deploy** - Push to GitHub, site auto-deploys in 2-3 minutes
6. **Shop** - Use the mobile-friendly site with persistent checkbox grocery list
7. **Archive** - At week's end, copy to `archive/YYYYMMDDsummary.md`

## Project Structure

```
GroceryPlanning/
├── FOOD-OF-THE-WEEK.md          # Current week's meal plan (content source)
├── WEEKEND.md                   # Weekend meal planning (separate page)
├── README.md                    # This file - project overview
├── TODOS.md                     # Development roadmap
├── LICENSE                      # AGPL-3.0 license
├── MIGRATION.md                 # Dependency migration plans (Tailwind v4, Marked v17)
├── .github/
│   ├── dependabot.yml           # Automated dependency updates
│   └── workflows/deploy.yml     # GitHub Pages deployment
├── brainstorming/               # Weekly planning workspace
│   ├── idea-basis/              # Reference: planning paradigms, inspirations, patterns
│   ├── old-ideas/               # Archive: completed week's brainstorming files
│   └── [current week files]     # Free-form workspace for active planning
├── archive/                     # Past weekly plans (YYYYMMDDsummary.md)
├── src/
│   ├── components/              # Astro components
│   │   ├── ActionButton.astro   # Reusable button/link component with variants
│   │   ├── BackToCurrentWeekButton.astro # Hero "← This Week" button for subpages
│   │   ├── GroceryList.astro    # Interactive grocery list with localStorage
│   │   ├── MealCard.astro       # Meal display with flex-parsing + quick read
│   │   ├── StickyHeader.astro   # Two-state header with dynamic scroll behavior
│   │   ├── WeeklyPlan.astro     # Main layout with hero summary rows
│   │   └── Footer.astro         # Site footer with links
│   ├── config/
│   │   └── colors.ts            # Palette-driven color system (references Tailwind)
│   ├── layouts/
│   │   └── Layout.astro         # Base HTML layout
│   ├── pages/
│   │   ├── index.astro          # Main page (FOOD-OF-THE-WEEK.md)
│   │   ├── weekend.astro        # Weekend page (WEEKEND.md)
│   │   ├── fancai.astro         # Article page (饭菜 / what is this)
│   │   └── archive/[slug].astro # Permalinks for archived weeks (archive/*.md)
│   ├── styles/
│   │   └── global.css           # Main styles with CSS custom properties
│   └── utils/
│       ├── weekParser.ts        # Position-based markdown parser
│       └── printGenerator.ts    # Print layout generation from config
├── public/
│   ├── favicon.svg
│   └── print-config.json        # Customize print layout
├── tailwind.config.mjs          # Single source of truth for colors, spacing, breakpoints
└── astro.config.mjs             # Astro build configuration
```

## Features

- **Quick Read Hero Summary** - Glance-able meal overview with codename badges and timing details, parsed from H5/H6 headings under each meal
- **Interactive Grocery Lists** - Checkboxes persist in browser localStorage with week-specific keys
- **Weekend Planning** - Dedicated weekend page with separate meal plans (`/weekend` route)
- **Flexible Markdown Parsing** - Position-based parser works with any markdown structure (no keyword dependencies)
- **Flexible Color System** - Palette-driven theming with automatic variant derivation and cycling
- **Three-Phase Instructions** - Color-coded workflow sections (Already Prepped, Sous Chef, Chef)
- **Smart Sticky Header** - Two-state header: minimal chef-hat at top, full navigation with section buttons when scrolled
- **Print Functionality** - Print full week, grocery list only, or individual meals with config-driven formatting
- **Mobile-Friendly** - Responsive design optimized for shopping and cooking on any device
- **Auto-Deployment** - Push to GitHub, site rebuilds and deploys automatically via GitHub Actions
- **Persistent State** - Grocery list checkbox states saved per week, survives browser refresh
- **Static Site Generation** - Fast, secure, and hostable anywhere (currently on GitHub Pages)
- **Stable Section Permalinks** - Slugified meal IDs allow direct `/#meal-slug` links that match header/nav state
- **Archive Permalinks** - Archived weeks in `archive/*.md` are built to `/archive/<filename-stem>/`

## Quick Read System

Each meal includes a "quick read" that gives you an instant understanding of what kind of work it requires and when to do key tasks. This appears as a hero row at the top of the page and helps with meal planning at a glance.

### Format

Quick reads are added using H5/H6 headings immediately after each meal heading in `FOOD-OF-THE-WEEK.md`:

```markdown
## Sweet Pork Curry

##### SousVidePrep+
###### prep + toast panko + 5:30 rice

#### Anchor:
Ground pork simmered in Japanese curry sauce with potatoes and carrots, topped with toasted panko

#### Fan:
Japanese rice

#### Cai:
Smashed cucumber salad (fresh, rice wine vinegar), soy eggs (from Sunday)

#### Soup:
Dashi wih green onions and thinly sliced mushroom

### Already Prepped
- **Pork curry bag** (seasoned, vacuum sealed) in freezer from Sunday.
- **Soy eggs** in marinade in fridge from Sunday.

### Sous Chef - Assembly
Start **rice**. At 5:30 drop **curry bag** into the sous vide bath (chef set remotely). Smash **cucumbers**, dress with rice wine vinegar and a pinch of salt, set aside.

### Chef - Cooking
Pull curry bag, open, pour into saucepan. Simmer 5 min, taste and adjust. Toast **panko** in a dry pan until golden. **Table**: **rice** in individual bowls, **curry** center on the lazy susan, **cucumber salad** and **soy eggs** in small shared dishes, soup in small bowls. Panko at the table for topping.
```

The H5 line is the **codename** (workload category), and the H6 line provides **timing details**. The `⏱` symbol marks chef hands-on time (e.g. `20 min ⏱`).

### Codenames

Codenames signal the night's workflow pattern - primarily who does what and how complex:

| Codename | What It Means | Examples |
|----------|---------------|----------|
| **BatchDay** | Sunday batch prep session - not a meal, a prep day | Sunday protein bags, cai batches, soup bases |
| **WokNight** | Wok-sequenced meal - 1-3 quick cai fired in a row | Stir-fries, mapo tofu, dry green beans + another cai |
| **ChefDish** | Chef-driven night - limited sous chef delegation | Cast iron sear, skillet braise, solo technique |
| **Prep&Heat** | Family-delegated prep + oven or stovetop finish | Meatballs, sheet pan, reheated batch components |
| **SousVidePrep** | Sous vide is the technique anchor + supporting prep | SV protein morning + rice + one fresh cai |
| **SousChefDish** | Sous chef owns the complete cooking process | Sheet pan roasts, one-pot pastas, full oven dishes |

Add `+` for each additional layer of complexity or timing pressure. `SousVidePrep+` = sous vide + extra fresh prep work. `ChefDish++` = significant day-ahead AND complex hands-on evening.

### Timing Details

The H6 line provides **actionable scheduling information** - specific times and key actions, not a repeat of the codename:

**What to include:**
- Sous vide drop times: `4:00 chicken SV`
- Rice cooker timing: `5:30 rice`
- Multiple handoffs: `3:30 veg + 5:30 rice`
- Key prep steps: `prep + toast panko`
- Total prep time for BatchDay: `2-3 h ⏱`

**What to avoid:**
- Don't repeat the codename (don't write "sous vide" after `SousVidePrep`)
- Don't use generic descriptions - focus on specific times and actions
- Keep it short - 1-2 key timing points maximum

### Meal Fields

Each meal uses H4 headings with colons to describe what's on the table that night:

| Field | What It Means |
|-------|---------------|
| `#### Anchor:` | The louder cai / primary protein dish - the star |
| `#### Fan:` | The staple grain (rice, farro, noodles, bread) |
| `#### Cai:` | Supporting shared dishes served family-style |
| `#### Soup:` | Soup or `None` with a short reason |

Consecutive H4 headings are grouped into one visual card on the site.

### How Quick Reads Work

The parser automatically extracts quick read data from these sub-headings and:
- Displays them as colored badge rows in the hero section (clickable to jump to that meal)
- Shows them on each meal card for reference while cooking
- Includes them in printed meal plans

If a meal doesn't have quick read headings, the meal name still appears in the hero navigation - just without the detailed badges.

## Customization

### Color Theming

The site uses a centralized color system with **Tailwind CSS as the single source of truth**.

**Architecture:**
```
tailwind.config.mjs     ← Define ALL colors here (hex values)
        ↓
src/config/colors.ts    ← References Tailwind colors, handles cycling logic
        ↓
Components              ← Use Tailwind utilities OR colors.ts for dynamic styling
```

**To customize colors:**

1. **Base theme colors** - Edit `tailwind.config.mjs` under `theme.extend.colors`:
   ```js
   colors: {
     'primary': '#494331',        // Headings, buttons
     'secondary': '#F3CA40',      // Accent (info group border)
     'accent': '#F08A4B',         // Highlights
     'bg': '#FAF8F3',             // Page background
     'bg-alt': '#F5F2EB',         // Subsection backgrounds
     'border': '#E8E3D8',         // Card borders
     // ... cooked state colors, text colors, etc.
   }
   ```

2. **Instruction palette** - Define cycling colors in `theme.extend.instructionPalette`:
   ```js
   instructionPalette: [
     { name: 'salmon', color: '#D78A76' },
     { name: 'yellow', color: '#F3CA40' },
     { name: 'orange', color: '#F08A4B' },
   ]
   ```
   The system automatically derives `bg` and `heading` variants from each base color. Add any number of palette entries - they cycle automatically.

3. **Subsection overrides** - Configure named and position-based overrides in `theme.extend.instructionSubsections.overrides`:
   ```js
   instructionSubsections: {
     overrides: {
       info: { bg: 'bg-alt', border: 'secondary', heading: 'primary' }, // info section (H4 fields + quick read details)
       1: { scheme: 'salmon' },           // Use palette entry by name (second instruction block)
       2: { bg: 'bg-alt', border: '#81E3F6', heading: 'primary' }, // Explicit overrides must include all three keys
     },
   }
   ```

**How it works:**
- **Palette-driven**: Define base colors once, system derives variants automatically
- **Automatic cycling**: Instruction sections cycle through palette entries (wraps if more sections than colors)
- **Flexible overrides**: Break the cycle for specific positions using palette names or Tailwind tokens
- **Single source of truth**: All configuration in `tailwind.config.mjs`, `colors.ts` handles derivation logic
- **Partial override objects are rejected**: `{ border: '#81E3F6' }` is invalid. Provide `{ bg, border, heading }` or `{ scheme: 'name' }`.

**Example customizations:**

| Goal | Edit |
|------|------|
| Add a 4th cycling color | Add `{ name: 'green', color: '#22C55E' }` to `instructionPalette` array |
| Change info group colors | Edit `instructionSubsections.overrides.info` in tailwind.config.mjs |
| Override 2nd instruction to use salmon | Add `1: { scheme: 'salmon' }` to `instructionSubsections.overrides` |
| Use explicit colors for position 3 | Add `2: { bg: 'bg-alt', border: '#81E3F6', heading: 'primary' }` to overrides |
| Theme a new subsection type by name | Add `overrides.<name>` and call `getSubsectionScheme('<name>')` |

**Note:** CSS custom properties in `global.css` mirror Tailwind colors for backwards compatibility with scoped component styles.


### Print Configuration

The print layout is fully customizable via `public/print-config.json`:

**What you can customize:**
- **Page margins** - Adjust print margins (top, right, bottom, left)
- **Typography** - Font families, sizes, line heights for headings and body text
- **Spacing** - Gaps between sections, paragraphs, and list items
- **Checkbox style** - Size, symbols for checked/unchecked items
- **Layout options** - Page breaks between meals, category headings visibility

**How it works:**
1. Edit `public/print-config.json` with your preferred settings
2. Print functionality loads this config at runtime in the browser
3. Generated print documents use your custom layout
4. No code changes needed - just edit the JSON file

**Example:** To make print text larger, change `"bodyFontSize": "11pt"` to `"12pt"` in print-config.json.

## Tech Stack

- **[Astro](https://astro.build)** v5.16.5 - Static site generation with zero-JS by default
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe parsing and utilities
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS with centralized config as single source of truth
- **[marked](https://marked.js.org/)** - Markdown parser for structured content
- **GitHub Pages** - Free static hosting with custom domain support
- **GitHub Actions** - Automated CI/CD pipeline for deployment
- **localStorage** - Client-side persistence for grocery list state

### Tailwind Integration

This project uses Tailwind CSS with `applyBaseStyles: false` (custom typography preserved). Key points:

- **All design tokens** (colors, spacing, breakpoints) defined in `tailwind.config.mjs`
- **Utilities first** - Use Tailwind classes for layout, spacing, colors where possible
- **Scoped CSS** - Only for complex styling (pseudo-elements, semantic states like `.meal-cooked`)
- **Important:** When using borders, always include `border-solid` (base styles not applied)
- **CSS variables** in `global.css` mirror Tailwind config for scoped component styles

## Development

### Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The site will be available at `http://localhost:4321`

### Dependencies

All dependencies are managed via npm and automatically kept up-to-date using Dependabot:
- Production dependencies checked weekly
- Security patches applied automatically
- GitHub Actions dependencies checked monthly

---

## Contributing

This is a personal meal planning system, but contributions are welcome! If you'd like to:

- Report a bug or suggest a feature → [Open an issue](https://github.com/sh-ui/food-of-the-week/issues)
- Contribute code → Fork the repo and submit a pull request
- Adapt for your own use → Fork and customize (see License below)

See [TODOS.md](TODOS.md) for planned features and development roadmap.

## License

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

This project is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).

### What this means:

✅ **You can:**
- Use this software for free
- Modify it for your own needs
- Share it with others
- Run your own instance

⚠️ **You must:**
- Make your source code available if you run a modified version as a web service
- Keep the same AGPL-3.0 license
- Credit the original project
