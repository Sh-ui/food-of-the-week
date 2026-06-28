// ---------------------------------------------------------------------------
// build-lunch-pool.mjs
// ---------------------------------------------------------------------------
// Builds src/data/lunch-pool.json — the "big list" of mom-friendly lunches.
//
// Each lunch is a ready carb + protein combo following the principles on
// mom's nutritionist handout (see brainstorming/mom-lunch-source.md):
//   - always pair a carb with a protein
//   - controlled carbs (1 carb serving = 15 g carbs)
//   - favor high-fiber veg, healthy fats, lean/easy proteins
//   - favor easy / soft / no-cook prep
//
// Provenance per item:  pdf = nutritionist handout · lunch-buddy = ported from
// the lunch-buddy pantry · web = synthesized from diabetes-org / healthline /
// diabetesfoodhub guidance (see sources in LUNCH-SYSTEM.md).
//
// To add a lunch: append an item below and re-run `npm run lunch:pool`.
// ---------------------------------------------------------------------------

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'data', 'lunch-pool.json');

// grocery helper: [text, category]
const P = (t) => [t, 'Produce'];
const PR = (t) => [t, 'Protein'];
const D = (t) => [t, 'Dairy'];
const F = (t) => [t, 'Frozen'];
const PA = (t) => [t, 'Pantry'];

// item helper keeps definitions compact + consistent
function L(id, name, opts) {
  return {
    id,
    name,
    fridge: opts.fridge,
    protein: opts.protein,
    base: opts.base,
    carbServings: opts.carb,
    effort: opts.effort || 'easy',
    soft: !!opts.soft,
    tags: opts.tags || [],
    grocery: (opts.grocery || []).map(([text, cat]) => ({ text, cat })),
    source: opts.source,
  };
}

const items = [
  // ---- From mom's nutritionist handout (PDF) --------------------------------
  L('eggs-celery-carrots', 'Hard-boiled eggs + celery + baby carrots', {
    fridge: ['2 hard-boiled eggs', 'Celery sticks', 'Baby carrots'],
    protein: 'egg', base: 'veg', carb: '≈0–1', soft: false,
    tags: ['high_fiber', 'lean_protein'],
    grocery: [PR('Hard-boiled eggs (or eggs to boil)'), P('Celery'), P('Baby carrots')],
    source: 'pdf',
  }),
  L('cracker-pb-banana', 'Whole-wheat crackers + peanut butter + ½ banana', {
    fridge: ['3–5 whole-wheat crackers', '1 Tbsp peanut butter', '½ banana'],
    protein: 'peanut_butter', base: 'crackers', carb: '≈2', soft: true,
    tags: ['healthy_fat'],
    grocery: [PA('Whole-wheat crackers'), PA('Peanut butter'), P('Bananas')],
    source: 'pdf',
  }),
  L('popcorn-nuts', 'Popcorn + mixed nuts', {
    fridge: ['3 cups popcorn', '3 Tbsp mixed nuts'],
    protein: 'nuts', base: 'popcorn', carb: '≈1', soft: false,
    tags: ['healthy_fat', 'whole_grain'],
    grocery: [PA('Popcorn (plain / light)'), PA('Mixed nuts')],
    source: 'pdf',
  }),
  L('crackers-cheese', 'Whole-grain crackers + low-fat cheese', {
    fridge: ['4–5 whole-grain crackers', 'Low-fat cheese slices'],
    protein: 'cheese', base: 'crackers', carb: '≈1', soft: false,
    grocery: [PA('Whole-grain crackers'), D('Low-fat cheese slices')],
    source: 'pdf',
  }),
  L('graham-pb', 'Graham crackers + peanut butter', {
    fridge: ['3 graham cracker squares', '1 Tbsp peanut butter'],
    protein: 'peanut_butter', base: 'crackers', carb: '≈1–2', soft: true,
    tags: ['healthy_fat'],
    grocery: [PA('Graham crackers'), PA('Peanut butter')],
    source: 'pdf',
  }),
  L('turkey-cheese-sandwich', 'Open turkey + cheese on whole-grain bread', {
    fridge: ['1 slice whole-grain bread', 'Slice of turkey', 'Slice of cheese', 'Mustard'],
    protein: 'turkey', base: 'bread', carb: '≈1', soft: false,
    tags: ['lean_protein'],
    grocery: [PA('Whole-grain bread'), PR('Deli turkey'), D('Cheese slices'), PA('Mustard')],
    source: 'pdf',
  }),
  L('saltines-pb', 'Saltine crackers + peanut butter', {
    fridge: ['6 saltine crackers', '1 Tbsp peanut butter'],
    protein: 'peanut_butter', base: 'crackers', carb: '≈1', soft: true,
    grocery: [PA('Saltine crackers'), PA('Peanut butter')],
    source: 'pdf',
  }),
  L('celery-pb-raisins', 'Celery + peanut butter + raisins (ants on a log)', {
    fridge: ['2–3 celery sticks', '1 Tbsp peanut butter', '1 Tbsp raisins'],
    protein: 'peanut_butter', base: 'veg', carb: '≈1', soft: false,
    tags: ['high_fiber', 'healthy_fat'],
    grocery: [P('Celery'), PA('Peanut butter'), PA('Raisins')],
    source: 'pdf',
  }),
  L('snap-peas-hummus', 'Sugar snap peas + hummus', {
    fridge: ['½ cup sugar snap peas', '2 Tbsp hummus'],
    protein: 'hummus', base: 'veg', carb: '≈1', soft: false,
    tags: ['high_fiber', 'legume'],
    grocery: [P('Sugar snap peas'), D('Hummus')],
    source: 'pdf',
  }),
  L('tuna-salad-pita', 'Tuna or egg salad + ½ whole-wheat pita', {
    fridge: ['½ cup tuna or egg salad', '½ whole-wheat pita (or 4–5 crackers)'],
    protein: 'tuna', base: 'pita', carb: '≈1', soft: true,
    tags: ['lean_protein'],
    grocery: [PR('Tuna pouches (or eggs)'), PA('Whole-wheat pita'), D('Light mayo')],
    source: 'pdf',
  }),
  L('english-muffin-nutbutter', 'Light English muffin + nut butter or cheese', {
    fridge: ['1 light English muffin', '1 Tbsp nut butter or cheese'],
    protein: 'peanut_butter', base: 'english_muffin', carb: '≈1–2', soft: true,
    grocery: [PA('Light English muffins'), PA('Nut butter')],
    source: 'pdf',
  }),
  L('cottage-cheese-fruitcup', 'Cottage cheese + small fruit cup', {
    fridge: ['½ cup low-fat cottage cheese', '1 small fruit cup (in juice/water)'],
    protein: 'cottage_cheese', base: 'fruit', carb: '≈1', soft: true,
    tags: ['dairy', 'lean_protein'],
    grocery: [D('Low-fat cottage cheese'), PA('Fruit cups (in juice/water)')],
    source: 'pdf',
  }),
  L('banana-pb', '½ banana + peanut butter', {
    fridge: ['½ banana', '1 Tbsp peanut butter'],
    protein: 'peanut_butter', base: 'fruit', carb: '≈1', soft: true,
    tags: ['healthy_fat'],
    grocery: [P('Bananas'), PA('Peanut butter')],
    source: 'pdf',
  }),
  L('wheatthins-stringcheese', 'Wheat Thins + string cheese', {
    fridge: ['10 multigrain Wheat Thins', '1 string cheese'],
    protein: 'cheese', base: 'crackers', carb: '≈1', soft: false,
    grocery: [PA('Multigrain Wheat Thins'), D('String cheese')],
    source: 'pdf',
  }),
  L('rice-pudding-nuts', 'No-sugar-added rice pudding + nuts', {
    fridge: ['4 oz no-sugar-added rice pudding', '2 Tbsp nuts'],
    protein: 'nuts', base: 'oat', carb: '≈1–2', soft: true,
    grocery: [D('No-sugar-added rice pudding'), PA('Nuts')],
    source: 'pdf',
  }),
  L('carrots-ranch', 'Carrots + light ranch dip', {
    fridge: ['½ cup carrots', '2 Tbsp light ranch dip'],
    protein: 'dairy_dip', base: 'veg', carb: '≈0–1', soft: false,
    tags: ['high_fiber'],
    grocery: [P('Baby carrots'), D('Light ranch dip')],
    source: 'pdf',
  }),
  L('egg-fruit', 'Hard-boiled egg + a small piece of fruit', {
    fridge: ['1 hard-boiled egg', '1 small piece of fruit'],
    protein: 'egg', base: 'fruit', carb: '≈1', soft: true,
    tags: ['lean_protein'],
    grocery: [PR('Hard-boiled eggs (or eggs to boil)'), P('Apples / small fruit')],
    source: 'pdf',
  }),
  L('waffle-nutbutter', 'Eggo waffle + nut butter', {
    fridge: ['1 Eggo waffle (toasted)', '1 Tbsp nut butter'],
    protein: 'peanut_butter', base: 'waffle', carb: '≈1–2', soft: false, effort: 'some',
    grocery: [F('Eggo waffles'), PA('Nut butter')],
    source: 'pdf',
  }),
  L('applesauce-nuts', 'Applesauce + mixed nuts', {
    fridge: ['½ cup applesauce', '2 Tbsp mixed nuts'],
    protein: 'nuts', base: 'fruit', carb: '≈1', soft: true,
    grocery: [PA('Unsweetened applesauce'), PA('Mixed nuts')],
    source: 'pdf',
  }),
  L('cucumber-hummus', 'Cucumber + hummus', {
    fridge: ['1 cup cucumber slices', '2 Tbsp hummus'],
    protein: 'hummus', base: 'veg', carb: '≈1', soft: false,
    tags: ['high_fiber', 'legume'],
    grocery: [P('Cucumber'), D('Hummus')],
    source: 'pdf',
  }),
  L('pepper-hummus', 'Sweet pepper + hummus', {
    fridge: ['1 sweet pepper, sliced', '2 Tbsp hummus'],
    protein: 'hummus', base: 'veg', carb: '≈1', soft: false,
    tags: ['high_fiber', 'legume'],
    grocery: [P('Sweet bell peppers'), D('Hummus')],
    source: 'pdf',
  }),
  L('ricecake-pb', 'Rice cake + peanut butter (or low-sugar jam)', {
    fridge: ['1 rice cake', '1 Tbsp peanut butter or low-sugar jam'],
    protein: 'peanut_butter', base: 'rice_cake', carb: '≈1', soft: false,
    grocery: [PA('Rice cakes'), PA('Peanut butter')],
    source: 'pdf',
  }),
  L('deli-rolls-yogurt', 'Deli meat + cheese roll-ups + light yogurt', {
    fridge: ['Rolled-up deli meat + cheese', '4 oz light yogurt', '2 Tbsp salsa'],
    protein: 'deli', base: 'none', carb: '≈1', soft: false,
    tags: ['lean_protein'],
    grocery: [PR('Deli meat'), D('Cheese slices'), D('Light yogurt'), P('Salsa')],
    source: 'pdf',
  }),
  L('toast-cheese-egg', 'Whole-wheat toast + cheese + hard-cooked egg', {
    fridge: ['1 slice whole-wheat toast', '1 slice cheese', '1 hard-cooked egg'],
    protein: 'egg', base: 'bread', carb: '≈1', soft: false, effort: 'some',
    grocery: [PA('Whole-wheat bread'), D('Cheese slices'), PR('Eggs')],
    source: 'pdf',
  }),
  L('jello-fruit-cottage', 'Sugar-free jello + fruit + cottage cheese', {
    fridge: ['1 cup sugar-free jello', '½ cup fruit', '½ cup cottage cheese'],
    protein: 'cottage_cheese', base: 'fruit', carb: '≈1', soft: true,
    grocery: [PA('Sugar-free jello'), P('Fruit'), D('Cottage cheese')],
    source: 'pdf',
  }),
  L('animalcrackers-pb', 'Animal crackers (or pretzel rods) + peanut butter', {
    fridge: ['8 animal crackers or 2 pretzel rods', '1 Tbsp peanut butter'],
    protein: 'peanut_butter', base: 'crackers', carb: '≈1', soft: false,
    grocery: [PA('Animal crackers / pretzel rods'), PA('Peanut butter')],
    source: 'pdf',
  }),
  L('jerky-trailmix', 'Beef jerky trail mix', {
    fridge: ['Beef jerky', 'Almonds, cashews, walnuts, pecans', 'Edamame'],
    protein: 'beef_jerky', base: 'none', carb: '≈0–1', soft: false,
    tags: ['lean_protein', 'healthy_fat'],
    grocery: [PR('Beef jerky'), PA('Mixed nuts'), F('Shelled edamame')],
    source: 'pdf',
  }),
  L('cottage-celery', 'Cottage cheese + celery', {
    fridge: ['½ cup cottage cheese', 'Celery sticks'],
    protein: 'cottage_cheese', base: 'veg', carb: '≈0–1', soft: true,
    tags: ['high_fiber', 'lean_protein'],
    grocery: [D('Cottage cheese'), P('Celery')],
    source: 'pdf',
  }),
  L('greekyogurt-celery', 'Greek yogurt + celery', {
    fridge: ['¾ cup plain Greek yogurt', 'Celery sticks'],
    protein: 'yogurt', base: 'veg', carb: '≈0–1', soft: true,
    tags: ['high_fiber', 'lean_protein'],
    grocery: [D('Plain Greek yogurt'), P('Celery')],
    source: 'pdf',
  }),
  L('greekyogurt-nuts', 'Greek yogurt + nuts', {
    fridge: ['¾ cup plain Greek yogurt', '2 Tbsp nuts'],
    protein: 'yogurt', base: 'none', carb: '≈1', soft: true,
    tags: ['healthy_fat', 'lean_protein'],
    grocery: [D('Plain Greek yogurt'), PA('Nuts')],
    source: 'pdf',
  }),
  L('deviled-eggs', 'Deviled eggs (add tuna for a change)', {
    fridge: ['2–3 deviled egg halves', 'Optional: tuna in the center'],
    protein: 'egg', base: 'none', carb: '≈0', soft: true, effort: 'some',
    tags: ['lean_protein'],
    grocery: [PR('Eggs'), D('Light mayo'), PR('Tuna pouch (optional)')],
    source: 'pdf',
  }),
  L('egg-muffin-cups', 'Egg muffin cups (meat, spinach, cheese)', {
    fridge: ['2 baked egg muffin cups'],
    protein: 'egg', base: 'none', carb: '≈0', soft: true, effort: 'some',
    tags: ['lean_protein', 'high_fiber'],
    grocery: [PR('Eggs'), PR('Cooked meat'), P('Spinach'), D('Shredded cheese')],
    source: 'pdf',
  }),
  L('flatout-veggie-wrap', 'Flatout wrap with veggies + meat', {
    fridge: ['1 Flatout wrap', 'Veggies', 'Deli meat or cheese'],
    protein: 'deli', base: 'tortilla', carb: '≈1', soft: false,
    tags: ['high_fiber', 'whole_grain'],
    grocery: [PA('Flatout / low-carb wraps'), P('Mixed veggies'), PR('Deli meat')],
    source: 'pdf',
  }),
  L('tuna-packet-peppers', 'Tuna packet + celery or peppers', {
    fridge: ['1 tuna packet', 'Celery or pepper strips'],
    protein: 'tuna', base: 'veg', carb: '≈0–1', soft: false,
    tags: ['lean_protein', 'high_fiber'],
    grocery: [PR('Tuna pouches'), P('Celery / bell peppers')],
    source: 'pdf',
  }),
  L('tortilla-salsa-cheese', 'Flour tortilla + salsa + cheese', {
    fridge: ['1 small flour tortilla', 'Salsa', 'Shredded cheese'],
    protein: 'cheese', base: 'tortilla', carb: '≈1', soft: true,
    grocery: [PA('Small tortillas'), P('Salsa'), D('Shredded cheese')],
    source: 'pdf',
  }),

  // ---- Ported from lunch-buddy pantry (easy grab-and-go fits) ---------------
  L('cheese-crackers-grapes', 'Cheese cubes + whole-grain crackers + grapes', {
    fridge: ['Cheese cubes', '4–5 whole-grain crackers', '17 grapes'],
    protein: 'cheese', base: 'crackers', carb: '≈2', soft: false,
    grocery: [D('Cheese cubes'), PA('Whole-grain crackers'), P('Grapes')],
    source: 'lunch-buddy',
  }),
  L('hummus-pita-cucumber', 'Hummus + whole-wheat pita + cucumber', {
    fridge: ['2 Tbsp hummus', '½ whole-wheat pita', 'Cucumber slices'],
    protein: 'hummus', base: 'pita', carb: '≈1', soft: true,
    tags: ['legume', 'high_fiber'],
    grocery: [D('Hummus'), PA('Whole-wheat pita'), P('Cucumber')],
    source: 'lunch-buddy',
  }),
  L('cottage-pineapple-seeds', 'Cottage cheese + pineapple + sunflower seeds', {
    fridge: ['½ cup cottage cheese', '½ cup pineapple', '1 Tbsp sunflower seeds'],
    protein: 'cottage_cheese', base: 'fruit', carb: '≈1', soft: true,
    grocery: [D('Cottage cheese'), P('Pineapple (or cups)'), PA('Sunflower seeds')],
    source: 'lunch-buddy',
  }),
  L('yogurt-dressing-eggs-crackers', 'Hard-boiled eggs + baby kale + crackers + yogurt dressing', {
    fridge: ['2 hard-boiled eggs', 'Baby kale', '4–5 whole-wheat crackers', 'Yogurt dressing'],
    protein: 'egg', base: 'crackers', carb: '≈1', soft: false,
    tags: ['high_fiber', 'lean_protein'],
    grocery: [PR('Hard-boiled eggs'), P('Baby kale'), PA('Whole-wheat crackers'), D('Greek yogurt dressing')],
    source: 'lunch-buddy',
  }),
  L('turkey-pita-romaine', 'Deli turkey + pita + romaine + yogurt dressing', {
    fridge: ['Deli turkey', '½ whole-wheat pita', 'Romaine', 'Yogurt dressing'],
    protein: 'turkey', base: 'pita', carb: '≈1', soft: false,
    tags: ['lean_protein', 'high_fiber'],
    grocery: [PR('Deli turkey'), PA('Whole-wheat pita'), P('Romaine'), D('Greek yogurt dressing')],
    source: 'lunch-buddy',
  }),
  L('chicken-kale-cold', 'Chilled chicken + baby kale + a few crackers', {
    fridge: ['Pre-cooked chicken', 'Baby kale', '4–5 whole-wheat crackers'],
    protein: 'chicken', base: 'crackers', carb: '≈1', soft: false,
    tags: ['lean_protein', 'high_fiber'],
    grocery: [PR('Pre-cooked chicken'), P('Baby kale'), PA('Whole-wheat crackers')],
    source: 'lunch-buddy',
  }),
  L('broccoli-cheese-kale', 'Broccoli + cheese cubes + baby kale + yogurt dressing', {
    fridge: ['Broccoli florets', 'Cheese cubes', 'Baby kale', 'Yogurt dressing'],
    protein: 'cheese', base: 'veg', carb: '≈0–1', soft: false,
    tags: ['high_fiber'],
    grocery: [P('Broccoli'), D('Cheese cubes'), P('Baby kale'), D('Greek yogurt dressing')],
    source: 'lunch-buddy',
  }),

  // ---- Web expansion (diabetes-org / healthline / diabetesfoodhub) ----------
  L('stringcheese-apple', 'String cheese + apple', {
    fridge: ['1 string cheese', '1 small apple'],
    protein: 'cheese', base: 'fruit', carb: '≈1', soft: false,
    grocery: [D('String cheese'), P('Apples')],
    source: 'web',
  }),
  L('greekyogurt-berries', 'Greek yogurt + berries', {
    fridge: ['¾ cup plain Greek yogurt', '½ cup berries'],
    protein: 'yogurt', base: 'fruit', carb: '≈1', soft: true,
    tags: ['high_fiber', 'lean_protein'],
    grocery: [D('Plain Greek yogurt'), P('Berries')],
    source: 'web',
  }),
  L('apple-pb', 'Apple slices + peanut butter', {
    fridge: ['1 small apple, sliced', '1 Tbsp peanut butter'],
    protein: 'peanut_butter', base: 'fruit', carb: '≈1–2', soft: false,
    tags: ['high_fiber', 'healthy_fat'],
    grocery: [P('Apples'), PA('Peanut butter')],
    source: 'web',
  }),
  L('almondbutter-celery', 'Celery + almond butter', {
    fridge: ['Celery sticks', '1 Tbsp almond butter'],
    protein: 'nuts', base: 'veg', carb: '≈0–1', soft: false,
    tags: ['high_fiber', 'healthy_fat'],
    grocery: [P('Celery'), PA('Almond butter')],
    source: 'web',
  }),
  L('tuna-avocado-crackers', 'Tuna + avocado + whole-wheat crackers', {
    fridge: ['1 tuna pouch', '¼ avocado', '4–5 whole-wheat crackers'],
    protein: 'tuna', base: 'crackers', carb: '≈1', soft: true,
    tags: ['lean_protein', 'healthy_fat'],
    grocery: [PR('Tuna pouches'), P('Avocado'), PA('Whole-wheat crackers')],
    source: 'web',
  }),
  L('med-hummus-rollup', 'Mediterranean hummus roll-up', {
    fridge: ['Whole-wheat tortilla', 'Hummus', 'Spinach', 'Cucumber', 'Roasted red pepper'],
    protein: 'hummus', base: 'tortilla', carb: '≈1–2', soft: true,
    tags: ['legume', 'high_fiber'],
    grocery: [PA('Whole-wheat tortillas'), D('Hummus'), P('Spinach'), P('Cucumber'), PA('Roasted red peppers (jar)')],
    source: 'web',
  }),
  L('edamame-clementine', 'Steamed edamame + a clementine', {
    fridge: ['1 cup steamed edamame', '1 clementine'],
    protein: 'edamame', base: 'fruit', carb: '≈1', soft: true, effort: 'some',
    tags: ['legume', 'high_fiber', 'lean_protein'],
    grocery: [F('Shelled edamame'), P('Clementines')],
    source: 'web',
  }),
  L('avocado-egg-toast', 'Avocado + hard-boiled egg on whole-grain toast', {
    fridge: ['1 slice whole-grain toast', '¼ avocado, mashed', '1 hard-boiled egg, sliced'],
    protein: 'egg', base: 'bread', carb: '≈1', soft: true, effort: 'some',
    tags: ['healthy_fat', 'lean_protein'],
    grocery: [PA('Whole-grain bread'), P('Avocado'), PR('Hard-boiled eggs')],
    source: 'web',
  }),
  L('cottage-tomato-toast', 'Cottage cheese + tomato on whole-grain toast', {
    fridge: ['1 slice whole-grain toast', '½ cup cottage cheese', 'Tomato slices'],
    protein: 'cottage_cheese', base: 'bread', carb: '≈1', soft: true, effort: 'some',
    tags: ['lean_protein'],
    grocery: [PA('Whole-grain bread'), D('Cottage cheese'), P('Tomatoes')],
    source: 'web',
  }),
  L('salmon-crackers-cucumber', 'Smoked salmon + whole-wheat crackers + cucumber', {
    fridge: ['Smoked salmon', '4–5 whole-wheat crackers', 'Cucumber slices'],
    protein: 'salmon', base: 'crackers', carb: '≈1', soft: true,
    tags: ['healthy_fat', 'lean_protein'],
    grocery: [PR('Smoked salmon'), PA('Whole-wheat crackers'), P('Cucumber')],
    source: 'web',
  }),
];

const data = {
  version: 1,
  principles: [
    'Always pair a carb with a protein.',
    'Controlled carbs: 1 carb serving = 15 g carbs (see mom-lunch-source.md).',
    'Favor high-fiber veg, healthy fats, lean/easy proteins.',
    'Favor easy / soft / no-cook prep.',
  ],
  carbServingNote:
    'carbServings is an approximate count of 15 g carb servings, estimated from the nutritionist handout. Always check the food label.',
  count: items.length,
  items,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n');
console.log(`Wrote ${items.length} lunches → ${OUT}`);

// quick integrity checks
const ids = new Set();
for (const it of items) {
  if (ids.has(it.id)) throw new Error(`Duplicate id: ${it.id}`);
  ids.add(it.id);
  if (!it.protein || !it.base) throw new Error(`Missing protein/base on ${it.id}`);
  if (!it.fridge?.length) throw new Error(`Missing fridge on ${it.id}`);
  if (!it.grocery?.length) throw new Error(`Missing grocery on ${it.id}`);
}
console.log('Integrity OK:', items.length, 'unique items');
