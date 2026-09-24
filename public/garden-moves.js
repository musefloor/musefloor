// A move changes positions, never plant records or growth stages.
export function selectMove(plots, selected, target) {
  const validIndex = (index) => Number.isInteger(index) && index >= 0 && index < plots.length;
  if (!Array.isArray(plots) || plots.length !== 9 || !validIndex(target) || (selected !== null && !validIndex(selected))) {
    throw new RangeError("Choose a valid garden plot.");
  }
  if (selected === null) {
    return { plots, selected: plots[target] ? target : null, outcome: plots[target] ? "selected" : "empty" };
  }
  if (selected === target) return { plots, selected: null, outcome: "cancelled" };
  if (!plots[selected]) return { plots, selected: null, outcome: "empty" };
  const next = plots.slice();
  [next[selected], next[target]] = [next[target], next[selected]];
  return { plots: next, selected: null, outcome: plots[target] ? "swapped" : "moved" };
}
