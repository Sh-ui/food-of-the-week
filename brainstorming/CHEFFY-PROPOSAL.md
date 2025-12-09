# CHEFFY-PROPOSAL.md

## Cheffy: The Meta‑Assistant for *Food of the Week*
A complete proposal, including concrete feature specifications, optional extensions, UI sketches, state machine diagrams, schemas, and integration points.

---

# 1. Purpose & Philosophy

Cheffy is a lightweight, diegetic assistant that lives *outside* the normal navigational hierarchy of the Food‑of‑the‑Week site.  
Its purpose is to mediate actions that are:
- Cross‑cutting (e.g., reminder syncing, notification permissions, exporting checklists).
- Time‑aware (e.g., extracting time directives from Markdown recipes).
- Context‑independent (e.g., jumping between archived weeks or retrieving recipe-specific reminder timelines).
- User‑specific (e.g., storage of which week has been “synced” locally).

Cheffy provides a **playful interaction model** that avoids cluttering the rest of the UI with complex settings or meta‑actions.

---

# 2. High-Level Feature Overview

## 2.1 Core Features (Concrete)
### ● Calendar Event Sync
- Parse the current week's Markdown for explicit times and structured `{time: ...}` annotations.
- Generate:
  - “Add All Events” Google Calendar link
  - ICS file (full-week reminders)
- Exposed via Cheffy with state awareness:
  - If user hasn't synced this week → show notification dot + excited face.

### ● Local Push Notification Setup (Progressive)
- Cheffy prompts for Notification + Service Worker permissions.
- Schedules local notifications (Chrome+Android) using Alarm API / Notification Triggers API.
- Gracefully degrades on unsupported browsers (iOS Safari).
- UI messaging via Cheffy’s dialogue window.

### ● Checklist Import/Export
- Export current week’s tasks to JSON or plain text.
- Import user-modified checklist files.
- Persistent storage in localStorage or IndexedDB.

### ● Recipe Timeline Extractor
- User can ask Cheffy about a specific recipe.
- Cheffy extracts times and durations and offers:
  - A mini ICS file for that dish
  - A shareable permalink for the recipe + timeline

### ● Week Archive Navigator
- Cheffy prompts user for a date.
- Converts to corresponding permalinked archive (e.g., 2025-W50).
- Provides a button to navigate.

### ● First-Visit State Awareness
- Stores `visitedWeeks[weekId] = true` in localStorage.
- On first visit:
  - Cheffy becomes animated and invites the user to sync reminders.

---

## 2.2 Optional / Extensible Features
### ● “Cheffy Memory”
Minimal persistent state (device-side only):
- Preferred notification time defaults.
- Custom offsets (e.g., “remind me 2 hours earlier for marinades”).
- Favorite recipes.

### ● “Plan My Day”
Cheffy could generate:
- A condensed, ordered timeline for the day’s planned meals.
- Optional export to Google Calendar.

### ● Ingredient Stock Tracker
- Integrates with the checklist system.
- Lets Cheffy ask: “Should I remind you to buy ginger tomorrow morning?”

---

# 3. Cheffy UI Specification

## 3.1 Basic Appearance
Cheffy is an **SVG chef hat** with simple facial features.

### SVG Structure
```xml
<svg id="cheffy">
  <g id="hat-shape">...</g>
  <g id="face">
    <circle id="eye-left" ... />
    <circle id="eye-right" ... />
    <path id="mouth" ... />
  </g>
</svg>
```

### Eye States (Swappable via CSS/JS)
- neutral  
- excited  
- blink  
- thinking (eyes half-closed)  
- sleepy  

### Mouth States
- neutral  
- smile  
- “O” (surprised)  
- small frown (when permissions denied)

---

# 4. Cheffy Interaction Panel

## 4.1 ASCII Mockup of Cheffy in Corner

```
                  ┌──────────────┐
                  │   Cheffy     │
                  │   (•‿•) ●    │  ← notification dot
                  └──────┬───────┘
                         │ click
                         ▼
                 ┌──────────────────┐
                 │ Hey boss!        │
                 │ What do you need?│
                 │                  │
                 │ 1) Sync reminders│
                 │ 2) Export checklist
                 │ 3) Find a recipe │
                 │ 4) Jump to week  │
                 │ 5) More…         │
                 └──────────────────┘
```

---

# 5. Cheffy Dialogue Tree Structure

Dialogue trees follow a simple JSON schema.

### Example: Sync Reminders
```json
{
  "id": "sync-reminders",
  "prompt": "Looks like you haven't synced this week's reminders.",
  "options": [
    { "label": "Add calendar events", "action": "generate-ics" },
    { "label": "Enable push notifications", "action": "trigger-permission" },
    { "label": "Maybe later", "action": "close" }
  ]
}
```

### Example: Find a Recipe
```json
{
  "id": "find-recipe",
  "prompt": "Which recipe are you looking for?",
  "input": "text",
  "next": "extract-recipe-timeline"
}
```

---

# 6. Cheffy State Machine

## 6.1 ASCII Diagram

```
                       ┌──────────────┐
                       │    Idle      │
                       └──────┬───────┘
                              │
                              │ first visit this week
                              ▼
                       ┌──────────────┐
                       │ Attention    │
                       │ (excited)    │
                       └──────┬───────┘
                              │ click
                              ▼
                        ┌──────────┐
                        │ Dialogue │
                        └────┬─────┘
                             │ action selected
                             ▼
                       ┌──────────────┐
                       │ Processing   │
                       │ (thinking)   │
                       └──────┬───────┘
                              │ done
                              ▼
                        ┌──────────┐
                        │ Idle     │
                        └──────────┘
```

---

# 7. Time Extraction Specification

## 7.1 Regex Heuristics

### Clock Times
```
([0-1]?[0-9]|2[0-3]):[0-5][0-9]
([1-9]|1[0-2])\s?(am|pm)
```

### Semantic Times
```
tonight
this morning
afternoon
by\s+\d+\s?(am|pm)
```

### Durations
```
(\d+)\s+(hours?|hrs?)
(\d+)\s+(minutes?|mins?)
```

## 7.2 Structured Annotations (Preferred)
```
Start marinade at 8pm {time: "20:00"}
```

or YAML block inside Markdown:

```md
:::time
start: "2025-12-12 20:00"
type: marinade
duration: 18h
:::
```

---

# 8. ICS Generation Schema

Events are generated as:

```json
{
  "title": "Start marinade: Flat Iron Steak",
  "start": "2025-12-12T20:00:00",
  "end": "2025-12-12T20:10:00",
  "description": "Automatically extracted by Cheffy."
}
```

ICS fields follow `VCALENDAR` format.

---

# 9. Checklist Import/Export Format

### JSON
```json
{
  "week": "2025-W49",
  "tasks": [
    { "text": "Chop bok choy", "done": false },
    { "text": "Start marinade", "done": true }
  ]
}
```

### Plain Text (optional)
```
[ ] Chop bok choy
[x] Start marinade
```

---

# 10. File Layout & Code Integration

```
/src
  /components
    Cheffy.tsx
    CheffyPanel.tsx
  /lib
    timeParser.ts
    icsGenerator.ts
    notificationScheduler.ts
    dialogueEngine.ts
  /assets
    cheffy.svg
```

Service worker:
```
/public/sw.js
```

---

# 11. Example: Cheffy SVG with Eye Animation

```html
<style>
#eye-left, #eye-right {
  transition: transform 0.15s ease;
}
.cheffy-excited #eye-left { transform: translateY(-2px); }
.cheffy-excited #eye-right { transform: translateY(-2px); }
</style>
```

(Full SVG omitted for brevity in this section.)

---

# 12. Conclusion

Cheffy is a cohesive, diegetic, extensible meta‑assistant that:
- Helps users perform complex temporal interactions.
- Keeps the main UI clean.
- Adds charm without adding bloat.
- Provides a home for settings, reminders, and power-user tools.
- Makes weekly cooking rituals feel guided and game-like.

Cheffy is both functional and expressive — the perfect fit for the Food‑of‑the‑Week ecosystem.
