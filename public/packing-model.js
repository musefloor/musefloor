export const bagSize = 4;
export const items = Object.freeze({
  sandwiches: { name: "Sandwich box", mark: "S", color: "#d3b369", cells: [[0,0],[1,0],[0,1],[1,1]] },
  flask: { name: "Thermos", mark: "T", color: "#8faf9c", cells: [[0,0],[0,1],[0,2]] },
  blanket: { name: "Blanket", mark: "B", color: "#b09ebd", cells: [[1,0],[1,1],[1,2],[0,2]] },
  utensils: { name: "Cutlery wrap", mark: "C", color: "#aab9ce", cells: [[0,0],[0,1],[1,1]] },
  apples: { name: "Apples", mark: "A", color: "#cf9787", cells: [[0,0],[1,0]] },
});

export function shape(id, turns = 0) {
  if (!Object.hasOwn(items, id) || !Number.isInteger(turns)) return [];
  let cells = items[id].cells.map(([x,y]) => [x,y]);
  for (let step = 0; step < ((turns % 4) + 4) % 4; step++) {
    const height = Math.max(...cells.map(([,y]) => y)) + 1;
    cells = cells.map(([x,y]) => [height - 1 - y, x]);
  }
  return cells.sort((a,b) => a[1] - b[1] || a[0] - b[0]);
}

export function occupied(placements, except) {
  const board = new Map();
  for (const [id, placement] of Object.entries(placements)) {
    if (id === except) continue;
    for (const [x,y] of shape(id, placement.turns)) board.set(`${placement.x + x},${placement.y + y}`, id);
  }
  return board;
}

export function placementIssue(placements, id, x, y, turns = 0) {
  if (![x,y,turns].every(Number.isInteger)) return { reason: "invalid" };
  const cells = shape(id, turns);
  if (!cells.length) return { reason: "invalid" };
  if (cells.some(([dx,dy]) => x + dx < 0 || y + dy < 0 || x + dx >= bagSize || y + dy >= bagSize)) {
    return { reason: "outside" };
  }
  const board = occupied(placements, id);
  const blockers = [...new Set(cells.map(([dx,dy]) => board.get(`${x+dx},${y+dy}`)).filter(Boolean))].sort();
  return blockers.length ? { reason: "overlap", blockers } : null;
}

export function canPlace(placements, id, x, y, turns = 0) {
  return placementIssue(placements, id, x, y, turns) === null;
}

export const newPacking = () => ({ placements: {}, history: [] });
function change(state, placements) {
  return { placements, history: [...state.history, state.placements].slice(-100) };
}

export function place(state, id, x, y, turns = 0) {
  if (!canPlace(state.placements, id, x, y, turns)) return state;
  const next = { x, y, turns: ((turns % 4) + 4) % 4 };
  const before = state.placements[id];
  if (before && before.x === next.x && before.y === next.y && before.turns === next.turns) return state;
  return change(state, { ...state.placements, [id]: next });
}

export function remove(state, id) {
  if (!Object.hasOwn(state.placements, id)) return state;
  const placements = { ...state.placements };
  delete placements[id];
  return change(state, placements);
}

export function undo(state) {
  return state.history.length ? { placements: state.history.at(-1), history: state.history.slice(0,-1) } : state;
}

export function isPacked(state) {
  const entries = Object.entries(state.placements);
  return entries.length === Object.keys(items).length && entries.every(([id,p]) => canPlace(state.placements,id,p.x,p.y,p.turns)) && occupied(state.placements).size === bagSize ** 2;
}
