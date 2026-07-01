// cheffyState.ts -- pure week-identity + visitedWeeks helpers for Cheffy.
// Full design contract: ../../CHEFFY-SYSTEM.md.
// Kept UI-independent so it can be unit-tested on its own. Pure, dependency-free,
// no DOM/browser APIs, no relative imports (see cheffyCalendar.ts precedent).

/** Map of weekId -> true once the user has opened/dismissed Cheffy for that week. */
export type VisitedWeeks = Record<string, true>;

/**
 * Reproduce EXACTLY the GroceryList/MealCard slug rule. MUST stay byte-identical:
 *   weekTitle.toLowerCase().replace(/\s+/g, '-')
 * Do NOT strip punctuation, do NOT collapse repeated hyphens (that is
 * cheffyCalendar.ts's stricter slugify -- they diverge on purpose).
 */
export function slugifyWeekTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-');
}

/** True the first time this weekId is seen (not yet in the visited map). */
export function isNewWeek(visited: VisitedWeeks, weekId: string): boolean {
  return !visited[weekId];
}

/** Return a NEW map with weekId marked visited (pure -- no mutation of input). */
export function markVisited(visited: VisitedWeeks, weekId: string): VisitedWeeks {
  return { ...visited, [weekId]: true };
}

/**
 * Pure state decision on first paint given whether the current week is new.
 * New week -> 'attention' (excited + dot); otherwise -> 'idle'.
 */
export function initialStateFor(isNew: boolean): 'idle' | 'attention' {
  return isNew ? 'attention' : 'idle';
}
