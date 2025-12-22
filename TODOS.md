# TODOS

## Needs Done P1
 - [ ] fix minor bug where grocery list slug url sometimes doesn't show up when scrolling down from the top of the page on first load.
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

## Needs Done P2
 - [ ] integrate ko-fi
   - _put badge at bottom of README.md_
   - _put 'buy me a coffee' link in the footer of the site_
   - _add sponsors/funding section to the github repo_
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
