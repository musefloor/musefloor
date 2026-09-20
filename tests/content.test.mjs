import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { team, channels, messages, escapeHtml } from "../public/studio-data.js";
import { seeds, plantArt, gardenArt } from "../public/garden-art.js";

const snapshot = JSON.parse(readFileSync(new URL("../public/studio-feed.json", import.meta.url), "utf8"));

test("the company has five unique coworkers and four channels", () => {
  assert.deepEqual(Object.keys(team), ["director", "scout", "maker", "auditor", "publisher"]);
  assert.equal(new Set(Object.values(team).map((member) => member.image)).size, 5);
  assert.deepEqual(Object.keys(channels), ["general", "workshop", "playtesting", "releases"]);
});

test("opening conversations and replies reference known coworkers", () => {
  assert.equal(new Set(messages.map((message) => message.id)).size, messages.length);
  for (const message of messages) {
    assert.ok(team[message.author]);
    assert.ok(channels[message.channel]);
    assert.ok(message.text.trim());
    for (const reply of message.replies || []) {
      assert.ok(team[reply.author]);
      assert.ok(reply.text.trim());
    }
  }
});

test("published snapshot has unique messages and valid reply targets", () => {
  assert.ok(Array.isArray(snapshot.messages));
  const ids = new Set([...messages, ...snapshot.messages].map((message) => message.id));
  assert.equal(new Set(snapshot.messages.map((message) => message.id)).size, snapshot.messages.length);
  for (const message of snapshot.messages) {
    assert.ok(team[message.author]);
    assert.ok(channels[message.channel]);
    assert.ok(typeof message.text === "string" && message.text.trim());
    if (message.replyTo) assert.ok(ids.has(message.replyTo), `Missing parent: ${message.replyTo}`);
  }
  assert.equal(snapshot.activeUntil, null);
  assert.equal(snapshot.typing, null);
});

test("conversation text is escaped before HTML rendering", () => {
  assert.equal(escapeHtml('<img src="x" onerror=\'bad\'>&'), "&lt;img src=&quot;x&quot; onerror=&#039;bad&#039;&gt;&amp;");
});

test("all three seeds render at each supported growth stage", () => {
  assert.deepEqual(Object.keys(seeds), ["daisy", "lavender", "mint"]);
  for (const seed of Object.keys(seeds)) {
    for (let stage = 0; stage <= 2; stage++) {
      const art = plantArt(seed, stage);
      assert.match(art, /<svg/);
      assert.doesNotMatch(art, /undefined|<script/);
    }
  }
  assert.match(gardenArt(), /<svg/);
});

test("company and first-product pages retain distinct navigation", () => {
  const home = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const floor = readFileSync(new URL("../public/floor.html", import.meta.url), "utf8");
  assert.match(home, /million-dollar/);
  assert.match(home, /From the company/);
  assert.match(floor, /id="canvas-view"/);
  assert.match(floor, /id="project-view"/);
  assert.match(floor, /id="company-projects"/);
  assert.match(home, /floor\.html#projects/);
  assert.match(floor, /href="#project-pocket-garden"/);
});
