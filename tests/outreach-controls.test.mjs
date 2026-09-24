import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setupOutreach } from "../public/outreach.js";
import { newDesk } from "../public/outreach-model.js";

// Controller tests: real layout, keyboard semantics and native forms are checked in the browser.
function fixture(options = {}) {
  const root = { activeElement: null };
  const details = { open: false };
  const node = () => ({
    textContent: "", value: "", disabled: false, hidden: false, children: [], attrs: {}, listeners: {},
    style: { setProperty() {} }, classList: { toggle() {} },
    setAttribute(key, value) { this.attrs[key] = value; },
    addEventListener(event, callback) { this.listeners[event] = callback; },
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
    closest() { return details; }, focus() { root.activeElement = this; }, select() { this.selected = true; },
  });
  const html = readFileSync(new URL("../public/outreach.html", import.meta.url), "utf8");
  const nodes = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(([, id]) => [id, node()]));
  root.querySelector = selector => nodes[selector.slice(1)]; root.createElement = node;
  let raw = options.raw ?? null, id = 0;
  const copied = [], downloads = [];
  const storage = options.storage || (() => ({ getItem: () => raw, setItem: (_, value) => { raw = value; } }));
  setupOutreach(root, { storage, id: () => `row-${++id}`, copy: options.copy || (async value => { copied.push(value); }), download: options.download || (value => downloads.push(value)) });
  const fire = async (target, event) => { await target.listeners[event]?.({ preventDefault() {} }); };
  return { nodes, root, copied, downloads, details, stored: () => JSON.parse(raw),
    async click(target) { const item = typeof target === "string" ? nodes[target] : target; if (!item.disabled) { item.focus(); await fire(item, "click"); } },
    async input(id, value, event = "input") { nodes[id].value = value; nodes[id].focus(); await fire(nodes[id], event); },
    async submit(id) { await fire(nodes[id], "submit"); },
    async add(name = "Clip", amount = "12.50", status = "planned") { nodes["expense-name"].value = name; nodes["expense-amount"].value = amount; nodes["expense-kind"].value = status; await fire(nodes["expense-form"], "submit"); },
  };
}

test("draft edits update preview, copy and persistence without sharing across campaigns", async () => {
  const f = fixture();
  await f.input("headline", '<img src=x onerror="bad">');
  assert.equal(f.nodes["preview-headline"].textContent, '<img src=x onerror="bad">');
  await f.input("campaign", "garden", "change"); assert.notEqual(f.nodes.headline.value, '<img src=x onerror="bad">');
  await f.input("campaign", "lantern", "change"); assert.equal(f.nodes.headline.value, '<img src=x onerror="bad">');
  await f.click("copy-ad"); assert.match(f.nodes["ad-status"].textContent, /nothing has been posted/); assert.ok(f.copied[0].includes("https://musefloor.world/lantern.html?round="));
  const restored = fixture({ raw: JSON.stringify(f.stored()) }); assert.equal(restored.nodes.headline.value, f.nodes.headline.value);
});

test("ledger creation, paid transition, removal and undo keep totals exact and focus usable", async () => {
  const f = fixture(); await f.input("budget", "50.00"); await f.submit("budget-form");
  await f.add(); assert.equal(f.nodes["remaining-total"].textContent, "$37.50");
  assert.equal(f.nodes["planned-total"].textContent, "$12.50");
  await f.click(f.nodes["expense-rows"].children[0].children[1].children[0]);
  assert.equal(f.nodes["paid-total"].textContent, "$12.50"); assert.equal(f.nodes["planned-total"].textContent, "$0.00");
  await f.click(f.nodes["expense-rows"].children[0].children[3].children[0]);
  assert.equal(f.nodes["empty-expenses"].hidden, false); assert.equal(f.root.activeElement, f.nodes["undo-remove"]);
  await f.click("undo-remove"); assert.equal(f.nodes["paid-total"].textContent, "$12.50"); assert.equal(f.nodes["undo-remove"].disabled, true);
  const restored = fixture({ raw: JSON.stringify(f.stored()) }); assert.equal(restored.nodes["paid-total"].textContent, "$12.50"); assert.equal(restored.nodes["undo-remove"].disabled, true);
});

test("invalid amounts keep entries and the saved budget unchanged; overspending is explicit", async () => {
  const f = fixture(); await f.input("budget", "10"); await f.submit("budget-form");
  await f.input("budget", "-3"); await f.submit("budget-form"); assert.equal(f.stored().budget, 1000);
  await f.add("Invalid", "0.001"); assert.equal(f.nodes["expense-rows"].children.length, 0);
  await f.add("Clip", "10.01"); assert.equal(f.nodes["remaining-label"].textContent, "Over budget"); assert.equal(f.nodes["remaining-total"].textContent, "$0.01");
});

test("clipboard rejection exposes the exact plain-text version without posting", async () => {
  const f = fixture({ copy: async () => { throw Error("denied"); } });
  await f.click("copy-ad"); assert.match(f.nodes["ad-status"].textContent, /manually/); assert.equal(f.details.open, true);
  assert.equal(f.nodes["ad-copy"].selected, true); assert.equal(f.nodes["copy-ad"].disabled, false);
});

test("a late clipboard failure cannot steal focus or feedback from a newer draft", async () => {
  let reject; const f = fixture({ copy: () => new Promise((_, fail) => { reject = fail; }) });
  const pending = f.click("copy-ad"); await f.input("headline", "New pitch"); reject(Error("late")); await pending;
  assert.equal(f.root.activeElement, f.nodes.headline); assert.equal(f.details.open, false); assert.equal(f.nodes["ad-status"].textContent, "");
});

test("CSV download uses only current entries and failures leave them intact", async () => {
  const f = fixture(); assert.equal(f.nodes["export-expenses"].disabled, true);
  await f.add("=formula", "3.10"); await f.click("export-expenses"); assert.match(f.downloads[0], /'=formula/);
  const failed = fixture({ download() { throw Error("blocked"); } }); await failed.add(); await failed.click("export-expenses");
  assert.match(failed.nodes["expense-status"].textContent, /could not/); assert.equal(failed.stored().expenses.length, 1);
});

test("unavailable or unreadable storage keeps the desk usable and warns honestly", async () => {
  for (const options of [{ storage: () => { throw Error("blocked"); } }, { raw: "bad" }, { raw: JSON.stringify({ ...newDesk(), version: 9 }) }]) {
    const f = fixture(options); await f.add(); assert.equal(f.nodes["expense-rows"].children.length, 1);
    assert.match(f.nodes["save-note"].textContent, /temporary|page visit/);
  }
});
