# Outreach desk

[Issue #23](https://github.com/musefloor/musefloor/issues/23) moves the company discussion from another game mechanic to a practical question: how do people find the games?

The desk was [published on September 24, 2026](../releases/outreach-desk.md). [Open it on Musefloor](https://musefloor.world/outreach.html), or run `npm run dev` and open `/outreach.html` locally. The company canvas links to it too.

## Ad drafts

Choose Lantern Catch, Pocket Garden, or the picnic puzzle. Each has an editable headline and pitch, a fixed playable destination, and a distinct layout preview. Switching products retains their separate drafts. Copy ad text includes the headline, pitch, and destination; a readonly plain-text version remains available if clipboard access fails.

The preview is an HTML/CSS layout, not an image export or an ad-platform preview. The count is plain-text Unicode code points including the link, not X's weighted character limit. There is no generated-image service, model call, automatic social post, paid placement, or audience tracking.

## Expenses

Set a USD planning cap and enter up to 100 costs. Each row is planned or manually recorded as paid. Selecting its status moves it between the two totals, without double counting. Both categories reduce the unallocated budget; exceeding the cap shows an explicit over-budget amount. Amounts use integer cents with at most two decimal places, capped at $999,999.99 per entry or budget.

Remove has a one-step undo until another removal or reload. CSV export contains the current expense descriptions, statuses, and USD amounts, not ad drafts or the budget. CSV quoting handles commas, quotes, and newlines; formula-like descriptions are prefixed with an apostrophe for spreadsheet safety. Downloading is an explicit action.

## Data boundary

The initial ledger is empty, with a zero budget. All numbers are entered by the visitor; no company expenses, invoices, revenue, or spending are invented. This is a browser-local planning tool, not shared company accounts or verified financial records.

Only `musefloor-outreach-v1` is used in localStorage. Drafts, the selected product, budget, and ledger restore after reload; removal history does not. Reads validate the version, IDs, amounts, status, product keys, and text lengths. Unknown or corrupt saved data is preserved rather than overwritten. Blocked storage keeps the desk usable for the current visit and displays a warning. No server, credentials, payments, or existing garden saves are involved. Multiple tabs are not a collaborative editor; the last successful local save wins.

## Verification

- All 133 project tests pass, including 18 new model/controller tests.
- Tests cover exact cent arithmetic, negative/exponent/precision errors, ledger limits, duplicate IDs, totals, status transitions, removal/undo, reload, invalid saved state, unavailable storage, independent drafts, escaped preview text, clipboard failure and late-response races, export failure, and CSV formula protection.
- Browser checks cover draft switching, keyboard copying, setting a budget, planned-to-paid changes, removal/undo, reload persistence, negative-input rejection, CSV download feedback, and company-canvas navigation. Export contents are verified by serializer tests; clipboard checks observe the success feedback rather than reading the system clipboard.
- At 320px the ad editor and ledger fit without horizontal overflow, and all visible action buttons remain at least 44px high. Desktop and mobile screenshots were visually inspected in the task. No warning/error console logs were observed.
- Synthetic browser test entries were removed and the budget and draft were restored before handoff. These initial implementation checks preceded publication; live-site checks and the deployed source are recorded in the [release notes](../releases/outreach-desk.md).

## Next decision

Review the first invitation and the desk itself before considering actual distribution. Any ad-account connection, spend, public post, shared ledger, or image export is separate work and needs its own scope.
