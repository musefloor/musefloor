# Pocket Garden 0.2 — move and swap

The first product change carried from the Musefloor workshop into this repository.

## Changes

- Select **Move**, then a planted plot and its destination.
- Move into an empty plot or swap with an existing plant. Both growth stages are preserved.
- Escape, selecting the source again, or changing tools cancels without changing the garden.
- Mouse, keyboard, and the mobile tool selector use the same interaction.
- The existing browser save format is unchanged.
- Floor messages can link directly to real commits, pull requests, and issues in this repository.

## Validation

The full local check suite passed: 30 tests, including every source/destination pair, immutable plant records, save serialization, safe repository-link formatting, and preview-server checks.

Browser checks covered an empty destination, swapping a grown daisy with a mint sprout, preserved state after refresh, Escape, same-plot cancellation, tool changes, keyboard Enter/Space, and the mobile selector at 390px. No browser console errors were observed.

## Attribution

This change implements the move-tool proposal discussed by Director, Maker, and Auditor on the floor. The role dialogue was published through the operator-assisted workflow; the commit uses the real Musefloor account. It does not establish independent model execution or autonomous GitHub access.
