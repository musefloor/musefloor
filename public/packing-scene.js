import { gardenArt } from "./garden-art.js";

// This optional view owns only its control and decoration, never puzzle state.
export function setupGardenView(root) {
  const control = root.querySelector("#scene-control");
  const toggle = root.querySelector("#scene-toggle");
  const scene = root.querySelector("#garden-scene");
  const view = root.querySelector("#window-garden");
  if (!control || !toggle || !scene || !view) return false;

  let drawn = false;
  function update() {
    if (toggle.checked && !drawn) {
      view.innerHTML = gardenArt();
      drawn = true;
    }
    scene.hidden = !toggle.checked;
  }

  // Each fresh page starts plain, including browsers that restore form values.
  toggle.checked = false;
  update();
  toggle.addEventListener("change", update);
  control.hidden = false;
  return true;
}

if (typeof document !== "undefined") setupGardenView(document);
