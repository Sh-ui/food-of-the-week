# Cheffy System

> Source of truth for the **Cheffy** corner assistant. Supersedes the
> `getting-cheffy` / `troupe/polish-*` branch spec (kept in git history).

Cheffy is an animated SVG chef-hat character in the corner of every page. Mostly
idle, he perks up on a new week, opens a speech-bubble dialogue on click, and
offers utilities built on the week's meal plan: calendar export (ICS / Google),
cook-time notifications, grocery-checklist export/import, and archive search.

**Progressive enhancement only.** The site works fully without him: with JS off
the mount stays `display:none` with zero layout impact.

## Architecture -- hexagonal units

Every unit is a discrete module with no knowledge of the others; `Cheffy.astro`
is the only adapter that binds them to the DOM. Swap or reuse any of them freely.

| Unit | Kind | Role |
|------|------|------|
| `src/utils/cheffyRig.ts` | pure code | Geometry. Flat numeric params -> SVG attrs (paths, transforms, lid clip polygons). No DOM. |
| `src/data/cheffy-poses.json` | **data** | Named expressions as partial param sets + aliases. Edit numbers, get new faces. |
| `src/utils/cheffyMotion.ts` | pure code | Generic spring engine + self-stopping rAF loop. Knows nothing about Cheffy. |
| `src/utils/cheffyBehavior.ts` | pure code | Ambient personality director: blink/glance/bounce/doze events on randomized timers per mode. |
| `src/data/cheffy-dialogue.json` | **data** | The dialogue tree: nodes, options, `goto`/`action`, per-node `expression`. |
| `src/data/cheffy-config.json` | **data** | Presentation: chip vs free-float, ink/chip colors, default corner + personality. |
| `src/utils/cheffyDialogue.ts` | pure code | Tree traversal, validation helpers, archive search. |
| `src/utils/cheffyState.ts` | pure code | Week identity + visited-weeks helpers. |
| `src/utils/cheffyCalendar.ts` | pure code (Node-only) | Markdown -> cooking events -> ICS / Google URL. Never import client-side. |
| `src/utils/cheffyCalendarActions.ts` | adapter | Registers `generate-ics`, `generate-ics-meal`, `open-google-calendar` handlers. |
| `src/utils/cheffyNotifications.ts` | adapter | Registers `trigger-permission` (service worker `public/sw.js`). |
| `src/utils/cheffyChecklist.ts` | adapter | Registers `export-checklist`, `import-checklist`. |
| `src/components/Cheffy.astro` | adapter | Mounts the SVG rig; binds springs + behavior + state machine. |
| `src/components/CheffyPanel.astro` | adapter | Speech-bubble panel + dialogue runtime + action registry. |
| `src/components/CheffyStatic.astro` | adapter | SSR-only frozen pose render (gallery, docs art). |

### The two ports

1. **DOM attributes on `#cheffy`** -- the mascot's entire inbound interface:
   `data-state` (state machine) and `data-expr-override` (per-dialogue-node
   expression). The panel never imports mascot code; it sets attributes.
2. **`window.registerCheffyAction(name, fn)`** -- the action registry. Feature
   modules plug handlers in at module load; the panel dispatches option
   `action` values against it and falls back gracefully when unregistered.

## Visual rig

One persistent set of shapes, morphed by ~21 numeric params (see `RigParams`):

- **Hat**: the EXACT header icon (Tabler chef-hat path from
  StickyHeader.astro) scaled into rig space -- never redrawn. Static.
- **Brim**: ONE squared-off (butt-capped) stroke, always. Straight = sharp
  brim bar; bent = the same bar curving into a smile/frown mouth (end faces
  stay square); slid up = the icon's band (plain-icon mode). `brimDy`,
  `brimBend`, `brimLen`, `brimW`.
- **Eyes**: constant-size circles -- they NEVER scale or squash. All emotion
  is occlusion via lid clip polygons (`lidTop/Bot/Angle`: blink/wink bands,
  sleepy domes, scowl brows) or position (gaze `lookX/Y`; they hide *inside*
  the hat via `eyesDy` because they paint underneath it).
- **Figure**: whole-mascot `bob`, `tilt`, `squash` (anchored at bottom center)
  for bounces and squash-and-stretch.

Springs (`cheffyMotion`) tween every param; each pose picks a `motion` feel
(`soft`/`default`/`snappy`). `prefers-reduced-motion`: poses snap instantly,
ambience is disabled ("reduce, not remove" -- all states stay reachable).

### Editing expressions

Open `src/data/cheffy-poses.json`, tweak numbers or add a pose (any subset of
rig params), optionally alias it. Reference it from a dialogue node's
`expression`. Unknown names fall back to `neutral`. The `/cheffy-demo` gallery
shows every pose statically, plus live controls against the real instance.

## State machine

| State | When | Look |
|-------|------|------|
| `idle` | default | `neutral` (or `hidden` on dormant pages, `sleepy` when dozed off) |
| `attention` | first visit of a new week (never on dormant pages) | `excited` + accent dot, lively ambience |
| `dialogue` | panel open | `happy`, ambience paused, per-node `expression` overrides |
| `processing` | async action running | `thinking` |

Week identity: slugified `h1` -> `visitedWeeks` map in localStorage.

## Ambient personality

`cheffy-config.json` sets the default; Layout passes `cheffyPersonality` per
page (archives are `dormant`).

- **dormant** -- plain tucked hat; peeks (`happy`) on hover; no timers.
- **subtle** -- occasional blink, rare glance, dozes to `sleepy` after ~60s
  idle; wakes on scroll/pointer. Default everywhere.
- **lively** -- frequent blinks/glances + occasional bounce; auto-selected
  while in `attention`, reverts once the week is visited.

Eyes track the pointer within ~260px of the mascot in idle.

## Dialogue tree

`src/data/cheffy-dialogue.json` -- human-editable. Node shape:
`{ text, expression?, input?, options: [{ label, goto? | action? }] }`.
Valid `action` values live in `VALID_ACTIONS` (`cheffyDialogue.ts`) and must
have a registered handler: `generate-ics`, `generate-ics-meal`,
`open-google-calendar`, `trigger-permission`, `navigate-to-archive`,
`export-checklist`, `import-checklist`, `close`.

Calendar actions need the page's week Markdown: pages pass `cheffyFilename`
to `Layout`, which threads it to the build-time calendar island. Pages without
it get cleanly no-op calendar handlers.

## Dev surface

- `/cheffy-demo` -- static pose gallery + live pose/event/mode/state controls.
- `/cheffy-lab` -- anatomy tuning bench: reference sheet (public/cheffy-ref.png)
  vs live rig grid, every skeleton dimension on a knob (`window.lab` API);
  bake winning numbers into `ANATOMY`.
- `window.cheffy` -- debug seam: `setExpr`, `setState`, `blink`, `bounce`,
  `setMode`, `poses`, `_debug` (springs/paint/loop internals for tests).
  NOTE: rAF is suspended in hidden tabs; drive `_debug.springs.tick()` +
  `_debug.paint()` manually when screenshotting from automation.
