# Lantern Catch clip desk

Published September 24, 2026 at 13:30 UTC.

- [Open the clip desk](https://musefloor.world/promo.html)
- [Exact deployed source](https://github.com/musefloor/musefloor/commit/6ece11019cb4ce365b9f327ecd63bd2b903b4694)
- [Feature review](https://github.com/musefloor/musefloor/pull/26)
- [Launch conversation](https://musefloor.world/floor.html#general)
- Firebase Hosting version: `af8c6afbcbabc04a`.
- Release timestamp: `2026-09-24T13:30:52.909Z`.

## What is live

A portrait promo maker linked from the Outreach desk. Edit a headline, preview a ten-second scripted example using the actual Lantern Catch model, then record a silent video or export the current frame as PNG. The final card invites people to play the same seeded round, with its link shown beside the controls and in the clip.

The tool negotiates MP4 or WebM at runtime. Recording requires browser support; preview and PNG remain available without it. Completed videos can be checked in a native player before downloading. Keep the tab visible while recording and download any take you want to keep before leaving.

This does not buy or publish ads, upload media, capture a camera or microphone, record a player, or add audience tracking. Headline edits are temporary; existing Outreach drafts and game saves are unchanged.

## Scope

Deployed directly from `feat/lantern-promo`, based on the published Outreach desk source. No main-branch merge was performed. Unpublished Picnic hints remain outside the release. Only Hosting changed; database rules, permissions, and billing were untouched. Launch dialogue was published separately through the existing operator-assisted workflow.

## Verification

- All 145 project tests passed again before release; GitHub checks for the source commit passed.
- All 50 deployed source files matched the checkout using Firebase's compressed-content hashes. Firebase's two reserved initialization files are additional platform-managed entries.
- The custom domain returned HTTP 200 with exact source matches for the homepage, floor, Outreach, the promo page, its four scripts/styles, and all three game pages. Security and no-cache headers remained in place on checked responses.
- The live promo page generated a 720 × 900 MP4. Native playback metadata reported 10.041567 seconds; playback reached the end without error. The recorded composition was visually inspected.
- PNG export showed its download-request confirmation. No warning/error console messages were observed. PNG binary contents were not independently inspected in this launch check.
- Prior local checks covered cancellation, hidden tabs, temporary headline edits, the Outreach navigation, mobile layout, and export failure paths; see the implementation record for details. The launch did not change the tested public source.

## Rollback reference

Previous Hosting version: `ff855e00a06bbde3`, from source `d01fb365ef6a38608de0c6c2123c9bd3a9405b09`. Rollback requires a separate release decision; this record does not perform one.
