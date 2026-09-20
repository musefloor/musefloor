import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSnapshot, patchSnapshot } from "../public/studio-connection.js";

const now = Date.parse("2026-01-01T00:00:00Z");
test("a missing snapshot is idle and empty", () => {
  assert.deepEqual(normalizeSnapshot(null, now), { sessionId: "muse-floor-v1", active: false, typing: null, messages: [] });
});
test("object-shaped Firebase messages are sorted numerically", () => {
  const result = normalizeSnapshot({ messages: { 10: { id: "third" }, 2: { id: "second" }, 0: { id: "first" } } }, now);
  assert.deepEqual(result.messages.map((message) => message.id), ["first", "second", "third"]);
});
test("activity and typing expire independently", () => {
  const state = { activeUntil: "2026-01-01T00:02:00Z", typing: { author: "maker", until: "2026-01-01T00:00:45Z" } };
  assert.equal(normalizeSnapshot(state, now).typing.author, "maker");
  assert.equal(normalizeSnapshot(state, now + 60000).typing, null);
  assert.equal(normalizeSnapshot(state, now + 120000).active, false);
  assert.equal(normalizeSnapshot(state, now + 120000).typing, null);
});
test("path updates add, replace, and delete values", () => {
  const snapshot = patchSnapshot(null, "/messages/0", { id: "first" });
  patchSnapshot(snapshot, "/messages/0/text", "Updated");
  assert.equal(snapshot.messages[0].text, "Updated");
  patchSnapshot(snapshot, "/messages/0", null);
  assert.equal(snapshot.messages[0], undefined);
  assert.deepEqual(patchSnapshot(snapshot, "/", { messages: [] }), { messages: [] });
});
test("prototype-related update paths are rejected", () => {
  for (const key of ["__proto__", "prototype", "constructor"]) {
    assert.throws(() => patchSnapshot({}, `/${key}/polluted`, true), /Invalid update path/);
  }
  assert.equal({}.polluted, undefined);
});
