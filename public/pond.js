import { planThrow, sampleThrow, dragStrength } from "./pond-physics.js";

const canvas = document.querySelector("#pond");
const ctx = canvas.getContext("2d");
const strength = document.querySelector("#strength");
const strengthValue = document.querySelector("#strength-value");
const button = document.querySelector("#throw-button");
const result = document.querySelector("#throw-result");
const hint = document.querySelector("#pond-hint");
const soundButton = document.querySelector("#sound-toggle");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let width = 960, height = 540, frame = 0, drag = null, flight = null, lastPlan = null;
let audio = null, sound = false;

function path(points, fill) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x * width, y * height) : ctx.moveTo(x * width, y * height));
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function ellipse(x, y, rx, ry, fill, rotation = 0) {
  ctx.beginPath(); ctx.ellipse(x * width, y * height, rx * width, ry * height, rotation, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill();
}
function waterPoint(progress, power) {
  return { x: .27 + progress * (.31 + power * .38), y: .75 - progress * (.16 + power * .3) };
}
function ripple(x, y, age, opacity = 1) {
  if (age < 0 || age > 1050) return;
  const t = age / 1050;
  ctx.strokeStyle = `rgba(247,250,234,${(1 - t) * .85 * opacity})`;
  ctx.lineWidth = 1.4;
  for (let ring = 0; ring < 2; ring++) {
    const radius = .006 + t * .035 + ring * .009;
    ctx.beginPath(); ctx.ellipse(x * width, y * height, radius * width, radius * height * .36, 0, 0, Math.PI * 2); ctx.stroke();
  }
}
function stone(x, y, scale = 1, rotation = -.2) {
  ellipse(x, y + .014 * scale, .024 * scale, .010 * scale, "#446b5b28");
  ellipse(x, y, .021 * scale, .014 * scale, "#4f5c59", rotation);
  ellipse(x - .003 * scale, y - .004 * scale, .017 * scale, .007 * scale, "#8e9990", rotation);
}
function scenery() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#e1e7d5"; ctx.fillRect(0, 0, width, height);
  path([[0,.22],[.09,.19],[.2,.24],[.37,.14],[.5,.2],[.65,.13],[.79,.2],[1,.12],[1,1],[0,1]], "#b7c6ab");
  path([[0,.27],[.13,.22],[.29,.27],[.5,.23],[.65,.27],[.83,.2],[1,.25],[1,1],[0,1]], "#8fa98e");
  const water = ctx.createLinearGradient(0, height * .25, 0, height);
  water.addColorStop(0, "#a8c7b5"); water.addColorStop(.5, "#9fc5bc"); water.addColorStop(1, "#c6d8bc");
  ctx.fillStyle = water; ctx.fillRect(0, height * .3, width, height * .7);
  // Short, fixed brush marks keep the pond calm when no throw is running.
  for (let i = 0; i < 36; i++) {
    const x = ((i * 137) % 997) / 997;
    const y = .34 + ((i * 61) % 103) / 103 * .51;
    ctx.strokeStyle = i % 3 ? "#dce9d24a" : "#719c8d28";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x * width, y * height); ctx.lineTo((x + .015 + i % 4 * .01) * width, y * height); ctx.stroke();
  }
  path([[0,.31],[.09,.33],[.15,.38],[.10,.40],[0,.38]], "#cad4b5");
  path([[1,.34],[.92,.36],[.9,.39],[1,.4]], "#cad4b5");
  path([[0,.86],[.12,.89],[.3,.92],[.46,.94],[.69,.91],[.84,.9],[1,.86],[1,1],[0,1]], "#dedec8");
  path([[0,.87],[.12,.9],[.3,.93],[.46,.95],[.69,.92],[.84,.91],[1,.87],[1,.90],[.84,.93],[.69,.94],[.46,.97],[.3,.95],[.12,.92],[0,.9]], "#eeeeDA");
  // Reeds and a few shoreline stones, intentionally out of the throw path.
  for (const [x,y,scale] of [[.045,.9,1],[.09,.92,.72],[.94,.9,.8],[.975,.9,1.1]]) {
    ctx.strokeStyle = "#637c57"; ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(x * width, y * height); ctx.quadraticCurveTo((x + i * .007) * width, (y - .075 * scale) * height, (x + i * .014) * width, (y - .16 * scale) * height); ctx.stroke();
    }
  }
  ellipse(.14,.958,.031,.013,"#b6b6a4",-.1); ellipse(.79,.953,.019,.012,"#b3b6a7",.2);
  ellipse(.85,.962,.033,.01,"#c0bfad",-.1);
}
function draw(elapsed = 0) {
  scenery();
  if (flight) {
    const { plan } = flight;
    const state = sampleThrow(plan, elapsed);
    for (const hop of plan.hops) {
      const p = waterPoint(hop.to, plan.strength);
      ripple(p.x, p.y, elapsed - hop.end);
    }
    if (!state.sunk) {
      const p = waterPoint(state.progress, plan.strength);
      const scale = 1 - state.progress * .57;
      ellipse(p.x,p.y,.014 * scale,.006 * scale,"#42685928");
      stone(p.x,p.y - state.height,scale,elapsed * .014);
    }
  } else {
    if (lastPlan) for (const hop of lastPlan.hops) {
      const p = waterPoint(hop.to, lastPlan.strength);
      ripple(p.x, p.y, 480, .55);
    }
    const pull = drag ? drag.power * .065 : 0;
    if (drag) {
      ctx.setLineDash([4, 5]); ctx.strokeStyle = "#46665488"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(width * .27, height * (.75 + pull)); ctx.lineTo(width * .57, height * .52); ctx.stroke(); ctx.setLineDash([]);
    }
    stone(.27,.75 + pull,1.35);
    if (!lastPlan && !drag) {
      ctx.strokeStyle = "#f6f8e7aa"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(width * .27,height * .75,width * .044,height * .04,0,0,Math.PI * 2); ctx.stroke();
    }
  }
}
function resize() {
  const rect = canvas.getBoundingClientRect();
  width = rect.width; height = rect.height;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (drag) cancel("Drag cancelled after resizing.");
  draw(flight ? performance.now() - flight.started : 0);
}
function setStrength(value) {
  strength.value = String(Math.round(value * 100));
  strengthValue.textContent = strength.value + "%";
}
function playDrop(index) {
  if (!sound || !audio || audio.state !== "running") return;
  const oscillator = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime;
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(850 - index * 55, now);
  oscillator.frequency.exponentialRampToValueAtTime(220, now + .12);
  gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.055, now + .008); gain.gain.exponentialRampToValueAtTime(.0001, now + .14);
  oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(now); oscillator.stop(now + .15);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}
function finish(plan) {
  cancelAnimationFrame(frame); flight = null; lastPlan = plan;
  button.disabled = false; strength.disabled = false; button.innerHTML = 'Throw again <span aria-hidden="true">↗</span>';
  result.textContent = plan.skips ? `${plan.skips} ${plan.skips === 1 ? "skip" : "skips"}. ${plan.skips > 4 ? "A good little run." : "Try a little more strength."}` : "Straight to the bottom. Give the next one a little more strength.";
  hint.textContent = "Another pebble is ready."; draw();
}
function tick(now) {
  if (!flight) return;
  const elapsed = now - flight.started;
  const impacts = flight.plan.hops.filter((hop) => elapsed >= hop.end).length;
  if (impacts > flight.impacts) { playDrop(impacts - 1); flight.impacts = impacts; }
  draw(elapsed);
  if (sampleThrow(flight.plan, elapsed).finished) finish(flight.plan);
  else frame = requestAnimationFrame(tick);
}
function launch(power) {
  if (flight) return;
  clearDrag(); lastPlan = null;
  const plan = planThrow(power);
  setStrength(plan.strength);
  if (sound && audio?.state === "suspended") audio.resume().catch(() => {});
  if (reducedMotion.matches) { finish(plan); return; }
  flight = { plan, started: performance.now(), impacts: 0 };
  button.disabled = true; strength.disabled = true;
  result.textContent = "Across the water…"; hint.textContent = "Escape to cancel.";
  frame = requestAnimationFrame(tick);
}
function clearDrag() {
  const pointerId = drag?.id;
  drag = null; canvas.classList.remove("dragging");
  if (pointerId !== undefined && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
}
function cancel(message = "Throw cancelled. Your pebble is ready.") {
  clearDrag(); cancelAnimationFrame(frame); flight = null;
  button.disabled = false; strength.disabled = false;
  result.textContent = message; hint.textContent = "Pull the pebble down, then let go."; draw();
}

strength.addEventListener("input", () => { if (drag) cancel(); setStrength(Number(strength.value) / 100); });
document.querySelector("#throw-controls").addEventListener("submit", (event) => { event.preventDefault(); launch(Number(strength.value) / 100); });
canvas.addEventListener("pointerdown", (event) => {
  if (flight || drag || !event.isPrimary || event.button !== 0) return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height;
  if (Math.abs(x - .27) > Math.max(.07, 24 / rect.width) || Math.abs(y - .75) > Math.max(.07,24 / rect.height)) return;
  event.preventDefault(); drag = { id: event.pointerId, startY: event.clientY, power: 0 };
  canvas.setPointerCapture(event.pointerId); canvas.classList.add("dragging"); lastPlan = null;
  hint.textContent = "Pull down to choose strength. Escape cancels."; draw();
});
canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId !== drag?.id) return;
  drag.power = dragStrength(drag.startY, event.clientY, height); setStrength(drag.power); draw();
});
canvas.addEventListener("pointerup", (event) => {
  if (event.pointerId !== drag?.id) return;
  const power = dragStrength(drag.startY, event.clientY, height);
  clearDrag();
  if (!power) cancel("Pull the pebble down before letting go."); else launch(power);
});
canvas.addEventListener("pointercancel", (event) => { if (event.pointerId === drag?.id) cancel("Drag cancelled. Try again when you are ready."); });
canvas.addEventListener("lostpointercapture", (event) => { if (event.pointerId === drag?.id) cancel(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && (drag || flight)) { event.preventDefault(); cancel(); } });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { if (drag || flight) cancel("Throw cancelled while you were away. Try another."); audio?.suspend().catch(() => {}); }
});
window.addEventListener("pagehide", () => { cancel(); audio?.suspend().catch(() => {}); });
reducedMotion.addEventListener("change", () => { if (flight && reducedMotion.matches) finish(flight.plan); });
soundButton.addEventListener("click", async () => {
  soundButton.disabled = true;
  try {
    if (sound) { sound = false; await audio?.suspend(); }
    else {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error("Sound unsupported");
      audio ||= new Audio(); await audio.resume(); sound = true;
    }
    soundButton.textContent = sound ? "Sound on" : "Sound off";
  } catch { sound = false; soundButton.textContent = "Sound unavailable"; }
  finally { soundButton.setAttribute("aria-pressed", String(sound)); soundButton.disabled = false; }
});
new ResizeObserver(resize).observe(canvas);
resize();
