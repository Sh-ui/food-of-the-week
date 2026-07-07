// cheffyRig.ts -- pure geometry for the Cheffy mascot rig.
//
// Hexagonal unit: no DOM, no timers, no imports. Takes a flat bag of numeric
// rig parameters and returns SVG attribute strings (path `d`, transforms,
// clip polygons). The adapter in Cheffy.astro writes these onto the SVG;
// cheffyMotion.ts springs the parameters between poses; poses themselves are
// data in src/data/cheffy-poses.json.
//
// Anatomy (viewBox 0 0 200 200):
//   - hat cloud: static path, three lobes, flat bottom at y=100
//   - eyes: two circles in the gap below the cloud (cy 120), modulated by
//     look/scale/squash params plus a lid clip polygon (sleep domes, scowl)
//   - brim: a single thick round-capped stroke. Straight = the hat's brim
//     bar; bent = a mouth. Slides up to tuck into the hat (plain-icon mode).
//   - figure: whole-mascot bob / tilt / squash-stretch, anchored at the
//     bottom center so bounces read as weight.
//
// All parameters are plain numbers so any spring/tween engine can drive them.

export interface RigParams {
  // whole figure
  bob: number;      // y offset, px (negative = up)
  shiftX: number;   // x offset, px
  tilt: number;     // degrees, rotation around (100, 130)
  squash: number;   // 1 = none; <1 squashes (wide+short), >1 stretches

  // brim (doubles as mouth)
  brimDy: number;   // y offset from rest (rest y = 142); -34 = tucked into hat
  brimBend: number; // -1..1; + bends into a smile, - into a frown
  brimLen: number;  // half-length of the stroke centerline
  brimW: number;    // stroke width

  // eyes -- shared gaze
  lookX: number;    // -5..5 gaze shift
  lookY: number;    // -4..4
  eyesDy: number;   // structural y offset (e.g. -36 hides eyes behind the cloud)

  // per-eye (L = viewer's left)
  eyeLScale: number;  // overall size multiplier
  eyeRScale: number;
  eyeLOpen: number;   // vertical squash 0..1 (0 = closed line, 1 = round)
  eyeROpen: number;
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
  brimDy: 0, brimBend: 0, brimLen: 42, brimW: 18,
  lookX: 0, lookY: 0, eyesDy: 0,
  eyeLScale: 1, eyeRScale: 1, eyeLOpen: 1, eyeROpen: 1,
  lidTopL: 0, lidTopR: 0, lidBotL: 0, lidBotR: 0,
  lidAngleL: 0, lidAngleR: 0,
};

// Fixed anatomy constants (single source of truth for the SVG skeleton).
export const ANATOMY = {
  viewBox: '14 -14 172 182',
  /** The hat cloud is a same-ink union of primitives: three lobe circles over
   *  a base slab. Overlapping fills read as one silhouette -- much easier to
   *  keep the three lobes iconic than a single hand-tuned path. */
  cloudLobes: [
    { cx: 56, cy: 58, r: 27 },   // left lobe
    { cx: 100, cy: 42, r: 38 },  // center lobe (bigger, taller)
    { cx: 144, cy: 58, r: 27 },  // right lobe
  ],
  /** Base slab: tapers inward toward the flat bottom (y=100) so the hat
   *  doesn't read as a straight-sided wall. Eyes hide behind this when
   *  tucked into the hat. */
  cloudBaseD: 'M31 58 H169 L162 93 Q161 100 152 100 H48 Q39 100 38 93 Z',
  eyeLX: 82,
  eyeRX: 118,
  eyeY: 118,
  eyeR: 10,
  brimY: 142,
  brimX: 100,
  /** How far the brim centerline dips at full bend. */
  bendDepth: 24,
  /** Squash/bounce anchor. */
  anchorX: 100,
  anchorY: 190,
} as const;

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

const MIN_OPEN = 0.06; // closed eye still renders as a thin line, not nothing

function eyeTransform(cx: number, p: RigParams, scale: number, open: number): string {
  const x = cx + p.lookX;
  const y = ANATOMY.eyeY + p.eyesDy + p.lookY;
  const sy = Math.max(MIN_OPEN, open) * scale;
  return `translate(${r2(x)} ${r2(y)}) scale(${r2(scale)} ${r2(sy)})`;
}

/**
 * Visible-region polygon for one eye, in eye-local coords.
 * Upper lid drops from the top (lidTop), optionally tilted (lidAngle);
 * lower lid rises from the bottom (lidBot). `mirror` flips the lid tilt so
 * scowls angle inward on both eyes.
 */
function lidPolygon(lidTop: number, lidBot: number, lidAngle: number, mirror: 1 | -1): string {
  const s = ANATOMY.eyeR + 4; // pad so an un-lidded eye is never clipped
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
export function computeFrame(p: RigParams): RigFrame {
  const { anchorX, anchorY, brimX, brimY, bendDepth, eyeLX, eyeRX } = ANATOMY;

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
    eyeLTransform: eyeTransform(eyeLX, p, p.eyeLScale, p.eyeLOpen),
    eyeRTransform: eyeTransform(eyeRX, p, p.eyeRScale, p.eyeROpen),
    lidLPoints: lidPolygon(p.lidTopL, p.lidBotL, p.lidAngleL, 1),
    lidRPoints: lidPolygon(p.lidTopR, p.lidBotR, p.lidAngleR, -1),
  };
}

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
