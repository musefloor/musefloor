import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { makePostKit, setupPostKit } from "../public/promo-post.js";
import { defaultHeadline, destination } from "../public/promo-model.js";

const first = () => makePostKit("A little light", "test-1", "mp4");
function fixture(options = {}) {
  const html = readFileSync(new URL("../public/promo.html", import.meta.url), "utf8");
  const nodes = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(([, id]) => [id, { value: "", disabled: false, textContent: "", listeners: {}, addEventListener(event, fn) { this.listeners[event] = fn; } }]));
  let serial = 0, timerId = 0, removed = 0;
  const timers = new Map(), urls = [], revoked = [], downloads = [], writes = [];
  const root = {
    querySelector: selector => nodes[selector.slice(1)], body: { append() {} },
    createElement() { return { click() { if (options.downloadFails) throw Error("download denied"); downloads.push({ href: this.href, filename: this.download }); }, remove() { removed++; } }; },
  };
  const view = {
    Blob,
    navigator: options.noClipboard ? {} : { clipboard: { writeText(text) { writes.push(text); return options.write ? options.write(text) : Promise.resolve(); } } },
    URL: { createObjectURL(blob) { if (options.blobFails) throw Error("blob unavailable"); const url = `blob:test-${++serial}`; urls.push({ url, blob }); return url; }, revokeObjectURL(url) { revoked.push(url); } },
    setTimeout(fn, delay) { timers.set(++timerId, { fn, delay }); return timerId; }, clearTimeout(id) { timers.delete(id); },
  };
  if (options.clipboardGetterFails) Object.defineProperty(view.navigator, "clipboard", { get() { throw Error("blocked"); } });
  const kit = setupPostKit(root, view);
  return { kit, nodes, view, timers, urls, revoked, downloads, writes, get removed() { return removed; },
    click(id) { if (!nodes[id].disabled) return nodes[id].listeners.click(); },
    timeout(delay) { const timer = [...timers].find(([, value]) => value.delay === delay); if (timer) { timers.delete(timer[0]); timer[1].fn(); } },
  };
}

test("post kit binds normalized headline, exact round link and safe matching filenames", () => {
  for (const extension of ["mp4", "webm"]) {
    const kit = makePostKit(" \nA little   light  ", "take-42", extension);
    assert.equal(kit.headline, "A little light"); assert.ok(Object.isFrozen(kit));
    assert.ok(kit.caption.endsWith(destination)); assert.match(kit.description, /scripted example/);
    assert.ok(kit.text.includes(`Video: ${kit.basename}.${extension}`));
    assert.ok(kit.text.includes(kit.caption)); assert.ok(kit.text.includes(kit.description));
  }
  assert.equal(makePostKit("", "take", "mp4").headline, defaultHeadline);
  assert.equal(Array.from(makePostKit("🌱".repeat(100), "take", "mp4").headline).length, 72);
});

test("invalid take identifiers and extensions cannot become export paths", () => {
  for (const id of [undefined, null, 42, "", "../secret", "bad\nname", "take\n", "x".repeat(65)]) assert.throws(() => makePostKit("hi", id, "mp4"));
  for (const ext of ["exe", "../mp4", null]) assert.throws(() => makePostKit("hi", "take", ext));
});

test("post notes are absent and inert until a completed take is supplied", () => {
  const f = fixture(); f.click("copy-caption"); f.click("download-post-notes");
  assert.deepEqual(f.writes, []); assert.deepEqual(f.downloads, []);
  f.kit.show(first()); assert.equal(f.nodes["post-caption"].value, first().caption);
  assert.equal(f.nodes["post-description"].value, first().description); assert.equal(f.nodes["copy-caption"].disabled, false);
});

test("copy confirms only the requested successful clipboard write", async () => {
  const f = fixture(); f.kit.show(first()); await f.click("copy-caption");
  assert.deepEqual(f.writes, [first().caption]); assert.match(f.nodes["post-status"].textContent, /Caption copied/);
  await f.click("copy-description"); assert.equal(f.writes.at(-1), first().description);
  assert.match(f.nodes["post-status"].textContent, /Visual description copied/); assert.equal(f.timers.size, 0);
});

test("unavailable, throwing and rejected clipboard writes offer manual text fallback", async () => {
  for (const options of [{ noClipboard: true }, { clipboardGetterFails: true }, { write: () => Promise.reject(Error("denied")) }]) {
    const f = fixture(options); f.kit.show(first()); await f.click("copy-caption");
    assert.match(f.nodes["post-status"].textContent, /not confirmed/);
    assert.equal(f.nodes["post-caption"].value, first().caption); assert.equal(f.nodes["copy-caption"].disabled, false);
  }
});

test("copy timeout and late completion cannot confirm or unlock a newer operation", async () => {
  const resolve = []; const f = fixture({ write: () => new Promise(done => resolve.push(done)) });
  f.kit.show(first()); const old = f.click("copy-caption");
  f.click("copy-description"); assert.equal(f.writes.length, 1); f.timeout(5000);
  assert.match(f.nodes["post-status"].textContent, /not confirmed/);
  const newer = f.click("copy-description"); resolve[0](); await old;
  assert.equal(f.nodes["copy-caption"].disabled, true); assert.equal(f.nodes["post-status"].textContent, "Copying…");
  resolve[1](); await newer; assert.match(f.nodes["post-status"].textContent, /Visual description copied/);
});

test("take replacement and page-exit cleanup ignore pending copy feedback", async () => {
  for (const clear of [false, true]) {
    let resolve; const f = fixture({ write: () => new Promise(done => { resolve = done; }) });
    f.kit.show(first()); const pending = f.click("copy-caption");
    if (clear) f.kit.clear(); else f.kit.show(makePostKit("Next take", "test-2", "webm"));
    const status = f.nodes["post-status"].textContent; resolve(); await pending;
    assert.equal(f.nodes["post-status"].textContent, status); assert.equal(f.timers.size, 0);
    assert.equal(f.nodes["copy-caption"].disabled, clear);
  }
});

test("download contains the exact kit text and releases its temporary URL", async () => {
  const f = fixture(); f.kit.show(first()); f.click("download-post-notes");
  assert.deepEqual(f.downloads, [{ href: f.urls[0].url, filename: `${first().basename}.txt` }]);
  assert.equal(f.urls[0].blob.type, "text/plain;charset=utf-8"); assert.equal(await f.urls[0].blob.text(), first().text);
  assert.equal(f.removed, 1); f.timeout(1000); assert.deepEqual(f.revoked, [f.urls[0].url]);
  f.click("download-post-notes"); f.kit.clear(); assert.equal(f.revoked.length, 2); assert.equal(f.timers.size, 0);
});

test("download failures leave manual copy available and clean up inserted links", () => {
  for (const options of [{ downloadFails: true }, { blobFails: true }]) {
    const f = fixture(options); f.kit.show(first()); f.click("download-post-notes");
    assert.match(f.nodes["post-status"].textContent, /could not be started/);
    assert.equal(f.nodes["post-caption"].value, first().caption);
    f.kit.clear(); assert.equal(f.revoked.length, f.urls.length);
  }
});

test("user headlines remain plain text and copy fields are read-only and labelled", () => {
  const f = fixture(), kit = makePostKit('<img src=x onerror="alert(1)">', "test-1", "mp4");
  f.kit.show(kit); assert.equal(f.nodes["post-caption"].value, kit.caption);
  const source = readFileSync(new URL("../public/promo-post.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /innerHTML|fetch\(|sendBeacon|localStorage|window\.open/);
  const html = readFileSync(new URL("../public/promo.html", import.meta.url), "utf8");
  for (const field of ["post-caption", "post-description"]) {
    assert.ok(html.includes(`for="${field}"`)); assert.ok(html.includes(`id="${field}" readonly`));
  }
});
