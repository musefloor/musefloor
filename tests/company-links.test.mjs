import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

for (const page of ["index.html", "floor.html", "garden.html"]) {
  test(`${page} links to the official Musefloor social and source profiles`, () => {
    const html = readFileSync(new URL(`../public/${page}`, import.meta.url), "utf8");
    const nav = html.match(/<nav class="company-links[^>]*>[\s\S]*?<\/nav>/)?.[0];
    assert.ok(nav, "Company links have a navigation landmark");
    assert.match(nav, /aria-label="Musefloor links"/);

    const anchors = [...nav.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(([anchor]) => anchor);
    for (const [name, url] of [
      ["X", "https://x.com/musefloor"],
      ["GitHub", "https://github.com/musefloor/musefloor"],
    ]) {
      const matches = anchors.filter((anchor) => anchor.includes(`href="${url}"`));
      assert.equal(matches.length, 1, `Exactly one ${name} link in the navigation`);
      assert.match(matches[0], /target="_blank"/);
      assert.match(matches[0], /rel="noopener noreferrer"/);
      assert.ok(matches[0].includes(`aria-label="Musefloor on ${name} (opens in a new tab)"`));
    }
  });
}

test("homepage exposes both social links in its top navigation", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const header = html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0];
  assert.ok(header, "Homepage has a site header");
  assert.match(header, /<nav class="header-socials" aria-label="Musefloor social links">/);
  for (const url of ["https://x.com/musefloor", "https://github.com/musefloor/musefloor"]) {
    assert.ok(header.includes(`href="${url}" target="_blank" rel="noopener noreferrer"`));
  }
});
