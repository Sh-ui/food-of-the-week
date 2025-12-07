# Food of the Week - Project Guide

## Overview

This is your weekly meal planning system built with Astro and deployed to GitHub Pages. It transforms your `README.md` file into a beautiful, printable website with grocery checklists and meal instructions.

## Project Structure

```
GroceryPlanning/
├── .cursor/rules/           # AI assistant rules for meal planning
├── .github/workflows/       # GitHub Actions for deployment
├── archive/                 # Past weekly meal plans (YYYYMMDDsummary.md)
├── brainstorming/          # Free-form weekly planning workspace
├── rule-basis/             # Reference philosophy documents
├── src/
│   ├── components/         # Astro components (GroceryList, MealCard, etc.)
│   ├── layouts/           # Page layouts
│   ├── pages/             # Main pages (index.astro)
│   ├── styles/            # CSS (global.css, print.css)
│   └── utils/             # Utilities (readmeParser.ts)
├── public/                # Static assets
├── README.md              # Current week's meal plan (source for website)
└── README-TEMPLATE.md     # Template for new weeks
```

## Weekly Workflow

### 1. Brainstorming Phase

Start your week in the `brainstorming/` folder:
- Create any files you need (.md, .txt, etc.)
- Jot down ideas, ingredients, meal concepts
- The AI assistant will help guide you based on your cooking philosophy

### 2. Finalize the Week

When ready, structure your plan in `README.md`:
- Follow the template structure (see README-TEMPLATE.md)
- Include all 5 required grocery categories
- Create 4-5 meal sections with consistent formatting

### 3. Deploy to GitHub Pages

Push to GitHub:
```bash
git add .
git commit -m "Week of [Date]: [Description]"
git push origin main
```

GitHub Actions will automatically build and deploy your site.

### 4. Archive the Week

At week's end, archive your plan:
```bash
# Copy README.md content to archive/YYYYMMDDsummary.md
# Example: archive/20251207summary.md for week starting Dec 7, 2025
```

Then update README.md with next week's plan.

## Website Features

### Grocery List
- Interactive checkboxes that save to localStorage
- Organized by category (Produce, Staples, Dairy, Protein, Frozens)
- Printable as standalone document

### Meal Cards
- Each meal displayed with:
  - Protein summary
  - Ingredients list
  - Description
  - Chef-style instructions
- Printable individually

### Print Buttons
- **Print Full Week**: All content in one document
- **Print Grocery List**: Just the shopping list
- **Print This Meal**: Individual meal cards

## Cursor Rules

The `.cursor/rules/` directory contains AI assistant guidelines:

1. **meal-planning-philosophy.mdc**: Your cooking style, constraints, and preferences
2. **brainstorming-workflow.mdc**: How to use the brainstorming folder
3. **readme-current-week.mdc**: README.md structure standards
4. **print-sections.mdc**: How print buttons work

These rules help the AI assistant understand your needs when planning meals.

## Development Commands

### Install Dependencies
```bash
npm install
```

Note: Requires Node.js 18+ (you may need to upgrade your Node version)

### Local Development
```bash
npm run dev
```

Visit `http://localhost:4321` to preview locally.

### Build for Production
```bash
npm run build
```

Generates static files in `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

## GitHub Pages Setup

### Initial Setup (Already Done)
1. Repository created and initialized
2. GitHub Actions workflow configured
3. Astro config set with correct base path

### To Enable GitHub Pages
1. Go to repository Settings
2. Navigate to Pages section
3. Set Source to "GitHub Actions"
4. Your site will be available at: `https://sh-ui.github.io/GroceryPlanning`

## README.md Format

### Required Structure

```markdown
# Week of [Date Range]

## Grocery List

### Produce
- [ ] Item 1
- [ ] Item 2

### Staples
- [ ] Item 1

### Dairy
- [ ] Item 1

### Protein
- [ ] Item 1

### Frozens
- [ ] Item 1

## Meal 1: [Name]
**Protein:** ...
**Ingredients:** ...
**Description:** ...
**Instructions:** ...

## Meal 2: [Name]
...
```

### Key Points
- Use H1 (`#`) for week title only
- Use H2 (`##`) for Grocery List and each Meal
- Use H3 (`###`) for grocery categories
- Use markdown task lists (`- [ ]`) for grocery items
- Format meal fields with bold labels

## Meal Planning Philosophy

Your system is optimized for:
- **Household of 5** with weeknight time constraints
- **One-pot/sheet-pan** priority for minimal cleanup
- **Delegation**: Recipes anticipate family helpers
- **Frozen proteins** from your freezer
- **Modular patterns**: Stir-fry, sheet-pan, warm salad, etc.
- **Chef-to-chef style**: Sketches, not rigid recipes
- **Flavor anchors**: Specialty oils and vinegars

See `rule-basis/RULE-FRAME.md` for complete philosophy.

## Troubleshooting

### Node Version Issues
If you see "Node.js v11.6.0 is out of date":
```bash
# Use n to upgrade Node
n lts
```

### Build Errors
Check that README.md follows the correct structure with proper headings.

### Checkboxes Not Saving
Ensure localStorage is enabled in your browser. Checkboxes are keyed by week title.

### GitHub Pages Not Updating
1. Check Actions tab for build status
2. Ensure GitHub Pages is enabled in Settings
3. Wait a few minutes for deployment to complete

## Tips

- **Brainstorm freely**: Use brainstorming/ for rough ideas
- **Keep README clean**: Follow the template structure
- **Archive regularly**: Move completed weeks to archive/
- **Use print buttons**: Each section can print independently
- **Mobile friendly**: Website works on phones for grocery shopping
- **Checkbox persistence**: Your shopping progress saves locally

## Next Steps

1. **Push to GitHub**: Get your first deploy live
2. **Enable GitHub Pages**: In repository settings
3. **Test the site**: Visit your GitHub Pages URL
4. **Plan next week**: Use the brainstorming workflow

## Support

Refer to:
- `README-TEMPLATE.md` for formatting reference
- `rule-basis/RULE-FRAME.md` for planning philosophy
- `.cursor/rules/` for AI assistant guidelines
- GitHub Actions logs for deployment issues

Happy meal planning! 🍽️

