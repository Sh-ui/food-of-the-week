# Food of the Week

> Weekly meal planning system for a household of 5

**[View or Edit This Week's Plan](FOOD-OF-THE-WEEK.md)** ⇒ [Live Site at food.schuepbach.work](https://sh-ui.github.io/food-of-the-week)

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
├── LICENSE.md                   # AGPL-3.0 license
├── .github/
│   ├── dependabot.yml           # Automated dependency updates
│   └── workflows/deploy.yml     # GitHub Pages deployment
├── brainstorming/               # Free-form weekly planning workspace
│   ├── stuff-coming.txt         # Ingredients to use soon
│   └── stuff-we-have.txt        # Current pantry inventory
├── archive/                     # Past weekly plans (YYYYMMDDsummary.md)
├── src/
│   ├── components/              # Astro components
│   │   ├── GroceryList.astro    # Interactive grocery list with localStorage
│   │   ├── MealCard.astro       # Meal display with flex-parsing
│   │   ├── StickyHeader.astro   # Navigation + print functionality
│   │   ├── WeeklyPlan.astro     # Main layout orchestrator
│   │   └── Footer.astro         # Site footer with links
│   ├── config/
│   │   └── colors.ts            # Centralized color theming system
│   ├── layouts/
│   │   └── Layout.astro         # Base HTML layout
│   ├── pages/
│   │   ├── index.astro          # Main page (FOOD-OF-THE-WEEK.md)
│   │   └── weekend.astro        # Weekend page (WEEKEND.md)
│   ├── styles/
│   │   ├── global.css           # Main styles with CSS custom properties
│   │   └── print.css            # Print-specific styles
│   └── utils/
│       └── weekParser.ts        # Position-based markdown parser
├── public/
│   ├── favicon.svg
│   └── print-config.json        # Customize print layout
├── tailwind.config.mjs          # Tailwind CSS configuration
├── astro.config.mjs             # Astro build configuration
├── .cursor/
│   └── rules/                   # AI assistant guidelines
└── rule-basis/                  # Reference philosophy documents
```

## Features

### Current Features

- **Interactive Grocery Lists** - Checkboxes persist in browser localStorage with week-specific keys
- **Weekend Planning** - Dedicated weekend page with separate meal plans (`/weekend` route)
- **Flexible Markdown Parsing** - Position-based parser works with any markdown structure (no keyword dependencies)
- **Themeable Color System** - Centralized colors with automatic cycling for instruction sections
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

## Print Configuration

Edit `print-config.json` in the `public/` folder to adjust print layout settings including page margins, typography, and spacing.

## Tech Stack

- **[Astro](https://astro.build)** v5.16+ - Static site generation with zero-JS by default
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe parsing and utilities
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework (used alongside custom CSS)
- **[marked](https://marked.js.org/)** - Markdown parser for structured content
- **GitHub Pages** - Free static hosting with custom domain support
- **GitHub Actions** - Automated CI/CD pipeline for deployment
- **CSS Custom Properties** - Design system with centralized color theming
- **localStorage** - Client-side persistence for grocery list state

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

This project is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE.md).

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
