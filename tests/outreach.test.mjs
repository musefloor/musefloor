import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STORAGE_KEY, campaigns, parseMoney, money, newDesk, validateDesk, totals, addExpense, adText, expenseCsv, openDesk } from "../public/outreach-model.js";

test("USD values use exact integer cents rather than floating addition", () => {
  for (const [text, cents] of [["0", 0], ["0.01", 1], ["1.2", 120], [" 10.99 ", 1099], ["999999.99", 99999999]]) assert.equal(parseMoney(text), cents);
  assert.equal(parseMoney("0.1") + parseMoney("0.2"), 30);
  assert.equal(money(30), "$0.30");
});

test("money rejects negatives, exponents, overflow and silent precision loss", () => {
  for (const value of ["", " ", "-1", "1e3", "Infinity", "NaN", "1.234", "1000000", "1,000", ".5", "1.", "01", null, 12]) assert.throws(() => parseMoney(value), Error, String(value));
});

test("the fresh ledger has no invented expenses and campaign drafts are independent", () => {
  const a = newDesk(), b = newDesk();
  assert.deepEqual(a.expenses, []); assert.equal(a.budget, 0);
  a.drafts.lantern.headline = "Changed";
  assert.equal(b.drafts.lantern.headline, campaigns.lantern.headline);
  assert.notEqual(a.drafts.garden.headline, "Changed");
  assert.deepEqual(totals(a), { paid: 0, planned: 0, remaining: 0 });
});

test("planned and paid expenses both reduce the cap without double counting", () => {
  const before = newDesk(); before.budget = 10000;
  const one = addExpense(before, { id: "a", name: " Clip ", amount: "12.50", status: "planned" });
  const two = addExpense(one, { id: "b", name: "Print", amount: "2.25", status: "paid" });
  assert.deepEqual(totals(two), { planned: 1250, paid: 225, remaining: 8525 });
  assert.equal(before.expenses.length, 0); assert.equal(one.expenses.length, 1);
  assert.equal(one.expenses[0].name, "Clip");
  const moved = validateDesk({ ...two, expenses: two.expenses.map(row => ({ ...row, status: "paid" })) });
  assert.deepEqual(totals(moved), { planned: 0, paid: 1475, remaining: 8525 });
  assert.equal(totals({ ...two, budget: 100 }).remaining, -1375);
});

test("expense validation bounds entries and refuses duplicate IDs and unknown statuses", () => {
  const state = newDesk();
  for (const patch of [{ name: " " }, { name: "x".repeat(81) }, { id: "" }, { status: "approved" }, { amount: "-1" }]) assert.throws(() => addExpense(state, { id: "1", name: "Clip", status: "planned", amount: "1", ...patch }));
  const one = addExpense(state, { id: "1", name: "Clip", status: "planned", amount: "1" });
  assert.throws(() => addExpense(one, { id: "1", name: "Other", status: "paid", amount: "2" }));
  const full = { ...state, expenses: Array.from({ length: 100 }, (_, i) => ({ id: String(i), name: "Clip", status: "planned", cents: 1 })) };
  assert.equal(validateDesk(full).expenses.length, 100);
  assert.throws(() => addExpense(full, { id: "101", name: "Other", status: "paid", amount: "1" }), /100 entries/);
});

test("restoration validates every field and strips unrelated values", () => {
  for (const patch of [{ version: 2 }, { selected: "__proto__" }, { budget: -1 }, { budget: 1.1 }, { budget: "100" }, { drafts: null }, { expenses: [null] }]) assert.throws(() => validateDesk({ ...newDesk(), ...patch }));
  const state = newDesk(); state.drafts.garden.body = "x".repeat(401);
  assert.throws(() => validateDesk(state));
  const clean = validateDesk({ ...newDesk(), extra: "not preserved" }); assert.equal(clean.extra, undefined);
  assert.deepEqual(validateDesk(JSON.parse(JSON.stringify(newDesk()))), newDesk());
});

test("ad copy includes only the selected draft and its fixed playable destination", () => {
  const state = newDesk(); state.selected = "garden"; state.drafts.garden = { headline: " New idea ", body: " Come play. " };
  assert.equal(adText(state), "New idea\n\nCome play.\n\nhttps://musefloor.world/garden.html");
  state.drafts.garden = { headline: "", body: "" }; assert.equal(adText(state), campaigns.garden.url);
});

test("CSV quotes commas, quotes and newlines and neutralizes formula-like descriptions", () => {
  const state = newDesk();
  state.expenses = ["=SUM(1,2)", "+cmd", " -12", "@name", "\tformula", 'Clip, "A"\nnotes', "Normal"].map((name, i) => ({ id: String(i), name, cents: 123, status: "planned" }));
  const csv = expenseCsv(state);
  for (const value of ["'=SUM(1,2)", "'+cmd", "' -12", "'@name", "'\tformula"]) assert.ok(csv.includes(value));
  assert.ok(csv.includes('"Clip, ""A""\nnotes","planned","1.23"'));
  assert.ok(csv.endsWith('"Normal","planned","1.23"\r\n'));
  assert.ok(!csv.includes("headline"));
});

test("saving round-trips valid data without writing anything on initial load", () => {
  const values = new Map(); const store = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const desk = openDesk(() => store); assert.equal(values.size, 0);
  desk.state.budget = 5000; assert.equal(desk.save(desk.state), true);
  assert.equal(openDesk(() => store).state.budget, 5000);
  assert.deepEqual([...values.keys()], [STORAGE_KEY]);
});

test("corrupt or future saved data stays untouched and blocked storage is recoverable", () => {
  for (const raw of ["broken JSON", JSON.stringify({ ...newDesk(), version: 9 })]) {
    let writes = 0; const desk = openDesk(() => ({ getItem: () => raw, setItem() { writes++; } }));
    assert.equal(desk.save(newDesk()), false); assert.equal(writes, 0); assert.match(desk.note, /left untouched/);
  }
  const blocked = openDesk(() => { throw Error("blocked"); }); assert.equal(blocked.save(newDesk()), false);
  const quota = openDesk(() => ({ getItem: () => null, setItem() { throw Error("quota"); } })); assert.equal(quota.save(newDesk()), false);
});

test("the outreach page is linked, labelled and has no payment or network client", () => {
  const html = readFileSync(new URL("../public/outreach.html", import.meta.url), "utf8");
  const controller = readFileSync(new URL("../public/outreach.js", import.meta.url), "utf8");
  const floor = readFileSync(new URL("../public/floor.html", import.meta.url), "utf8");
  assert.match(floor, /href="outreach.html"/); assert.match(html, /Nothing is posted or purchased here/);
  assert.match(html, /fieldset id="desk-controls" disabled/); assert.match(html, /No bank or ad account connected/);
  assert.doesNotMatch(controller, /innerHTML|fetch\(|XMLHttpRequest|sendBeacon|window.open/);
});
