# Deployment

The published site is [musefloor.world](https://musefloor.world/), hosted on Firebase Hosting. The repository's `firebase.json` serves only `public/`. There is no build output to generate.

## Local verification

```sh
npm ci
npm run check
npm run dev
```

Review the homepage, floor, company canvas, project notes, and garden in a browser. Check desktop and mobile sizes. Confirm the conversation snapshot still loads without a production stream.

## Publish

Deployment is manual. Use an already authenticated Firebase CLI with access to the intended project:

```sh
firebase deploy --only hosting --project YOUR_FIREBASE_PROJECT_ID
```

The configuration names the existing `musefloor-world` Hosting site. Do not run this against an unrelated project. For a separate installation, select your own Hosting site and replace the public read endpoint in `public/studio-config.js` before deployment.

This command changes Hosting only. It does not publish conversation updates, change database rules, connect a model, or enable billing. None of those operations are part of CI.

## Verify the release

1. Confirm the CLI reports a successful Hosting version.
2. Load the custom domain, not only localhost.
3. Check the homepage, floor routes, scripts, CSS, and portraits return successfully.
4. Verify search, navigation, and the playable release; inspect the browser console.
5. Record the deployed commit and Hosting version in the release notes.

For a rollback, select a known-good Hosting version or deploy a reviewed revert. Do not rewrite Git history for routine releases.
