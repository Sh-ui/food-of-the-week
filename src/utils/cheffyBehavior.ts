// cheffyBehavior.ts -- ambient personality director.
//
// Hexagonal unit: no DOM, no SVG. Emits high-level events (blink, glance,
// sleep, wake, bounce) on randomized timers according to a mode; the adapter
// in Cheffy.astro translates events into rig-parameter overlays. Feed it
// user-activity signals via `activity()` so it knows when to doze off.
//
// Modes ("mix of all depending on context"):
//   dormant -- emits nothing; mascot rests as a plain hat icon.
//   subtle  -- occasional blink, rare glance, dozes off after inactivity.
//   lively  -- frequent blinks/glances, occasional bounce, slower to doze.

export type BehaviorMode = 'dormant' | 'subtle' | 'lively';

export type BehaviorEvent =
  | { type: 'blink' }
  | { type: 'glance'; x: number; y: number; holdMs: number }
  | { type: 'bounce' }
  | { type: 'sleep' }
  | { type: 'wake' };

interface ModeTuning {
  blinkMs: [number, number] | null;
  glanceMs: [number, number] | null;
  bounceMs: [number, number] | null;
  sleepAfterMs: number | null;
}

const TUNING: Record<BehaviorMode, ModeTuning> = {
  dormant: { blinkMs: null, glanceMs: null, bounceMs: null, sleepAfterMs: null },
  subtle:  { blinkMs: [3000, 7000], glanceMs: [12000, 26000], bounceMs: null, sleepAfterMs: 60000 },
  lively:  { blinkMs: [2000, 5000], glanceMs: [6000, 14000], bounceMs: [16000, 32000], sleepAfterMs: 180000 },
};

export interface Behavior {
  setMode(mode: BehaviorMode): void;
  readonly mode: BehaviorMode;
  readonly asleep: boolean;
  /** Signal user activity (scroll, pointer move, focus). Wakes if asleep. */
  activity(): void;
  /** Suspend all ambient events (e.g. while the dialogue panel is open). */
  pause(): void;
  resume(): void;
  destroy(): void;
}

export function createBehavior(opts: {
  mode: BehaviorMode;
  onEvent: (ev: BehaviorEvent) => void;
  /** Injectable RNG for tests. */
  random?: () => number;
}): Behavior {
  const rnd = opts.random ?? Math.random;
  let mode = opts.mode;
  let asleep = false;
  let paused = false;
  let lastActivity = Date.now();
  const timers = new Set<ReturnType<typeof setTimeout>>();

  const between = ([lo, hi]: [number, number]) => lo + rnd() * (hi - lo);

  function schedule(range: [number, number] | null, fire: () => void): void {
    if (!range) return;
    const t = setTimeout(() => {
      timers.delete(t);
      if (!paused && !asleep) fire();
      schedule(TUNING[mode][rangeKeyOf(fire)] as [number, number] | null, fire);
    }, between(range));
    timers.add(t);
  }

  // map the fire fn back to its tuning key so rescheduling follows mode changes
  const fireBlink = () => opts.onEvent({ type: 'blink' });
  const fireGlance = () =>
    opts.onEvent({
      type: 'glance',
      x: (rnd() * 2 - 1) * 5,
      y: (rnd() - 0.6) * 3,
      holdMs: 700 + rnd() * 1000,
    });
  const fireBounce = () => opts.onEvent({ type: 'bounce' });
  function rangeKeyOf(fn: () => void): keyof ModeTuning {
    return fn === fireBlink ? 'blinkMs' : fn === fireGlance ? 'glanceMs' : 'bounceMs';
  }

  function checkSleep(): void {
    const after = TUNING[mode].sleepAfterMs;
    if (after == null || asleep || paused) return;
    const idle = Date.now() - lastActivity;
    if (idle >= after) {
      asleep = true;
      opts.onEvent({ type: 'sleep' });
    } else {
      const t = setTimeout(() => {
        timers.delete(t);
        checkSleep();
      }, after - idle + 50);
      timers.add(t);
    }
  }

  function clearAll(): void {
    for (const t of timers) clearTimeout(t);
    timers.clear();
  }

  function arm(): void {
    clearAll();
    const tune = TUNING[mode];
    schedule(tune.blinkMs, fireBlink);
    schedule(tune.glanceMs, fireGlance);
    schedule(tune.bounceMs, fireBounce);
    checkSleep();
  }

  arm();

  return {
    get mode() {
      return mode;
    },
    get asleep() {
      return asleep;
    },
    setMode(m) {
      if (m === mode) return;
      mode = m;
      asleep = false;
      arm();
    },
    activity() {
      lastActivity = Date.now();
      if (asleep) {
        asleep = false;
        opts.onEvent({ type: 'wake' });
        arm();
      }
    },
    pause() {
      paused = true;
      clearAll();
    },
    resume() {
      if (!paused) return;
      paused = false;
      lastActivity = Date.now();
      arm();
    },
    destroy() {
      clearAll();
      paused = true;
    },
  };
}
