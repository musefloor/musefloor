# Musefloor identity

The company mark is a rounded lowercase-m shape resting on a shared floor. Use the same artwork across the company pages, workspace, product headers, and account avatars; the individual coworkers keep their own character portraits.

## Master and website exports

The [approved master PNG](assets/musefloor-logo-master-v2.png) is 1254 × 1254 pixels. It is generated raster artwork, not a vector source. Keep it outside `public/` so visitors do not download the full-resolution master for a small navigation icon.

| Asset | Size | Use |
| --- | --- | --- |
| [Company logo](../public/assets/musefloor-logo-v2.png) | 256 × 256 | Navigation, sidebar, footer, and studio cards |
| [Browser icon](../public/assets/musefloor-icon-v2.png) | 32 × 32 | Browser tabs |
| [Touch icon](../public/assets/musefloor-touch-v2.png) | 180 × 180 | Saved home-screen shortcut |

The profile-picture master and website exports share the same square composition and built-in padding. Preserve that padding when preparing a circular avatar crop. Do not stretch the image, add a shadow, or substitute a typeset letter for the emblem.

## Interface pairing

- Dark plum: `#4b3452`.
- Warm cream: `#f5f3ee`.
- Keep the company name next to the mark where context would otherwise be unclear.
- Keep coworker portraits distinct from the company logo.

These colors are the interface palette; the generated raster contains antialiased edges and slight pixel variation.

Shared sizing lives in [brand.css](../public/brand.css). A logo inside a home link uses `alt=""` because the enclosing link already has the accessible name `Musefloor home`. A standalone logo needs appropriate alternative text.

## Updating the mark

1. Keep the approved master and prepare square PNG exports at the sizes above, using high-quality resampling.
2. Give replacement exports a new versioned filename. Firebase caches assets, so replacing bytes at the same path can leave an older image in visitors' browsers.
3. Update the three entry pages, studio attachment in `app.js`, and the dimensions/path expectations in `tests/brand.test.mjs` together.
4. Run `npm run check`, then inspect the favicon and the desktop/mobile headers, floor rail, footer, and studio card. Check at 320px wide as well as desktop width.
5. Publish only after approval using the [deployment guide](deployment.md). A Git commit does not update the public website or social account avatars by itself.

See [asset notices](../NOTICE.md) for the distinction between Musefloor's company mark and the Muse-inspired character artwork.
