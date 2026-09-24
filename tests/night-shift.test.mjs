import test from "node:test";
import assert from "node:assert/strict";
import { routes, ports, neighbor, traceRoute, newShift, rotateTile, undoTurn, resetRoute, dispatchParcel, finishDispatch, nextParcel, moveFocus, historyLimit } from "../public/night-shift-model.js";

function solve(state) {
  for (let i = 0; i < 16; i++) while (state.board[i].rotation !== routes[state.level].solution[i].rotation) state = rotateTile(state, i);
  return state;
}

test("Night Shift has three unsolved authored boards with valid distinct deliveries", () => {
  assert.equal(routes.length, 3); assert.equal(new Set(routes.map(route => route.id)).size, 3);
  assert.deepEqual(routes.map(route => traceRoute(route.solution, route).path.length), [5, 9, 13]);
  for (const route of routes) {
    assert.equal(route.tiles.length, 16); assert.notEqual(traceRoute(route.tiles, route).outcome, "delivered");
    assert.equal(traceRoute(route.solution, route).outcome, "delivered");
    assert.equal(neighbor(route.source.cell, route.source.side), null); assert.equal(neighbor(route.target.cell, route.target.side), null);
    assert.ok(Object.isFrozen(route)); assert.ok(route.tiles.every(Object.isFrozen));
  }
});

test("neighbor boundaries never wrap from one row to another", () => {
  assert.equal(neighbor(3, 1), null); assert.equal(neighbor(4, 3), null);
  assert.equal(neighbor(0, 0), null); assert.equal(neighbor(15, 2), null);
  assert.equal(neighbor(5, 1), 6); assert.equal(neighbor(5, 0), 1);
  for (const cell of [-1, 16, 0.5, NaN]) assert.equal(neighbor(cell, 1), null);
  assert.equal(neighbor(2, 4), null);
});

test("track ports rotate without changing piece kind and reject invalid pieces", () => {
  assert.deepEqual(ports({ kind: "bend", rotation: 3 }), [3, 0]);
  assert.deepEqual(ports({ kind: "straight", rotation: 1 }), [1, 3]);
  for (const tile of [null, {}, { kind: "x", rotation: 0 }, { kind: "bend", rotation: 4 }]) assert.deepEqual(ports(tile), []);
});

test("loose ends, wrong exits and loops have bounded honest traces", () => {
  assert.equal(traceRoute(routes[0].tiles, routes[0]).outcome, "loose-end");
  const board = Array.from({ length: 16 }, () => ({ kind: "straight", rotation: 1 }));
  const wrong = traceRoute(board, routes[0]); assert.equal(wrong.outcome, "wrong-exit"); assert.equal(wrong.path.at(-1).cell, 7);
  board[0] = { kind: "bend", rotation: 1 }; board[1] = { kind: "bend", rotation: 2 };
  board[5] = { kind: "bend", rotation: 3 }; board[4] = { kind: "bend", rotation: 0 };
  const loop = traceRoute(board, { source: { cell: 0, side: 2 }, target: { cell: 15, side: 1 } });
  assert.equal(loop.outcome, "loop"); assert.equal(loop.path.length, 4);
  for (const invalid of [null, [], Array(15)]) assert.equal(traceRoute(invalid, routes[0]).outcome, "invalid");
  assert.equal(traceRoute(board, { source: { cell: 50, side: 0 } }).outcome, "invalid");
});

test("many possible boards terminate without invalid cell references", () => {
  let seed = 42;
  for (let n = 0; n < 500; n++) {
    const board = Array.from({ length: 16 }, () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return { kind: seed % 5 ? "bend" : "straight", rotation: (seed >>> 8) % 4 }; });
    const result = traceRoute(board, routes[n % 3]);
    assert.ok(["loose-end", "wrong-exit", "loop", "delivered"].includes(result.outcome));
    assert.ok(result.path.length <= 64); assert.ok(result.path.every(step => step.cell >= 0 && step.cell < 16));
  }
});

test("rotations are immutable, undoable, and history is bounded", () => {
  const start = newShift(), before = structuredClone(start);
  let next = rotateTile(start, 5); assert.deepEqual(start, before); assert.equal(next.turns, 1);
  assert.deepEqual(undoTurn(next).board, start.board); assert.equal(undoTurn(next).turns, 0);
  for (let i = 0; i < 80; i++) next = rotateTile(next, 1);
  assert.equal(next.history.length, historyLimit);
  for (const index of [-1, 16, 0.2, NaN]) assert.strictEqual(rotateTile(start, index), start);
  assert.strictEqual(undoTurn(start), start);
});

test("reset can be undone and does not erase actual dispatch counts", () => {
  let state = finishDispatch(dispatchParcel(newShift())); assert.equal(state.attempts, 1);
  state = rotateTile(state, 2); const board = state.board;
  const reset = resetRoute(state); assert.deepEqual(reset.board, routes[0].tiles); assert.equal(reset.turns, 0); assert.equal(reset.attempts, 1);
  assert.deepEqual(undoTurn(reset).board, board); assert.equal(undoTurn(reset).turns, 1);
  assert.strictEqual(resetRoute(newShift()).status, "sorting");
});

test("dispatch is explicit and cannot deliver or mutate a parcel twice", () => {
  const sorted = solve(newShift()), moving = dispatchParcel(sorted);
  assert.equal(moving.status, "moving"); assert.equal(moving.deliveries.length, 0); assert.equal(moving.attempts, 1);
  assert.strictEqual(dispatchParcel(moving), moving); assert.strictEqual(rotateTile(moving, 0), moving);
  assert.strictEqual(undoTurn(moving), moving); assert.strictEqual(resetRoute(moving), moving); assert.strictEqual(nextParcel(moving), moving);
  const delivered = finishDispatch(moving); assert.equal(delivered.status, "delivered"); assert.equal(delivered.deliveries.length, 1);
  assert.strictEqual(finishDispatch(delivered), delivered); assert.strictEqual(dispatchParcel(delivered), delivered);
  assert.strictEqual(rotateTile(delivered, 0), delivered);
});

test("a failed dispatch retains progress without making a delivery", () => {
  const state = finishDispatch(dispatchParcel(newShift()));
  assert.equal(state.status, "sorting"); assert.equal(state.attempts, 1); assert.equal(state.deliveries.length, 0);
  assert.deepEqual(state.board, routes[0].tiles); assert.ok(state.run.path.length);
  assert.strictEqual(nextParcel(state), state); assert.equal(rotateTile(state, 0).run, null);
});

test("all three deliveries complete a shift and replay is a fresh independent state", () => {
  let state = newShift();
  for (let level = 0; level < 3; level++) {
    assert.equal(state.level, level); state = finishDispatch(dispatchParcel(solve(state)));
    assert.equal(state.deliveries.length, level + 1);
    if (level < 2) state = nextParcel(state);
  }
  assert.equal(state.status, "complete"); assert.deepEqual(state.deliveries.map(item => item.id), ["A", "B", "C"]);
  assert.ok(state.deliveries.every(item => item.attempts === 1)); assert.strictEqual(nextParcel(state), state);
  assert.equal(newShift().deliveries.length, 0); assert.equal(state.deliveries.length, 3);
});

test("keyboard focus stays in the board with row-aware Home and End", () => {
  assert.equal(moveFocus(3, "ArrowRight"), 3); assert.equal(moveFocus(4, "ArrowLeft"), 4);
  assert.equal(moveFocus(5, "ArrowDown"), 9); assert.equal(moveFocus(5, "Home"), 4); assert.equal(moveFocus(5, "End"), 7);
  assert.equal(moveFocus(5, "x"), 5); assert.equal(moveFocus(-1, "ArrowUp"), 0);
});
