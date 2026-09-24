import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planThrow, sampleThrow, dragStrength, clampStrength } from "../public/pond-physics.js";

test("strength is finite, bounded, and never coerces untrusted values", () => {
  for (const value of [NaN, Infinity, -Infinity, undefined, null, "1", {}]) assert.equal(clampStrength(value), 0);
  assert.equal(clampStrength(-10), 0); assert.equal(clampStrength(9), 1);
});
test("weak throws sink and stronger throws never lose skips", () => {
  assert.equal(planThrow(0).skips, 0); assert.equal(planThrow(.17).skips, 0);
  assert.equal(planThrow(.18).skips, 1); assert.equal(planThrow(1).skips, 7);
  let previous = 0;
  for (let i = 0; i <= 100; i++) {
    const plan = planThrow(i / 100);
    assert.ok(plan.skips >= previous && plan.skips <= 7);
    previous = plan.skips;
  }
});
test("every plan has shrinking hops, positive durations, and one final sink", () => {
  for (let p = 0; p <= 100; p++) {
    const plan = planThrow(p / 100);
    assert.equal(plan.hops.length, plan.skips + 1);
    assert.equal(plan.hops[0].from, 0); assert.equal(plan.hops.at(-1).to, 1);
    assert.ok(plan.duration < 5000);
    for (const [i, hop] of plan.hops.entries()) {
      assert.ok(hop.end > hop.start && hop.to > hop.from);
      if (i) {
        const before = plan.hops[i - 1];
        assert.equal(hop.from, before.to); assert.equal(hop.start, before.end);
        assert.ok(hop.height < before.height);
        assert.ok(hop.end - hop.start <= before.end - before.start + 1e-9);
      }
    }
  }
});
test("sampling is deterministic and continuous at water contacts", () => {
  const plan = planThrow(.72);
  assert.deepEqual(sampleThrow(plan, -10), sampleThrow(plan, 0));
  assert.deepEqual(sampleThrow(plan, NaN), sampleThrow(plan, 0));
  for (const [i, hop] of plan.hops.entries()) {
    const contact = sampleThrow(plan, hop.end);
    assert.ok(Math.abs(contact.progress - hop.to) < 1e-9);
    assert.ok(Math.abs(contact.height) < 1e-9);
    assert.equal(contact.skips, Math.min(i + 1, plan.skips));
  }
  assert.equal(sampleThrow(plan, plan.duration).finished, true);
  assert.equal(sampleThrow(plan, plan.duration + 999).sunk, true);
});
test("all throw samples remain within the renderable domain", () => {
  for (let p = 0; p <= 10; p++) {
    const plan = planThrow(p / 10);
    for (let t = 0; t <= plan.duration + 100; t += 17) {
      const state = sampleThrow(plan, t);
      assert.ok(state.progress >= 0 && state.progress <= 1);
      assert.ok(state.height >= 0 && state.height < .2);
      assert.ok(state.skips >= 0 && state.skips <= plan.skips);
    }
  }
});
test("drag requires a deliberate downward pull and caps strength", () => {
  assert.equal(dragStrength(100, 90, 400), 0);
  assert.equal(dragStrength(100, 107, 400), 0);
  assert.equal(dragStrength(100, 144, 400), .5);
  assert.equal(dragStrength(100, 999, 400), 1);
  assert.equal(dragStrength(100, 120, 0), 0);
  assert.equal(dragStrength(NaN, 120, 400), 0);
});
test("the prototype has keyboard controls, a live result, and no new persistence", () => {
  const html = readFileSync(new URL("../public/pond.html", import.meta.url), "utf8");
  const js = readFileSync(new URL("../public/pond.js", import.meta.url), "utf8");
  assert.match(html, /for="strength"/); assert.match(html, /type="range"/);
  assert.match(html, /id="throw-button" type="submit"/); assert.match(html, /aria-live="polite"/);
  assert.match(html, /Playable sketch/); assert.match(html, /floor\.html#projects/);
  assert.match(js, /prefers-reduced-motion/); assert.match(js, /pointercancel/); assert.match(js, /visibilitychange/);
  assert.doesNotMatch(js, /localStorage|sessionStorage|fetch\(|Math\.random/);
});
