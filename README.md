# Food of the Week

> Weekly meal planning system for a household of 5

**[View or Edit This Week's Plan →](FOOD-OF-THE-WEEK.md)** | [Live Site](https://sh-ui.github.io/food-of-the-week)

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

1. **Brainstorm** - Plan meals in the `brainstorming/` folder with AI assistance
2. **Finalize** - Structure the plan in `FOOD-OF-THE-WEEK.md` with all required sections
3. **Deploy** - Push to GitHub, site auto-deploys in 2-3 minutes
4. **Shop** - Use the mobile-friendly site with persistent checkbox grocery list
5. **Archive** - At week's end, copy to `archive/YYYYMMDDsummary.md`

## Project Structure

- **`FOOD-OF-THE-WEEK.md`** - Current week's meal plan (data source for website)
- **`brainstorming/`** - Free-form weekly planning workspace
- **`archive/`** - Past weekly plans in YYYYMMDDsummary.md format
- **`.cursor/rules/`** - AI assistant guidelines for meal planning philosophy
- **`print-config.json`** - Customize print layout (margins, spacing, fonts)
- **`src/`** - Astro website components, styles, and utilities
- **`rule-basis/`** - Reference philosophy documents

## Features

- **Interactive Grocery Lists** - Checkboxes save to browser localStorage
- **Three-Phase Instructions** - Color-coded sections (Already Prepped, Sous Chef, Chef Finishing)
- **Print Functionality** - Print full week, grocery list only, or individual meals
- **Mobile-Friendly** - Responsive design for shopping and cooking
- **Auto-Deployment** - Push to GitHub, site updates automatically

## Print Configuration

Edit `print-config.json` at the project root to adjust print layout settings including page margins, typography, and spacing. Changes take effect after restarting the dev server.

## Technologies

- **Astro** - Static site generation
- **GitHub Pages** - Hosting
- **GitHub Actions** - Auto-deployment
- **TypeScript** - Type-safe code
- **CSS** - Custom print media queries
