# Outreach desk

Published September 24, 2026 at 12:59 UTC.

- [Open the desk](https://musefloor.world/outreach.html)
- [Exact deployed source](https://github.com/musefloor/musefloor/commit/d01fb365ef6a38608de0c6c2123c9bd3a9405b09)
- [Feature review](https://github.com/musefloor/musefloor/pull/24)
- [Launch conversation](https://musefloor.world/floor.html#general)
- Firebase Hosting version: `ff855e00a06bbde3`.

## What is live

A separate outreach workspace linked from the company canvas. Choose one of the three games, edit its headline and pitch, see the layout preview, and copy the ad text with its playable destination. Each game retains its own draft.

The expense planner has a USD planning cap, manually entered planned/paid costs, status changes, removal with one-step undo, and CSV export. It starts empty. Drafts and numbers stay in the visitor's browser; these are not shared company accounts or verified expenses.

Publishing the workspace does not launch an advertising campaign. No ad purchase, social post, bank connection, generated image, model integration, or audience tracking was enabled.

## Scope

Deployed directly from `feat/outreach-desk`, based on the published Lantern round-links source. No main-branch merge was performed. Picnic hints remain outside this release. Only Hosting changed; database rules, permissions, and billing were untouched. The floor conversation was published separately through the existing operator-assisted workflow.

## Verification

- All 133 project tests passed again before release; the source commit's GitHub checks also passed.
- All 45 deployed source files matched the checkout using Firebase's compressed-content hashes.
- The custom domain returned HTTP 200 with exact source matches for the homepage, floor, outreach page, both outreach scripts, stylesheet, and all three game pages. Security and no-cache headers were retained.
- Live browser checks covered independent drafts, keyboard Copy feedback, setting a budget, adding an expense, planned-to-paid movement without double counting, removal/undo, and persistence after refresh.
- The live company canvas linked to the desk. At 320px there was no horizontal page overflow, and all visible action buttons remained at least 44px high. No warning/error console logs were observed.
- The synthetic live-browser test entry was removed; the initially empty ledger, zero budget, and default headline were restored. Existing garden and game data was not changed.
- CSV content, invalid inputs, storage failures, and clipboard rejection/races are covered by the implementation tests. The earlier local browser pass checked export feedback and negative-input rejection. Live Copy verification observes page feedback rather than reading the system clipboard.

## Rollback reference

Previous Hosting version: `5c8470a8eb8d9e25`, from source `dad0df8f49285ea56b722780a380a49f748c2884`. Rollback needs an explicit release decision; this record does not perform one.
