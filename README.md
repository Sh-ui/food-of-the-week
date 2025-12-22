# Food of the Week

> Weekly meal planning system for a household of 5

**[View or Edit This Week's Plan](FOOD-OF-THE-WEEK.md)** ⇒ [Live Site at food.schuepbach.work](https://sh-ui.github.io/food-of-the-week)

![Version](https://img.shields.io/badge/version-1.6.0-blue.svg)
![Status](https://img.shields.io/website?url=https://sh-ui.github.io/food-of-the-week&label=status&up_color=success&down_color=critical&up_message=active&down_message=down)

## About

This is a weekly meal planning system built with Astro that transforms structured meal plans into a beautiful, printable website with interactive grocery lists. The system supports a three-phase cooking workflow (Already Prepped, Sous Chef, Chef Finishing) designed for efficient weeknight dinners with family delegation.

## Assumptions

### Sous Vide Workflow

- Many dishes use sous vide for prep and precision cooking
- Vegetables often pre-cooked sous vide and vacuum sealed
- Proteins cooked sous vide then chef-finished (various techniques)
- Allows warming pre-cooked components alongside cooking proteins
- Remote temperature control via app

### Meat Sourcing

- Meat comes from ButcherBox deliveries
- Chef preps meat in advance (seasoning, vacuum sealing, portioning)
- Batch prep workflow before meal days

### Family Delegation

- Three-phase instruction format guides the cooking flow
- Sous Chef handles prep and initial cooking before primary cook arrives
- Chef handles finishing techniques, saucing, and plating
- Clear delegation boundaries in every recipe

## Weekly Workflow

1. **Brainstorm** - Plan meals in the `brainstorming/` folder
2. **Finalize** - Structure the plan in `FOOD-OF-THE-WEEK.md` with all required sections
3. **Add Quick Reads** - Add a blockquote under each meal heading with codename and timing details
4. **Deploy** - Push to GitHub, site auto-deploys in 2-3 minutes
5. **Shop** - Use the mobile-friendly site with persistent checkbox grocery list
6. **Archive** - At week's end, copy to `archive/YYYYMMDDsummary.md`

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
│   │   └── weekend.astro        # Weekend page (WEEKEND.md)
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

- **Quick Read Hero Summary** - Glance-able meal overview with codename badges (Prep&Heat, SousVidePrep, etc.) and timing details parsed from blockquotes in each meal section
- **Interactive Grocery Lists** - Checkboxes persist in browser localStorage with week-specific keys
- **Weekend Planning** - Dedicated weekend page with separate meal plans (`/weekend` route)
- **Flexible Markdown Parsing** - Position-based parser works with any markdown structure (no keyword dependencies)
- **Flexible Color System** - Palette-driven theming with automatic variant derivation and cycling
- **Three-Phase Instructions** - Color-coded workflow sections (Already Prepped, Sous Chef, Chef Finishing)
- **Smart Sticky Header** - Two-state header: minimal chef-hat at top, full navigation with section buttons when scrolled
- **Print Functionality** - Print full week, grocery list only, or individual meals with config-driven formatting
- **Mobile-Friendly** - Responsive design optimized for shopping and cooking on any device
- **Auto-Deployment** - Push to GitHub, site rebuilds and deploys automatically via GitHub Actions
- **Persistent State** - Grocery list checkbox states saved per week, survives browser refresh
- **Static Site Generation** - Fast, secure, and hostable anywhere (currently on GitHub Pages)
- **Stable Section Permalinks** - Slugified meal IDs allow direct `/#meal-slug` links that match header/nav state

## Quick Read System

Each meal includes a "quick read" that gives you an instant understanding of what kind of work it requires and when to do key tasks. This appears as a hero row at the top of the page and helps with meal planning at a glance.

### Format

Quick reads are added using H5/H6 headings immediately after each meal heading in `FOOD-OF-THE-WEEK.md`:

```markdown
## Sweet Pork Curry

##### SousVidePrep+
###### prep + toast panko + 5:30 rice

#### Protein:
Frozen ground pork

#### Ingredients:
Potatoes, carrots, yellow onion, frozen peas, Japanese curry cubes + honey, ginger paste, panko breadcrumbs, Japanese rice, American bagged salad, Japanese dressing

#### Description:
A weeknight-friendly deconstructed take on Japanese pork katsu curry—ground pork simmered in rich curry sauce with potatoes and carrots, topped with toasted breadcrumbs for that katsu crunch. Served with Japanese rice and a simple salad.
```

The H5 line is the **codename** (workload category), and the H6 line provides **timing details** (specific actions and when to do them).

### Codenames

Codenames describe the type and intensity of work from the **Sous Chef's perspective** (the person doing prep before the main cook arrives):

| Codename | What It Means | Examples |
|----------|---------------|----------|
| **Prep&Heat** | Basic chopping/prep + simple heating | Tostadas, simple stir-fries, assembly dishes |
| **SousVidePrep** | Sous vide setup + supporting prep work | Starting mire poix sous vide, forming patties, rice cooker setup |
| **SousChefDish** | Sous chef owns the complete cooking process | Sheet pan roasts, one-pot pastas, full oven dishes |

### Intensity Modifiers

Add `+` for increased complexity or multiple components:

- **Single `+`**: Extra prep steps, multiple components, or extended time
  - Example: `SousVidePrep+` = sous vide + patty forming + toasting breadcrumbs
- **Double `++`**: Complex multi-step work like bread-making plus sous vide
  - Example: `SousVidePrep++` = bread + sous vide beets + sous vide chicken

### Timing Details

The second line of the quick read provides **actionable timing information**—the critical "when" and "what" that helps the Sous Chef schedule their work.

**What to include:**
- Sous vide start times: `4:00 mire poix`
- Rice cooker timing: `5:30 rice`
- Multiple components: `3:30 veg + 5:30 rice`
- Key prep steps: `prep + toast panko`
- Oven operations: `Couscous + oven roast`

**What to avoid:**
- Don't repeat information from the codename (e.g., don't write "sous vide" after `SousVidePrep`)
- Don't include generic descriptions—focus on specific times and actions
- Keep it concise—usually 1-2 key timing points

**Examples:**

```markdown
## Gringo Tostadas
> Prep&Heat
>
> cut toppings + heat stuff
```
Simple prep work with basic heating—no complex timing needed.

```markdown
## Lamb Patties & Veg
> SousVidePrep
>
> 4:00 mire poix + 5:00 patties
```
Two timed tasks: start sous vide at 4pm, form patties at 5pm.

```markdown
## Spiced SheetPan Fish
> SousChefDish
>
> 5:30 Couscous + oven roast
```
Sous chef handles complete cooking process—start rice cooker and manage oven.

### How Quick Reads Work

The parser automatically extracts quick read data from these blockquotes and:
- Displays them as colored badge rows in the hero section (clickable to jump to that meal)
- Shows them on each meal card for reference while cooking
- Includes them in printed meal plans

If a meal doesn't have a quick read blockquote, it will still appear in the navigation—just without the detailed badges.



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

3. **Subsection overrides** - Configure info group and position-specific overrides in `theme.extend.instructionSubsections`:
   ```js
   instructionSubsections: {
     info: { bg: 'bg-alt', border: 'secondary', heading: 'primary' },
     overrides: {
       0: { scheme: 'salmon' },           // Use palette entry by name
       2: { border: '#81E3F6' },           // Or use explicit Tailwind keys/hex
     },
   }
   ```

**How it works:**
- **Palette-driven**: Define base colors once, system derives variants automatically
- **Automatic cycling**: Instruction sections cycle through palette entries (wraps if more sections than colors)
- **Flexible overrides**: Break the cycle for specific positions using palette names or Tailwind tokens
- **Single source of truth**: All configuration in `tailwind.config.mjs`, `colors.ts` handles derivation logic

**Example customizations:**

| Goal | Edit |
|------|------|
| Add a 4th cycling color | Add `{ name: 'green', color: '#22C55E' }` to `instructionPalette` array |
| Change info group colors | Edit `instructionSubsections.info` in tailwind.config.mjs |
| Override 2nd instruction to use salmon | Add `0: { scheme: 'salmon' }` to `instructionSubsections.overrides` |
| Use custom color for position 3 | Add `2: { bg: 'bg-alt', border: '#81E3F6', heading: 'primary' }` to overrides |

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
2. StickyHeader print functionality reads this config at runtime
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
