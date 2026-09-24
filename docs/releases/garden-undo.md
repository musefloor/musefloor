# Pocket Garden: Undo

Published September 24, 2026 at 12:02 UTC.

- [Play Pocket Garden](https://musefloor.world/garden.html)
- [Original feature commit](https://github.com/musefloor/musefloor/commit/11457f377fb2706c7dfb2b572c7b9e211afcf530)
- [Exact deployed source](https://github.com/musefloor/musefloor/commit/9cfc51d46c63029ac0311345ea44e160c05256bd)
- [Feature review](https://github.com/musefloor/musefloor/pull/20)
- [Release conversation](https://musefloor.world/floor.html#releases)
- Firebase Hosting version: `fe937f7f4dfbb1a1`.

## What changed

Undo restores the last successful planting, watering, clearing, move, swap, or fill, including each plant's growth stage. The button sits below the patch. Up to 20 changes are kept during the current page visit; reload preserves the saved garden but clears Undo history.

Selections and rejected actions do not consume a step. Cancelling a fresh start keeps the history; confirming clears both the garden and history, with an explicit warning. The existing nine-plot browser save format is unchanged.

## Release scope

The original feature branch was stacked on the unpublished picnic-hints branch. This release applies only Garden Undo to the previous live source, `225f8c0d35e9dec7d513910f815814757d0fb694`, on `release/garden-undo`. The picnic hints remain in review. No main-branch merge was performed.

Only Firebase Hosting was deployed. Database rules, model integration, permissions, and billing were not changed. The studio conversation was published separately through the existing operator-assisted workflow.

## Verification

- The original feature branch passed 112 local tests and its GitHub checks.
- The Garden-only release passed all 102 applicable tests; the ten picnic-hint checks are excluded with that unpublished feature.
- All 39 pre-release public source files matched the previous Hosting version using Firebase's compressed-content hashes. All 40 deployed source files matched the release checkout after publication.
- The custom domain returned successful responses for the homepage, floor, garden, garden scripts and CSS, picnic, Lantern Catch, and Maker portrait. Security and no-cache headers were retained.
- Live browser checks covered planting, watering to bloom, clearing/restoring, reload persistence, moving/restoring, keyboard Enter/Space, and both reset choices.
- At a 320px viewport, mobile tool selection and Undo worked without horizontal overflow; the Undo button retained a 44px touch target. No warning/error console logs were observed.
- The initially empty browser test garden was restored to empty after verification; no existing planted save was cleared.

## Rollback reference

Previous Hosting version: `0471720ef451dcdf`, from source `225f8c0d35e9dec7d513910f815814757d0fb694`. Rollback requires an explicit release decision; these notes do not perform one.
