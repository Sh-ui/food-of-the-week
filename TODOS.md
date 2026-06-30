# Food of the Week - Development Roadmap (getting-cheffy)

This document is the ambitious feature roadmap kept on the `getting-cheffy` branch
(the `master` branch keeps a slimmer list and points here). The design contract for
the Cheffy work lives in [CHEFFY-SYSTEM.md](CHEFFY-SYSTEM.md); this file is the
phased checklist. Tasks are organized into phases, each building on the previous.

---

## Phase 1: Foundation and Housekeeping

- [x] Add open source license (AGPL-3.0)
- [x] Configure Dependabot for dependency security (`.github/dependabot.yml`)
- [x] Clean up project documentation
- [x] Review and update README with current features

---

## Phase 2: UI/UX Polish (Header and Navigation)

- [x] Unified header (removed hamburger / mobile sub-header)
- [x] Responsive print button (icon -> icon+name -> "Print"+name across breakpoints)
- [x] Section selector dropdown with animated caret on mobile
- [x] Desktop scroll behavior: nav slides to align, print button tracks section
- [x] Scroll position states + fade transitions

---

## Phase 3: Cheffy Core Implementation

> See [CHEFFY-SYSTEM.md](CHEFFY-SYSTEM.md) for the full design contract.

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

- [ ] Design JSON-based dialogue tree schema (`src/data/cheffy-dialogue.json`)
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

---

**Note:** `master` keeps a deliberately simpler roadmap. This branch is where the
Cheffy mascot/assistant gets built out per [CHEFFY-SYSTEM.md](CHEFFY-SYSTEM.md).
</content>
