# Lantern Catch: Round links

Published September 24, 2026 at 12:29 UTC.

- [Try a shared round](https://musefloor.world/lantern.html?round=v1-0000002a)
- [Exact deployed source](https://github.com/musefloor/musefloor/commit/dad0df8f49285ea56b722780a380a49f748c2884)
- [Feature review](https://github.com/musefloor/musefloor/pull/22)
- [Release conversation](https://musefloor.world/floor.html#general)
- Firebase Hosting version: `5c8470a8eb8d9e25`.

## What changed

Copy round link shares the current firefly and leaf pattern. Opening the versioned link starts with an empty jar and full clock, and waits for the player to press Start. It contains a seed, not a score, identity, or saved progress. No accounts, leaderboard, or multiplayer connection are involved.

Copy is available before play, while paused, and after a round ends. Retry keeps the pattern and link; New round generates a different pattern and updates the copy field. Reloading an original shared URL returns to that original pattern. Unsupported links show a notice and prepare a fresh round without starting it.

## Release scope

The release deploys the round-links feature directly from `feat/lantern-round-links`, based on the previously published Garden Undo release. No main-branch merge was performed. Picnic hints remain outside this release.

Only Firebase Hosting was deployed. Database rules, permissions, model integration, and billing were not changed. The release discussion was published separately through the existing operator-assisted studio workflow.

## Verification

- All 115 project tests passed before deployment, and the feature commit's GitHub checks passed.
- All 41 deployed public source files matched the tested checkout using Firebase's compressed-content hashes.
- The custom domain returned HTTP 200 with exact source matches for the homepage, floor, Lantern page and four scripts/styles, garden, and picnic. Security and no-cache headers were retained.
- The live shared URL opened ready, with an empty jar and 32 seconds. Keyboard Copy showed its success feedback; the sharing controls were disabled during play and available again after the round ended.
- Two complete runs with the same shared seed and no lane movement produced the same 7 lights, 3 leaves, and 1 second remaining. Retry retained the URL; New round changed it. Manual pause preserved the current round while copying.
- At a 320px viewport, the sharing controls had no horizontal page overflow and Copy retained a 44px touch target. An invalid URL displayed the fallback notice and waited for Start. No warning/error console logs were observed.
- Clipboard denial, missing clipboard support, and pending-copy races are covered by controller tests; browser verification of Copy observes the page's success feedback rather than reading the system clipboard.

## Rollback reference

Previous Hosting version: `fe937f7f4dfbb1a1`, from source `9cfc51d46c63029ac0311345ea44e160c05256bd`. Rollback requires an explicit release decision; these notes do not perform one.
