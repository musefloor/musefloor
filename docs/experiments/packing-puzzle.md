# Pack a little picnic · prototype

Related work: [issue #5](https://github.com/musefloor/musefloor/issues/5).

The floor discussion proposed testing a puzzle with a visible ending, rather than another open-ended activity. This sketch has one 4 × 4 bag and five abstract picnic objects. Their shapes occupy exactly sixteen spaces. There is no timer, score, account, tracking, payment, or saved progress.

## Controls

Run `npm run dev`, then open `/packing.html` in the local preview.

Select an object, optionally rotate it, then choose its top-left position in the bag. Green outlines preview valid placements; red outlines indicate an overlap or edge conflict. A rejected placement changes nothing. Select a packed object from the tray to move it, or choose **Take out**. **Undo** reverses accepted placements, moves, and removals, retaining the last 100 changes.

All actions use native buttons. The bag is one Tab stop, remembering its last focused space. Arrow keys move within the bag without wrapping; Home/End reach the start/end of the current row. Enter/Space places, and R rotates the selected object. Tab leaves the bag normally. Its keyboard instructions are associated with the bag's accessible group.

**Cancel** or Escape dismisses selection and any uncommitted rotation without moving pieces or adding an Undo step. Escape keeps focus on the current bag cell; cancellation from the controls returns focus to the selected object's tray button. With nothing selected, Escape does nothing. Completing the puzzle closes the bag and removes its cells from the Tab order. **Open the bag** returns to the same arrangement and restores one bag Tab stop; Undo can also reopen the previous incomplete arrangement.

Selection and keyboard refinements are tracked in [issue #11](https://github.com/musefloor/musefloor/issues/11). They are independent of placement-rejection wording in PR #8.

## Optional hints

**Show a hint** checks whether the bag can still be completed without moving anything already packed. If it can, the button selects one unpacked object, prepares its rotation, and focuses its suggested top-left position. Enter/click places it; Cancel or Escape dismisses it. Requesting a hint does not change placements or Undo history. If the existing arrangement is stuck, the message asks the player to move, remove or undo a packed piece instead of suggesting a dead end. A complete bag needs no hint, even when reopened.

The local solver enumerates the fixed pieces' unique legal placements, uses a 16-bit occupancy mask, searches the most constrained remaining piece first, and memoizes failed subproblems. It returns one move from a complete solution, not a full-board reveal. There is no model or network call. [Issue #17](https://github.com/musefloor/musefloor/issues/17) tracks this review-only improvement; a commit does not publish it.

## Scope and validation

This is a single solvable layout, not a finished product. Tests cover rotation, bounds, collisions, immutability, removal, undo, finite inputs, bounded history, and a known complete solution. No difficulty, originality, audience demand, or commercial result has been established.

The shapes are grid abstractions, not simulations of real objects. There is no level generator, daily puzzle, gallery, or multiplayer service. The original sketch is public; subsequent review-branch changes require an explicit deployment before they appear in the live game.
