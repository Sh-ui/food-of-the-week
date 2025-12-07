# Next Steps - Getting Food of the Week Live

## ⚠️ Important: Node.js Version

Your current Node.js version (11.6.0) is too old for Astro. You'll need to upgrade before building.

### Upgrade Node.js

```bash
# Option 1: Using n (already installed on your system)
sudo n lts

# Option 2: If you prefer a specific version
sudo n 20
```

After upgrading, verify:
```bash
node --version  # Should show v18.x or v20.x or higher
```

## 📦 Install Dependencies

Once Node is upgraded:

```bash
cd /Users/ianschuepbach/Documents/GroceryPlanning
npm install
```

This will install Astro, marked (markdown parser), and all other dependencies.

## 🧪 Test Locally

```bash
npm run dev
```

Visit `http://localhost:4321` to see your meal plan website locally.

**Note**: The site automatically works at the root path (`/`) for local development and at `/GroceryPlanning` for GitHub Pages production. No need to worry about the base path!

You should see:
- Your week's title
- Interactive grocery list with checkboxes
- 4 meal cards with print buttons
- Print Full Week button at the top

Test the print buttons and checkbox persistence!

## 🚀 Deploy to GitHub Pages

### Step 1: Commit and Push

```bash
# Add all files
git add .

# Commit
git commit -m "Initial Food of the Week setup"

# Push to GitHub
git push origin main
```

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/Sh-ui/GroceryPlanning`
2. Click **Settings** tab
3. Click **Pages** in the left sidebar
4. Under "Build and deployment":
   - Source: Select **GitHub Actions**
5. Wait 2-3 minutes for the first deployment

### Step 3: Visit Your Site

Your site will be live at:
```
https://sh-ui.github.io/GroceryPlanning
```

## ✅ What Was Built

### 1. Four Cursor Rules
Located in `.cursor/rules/`:
- **meal-planning-philosophy.mdc**: Your cooking style and preferences
- **brainstorming-workflow.mdc**: How to use the brainstorming folder
- **readme-current-week.mdc**: README.md structure standards
- **print-sections.mdc**: Print functionality rules

These guide the AI when you're planning future weeks.

### 2. Astro Website
- **Components**: GroceryList, MealCard, PrintButton, WeeklyPlan
- **Parser**: Reads README.md and converts to structured data
- **Styling**: Modern, mobile-friendly design
- **Print CSS**: Three print modes (full week, grocery only, individual meals)

### 3. GitHub Actions
- **Auto-deploy**: Pushes to main trigger automatic builds
- **GitHub Pages**: Static site generation and hosting

### 4. Current Week Content
- **README.md**: Week of Dec 7-13, 2025 with your 4 meals
- **Grocery List**: All items organized by category
- **Instructions**: Chef-style sketches for each meal

### 5. Documentation
- **PROJECT-GUIDE.md**: Complete usage guide
- **README-TEMPLATE.md**: Template for future weeks
- **NEXT-STEPS.md**: This file!

## 📋 Weekly Workflow

For each new week:

### 1. Brainstorm (Monday/Tuesday)
```bash
# Create files in brainstorming/
code brainstorming/this-week-ideas.md
```

Chat with the AI about:
- What proteins you have
- What's in your pantry
- Time constraints this week

### 2. Finalize (Mid-week)
Update `README.md` with the finalized plan:
- Copy from README-TEMPLATE.md
- Fill in grocery list (5 categories)
- Write 4-5 meals with instructions
- Follow the structure exactly

### 3. Deploy (Thursday/Friday)
```bash
git add README.md
git commit -m "Week of [Date]: [Brief description]"
git push origin main
```

Site updates automatically in 2-3 minutes!

### 4. Shop (Weekend)
- Visit your site on your phone
- Check off items as you shop
- Checkboxes save to your browser

### 5. Archive (End of week)
```bash
# Copy current week to archive
cp README.md archive/20251207summary.md

# Start next week in README.md
```

## 🎯 Quick Commands Reference

```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check Astro
npm run astro -- --help
```

## 🔍 Verify Everything

Before deploying, check:

- [ ] Node.js is v18 or higher (`node --version`)
- [ ] Dependencies installed (`npm install` successful)
- [ ] Local site works (`npm run dev`)
- [ ] README.md has proper structure
- [ ] Grocery list uses `- [ ]` format
- [ ] Meals have required fields (Protein, Ingredients, Description)
- [ ] All 4 cursor rules are in `.cursor/rules/`

## 🐛 Common Issues

### "npm ERR! code EPERM"
- Run with sudo: `sudo npm install`
- Or upgrade Node first

### "Node.js is out of date"
- See Node.js Version section above
- Must upgrade before installing

### Print buttons don't work
- Check browser console for JavaScript errors
- Ensure print.css is loaded

### Checkboxes don't persist
- Check browser localStorage is enabled
- Try a different browser

### Site shows "No meal plan available"
- README.md structure might be wrong
- Check heading levels (H1 for title, H2 for sections)
- Verify file is named exactly `README.md`

## 📞 Getting Help

- Check `PROJECT-GUIDE.md` for detailed documentation
- Review `.cursor/rules/` for AI assistant guidance
- Look at `README.md` as a working example
- Ask the AI assistant for help with meal planning!

## 🎉 You're All Set!

Once you:
1. Upgrade Node
2. Install dependencies
3. Test locally
4. Push to GitHub
5. Enable GitHub Pages

Your Food of the Week site will be live and ready to use!

The AI assistant now knows your cooking style and will help you plan delicious, efficient weeknight meals every week. Enjoy! 🍽️

