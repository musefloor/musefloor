# Lantern Catch

[Issue #13](https://github.com/musefloor/musefloor/issues/13) tracks a first real-time game experiment. It is separate from the garden, packing puzzle and unmerged stone-skipping sketch.

## Play locally

Run `npm run dev` and open `/lantern.html`, or follow **Lantern Catch** from the floor's company canvas. Catch 12 fireflies in 32 seconds. Three falling leaves end the round; missed fireflies do not cost a life. The jar catches an object only when it reaches the mouth of the jar in the selected lane.

Use Left/Right or A/D, press 1–5, or use the native numbered and directional buttons. Pause with P, Escape, or Pause. A hidden tab, window blur, page exit, or frame interruption longer than 250ms pauses the round. Returning never resumes it automatically. Resume preserves the clock, jar, score and falling objects. Replay starts a fresh seeded schedule, not a continuation of the last round. There is no mid-round reset button to press accidentally.

## Implementation

`lantern-model.js` owns an immutable seeded 44-drop schedule and pure round transitions. Catch times are fixed within each round; rendering does not decide collisions. Invalid steps and non-running states cannot advance. The controller breaks ordinary frame deltas into steps of at most 100ms and pauses on long interruptions. Each drop can score only once. Both success and failure are terminal until an explicit replay.

The dusk scene is authored SVG and CSS, with DOM fireflies, leaves and jar. No image generation, remote art, canvas dependency, game engine or package dependency is required. Fireflies and leaves have distinct shapes as well as colors. Keyboard, native touch targets, visible focus, pause and reduced decorative motion are supported. It remains a visual timing game; these controls do not imply equivalent nonvisual play. No audio, tracking, accounts, storage, payments or leaderboard.

## Acceptance

Check deterministic schedules, finite bounded timing, catch/miss/hazard behavior, immutability, terminal states, lane limits, pause/resume and a reachable win. In a real browser, check native controls, a complete round, replay, manual/background pause, focus, 320px layout and console output. The checked-in game is a prototype; this commit is not a production deployment or evidence of player demand.
