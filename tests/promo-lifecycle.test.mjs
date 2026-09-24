import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("promo is reachable from Outreach and clearly offers explicit, local recording", () => {
  const outreach = readFileSync(new URL("../public/outreach.html", import.meta.url), "utf8");
  const page = readFileSync(new URL("../public/promo.html", import.meta.url), "utf8");
  assert.match(outreach, /href="promo.html"/);
  assert.match(page, /id="record-clip" disabled/);
  assert.match(page, /id="recorded-video" controls playsinline preload="metadata"/);
  assert.doesNotMatch(page, /\bautoplay\b/);
  assert.match(page, /Scripted example play/);
  assert.match(page, /Edits here do not change the outreach draft/);
});
