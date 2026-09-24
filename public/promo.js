import { promo, cleanHeadline, makePromoFrames, frameAt, recordingFormat } from "./promo-model.js";
import { drawPromo } from "./promo-render.js";
import { openDesk } from "./outreach-model.js";

export async function setupPromo(root, view = root.defaultView, services = {}) {
  const get = id => root.querySelector("#" + id), canvas = get("promo-canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) { get("clip-status").textContent = "Canvas is unavailable in this browser. You can still try the linked game."; return; }
  const paint = services.draw || drawPromo, frames = makePromoFrames();
  const format = recordingFormat(view.MediaRecorder, canvas);
  const desk = openDesk(services.storage || (() => view.localStorage));
  get("clip-headline").value = cleanHeadline(desk.state.drafts.lantern.headline);
  let ready = false, session = null, raf = null, deadline = null, resultUrl = null, stillBusy = false, stillRevision = 0;
  let current = frameAt(frames, 5), takeNumber = 0;
  const announce = text => { get("clip-status").textContent = text; };
  const render = () => paint(ctx, current, cleanHeadline(get("clip-headline").value));
  const controls = () => {
    get("clip-headline").disabled = !ready || !!session || stillBusy;
    get("preview-clip").disabled = !ready || !!session || stillBusy;
    get("record-clip").disabled = !ready || !!session || stillBusy || !format;
    get("cancel-clip").disabled = !session;
    get("save-still").disabled = !ready || !!session || stillBusy;
  };
  const cancelFrames = () => {
    if (raf !== null) view.cancelAnimationFrame(raf);
    if (deadline !== null) view.clearTimeout(deadline);
    raf = deadline = null;
  };
  const stopTracks = take => { for (const track of take.stream?.getTracks() || []) track.stop(); };
  function cancel(message) {
    const take = session; if (!take) return;
    take.discard = true; cancelFrames(); session = null;
    try { if (take.recorder?.state !== "inactive") take.recorder?.stop(); } catch { /* A failed recorder may already be stopped. */ }
    stopTracks(take); controls(); announce(message);
  }
  function complete(take) {
    cancelFrames();
    if (take.recorder) {
      take.finishing = true; announce("Finishing the video file…");
      deadline = view.setTimeout(() => cancel("Recording could not finish. No partial clip was offered; please try again."), 5000);
      try { take.recorder.stop(); } catch { cancel("Recording could not finish. Try again, or save a still image."); }
    } else { session = null; controls(); announce("Preview complete. Record a clip when you are ready."); }
  }
  function animate(timestamp) {
    raf = null; const take = session; if (!take || take.finishing) return;
    if (root.hidden || (take.last !== null && timestamp - take.last > 500)) { cancel("Interrupted. Start again while this tab stays visible; no partial recording was saved."); return; }
    if (take.start === null) take.start = timestamp;
    take.last = timestamp;
    const elapsed = Math.max(0, (timestamp - take.start) / 1000);
    current = frameAt(frames, elapsed); render(); get("clip-progress").value = Math.min(promo.seconds, elapsed);
    if (elapsed >= promo.seconds) complete(take);
    else raf = view.requestAnimationFrame(animate);
  }
  function start(record) {
    if (!ready || session || stillBusy || root.hidden || (record && !format)) return;
    const take = { number: ++takeNumber, start: null, last: null, discard: false, finishing: false, stream: null, recorder: null, chunks: [] };
    session = take; current = frameAt(frames, 0); render(); get("clip-progress").value = 0;
    try {
      if (record) {
        take.stream = canvas.captureStream(promo.fps);
        take.recorder = new view.MediaRecorder(take.stream, { mimeType: format.mime, videoBitsPerSecond: 3000000 });
        take.recorder.ondataavailable = event => { if (!take.discard && event.data?.size) take.chunks.push(event.data); };
        take.recorder.onerror = () => { if (session === take) cancel("Recording failed. Try again, or save a still image."); };
        take.recorder.onstop = () => {
          stopTracks(take);
          if (session !== take || take.discard) return;
          if (!take.finishing) { cancel("Recording ended early. No partial clip was offered; please try again."); return; }
          cancelFrames(); session = null;
          const blob = new view.Blob(take.chunks, { type: take.recorder.mimeType || format.mime });
          if (!blob.size) { controls(); announce("The recording was empty. Try again, or save a still image."); return; }
          try {
            const url = view.URL.createObjectURL(blob);
            get("recorded-video").pause();
            if (resultUrl) view.URL.revokeObjectURL(resultUrl);
            resultUrl = url;
            get("recorded-video").src = resultUrl;
            get("download-clip").href = resultUrl;
            get("download-clip").download = `musefloor-lantern-promo.${format.extension}`;
            get("clip-result").hidden = false;
            get("result-info").textContent = `${format.extension.toUpperCase()} · 720 × 900 · silent · ${(blob.size / 1024 / 1024).toFixed(2)} MB. This take uses the headline shown when recording started.`;
            announce("Clip ready. Watch the recorded file below, then download it.");
          } catch { announce("The video file could not be prepared. Please try again."); }
          controls();
        };
        take.recorder.start();
      }
      controls(); announce(record ? "Recording ten seconds. Keep this tab visible; no camera or microphone is used." : "Previewing ten seconds. Stop at any time.");
      deadline = view.setTimeout(() => cancel("The clip timed out. Keep this tab visible and try again."), 15000);
      raf = view.requestAnimationFrame(animate);
    } catch { cancel("Recording is unavailable here. Preview the clip or save a still image instead."); }
  }
  get("preview-clip").addEventListener("click", () => start(false));
  get("record-clip").addEventListener("click", () => start(true));
  get("cancel-clip").addEventListener("click", () => cancel("Stopped. You can adjust the headline or start a new take."));
  get("clip-headline").addEventListener("input", () => { if (!session) { stillRevision++; render(); } });
  get("save-still").addEventListener("click", () => {
    if (!ready || session || stillBusy) return;
    const revision = ++stillRevision; stillBusy = true; controls();
    const timeout = view.setTimeout(() => { if (revision === stillRevision) { stillRevision++; stillBusy = false; controls(); get("still-status").textContent = "Image export timed out. Please try again."; } }, 5000);
    const done = blob => {
      view.clearTimeout(timeout);
      if (revision !== stillRevision) return;
      stillBusy = false; controls();
      if (!blob?.size) { get("still-status").textContent = "The image could not be saved. Please try again."; return; }
      let url;
      try {
        url = view.URL.createObjectURL(blob); const link = root.createElement("a"); link.href = url; link.download = "musefloor-lantern-frame.png"; root.body.append(link); link.click(); link.remove();
        get("still-status").textContent = "PNG download requested. Nothing has been posted.";
      } catch { get("still-status").textContent = "The image download could not be started."; }
      if (url) view.setTimeout(() => view.URL.revokeObjectURL(url), 1000);
    };
    try { canvas.toBlob(done, "image/png"); } catch { done(null); }
  });
  root.addEventListener("visibilitychange", () => { if (root.hidden) cancel("Interrupted by leaving the tab. Start a new take when you return; incomplete recordings are discarded."); });
  view.addEventListener("pagehide", () => {
    cancel("Stopped after leaving the page."); stillRevision++; stillBusy = false; controls();
    get("recorded-video").pause();
    if (resultUrl) view.URL.revokeObjectURL(resultUrl);
    resultUrl = null; get("recorded-video").removeAttribute("src");get("download-clip").removeAttribute("href");get("clip-result").hidden = true;
  });
  get("recorded-video").addEventListener("error", () => { get("result-info").textContent = "This browser could not play the recorded file. Do not share it without checking it in a compatible player; try a new take or use PNG."; });
  let fontDeadline;
  try {
    await Promise.race([
      Promise.all([root.fonts.load('44px "Muse Pixel"'), root.fonts.load('18px "Muse Sans"')]),
      new Promise((_, reject) => { fontDeadline = view.setTimeout(() => reject(new Error("Font timeout")), 5000); }),
    ]);
  }
  catch { get("draft-note").textContent = "A fallback font is in use. Edits here do not change the outreach draft."; }
  finally { if (fontDeadline !== undefined) view.clearTimeout(fontDeadline); }
  ready = true; get("format-note").textContent = format ? `Video export: ${format.extension.toUpperCase()}. Check your publishing platform accepts this format.` : "Video recording is unavailable in this browser. Preview and PNG export still work.";
  controls(); render(); announce("Ready. Preview first, then record a take.");
}

if (typeof document !== "undefined") setupPromo(document);
