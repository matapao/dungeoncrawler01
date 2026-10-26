# DungeonCrawler01 Alpha publication

Phase 3 is a recording-free, solo browser Alpha for the existing zirbel.app shelf. The coordinating
platform owner publishes the final website. This game task hands over a tested, immutable game
artifact, screenshots, credits, catalogue metadata and retained DungeonCrawler01 history.

## Prepare the game only

Run the game checks and browser playchecks first. Freeze the source and production build, then run
`npm run prepare:playable` from the game folder to add the canonical
manifest, own MIT licence, engine licence and creator credits. Do this after the final build.
Then run
`prepare-game.ts` with four arguments: that build folder, the hub cover PNG, the dungeon PNG, and a
new output folder. The helper reads the source `zirbel.json`, checks its version against the package,
requires the entry and all publication licences/credits, rejects recording files, and enforces the
standalone file/byte limits.

The output contains `game/`, `catalog/previews/dungeoncrawler01/` and `artifact.json`. The catalogue
holds the manifest, cover metadata, screenshots and pinned `solo.tgz`; the report records every game
file's SHA-256. It contains no website snapshot, deployed server, radio files, other game, or Fly image.
Capture the game with Zirbel's canonical history tool using the change title **Two floors, working
stairs and camera views**, current branch/author provenance and the real source checkout. Retain and
independently inspect the two earlier DungeonCrawler01 archives before handing over their history.

## Verify and hand off

The platform owner incorporates only these DungeonCrawler01 files into its current recording-free
candidate. Check the staged Alpha shelf, relative game assets, six licence files, all three playable
revisions and Older/Newer navigation. Play both floors, climb and descend in each play view, inspect
the building slice, reach the upper goal, return to the hub and try another seed. Run the earlier
reference-room, modular-layout and TD01 walking regressions. Keep evidence beside the artifact.

After the platform owner confirms deployment, verify the public shelf, current game and credits,
revision history and both older DungeonCrawler01 version routes. Record the actual platform release,
image and public checks in `RELEASE_0.3.0.md`. Preparation or handoff alone does not mean publication.

## Withdrawn historical site snapshots

Historical `prepare.ts` is retained for audit and refuses a baseline carrying `WITHDRAWN.txt`. Old
mixed-site captures and prepared publications under `staging/` were withdrawn when unapproved audio
recordings were removed. Their old manifests/hashes are evidence, not deployable website baselines.
Do not restore those archives or build an image from them. A later independent publication would
need a fresh, separately reviewed recording-free website baseline and current deployment approval.

[Previous game release: Alpha 0.2.0](RELEASE_0.2.0.md).
