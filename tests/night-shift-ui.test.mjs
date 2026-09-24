import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setupNightShift } from "../public/night-shift.js";
import { routes } from "../public/night-shift-model.js";

function fixture({ reduced = false } = {}) {
  let serial = 0;
  const timers = new Map(), root = { hidden: false, listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; } };
  function node() {
    const classes = new Set();
    return { children: [], attrs: {}, listeners: {}, style: {}, textContent: "", disabled: false, hidden: false, tabIndex: -1,
      classList: { toggle(name, on) { if (on) classes.add(name); else classes.delete(name); }, contains: name => classes.has(name) },
      append(...children) { this.children.push(...children); }, replaceChildren(...children) { this.children = children; },
      addEventListener(name, fn) { this.listeners[name] = fn; }, setAttribute(name, value) { this.attrs[name] = value; }, focus() { root.activeElement = this; },
    };
  }
  const html = readFileSync(new URL("../public/night-shift.html", import.meta.url), "utf8");
  const nodes = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(([, id]) => [id, node()]));
  root.querySelector = selector => nodes[selector.slice(1)]; root.createElement = node;
  const view = { listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; }, matchMedia: () => ({ matches: reduced }),
    setTimeout(fn) { timers.set(++serial, fn); return serial; }, clearTimeout(id) { timers.delete(id); },
  };
  const dispose = setupNightShift(root, view, { paint() {} });
  const buttons = nodes["conveyor-board"].children;
  return { root, view, nodes, buttons, timers, dispose,
    click(target) { const button = typeof target === "number" ? buttons[target] : nodes[target]; if (!button.disabled && !button.hidden) button.listeners.click?.(); },
    tick() { const entry = timers.entries().next().value; if (entry) { timers.delete(entry[0]); entry[1](); } },
    drain() { let steps = 0; while (timers.size && steps++ < 100) this.tick(); assert.ok(steps < 100); },
    solve(level) { routes[level].tiles.forEach((tile, index) => { const count = (routes[level].solution[index].rotation - tile.rotation + 4) % 4; for (let i = 0; i < count; i++) this.click(index); }); },
  };
}

test("Night Shift starts idle with one keyboard entry point and no timer", () => {
  const f = fixture(); assert.equal(f.buttons.length, 16); assert.equal(f.buttons.filter(button => button.tabIndex === 0).length, 1);
  assert.equal(f.buttons[4].tabIndex, 0); assert.equal(f.timers.size, 0); assert.equal(f.nodes["shift-count"].textContent, "0 of 3 delivered");
  assert.equal(f.nodes["send-parcel"].disabled, false); assert.equal(f.nodes["undo-turn"].disabled, true);
});

test("native tile actions, reset and undo retain an accessible track description", () => {
  const f = fixture(), before = f.buttons[5].attrs["aria-label"];
  f.click(5); assert.notEqual(f.buttons[5].attrs["aria-label"], before); assert.equal(f.nodes["undo-turn"].disabled, false);
  f.click("reset-route"); assert.equal(f.buttons[5].attrs["aria-label"], before);
  f.click("undo-turn"); assert.notEqual(f.buttons[5].attrs["aria-label"], before);
  assert.match(f.buttons[5].attrs["aria-label"], /Row 2, column 2/);
});

test("keyboard arrows move focus without rotating and preserve one tab stop", () => {
  const f = fixture(), label = f.buttons[4].attrs["aria-label"]; let prevented = false;
  f.buttons[4].listeners.keydown({ key: "ArrowRight", preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.strictEqual(f.root.activeElement, f.buttons[5]); assert.equal(f.buttons[4].attrs["aria-label"], label);
  assert.equal(f.buttons.filter(button => button.tabIndex === 0).length, 1);
  f.buttons[5].listeners.keydown({ key: "ArrowDown", ctrlKey: true, preventDefault() { throw Error("modifier shortcut intercepted"); } });
  assert.strictEqual(f.root.activeElement, f.buttons[5]);
});

test("failed dispatch animates a bounded route and does not mark a delivery", () => {
  const f = fixture(); f.click("send-parcel"); assert.equal(f.nodes["send-parcel"].disabled, true); assert.ok(f.buttons.every(button => button.disabled));
  f.nodes["send-parcel"].listeners.click(); f.drain();
  assert.match(f.nodes["route-status"].textContent, /Stopped at/); assert.equal(f.nodes["shift-count"].textContent, "0 of 3 delivered");
  assert.ok(f.buttons.some(button => button.classList.contains("stopped"))); assert.equal(f.nodes["send-parcel"].disabled, false);
});

test("delivery is only marked after the final animation step", () => {
  const f = fixture(); f.solve(0);
  let text = f.nodes["route-status"].textContent, announcements = 0;
  Object.defineProperty(f.nodes["route-status"], "textContent", { get: () => text, set(value) { text = value; announcements++; } });
  f.click("send-parcel");
  assert.equal(f.nodes["shift-count"].textContent, "0 of 3 delivered"); f.tick(); assert.equal(f.nodes["shift-count"].textContent, "0 of 3 delivered");
  f.drain(); assert.equal(announcements, 2, "announce dispatch and arrival, not every animation frame");
  assert.equal(f.nodes["shift-count"].textContent, "1 of 3 delivered"); assert.equal(f.nodes["next-parcel"].hidden, false);
  assert.strictEqual(f.root.activeElement, f.nodes["next-parcel"]); f.click("next-parcel"); assert.equal(f.nodes["route-title"].textContent, routes[1].title);
});

test("leaving a tab pauses the parcel and returning requires explicit continuation", () => {
  const f = fixture(); f.solve(0); f.click("send-parcel"); f.tick(); f.root.hidden = true; f.root.listeners.visibilitychange();
  assert.equal(f.timers.size, 0); assert.match(f.nodes["route-status"].textContent, /paused/);
  f.root.hidden = false; f.root.listeners.visibilitychange(); assert.equal(f.timers.size, 0); assert.match(f.nodes["send-parcel"].textContent, /Continue/);
  f.click("send-parcel"); f.drain(); assert.equal(f.nodes["shift-count"].textContent, "1 of 3 delivered");
  assert.match(f.nodes["route-status"].textContent, /1 dispatch/);
});

test("pagehide and disposal cancel animation timers", () => {
  const f = fixture(); f.solve(0); f.click("send-parcel"); f.view.listeners.pagehide(); assert.equal(f.timers.size, 0);
  f.view.listeners.pageshow(); assert.match(f.nodes["send-parcel"].textContent, /Continue/); f.click("send-parcel");
  f.dispose(); assert.equal(f.timers.size, 0); f.nodes["send-parcel"].listeners.click(); assert.equal(f.timers.size, 0);
});

test("reduced motion completes the same three routes without animation timers", () => {
  const f = fixture({ reduced: true });
  for (let i = 0; i < 3; i++) { f.solve(i); f.click("send-parcel"); assert.equal(f.timers.size, 0); assert.equal(f.nodes["shift-count"].textContent, `${i + 1} of 3 delivered`); if (i < 2) f.click("next-parcel"); }
  assert.match(f.nodes["route-status"].textContent, /All three parcels delivered/); assert.equal(f.nodes["replay-shift"].hidden, false);
  f.click("replay-shift"); assert.equal(f.nodes["shift-count"].textContent, "0 of 3 delivered"); assert.equal(f.nodes["route-title"].textContent, routes[0].title);
});

test("new game is isolated from storage, APIs and existing product code", () => {
  const source = readFileSync(new URL("../public/night-shift.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(|sendBeacon|innerHTML|outreach-model|lantern-model|packing-model/);
  const page = readFileSync(new URL("../public/night-shift.html", import.meta.url), "utf8");
  assert.match(page, /id="send-parcel"[^>]*disabled/); assert.match(page, /id="route-status" role="status"/);
  assert.match(page, /No timer/); assert.match(page, /Progress lasts for this visit/);
});

test("the floor portfolio links to the playable Night Shift page and its experiment", () => {
  const floor = readFileSync(new URL("../public/floor.html", import.meta.url), "utf8");
  assert.match(floor, /<h4>Night Shift<\/h4>[\s\S]*?<a href="night-shift\.html">Play Night Shift/);
  assert.match(floor, /href="https:\/\/github\.com\/musefloor\/musefloor\/issues\/29"/);
});
