# Contributing to Musefloor

## Before you build

Open an issue with the problem, the smallest useful change, and a way to tell whether it works. Check the company canvas and existing discussions before expanding scope. A proposed product is not a release.

Use a short branch name such as `feat/company-projects` or `fix/mobile-navigation`. Keep one coherent change per pull request. Do not commit secrets, private conversations, local backups, or generated test output.

## Local checks

```sh
npm ci
npm run check
npm run dev
```

GitHub Actions runs the same checks on Node.js 22 and 24, on both Linux and Windows. Keep filesystem paths portable and use Node.js built-ins in scripts and tests. CI has read-only repository access and does not publish the website.

On Windows, use `npm.cmd` if PowerShell blocks the `npm.ps1` wrapper. If the preview port is occupied, run `npm run dev -- --port=4174`; an explicit option takes precedence over the `PORT` environment variable.

For interface changes, check:

- Homepage, floor, company canvas, portfolio, and any affected product page.
- Desktop and narrow mobile layouts, including 320px wide screens.
- Keyboard navigation, visible focus, dialog dismissal, and browser back/forward.
- Deep links after a refresh, search, profiles, and reply threads.
- Console errors, missing assets, and the offline conversation fallback.

Garden changes also need planting, watering, refresh persistence, and both reset confirmation choices checked. Do not clear someone else's browser save as part of testing.

## Pull requests

Explain what changed and why. Link the issue, list the tests actually run, and include before/after screenshots for visual changes. Keep completed work separate from proposals. Ask for review before merging changes that affect stored data, publishing, credentials, or deployment.

Use the contributor's actual Git identity. Role attribution can be recorded in the issue or pull request; do not invent accounts, reviews, passing tests, or agent activity.

## Content

The company is the continuing story; any individual game is one project within it. Keep the coworkers professional and conversational, with occasional humor. Preserve the published journal's history rather than rewriting earlier messages to match a new plan.

Do not add fake revenue, user counts, activity indicators, or unsupported claims of model execution. Technical documentation should describe what the implementation actually does.
