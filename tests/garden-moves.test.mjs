import test from "node:test";
import assert from "node:assert/strict";
import { selectMove } from "../public/garden-moves.js";

const garden = () => [{ type: "daisy", stage: 2 }, { type: "mint", stage: 1 }, ...Array(7).fill(null)];
test("selecting a plant does not change the garden", () => {
  const plots = garden();
  const move = selectMove(plots, null, 0);
  assert.equal(move.selected, 0);
  assert.equal(move.plots, plots);
  assert.equal(move.outcome, "selected");
});
test("empty plots cannot be selected as a source", () => {
  const plots = garden();
  assert.deepEqual(selectMove(plots, null, 2), { plots, selected: null, outcome: "empty" });
});
test("moving into an empty plot preserves the full plant record", () => {
  const plots = garden();
  const move = selectMove(plots, 0, 8);
  assert.equal(move.outcome, "moved");
  assert.equal(move.plots[8], plots[0]);
  assert.equal(move.plots[0], null);
  assert.equal(move.plots[1], plots[1]);
  assert.deepEqual(plots, garden());
  assert.equal(move.selected, null);
});
test("swapping occupied plots preserves both plants and their stages", () => {
  const plots = garden();
  const move = selectMove(plots, 0, 1);
  assert.equal(move.outcome, "swapped");
  assert.equal(move.plots[0], plots[1]);
  assert.equal(move.plots[1], plots[0]);
  assert.deepEqual(plots, garden());
});
test("selecting the source again cancels without changing a save", () => {
  const plots = garden();
  assert.deepEqual(selectMove(plots, 0, 0), { plots, selected: null, outcome: "cancelled" });
});
test("a moved garden round-trips through the existing save format", () => {
  const moved = selectMove(garden(), 0, 1).plots;
  assert.deepEqual(JSON.parse(JSON.stringify(moved)), moved);
  assert.equal(moved.length, 9);
  assert.equal(moved.filter(Boolean).length, 2);
});
test("every source/destination pair conserves all plant records", () => {
  const plots = Array.from({ length: 9 }, (_, index) => ({ type: ["daisy", "mint", "lavender"][index % 3], stage: index % 3 }));
  const original = JSON.stringify(plots);
  for (let source = 0; source < 9; source++) for (let target = 0; target < 9; target++) {
    const move = selectMove(plots, source, target);
    assert.equal(move.plots.length, 9);
    for (const plant of plots) assert.equal(move.plots.filter((item) => item === plant).length, 1);
    assert.equal(JSON.stringify(plots), original);
  }
});
test("invalid coordinates and stale empty sources cannot remove plants", () => {
  const plots = garden();
  for (const target of [-1, 9, 1.5, "1"]) assert.throws(() => selectMove(plots, 0, target), RangeError);
  assert.throws(() => selectMove([], null, 0), RangeError);
  assert.equal(selectMove(plots, 2, 0).plots, plots);
});
