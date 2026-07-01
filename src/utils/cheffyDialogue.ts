// cheffyDialogue.ts -- pure dialogue-tree traversal + archive search matcher for Cheffy.
// Full design contract: ../../CHEFFY-SYSTEM.md > Dialogue system.
//
// Kept UI-independent so it can be unit-tested on its own. Pure, dependency-free,
// no DOM/browser APIs, no relative imports (see cheffyState.ts / cheffyCalendar.ts
// precedent). Callers (CheffyPanel's runtime script, the TEST rung) pass data in --
// this module never imports the JSON itself.

export type DialogueOption = { label: string; goto?: string; action?: string };
export type DialogueNode = { text: string; expression?: string; input?: boolean; options: DialogueOption[] };
export type DialogueTree = { start: string; nodes: Record<string, DialogueNode> };
export type ArchiveEntry = { slug: string; title: string; meals: string[] };

/** Valid action values the runtime knows about (the 5 from CHEFFY-SYSTEM.md). */
export const VALID_ACTIONS = ['generate-ics', 'trigger-permission', 'navigate-to-archive', 'export-checklist', 'close'] as const;

/** Look up a node by id. Total -- returns undefined for a missing id, never throws. */
export function getNode(tree: DialogueTree, id: string): DialogueNode | undefined {
  return tree.nodes[id];
}

/** Every goto id referenced by any option that has NO matching node. Empty = healthy tree. */
export function findDanglingGotos(tree: DialogueTree): string[] {
  const dangling: string[] = [];
  for (const node of Object.values(tree.nodes)) {
    for (const opt of node.options) {
      if (opt.goto && !tree.nodes[opt.goto]) dangling.push(opt.goto);
    }
  }
  return dangling;
}

/** Distinct action values used anywhere in the tree (for TEST: assert subset of VALID_ACTIONS). */
export function usedActions(tree: DialogueTree): string[] {
  const seen = new Set<string>();
  for (const node of Object.values(tree.nodes)) {
    for (const opt of node.options) {
      if (opt.action) seen.add(opt.action);
    }
  }
  return [...seen];
}

/**
 * Case-insensitive substring match on title + each meal. Title hits rank before
 * meal-only hits; dedup by slug; preserve index order within a rank. Empty/whitespace
 * query returns [].
 */
export function matchArchive(index: ArchiveEntry[], query: string): ArchiveEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const titleHits: ArchiveEntry[] = [];
  const mealHits: ArchiveEntry[] = [];
  const seen = new Set<string>();

  for (const entry of index) {
    if (seen.has(entry.slug)) continue;
    if (entry.title.toLowerCase().includes(q)) {
      titleHits.push(entry);
      seen.add(entry.slug);
    }
  }
  for (const entry of index) {
    if (seen.has(entry.slug)) continue;
    if (entry.meals.some((m) => m.toLowerCase().includes(q))) {
      mealHits.push(entry);
      seen.add(entry.slug);
    }
  }
  return [...titleHits, ...mealHits];
}

/** First/best match or null (empty/whitespace query -> null). */
export function bestArchiveMatch(index: ArchiveEntry[], query: string): ArchiveEntry | null {
  const hits = matchArchive(index, query);
  return hits.length > 0 ? hits[0] : null;
}
