# Lantern Catch clip desk

[Issue #25](https://github.com/musefloor/musefloor/issues/25) follows the outreach discussion: show a small catching moment before asking someone to play.

Published September 24, 2026. [Open the clip desk](https://musefloor.world/promo.html) or read the [verified release record](../releases/lantern-promo.md). For local review, run `npm run dev`, open `/outreach.html`, and follow **Make a short gameplay promo**, or open `/promo.html` directly.

## The first format

A silent 720 × 900 portrait promo, ten seconds long. Eight seconds show a scripted example using the existing Lantern Catch model and seed 42; the final two seconds invite the viewer to try the same round. This is a purpose-built canvas composition, not a recording of a player or the game's DOM. The example-play label is included in the exported picture, and its six catches are computed by the game rules rather than invented.

The headline starts with the browser's saved Lantern outreach draft when readable. Edits in the clip desk are temporary and do not write back to that draft. The game, garden saves, ledger, and public conversation remain unchanged. The corresponding versioned round link appears beside the controls and in the clip.

## Preview and export

Nothing autoplays or records on load. Preview, Record, Stop, PNG export, and video download are explicit actions. A successful take is shown in a native video player so the actual encoded file can be checked before download. Editing the headline afterwards does not change an already recorded take; the result note explains this.

Video uses [canvas captureStream](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream) and [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder). Runtime MIME negotiation tries MP4/H.264, then WebM/VP9, WebM/VP8, and WebM. Support detection is not a guarantee of encoder resources: failures and empty output are handled separately. No promise is made that every social platform accepts every selected format. PNG remains available when video recording is unsupported.

Only the generated canvas is captured. No camera, microphone, screen-sharing permission, upload, paid service, model API, or social-posting integration is involved.

## Lifecycle

The export uses real elapsed time rather than accelerating a fake browser clock. A hidden tab, a frame interruption over 500ms, page exit, explicit Stop, a 15-second work timeout, or a recording error cancels the incomplete take and stops its media tracks. Finalization has a separate five-second timeout. A previous completed take remains usable if a later attempt is cancelled; it is replaced only after a new take succeeds.

Object URLs are revoked on replacement and page exit. PNG callbacks are revision-guarded so a late export cannot unlock or download over a newer one. Font loading is bounded and falls back if unavailable. Exports and unsaved headline edits do not survive leaving the page; download files you want to keep.

## Verification

- All 145 project tests pass, including 12 promo tests. Model tests compare every demo frame against the actual game transitions, pin the six-catch example, and verify headline and frame bounds.
- Controller tests cover explicit preview, capture-free preview, completed output, replaced URL cleanup, cancellation, hidden tabs, frame stalls, timeouts, early stops, empty output, constructor/start failures, unsupported recording, PNG races, and cleanup on exit.
- In the in-app browser, recording produced a playable MP4 at 720 × 900. Native media metadata reported 10.003567 seconds; playback reached the end with no error, and the invitation card was visually checked. This is one tested browser, not a universal encoding guarantee.
- Browser checks also covered manual cancellation, leaving during a recording, the Outreach link, temporary headline edits without changing the saved draft, and PNG download feedback. At 320px there was no horizontal page overflow and action buttons stayed at least 44px high. No warning/error console logs were observed.
- Desktop composition and actual recorded-video playback were inspected during implementation. The output is silent. Hosting was subsequently published and verified as described in the release record; no social post was made.

## Next decision

Choose a headline and review an exported take before sharing it or expanding formats to other games. Buying distribution, connecting an ad platform, or posting a clip is separate work.
