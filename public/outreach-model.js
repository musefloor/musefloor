export const STORAGE_KEY = "musefloor-outreach-v1";
export const MAX_CENTS = 99999999;
export const MAX_EXPENSES = 100;
export const campaigns = Object.freeze({
  lantern: Object.freeze({ name: "Lantern Catch", url: "https://musefloor.world/lantern.html?round=v1-0000002a", headline: "Same evening. Your turn.", body: "Catch a jarful of fireflies. Send this round to a friend and see how you both do. Same pattern, fresh jar.", color: "#352f49", symbol: "✦" }),
  garden: Object.freeze({ name: "Pocket Garden", url: "https://musefloor.world/garden.html", headline: "A little room to grow.", body: "Nine plots, three seeds, and no hurry. Plant a little garden, rearrange it, and come back to your patch.", color: "#344b3e", symbol: "✿" }),
  picnic: Object.freeze({ name: "Pack a little picnic", url: "https://musefloor.world/packing.html", headline: "One bag. A few possibilities.", body: "Five things to take outside. Rotate, rearrange, and find a place for everything in this small packing puzzle.", color: "#704e38", symbol: "▦" }),
});

const ownsCampaign = (key) => Object.hasOwn(campaigns, key);
const validCents = (value) => Number.isSafeInteger(value) && value >= 0 && value <= MAX_CENTS;
const boundedText = (value, max) => typeof value === "string" && value.length <= max;

export function parseMoney(value) {
  if (typeof value !== "string") throw new Error("Enter an amount in USD.");
  const trimmed = value.trim();
  if (!/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(trimmed)) throw new Error("Use 0–999,999.99, with up to two decimal places and no commas.");
  const [whole, fraction = ""] = trimmed.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function money(cents) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function newDesk() {
  return { version: 1, selected: "lantern", budget: 0, expenses: [], drafts: Object.fromEntries(Object.entries(campaigns).map(([key, item]) => [key, { headline: item.headline, body: item.body }])) };
}

export function validateDesk(value) {
  if (!value || value.version !== 1 || !ownsCampaign(value.selected) || !validCents(value.budget) || !Array.isArray(value.expenses) || value.expenses.length > MAX_EXPENSES) throw new Error("Unsupported desk data.");
  const drafts = {};
  for (const key of Object.keys(campaigns)) {
    const draft = value.drafts?.[key];
    if (!draft || !boundedText(draft.headline, 72) || !boundedText(draft.body, 400)) throw new Error("Invalid ad draft.");
    drafts[key] = { headline: draft.headline, body: draft.body };
  }
  const ids = new Set();
  const expenses = value.expenses.map((row) => {
    if (!row || !boundedText(row.id, 80) || !row.id || ids.has(row.id) || !boundedText(row.name, 80) || !row.name.trim() || !validCents(row.cents) || !["planned", "paid"].includes(row.status)) throw new Error("Invalid expense entry.");
    ids.add(row.id);
    return { id: row.id, name: row.name.trim(), cents: row.cents, status: row.status };
  });
  return { version: 1, selected: value.selected, budget: value.budget, expenses, drafts };
}

export function totals(state) {
  const planned = state.expenses.filter((row) => row.status === "planned").reduce((sum, row) => sum + row.cents, 0);
  const paid = state.expenses.filter((row) => row.status === "paid").reduce((sum, row) => sum + row.cents, 0);
  return { planned, paid, remaining: state.budget - planned - paid };
}

export function addExpense(state, { id, name, amount, status }) {
  if (state.expenses.length >= MAX_EXPENSES) throw new Error("This desk holds up to 100 entries. Export a copy before removing older entries.");
  return validateDesk({ ...state, expenses: [...state.expenses, { id, name: name.trim(), cents: parseMoney(amount), status }] });
}

export function adText(state) {
  const draft = state.drafts[state.selected];
  return [draft.headline.trim(), draft.body.trim(), campaigns[state.selected].url].filter(Boolean).join("\n\n");
}

function csvCell(value) {
  let text = String(value);
  // Quoting alone does not prevent spreadsheet formula execution.
  if (/^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

export function expenseCsv(state) {
  return [["Expense", "Status", "Amount (USD)"], ...state.expenses.map((row) => [row.name, row.status, (row.cents / 100).toFixed(2)])].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function openDesk(accessStorage) {
  let storage;
  try { storage = accessStorage(); } catch { return { state: newDesk(), save: () => false, note: "Saving is unavailable. Changes last for this page visit; copy drafts and export expenses before leaving." }; }
  let state;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    state = raw === null ? newDesk() : validateDesk(JSON.parse(raw));
  } catch {
    // Never overwrite unreadable or future-version saved data with an empty desk.
    return { state: newDesk(), save: () => false, note: "The saved desk could not be read and has been left untouched. This visit is temporary; copy drafts and export expenses before leaving." };
  }
  return { state, note: "Saved in this browser only. Not shared with the studio or other visitors.", save(next) { try { storage.setItem(STORAGE_KEY, JSON.stringify(validateDesk(next))); return true; } catch { return false; } } };
}
