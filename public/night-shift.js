import { routes, ports, directions, newShift, rotateTile, undoTurn, resetRoute, dispatchParcel, finishDispatch, nextParcel, moveFocus } from "./night-shift-model.js";

function paintTile(root, button, tile, index) {
  const svg = root.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 100 100"); svg.setAttribute("aria-hidden", "true");
  const ends = [[50, 0], [100, 50], [50, 100], [0, 50]], [a, b] = ports(tile).map(side => ends[side]);
  const d = `M ${a[0]} ${a[1]} L 50 50 L ${b[0]} ${b[1]}`;
  for (const name of ["rail", "seam"]) { const path = root.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("d", d); path.setAttribute("class", name); svg.append(path); }
  const label = root.createElement("span"); label.className = "cell-number"; label.setAttribute("aria-hidden", "true"); label.textContent = String(index + 1).padStart(2, "0");
  button.replaceChildren(svg, label);
}

export function setupNightShift(root, view = root.defaultView, services = {}) {
  const get = id => root.querySelector("#" + id), paint = services.paint || paintTile;
  let state = newShift(), focusCell = routes[0].source.cell, timer = null, step = 0, held = false, disposed = false;
  const buttons = [], manifest = [];
  let reduced = false;
  try { reduced = view.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { /* Motion is cosmetic; the rules do not depend on it. */ }
  function cancelTimer() { if (timer !== null) view.clearTimeout(timer); timer = null; }
  function dockText(end) { return `${end.side % 2 ? "row" : "column"} ${Math.floor(end.side % 2 ? end.cell / 4 : end.cell % 4) + 1} ${directions[end.side]}`; }
  function positionMarker(node, end) {
    const x = (end.cell % 4 + 0.5) * 25, y = (Math.floor(end.cell / 4) + 0.5) * 25;
    node.style.left = end.side === 3 ? "-13px" : end.side === 1 ? "calc(100% + 13px)" : `${x}%`;
    node.style.top = end.side === 0 ? "-15px" : end.side === 2 ? "calc(100% + 15px)" : `${y}%`;
  }
  function message() {
    if (state.status === "complete") return "All three parcels delivered. The desk is clear. Good night.";
    if (state.status === "delivered") return `Parcel ${routes[state.level].id} delivered in ${state.attempts} dispatch${state.attempts === 1 ? "" : "es"}. Ready for the next one.`;
    if (state.status === "moving") return held ? "Parcel paused while the tab was away. Continue when you are ready." : "Parcel on its way…";
    if (state.run) {
      const last = state.run.path.at(-1), where = last ? `row ${Math.floor(last.cell / 4) + 1}, column ${last.cell % 4 + 1}` : "the entrance";
      const reason = { "loose-end": "the next track does not connect", "wrong-exit": "that is not the marked exit", loop: "the route loops back", invalid: "the route could not be read" }[state.run.outcome];
      return `Stopped at ${where}: ${reason}. Turn a tile and try again.`;
    }
    return `Connect IN to exit ${routes[state.level].id}. ${state.turns} turn${state.turns === 1 ? "" : "s"} · ${state.attempts} dispatch${state.attempts === 1 ? "" : "es"}.`;
  }
  function render() {
    const route = routes[state.level], sorting = state.status === "sorting";
    get("route-title").textContent = state.status === "complete" ? "A clear desk. A quiet night." : route.title;
    get("route-number").textContent = `PARCEL ${String(state.level + 1).padStart(2, "0")} OF 03`;
    get("recipient").textContent = route.recipient; get("parcel-note").textContent = route.note; get("parcel-code").textContent = route.id;
    get("dock-instructions").textContent = `IN: ${dockText(route.source)}. Exit ${route.id}: ${dockText(route.target)}.`;
    get("exit-marker").textContent = route.id; positionMarker(get("entry-marker"), route.source); positionMarker(get("exit-marker"), route.target);
    const shown = state.run?.path.slice(0, state.status === "moving" ? step + 1 : undefined) || [];
    buttons.forEach((button, index) => {
      button.disabled = !sorting; button.tabIndex = index === focusCell ? 0 : -1;
      button.setAttribute("aria-label", `Row ${Math.floor(index / 4) + 1}, column ${index % 4 + 1}. ${state.board[index].kind === "bend" ? "Bend" : "Straight"} track connects ${ports(state.board[index]).map(side => directions[side]).join(" and ")}. Rotate clockwise.`);
      button.classList.toggle("traced", shown.some(item => item.cell === index));
      button.classList.toggle("parcel-here", state.status === "moving" && shown.at(-1)?.cell === index);
      button.classList.toggle("stopped", sorting && !!state.run && shown.at(-1)?.cell === index);
      paint(root, button, state.board[index], index);
    });
    get("send-parcel").disabled = !(sorting || (state.status === "moving" && held)) || root.hidden;
    get("send-parcel").textContent = held ? "Continue parcel →" : "Dispatch parcel →";
    get("undo-turn").disabled = !sorting || !state.history.length;
    get("reset-route").disabled = !sorting || state.board.every((tile, i) => tile.rotation === route.tiles[i].rotation);
    const statusText = message();
    if (get("route-status").textContent !== statusText) get("route-status").textContent = statusText;
    get("next-parcel").hidden = state.status !== "delivered"; get("replay-shift").hidden = state.status !== "complete";
    get("shift-count").textContent = `${state.deliveries.length} of 3 delivered`;
    manifest.forEach((item, index) => { const delivered = state.deliveries.find(delivery => delivery.id === routes[index].id); item.row.classList.toggle("done", !!delivered); item.status.textContent = delivered ? `Delivered · ${delivered.attempts} ${delivered.attempts === 1 ? "try" : "tries"}` : index === state.level ? "On the desk" : "Waiting"; });
  }
  function update(next) { if (disposed || next === state) return; state = next; render(); }
  function finish() {
    cancelTimer(); held = false; state = finishDispatch(state); render();
    get(state.status === "complete" ? "replay-shift" : state.status === "delivered" ? "next-parcel" : "send-parcel").focus();
  }
  function advance() {
    timer = null; if (disposed || state.status !== "moving") return;
    if (root.hidden) { held = true; render(); return; }
    if (reduced || step >= state.run.path.length - 1) { finish(); return; }
    step++; render(); timer = view.setTimeout(advance, 180);
  }
  for (let index = 0; index < 16; index++) {
    const button = root.createElement("button"); button.type = "button"; button.className = "conveyor-tile";
    button.addEventListener("click", () => { if (state.status === "sorting") { focusCell = index; update(rotateTile(state, index)); } });
    button.addEventListener("keydown", event => {
      if (event.altKey || event.ctrlKey || event.metaKey || state.status !== "sorting" || !["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault(); focusCell = moveFocus(index, event.key); buttons.forEach((item, i) => { item.tabIndex = i === focusCell ? 0 : -1; }); buttons[focusCell].focus();
    });
    buttons.push(button); get("conveyor-board").append(button);
  }
  for (const route of routes) {
    const row = root.createElement("li"), title = root.createElement("span"), status = root.createElement("span");
    title.textContent = `${route.id} / ${route.title}`; row.append(title, status); get("manifest-list").append(row); manifest.push({ row, status });
  }
  get("send-parcel").addEventListener("click", () => {
    if (disposed || root.hidden) return;
    if (state.status === "moving" && held) { held = false; render(); advance(); return; }
    if (state.status !== "sorting") return;
    state = dispatchParcel(state); step = 0; render();
    if (reduced) finish(); else timer = view.setTimeout(advance, 180);
  });
  get("undo-turn").addEventListener("click", () => update(undoTurn(state)));
  get("reset-route").addEventListener("click", () => update(resetRoute(state)));
  get("next-parcel").addEventListener("click", () => { const next = nextParcel(state); if (next === state) return; focusCell = routes[next.level].source.cell; update(next); buttons[focusCell].focus(); });
  get("replay-shift").addEventListener("click", () => { if (state.status !== "complete") return; focusCell = routes[0].source.cell; update(newShift()); buttons[focusCell].focus(); });
  root.addEventListener("visibilitychange", () => { if (disposed) return; if (state.status === "moving" && root.hidden) { cancelTimer(); held = true; } render(); });
  view.addEventListener("pagehide", () => { cancelTimer(); if (state.status === "moving") held = true; });
  view.addEventListener("pageshow", () => { if (!disposed) render(); });
  render();
  return () => { disposed = true; cancelTimer(); };
}

if (typeof document !== "undefined") setupNightShift(document);
