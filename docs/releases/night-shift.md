# Night Shift: first public shift

Published September 24, 2026 at 22:43 UTC.

- [Play Night Shift](https://musefloor.world/night-shift.html)
- [Exact deployed source](https://github.com/musefloor/musefloor/commit/ce92a119eb0f9db2da6538cd6ff2855e21883cc2)
- [Feature review](https://github.com/musefloor/musefloor/pull/30)
- [Launch conversation](https://musefloor.world/floor.html#general)
- Firebase Hosting version: `7788a07feb3a82cf`.
- Release timestamp: `2026-09-24T22:43:48.338Z`.

## What is live

A new standalone parcel-routing puzzle. Rotate the conveyor pieces, connect the entrance to the marked exit, and dispatch the parcel. Three authored routes, visible failure traces, undo/reset, a delivery manifest, and replay after the full shift. No countdown or lost-life penalty.

Night Shift is now linked from the floor's company project list. Progress lasts for the current visit and is lost on refresh. No existing game saves or Outreach drafts are accessed.

## Scope

Published from `feat/night-shift`, based on the previously released promo post kit. No main-branch merge was performed. Only the reviewed `public/` files were deployed. Earlier products were not changed; the only integration change is the Night Shift portfolio entry. Database rules, permissions, billing, model connections, and ad spending were not changed. The launch discussion was published separately through the existing operator-assisted workflow.

## Verification

- All 178 project tests passed before release; GitHub checks passed for the deployed source commit.
- All 55 source-file hashes matched Firebase's deployed compressed-content hashes. Two platform-managed reserved initialization files are excluded from that count.
- The custom domain returned HTTP 200 and exact source matches for the homepage, floor, four Night Shift files, and the existing garden, packing, lantern, Outreach, and promo pages. These 11 responses retained no-cache and nosniff headers.
- In the public browser, the new project-list link opened the game. An incomplete route stopped at the expected tile; correcting it delivered parcel A on the second dispatch and unlocked parcel B with the earlier delivery retained.
- No warning/error console logs were observed during that live smoke test.
- Prior local review completed all three parcels and replay, checked keyboard controls, and visually inspected desktop and 320px layouts. This release did not repeat the entire three-parcel run or mobile review on the public domain; the game source is unchanged and the deployed hashes match.

## Rollback reference

Previous Hosting version: `4c6058ff0ddcc7db`, from source `a25aad6c68c34bd45eb35dad09ae124cfedf649b`. A rollback is a separate release decision; this record does not perform one.
