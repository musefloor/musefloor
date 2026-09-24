import { rules, newRound, retryRound, startRound, pauseRound, resumeRound, moveJar, advanceRound, visibleDrops } from "./lantern-model.js";
import { readRoundLink, roundLink } from "./lantern-links.js";

export function setupLantern(root, view = root.defaultView) {
  const get = id => root.querySelector(`#${id}`);
  const game = get("catch-game"), field = get("playfield"), sprites = get("falling-items"), jar = get("catch-jar");
  const overlay = get("game-overlay"), title = get("overlay-title"), copy = get("overlay-copy"), action = get("round-action");
  const lights = get("light-count"), leaves = get("leaf-count"), clock = get("time-left"), status = get("game-status");
  const pause = get("pause-round"), left = get("move-left"), right = get("move-right");
  const retry = get("retry-round"), replayHelp = get("replay-help");
  const link = get("round-link"), copyLink = get("copy-round"), copyStatus = get("copy-status");
  const lanes = [...game.querySelectorAll("[data-lane]")];
  const shared = readRoundLink(view.location?.search || "");
  let roundNumber = 0, copyRequest = 0, copying = false;
  const nextSeed = () => ((Date.now() >>> 0) + roundNumber++) >>> 0;
  let state = newRound(shared.kind === "shared" ? shared.seed : nextSeed());
  let frame = null, lastFrame = null, lastAnnouncement = null;
  if (shared.kind === "shared") {
    title.textContent = "A round from a friend.";
    status.textContent = "Shared pattern loaded. Your jar is empty; start when you are ready.";
  } else if (shared.kind === "invalid") {
    status.textContent = "That round link is not supported. A fresh pattern is ready instead.";
  }

  function updateShareLink() {
    copyRequest++;
    copying = false;
    link.value = roundLink(state.seed);
    copyStatus.textContent = "";
  }

  function render() {
    const running = state.status === "running";
    copyLink.disabled = running || copying;
    link.disabled = running;
    lights.innerHTML = `${state.caught} <small>/ ${rules.target}</small>`;
    leaves.innerHTML = `${state.leaves} <small>/ ${rules.maxLeaves}</small>`;
    clock.innerHTML = `${Math.ceil(Math.max(0, rules.duration - state.elapsed))}<small>s</small>`;
    jar.style.left = `${10 + state.lane * 20}%`;
    jar.style.setProperty("--glow", String(0.12 + state.caught / rules.target * 0.7));
    jar.classList.toggle("hit", state.lastEvent?.kind === "leaf");
    sprites.innerHTML = visibleDrops(state).map(drop => `<span class="drop ${drop.kind}" style="left:${10 + drop.lane * 20}%;top:${14 + drop.progress * 62}%"></span>`).join("");
    for (const [index, button] of lanes.entries()) {
      button.disabled = !running;
      button.setAttribute("aria-pressed", String(state.lane === index));
    }
    left.disabled = !running || state.lane === 0;
    right.disabled = !running || state.lane === rules.lanes - 1;
    pause.disabled = !["running", "paused"].includes(state.status);
    pause.textContent = state.status === "paused" ? "Resume" : "Pause";
    action.disabled = false;
    retry.hidden = retry.disabled = replayHelp.hidden = state.status !== "finished";
    action.setAttribute("aria-describedby", state.status === "finished" ? "replay-help" : "game-help");
    overlay.hidden = running;
    if (state.lastEvent && state.lastEvent.id !== lastAnnouncement) {
      lastAnnouncement = state.lastEvent.id;
      status.textContent = state.lastEvent.kind === "light" ? `${state.caught} of ${rules.target} lights caught.` : `A leaf landed in the jar. ${rules.maxLeaves - state.leaves} more will end the round.`;
    }
    if (state.status === "paused") {
      title.textContent = "The evening can wait.";
      copy.textContent = `${state.caught} lights in your jar. Your time and position are kept while paused.`;
      action.textContent = "Keep catching";
    } else if (state.status === "finished") {
      title.textContent = state.outcome === "won" ? "A jarful of evening." : state.outcome === "leaves" ? "More leaves than light." : "The evening slipped by.";
      copy.textContent = state.outcome === "won" ? `All ${rules.target} lights, with ${Math.ceil(rules.duration - state.elapsed)} seconds to spare. Nicely caught.` : `${state.caught} of ${rules.target} lights caught. Try another round when you're ready.`;
      action.textContent = "New round";
      status.textContent = `${title.textContent} ${state.caught} of ${rules.target} lights caught.`;
    }
  }

  function stopFrames() {
    if (frame !== null) view.cancelAnimationFrame(frame);
    frame = null; lastFrame = null;
  }

  function pauseGame(message = "Paused. Resume when you're ready.", focus = true) {
    if (state.status !== "running") return;
    state = pauseRound(state); stopFrames(); render(); status.textContent = message;
    if (focus) action.focus();
  }

  function animate(timestamp) {
    frame = null;
    if (state.status !== "running") return;
    let elapsed = lastFrame === null ? 0 : Math.max(0, (timestamp - lastFrame) / 1000);
    lastFrame = timestamp;
    if (elapsed > 0.25) { pauseGame("Paused after an interruption. Your round is kept."); return; }
    while (elapsed > 0 && state.status === "running") {
      const step = Math.min(0.1, elapsed);
      state = advanceRound(state, step); elapsed -= step;
    }
    render();
    if (state.status === "running") frame = view.requestAnimationFrame(animate);
    else { stopFrames(); action.focus(); }
  }

  function play(samePattern = false) {
    if (state.status === "running" || (samePattern && state.status !== "finished")) return;
    stopFrames();
    if (state.status === "paused") state = resumeRound(state);
    else {
      if (samePattern) state = retryRound(state);
      else if (state.status === "finished") {
        const seed = nextSeed();
        state = newRound(seed === state.seed ? (seed + 1) >>> 0 : seed);
      }
      state = startRound(state);
      lastAnnouncement = null;
    }
    updateShareLink();
    status.textContent = "Catch the glowing fireflies. Leave the leaves alone.";
    render(); game.scrollIntoView({ block: "start" }); field.focus({ preventScroll: true });
    if (root.hidden) pauseGame("Paused while this tab is hidden.", false);
    else frame = view.requestAnimationFrame(animate);
  }

  function move(lane) { state = moveJar(state, lane); render(); }
  copyLink.addEventListener("click", async () => {
    if (state.status === "running" || copying) return;
    const request = ++copyRequest, url = link.value;
    copying = true; copyLink.disabled = true;
    try {
      if (!view.navigator?.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await view.navigator.clipboard.writeText(url);
      if (request === copyRequest) copyStatus.textContent = "Round link copied. Same pattern, a fresh jar.";
    } catch {
      if (request === copyRequest) {
        copyStatus.textContent = "Copy was unavailable. Select the link above and copy it manually.";
        if (root.activeElement === copyLink) { link.focus(); link.select(); }
      }
    } finally {
      // A late clipboard response must not steal focus or change a new round.
      if (request === copyRequest) { copying = false; copyLink.disabled = false; }
    }
  });
  action.addEventListener("click", () => play());
  retry.addEventListener("click", () => play(true));
  pause.addEventListener("click", () => state.status === "paused" ? play() : pauseGame());
  left.addEventListener("click", () => move(state.lane - 1));
  right.addEventListener("click", () => move(state.lane + 1));
  for (const button of lanes) button.addEventListener("click", () => move(Number(button.dataset.lane)));
  game.addEventListener("keydown", event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
    const key = event.key.toLowerCase();
    if (["escape", "p"].includes(key) && ["running", "paused"].includes(state.status)) {
      event.preventDefault();
      if (!event.repeat) state.status === "running" ? pauseGame() : play();
    } else if (state.status === "running") {
      if (["arrowleft", "a"].includes(key)) { event.preventDefault(); move(state.lane - 1); }
      else if (["arrowright", "d"].includes(key)) { event.preventDefault(); move(state.lane + 1); }
      else if (/^[1-5]$/.test(key)) { event.preventDefault(); move(Number(key) - 1); }
    }
  });
  root.addEventListener("visibilitychange", () => { if (root.hidden) pauseGame("Paused while you were away. Resume when you're ready.", false); });
  view.addEventListener("blur", () => pauseGame("Paused while you were away. Resume when you're ready.", false));
  view.addEventListener("pagehide", () => pauseGame("Paused while you were away. Resume when you're ready.", false));
  updateShareLink(); render();
}

if (typeof document !== "undefined") setupLantern(document);
