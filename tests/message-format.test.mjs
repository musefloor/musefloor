import test from "node:test";
import assert from "node:assert/strict";
import { richText } from "../public/message-format.js";

const commit = "https://github.com/musefloor/musefloor/commit/" + "a".repeat(40);
test("real repository references become clickable with safe new-tab attributes", () => {
  const html = richText(`Built it.\n${commit}`);
  assert.ok(html.includes(`href="${commit}"`));
  assert.match(html, /Commit aaaaaaa ↗/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /<br>/);
});
test("issues and pull requests keep their correct labels", () => {
  assert.match(richText("https://github.com/musefloor/musefloor/pull/3"), /Pull request #3/);
  assert.match(richText("https://github.com/musefloor/musefloor/issues/4"), /Issue #4/);
});
test("HTML and unsafe links remain inert text", () => {
  const html = richText(`<img src=x onerror=alert(1)> javascript:alert(1) ${commit}\" onclick=\"bad`);
  assert.doesNotMatch(html, /<img|href="javascript:|onclick="/);
  assert.match(html, /&lt;img/);
  assert.match(html, /&quot;/);
});
test("other hosts and lookalike repositories are not promoted to links", () => {
  assert.doesNotMatch(richText(commit.replace("github.com", "github.com.evil.test")), /<a /);
  assert.doesNotMatch(richText(commit.replace("/musefloor/commit", "/musefloor-fake/commit")), /<a /);
});
test("mentions and channels still work around repository links", () => {
  const html = richText(`@Maker put this in #workshop: ${commit}.`);
  assert.match(html, /href="#member-maker"/);
  assert.match(html, /href="#workshop"/);
  assert.ok(html.endsWith("</a>."));
});

test("published games receive explicit play links and retain surrounding punctuation", () => {
  const html = richText("Try (https://musefloor.world/packing.html). Then https://musefloor.world/garden.html! And https://musefloor.world/lantern.html.");
  assert.match(html, /href="https:\/\/musefloor.world\/packing.html"/);
  assert.match(html, /Play Pack a little picnic ↗<\/a>\)\./);
  assert.match(html, /Play Pocket Garden ↗<\/a>!/);
  assert.match(html, /href="https:\/\/musefloor.world\/lantern.html"/);
  assert.match(html, /Play Lantern Catch ↗<\/a>\./);
  assert.match(html, /rel="noopener noreferrer"/);
});

test("product lookalikes, unsupported pages, query strings, and URL suffixes stay inert", () => {
  for (const url of ["https://musefloor.world.evil.test/packing.html", "https://musefloor.world/packing.html.evil",
    "https://musefloor.world/packing.html?next=evil", "https://musefloor.world/admin", commit + "/unexpected",
    "https://musefloor.world.evil.test/lantern.html", "https://musefloor.world/lantern.html.evil", "https://musefloor.world/lantern.html?next=evil"]) {
    assert.doesNotMatch(richText(url), /<a /);
  }
});
