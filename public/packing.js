import { items, bagSize, shape, occupied, canPlace, newPacking, place, remove, undo, isPacked } from "./packing-model.js";

export function setupPacking(root) {
  let state = newPacking(), selected = null, turns = 0, reopened = false, activeCell = 0;
  const grid = root.querySelector("#bag-grid");
  const tray = root.querySelector("#item-tray");
  const status = root.querySelector("#packing-status");
  const rotate = root.querySelector("#rotate");
  const takeOut = root.querySelector("#take-out");
  const cancel = root.querySelector("#cancel-selection");
  const undoButton = root.querySelector("#undo");
  const lid = root.querySelector("#bag-lid");

  function miniature(id, rotation) {
    return `<span class="mini-shape" aria-hidden="true">${shape(id, rotation).map(([x,y]) => `<span class="mini-cell" style="grid-column:${x+1};grid-row:${y+1};--item-color:${items[id].color}"></span>`).join("")}</span>`;
  }

  function render(focusCell) {
    const board = occupied(state.placements);
    const closed = isPacked(state) && !reopened;
    if (Number.isInteger(focusCell)) activeCell = focusCell;
    grid.innerHTML = Array.from({length:bagSize ** 2}, (_,index) => {
      const x = index % bagSize, y = Math.floor(index / bagSize), id = board.get(`${x},${y}`);
      const first = id && shape(id,state.placements[id].turns)[0];
      const marked = id && x === state.placements[id].x + first[0] && y === state.placements[id].y + first[1];
      return `<button type="button" class="bag-cell${id ? " filled" : ""}" data-cell="${index}" tabindex="${!closed && index === activeCell ? 0 : -1}" ${id ? `style="--item-color:${items[id].color}"` : ""} aria-label="Row ${y+1}, column ${x+1}: ${id ? items[id].name : "empty"}"${closed ? " disabled" : ""}>${marked ? items[id].mark : ""}</button>`;
    }).join("");
    tray.innerHTML = Object.entries(items).map(([id,item]) => `<button type="button" class="item-choice" data-item="${id}" aria-pressed="${selected === id}"${closed ? " disabled" : ""}><span>${item.name}<small>${state.placements[id] ? "In the bag" : `${item.cells.length} spaces`}</small></span>${miniature(id, selected === id ? turns : state.placements[id]?.turns || 0)}</button>`).join("");
    root.querySelector("#packed-count").textContent = `${Object.keys(state.placements).length} of 5 packed`;
    rotate.disabled = !selected || closed;
    takeOut.disabled = !state.placements[selected] || closed;
    cancel.disabled = !selected || closed;
    undoButton.disabled = !state.history.length;
    lid.hidden = !closed;
    if (closed) {
      status.textContent = "Everything fits. Your picnic is packed.";
      root.querySelector("#open-bag").focus();
    } else if (Number.isInteger(focusCell)) grid.querySelector(`[data-cell="${focusCell}"]`).focus();
  }

  function select(id) {
    selected = id; turns = state.placements[id]?.turns || 0;
    status.textContent = `${items[id].name} selected. Choose its top-left position; rotate if you like.`;
    render(); tray.querySelector(`[data-item="${id}"]`).focus();
  }

  function cancelSelection() {
    if (!selected) return;
    const id = selected, focused = root.activeElement?.dataset?.cell;
    selected = null; turns = 0;
    status.textContent = `${items[id].name} deselected. Nothing has moved.`;
    render(focused === undefined ? undefined : Number(focused));
    if (focused === undefined) tray.querySelector(`[data-item="${id}"]`).focus();
  }

  function rememberCell(index) {
    activeCell = index;
    grid.querySelectorAll("[data-cell]").forEach((cell) => {
      cell.tabIndex = !cell.disabled && Number(cell.dataset.cell) === activeCell ? 0 : -1;
    });
  }

  function clearPreview() {
    grid.querySelectorAll(".ghost").forEach((cell) => cell.classList.remove("ghost", "blocked"));
  }
  function preview(index) {
    clearPreview();
    if (!selected) return;
    const x = index % bagSize, y = Math.floor(index / bagSize);
    const valid = canPlace(state.placements,selected,x,y,turns);
    for (const [dx,dy] of shape(selected,turns)) {
      if (x+dx >= bagSize || y+dy >= bagSize) continue;
      const cell = grid.querySelector(`[data-cell="${(y+dy)*bagSize+x+dx}"]`);
      cell.classList.add("ghost"); cell.classList.toggle("blocked", !valid);
    }
  }

  tray.addEventListener("click", (event) => { const item = event.target.closest("[data-item]"); if (item) select(item.dataset.item); });
  grid.addEventListener("click", (event) => {
    const cell = event.target.closest("[data-cell]");
    if (!cell) return;
    const index = Number(cell.dataset.cell), x = index % bagSize, y = Math.floor(index / bagSize);
    rememberCell(index);
    if (!selected) {
      const id = occupied(state.placements).get(`${x},${y}`);
      if (id) select(id); else status.textContent = "Choose an object from the tray first.";
      return;
    }
    if (!canPlace(state.placements,selected,x,y,turns)) {
      status.textContent = "That does not fit there. Try another position or rotation. Nothing has moved.";
      preview(index); return;
    }
    const next = place(state,selected,x,y,turns);
    if (next === state) { status.textContent = "Already there. Try another position, or choose a different object."; return; }
    state = next; reopened = false;
    status.textContent = `${items[selected].name} packed. Choose another object, or move this one again.`;
    selected = null; turns = 0; render(index);
  });
  for (const eventName of ["pointerover", "focusin"]) grid.addEventListener(eventName, (event) => {
    const cell = event.target.closest("[data-cell]");
    if (cell) {
      if (eventName === "focusin") rememberCell(Number(cell.dataset.cell));
      preview(Number(cell.dataset.cell));
    }
  });
  grid.addEventListener("pointerleave", clearPreview);
  grid.addEventListener("focusout", (event) => { if (!grid.contains(event.relatedTarget)) clearPreview(); });
  function rotateSelected() {
    if (!selected) return;
    turns = (turns+1)%4;
    status.textContent = `${items[selected].name} rotated. Choose where to place it.`;
    const focused = root.activeElement?.dataset?.cell;
    render(focused === undefined ? undefined : Number(focused));
  }
  rotate.addEventListener("click", rotateSelected);
  cancel.addEventListener("click", cancelSelection);
  root.querySelector(".packing-layout").addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !selected || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
    event.preventDefault();
    cancelSelection();
  });
  takeOut.addEventListener("click", () => {
    if (!selected) return;
    state = remove(state,selected); reopened = false;
    status.textContent = `${items[selected].name} is back in the tray. You can place it again.`;
    render(); tray.querySelector(`[data-item="${selected}"]`).focus();
  });
  undoButton.addEventListener("click", () => {
    state = undo(state); selected = null; turns = 0; reopened = false;
    status.textContent = "Last change undone."; render();
    if (undoButton.disabled) tray.querySelector("button").focus();
  });
  root.querySelector("#open-bag").addEventListener("click", () => {
    reopened = true; status.textContent = "Bag open. Select an object to move or take out."; render(); tray.querySelector("button").focus();
  });
  grid.addEventListener("keydown", (event) => {
    const cell = event.target.closest("[data-cell]");
    if (!cell || event.ctrlKey || event.metaKey || event.altKey) return;
    const index = Number(cell.dataset.cell), x = index % bagSize, y = Math.floor(index/bagSize);
    let next;
    if (event.key === "ArrowRight") next = y*bagSize + Math.min(x+1,bagSize-1);
    if (event.key === "ArrowLeft") next = y*bagSize + Math.max(x-1,0);
    if (event.key === "ArrowDown") next = Math.min(y+1,bagSize-1)*bagSize+x;
    if (event.key === "ArrowUp") next = Math.max(y-1,0)*bagSize+x;
    if (event.key === "Home") next = y*bagSize;
    if (event.key === "End") next = y*bagSize + bagSize-1;
    if (event.key.toLowerCase() === "r") { event.preventDefault(); rotateSelected(); return; }
    if (next !== undefined) { event.preventDefault(); grid.querySelector(`[data-cell="${next}"]`).focus(); }
  });
  render();
}

if (typeof document !== "undefined") setupPacking(document);
