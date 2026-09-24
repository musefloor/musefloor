import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setupPacking } from "../public/packing.js";

// A small DOM fixture for the real controller. Native Tab/Enter/Space behavior
// and visual layout are checked in a browser, not simulated by this fixture.
function fixture() {
  const root = { activeElement: null };
  function fire(target, type, properties = {}) {
    const event = { target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...properties };
    for (let node = target; node; node = node.parent) {
      for (const listener of node.listeners.get(type) || []) listener(event);
    }
    return event;
  }
  function node(parent = null, attributes = {}, content = "") {
    const classes = new Set((attributes.class || "").split(" ").filter(Boolean));
    const element = {
      parent, attributes, listeners: new Map(), children: [], textContent: content, hidden: false,
      disabled: Object.hasOwn(attributes, "disabled"), tabIndex: Number(attributes.tabindex ?? 0),
      dataset: Object.fromEntries(Object.entries(attributes).filter(([key]) => key.startsWith("data-")).map(([key,value]) => [key.slice(5),value])),
      classList: {
        add(...names) { names.forEach(name => classes.add(name)); },
        remove(...names) { names.forEach(name => classes.delete(name)); },
        toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
        contains(name) { return classes.has(name); },
      },
      matches(selector) {
        if (selector === "button") return attributes.type === "button";
        if (selector.startsWith(".")) return classes.has(selector.slice(1));
        const match = selector.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);
        return !!match && Object.hasOwn(attributes, match[1]) && (match[2] === undefined || attributes[match[1]] === match[2]);
      },
      closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector) || null; },
      contains(target) { return !!target && (target === this || this.children.some(child => child.contains(target))); },
      querySelectorAll(selector) { return this.children.filter(child => child.matches(selector)); },
      querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
      addEventListener(type, listener) { this.listeners.set(type, [...(this.listeners.get(type) || []), listener]); },
      focus() {
        if (this.disabled || root.activeElement === this) return;
        if (root.activeElement) fire(root.activeElement, "focusout", { relatedTarget: this });
        root.activeElement = this;
        fire(this, "focusin");
      },
      get innerHTML() { return content; },
      set innerHTML(value) {
        content = value;
        this.children = [...value.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(([,attrs,html]) => {
          const parsed = Object.fromEntries([...attrs.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(([,key,value]) => [key,value ?? ""]));
          return node(this, parsed, html);
        });
      },
    };
    return element;
  }
  const layout = node();
  const ids = ["bag-grid","item-tray","packing-status","rotate","take-out","cancel-selection","show-hint","undo","bag-lid","open-bag","packed-count"];
  const nodes = Object.fromEntries(ids.map(id => [id,node(layout)]));
  root.querySelector = selector => selector === ".packing-layout" ? layout : nodes[selector.slice(1)];
  setupPacking(root);
  const cell = index => nodes["bag-grid"].querySelector(`[data-cell="${index}"]`);
  const item = id => nodes["item-tray"].querySelector(`[data-item="${id}"]`);
  const click = target => { if (!target.disabled) { target.focus(); return fire(target,"click"); } };
  const key = (value, modifiers = {}) => fire(root.activeElement,"keydown",{key:value,...modifiers});
  const tabs = () => nodes["bag-grid"].children.filter(cell => !cell.disabled && cell.tabIndex === 0).map(cell => Number(cell.dataset.cell));
  const board = () => nodes["bag-grid"].children.map(cell => cell.attributes["aria-label"]);
  return { root, nodes, cell, item, click, key, tabs, board, select: id => click(item(id)), pack(id,index) { click(item(id)); click(cell(index)); } };
}

test("bag has one remembered Tab stop; arrow keys and row Home/End never wrap", () => {
  const f=fixture();
  assert.deepEqual(f.tabs(),[0]);
  f.cell(0).focus();
  for (const key of ["ArrowLeft","ArrowUp","Home"]) {
    assert.equal(f.key(key).defaultPrevented,true);
    assert.deepEqual(f.tabs(),[0]);
  }
  f.key("End");assert.deepEqual(f.tabs(),[3]);
  f.key("ArrowRight");assert.deepEqual(f.tabs(),[3]);
  f.key("ArrowDown");assert.deepEqual(f.tabs(),[7]);
  f.key("Home");assert.deepEqual(f.tabs(),[4]);
  f.cell(15).focus();
  f.key("ArrowDown");f.key("ArrowRight");assert.deepEqual(f.tabs(),[15]);
  f.select("apples");
  assert.deepEqual(f.tabs(),[15],"tray rerender retains the bag entry point");
});

test("Tab, unrelated keys, and modified navigation remain native", () => {
  const f=fixture();f.cell(5).focus();
  for (const key of ["Tab","Enter"," ","x"]) assert.equal(f.key(key).defaultPrevented,false);
  for (const modifier of ["ctrlKey","metaKey","altKey"]) {
    for (const key of ["ArrowLeft","Home","End","r"]) assert.equal(f.key(key,{[modifier]:true}).defaultPrevented,false);
  }
  assert.deepEqual(f.tabs(),[5]);
});

test("Cancel discards a new piece and its pending rotation without adding history", () => {
  const f=fixture();
  assert.equal(f.nodes["cancel-selection"].disabled,true);
  f.select("flask");f.click(f.nodes.rotate);
  f.click(f.nodes["cancel-selection"]);
  assert.equal(f.root.activeElement,f.item("flask"));
  assert.equal(f.item("flask").attributes["aria-pressed"],"false");
  assert.equal(f.nodes["cancel-selection"].disabled,true);
  assert.equal(f.nodes.undo.disabled,true);
  assert.match(f.nodes["packing-status"].textContent,/Nothing has moved/);
  f.pack("flask",3);
  assert.match(f.board()[11],/Thermos$/,"reselect restores the original vertical shape");
  assert.equal(f.nodes["packed-count"].textContent,"1 of 5 packed");
});

test("grid Escape clears previews and selection while retaining cell focus", () => {
  const f=fixture();f.select("blanket");f.cell(4).focus();
  assert.ok(f.nodes["bag-grid"].children.some(cell => cell.classList.contains("ghost")));
  assert.equal(f.key("Escape").defaultPrevented,true);
  assert.equal(f.root.activeElement,f.cell(4));
  assert.deepEqual(f.tabs(),[4]);
  assert.ok(f.nodes["bag-grid"].children.every(cell => !cell.classList.contains("ghost")));
  assert.equal(f.nodes.rotate.disabled,true);
  assert.equal(f.key("Escape").defaultPrevented,false,"nothing selected means no key interception");
});

test("Escape from tray and controls returns focus to the selected tray item", () => {
  for (const target of ["tray","rotate","cancel-selection"]) {
    const f=fixture();f.select("apples");
    if(target !== "tray") f.nodes[target].focus();
    f.key("Escape");
    assert.equal(f.root.activeElement,f.item("apples"));
    assert.equal(f.item("apples").attributes["aria-pressed"],"false");
    assert.equal(f.nodes.undo.disabled,true);
  }
});

test("modified or already-handled Escape does not cancel", () => {
  const f=fixture();f.select("apples");
  for (const modifier of ["ctrlKey","metaKey","altKey"]) {
    assert.equal(f.key("Escape",{[modifier]:true}).defaultPrevented,false);
    assert.equal(f.nodes["cancel-selection"].disabled,false);
  }
  f.key("Escape",{defaultPrevented:true});
  assert.equal(f.nodes["cancel-selection"].disabled,false);
});

test("cancelling a packed object's rotation preserves placement and exact Undo order", () => {
  const f=fixture();f.pack("flask",3);f.pack("apples",12);
  const before=f.board();
  f.select("flask");f.cell(5).focus();f.key("r");
  assert.equal(f.root.activeElement,f.cell(5));
  assert.deepEqual(f.tabs(),[5]);
  f.key("Escape");
  assert.deepEqual(f.board(),before);
  assert.equal(f.nodes["packed-count"].textContent,"2 of 5 packed");
  f.click(f.nodes.undo);
  assert.equal(f.nodes["packed-count"].textContent,"1 of 5 packed");
  assert.match(f.board()[3],/Thermos$/);assert.match(f.board()[11],/Thermos$/);
  assert.match(f.board()[12],/empty$/);
  f.click(f.nodes.undo);
  assert.equal(f.nodes["packed-count"].textContent,"0 of 5 packed");
  assert.equal(f.nodes.undo.disabled,true);
});

test("Cancel also preserves history after a rejected placement or a Take out", () => {
  const f=fixture();f.pack("sandwiches",0);f.select("apples");f.click(f.cell(0));
  f.click(f.nodes["cancel-selection"]);f.click(f.nodes.undo);
  assert.equal(f.nodes["packed-count"].textContent,"0 of 5 packed");
  f.pack("flask",3);f.select("flask");f.click(f.nodes["take-out"]);
  f.click(f.nodes["cancel-selection"]);f.click(f.nodes.undo);
  assert.equal(f.nodes["packed-count"].textContent,"1 of 5 packed");
  assert.match(f.board()[11],/Thermos$/);
});

test("complete solve, reopen, cancellation and Undo retain the correct Tab order", () => {
  const f=fixture();
  for(const [id,index] of [["sandwiches",0],["flask",3],["blanket",1],["utensils",8],["apples",14]]) f.pack(id,index);
  const complete=f.board();
  assert.equal(f.nodes["bag-lid"].hidden,false);
  assert.equal(f.root.activeElement,f.nodes["open-bag"]);
  assert.deepEqual(f.tabs(),[]);
  assert.equal(f.nodes["cancel-selection"].disabled,true);
  f.click(f.nodes["open-bag"]);
  assert.deepEqual(f.tabs(),[14]);
  f.select("blanket");f.cell(6).focus();f.key("r");f.key("Escape");
  assert.deepEqual(f.board(),complete);
  assert.equal(f.nodes["bag-lid"].hidden,true,"cancellation must not re-close a reopened bag");
  assert.deepEqual(f.tabs(),[6]);
  f.click(f.nodes.undo);
  assert.equal(f.nodes["packed-count"].textContent,"4 of 5 packed");
  assert.equal(f.nodes["bag-lid"].hidden,true);
  assert.deepEqual(f.tabs(),[6]);
});

test("Cancel is a native button and the bag exposes its keyboard instructions", () => {
  const html=readFileSync(new URL("../public/packing.html",import.meta.url),"utf8");
  assert.match(html,/<button type="button" id="cancel-selection" disabled>Cancel<\/button>/);
  assert.match(html,/id="bag-grid"[^>]*aria-describedby="packing-help"/);
  assert.match(html,/id="packing-help">[^<]+<br><br>Tab enters or leaves the bag/);
  assert.match(html,/Escape cancels selection without moving anything/);
  assert.match(html, /<button type="button" id="show-hint" aria-describedby="hint-help">Show a hint<\/button>/);
});

test("a hint prepares a legal preview without packing anything or adding Undo history", () => {
  const f = fixture(), before = f.board();
  f.click(f.nodes["show-hint"]);
  assert.deepEqual(f.board(), before);
  assert.equal(f.nodes.undo.disabled, true);
  assert.equal(f.nodes["packed-count"].textContent, "0 of 5 packed");
  assert.match(f.nodes["packing-status"].textContent, /^Hint:.*row 1, column 1/);
  assert.equal(f.root.activeElement, f.cell(0));
  assert.ok(f.nodes["bag-grid"].children.some(cell => cell.classList.contains("ghost")));
  f.key("Escape");
  assert.deepEqual(f.board(), before);
  assert.ok(f.nodes["bag-grid"].children.every(cell => !cell.classList.contains("ghost")));
  assert.equal(f.nodes.undo.disabled, true);
  f.click(f.nodes["show-hint"]);f.click(f.root.activeElement);
  assert.equal(f.nodes["packed-count"].textContent, "1 of 5 packed");
  f.click(f.nodes.undo);assert.deepEqual(f.board(), before);
});

test("following five hints packs the bag; completion disables hints until Undo", () => {
  const f = fixture();
  for (let i = 0; i < 5; i++) {
    const before = f.board();
    f.click(f.nodes["show-hint"]);f.click(f.nodes["show-hint"]);
    assert.deepEqual(f.board(), before);
    f.click(f.root.activeElement);
    assert.equal(f.nodes["packed-count"].textContent, `${i + 1} of 5 packed`);
  }
  assert.equal(f.nodes["bag-lid"].hidden, false);
  assert.equal(f.nodes["show-hint"].disabled, true);
  f.click(f.nodes["open-bag"]);assert.equal(f.nodes["show-hint"].disabled, true);
  for (let i = 4; i >= 0; i--) {
    f.click(f.nodes.undo);
    assert.equal(f.nodes["packed-count"].textContent, `${i} of 5 packed`);
  }
  assert.equal(f.nodes["show-hint"].disabled, false);
});

test("blocked hints preserve packed pieces, pending selection and the real Undo order", () => {
  const f = fixture();f.pack("flask", 2);f.select("apples");f.click(f.nodes.rotate);
  const before = f.board(), selected = f.item("apples").innerHTML;
  f.click(f.nodes["show-hint"]);
  assert.match(f.nodes["packing-status"].textContent, /no way to fit everything else/);
  assert.deepEqual(f.board(), before);
  assert.equal(f.item("apples").attributes["aria-pressed"], "true");
  assert.equal(f.item("apples").innerHTML, selected);
  f.click(f.nodes.undo);
  assert.equal(f.nodes["packed-count"].textContent, "0 of 5 packed");
  assert.equal(f.nodes.undo.disabled, true);
  f.click(f.nodes["show-hint"]);assert.match(f.nodes["packing-status"].textContent, /^Hint:/);
});

test("rotating or cancelling a suggested piece cannot silently alter the bag", () => {
  const f = fixture();f.pack("sandwiches", 0);const before = f.board();
  f.click(f.nodes["show-hint"]);f.key("r");f.key("Escape");
  assert.deepEqual(f.board(), before);
  f.click(f.nodes.undo);assert.equal(f.nodes["packed-count"].textContent, "0 of 5 packed");
  assert.equal(f.nodes.undo.disabled, true);
});
