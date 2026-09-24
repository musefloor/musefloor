# Night Shift

[Issue #29](https://github.com/musefloor/musefloor/issues/29) is a new game experiment, independent of the promo tools and earlier games. The first prototype is [live](https://musefloor.world/night-shift.html); see the [release record](../releases/night-shift.md).

Run `npm run dev` and open `/night-shift.html`.

## The game

Rotate straight and corner conveyor pieces on a four-by-four sorting desk. Connect the marked entrance to the parcel's labelled exit, then press Dispatch. A small parcel follows those connections. A loose end or wrong exit leaves a visible trace and a text explanation; adjust the route and try again. There is no countdown or lost-life penalty.

Three authored boards form the first shift: a box of bulbs for a shop, a forgotten book for a station, and a late birthday present. The known solution paths use five, nine, and thirteen tiles. Other valid connections to the correct exit are accepted. All boards begin unsolved. The manifest records these fictional in-game deliveries only, not real company activity.

## Controls and state

- Click or tap a tile to rotate clockwise. Straight pieces have two visually distinct orientations; four turns return any piece to its starting orientation.
- Tab enters the board at one roving focus point. Arrow keys move between tiles without rotating them, Home/End move to row edges, and native Enter/Space activates the tile.
- Undo restores the previous arrangement and its turn count. Reset restores the current route's original arrangement and can itself be undone. Up to 50 editing steps are retained. Neither action erases the actual number of dispatch attempts.
- During dispatch, track edits and repeated sends are locked. Progress is recorded only after the animation finishes. Reduced-motion preference skips cosmetic travel but applies identical route rules.
- Leaving the tab pauses a moving parcel. Returning requires Continue parcel; it does not silently advance a round or add another attempt. Page exit cancels the pending animation timer.
- Successful delivery unlocks the next parcel. All three unlock a fresh-shift replay. State is in memory only and is lost on refresh; no prior game saves, Outreach drafts, or other storage is read or changed.

## Implementation

`night-shift-model.js` owns immutable board transitions, authored levels, connectivity, terminal outcomes, bounded undo, and focus movement. `night-shift.js` renders native buttons with text alternatives and SVG track pieces, runs cosmetic travel, and manages UI state. The CSS creates a small sorting-desk scene using existing brand assets and locally bundled fonts.

Route tracing checks incoming and outgoing ports, prevents row wrapping, and detects repeated cell/entry pairs. It is bounded to the finite board states; malformed endpoints and tiles do not hang the game. The example solution layouts are shipped with the client source, as ordinary inspectable puzzle data, not protected secrets.

No API, external service, new dependency, generated bitmap, social post, expense, or revenue claim is involved in the game. The prototype has its own URL and is linked from the floor's company project list. The homepage's featured product is unchanged.

## Verification

All 178 project tests pass, including 20 new model/controller tests and one portfolio-link check. Coverage includes each solution and unsolved start, alternate invalid exits, synthetic loops, 500 deterministic generated boards, bounds, immutability, undo/reset/history limits, dispatch idempotence, all three deliveries, replay, keyboard focus, background pause, page-exit timer cleanup, reduced motion, non-repetitive status announcements, and isolation from previous products.

In the local in-app browser, an incomplete route stopped at the correct tile, then all three parcels were delivered through native controls. Keyboard arrows and Enter, reset/undo, and replay were checked. At 320px, the page had no horizontal overflow and board tiles measured about 47.4px wide. Desktop and mobile layouts were visually inspected; no warning/error console logs were observed. Hidden-tab and reduced-motion paths are covered by controller tests, not a separate system-settings change in the browser pass.

## Next decision

Play the three-route shift and decide whether the connection-building is enjoyable before adding more puzzles, sounds, or progression. Later updates require a separate release.
