import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readRoundLink, roundCode, roundLink } from "../public/lantern-links.js";
import { rules, makeDrops, newRound, retryRound } from "../public/lantern-model.js";

test("round links round-trip unsigned seed boundaries and representative patterns", () => {
  for (const seed of [0, 1, 42, 65535, 0x80000000, 0xffffffff]) {
    const url = new URL(roundLink(seed));
    assert.equal(url.origin, "https://musefloor.world");
    assert.equal(url.pathname, "/lantern.html");
    assert.deepEqual([...url.searchParams.keys()], ["round"]);
    assert.deepEqual(readRoundLink(url.search), { kind: "shared", seed });
    assert.deepEqual(newRound(readRoundLink(url.search).seed).drops, makeDrops(seed));
  }
});

test("missing codes are distinct from malformed, duplicate, or unsupported codes", () => {
  for (const search of ["", "?", "?utm_source=friend"]) assert.deepEqual(readRoundLink(search), { kind: "none" });
  for (const code of ["", "v1-1", "v1-123456789", "v2-0000002a", "v1-gggggggg", "v1--000002a", "v1-0000002a ", "<script>", "%", "NaN"]) {
    assert.deepEqual(readRoundLink(`?round=${encodeURIComponent(code)}`), { kind: "invalid" }, code);
  }
  for (const search of ["?round=v1-0000002a&round=v1-0000002a", "?round=v1-0000002a&round=", "?round=%E0%A4%A"]) {
    assert.deepEqual(readRoundLink(search), { kind: "invalid" });
  }
});

test("round links normalize case and do not carry arbitrary query parameters", () => {
  const parsed = readRoundLink("?name=someone&round=V1-ABCDEF12&score=999#unused");
  assert.deepEqual(parsed, { kind: "shared", seed: 0xabcdef12 });
  assert.equal(roundLink(parsed.seed), "https://musefloor.world/lantern.html?round=v1-abcdef12");
});

test("round-code generation rejects non-seeds rather than silently truncating", () => {
  for (const seed of [-1, 0x100000000, 1.5, NaN, Infinity, "42", null, undefined]) {
    assert.throws(() => roundCode(seed), RangeError);
  }
});

test("ready and retried rounds retain the normalized seed without transferring progress", () => {
  for (const [input, seed] of [[-1, 0xffffffff], [0x100000000, 0], [NaN, 1], [42, 42]]) {
    const state = newRound(input);
    assert.equal(state.seed, seed);
    const retry = retryRound({ ...state, status: "finished", caught: 12, leaves: 2, elapsed: 25, lane: 4 });
    assert.deepEqual(retry, state);
  }
});

test("v1 link meaning pins the complete reference schedule and its rules", () => {
  assert.deepEqual(rules, { lanes: 5, target: 12, duration: 32, maxLeaves: 3 });
  assert.equal(createHash("sha256").update(JSON.stringify(makeDrops(42))).digest("hex"),
    "392772d0d0dff7a0fac146981367f9b60a6c2773ef6e5635bd5a61b6a17afbc2");
});
