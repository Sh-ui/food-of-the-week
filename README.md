# Food of the Week

> Weekly meal planning system for a household of 5

**[View or Edit This Week's Plan](FOOD-OF-THE-WEEK.md)** ⇒ [Live Site at food.schuepbach.work](https://sh-ui.github.io/food-of-the-week)

![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)
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
3. **Deploy** - Push to GitHub, site auto-deploys in 2-3 minutes
4. **Shop** - Use the mobile-friendly site with persistent checkbox grocery list
5. **Archive** - At week's end, copy to `archive/YYYYMMDDsummary.md`

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
│   │   ├── GroceryList.astro    # Interactive grocery list with localStorage
│   │   ├── MealCard.astro       # Meal display with flex-parsing
│   │   ├── StickyHeader.astro   # Navigation + print functionality
│   │   ├── WeeklyPlan.astro     # Main layout orchestrator
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

### Current Features

- **Interactive Grocery Lists** - Checkboxes persist in browser localStorage with week-specific keys
- **Weekend Planning** - Dedicated weekend page with separate meal plans (`/weekend` route)
- **Flexible Markdown Parsing** - Position-based parser works with any markdown structure (no keyword dependencies)
- **Flexible Color System** - Palette-driven theming with automatic variant derivation and cycling
- **Three-Phase Instructions** - Color-coded workflow sections (Already Prepped, Sous Chef, Chef Finishing)
- **Print Functionality** - Print full week, grocery list only, or individual meals with config-driven formatting
- **Mobile-Friendly** - Responsive design optimized for shopping and cooking on any device
- **Auto-Deployment** - Push to GitHub, site rebuilds and deploys automatically via GitHub Actions
- **Persistent State** - Grocery list checkbox states saved per week, survives browser refresh
- **Static Site Generation** - Fast, secure, and hostable anywhere (currently on GitHub Pages)

### Coming Soon

See [TODOS.md](TODOS.md) for the complete development roadmap including:
- **Cheffy** - Interactive assistant character for notifications, calendar sync, and archive navigation
- **PWA Support** - Install as app, offline access, and background sync
- **Archive Search** - Full-text search across past meal plans
- **Recipe Timeline** - Extract cooking timelines and export to calendar

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
