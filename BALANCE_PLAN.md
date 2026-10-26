# Scaling experiment plan — planned, not implemented

The confirmed party size is one to five. Theme selection can be predefined or random. Players
may choose a class, or request automatic class and group assignment with an optional role hint.
These features are planned. Block 02 only contains one local player and a fixed empty chamber.

There are no enemy attacks or class mechanics to measure yet. No solo or five-player scaling
numbers have been derived, and running the current empty room would not establish difficulty.
The first meaningful experiment follows the initial combat and starter-class playchecks.

## What is exhaustive

Enumerate every unordered composition of the supported classes for party sizes one, two, three,
four and five. Include duplicate classes and missing-role groups. Enumerate every supported
theme, rules combination and finite starting-power preset. Explicitly list invalid combinations
and why the game rejects them. The matrix must expand when a class or supported preset is added.

All possible dungeon seeds, player strategies and network conditions cannot be exhaustively
tested. Use a fixed, versioned seed corpus for repeatable comparisons, separate unseen seeds for
validation, and additional seeded stress cases. Publish exactly which cases ran. A randomly
chosen theme resolves to one of the catalogue themes, so it receives the same coverage.

## Small experimental tasks

- [ ] Define the actual starter classes and supported solo survival tools.
- [ ] Define the first encounter's damage, movement, telegraphs and victory condition.
- [ ] Define explicit clear-time, survival and stall criteria with player feedback.
- [ ] Implement reproducible player policies for cautious, ordinary and aggressive play.
- [ ] Run policies through actual validated game commands and fixed simulation steps.
- [ ] Keep the dungeon seed and encounter content identical for candidate comparisons.
- [ ] Enumerate the complete finite composition and setup matrix.
- [ ] Establish an unscaled baseline for every case.
- [ ] Search bounded candidates for enemy health, damage and encounter size separately.
- [ ] Check that enemy attacks do not become unavoidable for supported solo classes.
- [ ] Check that required simultaneous interactions never exceed the party size.
- [ ] Record completion rate, clear time, knockouts, incoming damage and stalls per case.
- [ ] Inspect the worst case and distribution, not only aggregate averages.
- [ ] Reject candidates that hide an impossible composition behind good average results.
- [ ] Validate selected candidates on seeds excluded from tuning.
- [ ] Playcheck selected solo, intermediate-size and five-player scenarios with people.
- [ ] Record machine, simulation version, seed corpus, matrix size and exact run command.
- [ ] Preserve representative failure cases as regression tests.
- [ ] Repeat when new skills, suffixes, items, upgrades or mechanics affect difficulty.

## Hosting and race constraints

Resolve the party's class assignment and random theme before locking its starting roster.
The host chooses scaling from that roster; clients do not submit difficulty multipliers.
Define disconnect/rejoin rules before enabling multiplayer so party changes cannot reset
enemy health or reduce difficulty opportunistically. Do not assume that similar simulated
clear times make mixed-size competitive races fair; choose comparison brackets explicitly.

Do not claim player balance from automated policy results alone. Report both measured outcomes
and remaining weaknesses in the policies or seed coverage before accepting tuning.
