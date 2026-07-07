// cheffyMotion.ts -- tiny generic spring engine.
//
// Hexagonal unit: knows nothing about Cheffy, SVG, or the DOM. Springs a flat
// record of named numbers toward targets; the caller reads values each frame
// and paints however it likes. Used by Cheffy.astro to drive cheffyRig params,
// but reusable for any numeric animation.

export interface SpringFeel {
  stiffness: number; // spring constant
  damping: number;   // higher = less overshoot
}

export const FEELS: Record<string, SpringFeel> = {
  soft:    { stiffness: 70,  damping: 14 },
  default: { stiffness: 170, damping: 18 },
  snappy:  { stiffness: 320, damping: 20 },
};

const SETTLE_EPS = 0.005;

export interface SpringSet<K extends string = string> {
  /** Current values -- read these each frame. */
  readonly values: Record<K, number>;
  /** Retarget some or all channels. `feel` applies to the given channels. */
  setTargets(targets: Partial<Record<K, number>>, feel?: SpringFeel): void;
  /** Jump instantly (used for prefers-reduced-motion). */
  snap(targets: Partial<Record<K, number>>): void;
  /** Advance by dt seconds. Returns false once everything has settled. */
  tick(dt: number): boolean;
}

export function createSprings<K extends string>(
  initial: Record<K, number>,
  feel: SpringFeel = FEELS.default,
): SpringSet<K> {
  const values = { ...initial };
  const targets = { ...initial };
  const velocity = {} as Record<K, number>;
  const feels = {} as Record<K, SpringFeel>;
  for (const k in values) {
    velocity[k] = 0;
    feels[k] = feel;
  }

  return {
    values,
    setTargets(t, f) {
      for (const k in t) {
        targets[k as K] = t[k as K]!;
        if (f) feels[k as K] = f;
      }
    },
    snap(t) {
      for (const k in t) {
        values[k as K] = targets[k as K] = t[k as K]!;
        velocity[k as K] = 0;
      }
    },
    tick(dt) {
      // clamp dt so background-tab jumps don't explode the integrator
      const step = Math.min(dt, 1 / 20);
      let moving = false;
      for (const k in values) {
        const f = feels[k];
        const delta = targets[k] - values[k];
        const accel = f.stiffness * delta - f.damping * velocity[k];
        velocity[k] += accel * step;
        values[k] += velocity[k] * step;
        if (Math.abs(delta) > SETTLE_EPS || Math.abs(velocity[k]) > SETTLE_EPS) {
          moving = true;
        } else {
          values[k] = targets[k];
          velocity[k] = 0;
        }
      }
      return moving;
    },
  };
}

/**
 * rAF loop that runs only while springs are moving. Call `wake()` after any
 * retarget; the loop stops itself once everything settles (no idle rAF churn).
 */
export function createLoop(onFrame: (dt: number) => boolean): { wake(): void; stop(): void } {
  let raf = 0;
  let last = 0;
  const frame = (now: number) => {
    const dt = last ? (now - last) / 1000 : 1 / 60;
    last = now;
    let moving = false;
    try {
      moving = onFrame(dt);
    } catch (e) {
      // never let one bad frame wedge the loop with a stale raf id
      console.error('[cheffyMotion] frame error', e);
    }
    raf = moving ? requestAnimationFrame(frame) : 0;
    if (!raf) last = 0;
  };
  return {
    wake() {
      if (!raf) raf = requestAnimationFrame(frame);
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    },
  };
}
