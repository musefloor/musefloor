export const historyLimit = 20;

export function copyGarden(plots) {
  return plots.map(plant => plant ? { type: plant.type, stage: plant.stage } : null);
}

export function rememberGarden(history, before, after) {
  const unchanged = before.every((plant, index) =>
    plant?.type === after[index]?.type && plant?.stage === after[index]?.stage);
  if (unchanged) return history;
  return [...history, copyGarden(before)].slice(-historyLimit);
}

export function undoGarden(plots, history) {
  if (!history.length) return { plots, history, changed: false };
  return { plots: copyGarden(history.at(-1)), history: history.slice(0, -1), changed: true };
}
