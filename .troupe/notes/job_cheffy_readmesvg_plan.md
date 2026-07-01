# Build plan -- Part 8/9: animated-readme-svg (`src/assets/cheffy-animated.svg` + README embed)

## Scope (fixed -- do not exceed)
Pure asset + README only. Touch EXACTLY two files:
1. `src/assets/cheffy-animated.svg` -- replace the placeholder with the full SMIL storyboard loop.
2. `README.md` -- add the embed snippet.

Touch NO component / util / page / config. Add NO deps. Do not alter site build behavior.
`src/assets/cheffy-animated.svg` is NOT imported by any page or `Layout.astro` (not mounted;
see `Cheffy.astro` header comment), so it is an inert README-only marketing asset -- the site
build is unaffected either way.

## Grounding (from CONTEXT_FILES -- reuse verbatim, do not invent art)
- **Shapes + coords are already authored** in `src/components/Cheffy.astro` (lines 81-109). Reuse
  the exact `d`/coords so the demo matches the live mascot:
  - Hat path: `M60 90 q-30 -5 -28 -35 q0 -28 30 -28 q8 -22 38 -22 q30 0 38 22 q30 0 30 28 q2 30 -28 35 z`
  - Band rect: `x=58 y=88 width=84 height=34 rx=8`
  - Eyes neutral: two dots at `cx 86 / 114, cy 62, r 5`
  - Eyes excited: two dots at `cx 86 / 114, cy 60, r 6`
  - Mouth neutral: `M88 76 h24` (stroke-width 4, round caps)
  - Mouth smile: `M86 74 q14 12 28 0` (stroke-width 4, round caps)
  - Mouth surprised: `circle cx 100 cy 78 r 5` fill none (stroke-width 4)
  - Notification dot: `circle cx 150 cy 30 r 10`
- **Brand color tokens** -- the SVG cannot use CSS vars (GitHub sanitizes `<style>`/CSS, keeps only
  SMIL + inline presentation attrs), so inline the resolved hex values (same ones the placeholder
  already uses; confirmed in `tailwind.config.mjs` block quoted in README lines 241-248):
  - `--color-bg` = `#FAF8F3` (hat fill)
  - `--color-primary` = `#494331` (hat stroke, eyes, mouth)
  - `--color-secondary` = `#F3CA40` (band fill)
  - `--color-accent` = `#F08A4B` (notification dot)
- **State -> look mapping** (from `CHEFFY-SYSTEM.md` state table + the CSS in `Cheffy.astro`
  lines 132-144):
  - idle: neutral eyes + neutral mouth + slow blink
  - attention: excited eyes + surprised mouth + notification dot
  - dialogue: neutral eyes + smile mouth

## Storyboard (the loop the objective asks for: idle -> attention(+dot) -> dialogue -> back)
One master loop, `dur = 12s`, `repeatCount="indefinite"`. Beat boundaries as fractions of 12s
(shared `keyTimes="0;0.3333;0.5833;0.8333;1"` on every expression toggle):

| Beat | Time | keyTime | Look shown |
|------|------|---------|------------|
| A idle | 0.0-4.0s | 0 -> 0.3333 | neutral eyes (blinking) + neutral mouth |
| B attention | 4.0-7.0s | 0.3333 -> 0.5833 | excited eyes + surprised mouth + dot fades in |
| C dialogue | 7.0-10.0s | 0.5833 -> 0.8333 | neutral eyes + smile mouth |
| D return/hold | 10.0-12.0s | 0.8333 -> 1 | neutral eyes + neutral mouth (gentle pause, then loop) |

Swaps use `calcMode="discrete"` (instant, clean expression swap -- no ghost cross-fade), matching
the component's `display` swap. The dot uses a soft linear fade (see below) for a gentle pop.

## Reduced-motion honesty (important -- do not over-promise)
A pure-SMIL SVG embedded as a README image CANNOT read `prefers-reduced-motion` (no CSS/media
queries survive GitHub sanitization, and README images get no JS). So we cannot truly gate motion
here. Mitigations, all already baked into the design below -- keep them:
- slow 4.5s blink, long 2-3s holds per beat, discrete swaps (no flicker), no spins/parallax.
- This asset is README-only marketing and is NOT mounted on the site; the live component
  (`Cheffy.astro` lines 150-156) already honors `prefers-reduced-motion` for the real UI, so the
  DoD line "prefers-reduced-motion is honored" is satisfied there, not here. Do NOT add CSS/JS to
  this SVG to chase it -- that would break the self-contained/GitHub-inline requirement.

## Exact file content to write -- `src/assets/cheffy-animated.svg`
Drop in verbatim (ASCII hyphens only, no Unicode dashes, per repo rule):

```svg
<?xml version="1.0" encoding="UTF-8"?>
<!--
  cheffy-animated.svg -- SMIL demo loop for the README (self-contained: no CSS, no JS,
  no external refs, so it animates inline on GitHub). Shapes + brand hex tokens are
  reused verbatim from src/components/Cheffy.astro. Loop (12s): idle -> attention(+dot)
  -> dialogue -> idle. Design contract: CHEFFY-SYSTEM.md > Animated demo loop.
-->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"
     role="img" aria-label="Cheffy, a friendly chef-hat mascot, cycling from idle to attention to a friendly smile">
  <!-- hat + band: static, never swapped -->
  <path d="M60 90 q-30 -5 -28 -35 q0 -28 30 -28 q8 -22 38 -22 q30 0 38 22 q30 0 30 28 q2 30 -28 35 z"
        fill="#FAF8F3" stroke="#494331" stroke-width="4" stroke-linejoin="round"/>
  <rect x="58" y="88" width="84" height="34" rx="8" fill="#F3CA40" stroke="#494331" stroke-width="4"/>

  <!-- EYES neutral (idle + dialogue + return); ellipses so the blink (ry squash) actually renders -->
  <g opacity="1">
    <animate attributeName="opacity" calcMode="discrete" dur="12s" repeatCount="indefinite"
             keyTimes="0;0.3333;0.5833;0.8333;1" values="1;0;1;1;1"/>
    <ellipse cx="86" cy="62" rx="5" ry="5" fill="#494331">
      <animate attributeName="ry" dur="4.5s" repeatCount="indefinite"
               keyTimes="0;0.92;0.95;0.98;1" values="5;5;0.6;5;5"/>
    </ellipse>
    <ellipse cx="114" cy="62" rx="5" ry="5" fill="#494331">
      <animate attributeName="ry" dur="4.5s" repeatCount="indefinite"
               keyTimes="0;0.92;0.95;0.98;1" values="5;5;0.6;5;5"/>
    </ellipse>
  </g>

  <!-- EYES excited (attention only) -->
  <g opacity="0">
    <animate attributeName="opacity" calcMode="discrete" dur="12s" repeatCount="indefinite"
             keyTimes="0;0.3333;0.5833;0.8333;1" values="0;1;0;0;0"/>
    <circle cx="86" cy="60" r="6" fill="#494331"/>
    <circle cx="114" cy="60" r="6" fill="#494331"/>
  </g>

  <!-- MOUTH neutral (idle + return) -->
  <path d="M88 76 h24" fill="none" stroke="#494331" stroke-width="4" stroke-linecap="round" opacity="1">
    <animate attributeName="opacity" calcMode="discrete" dur="12s" repeatCount="indefinite"
             keyTimes="0;0.3333;0.5833;0.8333;1" values="1;0;0;1;1"/>
  </path>

  <!-- MOUTH surprised (attention only) -->
  <circle cx="100" cy="78" r="5" fill="none" stroke="#494331" stroke-width="4" opacity="0">
    <animate attributeName="opacity" calcMode="discrete" dur="12s" repeatCount="indefinite"
             keyTimes="0;0.3333;0.5833;0.8333;1" values="0;1;0;0;0"/>
  </circle>

  <!-- MOUTH smile (dialogue only) -->
  <path d="M86 74 q14 12 28 0" fill="none" stroke="#494331" stroke-width="4" stroke-linecap="round" opacity="0">
    <animate attributeName="opacity" calcMode="discrete" dur="12s" repeatCount="indefinite"
             keyTimes="0;0.3333;0.5833;0.8333;1" values="0;0;1;0;0"/>
  </circle>
  <!-- NOTE: the line above is the smile PATH; keep it a <path>, not a <circle>. See coords. -->

  <!-- NOTIFICATION dot (attention only) -- gentle linear fade in/out, not a hard cut -->
  <circle cx="150" cy="30" r="10" fill="#F08A4B" opacity="0">
    <animate attributeName="opacity" dur="12s" repeatCount="indefinite"
             keyTimes="0;0.3333;0.37;0.5833;0.62;1" values="0;0;1;1;0;0"/>
  </circle>
</svg>
```

Builder correction note: the smile element MUST be `<path d="M86 74 q14 12 28 0" ...>` (I left a
stray guard comment above it). Write it as a path exactly as the mouth-smile in `Cheffy.astro`.

## Exact README embed -- `README.md`
Insert immediately AFTER the badges block (current line 8, the `![Status]...` line) and BEFORE
the blank line preceding `## About`. This keeps it as a hero directly under the title/badges.
Add these lines:

```html

<p align="center">
  <img src="src/assets/cheffy-animated.svg"
       alt="Cheffy, the animated chef-hat mascot, cycling from idle to attention to a friendly dialogue smile"
       width="200" height="200" />
</p>

<p align="center"><em>Meet <strong>Cheffy</strong> -- the corner kitchen mascot (on the <code>getting-cheffy</code> branch).</em></p>
```

Notes for the builder:
- Use an HTML `<img>` (not markdown `![]()`) so `width`/`height` and centering work; GitHub allows
  this and animated SVGs referenced by in-repo relative path DO play in a rendered README.
- `src="src/assets/cheffy-animated.svg"` is relative to the repo root where README.md lives -- correct.
- Do not touch any other README content.

## Acceptance checks (builder must verify before mark-awaiting-audit)
1. `src/assets/cheffy-animated.svg` opens standalone in a browser and LOOPS: idle (with blink) ->
   excited eyes + surprised mouth + orange dot -> smile -> back to idle, ~12s cycle, indefinitely.
2. Self-contained: file contains NO `<script>`, NO `<style>`, NO CSS `class=`/`style=` driving
   animation, NO external `href`/`url(...)`/`<image>`/font refs. Animation is SMIL only
   (`<animate>` / `<animateTransform>` / `<set>`).
3. Only the 4 brand hex tokens appear as colors: `#FAF8F3`, `#494331`, `#F3CA40`, `#F08A4B`
   (case-insensitive). No other fills/strokes.
4. Hat path, band rect, and every eye/mouth/dot coordinate match `src/components/Cheffy.astro`
   verbatim (diff the `d`/`cx`/`cy`/`r` values).
5. `viewBox="0 0 200 200"`, has `role="img"` + a descriptive `aria-label`.
6. README renders the image centered under the badges; `git diff README.md` shows ONLY the added
   embed block, nothing else.
7. `npm run build` (astro check && astro build) still passes and the built site is byte-behavior
   identical to before (the SVG is not imported anywhere; confirm with a repo grep that nothing
   imports `cheffy-animated.svg`).
8. No new dependencies; `package.json` / lockfile unchanged. Only two files changed total.
9. No Unicode dashes anywhere in the new content (ASCII `-`/`--` only).

## Gotchas
- Circles have no `ry`; the placeholder animated `ry` on a `<circle>` (a no-op). The blink is fixed
  here by using `<ellipse>` for the neutral eyes -- keep it that way or the blink will not render.
- `calcMode="discrete"` is deliberate for the expression swaps; do not change to linear or the
  looks will cross-fade into muddy overlaps. The dot alone uses linear for a soft fade.
- Do NOT wire this SVG into `Layout.astro`/`Cheffy.astro` -- that is a different part; this part is
  README-only. Mounting the component is the final part's job.
```
