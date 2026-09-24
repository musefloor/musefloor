import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bagSize, items, shape, occupied, canPlace, newPacking, place, remove, undo, isPacked } from "../public/packing-model.js";

const solution = [["sandwiches",0,0,0],["flask",3,0,0],["blanket",1,0,0],["utensils",0,2,0],["apples",2,3,0]];

test("five objects cover exactly the sixteen bag spaces", () => {
  assert.equal(Object.keys(items).length,5);
  assert.equal(Object.values(items).reduce((sum,item) => sum+item.cells.length,0),bagSize**2);
});

test("rotations retain area, return fresh cells, and normalize to the top-left", () => {
  for (const id of Object.keys(items)) {
    for (let turns=-4;turns<=8;turns++) {
      const cells=shape(id,turns);
      assert.equal(new Set(cells.map(([x,y])=>`${x},${y}`)).size,items[id].cells.length);
      assert.equal(Math.min(...cells.map(([x])=>x)),0);
      assert.equal(Math.min(...cells.map(([,y])=>y)),0);
      assert.deepEqual(cells,shape(id,turns+4));
    }
    const cells=shape(id);cells[0][0]=99;
    assert.notEqual(shape(id)[0][0],99);
  }
});

test("a known arrangement solves the puzzle without overlaps", () => {
  let state=newPacking();
  for (const [index,args] of solution.entries()) {
    assert.ok(canPlace(state.placements,...args));
    state=place(state,...args);
    assert.equal(isPacked(state),index===solution.length-1);
  }
  assert.equal(occupied(state.placements).size,16);
  assert.equal(state.history.length,5);
});

test("overlaps, out-of-bounds positions, unknown items, and invalid numbers do nothing", () => {
  const state=place(newPacking(),"sandwiches",0,0);
  for (const args of [["apples",0,0,0],["flask",0,3,0],["sandwiches",3,3,0],
    ["apples",-1,0,0],["apples",0,0.5,0],["apples",NaN,0,0],["apples",0,0,Infinity],
    ["__proto__",0,0,0],["missing",0,0,0]]) {
    assert.equal(canPlace(state.placements,...args),false);
    assert.strictEqual(place(state,...args),state);
  }
});

test("repositioning ignores only the moving object's old cells", () => {
  const first=place(newPacking(),"sandwiches",0,0);
  const moved=place(first,"sandwiches",1,0);
  assert.deepEqual(first.placements.sandwiches,{x:0,y:0,turns:0});
  assert.deepEqual(moved.placements.sandwiches,{x:1,y:0,turns:0});
  assert.equal(occupied(moved.placements).size,4);
  assert.strictEqual(place(moved,"sandwiches",1,0),moved);
});

test("remove and undo restore the exact preceding arrangement", () => {
  let state=newPacking();
  for (const args of solution) state=place(state,...args);
  const removed=remove(state,"blanket");
  assert.equal(isPacked(removed),false);
  assert.equal(Object.keys(removed.placements).length,4);
  assert.deepEqual(undo(removed),state);
  for (let i=0;i<solution.length;i++) state=undo(state);
  assert.deepEqual(state,newPacking());
  assert.strictEqual(undo(state),state);
  assert.strictEqual(remove(state,"missing"),state);
});

test("all accepted positions and rotations stay inside the bag", () => {
  for (const id of Object.keys(items)) for(let turns=0;turns<4;turns++) {
    for(let x=-1;x<=4;x++) for(let y=-1;y<=4;y++) {
      if (!canPlace({},id,x,y,turns)) continue;
      const state=place(newPacking(),id,x,y,turns);
      for(const key of occupied(state.placements).keys()) {
        const [cx,cy]=key.split(",").map(Number);
        assert.ok(cx>=0&&cx<4&&cy>=0&&cy<4);
      }
    }
  }
});

test("undo storage stays bounded during repeated experimentation", () => {
  let state=newPacking();
  for(let i=0;i<250;i++) state=place(state,"apples",i%2,0);
  assert.equal(state.history.length,100);
});

test("the sketch exposes accessible native controls without persistence or network calls", () => {
  const html=readFileSync(new URL("../public/packing.html",import.meta.url),"utf8");
  const js=readFileSync(new URL("../public/packing.js",import.meta.url),"utf8");
  assert.match(html,/Puzzle sketch/);
  assert.match(html,/id="undo"/);
  assert.match(html,/aria-live="polite"/);
  assert.match(html,/Progress isn’t saved/);
  assert.match(js,/ArrowRight/);
  assert.match(js,/event\.key\.toLowerCase\(\) === "r"/);
  assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\(|Math\.random/);
});
