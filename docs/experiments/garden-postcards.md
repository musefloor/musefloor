# Pocket Garden postcards

Related work: [issue #3](https://github.com/musefloor/musefloor/issues/3).

Scout proposed letting a player save their actual garden as a small postcard. This change adds **Save a postcard** beside the garden actions. It opens a preview with an explicit **Download PNG** link. Escape or **Back to the garden** closes the preview and returns focus to the action.

The 1200 × 960 image preserves the nine plot positions, empty plots, plant types, and growth stages at the moment the action is selected. It reuses the existing garden illustration, while leaving the default company artwork unchanged. No controls or private browser data appear in the image.

Rendering and download happen on the device. There is no account, upload, public gallery, new dependency, or change to the garden's save format. Export does not water, move, clear, or otherwise modify a plant. Repeated exports are disabled while an image is rendering, and failures leave the garden intact with a retry message.

Tests cover the default illustration, actual arrangements, growth stages, empty gardens, input validation, fixed dimensions, deterministic output, and accessible download controls. A commit or pull request does not mean the feature is deployed; release follows review and website publishing.
