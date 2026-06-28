// ---------------------------------------------------------------------------
// generate-lunch-week.mjs
// ---------------------------------------------------------------------------
// Picks the week's lunches from the pool using an Anki-style, least-recently-
// used rotation: items not served in the longest time come up first.
//
// STATELESS + DETERMINISTIC: the whole schedule is replayed in memory from
// config.startDate up to the target week on every run, so there is NO state
// file to keep in sync. That's what lets it "ride along" automatically inside
// `npm run build` (via the `prebuild` hook) — including in CI — with nothing to
// commit back. Same date + same config => same plan, every time.
//
// Knobs live in src/data/lunch-config.json (exclude / boost / pin / caps / etc.)
// and are read fresh each run.
//
// Outputs:
//   - src/data/lunch-week.json     (the target week's plan + grocery additions)
//   - src/data/lunch-history.json  (audit trail of the replayed schedule; informational)
//
//   npm run lunch:generate                 # current week
//   npm run lunch:generate -- --date=2026-07-05
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
const dateArg = process.argv.find((a) => a.startsWith('--date='));
const today = dateArg ? parseISO(dateArg.split('=')[1]) : parseISO(toISO(new Date()));
const epoch = mostRecentSunday(parseISO(cfg.startDate));
let targetStart = mostRecentSunday(today);
if (targetStart < epoch) targetStart = epoch;
const totalWeeks = weeksBetween(epoch, targetStart) + 1; // replay epoch..target inclusive

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

// ---- replay the schedule from epoch to target -----------------------------
const lastScheduled = {};
const historyWeeks = [];
let targetChosen = [];
for (let i = 0; i < totalWeeks; i++) {
  const ws = addDays(epoch, i * 7);
  const wsISO = toISO(ws);
  const chosen = selectWeek(ws, lastScheduled);
  for (const it of chosen) lastScheduled[it.id] = wsISO;
  historyWeeks.push({ weekStart: wsISO, items: chosen.map((c) => c.id) });
  if (i === totalWeeks - 1) targetChosen = chosen;
}

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
  generatedAt: new Date().toISOString(),
  poolSize: pool.items.length,
  activePoolSize: activeItems.length,
  autoGrocery: cfg.autoGrocery,
  carbServingNote: pool.carbServingNote,
  days,
  grocery,
};
writeFileSync(WEEK_PATH, JSON.stringify(week, null, 2) + '\n');
writeFileSync(HISTORY_PATH, JSON.stringify({
  _comment: 'AUTO-GENERATED audit trail (deterministic replay from lunch-config.startDate). Not an input — safe to delete; it is rebuilt every run.',
  startDate: cfg.startDate,
  updatedAt: new Date().toISOString(),
  weeks: historyWeeks,
}, null, 2) + '\n');

// ---- report ----------------------------------------------------------------
console.log(`\n${week.weekTitle}  (pool ${activeItems.length}/${pool.items.length} active, replayed ${totalWeeks} wk)`);
for (const d of days) console.log(`  ${d.dow.padEnd(9)} ${d.name}  [${d.carbServings} carb · ${d.effort}${d.soft ? ' · soft' : ''}]`);
console.log(`  groceries: ${grocery.reduce((n, c) => n + c.items.length, 0)} items · autoGrocery=${cfg.autoGrocery}` +
  (cfg.exclude.size ? ` · excluded ${cfg.exclude.size}` : '') + (cfg.boost.size ? ` · boosted ${cfg.boost.size}` : '') + '\n');
