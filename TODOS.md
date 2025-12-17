# TODOS

## Needs Done
 - [ ] fix scroll up animation for header print button
   - _it fades out when scrolling down but it doesn't fade in properly when scrolling up_
 - [ ] fix appearance of checked items in print view
 - [ ] Replace hardcoded meal ID system with slugified meal names
   - _Currently using counter-based IDs (`meal-1`, `meal-2`) instead of slugified meal names (`lamb-patties-veg`, `sweet-pork-curry`)_
   - _Would enable direct links like `/#print-section-lamb-patties-veg` instead of needing to know meal order_
   - _Affects: `weekParser.ts` (ID generation), `StickyHeader.astro` (navigation links), any print section targeting logic_
   - _Print section URLs will automatically work once IDs are slugified_

## Possible Features

### Permalink Generation
- [ ] Archive permalink generation from archive folder
  - _Generate stable URLs for archived weeks (e.g., `/archive/20251214-lamb-patties-week`)_
  - _Allow navigation to specific archived meal plans by date/week identifier_

### Theme & UI
- [ ] Dark mode / light mode theme based on device detection
- [ ] Optional theme toggle in footer
- [ ] Hero section redesign - something more appropriate (maybe non-animated cheffy hat face? Or save for getting-cheffy branch?)

### Stack Migration
- [ ] Migrate to a new stack based on [MIGRATION.md](MIGRATION.md)

---

**Note:** Keeping it simple for now on the master branch. See [TODOS on getting-cheffy branch](https://github.com/sh-ui/food-of-the-week/blob/getting-cheffy/TODOS.md) for the more ambitious feature roadmap. 
