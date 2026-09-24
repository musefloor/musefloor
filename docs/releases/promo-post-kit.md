# Promo post kit

Published September 24, 2026 at 22:05 UTC.

- [Open the clip desk](https://musefloor.world/promo.html)
- [Exact deployed source](https://github.com/musefloor/musefloor/commit/a25aad6c68c34bd45eb35dad09ae124cfedf649b)
- [Feature review](https://github.com/musefloor/musefloor/pull/28)
- [Launch conversation](https://musefloor.world/floor.html#general)
- Firebase Hosting version: `4c6058ff0ddcc7db`.
- Release timestamp: `2026-09-24T22:05:51.540Z`.

## What is live

Each completed promo recording gets a starting caption, visual description, exact playable round link, and plain-text notes download. The video and text file share a take identifier. The headline is captured when recording starts; editing a later headline does not alter notes belonging to an earlier take. Cancelled or failed recordings retain the last successful take and kit.

The kit appears below the recorded video. Copy caption or description, or download the text notes separately. Both files must be downloaded before leaving if they should be kept. Nothing is posted or uploaded automatically, and existing Outreach drafts and game saves are unchanged.

## Scope

Deployed from `feat/promo-post-kit`, based on the previously published clip desk. No main-branch merge was performed. Only the reviewed `public/` files were deployed; unrelated unpublished work was excluded. Database rules, permissions, billing, model connections, and ad spending were not changed. The requested launch conversation was published separately through the existing operator-assisted workflow.

## Verification

- All 157 project tests passed again before release, and the source commit's GitHub checks passed.
- All 51 deployed source-file hashes matched the checkout using Firebase's compressed-content hashes. Platform-managed reserved initialization files are excluded from this source-file count.
- The custom domain returned HTTP 200 and exact source matches for the homepage, floor, Outreach, promo page, changed promo scripts/style, and all three game pages. Checked responses retained no-cache and nosniff headers.
- A fresh live recording generated an MP4 and the corresponding custom-headline kit. Both Copy controls displayed successful-write feedback; the text download displayed its request confirmation.
- After changing the headline and cancelling a second recording, the original kit text, filename, and video remained available.
- This launch check verified browser UI feedback, not the operating-system clipboard or saved download contents. Unit tests verify exact text-file contents and copy/download failure paths; prior local review covered desktop and narrow-screen layouts. Exact media metadata was not remeasured for this launch.

The deployment command took longer than the initial check; the old release remained active until Firebase reported success. The complete hash and domain checks were repeated against the confirmed new release.

## Rollback reference

Previous Hosting version: `af8c6afbcbabc04a`, from source `6ece11019cb4ce365b9f327ecd63bd2b903b4694`. A rollback is a separate release decision; this record does not perform one.
