// ---------------------------------------------------------------------------
// generate-lunch-week.mjs
// ---------------------------------------------------------------------------
// Picks the week's lunches from the pool using an Anki-style, least-recently-
// used rotation: items not served in the longest time come up first.
//
// FROZEN CURRENT WEEK + COMMITTED HISTORY: the committed lunch-week.json and
// lunch-history.json are the source of truth. Within a week the plan NEVER
// changes -- if lunch-week.json already covers the target week (and its item
// ids still exist in the pool), it is reused verbatim, no matter what changed
// in the pool or config since. Past weeks recorded in lunch-history.json are
// likewise trusted as-is. Only a week the state files don't cover (the Sunday
// rollover) is selected fresh -- deterministically (same date + same state +
// same config => same plan), so CI and local builds agree without committing
// back. Grocery additions are always rebuilt from the (possibly frozen) day
// ids, so /lunch and the grocery section can never disagree.
//
// Knobs live in src/data/lunch-config.json (exclude / boost / pin / caps /
// etc.). Knob or pool changes apply from the NEXT week -- to reshuffle the
// current week on purpose, pass --force.
//
// Outputs (committed; only written when content actually changes):
//   - src/data/lunch-week.json     (the target week's plan + grocery additions)
//   - src/data/lunch-history.json  (which items served which week; authoritative past)
//
//   npm run lunch:generate                 # current week (frozen if already known)
//   npm run lunch:generate -- --date=2026-07-05
//   npm run lunch:generate -- --force      # deliberately reshuffle the current week
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'src', 'data');
const POOL_PATH = join(DATA, 'lunch-pool.json');
const CONFIG_PATH = join(DATA, 'lunch-config.json');
const WEEK_PATH = join(DATA, 'lunch-week.json');
const HISTORY_PATH = join(DATA, 'lunch-history.json');

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_MS = 86400000;
const GROCERY_ORDER = ['Produce', 'Protein', 'Dairy', 'Frozen', 'Pantry'];
const GRAIN_BASES = new Set(['crackers', 'bread', 'tortilla', 'pita', 'popcorn', 'rice_cake', 'waffle', 'english_muffin', 'oat']);
const BOOST_WEEKS = 3; // hearted items act as if served this many weeks earlier

// ---- date helpers ----------------------------------------------------------
const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const toISO = (dt) => dt.toISOString().slice(0, 10);
const mostRecentSunday = (dt) => { const d = new Date(dt); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d; };
const addDays = (dt, n) => { const d = new Date(dt); d.setUTCDate(d.getUTCDate() + n); return d; };
const weeksBetween = (a, b) => Math.round((b - a) / (7 * DAY_MS));
function weekTitle(start) {
  const end = addDays(start, 6);
  const m1 = MONTHS[start.getUTCMonth()], d1 = start.getUTCDate();
  const m2 = MONTHS[end.getUTCMonth()], d2 = end.getUTCDate(), y = end.getUTCFullYear();
  return m1 === m2 ? `Week of ${m1} ${d1}-${d2}, ${y}` : `Week of ${m1} ${d1} - ${m2} ${d2}, ${y}`;
}

// ---- deterministic PRNG (stable per week) ----------------------------------
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ---- load ------------------------------------------------------------------
const pool = JSON.parse(readFileSync(POOL_PATH, 'utf8'));
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
const cfg = {
  startDate: config.startDate || '2026-06-28',
  timezone: typeof config.timezone === 'string' ? config.timezone : 'UTC',
  itemsPerWeek: config.itemsPerWeek || 7,
  autoGrocery: config.autoGrocery !== false,
  exclude: new Set(config.exclude || []),
  boost: new Set(config.boost || []),
  pin: config.pin || {},
  rules: {
    maxPerProtein: config.rotation?.maxPerProtein ?? 2,
    maxSomeEffort: config.rotation?.maxSomeEffort ?? 2,
    maxGrainBase: config.rotation?.maxGrainBase ?? 4,
    softTarget: config.rotation?.softTarget ?? 2,
  },
};

const itemsById = new Map(pool.items.map((it) => [it.id, it]));
const activeItems = pool.items.filter((it) => !cfg.exclude.has(it.id));
const perWeek = Math.min(cfg.itemsPerWeek, activeItems.length);

// ---- args ------------------------------------------------------------------
// "Today" is evaluated in cfg.timezone (fail-soft to UTC), NOT the machine's
// clock -- CI runs in UTC and would otherwise flip to the new week on Saturday
// evening US time, yanking Saturday's lunch off /lunch while mom can still see it.
function todayISOInTz(tz) {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: tz }); // en-CA => YYYY-MM-DD
  } catch {
    console.warn(`  ! invalid timezone "${tz}" in lunch-config.json -- falling back to UTC`);
    return toISO(new Date());
  }
}
const dateArg = process.argv.find((a) => a.startsWith('--date='));
const force = process.argv.includes('--force');
const today = dateArg ? parseISO(dateArg.split('=')[1]) : parseISO(todayISOInTz(cfg.timezone));
const epoch = mostRecentSunday(parseISO(cfg.startDate));
let targetStart = mostRecentSunday(today);
if (targetStart < epoch) targetStart = epoch;
const totalWeeks = weeksBetween(epoch, targetStart) + 1; // replay epoch..target inclusive
const targetISO = toISO(targetStart);

// ---- prior committed state (fail-soft: unreadable => regenerate) -----------
const readJSONSoft = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const priorWeek = readJSONSoft(WEEK_PATH);
const priorHistory = readJSONSoft(HISTORY_PATH);

// Past weeks from committed history are authoritative (pool edits can't rewrite
// them). Ignored wholesale if startDate changed -- that's a new rotation.
const historyByWeek = new Map();
if (priorHistory && priorHistory.startDate === cfg.startDate && Array.isArray(priorHistory.weeks)) {
  for (const w of priorHistory.weeks) {
    if (w && typeof w.weekStart === 'string' && Array.isArray(w.items)) {
      historyByWeek.set(w.weekStart, w.items.filter((id) => typeof id === 'string'));
    }
  }
}

// The freeze: the committed lunch-week.json wins for its own week unless
// --force, so mid-week pool/config edits never reshuffle what mom already saw.
// Even an id that has LEFT the pool stays frozen -- its day is served from the
// committed record verbatim (losing only its grocery lines, with a warning).
const frozen = !force
  && priorWeek && priorWeek.weekStart === targetISO
  && Array.isArray(priorWeek.days) && priorWeek.days.length > 0
  && priorWeek.days.every((d) => d && typeof d.id === 'string');

// ---- one week's selection (given prior lastScheduled) ----------------------
function selectWeek(weekStart, lastScheduled) {
  const weekISO = toISO(weekStart);
  const rand = mulberry32(hashStr(weekISO));
  const jitter = new Map(activeItems.map((it) => [it.id, rand()]));

  const score = (it) => {
    const last = lastScheduled[it.id];
    const base = last ? weeksBetween(parseISO(last), weekStart) : 9999;
    return base + (cfg.boost.has(it.id) ? BOOST_WEEKS : 0);
  };

  const ranked = [...activeItems].sort((a, b) => {
    const s = score(b) - score(a);
    if (s !== 0) return s;
    const ease = (b.effort === 'easy') - (a.effort === 'easy');
    if (ease !== 0) return ease;
    const soft = (b.soft === true) - (a.soft === true);
    if (soft !== 0) return soft;
    return jitter.get(a.id) - jitter.get(b.id);
  });

  const chosen = [];
  const proteinCount = {};
  let someEffort = 0, grainBase = 0, soft = 0;

  // honor pins for this week first
  const pinned = (cfg.pin[weekISO] || []).map((id) => itemsById.get(id)).filter(Boolean);
  for (const it of pinned) {
    if (chosen.length >= perWeek || chosen.includes(it)) continue;
    chosen.push(it);
    proteinCount[it.protein] = (proteinCount[it.protein] || 0) + 1;
    if (it.effort === 'some') someEffort++;
    if (GRAIN_BASES.has(it.base)) grainBase++;
    if (it.soft) soft++;
  }

  for (const it of ranked) {
    if (chosen.length >= perWeek) break;
    if (chosen.includes(it)) continue;
    if ((proteinCount[it.protein] || 0) >= cfg.rules.maxPerProtein) continue;
    if (it.effort === 'some' && someEffort >= cfg.rules.maxSomeEffort) continue;
    if (GRAIN_BASES.has(it.base) && grainBase >= cfg.rules.maxGrainBase) continue;
    chosen.push(it);
    proteinCount[it.protein] = (proteinCount[it.protein] || 0) + 1;
    if (it.effort === 'some') someEffort++;
    if (GRAIN_BASES.has(it.base)) grainBase++;
    if (it.soft) soft++;
  }

  // soft nudge toward target without disturbing the high-priority picks
  if (soft < cfg.rules.softTarget) {
    const ids = new Set(chosen.map((c) => c.id));
    for (const cand of ranked.filter((it) => it.soft && !ids.has(it.id))) {
      if (soft >= cfg.rules.softTarget) break;
      const idx = chosen.findIndex((c, i) => !c.soft && i >= perWeek - 4);
      if (idx === -1) break;
      const removed = chosen[idx];
      const pc = {}; for (const c of chosen) pc[c.protein] = (pc[c.protein] || 0) + 1;
      pc[removed.protein]--;
      if ((pc[cand.protein] || 0) >= cfg.rules.maxPerProtein) continue;
      chosen[idx] = cand; soft++;
    }
  }

  // fallback if caps were too tight to fill (won't trigger with a full pool)
  if (chosen.length < perWeek) {
    for (const it of ranked) {
      if (chosen.length >= perWeek) break;
      if (!chosen.includes(it)) chosen.push(it);
    }
  }
  return chosen;
}

// ---- replay epoch..target: committed weeks verbatim, gaps selected fresh ---
const lastScheduled = {};
const historyWeeks = [];
let targetChosen = [];
for (let i = 0; i < totalWeeks; i++) {
  const ws = addDays(epoch, i * 7);
  const wsISO = toISO(ws);
  const isTarget = i === totalWeeks - 1;
  let ids;
  if (isTarget && frozen) {
    ids = priorWeek.days.map((d) => d.id);
  } else if (!isTarget && historyByWeek.has(wsISO)) {
    ids = historyByWeek.get(wsISO); // trusted even if an id has left the pool
  } else {
    ids = selectWeek(ws, lastScheduled).map((it) => it.id);
  }
  for (const id of ids) lastScheduled[id] = wsISO;
  historyWeeks.push({ weekStart: wsISO, items: ids });
  if (isTarget) {
    targetChosen = ids.map((id) => {
      const it = itemsById.get(id);
      if (it) return it;
      // Frozen id no longer in the pool: serve the committed day record as-is.
      const prior = frozen ? priorWeek.days.find((d) => d.id === id) : null;
      if (prior) {
        console.warn(`  ! frozen item "${id}" left the pool -- serving committed record, groceries dropped`);
        return { id: prior.id, name: prior.name, fridge: prior.fridge ?? [], carbServings: prior.carbServings,
                 effort: prior.effort, soft: prior.soft, protein: prior.protein, grocery: [] };
      }
      return null;
    }).filter(Boolean);
  }
}

// A --date run for a PAST week must never truncate later committed history:
// keep any prior weeks after the target untouched.
for (const [wsISO, items] of historyByWeek) {
  if (wsISO > targetISO) historyWeeks.push({ weekStart: wsISO, items });
}
historyWeeks.sort((a, b) => a.weekStart.localeCompare(b.weekStart));

// ---- build the target week output -----------------------------------------
const days = targetChosen.map((it, i) => {
  const date = addDays(targetStart, i);
  return {
    date: toISO(date), dow: DAYS[date.getUTCDay()],
    id: it.id, name: it.name, fridge: it.fridge,
    carbServings: it.carbServings, effort: it.effort, soft: it.soft, protein: it.protein,
  };
});

const seen = new Map();
for (const it of targetChosen) for (const g of it.grocery) {
  const k = g.text.toLowerCase();
  if (!seen.has(k)) seen.set(k, g);
}
const byCat = {};
for (const g of seen.values()) (byCat[g.cat] ||= []).push(g.text);
const grocery = GROCERY_ORDER.filter((c) => byCat[c]?.length).map((c) => ({
  name: c, items: byCat[c].sort((a, b) => a.localeCompare(b)),
}));

const week = {
  weekStart: toISO(targetStart),
  weekTitle: weekTitle(targetStart),
  poolSize: pool.items.length,
  activePoolSize: activeItems.length,
  autoGrocery: cfg.autoGrocery,
  carbServingNote: pool.carbServingNote,
  days,
  grocery,
};

// Idempotent writes: no timestamps, and untouched files stay byte-identical so
// routine builds leave a clean git tree.
function writeIfChanged(path, obj) {
  const next = JSON.stringify(obj, null, 2) + '\n';
  try { if (readFileSync(path, 'utf8') === next) return false; } catch { /* absent -> write */ }
  writeFileSync(path, next);
  return true;
}
writeIfChanged(WEEK_PATH, week);
writeIfChanged(HISTORY_PATH, {
  _comment: 'COMMITTED STATE: which lunch ids served which week. Weeks listed here are trusted verbatim on later runs (pool edits cannot rewrite the past). Delete only to restart the rotation from lunch-config.startDate.',
  startDate: cfg.startDate,
  weeks: historyWeeks,
});

// ---- report ----------------------------------------------------------------
console.log(`\n${week.weekTitle}  (pool ${activeItems.length}/${pool.items.length} active, replayed ${totalWeeks} wk${frozen ? ', FROZEN -- committed week reused' : force ? ', forced reshuffle' : ''})`);
for (const d of days) console.log(`  ${d.dow.padEnd(9)} ${d.name}  [${d.carbServings} carb · ${d.effort}${d.soft ? ' · soft' : ''}]`);
console.log(`  groceries: ${grocery.reduce((n, c) => n + c.items.length, 0)} items · autoGrocery=${cfg.autoGrocery}` +
  (cfg.exclude.size ? ` · excluded ${cfg.exclude.size}` : '') + (cfg.boost.size ? ` · boosted ${cfg.boost.size}` : '') + '\n');
