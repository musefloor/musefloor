import test from "node:test";
import assert from "node:assert/strict";
import { copyGarden, rememberGarden, undoGarden, historyLimit } from "../public/garden-history.js";

const empty = () => Array(9).fill(null);

test("history snapshots and restored plants never share mutable growth records", () => {
  const before = empty(); before[0] = { type: "mint", stage: 1 };
  const after = copyGarden(before); after[0].stage = 2;
  const history = rememberGarden([], before, after);
  before[0].stage = 0; after[0].type = "daisy";
  assert.deepEqual(history[0][0], { type: "mint", stage: 1 });
  const restored = undoGarden(after, history);
  restored.plots[0].stage = 2;
  assert.equal(history[0][0].stage, 1);
  assert.deepEqual(restored.history, []);
});

test("unchanged gardens do not consume an undo step", () => {
  const before = empty(); before[2] = { type: "daisy", stage: 2 };
  const history = [empty()];
  assert.equal(rememberGarden(history, before, copyGarden(before)), history);
  const result = undoGarden(before, []);
  assert.equal(result.changed, false);
  assert.equal(result.plots, before);
});

test("history retains exactly the most recent 20 real changes", () => {
  let plots = empty(), history = [];
  for (let i = 0; i < 25; i++) {
    const next = copyGarden(plots);
    next[0] = i % 2 ? null : { type: "lavender", stage: 0 };
    history = rememberGarden(history, plots, next); plots = next;
  }
  assert.equal(history.length, historyLimit);
  let steps = 0;
  while (history.length) { ({ plots, history } = undoGarden(plots, history)); steps++; }
  assert.equal(steps, 20);
  assert.deepEqual(plots[0], { type: "lavender", stage: 0 }, "oldest retained state is after change 5");
});
