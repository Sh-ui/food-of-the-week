---
name: Consolidated TODOS Migration
overview: Delete the three brainstorming files (CHEFFY-PROPOSAL.md, PROPOSED-POLISH.md, TODOS.md) and create a comprehensive, actionable TODOS.md in the project root that consolidates all planned features into a structured roadmap.
todos:
  - id: delete-brainstorming-files
    content: Delete CHEFFY-PROPOSAL.md, PROPOSED-POLISH.md, and TODOS.md from brainstorming folder
    status: completed
  - id: create-root-todos
    content: Create comprehensive TODOS.md in project root with phased roadmap structure
    status: completed
---

# Consolidated TODOS.md Migration

## Files to Delete

- `brainstorming/CHEFFY-PROPOSAL.md`
- `brainstorming/PROPOSED-POLISH.md`
- `brainstorming/TODOS.md`

## New File to Create

- `/TODOS.md` (project root)

---

## Proposed Structure for TODOS.md

The new file will be organized into **phases** with clear categories, each containing checkbox items. The structure balances immediate needs with long-term vision.

### Phase 1: Foundation and Housekeeping

- Open source license (MIT or similar)
- Dependabot configuration for dependency security
- Offline functionality audit
- Project documentation cleanup

### Phase 2: UI/UX Polish (Header and Navigation)

**Header Button Normalization:**

- Match print button styling to header meal name buttons
- Responsive breakpoints:
  - Mobile: print icon only
  - Tablet: icon + meal name
  - Desktop: "Print" + meal name
- Consider intermediate breakpoint where subheader hidden but print = icon only

**Hamburger Menu Polish:**

- Match "Print Full Week" button color to hero version
- Side-by-side layout for "Back to Top" and "Print Week" buttons

**Scroll Position States:**

- Blank buffer zone at page top (no button highlighted until scroll)
- Blank buffer zone at page bottom (Links button highlights at true bottom)
- Inter-section buffer (no highlight when two sections visible)
- Print button fade transition synced with scroll position

### Phase 3: Cheffy Core Implementation

**Character and UI:**

- SVG chef hat with facial expressions (neutral, excited, blink, thinking, sleepy)
- Mouth states (neutral, smile, surprised, frown)
- Notification dot indicator
- Corner placement with click-to-expand panel

**State Machine:**

- Idle state (default)
- Attention state (first visit this week, excited expression)
- Dialogue state (panel open, options visible)
- Processing state (thinking expression)
- localStorage tracking for `visitedWeeks[weekId]`

**Dialogue System:**

- JSON-based dialogue tree schema
- Text input support for search/navigation
- Action handlers (generate-ics, trigger-permission, close, etc.)

### Phase 4: Cheffy Features

**Calendar Event Sync:**

- Time extraction from Markdown (regex for clock times, semantic times, durations)
- Structured `{time: ...}` annotation support
- ICS file generation
- Google Calendar "Add All Events" link
- Per-recipe mini ICS export

**Local Push Notifications:**

- Service worker registration (`/public/sw.js`)
- Notification permission flow via Cheffy dialogue
- Alarm API / Notification Triggers API integration
- Graceful degradation for unsupported browsers (iOS Safari)

**Checklist Import/Export:**

- JSON export format with week ID and task states
- Plain text export (markdown checkbox format)
- Import functionality with merge/overwrite options
- IndexedDB or localStorage persistence

**Week Archive Navigator:**

- Date input prompt via Cheffy
- Convert to archive permalink (e.g., `20251207-descriptive-name.md`)
- Navigation button generation

**Recipe Timeline Extractor:**

- Query specific recipe by name
- Extract all time-related instructions
- Generate shareable permalink with timeline

### Phase 5: Archive-Powered Features

**Meal Rotation Suggestions:**

- Parse archive files for past meal data
- Track time since each recipe was made
- Cheffy prompts: "It's been 4 weeks since you made X..."
- Ingredient-based suggestions from archive patterns

**Recipe Search Across Archives:**

- Full-text search of all archive files
- Filter by protein, cuisine style, cook time
- Results with links to archived weeks

### Phase 6: PWA and Offline

- Service worker for offline caching
- Cache current week's data for offline access
- Offline indicator in UI
- Background sync for checklist changes

### Phase 7: DevOps and Maintenance

- Dependabot configuration for npm dependencies
- Automated PR for dependency updates
- Consider GitHub Actions enhancements

### Phase 8: Future / Experimental

**Cheffy Memory (Optional):**

- Preferred notification time defaults
- Custom reminder offsets (e.g., "2 hours earlier for marinades")
- Favorite recipes tracking

**"Plan My Day" (Optional):**

- Generate ordered timeline for day's meals
- Export condensed schedule to calendar

**Ingredient Stock Tracker (Optional):**

- Integration with checklist system
- Proactive reminders ("Buy ginger tomorrow morning?")

**Additional Page Views:**

- Checklist-only view (separate from full recipes)
- Week comparison view
- Ingredient frequency analytics

---

## File Layout Reference (from proposal)

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

---

## Format Notes

- Each section uses markdown checkboxes `- [ ]` for tracking
- Sub-items indented for granular progress
- Phases can be worked in parallel where dependencies allow
- This file serves as the single source of truth for development roadmap