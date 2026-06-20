#!/usr/bin/env node
// parse-archive.mjs -- high-level meal catalog from archive/*.md
//
// Reads every archived weekly plan, pulls each individual meal out, and
// interprets it at a high level: name, codename/technique, the anchor/fan/cai
// fields, plus derived facets (proteins, cuisines, fan type) so a planning
// agent can drill down by what the cook is in the mood for.
//
// Usage:
//   node parse-archive.mjs                 # JSON array of all meals
//   node parse-archive.mjs --list          # human-readable grouped list
//   node parse-archive.mjs --facets        # available filter values + counts
//   node parse-archive.mjs --protein=chicken --cuisine=italian   # filter (AND across facets, OR within)
//   node parse-archive.mjs --technique=wok --since=20260101 --limit=20
//   node parse-archive.mjs --id=20260517-tamale-casserole        # one meal, full fields
//
// Filters: --protein --cuisine --fan --technique  (comma-separated = OR)
//          --since=YYYYMMDD  --until=YYYYMMDD  --limit=N  --id=<meal-id>
//          --json (force JSON even with filters)  --full (include full field text in JSON)

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// skill lives at <repo>/.claude/skills/plan-week/ -> archive is three up
const ARCHIVE = resolve(__dirname, '..', '..', '..', 'archive');

// ---- facet keyword maps ----------------------------------------------------
// Order matters only for readability; a meal can match several values per facet.
const PROTEINS = {
  chicken: [/\bchicken\b/, /\bfricass/, /\bpoussin\b/],
  pork: [/\bpork\b/, /\bbacon\b/, /\bsausage\b/, /\bchorizo\b/, /\bcarnitas\b/],
  beef: [/\bbeef\b/, /\bsteak\b/, /\btenderloin\b/, /\bbulgogi\b/, /\bbison\b/, /\bragu\b/, /\bpicadillo\b/, /\bmeatball/],
  lamb: [/\blamb\b/, /\bkofta\b/],
  salmon: [/\bsalmon\b/],
  tilapia: [/\btilapia\b/],
  whitefish: [/\bcod\b/, /\bwhite ?fish\b/, /\bsheet ?pan fish\b/, /\bfish\b/],
  shrimp: [/\bshrimp\b/, /\bscampi\b/, /\bprawn/],
  scallop: [/\bscallop/],
  legume: [/\blentil/, /\bdal\b/, /\bchili\b/, /\bbean\b/, /\bchickpea/, /\bveggie\b/, /\bvegetarian\b/, /\bfrittata\b/, /\bfeta\b/, /\btofu\b/],
};

const CUISINES = {
  italian: [/\bparm/, /\bpasta\b/, /\bspaghetti\b/, /\bpenne\b/, /\borzo\b/, /\bgnocchi\b/, /\barrabbiata\b/, /\bscampi\b/, /\bputtanesca\b/, /\balfredo\b/, /\bragu\b/, /\bpizza\b/, /\bitalioaf/, /\bfennel\b/, /\bsicilian\b/, /\bbistro\b/],
  'mexican-latin': [/\btaco\b/, /\btostada\b/, /\bmasa\b/, /\btamal/, /\bpicadillo\b/, /\bsalsa\b/, /\bcreole\b/, /\bgringo\b/, /\bchili\b/, /\bchipotle\b/, /\badobo\b/],
  'indian-sasian': [/\bdal\b/, /\bcurry\b/, /\bsabzi\b/, /\btadka\b/, /\bgaram\b/, /\bmasala\b/, /\bkofta\b/, /\btikka\b/, /\bcoconut\b/],
  'east-asian': [/\bwok\b/, /\bbulgogi\b/, /\bkorean\b/, /\bmiso\b/, /\bsoba\b/, /\bteriyaki\b/, /\bginger\b/, /\bscallion\b/, /\begg roll\b/, /\bdapanji\b/, /\blemongrass\b/, /\bthai\b/, /\bstir.?fry\b/, /\borange chicken\b/, /\bjapanese\b/, /\bgochujang\b/, /\bnoodle/, /\bbok choy\b/],
  'med-mideast': [/\bmediterranean\b/, /\bharissa\b/, /\bcouscous\b/, /\bfeta\b/, /\bpita\b/, /\beastern med\b/, /\btahini\b/, /\bgreek\b/],
  american: [/\bpot pie\b/, /\bpopover\b/, /\bfrittata\b/, /\bblackened\b/, /\bmaple\b/, /\bbrown butter\b/, /\bcakes\b/, /\bbrussels\b/, /\bsheet ?pan\b/, /\bcod & chips\b/, /\bfricass/],
};

const FANS = {
  rice: [/\brice\b/, /\bbibimbap\b/],
  noodles: [/\bnoodle/, /\bsoba\b/, /\bramen\b/, /\budon\b/, /\bvermicelli\b/],
  pasta: [/\bpasta\b/, /\bspaghetti\b/, /\bpenne\b/, /\blinguine\b/, /\borzo\b/, /\bgnocchi\b/],
  couscous: [/\bcouscous\b/],
  grain: [/\bfarro\b/, /\bpolenta\b/, /\bquinoa\b/, /\bbulgur\b/, /\bbarley\b/],
  bread: [/\bbread\b/, /\bpita\b/, /\bpopover\b/, /\btostada\b/, /\btaco\b/, /\bpizza\b/, /\bfritter\b/, /\bmasa\b/, /\btamal/, /\bbun\b/],
  potato: [/\bpotato/, /\bsmashed potato/, /\bfries\b/, /\bchips\b/],
};

// ---- markdown helpers ------------------------------------------------------
const stripMd = (s) =>
  (s || '')
    .replace(/\*\*\*|\*\*|\*|`|~~/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

const firstSentence = (s) => {
  const t = stripMd(s);
  const m = t.match(/^(.*?[.!?])(\s|$)/);
  let out = m ? m[1] : t;
  if (out.length > 140) out = out.slice(0, 137).trimEnd() + '...';
  return out;
};

const matchFacets = (text, map) => {
  const t = text.toLowerCase();
  return Object.keys(map).filter((k) => map[k].some((re) => re.test(t)));
};

// H2 names that are not meals
const isPrepHeading = (name, codename) => {
  if (/^(grocery list|sunday prep|weekend prep|saturday prep|prep day|prep|batch day)$/i.test(name)) return true;
  if ((codename || '').toLowerCase().startsWith('batchday')) return true;
  return false;
};

// ---- parse one archive file ------------------------------------------------
function parseFile(filename) {
  const raw = readFileSync(join(ARCHIVE, filename), 'utf8');
  const lines = raw.split('\n');
  const date = (filename.match(/^(\d{8})/) || [])[1] || '00000000';

  let weekTitle = '';
  const meals = [];
  let cur = null; // current meal block
  let curField = null; // current H4 field name (lowercased, no colon)

  const pushField = (meal, field, text) => {
    if (!field) return;
    meal.fields[field] = (meal.fields[field] ? meal.fields[field] + ' ' : '') + text;
  };

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    const h4 = line.match(/^####\s+(.*)/);
    const h5 = line.match(/^#####\s+(.*)/);
    const h6 = line.match(/^######\s+(.*)/);

    // order: most-# first since ## also matches deeper? No -- ^##\s only matches exactly two when next char is space.
    if (h6) {
      if (cur && !cur.briefing) cur.briefing = stripMd(h6[1]);
      curField = null;
      continue;
    }
    if (h5) {
      if (cur) cur.codename = stripMd(h5[1]);
      curField = null;
      continue;
    }
    if (h4) {
      if (cur) {
        curField = stripMd(h4[1]).replace(/:\s*$/, '').toLowerCase();
        cur.fields[curField] = cur.fields[curField] || '';
      }
      continue;
    }
    // H3 (### ...) starts an instruction section -- stop capturing field text.
    // (^### but not #### -- check exactly three hashes followed by space.)
    if (/^###\s/.test(line) && !line.startsWith('#### ')) {
      curField = null;
      continue;
    }
    if (line.startsWith('## ')) {
      // close previous meal
      if (cur) meals.push(cur);
      let name = stripMd(h2[1]).replace(/^✓\s*/, '').replace(/^Meal\s*\d+\s*:\s*/i, '').trim();
      cur = { name, codename: '', briefing: '', fields: {} };
      curField = null;
      continue;
    }
    if (h1 && !weekTitle) {
      weekTitle = stripMd(h1[1]).replace(/^Week of\s*/i, '');
      continue;
    }
    // body line -> append to current field
    if (cur && curField && line.trim()) {
      pushField(cur, curField, stripMd(line));
    }
  }
  if (cur) meals.push(cur);

  // finalize: drop prep sections, derive facets
  return meals
    .filter((m) => !isPrepHeading(m.name, m.codename))
    .map((m) => {
      const anchor = m.fields['anchor'] || '';
      const fan = m.fields['fan'] || '';
      const cai = m.fields['cai'] || '';
      const soup = m.fields['soup'] || '';
      const desc = m.fields['description'] || ''; // old-era files
      // facet matching draws on every captured field (incl. old-era
      // description/ingredients/protein) plus the name and briefing.
      const blob = [m.name, m.briefing, ...Object.values(m.fields)].join(' ');
      const technique = (m.codename || '').replace(/[+]+$/, '') || null;
      const effort = ((m.codename || '').match(/\+/g) || []).length;
      const id = `${date}-${m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
      return {
        id,
        date,
        week: weekTitle,
        file: `archive/${filename}`,
        name: m.name,
        codename: m.codename || null,
        technique,
        effort,
        briefing: m.briefing || null,
        summary: `${m.name} -- ${firstSentence(anchor) || firstSentence(desc) || firstSentence(cai) || '(no description)'}`,
        proteins: matchFacets(blob, PROTEINS),
        cuisines: matchFacets(blob, CUISINES),
        fanType: matchFacets(fan + ' ' + (m.fields['ingredients'] || '') + ' ' + m.name, FANS),
        anchor: stripMd(anchor),
        fan: stripMd(fan),
        cai: stripMd(cai),
        soup: stripMd(soup),
      };
    });
}

// ---- collect all -----------------------------------------------------------
function allMeals() {
  const files = readdirSync(ARCHIVE).filter((f) => /^\d{8}.*\.md$/.test(f)).sort();
  return files.flatMap(parseFile);
}

// ---- CLI -------------------------------------------------------------------
const args = process.argv.slice(2);
const flag = (name) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf('=');
  return eq === -1 ? true : hit.slice(eq + 1);
};
const listFacet = (v) => (typeof v === 'string' ? v.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean) : []);

let meals = allMeals();

const since = flag('since');
const until = flag('until');
if (since) meals = meals.filter((m) => m.date >= String(since));
if (until) meals = meals.filter((m) => m.date <= String(until));

const fProtein = listFacet(flag('protein'));
const fCuisine = listFacet(flag('cuisine'));
const fFan = listFacet(flag('fan'));
const fTech = listFacet(flag('technique'));
const some = (have, want) => want.length === 0 || want.some((w) => have.some((h) => h.includes(w)));
if (fProtein.length) meals = meals.filter((m) => some(m.proteins, fProtein));
if (fCuisine.length) meals = meals.filter((m) => some(m.cuisines, fCuisine));
if (fFan.length) meals = meals.filter((m) => some(m.fanType, fFan));
if (fTech.length) meals = meals.filter((m) => some([(m.technique || '').toLowerCase()], fTech));

const id = flag('id');
if (id) meals = meals.filter((m) => m.id === id);

// sort newest first
meals.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

const limit = flag('limit');
if (limit) meals = meals.slice(0, Number(limit));

// ---- output ----------------------------------------------------------------
if (flag('facets')) {
  const tally = (key) => {
    const c = {};
    for (const m of meals) for (const v of m[key]) c[v] = (c[v] || 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  };
  const techTally = {};
  for (const m of meals) if (m.technique) techTally[m.technique] = (techTally[m.technique] || 0) + 1;
  const fmt = (rows) => rows.map(([k, v]) => `  ${k} (${v})`).join('\n');
  console.log(`Meals in scope: ${meals.length}\n`);
  console.log('PROTEIN:\n' + fmt(tally('proteins')));
  console.log('\nCUISINE:\n' + fmt(tally('cuisines')));
  console.log('\nFAN:\n' + fmt(tally('fanType')));
  console.log('\nTECHNIQUE:\n' + fmt(Object.entries(techTally).sort((a, b) => b[1] - a[1])));
} else if (flag('list')) {
  for (const m of meals) {
    const tags = [m.technique, ...m.proteins, ...m.cuisines].filter(Boolean).join(', ');
    console.log(`[${m.date}] ${m.summary}`);
    console.log(`         id=${m.id}  (${tags})`);
  }
  console.log(`\n${meals.length} meals`);
} else if (flag('full') || id) {
  console.log(JSON.stringify(meals, null, 2));
} else {
  // compact JSON (drop long field text) for catalog scanning
  const compact = meals.map(({ anchor, fan, cai, soup, ...rest }) => rest);
  console.log(JSON.stringify(compact, null, 2));
}
