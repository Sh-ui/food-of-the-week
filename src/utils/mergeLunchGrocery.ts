import type { GroceryItem, ListCategory } from './weekParser';

export interface LunchGroceryCategory {
  name: string;
  items: string[];
}

/**
 * Canonical form for duplicate detection across the hand-written main list and
 * the generated lunch list. The main list decorates items with quantities and
 * notes ("Cucumber - 1 (Tilapia cucumber-yogurt salad)"); the lunch list is
 * bare ("Cucumber"). Both must land on the same key:
 *   - lowercase
 *   - parentheticals removed
 *   - everything after a " - <digit>" / " -- " quantity-or-note suffix removed
 *   - punctuation collapsed to spaces
 *   - naive plural fold on each word (trailing 's', keeps 'ss' words intact)
 */
export function normalizeGroceryText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+--\s.*$/, ' ')
    .replace(/\s+-\s+\d.*$/, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => {
      if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y'; // berries -> berry
      if (word.length > 4 && word.endsWith('oes')) return word.slice(0, -2); // tomatoes -> tomato
      if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
      return word;
    })
    .join(' ');
}

/**
 * Folds lunch grocery items into the week's main grocery categories, matching
 * by category name (case-insensitive). Items are flagged isLunch so the UI can
 * color-code and toggle them in place, rather than rendering a separate list.
 * Categories with no main-list match are appended as their own category, still
 * rendered through the same grocery-category markup.
 *
 * Duplicate suppression is by normalized text across ALL main categories (the
 * hand-written list may shelve an item under a different category than the
 * generator does); a main item that also covers a lunch is flagged
 * coversLunch so the UI can dot-mark it without hiding it behind the toggle.
 */
export function mergeLunchGrocery(
  mainCategories: ListCategory[],
  lunchCategories: LunchGroceryCategory[]
): ListCategory[] {
  // Deep-copy items: coversLunch is set on the merged view only, never on the
  // caller's parsed week plan.
  const merged = mainCategories.map((category) => ({
    ...category,
    items: category.items.map((item) => ({ ...item })),
  }));

  const mainByNorm = new Map<string, GroceryItem>();
  for (const category of merged) {
    for (const item of category.items) {
      const key = normalizeGroceryText(item.text);
      if (key && !mainByNorm.has(key)) mainByNorm.set(key, item);
    }
  }

  for (const lunchCategory of lunchCategories) {
    const target = merged.find(
      (category) => category.name.toLowerCase() === lunchCategory.name.toLowerCase()
    );
    const newItems: Array<{ text: string; globallyChecked: boolean; isLunch: boolean }> = [];
    for (const text of lunchCategory.items) {
      const key = normalizeGroceryText(text);
      const existing = key ? mainByNorm.get(key) : undefined;
      if (existing) {
        if (!existing.isLunch) existing.coversLunch = true; // already on the list -- just dot-mark it
        continue;
      }
      const item = { text, globallyChecked: false, isLunch: true };
      if (key) mainByNorm.set(key, item); // lunch list can also self-duplicate across meals
      newItems.push(item);
    }

    if (target) {
      target.items.push(...newItems);
    } else if (newItems.length > 0) {
      merged.push({ name: lunchCategory.name, items: newItems });
    }
  }

  return merged;
}
