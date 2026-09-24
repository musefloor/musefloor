# A garden through the window

Related discussion: [issue #9](https://github.com/musefloor/musefloor/issues/9).

This is a small visual comparison for the picnic sketch, not a new game or a finished collection. The floor conversation proposed making separate activities feel connected through their setting. A window frames the existing Pocket Garden illustration beside the heading on wide screens and above the bag on narrow screens, without introducing a walkable world, new puzzle objects, or additional rules.

## Try the comparison

Run `npm run dev`, open `/packing.html`, and select **Garden view**. Toggle it again to return to the plain layout. A fresh page starts plain; the preference is not saved. The control is only revealed once its script is available.

The native checkbox works with a pointer or Space on the keyboard. Decoration is hidden from assistive technology and ignores pointer input. The small view module only reads its checkbox and writes the decorative container; it does not import the puzzle model or rebuild any puzzle controls. Switching views therefore preserves placements, current rotation, selection, the open/closed bag, and Undo history.

The garden is the same trusted, locally generated SVG used elsewhere on the site, not a duplicate screenshot or an external resource. Its first render is lazy and reused on later toggles. It does not read a player's saved garden.

## Scope

Compare whether the window makes the picnic more inviting or merely adds scrolling. The mobile layout intentionally places the scene above the bag, so that tradeoff needs real playtesting. No user preference, increased engagement, commercial potential, or final collection name has been established.

This experiment is independent of the placement-feedback change in [PR #8](https://github.com/musefloor/musefloor/pull/8). Neither a branch push nor passing CI deploys it. No tracking, saved preference, animation, new dependency, or gameplay change is included.
