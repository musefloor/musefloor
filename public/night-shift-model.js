export const size = 4;
export const directions = Object.freeze(["north", "east", "south", "west"]);
export const historyLimit = 50;

export function neighbor(cell, side) {
  if (!Number.isInteger(cell) || cell < 0 || cell >= size * size || !Number.isInteger(side) || side < 0 || side > 3) return null;
  const row = Math.floor(cell / size), col = cell % size;
  const nextRow = row + [-1, 0, 1, 0][side], nextCol = col + [0, 1, 0, -1][side];
  return nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size ? null : nextRow * size + nextCol;
}

export function ports(tile) {
  if (!tile || !["bend", "straight"].includes(tile.kind) || !Number.isInteger(tile.rotation) || tile.rotation < 0 || tile.rotation > 3) return [];
  return (tile.kind === "bend" ? [0, 1] : [0, 2]).map(side => (side + tile.rotation) % 4);
}

function authoredLevel({ id, title, recipient, note, source, target, path }) {
  const solution = Array.from({ length: size * size }, (_, i) => ({ kind: i % 3 === 0 ? "straight" : "bend", rotation: i % 4 }));
  path.forEach((cell, index) => {
    const entry = index === 0 ? source.side : directions.findIndex((_, side) => neighbor(cell, side) === path[index - 1]);
    const exit = index === path.length - 1 ? target.side : directions.findIndex((_, side) => neighbor(cell, side) === path[index + 1]);
    const kind = (entry + 2) % 4 === exit ? "straight" : "bend";
    const rotation = [0, 1, 2, 3].find(value => { const sides = ports({ kind, rotation: value }); return sides.includes(entry) && sides.includes(exit); });
    solution[cell] = { kind, rotation };
  });
  const freezeTiles = tiles => Object.freeze(tiles.map(Object.freeze));
  return Object.freeze({ id, title, recipient, note, source: Object.freeze(source), target: Object.freeze(target),
    tiles: freezeTiles(solution.map((tile, i) => ({ ...tile, rotation: (tile.rotation + (i % 3) + 1) % 4 }))),
    solution: freezeTiles(solution),
  });
}

export const routes = Object.freeze([
  authoredLevel({ id: "A", title: "The corner shop", recipient: "Mara / Corner Shop", note: "One small box of replacement bulbs.", source: { cell: 4, side: 3 }, target: { cell: 11, side: 1 }, path: [4, 5, 9, 10, 11] }),
  authoredLevel({ id: "B", title: "The last train", recipient: "Ivo / Platform Four", note: "A book someone left on the morning train.", source: { cell: 0, side: 0 }, target: { cell: 15, side: 1 }, path: [0, 4, 8, 9, 5, 6, 10, 11, 15] }),
  authoredLevel({ id: "C", title: "The long way home", recipient: "June / North Window", note: "A very late birthday present. Handle gently.", source: { cell: 12, side: 3 }, target: { cell: 3, side: 0 }, path: [12, 13, 9, 8, 4, 5, 6, 10, 14, 15, 11, 7, 3] }),
]);

export function traceRoute(board, route) {
  const validEnd = end => end && Number.isInteger(end.cell) && end.cell >= 0 && end.cell < 16 && Number.isInteger(end.side) && end.side >= 0 && end.side < 4;
  if (!Array.isArray(board) || board.length !== size * size || !validEnd(route?.source) || !validEnd(route?.target)) return { outcome: "invalid", path: [] };
  let cell = route.source.cell, entry = route.source.side;
  const visited = new Set(), path = [];
  while (!visited.has(`${cell}:${entry}`)) {
    visited.add(`${cell}:${entry}`);
    const sides = ports(board[cell]), exit = sides.includes(entry) ? sides.find(side => side !== entry) : null;
    path.push({ cell, entry, exit });
    if (exit === null) return { outcome: "loose-end", path };
    const next = neighbor(cell, exit);
    if (next === null) return { outcome: cell === route.target.cell && exit === route.target.side ? "delivered" : "wrong-exit", path };
    cell = next; entry = (exit + 2) % 4;
  }
  return { outcome: "loop", path };
}

function routeState(level, deliveries = []) {
  return { level, board: routes[level].tiles.map(tile => ({ ...tile })), status: "sorting", turns: 0, attempts: 0, history: [], run: null, deliveries };
}
export function newShift() { return routeState(0); }
function remember(state) { return [...state.history, { board: state.board, turns: state.turns }].slice(-historyLimit); }
export function rotateTile(state, cell) {
  if (state.status !== "sorting" || !Number.isInteger(cell) || cell < 0 || cell >= 16) return state;
  return { ...state, board: state.board.map((tile, i) => i === cell ? { ...tile, rotation: (tile.rotation + 1) % 4 } : tile), turns: state.turns + 1, history: remember(state), run: null };
}
export function undoTurn(state) {
  if (state.status !== "sorting" || !state.history.length) return state;
  return { ...state, ...state.history.at(-1), history: state.history.slice(0, -1), run: null };
}
export function resetRoute(state) {
  if (state.status !== "sorting" || state.board.every((tile, i) => tile.rotation === routes[state.level].tiles[i].rotation)) return state;
  return { ...state, board: routes[state.level].tiles.map(tile => ({ ...tile })), turns: 0, history: remember(state), run: null };
}
export function dispatchParcel(state) {
  if (state.status !== "sorting") return state;
  return { ...state, status: "moving", attempts: state.attempts + 1, run: traceRoute(state.board, routes[state.level]) };
}
export function finishDispatch(state) {
  if (state.status !== "moving") return state;
  if (state.run.outcome !== "delivered") return { ...state, status: "sorting" };
  const delivery = { id: routes[state.level].id, turns: state.turns, attempts: state.attempts };
  return { ...state, status: state.level === routes.length - 1 ? "complete" : "delivered", deliveries: [...state.deliveries, delivery], history: [] };
}
export function nextParcel(state) {
  return state.status === "delivered" && state.level < routes.length - 1 ? routeState(state.level + 1, state.deliveries) : state;
}

export function moveFocus(cell, key) {
  if (!Number.isInteger(cell) || cell < 0 || cell >= 16) return 0;
  const row = Math.floor(cell / size);
  if (key === "Home") return row * size;
  if (key === "End") return row * size + size - 1;
  const side = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }[key];
  return side === undefined ? cell : neighbor(cell, side) ?? cell;
}
