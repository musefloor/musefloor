// v1 identifies the current drop generator, rules and timing. Keep that meaning
// stable if a later game version introduces a different pattern format.
export function readRoundLink(search = "") {
  const codes = new URLSearchParams(search).getAll("round");
  if (!codes.length) return { kind: "none" };
  if (codes.length !== 1 || !/^v1-[0-9a-f]{8}$/i.test(codes[0])) return { kind: "invalid" };
  return { kind: "shared", seed: Number.parseInt(codes[0].slice(3), 16) };
}

export function roundCode(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError("Round seed must be an unsigned 32-bit integer.");
  return `v1-${seed.toString(16).padStart(8, "0")}`;
}

export function roundLink(seed) {
  return `https://musefloor.world/lantern.html?round=${roundCode(seed)}`;
}
