import { campaigns, MAX_EXPENSES, openDesk, validateDesk, parseMoney, money, totals, addExpense, adText, expenseCsv } from "./outreach-model.js";

function downloadCsv(text) {
  const url = URL.createObjectURL(new Blob(["\uFEFF", text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "musefloor-expenses.csv";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function setupOutreach(root, services = {}) {
  const get = (id) => root.querySelector("#" + id);
  const desk = openDesk(services.storage || (() => localStorage));
  const copy = services.copy || ((text) => navigator.clipboard.writeText(text));
  const download = services.download || downloadCsv;
  const makeId = services.id || (() => crypto.randomUUID());
  let state = desk.state;
  let removed = null;
  let copyRevision = 0;

  function save() {
    get("save-note").textContent = desk.save(state) ? desk.note : (desk.note.startsWith("Saved") ? "Saving is unavailable. Changes last for this page visit; copy drafts and export expenses before leaving." : desk.note);
  }
  function invalidateCopy() {
    copyRevision++;
    get("copy-ad").disabled = false;
    get("ad-status").textContent = "";
  }
  function preview() {
    const campaign = campaigns[state.selected];
    const draft = state.drafts[state.selected];
    get("preview-name").textContent = campaign.name;
    get("preview-headline").textContent = draft.headline;
    get("preview-body").textContent = draft.body;
    get("preview-symbol").textContent = campaign.symbol;
    get("ad-poster").style.setProperty("--poster-color", campaign.color);
    get("destination").href = campaign.url;
    get("destination").textContent = campaign.name + " ↗";
    get("ad-copy").value = adText(state);
    get("character-count").textContent = `${Array.from(adText(state)).length} characters incl. link`;
  }
  function fillDraft() {
    get("campaign").value = state.selected;
    get("headline").value = state.drafts[state.selected].headline;
    get("ad-body").value = state.drafts[state.selected].body;
    preview();
  }
  function ledger() {
    const sum = totals(state);
    get("planned-total").textContent = money(sum.planned);
    get("paid-total").textContent = money(sum.paid);
    get("remaining-label").textContent = sum.remaining < 0 ? "Over budget" : "Unallocated";
    get("remaining-total").textContent = money(Math.abs(sum.remaining));
    get("remaining-total").classList.toggle("over-budget", sum.remaining < 0);
    get("empty-expenses").hidden = state.expenses.length !== 0;
    get("export-expenses").disabled = state.expenses.length === 0;
    get("undo-remove").disabled = !removed;
    get("expense-rows").replaceChildren(...state.expenses.map((row) => {
      const tr = root.createElement("tr");
      const name = root.createElement("td"); name.textContent = row.name;
      const status = root.createElement("td");
      const toggle = root.createElement("button"); toggle.type = "button";
      toggle.textContent = row.status === "paid" ? "Paid" : "Planned";
      const nextStatus = row.status === "paid" ? "planned" : "paid";
      toggle.setAttribute("aria-label", `Mark ${row.name} as ${nextStatus}`);
      toggle.title = `Mark as ${nextStatus}`;
      toggle.addEventListener("click", () => {
        state = { ...state, expenses: state.expenses.map((item) => item.id === row.id ? { ...item, status: nextStatus } : item) };
        save(); ledger();
        get("expense-status").textContent = `${row.name} marked ${nextStatus}. This records a note; it does not make a payment.`;
        get("expense-rows").children[state.expenses.findIndex((item) => item.id === row.id)].children[1].children[0].focus();
      });
      status.append(toggle);
      const amount = root.createElement("td"); amount.className = "amount"; amount.textContent = money(row.cents);
      const action = root.createElement("td");
      const remove = root.createElement("button"); remove.type = "button"; remove.textContent = "Remove";
      remove.setAttribute("aria-label", `Remove ${row.name}`);
      remove.addEventListener("click", () => {
        removed = { row, index: state.expenses.findIndex((item) => item.id === row.id) };
        state = { ...state, expenses: state.expenses.filter((item) => item.id !== row.id) };
        save(); ledger();
        get("expense-status").textContent = `Removed ${row.name}. Undo is available until another removal or a reload.`;
        get("undo-remove").focus();
      });
      action.append(remove); tr.append(name, status, amount, action); return tr;
    }));
  }

  get("campaign").addEventListener("change", () => {
    if (!Object.hasOwn(campaigns, get("campaign").value)) return;
    state = { ...state, selected: get("campaign").value };
    invalidateCopy(); fillDraft(); save();
  });
  for (const id of ["headline", "ad-body"]) get(id).addEventListener("input", () => {
    const draft = { headline: get("headline").value.slice(0, 72), body: get("ad-body").value.slice(0, 400) };
    state = { ...state, drafts: { ...state.drafts, [state.selected]: draft } };
    invalidateCopy(); preview(); save();
  });
  get("copy-ad").addEventListener("click", async () => {
    if (get("copy-ad").disabled) return;
    const revision = ++copyRevision;
    get("copy-ad").disabled = true;
    try {
      await copy(adText(state));
      if (revision === copyRevision) get("ad-status").textContent = "Ad text copied. Ready to paste; nothing has been posted.";
    } catch {
      if (revision !== copyRevision) return;
      get("ad-status").textContent = "Copy is unavailable. Open the plain-text version and copy it manually.";
      get("ad-copy").closest("details").open = true;
      if (root.activeElement === get("copy-ad")) { get("ad-copy").focus(); get("ad-copy").select(); }
    } finally {
      if (revision === copyRevision) get("copy-ad").disabled = false;
    }
  });
  get("budget-form").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const budget = parseMoney(get("budget").value);
      state = { ...state, budget }; save(); ledger();
      get("budget").value = (budget / 100).toFixed(2);
      get("budget-status").textContent = `Budget set to ${money(budget)}. No money has been moved.`;
    } catch (error) { get("budget-status").textContent = error.message; get("budget").focus(); }
  });
  get("expense-form").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      state = addExpense(state, { id: makeId(), name: get("expense-name").value, amount: get("expense-amount").value, status: get("expense-kind").value });
      save(); ledger();
      get("expense-name").value = ""; get("expense-amount").value = "";
      get("expense-status").textContent = "Expense added to this browser’s ledger.";
      get("expense-name").focus();
    } catch (error) { get("expense-status").textContent = error.message; }
  });
  get("undo-remove").addEventListener("click", () => {
    if (!removed) return;
    if (state.expenses.length >= MAX_EXPENSES) { get("expense-status").textContent = "There is no room to restore that entry. The desk holds 100 entries."; return; }
    const expenses = [...state.expenses]; expenses.splice(removed.index, 0, removed.row);
    const restoredIndex = expenses.findIndex((row) => row.id === removed.row.id);
    state = validateDesk({ ...state, expenses }); removed = null;
    save(); ledger(); get("expense-status").textContent = "Removed expense restored.";
    get("expense-rows").children[restoredIndex].children[3].children[0].focus();
  });
  get("export-expenses").addEventListener("click", () => {
    if (!state.expenses.length) return;
    try { download(expenseCsv(state)); get("expense-status").textContent = "CSV download requested. It contains your expense notes, not the budget or ad drafts."; }
    catch { get("expense-status").textContent = "The CSV download could not be started. Your entries are unchanged."; }
  });
  get("save-note").textContent = desk.note;
  get("budget").value = (state.budget / 100).toFixed(2);
  get("expense-kind").value = "planned";
  fillDraft(); ledger(); get("desk-controls").disabled = false;
}

if (typeof document !== "undefined") setupOutreach(document);
