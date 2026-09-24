# Promo post kit

[Issue #27](https://github.com/musefloor/musefloor/issues/27) follows the floor discussion about choosing an exported clip and pairing it with the playable round link.

This addition is in review, not deployed. It extends the [published clip desk](../releases/lantern-promo.md). Run `npm run dev`, open `/promo.html`, and finish a recording to see the new post kit.

## What changes

A completed video gets a starting caption, visual description, and downloadable plain-text notes. The caption includes the same seeded game URL as the recorded composition. The text file names its corresponding video; both use the same take identifier. The description calls the action a scripted example, not a player result.

The headline is captured when recording starts and used for both the video rendering and notes. Later headline edits cannot change the existing kit. A cancelled or failed recording leaves the previous successful video and notes intact; a successful replacement updates both. Preview and PNG export do not create video post notes.

The kit is temporary, like its video. Download both files before leaving the page. It does not save over Outreach drafts or write a new browser-storage schema. No upload, social posting, tracking, ad purchase, API, or third-party dependency is added.

## Copy and download behavior

- Caption and description are read-only, labelled text fields, available for manual selection. Copy buttons write only after an explicit click and report success only after the browser resolves that write.
- Missing or denied clipboard access offers manual copying and the text download. Pending writes have a five-second UI timeout; duplicate clicks are blocked while one is pending.
- Replacement and page exit invalidate pending feedback. Browser clipboard operations cannot be cancelled once submitted: an old write might still complete at the operating-system level, but cannot display a stale success or unlock a newer operation. Check the pasted content before posting.
- The plain-text download is separate from the video download, avoiding automatic multiple-file downloads. Temporary links are removed and object URLs are revoked after use or on page exit.
- The generated caption is a starting point, not a promise that every platform accepts its length or video format. Edit it in the publishing app as needed. The description can be added alongside the video; it is not an audio track or automatic captioning.

## Verification

All 157 project tests pass, including 12 new post-kit and recording-integration tests. They cover matching filenames and exact text-file content, safe identifiers, MP4/WebM metadata, immutable headline capture, cancelled/replaced takes, unsupported recording, clipboard denial and timeout races, page exit, failed downloads, URL cleanup, and plain-text handling of user input.

In the local in-app browser, a custom-headline recording produced an MP4 and matching notes. Both Copy buttons reported successful writes; the text download showed its confirmation. After editing the headline and cancelling a second recording, the original caption, description, and filename remained unchanged. Desktop and 320px layouts were visually inspected. Native controls showed the first video had reached its end; exact media metadata could not be re-read because the browser inspection helper timed out. Test coverage checks the text-file bytes; the browser pass checked download feedback, not the saved filesystem contents or system clipboard.

No public Hosting deployment or social post is part of this commit.
