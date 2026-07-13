// cheffyDialogueDynamic.test.ts -- coverage for the '#'-prefixed dynamic dialogue
// nodes (archive browse/week/results) added to cheffyDialogue.ts.
// Run via `npm test` (node --test tests/). Node 23 strips types natively.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  archiveBrowseNode,
  archiveWeekNode,
  archiveResultsNode,
  resolveDynamicNode,
  matchArchive,
  type ArchiveEntry,
  type DialogueNode,
} from '../src/utils/cheffyDialogue.ts';

// Fixture: 12 fake archive weeks, newest-first (as the real build-time index is).
const INDEX: ArchiveEntry[] = [
  { slug: 'week-12', title: 'Week 12: Taco Fiesta', meals: ['Tacos', 'Enchiladas', 'Quesadillas'] },
  {
    slug: 'week-11',
    title: 'Week 11: Pasta Night',
    meals: ['Spaghetti', 'Lasagna', 'Fettuccine', 'Ravioli', 'Penne', 'Rigatoni', 'Gnocchi'],
  },
  { slug: 'week-10', title: 'Week 10: Curry Week', meals: ['Chicken Curry', 'Tofu Curry'] },
  { slug: 'week-09', title: 'Week 09: Grill Out', meals: ['Burgers', 'Hot Dogs'] },
  { slug: 'week-08', title: 'Week 08: Soup Season', meals: ['Tomato Soup', 'Minestrone'] },
  { slug: 'week-07', title: 'Week 07: Taco Tuesday Returns', meals: ['Tacos', 'Nachos'] },
  { slug: 'week-06', title: 'Week 06: Stir Fry', meals: ['Veggie Stir Fry', 'Beef Stir Fry'] },
  { slug: 'week-05', title: 'Week 05: Breakfast for Dinner', meals: ['Pancakes', 'Waffles'] },
  { slug: 'week-04', title: 'Week 04: Pizza Party', meals: ['Pepperoni Pizza', 'Veggie Pizza'] },
  { slug: 'week-03', title: 'Week 03: Sandwich Week', meals: ['Club Sandwich', 'Taco Sandwich'] },
  { slug: 'week-02', title: 'Week 02: Salad Days', meals: ['Cobb Salad', 'Caesar Salad'] },
  { slug: 'week-01', title: 'Week 01: The Beginning', meals: ['Chili', 'Cornbread'] },
];

const STATIC_IDS = new Set(['archive', 'search', 'root']);

function assertGotosAreValid(node: DialogueNode) {
  for (const opt of node.options) {
    if (opt.goto) {
      assert.ok(
        opt.goto.startsWith('#') || STATIC_IDS.has(opt.goto),
        `unexpected goto "${opt.goto}" -- must be '#'-dynamic or a known static id`
      );
    }
  }
}

describe('archiveBrowseNode', () => {
  test('page 0 -> pageSize entries + Older + Back, no Newer', () => {
    const node = archiveBrowseNode(INDEX, 0);
    assert.equal(node.text, "Here's what we've been cooking. Pick a week to peek at it.");
    assert.equal(node.expression, 'happy');
    assert.equal(node.options.length, 5 + 1 + 1); // 5 entries + Older + Back
    assert.deepEqual(
      node.options.slice(0, 5).map((o) => o.goto),
      ['#archive-week:week-12', '#archive-week:week-11', '#archive-week:week-10', '#archive-week:week-09', '#archive-week:week-08']
    );
    const labels = node.options.map((o) => o.label);
    assert.ok(labels.includes('Older weeks'));
    assert.ok(!labels.includes('Newer weeks'));
    assert.equal(node.options.at(-1)?.label, 'Back');
    assert.equal(node.options.at(-1)?.goto, 'archive');
    assertGotosAreValid(node);
  });

  test('middle page has both Older and Newer', () => {
    const node = archiveBrowseNode(INDEX, 1);
    assert.equal(node.text, 'Going further back...');
    const labels = node.options.map((o) => o.label);
    assert.ok(labels.includes('Older weeks'));
    assert.ok(labels.includes('Newer weeks'));
    // entries: indices 5-9 (week-07..week-03)
    assert.deepEqual(
      node.options.slice(0, 5).map((o) => o.goto),
      ['#archive-week:week-07', '#archive-week:week-06', '#archive-week:week-05', '#archive-week:week-04', '#archive-week:week-03']
    );
    const olderGoto = node.options.find((o) => o.label === 'Older weeks')?.goto;
    const newerGoto = node.options.find((o) => o.label === 'Newer weeks')?.goto;
    assert.equal(olderGoto, '#archive-browse:2');
    assert.equal(newerGoto, '#archive-browse:0');
    assertGotosAreValid(node);
  });

  test('last page clamps naturally and has Newer, no Older', () => {
    const node = archiveBrowseNode(INDEX, 2);
    // indices 10-11 (week-02, week-01) -- only 2 entries left
    assert.deepEqual(
      node.options.filter((o) => o.goto?.startsWith('#archive-week:')).map((o) => o.goto),
      ['#archive-week:week-02', '#archive-week:week-01']
    );
    const labels = node.options.map((o) => o.label);
    assert.ok(!labels.includes('Older weeks'));
    assert.ok(labels.includes('Newer weeks'));
    assertGotosAreValid(node);
  });

  test('out-of-range page clamps to last valid page', () => {
    const clamped = archiveBrowseNode(INDEX, 99);
    const last = archiveBrowseNode(INDEX, 2);
    assert.deepEqual(clamped, last);

    const clampedLow = archiveBrowseNode(INDEX, -5);
    const first = archiveBrowseNode(INDEX, 0);
    assert.deepEqual(clampedLow, first);
  });

  test('empty index -> "week one" node with just Back', () => {
    const node = archiveBrowseNode([], 0);
    assert.equal(node.text, 'No archived weeks yet - this is week one!');
    assert.equal(node.expression, 'surprised');
    assert.equal(node.options.length, 1);
    assert.equal(node.options[0].label, 'Back');
    assert.equal(node.options[0].goto, 'archive');
  });
});

describe('archiveWeekNode', () => {
  test('found, meals under cap -> full meal list, options in order', () => {
    const node = archiveWeekNode(INDEX, 'week-12');
    assert.equal(node.text, 'Week 12: Taco Fiesta\nThat week we made: Tacos, Enchiladas, Quesadillas.');
    assert.equal(node.expression, 'excited');
    assert.deepEqual(node.options, [
      { label: 'Take me there', action: 'navigate-to-archive' },
      { label: 'Back to the list', goto: '#archive-browse:0' },
      { label: 'Back', goto: 'archive' },
    ]);
    assertGotosAreValid(node);
  });

  test('>6 meals caps at 6 with ", and more"', () => {
    const node = archiveWeekNode(INDEX, 'week-11');
    assert.equal(
      node.text,
      'Week 11: Pasta Night\nThat week we made: Spaghetti, Lasagna, Fettuccine, Ravioli, Penne, Rigatoni, and more.'
    );
  });

  test('unknown slug -> graceful fallback node', () => {
    const node = archiveWeekNode(INDEX, 'does-not-exist');
    assert.equal(node.text, 'Hmm, I lost that page of my cookbook.');
    assert.equal(node.expression, 'surprised');
    assert.deepEqual(node.options, [{ label: 'Back', goto: 'archive' }]);
  });
});

describe('archiveResultsNode', () => {
  test('ranking comes from matchArchive (title hits first)', () => {
    const node = archiveResultsNode(INDEX, 'taco');
    const expectedHits = matchArchive(INDEX, 'taco');
    assert.equal(expectedHits.length, 3); // week-12, week-07 (title), week-03 (meal)
    assert.equal(node.text, 'Found 3 weeks with "taco":');
    assert.equal(node.expression, 'excited');
    assert.deepEqual(
      node.options.slice(0, 3).map((o) => o.goto),
      expectedHits.map((e) => `#archive-week:${e.slug}`)
    );
    assert.equal(node.options.at(-2)?.label, 'Search again');
    assert.equal(node.options.at(-2)?.goto, 'search');
    assert.equal(node.options.at(-1)?.label, 'Back');
    assert.equal(node.options.at(-1)?.goto, 'archive');
    assertGotosAreValid(node);
  });

  test('singular "week" wording for exactly one hit', () => {
    const node = archiveResultsNode(INDEX, 'curry');
    assert.equal(node.text, 'Found 1 week with "curry":');
  });

  test('>6 hits capped at 6', () => {
    // every title contains "Week" -- matches all 12 entries.
    const node = archiveResultsNode(INDEX, 'week');
    const expectedHits = matchArchive(INDEX, 'week');
    assert.equal(expectedHits.length, 12);
    const resultOptions = node.options.filter((o) => o.goto?.startsWith('#archive-week:'));
    assert.equal(resultOptions.length, 6);
    assert.deepEqual(
      resultOptions.map((o) => o.goto),
      expectedHits.slice(0, 6).map((e) => `#archive-week:${e.slug}`)
    );
    assert.equal(node.options.length, 6 + 2); // + Search again + Back
    assertGotosAreValid(node);
  });

  test('zero hits -> "try another dish" node', () => {
    const node = archiveResultsNode(INDEX, 'sushi');
    assert.equal(node.text, 'No weeks with "sushi" in my cookbook. Try another dish?');
    assert.equal(node.expression, 'thinking');
    assert.deepEqual(node.options, [
      { label: 'Search again', goto: 'search' },
      { label: 'Browse all weeks', goto: '#archive-browse:0' },
      { label: 'Back', goto: 'archive' },
    ]);
    assertGotosAreValid(node);
  });

  test('empty/whitespace query -> prompt node (distinct text, same options)', () => {
    const empty = archiveResultsNode(INDEX, '');
    const whitespace = archiveResultsNode(INDEX, '   ');
    assert.equal(empty.text, "Type a dish or a week and I'll go digging.");
    assert.deepEqual(empty, whitespace);
    assert.deepEqual(empty.options, [
      { label: 'Search again', goto: 'search' },
      { label: 'Browse all weeks', goto: '#archive-browse:0' },
      { label: 'Back', goto: 'archive' },
    ]);
  });
});

describe('resolveDynamicNode', () => {
  test('routes #archive-browse', () => {
    assert.deepEqual(resolveDynamicNode('#archive-browse:1', { index: INDEX }), archiveBrowseNode(INDEX, 1));
  });

  test('routes #archive-week', () => {
    assert.deepEqual(resolveDynamicNode('#archive-week:week-10', { index: INDEX }), archiveWeekNode(INDEX, 'week-10'));
  });

  test('routes #archive-results (payload = everything after first colon)', () => {
    assert.deepEqual(resolveDynamicNode('#archive-results:taco', { index: INDEX }), archiveResultsNode(INDEX, 'taco'));
  });

  test('unknown ref name -> graceful fallback', () => {
    const node = resolveDynamicNode('#bogus:x', { index: INDEX });
    assert.equal(node?.text, 'Hmm, I lost that page of my cookbook.');
    assert.equal(node?.expression, 'surprised');
    assert.deepEqual(node?.options, [{ label: 'Back', goto: 'archive' }]);
  });

  test('static ref (no leading #) -> undefined', () => {
    assert.equal(resolveDynamicNode('root', { index: INDEX }), undefined);
    assert.equal(resolveDynamicNode('archive', { index: INDEX }), undefined);
    assert.equal(resolveDynamicNode('search', { index: INDEX }), undefined);
  });

  test('every goto in every produced node is dynamic or a known static id', () => {
    const nodes: DialogueNode[] = [
      archiveBrowseNode(INDEX, 0),
      archiveBrowseNode(INDEX, 1),
      archiveBrowseNode(INDEX, 2),
      archiveBrowseNode([], 0),
      archiveWeekNode(INDEX, 'week-12'),
      archiveWeekNode(INDEX, 'week-11'),
      archiveWeekNode(INDEX, 'nope'),
      archiveResultsNode(INDEX, 'taco'),
      archiveResultsNode(INDEX, 'week'),
      archiveResultsNode(INDEX, 'sushi'),
      archiveResultsNode(INDEX, ''),
      resolveDynamicNode('#bogus:x', { index: INDEX })!,
    ];
    for (const node of nodes) assertGotosAreValid(node);
  });
});
