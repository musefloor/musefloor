import { bagSize, items, shape, canPlace } from "./packing-model.js";

const ids = Object.keys(items);
const maskFor = (id, x, y, turns) => shape(id, turns)
  .reduce((mask, [dx, dy]) => mask | (1 << ((y + dy) * bagSize + x + dx)), 0);

// Enumerate the fixed 4x4 puzzle once. Equivalent rotations need only one entry.
const candidates = new Map(ids.map(id => {
  const seen = new Set(), options = [];
  for (let turns = 0; turns < 4; turns++) {
    for (let y = 0; y < bagSize; y++) for (let x = 0; x < bagSize; x++) {
      if (!canPlace({}, id, x, y, turns)) continue;
      const mask = maskFor(id, x, y, turns);
      if (seen.has(mask)) continue;
      seen.add(mask);
      options.push({ id, x, y, turns, mask });
    }
  }
  return [id, options];
}));

export function packingHint(state) {
  const placements = state?.placements;
  if (!placements || typeof placements !== "object" || Array.isArray(placements)) return { kind: "invalid" };
  const entries = Object.entries(placements);
  if (entries.some(([id, p]) => !Object.hasOwn(items, id) || !p || ![p.x, p.y, p.turns].every(Number.isInteger))) return { kind: "invalid" };
  if (entries.some(([id, p]) => !canPlace(placements, id, p.x, p.y, p.turns))) return { kind: "invalid" };
  const remaining = ids.filter(id => !Object.hasOwn(placements, id));
  if (!remaining.length) return { kind: "complete" };
  const used = entries.reduce((mask, [id, p]) => mask | maskFor(id, p.x, p.y, p.turns), 0);
  const failed = new Set();

  function solve(missing, occupied) {
    if (!missing.length) return [];
    const key = `${missing.join(",")}:${occupied}`;
    if (failed.has(key)) return null;
    let chosen, options;
    for (const id of missing) {
      const available = candidates.get(id).filter(p => !(p.mask & occupied));
      if (!options || available.length < options.length) { chosen = id; options = available; }
      if (!available.length) break;
    }
    for (const option of options) {
      const rest = solve(missing.filter(id => id !== chosen), occupied | option.mask);
      if (rest) return [option, ...rest];
    }
    failed.add(key);
    return null;
  }

  const solution = solve(remaining, used);
  if (!solution) return { kind: "blocked" };
  const { id, x, y, turns } = solution[0];
  return { kind: "placement", id, x, y, turns };
}
