import { newRound, startRound, moveJar, advanceRound, visibleDrops, rules } from "./lantern-model.js";
import { roundLink } from "./lantern-links.js";

export const promo = Object.freeze({ seed: 42, fps: 30, seconds: 10, playSeconds: 8, width: 720, height: 900, headlineLimit: 72 });
export const destination = roundLink(promo.seed);
export const defaultHeadline = "Same evening. Your turn.";

export function cleanHeadline(value) {
  return Array.from(String(value ?? "").replace(/\s+/g, " ").trim()).slice(0, promo.headlineLimit).join("") || defaultHeadline;
}

// Explicit example inputs, not a player recording or a claim of autonomous play.
// Every frame advances the same model used by the playable game.
export function makePromoFrames() {
  let state = startRound(newRound(promo.seed));
  return Array.from({ length: promo.seconds * promo.fps + 1 }, (_, index) => {
    const time = index / promo.fps;
    if (time > 0 && time <= promo.playSeconds) {
      const next = state.drops.find(drop => drop.arrival > state.elapsed);
      if (next) state = moveJar(state, next.kind === "light" ? next.lane : (next.lane + 1) % rules.lanes);
      state = advanceRound(state, 1 / promo.fps);
    }
    return { time, endCard: time >= promo.playSeconds, state, drops: visibleDrops(state) };
  });
}

export function frameAt(frames, seconds) {
  const time = Number.isFinite(seconds) ? Math.max(0, Math.min(promo.seconds, seconds)) : 0;
  return frames[Math.min(frames.length - 1, Math.floor(time * promo.fps))];
}

export function recordingFormat(Recorder, canvas) {
  if (!Recorder?.isTypeSupported || typeof canvas?.captureStream !== "function") return null;
  for (const mime of ["video/mp4;codecs=avc1.42001E", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]) {
    try { if (Recorder.isTypeSupported(mime)) return { mime, extension: mime.startsWith("video/mp4") ? "mp4" : "webm" }; } catch { /* Try the next supported container. */ }
  }
  return null;
}
