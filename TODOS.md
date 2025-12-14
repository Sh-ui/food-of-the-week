# Food of the Week - Development Roadmap

This document serves as the single source of truth for all planned features and improvements. Tasks are organized into phases, with each phase building on the previous one.

---

## Phase 1: Foundation and Housekeeping

- [x] Add open source license (AGPL-3.0)
- [x] Configure Dependabot for dependency security (`.github/dependabot.yml`)
- [x] Audit offline functionality ([audit results](.cursor/plans/offline-functionality-audit.plan.md))
- [x] Clean up project documentation
- [x] Review and update README with current features

---

## Phase 2: UI/UX Polish (Header and Navigation)

### Header Redesign (Unified Header)

- [x] Remove hamburger menu and mobile sub-header in favor of unified header
- [x] Remove section print buttons from grocery list and meal cards
- [x] Match print button styling to header meal name buttons
- [x] Implement responsive breakpoints:
  - [x] Mobile (≤950px): print icon only (beefier padding)
  - [x] Tablet (950-1000px): icon + meal name
  - [x] Desktop (>1000px): "Print" + meal name
- [x] Add section selector dropdown with animated caret for mobile
- [x] Dropdown shows "Menu" when open, section name when closed
- [x] Print button uses brown/primary color (matches brand)

### Desktop Scroll Behavior

- [x] Nav buttons start centered, slide left on scroll to align right of date
- [x] Left side shows grayed "Menu" before scroll, week title after scroll
- [x] Print button always visible, updates to current section on scroll
- [x] Print button fades between sections (75% visibility threshold)

### Scroll Position States

- [x] Buffer zone at page top (shows "Full Week" until scroll past threshold)
- [x] Section highlighting based on 25%+ visibility
- [x] Add fade transition to print button label changes

---

## Phase 3: Cheffy Core Implementation

### Character and UI

- [ ] Design SVG chef hat with facial expressions
  - [ ] Neutral expression
  - [ ] Excited expression
  - [ ] Blink animation
  - [ ] Thinking expression
  - [ ] Sleepy expression
- [ ] Implement mouth states
  - [ ] Neutral
  - [ ] Smile
  - [ ] Surprised
  - [ ] Frown
- [ ] Add notification dot indicator
- [ ] Position Cheffy in corner with click-to-expand panel

### Animated Demo Loop

- [ ] Create animated SVG demonstration loop for README
  - [ ] Blink animation
  - [ ] Look left animation
  - [ ] Look right animation
  - [ ] Return to neutral/idle
  - [ ] 2-3 second pause before loop restart
- [ ] Save as `src/assets/cheffy-animated.svg` with SMIL animations

### State Machine

- [ ] Implement idle state (default)
- [ ] Implement attention state (first visit this week, excited expression)
- [ ] Implement dialogue state (panel open, options visible)
- [ ] Implement processing state (thinking expression)
- [ ] Set up localStorage tracking for `visitedWeeks[weekId]`

### Dialogue System

- [ ] Design JSON-based dialogue tree schema
- [ ] Implement text input support for search/navigation
- [ ] Create action handlers
  - [ ] generate-ics
  - [ ] trigger-permission
  - [ ] close
  - [ ] navigate-to-archive
  - [ ] export-checklist

---

## Phase 4: Cheffy Features

### Calendar Event Sync

- [ ] Implement time extraction from Markdown
  - [ ] Regex for clock times (e.g., "3:00 PM")
  - [ ] Semantic times (e.g., "dinner time")
  - [ ] Duration extraction (e.g., "30 minutes")
- [ ] Support structured `{time: ...}` annotation
- [ ] Build ICS file generation
- [ ] Create Google Calendar "Add All Events" link
- [ ] Add per-recipe mini ICS export

### Local Push Notifications

- [ ] Set up service worker registration (`/public/sw.js`)
- [ ] Implement notification permission flow via Cheffy dialogue
- [ ] Integrate Alarm API / Notification Triggers API
- [ ] Add graceful degradation for unsupported browsers (iOS Safari)

### Checklist Import/Export

- [ ] Design JSON export format with week ID and task states
- [ ] Implement plain text export (markdown checkbox format)
- [ ] Create import functionality with merge/overwrite options
- [ ] Set up IndexedDB or localStorage persistence

### Week Archive Navigator

- [ ] Add date input prompt via Cheffy
- [ ] Convert date to archive permalink (e.g., `20251207-descriptive-name.md`)
- [ ] Generate navigation buttons for archive browsing

### Recipe Timeline Extractor

- [ ] Implement query for specific recipe by name
- [ ] Extract all time-related instructions
- [ ] Generate shareable permalink with timeline

---

## Phase 5: Archive-Powered Features

### Meal Rotation Suggestions

- [ ] Parse archive files for past meal data
- [ ] Track time since each recipe was made
- [ ] Implement Cheffy prompts (e.g., "It's been 4 weeks since you made X...")
- [ ] Build ingredient-based suggestions from archive patterns

### Recipe Search Across Archives

- [ ] Implement full-text search of all archive files
- [ ] Add filters
  - [ ] By protein
  - [ ] By cuisine style
  - [ ] By cook time
- [ ] Display results with links to archived weeks

---

## Phase 6: PWA and Offline

- [ ] Implement service worker for offline caching
- [ ] Cache current week's data for offline access
- [ ] Add offline indicator in UI
- [ ] Implement background sync for checklist changes

---

## Phase 7: DevOps and Maintenance

- [ ] Configure Dependabot for npm dependencies
- [ ] Set up automated PR for dependency updates
- [ ] Review and enhance GitHub Actions workflow
- [ ] Add automated testing (if not already present)

### Cheffy Demo GIF Automation

- [ ] Create GitHub Actions workflow to auto-generate demo GIF
  - [ ] Install dependencies (chromium-browser, ffmpeg, puppeteer)
  - [ ] Create Node script to render SVG animation in headless browser
  - [ ] Record 3-second video of animation loop
  - [ ] Convert video to optimized GIF (400px wide, 30fps)
  - [ ] Auto-commit generated GIF to `assets/cheffy-demo.gif`
  - [ ] Trigger on changes to `src/assets/cheffy-animated.svg`
- [ ] Optimize GIF output
  - [ ] Use gifsicle for compression (< 500KB target)
  - [ ] Set infinite loop flag
  - [ ] Limit color palette to 256 colors
- [ ] Add "Meet Cheffy" section to README with animated GIF
  - [ ] Embed GIF with descriptive alt text
  - [ ] Brief description of Cheffy's features

---

## Phase 8: Future / Experimental

### Cheffy Memory (Optional)

- [ ] Store preferred notification time defaults
- [ ] Implement custom reminder offsets (e.g., "2 hours earlier for marinades")
- [ ] Track favorite recipes

### "Plan My Day" (Optional)

- [ ] Generate ordered timeline for day's meals
- [ ] Export condensed schedule to calendar

### Ingredient Stock Tracker (Optional)

- [ ] Integrate with checklist system
- [ ] Add proactive reminders (e.g., "Buy ginger tomorrow morning?")

### Additional Page Views

- [ ] Checklist-only view (separate from full recipes)
- [ ] Week comparison view
- [ ] Ingredient frequency analytics

---

## Technical Architecture Notes

### Proposed File Structure for Cheffy

```
/src
  /components
    Cheffy.astro (or .tsx)
    CheffyPanel.astro
  /lib
    timeParser.ts
    icsGenerator.ts
    notificationScheduler.ts
    dialogueEngine.ts
  /assets
    cheffy.svg
/public
  sw.js
```

### Data Persistence Strategy

- **localStorage**: Lightweight data (visited weeks, preferences, checklist states)
- **IndexedDB**: Larger data (dialogue history, archived meal suggestions)
- **Service Worker Cache**: Offline access to current week content

---

## Notes

- Phases can be worked in parallel where dependencies allow
- Each checkbox represents an actionable, testable task
- Sub-items provide granular progress tracking
- This file should be updated as tasks are completed and new features are proposed
