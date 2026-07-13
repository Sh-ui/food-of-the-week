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
export const VALID_ACTIONS = ['generate-ics', 'generate-ics-meal', 'open-google-calendar', 'trigger-permission', 'notification-status', 'clear-reminders', 'navigate-to-archive', 'navigate-to-lunch', 'export-checklist', 'import-checklist', 'close'] as const;

/** Look up a node by id. Total -- returns undefined for a missing id, never throws. */
export function getNode(tree: DialogueTree, id: string): DialogueNode | undefined {
  return tree.nodes[id];
}

/** Every goto id referenced by any option that has NO matching node. Empty = healthy tree. */
export function findDanglingGotos(tree: DialogueTree): string[] {
  const dangling: string[] = [];
  for (const node of Object.values(tree.nodes)) {
    for (const opt of node.options) {
      // '#'-prefixed gotos are dynamic refs resolved at runtime by
      // resolveDynamicNode(), not static node ids -- never report as dangling.
      if (opt.goto && !opt.goto.startsWith('#') && !tree.nodes[opt.goto]) dangling.push(opt.goto);
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

// ---------------------------------------------------------------------------
// Dynamic nodes -- in-panel archive browsing/search built from '#'-prefixed
// goto refs. See CHEFFY-SYSTEM.md > Dialogue system for the ref grammar:
//   #archive-browse:<page>   paginated list of archive weeks (page 0-based int)
//   #archive-week:<slug>     preview of one archived week
//   #archive-results:<query> search results (payload = everything after the
//                             FIRST ':' -- queries may contain ':' themselves)
// Static gotos (plain ids) are untouched; dynamic and static gotos can point
// at each other freely. All builders here are pure/total -- no DOM, no throw.
// ---------------------------------------------------------------------------

export type DynamicNodeContext = { index: ArchiveEntry[]; pageSize?: number };

const DEFAULT_PAGE_SIZE = 5;
const MAX_MEALS_SHOWN = 6;
const MAX_RESULTS_SHOWN = 6;

/** Graceful landing spot for an unresolvable dynamic ref -- never throw, never dead-end. */
function fallbackNode(): DialogueNode {
  return {
    text: 'Hmm, I lost that page of my cookbook.',
    expression: 'surprised',
    options: [{ label: 'Back', goto: 'archive' }],
  };
}

/** Split a '#name:payload' ref into its parts. payload is '' when there is no ':'. */
function parseRef(ref: string): { name: string; payload: string } {
  const body = ref.slice(1); // drop leading '#'
  const i = body.indexOf(':');
  return i === -1 ? { name: body, payload: '' } : { name: body.slice(0, i), payload: body.slice(i + 1) };
}

/** Paginated list of archive weeks (index assumed newest-first, per callers). */
export function archiveBrowseNode(index: ArchiveEntry[], page: number, pageSize: number = DEFAULT_PAGE_SIZE): DialogueNode {
  if (index.length === 0) {
    return {
      text: 'No archived weeks yet - this is week one!',
      expression: 'surprised',
      options: [{ label: 'Back', goto: 'archive' }],
    };
  }

  const lastPage = Math.max(0, Math.ceil(index.length / pageSize) - 1);
  const safePage = Math.min(Math.max(0, Number.isFinite(page) ? page : 0), lastPage);

  const start = safePage * pageSize;
  const pageEntries = index.slice(start, start + pageSize);

  const options: DialogueOption[] = pageEntries.map((entry) => ({
    label: entry.title,
    goto: `#archive-week:${entry.slug}`,
  }));

  if (safePage < lastPage) {
    options.push({ label: 'Older weeks', goto: `#archive-browse:${safePage + 1}` });
  }
  if (safePage > 0) {
    options.push({ label: 'Newer weeks', goto: `#archive-browse:${safePage - 1}` });
  }
  options.push({ label: 'Back', goto: 'archive' });

  return {
    text: safePage === 0 ? "Here's what we've been cooking. Pick a week to peek at it." : 'Going further back...',
    expression: 'happy',
    options,
  };
}

/** Preview of a single archived week. */
export function archiveWeekNode(index: ArchiveEntry[], slug: string): DialogueNode {
  const entry = index.find((e) => e.slug === slug);
  if (!entry) return fallbackNode();

  const capped = entry.meals.length > MAX_MEALS_SHOWN ? entry.meals.slice(0, MAX_MEALS_SHOWN) : entry.meals;
  const mealsText = entry.meals.length > MAX_MEALS_SHOWN ? `${capped.join(', ')}, and more` : capped.join(', ');

  return {
    text: `${entry.title}\nThat week we made: ${mealsText}.`,
    expression: 'excited',
    options: [
      { label: 'Take me there', action: 'navigate-to-archive' },
      { label: 'Back to the list', goto: '#archive-browse:0' },
      { label: 'Back', goto: 'archive' },
    ],
  };
}

/** Search results for a free-text query, ranked via matchArchive(). */
export function archiveResultsNode(index: ArchiveEntry[], query: string): DialogueNode {
  if (!query || !query.trim()) {
    return {
      text: "Type a dish or a week and I'll go digging.",
      expression: 'thinking',
      options: [
        { label: 'Search again', goto: 'search' },
        { label: 'Browse all weeks', goto: '#archive-browse:0' },
        { label: 'Back', goto: 'archive' },
      ],
    };
  }

  const hits = matchArchive(index, query);

  if (hits.length === 0) {
    return {
      text: `No weeks with "${query}" in my cookbook. Try another dish?`,
      expression: 'thinking',
      options: [
        { label: 'Search again', goto: 'search' },
        { label: 'Browse all weeks', goto: '#archive-browse:0' },
        { label: 'Back', goto: 'archive' },
      ],
    };
  }

  const shown = hits.slice(0, MAX_RESULTS_SHOWN);
  const options: DialogueOption[] = shown.map((entry) => ({ label: entry.title, goto: `#archive-week:${entry.slug}` }));
  options.push({ label: 'Search again', goto: 'search' });
  options.push({ label: 'Back', goto: 'archive' });

  return {
    text: `Found ${hits.length} week${hits.length === 1 ? '' : 's'} with "${query}":`,
    expression: 'excited',
    options,
  };
}

/**
 * Master resolver for dynamic ('#'-prefixed) node refs. Returns undefined ONLY
 * when ref doesn't start with '#' (i.e. it's a static goto -- caller falls back
 * to getNode()). An unknown ref name, or a ref whose payload can't be resolved,
 * returns the graceful fallbackNode() rather than throwing or returning undefined.
 */
export function resolveDynamicNode(ref: string, ctx: DynamicNodeContext): DialogueNode | undefined {
  if (!ref.startsWith('#')) return undefined;

  const { name, payload } = parseRef(ref);
  const pageSize = ctx.pageSize ?? DEFAULT_PAGE_SIZE;

  switch (name) {
    case 'archive-browse': {
      const parsed = parseInt(payload, 10);
      const page = Number.isNaN(parsed) ? 0 : parsed;
      return archiveBrowseNode(ctx.index, page, pageSize);
    }
    case 'archive-week':
      return archiveWeekNode(ctx.index, payload);
    case 'archive-results':
      return archiveResultsNode(ctx.index, payload);
    default:
      return fallbackNode();
  }
}
