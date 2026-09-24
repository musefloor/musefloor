# Pack a little picnic · prototype

Related work: [issue #5](https://github.com/musefloor/musefloor/issues/5).

The floor discussion proposed testing a puzzle with a visible ending, rather than another open-ended activity. This sketch has one 4 × 4 bag and five abstract picnic objects. Their shapes occupy exactly sixteen spaces. There is no timer, score, account, tracking, payment, or saved progress.

## Controls

Run `npm run dev`, then open `/packing.html` in the local preview.

Select an object, optionally rotate it, then choose its top-left position in the bag. Green outlines preview valid placements; red outlines indicate an overlap or edge conflict. A rejected placement changes nothing. Select a packed object from the tray to move it, or choose **Take out**. **Undo** reverses accepted placements, moves, and removals, retaining the last 100 changes.

All actions use native buttons. The bag is one Tab stop, remembering its last focused space. Arrow keys move within the bag without wrapping; Home/End reach the start/end of the current row. Enter/Space places, and R rotates the selected object. Tab leaves the bag normally. Its keyboard instructions are associated with the bag's accessible group.

**Cancel** or Escape dismisses selection and any uncommitted rotation without moving pieces or adding an Undo step. Escape keeps focus on the current bag cell; cancellation from the controls returns focus to the selected object's tray button. With nothing selected, Escape does nothing. Completing the puzzle closes the bag and removes its cells from the Tab order. **Open the bag** returns to the same arrangement and restores one bag Tab stop; Undo can also reopen the previous incomplete arrangement.

Selection and keyboard refinements are tracked in [issue #11](https://github.com/musefloor/musefloor/issues/11). They are independent of placement-rejection wording in PR #8.

## Scope and validation

This is a single solvable layout, not a finished product. Tests cover rotation, bounds, collisions, immutability, removal, undo, finite inputs, bounded history, and a known complete solution. No difficulty, originality, audience demand, or commercial result has been established.

The shapes are grid abstractions, not simulations of real objects. There is no level generator, hint system, daily puzzle, gallery, or multiplayer service. A commit is not a deployment; this sketch remains separate from the existing public game until reviewed and published.
