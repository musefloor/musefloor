import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setupGardenView } from "../public/packing-scene.js";
import { gardenArt } from "../public/garden-art.js";

function fixture(missing) {
  const listeners = new Map();
  let html = "", writes = 0;
  const control = { hidden: true };
  const toggle = { checked: true, addEventListener: (event, listener) => listeners.set(event, listener) };
  const scene = { hidden: true };
  const view = { get innerHTML() { return html; }, set innerHTML(value) { html = value; writes++; } };
  const nodes = new Map([["#scene-control",control],["#scene-toggle",toggle],["#garden-scene",scene],["#window-garden",view]]);
  const root = { querySelector(selector) {
    assert.ok(nodes.has(selector), "decoration must not query puzzle controls or state");
    return selector === missing ? null : nodes.get(selector);
  } };
  return { root, control, toggle, scene, view, listeners, writes: () => writes };
}

test("garden view starts plain and clears a restored checkbox value", () => {
  const f=fixture();
  assert.equal(setupGardenView(f.root),true);
  assert.equal(f.control.hidden,false);
  assert.equal(f.toggle.checked,false);
  assert.equal(f.scene.hidden,true);
  assert.equal(f.writes(),0);
  assert.deepEqual([...f.listeners.keys()],["change"]);
});

test("enabling the view reuses the exact existing garden illustration", () => {
  const f=fixture();setupGardenView(f.root);
  f.toggle.checked=true;f.listeners.get("change")();
  assert.equal(f.scene.hidden,false);
  assert.equal(f.view.innerHTML,gardenArt());
  assert.equal(f.writes(),1);
});

test("repeated comparisons hide decoration without rebuilding or touching puzzle nodes", () => {
  const f=fixture();setupGardenView(f.root);
  for(let i=0;i<20;i++) {
    f.toggle.checked=true;f.listeners.get("change")();
    assert.equal(f.scene.hidden,false);
    f.toggle.checked=false;f.listeners.get("change")();
    assert.equal(f.scene.hidden,true);
  }
  assert.equal(f.writes(),1);
});

test("a missing decoration node leaves the comparison control unavailable", () => {
  for(const missing of ["#scene-control","#scene-toggle","#garden-scene","#window-garden"]) {
    const f=fixture(missing);
    assert.equal(setupGardenView(f.root),false);
    assert.equal(f.control.hidden,true);
    assert.equal(f.listeners.size,0);
  }
});

test("the view uses a native labelled checkbox and noninteractive hidden decoration", () => {
  const html=readFileSync(new URL("../public/packing.html",import.meta.url),"utf8");
  const css=readFileSync(new URL("../public/packing.css",import.meta.url),"utf8");
  const js=readFileSync(new URL("../public/packing-scene.js",import.meta.url),"utf8");
  assert.match(html,/<label[^>]+id="scene-control"[^>]+hidden><input type="checkbox"[^>]+id="scene-toggle"[^>]+aria-controls="garden-scene"[^>]*\/>Garden view<\/label>/);
  assert.match(html,/id="garden-scene" aria-hidden="true" hidden/);
  assert.match(html,/type="module" src="packing-scene.js"/);
  assert.match(css,/\.garden-scene\{[^}]*pointer-events:none/);
  assert.match(css,/\.scene-control input:focus-visible/);
  assert.doesNotMatch(js,/packing-model|localStorage|sessionStorage|fetch\(|setTimeout|setInterval/);
});
