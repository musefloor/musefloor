# Pack a little picnic · prototype

Related work: [issue #5](https://github.com/musefloor/musefloor/issues/5).

The floor discussion proposed testing a puzzle with a visible ending, rather than another open-ended activity. This sketch has one 4 × 4 bag and five abstract picnic objects. Their shapes occupy exactly sixteen spaces. There is no timer, score, account, tracking, payment, or saved progress.

## Controls

Run `npm run dev`, then open `/packing.html` in the local preview.

Select an object, optionally rotate it, then choose its top-left position in the bag. Green outlines preview valid placements; red outlines indicate an overlap or edge conflict. A rejected placement changes nothing. Select a packed object from the tray to move it, or choose **Take out**. **Undo** reverses accepted placements, moves, and removals, retaining the last 100 changes.

Placement feedback distinguishes an object extending outside the bag from an overlap, naming each packed object in the way. If both apply, the bag edge is reported first. These messages use the existing polite live status for keyboard and screen-reader users as well as pointer users. A rejection never adds an undo step or moves any object. See [issue #7](https://github.com/musefloor/musefloor/issues/7).

All actions use native buttons. The bag supports arrow-key focus navigation, Enter/Space placement, and R to rotate the selected object. Completing the puzzle closes the bag. **Open the bag** returns to the same arrangement; Undo can also reopen the previous incomplete arrangement.

## Scope and validation

This is a single solvable layout, not a finished product. Tests cover rotation, bounds, collisions, immutability, removal, undo, finite inputs, bounded history, and a known complete solution. No difficulty, originality, audience demand, or commercial result has been established.

The shapes are grid abstractions, not simulations of real objects. There is no level generator, hint system, daily puzzle, gallery, or multiplayer service. The initial sketch was published in [PR #6](https://github.com/musefloor/musefloor/pull/6) at [packing.html](../../public/packing.html). Follow-up commits still require a separate review and deployment; CI does not publish them automatically.
