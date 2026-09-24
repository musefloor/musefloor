export const rules = Object.freeze({ lanes: 5, target: 12, duration: 32, maxLeaves: 3 });

export function makeDrops(seed = 1) {
  let value = Number.isInteger(seed) ? seed >>> 0 : 1;
  return Object.freeze(Array.from({ length: 44 }, (_, id) => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    const at = 0.8 + id * 0.64;
    return Object.freeze({ id, lane: value % rules.lanes, kind: id % 4 === 3 ? "leaf" : "light", at, arrival: at + 3.2 - id / 110 });
  }));
}

export function newRound(seed = 1) {
  return { status: "ready", outcome: null, elapsed: 0, lane: 2, caught: 0, leaves: 0, lastEvent: null, drops: makeDrops(seed) };
}

export function startRound(state) {
  return state.status === "ready" ? { ...state, status: "running" } : state;
}

export function pauseRound(state) {
  return state.status === "running" ? { ...state, status: "paused" } : state;
}

export function resumeRound(state) {
  return state.status === "paused" ? { ...state, status: "running" } : state;
}

export function moveJar(state, lane) {
  if (state.status !== "running" || !Number.isInteger(lane)) return state;
  const next = Math.max(0, Math.min(rules.lanes - 1, lane));
  return next === state.lane ? state : { ...state, lane: next };
}

// Bounded steps prevent a delayed frame from silently resolving a whole round.
// The controller pauses after interruptions and subdivides normal frame deltas.
export function advanceRound(state, seconds) {
  if (state.status !== "running" || !Number.isFinite(seconds) || seconds <= 0 || seconds > 0.1) return state;
  const elapsed = Math.min(rules.duration, state.elapsed + seconds);
  let caught = state.caught, leaves = state.leaves, lastEvent = state.lastEvent;
  for (const drop of state.drops) {
    if (drop.arrival <= state.elapsed || drop.arrival > elapsed || drop.lane !== state.lane) continue;
    if (drop.kind === "light") caught++; else leaves++;
    lastEvent = { id: drop.id, kind: drop.kind };
    if (caught >= rules.target || leaves >= rules.maxLeaves) {
      return { ...state, elapsed: drop.arrival, caught, leaves, lastEvent, status: "finished", outcome: caught >= rules.target ? "won" : "leaves" };
    }
  }
  return { ...state, elapsed, caught, leaves, lastEvent, ...(elapsed === rules.duration ? { status: "finished", outcome: "time" } : {}) };
}

export function visibleDrops(state) {
  return state.drops.filter(drop => state.elapsed >= drop.at && state.elapsed < drop.arrival)
    .map(drop => ({ ...drop, progress: (state.elapsed - drop.at) / (drop.arrival - drop.at) }));
}
