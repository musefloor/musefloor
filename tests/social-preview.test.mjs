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
  assert.equal(meta.get("twitter:card"), "summary");
  assert.equal(meta.get("twitter:site"), "@musefloor");
});
