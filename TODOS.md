# TODOS

## Needs Done
 - [ ] fix scroll up animation for header print button
   - _it fades out when scrolling down but it doesn't fade in properly when scrolling up_
 - [ ] fix appearance of checked items in print view
 - [ ] Inline scroll thresholds from `src/config/breakpoints.ts` into `StickyHeader.astro` and delete the breakpoints file
   - _Only 3 constants (`HEADER_ACTIVATION`, `SECTION_VISIBILITY`, `FADE_OUT_START`) used by a single component - no need for separate config file_
 - [ ] Replace hardcoded meal ID system with slugified meal names
   - _Currently using counter-based IDs (`meal-1`, `meal-2`) instead of slugified meal names (`lamb-patties-veg`, `sweet-pork-curry`)_
   - _Would enable direct links like `/#print-section-lamb-patties-veg` instead of needing to know meal order_
   - _Affects: `weekParser.ts` (ID generation), `StickyHeader.astro` (navigation links), any print section targeting logic_
- [ ] Direct links to specific meals/sections
  - _Once meal IDs use slugified names, enable shareable links like `/#print-section-lamb-patties-veg`_
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
