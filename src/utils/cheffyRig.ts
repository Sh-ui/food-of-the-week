// cheffyRig.ts -- pure geometry for the Cheffy mascot rig.
//
// Hexagonal unit: no DOM, no timers, no imports. Takes a flat bag of numeric
// rig parameters and returns SVG attribute strings (path `d`, transforms,
// clip polygons). The adapter in Cheffy.astro writes these onto the SVG;
// cheffyMotion.ts springs the parameters between poses; poses themselves are
// data in src/data/cheffy-poses.json.
//
// Design language (see the brand reference sheet + public/cheffy-ref.png):
// measured, graphical, flat-iconic --
//   - hat: THE header icon (exact Tabler chef-hat path from
//     StickyHeader.astro), scaled into rig space. Never redrawn by hand.
//   - brim: ONE squared-off (butt-capped) stroke, always. As a brim or the
//     hat band it reads as a sharp rectangle; as a mouth it is the SAME
//     squared bar simply curving -- the end faces stay square, tilting with
//     the curve. Never round caps.
//   - eyes: constant-size circles. They NEVER scale, squash, or stretch --
//     all modulation is occlusion (lid clip polygons: blink slivers, sleepy
//     domes, scowl brows) or position (gaze, hide-inside-hat)
//   - figure: whole-mascot bob / tilt / squash for weight; the parts keep
//     their own shapes
//
// All parameters are plain numbers so any spring/tween engine can drive them.

export interface RigParams {
  // whole figure
  bob: number;      // y offset, px (negative = up)
  shiftX: number;   // x offset, px
  tilt: number;     // degrees, rotation around (100, 130)
  squash: number;   // 1 = none; <1 squashes (wide+short), >1 stretches

  // brim (doubles as mouth)
  brimDy: number;   // y offset from rest; negative tucks it up into the hat
  brimBend: number; // -1..1; + bends into a smile, - into a frown
  brimLen: number;  // half-length of the stroke centerline
  brimW: number;    // stroke width

  // eyes -- shared gaze + structural offset. NO size/squash params by design.
  lookX: number;    // -5..5 gaze shift
  lookY: number;    // -4..4
  eyesDy: number;   // structural y offset (e.g. -46 hides eyes behind the hat)

  // per-eye occlusion (L = viewer's left). This is the ONLY way eyes emote.
  lidTopL: number;    // 0..1 upper lid drop (cuts circle from the top)
  lidTopR: number;
  lidBotL: number;    // 0..1 lower lid rise (0.5 = sleepy dome)
  lidBotR: number;
  lidAngleL: number;  // degrees; tilts the upper lid edge (scowl brows)
  lidAngleR: number;
}

/** Rest-state parameters -- the open, neutral face. */
export const REST: RigParams = {
  bob: 0, shiftX: 0, tilt: 0, squash: 1,
  brimDy: 0, brimBend: 0, brimLen: 47.5, brimW: 20,
  lookX: 0, lookY: 0, eyesDy: 0,
  lidTopL: 0, lidTopR: 0, lidBotL: 0, lidBotR: 0,
  lidAngleL: 0, lidAngleR: 0,
};

/** The rig's fixed skeleton. Injectable so the /cheffy-lab tuning page can
 *  drive it with live knobs; everything else uses the ANATOMY default. */
export interface Anatomy {
  viewBox: string;
  /** The hat crown. THE brand hat -- the exact Tabler chef-hat path used in
   *  the site header (StickyHeader.astro), placed via hatTransform. */
  hatD: string;
  hatTransform: string;
  eyeLX: number;
  eyeRX: number;
  eyeY: number;
  eyeR: number;
  brimY: number;
  brimX: number;
  /** Control-point drop at full bend (visual dip is half this -- quadratic). */
  bendDepth: number;
  /** Squash/bounce anchor. */
  anchorX: number;
  anchorY: number;
}

/** Exact crown path from the header icon (Tabler chef-hat, 24-grid). Its
 *  straight bottom edge sits at y=16 spanning x 5..19; eyes tuck behind it. */
export const HAT_ICON_D =
  'M12 2a5 5 0 0 1 4.533 2.888l.06 .137l.136 -.009a5 5 0 0 1 4.99 3.477' +
  'l.063 .213a5 5 0 0 1 -2.696 5.831l-.087 .037v1.428a1 1 0 0 1 -1 1' +
  'l-12 .004a1 1 0 0 1 -.993 -.883l-.007 -.117v-1.433l-.123 -.055' +
  'a5 5 0 0 1 -2.6 -3.001l-.064 -.223a5 5 0 0 1 5.193 -6.27l.066 -.142' +
  'a5 5 0 0 1 4.302 -2.877z';

/** Place the 24-grid icon into rig space: scale s, center on x=100, crown
 *  bottom edge on y=bottom. */
export function hatPlacement(s: number, bottom: number): string {
  return `translate(${r2(100 - 12 * s)} ${r2(bottom - 16.005 * s)}) scale(${r2(s)})`;
}

// Default anatomy (single source of truth for the SVG skeleton).
// Hat: header icon at 6.8x -> 136 wide, crown bottom edge y=92 (x 52..148).
// Icon's own band, at this scale, is a 95x20 bar centered on y~116 -- the
// 'hidden' pose parks the brim exactly there, reproducing the brand icon.
export const ANATOMY: Anatomy = {
  viewBox: '18 -30 164 198',
  hatD: HAT_ICON_D,
  hatTransform: hatPlacement(6.8, 92),
  eyeLX: 83,
  eyeRX: 117,
  eyeY: 116,
  eyeR: 11,
  brimY: 142,
  brimX: 100,
  bendDepth: 44,
  anchorX: 100,
  anchorY: 190,
};

export interface RigFrame {
  figureTransform: string;
  brimD: string;
  brimW: number;
  eyeLTransform: string;
  eyeRTransform: string;
  /** Lid clip polygons in eye-local coords (eye circle is at 0,0 r=eyeR). */
  lidLPoints: string;
  lidRPoints: string;
}

function eyeTransform(cx: number, p: RigParams, a: Anatomy): string {
  const x = cx + p.lookX;
  const y = a.eyeY + p.eyesDy + p.lookY;
  return `translate(${r2(x)} ${r2(y)})`;
}

/**
 * Visible-region polygon for one eye, in eye-local coords.
 * Upper lid drops from the top (lidTop), optionally tilted (lidAngle);
 * lower lid rises from the bottom (lidBot). `mirror` flips the lid tilt so
 * scowls angle inward on both eyes.
 */
function lidPolygon(lidTop: number, lidBot: number, lidAngle: number, mirror: 1 | -1, a: Anatomy): string {
  const s = a.eyeR + 4; // pad so an un-lidded eye is never clipped
  const topC = -s + clamp01(lidTop) * 2 * s;
  const dt = Math.tan((lidAngle * Math.PI) / 180) * s * mirror;
  const yB = s - clamp01(lidBot) * 2 * s;
  return [
    `${r2(-s)},${r2(topC - dt)}`,
    `${r2(s)},${r2(topC + dt)}`,
    `${r2(s)},${r2(yB)}`,
    `${r2(-s)},${r2(yB)}`,
  ].join(' ');
}

/** Compute one frame of SVG attributes from rig parameters. */
export function computeFrame(p: RigParams, a: Anatomy = ANATOMY): RigFrame {
  const { anchorX, anchorY, brimX, brimY, bendDepth } = a;

  const sy = p.squash;
  const sx = 2 - p.squash; // volume-ish preservation
  const figureTransform =
    `translate(${r2(p.shiftX)} ${r2(p.bob)}) ` +
    `rotate(${r2(p.tilt)} ${anchorX} 130) ` +
    `translate(${anchorX} ${anchorY}) scale(${r2(sx)} ${r2(sy)}) translate(${-anchorX} ${-anchorY})`;

  const by = brimY + p.brimDy;
  const dip = p.brimBend * bendDepth;
  const brimD =
    `M${r2(brimX - p.brimLen)} ${r2(by)} ` +
    `Q${brimX} ${r2(by + dip)} ${r2(brimX + p.brimLen)} ${r2(by)}`;

  return {
    figureTransform,
    brimD,
    brimW: Math.max(1, p.brimW),
    eyeLTransform: eyeTransform(a.eyeLX, p, a),
    eyeRTransform: eyeTransform(a.eyeRX, p, a),
    lidLPoints: lidPolygon(p.lidTopL, p.lidBotL, p.lidAngleL, 1, a),
    lidRPoints: lidPolygon(p.lidTopR, p.lidBotR, p.lidAngleR, -1, a),
  };
}

/** Lid values for a closed eye (blink/wink): both lids meet at center,
 *  leaving a bold short band (reads as a drawn line, not a squashed eye). */
export const CLOSED_LID = { lidTop: 0.42, lidBot: 0.42 } as const;

/** Merge a partial pose over REST into a full parameter set. */
export function resolvePose(partial: Partial<RigParams>): RigParams {
  return { ...REST, ...partial };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function r2(v: number): number {
  return Math.round(v * 100) / 100;
}
