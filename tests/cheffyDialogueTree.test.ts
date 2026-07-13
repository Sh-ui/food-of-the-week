// cheffyDialogueTree.test.ts -- integrity tests over the REAL dialogue tree
// (src/data/cheffy-dialogue.json). Run via `npm test` (node --test tests/).
// Node 23 strips types + supports the JSON import attribute natively.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import dialogue from '../src/data/cheffy-dialogue.json' with { type: 'json' };
import { findDanglingGotos, usedActions, VALID_ACTIONS, type DialogueTree } from '../src/utils/cheffyDialogue.ts';

const tree = dialogue as unknown as DialogueTree;

describe('cheffy-dialogue.json integrity', () => {
  test('no dangling static gotos ("#" dynamic refs are exempt)', () => {
    // The real tree contains a '#archive-browse:0' dynamic goto (in "archive") --
    // this exercises the findDanglingGotos() guard for dynamic refs.
    const hasDynamicGoto = Object.values(tree.nodes).some((n) =>
      n.options.some((o) => o.goto === '#archive-browse:0')
    );
    assert.ok(hasDynamicGoto, 'fixture assumption: tree should contain a #archive-browse:0 goto');
    assert.deepEqual(findDanglingGotos(tree), []);
  });

  test('every used action is a subset of VALID_ACTIONS', () => {
    const used = usedActions(tree);
    for (const action of used) {
      assert.ok((VALID_ACTIONS as readonly string[]).includes(action), `unknown action "${action}"`);
    }
  });

  test('tree.start exists in nodes', () => {
    assert.ok(tree.nodes[tree.start], `start node "${tree.start}" missing from nodes`);
  });

  test('every node has non-empty text and at least one option; every option has a label and exactly one of goto/action', () => {
    for (const [id, node] of Object.entries(tree.nodes)) {
      assert.ok(typeof node.text === 'string' && node.text.trim().length > 0, `node "${id}" has empty text`);
      assert.ok(node.options.length > 0, `node "${id}" has no options`);
      for (const opt of node.options) {
        assert.ok(typeof opt.label === 'string' && opt.label.trim().length > 0, `node "${id}" has an option with empty label`);
        const hasGoto = opt.goto !== undefined;
        const hasAction = opt.action !== undefined;
        assert.notEqual(hasGoto, hasAction, `node "${id}" option "${opt.label}" must have exactly one of goto/action`);
      }
    }
  });

  test('root has an option leading to "notifications" and one to "lunch"', () => {
    const root = tree.nodes.root;
    const gotos = root.options.map((o) => o.goto);
    assert.ok(gotos.includes('notifications'), 'root missing a goto to "notifications"');
    assert.ok(gotos.includes('lunch'), 'root missing a goto to "lunch"');
  });

  test('every node except root is reachable from root via static goto BFS', () => {
    const visited = new Set<string>([tree.start]);
    const queue: string[] = [tree.start];

    while (queue.length > 0) {
      const id = queue.shift()!;
      const node = tree.nodes[id];
      if (!node) continue;
      for (const opt of node.options) {
        if (!opt.goto || opt.goto.startsWith('#')) continue; // '#' dynamic refs are terminal for static BFS
        if (!visited.has(opt.goto)) {
          visited.add(opt.goto);
          queue.push(opt.goto);
        }
      }
    }

    const allIds = Object.keys(tree.nodes);
    const unreached = allIds.filter((id) => !visited.has(id));
    assert.deepEqual(unreached, [], `unreachable nodes from root: ${unreached.join(', ')}`);
  });
});
