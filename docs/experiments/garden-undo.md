# Pocket Garden: undo recent changes

Review-branch improvement, not a published release. Tracks [issue 19](https://github.com/musefloor/musefloor/issues/19).

The Undo button below the garden restores the last successful planting, watering, clearing, move, swap, or fill. Growth stages are restored with positions. Filling the empty plots counts as one action.

## Boundaries

- Keep the latest 20 changes in memory for the current page session.
- Tool changes, selecting or cancelling a move, and rejected actions add no history.
- Undo cancels any pending move selection. When the history runs out, focus returns to the first plot rather than a disabled button.
- Save the restored nine-plot array using the existing `muse.pocket-garden.v1` key. No saved-history field or migration is added.
- Reload keeps the saved garden but starts with no undo history.
- Cancelling or dismissing the fresh-start dialog preserves history. Confirming clears both the garden and history; the dialog explains that this cannot be undone.
- If browser storage is unavailable, changes and Undo still work in memory for the current page.

## Checks

Pure history tests cover snapshot isolation, no-op changes, and the 20-change limit. Controller tests cover growth restoration, moving and swapping, invalid actions, filling, both reset choices, save/reload, blocked storage, and focus after the final Undo. Native keyboard activation and narrow-screen layout require browser checks.

Verified locally: all 112 tests pass. Browser checks covered planting, two waterings, clearing and restoring a bloom, move/swap restoration, refresh persistence, fill-and-undo, both reset choices, Enter/Space activation, and focus when Undo becomes disabled. At a 320px viewport the compact tool selector and Undo worked without horizontal overflow; Undo has a 44px touch target. No warning or error logs were observed. Browser checks used a separate local origin, not the public garden save.
