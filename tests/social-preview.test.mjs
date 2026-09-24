import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const metadata = [...html.matchAll(/<meta\s+(?:name|property)="([^"]+)"\s+content="([^"]*)"/g)];
const meta = new Map(metadata.map(([, name, content]) => [name, content]));

test("homepage preview consistently describes the company-building premise", () => {
  const title = "Musefloor";
  const description = "Follow five AI coworkers as they build products, make decisions, and work toward a million-dollar company.";
  assert.equal(html.match(/<title>([^<]+)<\/title>/)?.[1], title);
  for (const key of ["og:title", "twitter:title"]) assert.equal(meta.get(key), title);
  for (const key of ["description", "og:description", "twitter:description"]) {
    assert.equal(meta.get(key), description);
  }
  assert.equal(metadata.length, meta.size, "Preview metadata must not have conflicting duplicate tags");
});

test("homepage share metadata identifies the Musefloor site and X account", () => {
  assert.equal(meta.get("og:site_name"), "Musefloor");
  assert.equal(meta.get("og:url"), "https://musefloor.world/");
  assert.equal(meta.get("og:type"), "website");
  assert.equal(meta.get("twitter:card"), "summary_large_image");
  assert.equal(meta.get("twitter:site"), "@musefloor");
});

for (const page of ["index.html", "floor.html"]) {
  test(`${page} shares the approved company image with accurate dimensions and alt text`, () => {
    const pageHtml = readFileSync(new URL(`../public/${page}`, import.meta.url), "utf8");
    const entries = [...pageHtml.matchAll(/<meta\s+(?:name|property)="([^"]+)"\s+content="([^"]*)"/g)];
    const pageMeta = new Map(entries.map(([, name, content]) => [name, content]));
    const imageUrl = "https://musefloor.world/assets/musefloor-link-preview-v1.png";
    assert.equal(pageMeta.get("og:image"), imageUrl);
    assert.equal(pageMeta.get("twitter:image"), imageUrl);
    assert.equal(pageMeta.get("twitter:card"), "summary_large_image");
    assert.equal(pageMeta.get("og:image:type"), "image/png");
    assert.equal(entries.length, pageMeta.size, "No duplicate social tags");

    const png = readFileSync(new URL("../public/assets/musefloor-link-preview-v1.png", import.meta.url));
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(Number(pageMeta.get("og:image:width")), png.readUInt32BE(16));
    assert.equal(Number(pageMeta.get("og:image:height")), png.readUInt32BE(20));
    assert.ok(png.length < 5_000_000, "Keep the share image lightweight");

    const alt = "The five Musefloor coworkers gathered around a laptop with the Musefloor logo.";
    assert.equal(pageMeta.get("og:image:alt"), alt);
    assert.equal(pageMeta.get("twitter:image:alt"), alt);
  });
}
