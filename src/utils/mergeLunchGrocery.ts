import type { ListCategory } from './weekParser';

export interface LunchGroceryCategory {
  name: string;
  items: string[];
}

/**
 * Folds lunch grocery items into the week's main grocery categories, matching
 * by category name (case-insensitive). Items are flagged isLunch so the UI can
 * color-code and toggle them in place, rather than rendering a separate list.
 * Categories with no main-list match are appended as their own category, still
 * rendered through the same grocery-category markup.
 */
export function mergeLunchGrocery(
  mainCategories: ListCategory[],
  lunchCategories: LunchGroceryCategory[]
): ListCategory[] {
  const merged = mainCategories.map((category) => ({
    ...category,
    items: [...category.items],
  }));

  for (const lunchCategory of lunchCategories) {
    const target = merged.find(
      (category) => category.name.toLowerCase() === lunchCategory.name.toLowerCase()
    );
    const existingTexts = new Set(
      (target?.items ?? []).map((item) => item.text.toLowerCase())
    );
    const newItems = lunchCategory.items
      .filter((text) => !existingTexts.has(text.toLowerCase()))
      .map((text) => ({ text, globallyChecked: false, isLunch: true }));

    if (target) {
      target.items.push(...newItems);
    } else if (newItems.length > 0) {
      merged.push({ name: lunchCategory.name, items: newItems });
    }
  }

  return merged;
}
