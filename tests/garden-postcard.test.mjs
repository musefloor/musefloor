import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gardenArt } from "../public/garden-art.js";
import { postcardSvg, postcardSize } from "../public/garden-postcard.js";

const plotLabels = (svg) => [...svg.matchAll(/<title>(.*?)<\/title>/g)].map((match) => match[1]);

test("the default company illustration still contains nine mature plants", () => {
  const labels = plotLabels(gardenArt());
  assert.equal(labels.length, 9);
  assert.ok(labels.every((label) => label.endsWith("in bloom")));
  assert.equal(labels[0], "Plot 1: Lavender, in bloom");
});

test("a postcard preserves plot positions, empty plots, and every growth stage", () => {
  const plots = [{ type: "daisy", stage: 0 }, null, { type: "mint", stage: 1 },
    { type: "lavender", stage: 2 }, null, null, null, null, { type: "daisy", stage: 2 }];
  const before = structuredClone(plots);
  const labels = plotLabels(postcardSvg(plots));
  assert.equal(labels.length, 9);
  assert.equal(labels[0], "Plot 1: Daisy, seed");
  assert.equal(labels[1], "Plot 2: empty");
  assert.equal(labels[2], "Plot 3: Mint, sprout");
  assert.equal(labels[3], "Plot 4: Lavender, in bloom");
  assert.equal(labels[8], "Plot 9: Daisy, in bloom");
  assert.deepEqual(plots, before);
});

test("empty or missing input never exports the decorative demo garden", () => {
  for (const value of [undefined, null, {}, [], Array(9).fill(null)]) {
    const labels = plotLabels(postcardSvg(value));
    assert.equal(labels.length, 9);
    assert.ok(labels.every((label) => label.endsWith(": empty")));
  }
});

test("invalid and hostile saved records cannot inject postcard markup", () => {
  const svg = postcardSvg([{ type: '<script>alert(1)</script>', stage: 2 },
    { type: "__proto__", stage: 2 }, { type: "daisy", stage: -1 },
    { type: "mint", stage: 3 }, { type: "lavender", stage: "2" }]);
  assert.ok(plotLabels(svg).every((label) => label.endsWith(": empty")));
  assert.doesNotMatch(svg, /<script|alert\(|__proto__/);
});

test("the export is deterministic, self-contained, and limited to nine plots", () => {
  const plots = Array(12).fill({ type: "mint", stage: 2 });
  const svg = postcardSvg(plots);
  assert.equal(svg, postcardSvg(plots));
  assert.equal(plotLabels(svg).length, 9);
  assert.deepEqual(postcardSize, { width: 1200, height: 960 });
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="1200" height="960"/);
  assert.doesNotMatch(svg, /<image|<foreignObject|<script|href=|url\(/);
});

test("postcard UI has an explicit download, a labeled dialog, and keyboard dismissal", () => {
  const html = readFileSync(new URL("../public/garden.html", import.meta.url), "utf8");
  const js = readFileSync(new URL("../public/garden.js", import.meta.url), "utf8");
  assert.match(html, /id="postcard">Save a postcard/);
  assert.match(html, /id="postcard-dialog" aria-labelledby="postcard-title"/);
  assert.match(html, /download="musefloor-pocket-garden\.png"/);
  assert.match(js, /resetDialog\.open \|\| postcardDialog\.open/);
  assert.match(js, /postcardButton\.disabled = true/);
  assert.match(js, /postcardButton\.disabled = false/);
});
