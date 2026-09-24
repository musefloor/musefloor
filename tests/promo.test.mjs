import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { promo, destination, cleanHeadline, defaultHeadline, makePromoFrames, frameAt, recordingFormat } from "../public/promo-model.js";
import { newRound, startRound, moveJar, advanceRound, visibleDrops, rules } from "../public/lantern-model.js";
import { setupPromo } from "../public/promo.js";
import { drawPromo } from "../public/promo-render.js";

test("promo frames reproduce actual model transitions from declared example inputs", () => {
  const frames = makePromoFrames(); assert.equal(frames.length, 301);
  assert.deepEqual(frames, makePromoFrames());
  let state = startRound(newRound(42));
  for (let i = 1; i <= 240; i++) {
    const next = state.drops.find(drop => drop.arrival > state.elapsed);
    state = moveJar(state, next.kind === "light" ? next.lane : (next.lane + 1) % rules.lanes);
    state = advanceRound(state, 1 / 30);
    assert.deepEqual(frames[i].state, state);
    assert.deepEqual(frames[i].drops, visibleDrops(state));
  }
  assert.equal(state.caught, 6); assert.equal(state.leaves, 0); assert.equal(state.status, "running");
  for (const frame of frames.slice(240)) { assert.equal(frame.endCard, true); assert.strictEqual(frame.state, frames[240].state); }
  assert.equal(frames[0].state.caught, 0);
});

test("frame selection is bounded and the link refers to the demonstrated pattern", () => {
  const frames = makePromoFrames();
  assert.equal(frameAt(frames, -1), frames[0]); assert.equal(frameAt(frames, Infinity), frames[0]);
  assert.equal(frameAt(frames, 100), frames[300]); assert.equal(frameAt(frames, 5), frames[150]);
  assert.equal(new URL(destination).searchParams.get("round"), "v1-0000002a");
});

test("headlines normalize whitespace, bound code points, and provide an empty fallback", () => {
  assert.equal(cleanHeadline(" \nHello   there\t"), "Hello there");
  assert.equal(cleanHeadline(""), defaultHeadline); assert.equal(cleanHeadline(null), defaultHeadline);
  assert.equal(Array.from(cleanHeadline("🌱".repeat(100))).length, 72);
});

test("recording format selection requires capture support and negotiates a real MIME", () => {
  const canvas = { captureStream() {} };
  assert.equal(recordingFormat(null, canvas), null);
  assert.equal(recordingFormat({ isTypeSupported: () => true }, {}), null);
  assert.equal(recordingFormat({ isTypeSupported: () => false }, canvas), null);
  assert.equal(recordingFormat({ isTypeSupported: () => true }, canvas).extension, "mp4");
  assert.equal(recordingFormat({ isTypeSupported: mime => mime === "video/webm;codecs=vp8" }, canvas).mime, "video/webm;codecs=vp8");
  assert.equal(recordingFormat({ isTypeSupported() { throw Error("unsupported"); } }, canvas), null);
});

async function fixture(options = {}) {
  let tickId = 0, timerId = 0, tracksStopped = 0, captures = 0, serial = 0;
  const ticks = new Map(), timers = new Map(), urls = [], revoked = [], recorders = [], downloads = [];
  const root = { hidden: false, listeners: {}, fonts: { load: async () => [] }, addEventListener(event, callback) { this.listeners[event] = callback; } };
  function node() { return { value: "", textContent: "", disabled: false, hidden: true, listeners: {}, attrs: {},
    addEventListener(event, fn) { this.listeners[event] = fn; }, pause() {}, removeAttribute(key) { delete this[key]; },
    click() { downloads.push(this.download); }, remove() {},
  }; }
  const html = readFileSync(new URL("../public/promo.html", import.meta.url), "utf8");
  const nodes = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(([, id]) => [id, node()]));
  const canvas = nodes["promo-canvas"]; canvas.getContext = () => ({});
  canvas.captureStream = () => { captures++; return { getTracks: () => [{ stop() { tracksStopped++; } }] }; };
  canvas.toBlob = options.toBlob || (callback => callback(new Blob(["png"], { type: "image/png" })));
  root.querySelector = selector => nodes[selector.slice(1)]; root.createElement = node; root.body = { append() {} };
  class Recorder {
    static isTypeSupported() { return !options.unsupported; }
    constructor(stream, config) {
      if (options.constructFail) throw Error("encoder");
      this.mimeType = config.mimeType; this.state = "inactive"; recorders.push(this);
    }
    start() { if (options.startFail) throw Error("start"); this.state = "recording"; }
    stop() { this.state = "inactive"; if (options.neverStops) return; this.ondataavailable?.({ data: new Blob(options.empty ? [] : ["clip"]) }); this.onstop?.(); }
  }
  const view = {
    MediaRecorder: Recorder, Blob,
    URL: { createObjectURL(blob) { const url = "blob:test-" + ++serial; urls.push({url,blob}); return url; }, revokeObjectURL(url) { revoked.push(url); } },
    requestAnimationFrame(fn) { ticks.set(++tickId, fn); return tickId; }, cancelAnimationFrame(id) { ticks.delete(id); },
    setTimeout(fn, delay) { timers.set(++timerId, { fn, delay }); return timerId; }, clearTimeout(id) { timers.delete(id); },
    listeners: {}, addEventListener(event, fn) { this.listeners[event] = fn; },
  };
  await setupPromo(root, view, { storage: () => ({ getItem: () => null }), draw() {} });
  const f = { nodes, root, view, recorders, urls, revoked, downloads, timers,
    get captures() { return captures; }, get tracksStopped() { return tracksStopped; },
    click(id) { if (!nodes[id].disabled) return nodes[id].listeners.click?.(); },
    tick(time) { const next = ticks.entries().next().value; if (next) { ticks.delete(next[0]); next[1](time); } },
    run() { for (let i = 0; i <= 300; i++) this.tick(i * 1000 / promo.fps); },
    timeout(delay) { const item = [...timers.entries()].find(([,t]) => t.delay === delay); if (item) { timers.delete(item[0]); item[1].fn(); } },
  };
  return f;
}

test("preview is explicit and runs without opening a recording stream", async () => {
  const f = await fixture(); assert.equal(f.captures, 0); assert.equal(f.nodes["cancel-clip"].disabled, true);
  f.click("preview-clip"); assert.equal(f.nodes["clip-headline"].disabled, true); f.run();
  assert.equal(f.captures, 0); assert.match(f.nodes["clip-status"].textContent, /Preview complete/);
  assert.equal(f.nodes["clip-progress"].value, 10); assert.equal(f.nodes["clip-headline"].disabled, false);
});

test("a complete recording offers the actual blob and disposes replaced URLs", async () => {
  const f = await fixture(); f.click("record-clip"); f.run();
  assert.equal(f.nodes["clip-result"].hidden, false); assert.equal(f.nodes["download-clip"].download, "musefloor-lantern-promo.mp4");
  assert.equal(f.nodes["download-clip"].href, f.nodes["recorded-video"].src); assert.equal(f.urls[0].blob.type, "video/mp4;codecs=avc1.42001e");
  assert.ok(f.tracksStopped > 0); assert.equal(f.timers.size, 0);
  f.click("record-clip"); f.run(); assert.deepEqual(f.revoked, ["blob:test-1"]);
  f.view.listeners.pagehide(); assert.deepEqual(f.revoked, ["blob:test-1", "blob:test-2"]); assert.equal(f.nodes["clip-result"].hidden, true);
});

test("cancel, hidden-tab, frame stalls and timeout never offer partial takes", async () => {
  for (const interrupt of [f => f.click("cancel-clip"), f => { f.root.hidden = true; f.root.listeners.visibilitychange(); }, f => { f.tick(0); f.tick(600); }, f => f.timeout(15000)]) {
    const f = await fixture(); f.click("record-clip"); interrupt(f);
    assert.equal(f.urls.length, 0); assert.equal(f.nodes["record-clip"].disabled, false); assert.ok(f.tracksStopped > 0);
  }
});

test("unexpected early stop, empty output, encoder failure and finalization timeout are explicit", async () => {
  for (const options of [{ constructFail: true }, { startFail: true }, { empty: true }, { neverStops: true }, {}]) {
    const f = await fixture(options); f.click("record-clip");
    if (!Object.keys(options).length) f.recorders[0].stop(); else f.run();
    if (options.neverStops) f.timeout(5000);
    assert.equal(f.urls.length, 0); assert.equal(f.nodes["record-clip"].disabled, false); assert.ok(f.tracksStopped > 0);
    assert.match(f.nodes["clip-status"].textContent, /unavailable|empty|early|could not finish/);
  }
});

test("unsupported video retains preview and PNG; double PNG export is guarded", async () => {
  let callback; const f = await fixture({ unsupported: true, toBlob: cb => { callback = cb; } });
  assert.equal(f.nodes["record-clip"].disabled, true); assert.equal(f.nodes["preview-clip"].disabled, false);
  f.click("save-still"); assert.equal(f.nodes["clip-headline"].disabled, true); assert.equal(f.nodes["save-still"].disabled, true);
  callback(new Blob(["png"])); assert.deepEqual(f.downloads, ["musefloor-lantern-frame.png"]); assert.equal(f.nodes["clip-headline"].disabled, false);
  f.timeout(1000); assert.deepEqual(f.revoked, ["blob:test-1"]);
});

test("late PNG callbacks cannot unlock or download over a newer export", async () => {
  const callbacks = []; const f = await fixture({ toBlob: cb => callbacks.push(cb) });
  f.click("save-still"); f.timeout(5000); f.click("save-still"); callbacks[0](new Blob(["old"]));
  assert.equal(f.nodes["save-still"].disabled, true); assert.equal(f.urls.length, 0);
  callbacks[1](null); assert.match(f.nodes["still-status"].textContent, /could not be saved/); assert.equal(f.nodes["save-still"].disabled, false);
});

test("canvas headlines remain bounded and user text is only drawn, never executed", () => {
  const labels = []; const ctx = { font:"", fillText(text) { labels.push(text); }, measureText(text) { return { width: Array.from(text).length * Number.parseInt(this.font) }; }, createLinearGradient() { return { addColorStop() {} }; } };
  for (const method of ["clearRect","fillRect","beginPath","roundRect","fill","arc","moveTo","quadraticCurveTo","lineTo","stroke","setLineDash","save","translate","ellipse","rotate","restore"]) ctx[method] = () => {};
  drawPromo(ctx, makePromoFrames()[150], "W".repeat(72));
  assert.equal(labels.filter(text => /^W+$/.test(text)).join(""), "W".repeat(72));
  assert.ok(labels.includes("Scripted example play"));
  const source = readFileSync(new URL("../public/promo.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /getUserMedia|getDisplayMedia|fetch\(|innerHTML|sendBeacon/);
});
