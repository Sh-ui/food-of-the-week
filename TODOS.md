# Food of the Week - Development Roadmap

This document serves as the single source of truth for all planned features and improvements. Tasks are organized into phases, with each phase building on the previous one.

---

## Phase 1: Foundation and Housekeeping

- [x] Add open source license (MIT or similar)
- [ ] Configure Dependabot for dependency security
- [ ] Audit offline functionality
- [ ] Clean up project documentation
- [ ] Review and update README with current features

---

## Phase 2: UI/UX Polish (Header and Navigation)

### Header Button Normalization

- [ ] Match print button styling to header meal name buttons
- [ ] Implement responsive breakpoints:
  - [ ] Mobile: print icon only
  - [ ] Tablet: icon + meal name
  - [ ] Desktop: "Print" + meal name
- [ ] Add intermediate breakpoint where subheader hidden but print = icon only

### Hamburger Menu Polish

- [ ] Match "Print Full Week" button color to hero version
- [ ] Implement side-by-side layout for "Back to Top" and "Print Week" buttons

### Scroll Position States

- [ ] Add blank buffer zone at page top (no button highlighted until scroll)
- [ ] Add blank buffer zone at page bottom (Links button highlights at true bottom)
- [ ] Implement inter-section buffer (no highlight when two sections visible)
- [ ] Sync print button fade transition with scroll position

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
