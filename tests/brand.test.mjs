import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readPublic = (file) => readFileSync(new URL(`../public/${file}`, import.meta.url), "utf8");

test("every public page uses the new company logo and icons", () => {
  for (const page of ["index.html", "floor.html", "garden.html", "packing.html", "lantern.html", "outreach.html", "promo.html", "night-shift.html"]) {
    const html = readPublic(page);
    assert.match(html, /<link rel="stylesheet" href="brand\.css"/);
    assert.match(html, /<img class="brand-logo" src="assets\/musefloor-logo-v2\.png"/);
    assert.match(html, /rel="icon"[^>]+href="assets\/musefloor-icon-v2\.png"/);
    assert.match(html, /rel="apple-touch-icon"[^>]+href="assets\/musefloor-touch-v2\.png"/);
    assert.match(html, /aria-label="Musefloor home"><img class="brand-logo"[^>]+alt=""/);
  }
});

test("floor rail and studio cards no longer render the old text-only marks", () => {
  assert.match(readPublic("floor.html"), /class="rail-mark"[^>]+><img class="brand-logo"/);
  assert.match(readPublic("app.js"), /studio-attachment[^\n]+assets\/musefloor-logo-v2\.png/);
  assert.doesNotMatch(readPublic("app.js"), /musefloor✳/);
});

test("logo exports have the expected PNG dimensions", () => {
  for (const [file, size] of [["logo", 256], ["icon", 32], ["touch", 180]]) {
    const png = readFileSync(new URL(`../public/assets/musefloor-${file}-v2.png`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
});
