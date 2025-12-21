# TODOS

## Needs Done P1
 - [ ] make 'print full week' button at the very bottom of the page, turn brown to match the look of the one in the header for better UX
 - [ ] make what is currently operating as headers parsed from bold text be parsed from `###` and/or `####` that way bold text can be used freely within content without confusing the parser
   - _this would also updating any rules or references to the current approach internally so that it doesn't confuse what is being said from how it is being parsed_
 - [ ] make the checkboxes locally check-able even if globally checked indicator (for non-family users)
   - this would also involve making the printed view of grocery list not show the globally checked indicator, this also solves the visual look issue of the circles inside the checkboxes being off center (since we aren't even bothering to show them anymore in the print rendered version)
 - [ ] use index sequence override to setup info subsection specified theming and prune deprecated approach
   - ```css
      instructionSubsections: {
        info: { bg: 'bg-alt', border: 'secondary', heading: 'primary' },
        overrides: {
          // 0: { scheme: 'salmon' },
          // 2: { border: '#81E3F6' },
          // 5: { bg: 'bg-alt', border: 'accent', heading: 'primary' },
        }
     ```
 - [ ] fix scroll up animation for header print button
   - _it fades out when scrolling down but it doesn't fade in properly when scrolling up_
 - [ ] Replace hardcoded meal ID system with slugified meal names
   - _Currently using counter-based IDs (`meal-1`, `meal-2`) instead of slugified meal names (`lamb-patties-veg`, `sweet-pork-curry`)_
   - _Would enable direct links like `/#print-section-lamb-patties-veg` instead of needing to know meal order_
   - _Affects: `weekParser.ts` (ID generation), `StickyHeader.astro` (navigation links), any print section targeting logic_
   - _Print section URLs will automatically work once IDs are slugified_

## Needs Done P2
 - [ ] integrate ko-fi
   - _put badge at bottom of README.md_
   - _put 'buy me a coffee' link in the footer of the site_
   - _add sponsers/funding section to the github repo_
 - [ ] integrate GoatCounter
   - _use script line embedded in `Layout.astro`_
   - _use generated API key + github action/deployment to push a log periodically to my email_
 - [ ] convert .mjs files to .ts files _*this actually might be more involved_
   - see about converting `astro.config.mjs` to `.ts`
   - easiest way to get rid of `tailwind.config.mjs` would be a [MIGRATION](MIGRATION.md) to `v4` 

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
