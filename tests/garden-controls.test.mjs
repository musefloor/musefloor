import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setupGarden } from "../public/garden.js";

function memoryStorage(value = null) {
  return { value, writes: 0, getItem() { return this.value; }, setItem(key, value) {
    assert.equal(key, "muse.pocket-garden.v1"); this.value = value; this.writes++;
  } };
}

// Controller fixture only; native keyboard activation and layout are browser checks.
function fixture(storage = memoryStorage(), access = () => storage) {
  const root = { activeElement: null };
  function node(attributes = {}) {
    const classes = new Set();
    return {
      attributes, listeners: new Map(), children: [], textContent: "", disabled: false,
      dataset: Object.fromEntries(Object.entries(attributes).filter(([key]) => key.startsWith("data-")).map(([key,value]) => [key.slice(5),value])),
      classList: { add(name) { classes.add(name); }, toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); } },
      setAttribute(key, value) { attributes[key] = value; },
      addEventListener(type, listener) { this.listeners.set(type, [...(this.listeners.get(type) || []), listener]); },
      focus() { if (!this.disabled) root.activeElement = this; },
      closest(selector) { return selector === "[data-plot]" && this.dataset.plot !== undefined ? this : null; },
      querySelector(selector) { const index = selector.match(/data-plot="(\d+)"/)[1]; return this.children.find(child => child.dataset.plot === index); },
      showModal() { this.open = true; },
      set innerHTML(value) {
        this.children = [...value.matchAll(/<button\b([^>]*)>/g)].map(([,attrs]) => node(Object.fromEntries(
          [...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map(([,key,value]) => [key,value]))));
      },
    };
  }
  const ids = ["plot-grid", "garden-status", "save-note", "reset-dialog", "undo", "seed-tray", "compact-tool", "bloom-count", "surprise", "reset"];
  const nodes = Object.fromEntries(ids.map(id => [id, node()]));
  const tools = ["water", "move", "clear"].map(tool => node({ "data-tool": tool }));
  root.querySelector = selector => nodes[selector.slice(1)];
  root.querySelectorAll = () => [...nodes["seed-tray"].children, ...tools];
  root.listeners = new Map(); root.addEventListener = nodes.undo.addEventListener;
  const fire = (target, type, event = {}) => {
    for (const listener of target.listeners.get(type) || []) listener({ target, preventDefault() {}, ...event });
  };
  const click = target => { if (!target.disabled) { target.focus(); fire(target, "click"); } };
  setupGarden(root, access);
  return {
    root, nodes, storage,
    tool(name) { click(root.querySelectorAll().find(button => button.dataset.tool === name)); },
    plot(index) { const target = nodes["plot-grid"].children[index]; target.focus(); fire(nodes["plot-grid"], "click", { target }); },
    click(id) { click(nodes[id]); },
    escape() { fire(root, "keydown", { key: "Escape" }); },
    board() { return nodes["plot-grid"].children.map(plot => plot.attributes["aria-label"]); },
    reset(value) { click(nodes.reset); nodes["reset-dialog"].returnValue = value; nodes["reset-dialog"].open = false; fire(nodes["reset-dialog"], "close"); },
  };
}

test("plant, water twice, clear, and undo restore every stage in exact order", () => {
  const f = fixture(); assert.equal(f.nodes.undo.disabled, true);
  f.plot(0); f.tool("water"); f.plot(0); f.plot(0); f.tool("clear"); f.plot(0);
  for (const state of ["in bloom", "sprout", "seed", "empty"]) {
    f.click("undo"); assert.match(f.board()[0], new RegExp(`${state}$`));
  }
  assert.equal(f.nodes.undo.disabled, true);
  assert.equal(f.root.activeElement, f.nodes["plot-grid"].children[0]);
  assert.deepEqual(JSON.parse(f.storage.value), Array(9).fill(null));
});

test("move and swap restore original positions and growth; Undo clears a pending move", () => {
  const f = fixture(); f.plot(0); f.tool("water"); f.plot(0); f.plot(0);
  f.tool("mint"); f.plot(1); const original = f.board();
  f.tool("move"); f.plot(0); f.plot(8);
  f.plot(8); f.plot(1); f.plot(1); // Pending selection after the swap.
  f.click("undo");
  assert.match(f.board()[8], /Daisy, in bloom$/); assert.match(f.board()[1], /Mint, seed$/);
  assert.ok(f.board().every(label => !label.includes("selected")));
  f.click("undo"); assert.deepEqual(f.board(), original);
});

test("invalid actions, selections, Escape and tool changes do not add history", () => {
  const f = fixture(); f.plot(0); f.plot(0); // Occupied planting.
  f.tool("water"); f.plot(8); f.tool("clear"); f.plot(8);
  f.tool("move"); f.plot(8); f.plot(0); f.plot(0); f.plot(0); f.escape();
  f.plot(0); f.tool("mint"); f.click("undo");
  assert.equal(f.nodes.undo.disabled, true); assert.match(f.board()[0], /empty$/);
  f.plot(0); f.tool("water"); f.plot(0); f.plot(0); f.plot(0); // Extra water is a no-op.
  f.click("undo"); assert.match(f.board()[0], /sprout$/);
});

test("fill is a single undo step and repeated filling a full garden adds nothing", () => {
  const f = fixture(); f.plot(0); f.tool("water"); f.plot(0);
  const original = f.board(); f.click("surprise"); f.click("surprise");
  assert.ok(f.board().every(label => !label.endsWith("empty")));
  f.click("undo"); assert.deepEqual(f.board(), original);
  f.click("undo"); assert.match(f.board()[0], /seed$/);
});

test("cancel and dismiss preserve Undo; confirmed fresh start clears it", () => {
  for (const choice of ["cancel", ""]) {
    const f = fixture(); f.plot(0); const before = f.board(); f.reset(choice);
    assert.deepEqual(f.board(), before); assert.equal(f.nodes.undo.disabled, false);
    f.click("undo"); assert.match(f.board()[0], /empty$/);
  }
  const f = fixture(); f.plot(0); f.reset("reset");
  assert.equal(f.nodes.undo.disabled, true);
  assert.deepEqual(JSON.parse(f.storage.value), Array(9).fill(null));
  f.plot(2); f.click("undo"); assert.ok(f.board().every(label => label.endsWith("empty")));
});

test("restored gardens persist in the old format but Undo history does not survive reload", () => {
  const f = fixture(); f.plot(0); f.tool("water"); f.plot(0); f.plot(0);
  f.tool("clear"); f.plot(0); f.click("undo");
  const saved = JSON.parse(f.storage.value);
  assert.equal(saved.length, 9); assert.deepEqual(saved[0], { type: "daisy", stage: 2 });
  const reloaded = fixture(f.storage);
  assert.deepEqual(reloaded.board(), f.board()); assert.equal(reloaded.nodes.undo.disabled, true);
  reloaded.tool("clear"); reloaded.plot(0); reloaded.click("undo");
  assert.deepEqual(reloaded.board(), f.board());
});

test("Undo remains usable when storage writes or access are blocked", () => {
  for (const access of [
    () => ({ getItem() { return null; }, setItem() { throw new Error("quota"); } }),
    () => { throw new Error("blocked"); },
  ]) {
    const f = fixture(undefined, access); f.plot(0); f.tool("clear"); f.plot(0); f.click("undo");
    assert.match(f.board()[0], /Daisy, seed$/);
    assert.match(f.nodes["save-note"].textContent, /Saving is unavailable/);
    f.click("undo"); assert.equal(f.nodes.undo.disabled, true);
  }
});

test("Undo is a native described button and reset explicitly explains the history boundary", () => {
  const html = readFileSync(new URL("../public/garden.html", import.meta.url), "utf8");
  assert.match(html, /<button type="button" id="undo" aria-describedby="undo-help" disabled>/);
  assert.match(html, /id="undo-help">Last 20 changes, until you reload/);
  assert.match(html, /You cannot undo a fresh start/);
});
