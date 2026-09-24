// An intentionally small game model, not a physical simulation of real stones.
export const clampStrength = (value) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

export function planThrow(value) {
  const strength = clampStrength(value);
  const skips = strength < 0.18 ? 0 : 1 + Math.floor((strength - 0.18) / 0.82 * 6);
  const weights = Array.from({ length: skips + 1 }, (_, i) => 0.67 ** i);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let time = 0;
  let progress = 0;
  const hops = weights.map((weight, i) => {
    const duration = Math.max(130, (620 + strength * 180) * 0.78 ** i);
    const hop = {
      start: time, end: time + duration,
      from: progress, to: progress + weight / total,
      height: (0.035 + strength * 0.11) * 0.64 ** i,
    };
    time = hop.end;
    progress = hop.to;
    return hop;
  });
  hops.at(-1).to = 1;
  return { strength, skips, hops, flightDuration: time, duration: time + 850 };
}

export function sampleThrow(plan, elapsed) {
  const time = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const landed = plan.hops.filter((hop) => time >= hop.end).length;
  const hop = plan.hops.find((item) => time < item.end);
  if (!hop) return { progress: 1, height: 0, skips: plan.skips, sunk: true, finished: time >= plan.duration };
  const t = Math.max(0, Math.min(1, (time - hop.start) / (hop.end - hop.start)));
  return {
    progress: hop.from + (hop.to - hop.from) * t,
    height: Math.sin(t * Math.PI) * hop.height,
    skips: Math.min(landed, plan.skips), sunk: false, finished: false,
  };
}

export function dragStrength(startY, currentY, height) {
  if (![startY, currentY, height].every(Number.isFinite) || height <= 0) return 0;
  const pull = currentY - startY;
  return pull < 8 ? 0 : clampStrength(pull / (height * 0.22));
}
