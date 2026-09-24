# Lantern Catch

[Issue #13](https://github.com/musefloor/musefloor/issues/13) tracks a first real-time game experiment. It is separate from the garden, packing puzzle and unmerged stone-skipping sketch.

## Play locally

Run `npm run dev` and open `/lantern.html`, or follow **Lantern Catch** from the floor's company canvas. Catch 12 fireflies in 32 seconds. Three falling leaves end the round; missed fireflies do not cost a life. The jar catches an object only when it reaches the mouth of the jar in the selected lane.

Use Left/Right or A/D, press 1–5, or use the native numbered and directional buttons. Pause with P, Escape, or Pause. A hidden tab, window blur, page exit, or frame interruption longer than 250ms pauses the round. Returning never resumes it automatically. Resume preserves the clock, jar, score and falling objects.

After any ending, **Retry this round** keeps the exact immutable drop schedule and resets the timer, jar position, score, leaves and last-catch feedback. **New round** creates a fresh seeded schedule. Neither restarts automatically or is offered mid-round or while paused. This practice option is tracked in [issue #15](https://github.com/musefloor/musefloor/issues/15). Scores and in-progress rounds are not saved across a page refresh.

## Round links

[Issue #21](https://github.com/musefloor/musefloor/issues/21) adds **Copy round link** below the game. The versioned URL contains only a 32-bit seed, for example `?round=v1-0000002a`. Opening it recreates that exact firefly/leaf schedule with a full clock and empty jar, and waits for Start. It carries no scores, names, or saved progress.

Copy is available before play, while paused, or after a round ends. If clipboard access is missing or denied, the readonly link stays available for manual selection. Copying never submits a social post, opens an account, or sends game data to a service. A late clipboard response cannot move focus out of an active game.

Retry retains the link. New round generates a different pattern and updates the copy field. The address bar is not rewritten: reloading an original shared URL returns to its original pattern. Malformed, repeated, or unsupported round codes show a notice and prepare a fresh pattern without starting it.

`v1` pins the current generator, lane count, goal, hazards, and timing. A future change to these rules must retain v1 behavior or explicitly reject those links, not silently reuse their version for different rounds. A reference-schedule hash and rule fixture guard that compatibility. Round links were [published on September 24, 2026](../releases/lantern-round-links.md). [Try a shared round](https://musefloor.world/lantern.html?round=v1-0000002a).

Verification for this change: all 115 project tests pass. Tests cover seed boundaries, malformed/duplicate codes, full controller traces, clipboard denial/unavailability, pending-copy races, and focus preservation. Browser checks covered shared-link readiness, keyboard Copy feedback, a complete round and matching retry result, paused copying, New round changing the link, refresh, invalid-link fallback, and back/forward navigation. At 320px there was no horizontal page overflow and the Copy button remained 44px high. No warning/error browser logs were observed. Clipboard failure paths were exercised by controller tests rather than changing browser permissions.

## Implementation

`lantern-model.js` owns an immutable seeded 44-drop schedule and pure round transitions. Catch times are fixed within each round; rendering does not decide collisions. Invalid steps and non-running states cannot advance. The controller breaks ordinary frame deltas into steps of at most 100ms and pauses on long interruptions. Each drop can score only once. Both success and failure are terminal until an explicit replay.

The dusk scene is authored SVG and CSS, with DOM fireflies, leaves and jar. No image generation, remote art, canvas dependency, game engine or package dependency is required. Fireflies and leaves have distinct shapes as well as colors. Keyboard, native touch targets, visible focus, pause and reduced decorative motion are supported. It remains a visual timing game; these controls do not imply equivalent nonvisual play. No audio, tracking, accounts, storage, payments or leaderboard.

## Acceptance

Check deterministic schedules, finite bounded timing, catch/miss/hazard behavior, immutability, terminal states, lane limits, pause/resume and a reachable win. In a real browser, check native controls, a complete round, replay, manual/background pause, focus, 320px layout and console output. The checked-in game is a prototype; this commit is not a production deployment or evidence of player demand.
