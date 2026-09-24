import { seeds, plantArt } from "./garden-art.js";
import { selectMove } from "./garden-moves.js";
import { postcardPng } from "./garden-postcard.js";

const storageKey = "muse.pocket-garden.v1";
let plots = Array(9).fill(null);
let activeTool = "daisy";
let selectedPlot = null;
let canSave = true;
const grid = document.querySelector("#plot-grid");
const status = document.querySelector("#garden-status");
const saveNote = document.querySelector("#save-note");
const resetDialog = document.querySelector("#reset-dialog");
const postcardButton = document.querySelector("#postcard");
const postcardDialog = document.querySelector("#postcard-dialog");
let postcardUrl = null;

try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (Array.isArray(saved) && saved.length === 9) {
    plots = saved.map((plant) => plant && Object.hasOwn(seeds, plant.type) && Number.isInteger(plant.stage) && plant.stage >= 0 && plant.stage <= 2 ? { type: plant.type, stage: plant.stage } : null);
  }
} catch { /* An unreadable save starts a fresh patch. */ }

document.querySelector("#seed-tray").innerHTML = Object.entries(seeds).map(([key, seed]) => `<button type="button" class="seed" data-tool="${key}" aria-pressed="false">${plantArt(key)}<span><strong>${seed.name}</strong><small>${seed.note}</small></span></button>`).join("");

function chooseTool(tool) {
  activeTool = tool;
  selectedPlot = null;
  document.querySelector("#compact-tool").value = tool;
  document.querySelectorAll("[data-tool]").forEach((button) => {
    const active = button.dataset.tool === tool;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  render();
  status.textContent = tool === "water" ? "Water a planted plot. Two waterings bring it into bloom." : tool === "clear" ? "Choose the plot you'd like to clear." : tool === "move" ? "Choose a plant to move, then its destination. Occupied plots swap plants." : `${seeds[tool].name} selected. Choose an empty plot.`;
}

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(plots)); canSave = true; }
  catch { canSave = false; }
  saveNote.textContent = canSave ? "Saved in this browser. Come back whenever." : "Saving is unavailable in this browser. Your patch will last until you close or reload this page.";
}

function render(focusIndex) {
  grid.innerHTML = plots.map((plant, index) => {
    const state = plant ? ["seed", "sprout", "in bloom"][plant.stage] : "empty";
    const description = plant ? `${seeds[plant.type].name}, ${state}` : "empty";
    const selected = selectedPlot === index;
    return `<button type="button" class="plot ${plant?.stage === 2 ? "blooming" : ""} ${selected ? "move-source" : ""}" data-plot="${index}" aria-label="Plot ${index + 1}: ${description}${selected ? ", selected to move" : ""}"${activeTool === "move" ? ` aria-pressed="${selected}"` : ""}><span class="plot-number">${String(index + 1).padStart(2, "0")}</span>${plant ? plantArt(plant.type, plant.stage) : '<span class="empty-plot" aria-hidden="true">+</span>'}${plant ? `<span class="plot-hint">${selected ? "Selected" : plant.stage === 2 ? seeds[plant.type].name : state}</span>` : ""}</button>`;
  }).join("");
  document.querySelector("#bloom-count").textContent = `${plots.filter((plant) => plant?.stage === 2).length} of 9 plots in bloom`;
  if (Number.isInteger(focusIndex)) grid.querySelector(`[data-plot="${focusIndex}"]`).focus({ preventScroll: true });
}

grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-plot]");
  if (!button) return;
  const index = Number(button.dataset.plot);
  const plant = plots[index];
  if (activeTool === "move") {
    const move = selectMove(plots, selectedPlot, index);
    plots = move.plots;
    selectedPlot = move.selected;
    const notes = {
      empty: "Choose a plot with a plant first.",
      selected: "Choose a destination. Plants swap if it is occupied. Escape or the same plot cancels.",
      cancelled: "Move cancelled. Everything is still where you left it.",
      moved: "Plant moved, growth kept. Choose another plant to move.",
      swapped: "Plants swapped, both growth stages kept. Choose another plant to move.",
    };
    if (["moved", "swapped"].includes(move.outcome)) save();
    render(index);
    status.textContent = notes[move.outcome];
    return;
  }
  if (activeTool === "clear") {
    if (!plant) { status.textContent = "This plot is already empty."; return; }
    plots[index] = null;
    status.textContent = "A little space for something new.";
  } else if (activeTool === "water") {
    if (!plant) { status.textContent = "Plant a seed here first."; return; }
    if (plant.stage === 2) { status.textContent = `${seeds[plant.type].name} is happily in bloom. No more water needed.`; return; }
    plant.stage += 1;
    status.textContent = plant.stage === 2 ? `${seeds[plant.type].name} is in bloom!` : "A little sprout. One more watering.";
  } else {
    if (plant) { status.textContent = "Something is growing here. Choose Water to tend it, or Clear a plot to replant."; return; }
    plots[index] = { type: activeTool, stage: 0 };
    status.textContent = `${seeds[activeTool].name} planted. Choose Water to help it grow.`;
  }
  save();
  render(index);
  if (activeTool === "water") grid.querySelector(`[data-plot="${index}"]`).classList.add("just-watered");
});

document.querySelectorAll("[data-tool]").forEach((button) => button.addEventListener("click", () => chooseTool(button.dataset.tool)));
document.querySelector("#compact-tool").addEventListener("change", (event) => chooseTool(event.target.value));
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || selectedPlot === null || resetDialog.open || postcardDialog.open) return;
  event.preventDefault();
  const previous = selectedPlot;
  selectedPlot = null;
  render(previous);
  status.textContent = "Move cancelled. Everything is still where you left it.";
});
document.querySelector("#surprise").addEventListener("click", () => {
  selectedPlot = null;
  render();
  if (plots.every(Boolean)) { status.textContent = "Your patch is full. Water a seed or clear a plot to try something new."; return; }
  const types = Object.keys(seeds);
  plots = plots.map((plant) => plant || { type: types[Math.floor(Math.random() * types.length)], stage: 0 });
  save(); render(); chooseTool("water");
  status.textContent = "A little mix of seeds. Your watering can is ready.";
});
document.querySelector("#reset").addEventListener("click", () => {
  selectedPlot = null;
  render();
  if (activeTool === "move") status.textContent = "Choose a plant to move, then its destination. Occupied plots swap plants.";
  resetDialog.returnValue = "";
  resetDialog.showModal();
});
resetDialog.addEventListener("close", () => {
  if (resetDialog.returnValue !== "reset") return;
  plots = Array(9).fill(null); save(); render(); chooseTool("daisy");
  status.textContent = "A fresh patch. What will you plant?";
});
postcardButton.addEventListener("click", async () => {
  postcardButton.disabled = true;
  postcardButton.setAttribute("aria-busy", "true");
  status.textContent = "Making your postcard…";
  try {
    const image = await postcardPng(plots);
    postcardUrl = URL.createObjectURL(image);
    document.querySelector("#postcard-preview").src = postcardUrl;
    document.querySelector("#postcard-download").href = postcardUrl;
    postcardDialog.showModal();
    document.querySelector("#postcard-download").focus();
    status.textContent = "Your postcard is ready to save.";
  } catch {
    if (postcardUrl) URL.revokeObjectURL(postcardUrl);
    postcardUrl = null;
    status.textContent = "Could not make the postcard. Your garden is unchanged. Please try again.";
  } finally {
    postcardButton.disabled = false;
    postcardButton.removeAttribute("aria-busy");
  }
});
document.querySelector("#postcard-close").addEventListener("click", () => postcardDialog.close());
postcardDialog.addEventListener("close", () => {
  const expired = postcardUrl;
  postcardUrl = null;
  document.querySelector("#postcard-preview").removeAttribute("src");
  document.querySelector("#postcard-download").removeAttribute("href");
  // Let an explicitly requested download start before releasing its source.
  if (expired) setTimeout(() => URL.revokeObjectURL(expired), 30000);
  postcardButton.focus();
});
render(); chooseTool("daisy");
