import test from "node:test";
import assert from "node:assert/strict";
import { packingHint } from "../public/packing-hints.js";
import { items, canPlace, newPacking, place, remove, undo, isPacked } from "../public/packing-model.js";

const solution = [["sandwiches",0,0,0],["flask",3,0,0],["blanket",1,0,0],["utensils",0,2,0],["apples",2,3,0]];

function finishWithHints(initial) {
  let state = initial;
  for (let step = 0; step < 5 && !isPacked(state); step++) {
    const before = JSON.stringify(state), hint = packingHint(state);
    assert.equal(JSON.stringify(state), before);
    assert.equal(hint.kind, "placement");
    assert.ok(!Object.hasOwn(state.placements, hint.id));
    assert.ok(canPlace(state.placements, hint.id, hint.x, hint.y, hint.turns));
    state = place(state, hint.id, hint.x, hint.y, hint.turns);
    for (const [id, position] of Object.entries(initial.placements)) assert.deepEqual(state.placements[id], position);
  }
  assert.ok(isPacked(state));
  assert.deepEqual(packingHint(state), { kind: "complete" });
  return state;
}

test("successive hints finish the empty bag without adding implicit moves", () => {
  const initial = newPacking(), final = finishWithHints(initial);
  assert.equal(final.history.length, 5);
  let state = final;
  for (let i = 0; i < 5; i++) state = undo(state);
  assert.deepEqual(state, initial);
});

test("all 32 subsets of a known solution can finish without moving their packed pieces", () => {
  for (let subset = 0; subset < 32; subset++) {
    let state = newPacking();
    solution.forEach((args, index) => { if (subset & (1 << index)) state = place(state, ...args); });
    finishWithHints(state);
  }
});

// Independent, fixed-order coordinate search: no masks, MRV or failed-state memo.
function hasCompletion(placements) {
  const id = Object.keys(items).find(id => !Object.hasOwn(placements, id));
  if (!id) return isPacked({ placements });
  for (let turns = 0; turns < 4; turns++) for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    if (canPlace(placements, id, x, y, turns) && hasCompletion({ ...placements, [id]: { x, y, turns } })) return true;
  }
  return false;
}

test("every legal single-piece position agrees with an independent full-solution search", () => {
  for (const id of Object.keys(items)) for (let turns = 0; turns < 4; turns++) {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      if (!canPlace({}, id, x, y, turns)) continue;
      const state = place(newPacking(), id, x, y, turns), hint = packingHint(state);
      assert.equal(hint.kind === "placement", hasCompletion(state.placements), `${id} ${x},${y} rotation ${turns}`);
      if (hint.kind === "placement") finishWithHints(state);
    }
  }
});

test("a legal dead end is reported honestly and becomes hintable after remove or undo", () => {
  const state = place(newPacking(), "flask", 2, 0, 0), before = JSON.stringify(state);
  assert.ok(canPlace({}, "flask", 2, 0, 0));
  assert.deepEqual(packingHint(state), { kind: "blocked" });
  assert.equal(JSON.stringify(state), before);
  assert.equal(packingHint(remove(state, "flask")).kind, "placement");
  assert.equal(packingHint(undo(state)).kind, "placement");
});

test("hints accept frozen input, are deterministic and cannot be poisoned through returned data", () => {
  const state = { placements: Object.freeze({ sandwiches: Object.freeze({x:0,y:0,turns:0}) }), history: Object.freeze([]) };
  Object.freeze(state);
  const expected = packingHint(state), other = packingHint(state);
  assert.deepEqual(other, expected);other.x = 99;other.id = "missing";
  assert.deepEqual(packingHint(state), expected);
  assert.equal(state.history.length, 0);
});

test("malformed, overlapping and out-of-bounds arrangements never produce hints", () => {
  const bad = [null, {}, { placements: [] }, { placements: { missing: {x:0,y:0,turns:0} } },
    { placements: { apples: null } }, { placements: { apples: {x:NaN,y:0,turns:0} } },
    { placements: { apples: {x:0,y:0,turns:"0"} } }, { placements: { apples: {x:3,y:0,turns:0} } },
    { placements: { sandwiches: {x:0,y:0,turns:0}, apples: {x:0,y:0,turns:0} } },
    { placements: JSON.parse('{"__proto__":{"x":0,"y":0,"turns":0}}') }];
  for (const state of bad) assert.deepEqual(packingHint(state), { kind: "invalid" });
});
