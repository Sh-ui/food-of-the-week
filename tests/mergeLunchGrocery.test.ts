// mergeLunchGrocery.test.ts -- duplicate suppression between the hand-written
// main grocery list and the generated lunch grocery additions.
// Run via `npm test` (node --test tests/). Node 23 strips types natively.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mergeLunchGrocery, normalizeGroceryText } from '../src/utils/mergeLunchGrocery.ts';
import type { ListCategory } from '../src/utils/weekParser.ts';

const cat = (name: string, texts: string[]): ListCategory => ({
  name,
  items: texts.map((text) => ({ text, globallyChecked: false })),
});

describe('normalizeGroceryText', () => {
  test('strips parentheticals and quantity suffixes', () => {
    assert.equal(normalizeGroceryText('Cucumber - 1 (Tilapia cucumber-yogurt salad)'), 'cucumber');
    assert.equal(normalizeGroceryText('Carrots - 1 lb (Lentil Curry body)'), 'carrot');
    assert.equal(normalizeGroceryText('Pork shoulder chunks (deep freezer -- braised)'), 'pork shoulder chunk');
  });

  test('strips " -- " note suffixes', () => {
    assert.equal(normalizeGroceryText('Coconut milk -- pantry staple'), 'coconut milk');
  });

  test('folds naive plurals but keeps -ss words', () => {
    assert.equal(normalizeGroceryText('Limes'), normalizeGroceryText('Lime'));
    assert.equal(normalizeGroceryText('Swiss'), 'swiss');
    // short words are left alone ("peas" folds, "gas" does not)
    assert.equal(normalizeGroceryText('Gas'), 'gas');
  });

  test('does NOT conflate distinct products', () => {
    assert.notEqual(normalizeGroceryText('Plain Greek yogurt'), normalizeGroceryText('Greek yogurt dressing'));
    assert.notEqual(normalizeGroceryText('Whole-milk Greek yogurt'), normalizeGroceryText('Plain Greek yogurt'));
  });
});

describe('mergeLunchGrocery', () => {
  test('suppresses a lunch item the main list already carries (decorated text)', () => {
    const merged = mergeLunchGrocery(
      [cat('Produce', ['Cucumber - 1 (Tilapia cucumber-yogurt salad)', 'Limes - 3-4'])],
      [{ name: 'Produce', items: ['Cucumber', 'Spinach'] }]
    );
    const produce = merged.find((c) => c.name === 'Produce')!;
    const texts = produce.items.map((i) => i.text);
    assert.deepEqual(texts, ['Cucumber - 1 (Tilapia cucumber-yogurt salad)', 'Limes - 3-4', 'Spinach']);
    assert.equal(produce.items[0].coversLunch, true);
    assert.equal(produce.items[0].isLunch, undefined);
    assert.equal(produce.items[2].isLunch, true);
  });

  test('suppresses across categories (main list shelves things differently)', () => {
    const merged = mergeLunchGrocery(
      [cat('Pantry', ['Peanut butter (big jar)'])],
      [{ name: 'Protein', items: ['Peanut butter'] }]
    );
    // no new Protein category should appear just for the duplicate
    assert.equal(merged.some((c) => c.name === 'Protein'), false);
    assert.equal(merged[0].items[0].coversLunch, true);
  });

  test('appends unmatched categories whole', () => {
    const merged = mergeLunchGrocery(
      [cat('Produce', ['Onions'])],
      [{ name: 'Dairy', items: ['Cottage cheese'] }]
    );
    const dairy = merged.find((c) => c.name === 'Dairy')!;
    assert.equal(dairy.items.length, 1);
    assert.equal(dairy.items[0].isLunch, true);
  });

  test('dedupes within the lunch list itself', () => {
    const merged = mergeLunchGrocery(
      [],
      [
        { name: 'Produce', items: ['Berries'] },
        { name: 'Frozen', items: ['Berries'] },
      ]
    );
    assert.equal(merged.flatMap((c) => c.items).length, 1);
  });

  test('irregular plurals fold: berries/berry, tomatoes/tomato', () => {
    assert.equal(normalizeGroceryText('Berries'), normalizeGroceryText('Berry'));
    assert.equal(normalizeGroceryText('Tomatoes'), normalizeGroceryText('Tomato'));
  });

  test('does not mutate the input categories or their items', () => {
    const main = [cat('Produce', ['Cucumber'])];
    const merged = mergeLunchGrocery(main, [{ name: 'Produce', items: ['Cucumber', 'Spinach'] }]);
    assert.equal(main[0].items.length, 1);
    assert.equal(main[0].items[0].coversLunch, undefined); // flag lands on the copy only
    assert.equal(merged[0].items[0].coversLunch, true);
  });
});
