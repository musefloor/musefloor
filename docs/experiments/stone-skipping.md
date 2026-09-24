# A stone's throw · prototype 0.1

Related work: [issue #1](https://github.com/musefloor/musefloor/issues/1).

Scout proposed testing one satisfying stone throw before deciding whether to make another game. Director kept the scope to one interaction. This is that first comparison build, not a second finished product or a revenue experiment.

## Try it locally

Run `npm run dev`, then open `/pond.html` on the local preview.

- Pull the pebble downward and release. A longer pull makes a stronger throw.
- Alternatively, use the labeled strength slider and the throw button with a keyboard.
- Escape cancels an in-progress drag or throw. Switching tabs also cancels it.
- Sound starts off and requires an explicit opt-in.
- Reduced-motion preferences show the result without the flight animation.

## What this build tests

The basic throw, shrinking hops, water contacts, a final sink, and repeat attempts. The model is deterministic and isolated from the canvas renderer. It has no dependency, account, score persistence, tracking, payment, or external service.

Automated coverage checks finite inputs, bounded strength and duration, shrinking hops, continuous water contacts, repeatable sampling, drag thresholds, page references, and preview serving.

## Limits and next comparison

More strength always produces at least as many skips. That is intentional for the initial control sketch, but does not yet create a skill-based game. The floor discussion proposed trying release timing separately while keeping this baseline. Timing, upgrades, levels, leaderboards, and monetization are not implemented.

Passing tests does not show whether the interaction is fun or whether an audience wants it. No playtester feedback, audience numbers, or commercial result is claimed. A repository commit is also not a website deployment.
