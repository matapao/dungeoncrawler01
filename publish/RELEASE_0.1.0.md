# DungeonCrawler01 · Alpha 0.1.0

Published 2026-10-24 on the existing [zirbel.app shelf](https://zirbel.app/).
Play: [DungeonCrawler01 Alpha](https://zirbel.app/dungeoncrawler01/@0.1.0/).
This release advertises one player: the gathering, Friends tunnel, KayKit reference room and return.

## Deployed artifact

- Fly app: `zirbel`; release **34**, `rel_gop4y7o6egp52n89`.
- Existing machine: `7817426a6219e8`, region `arn`; health passing after rolling deployment.
- Image: `registry.fly.io/zirbel@sha256:c94d754e10c983749027e76bd39822e3313c6d7de6abcb151325dcc2579f5e4a`.
- Image tag: `dungeoncrawler01-alpha-0-1-0-20261024`.
- Server SHA-256, identical before and after: `8b6abbf62910d99adf7a36d02624e6c4c7d255683dc7fd8b6bb5bed97e385925`.
- Published homepage SHA-256: `6cd545b4081c164c7602b7abc2e75a503f232b7a417cfceaa28df07e8f8a2a31`.

The image contains the captured live website plus the new game. All **488 existing files except
the homepage** remain byte-identical. Within the homepage, only the embedded media catalogue changes;
all previous game records remain unchanged. The signed catalogue, TD01, other games and downloads
are preserved. The deployed server and actual Fly service, environment, volume and VM configuration
are unchanged. No dirty platform source build was deployed.

## Evidence

- Helper: strict native TypeScript compilation passed; output reviewed independently.
- Public tar reader and manifest validation: 16 game files, Alpha, one player, credits included.
- Staged website: Alpha/solo shelf, cover launch, nested game route, TD01 card, credits and six
  licence URLs passed. Full game browser assertions passed on the same frozen nested artifact:
  Friends entry/return, TD01 movement/camera controls, hop, collisions and room inspection; zero errors.
- Public HTTP checks: shelf, game and credits return 200; homepage bytes match the prepared image.
- Public browser playcheck passed: all three models loaded from the versioned game path, Friends
  entry, room inspection, exact hub return and credits worked with no page errors.
- Game check passed strict types, formatting, 16 rule tests and production build. Development,
  production and staged browser checks passed. Parent TD01 check, LAN and full browser regression passed.
- Public TD01 entry returns 200 with its exact previous SHA-256,
  `b42b49b55072f118404eb505e930c19d5b84521f9bf148b3b4e5c26504a750b9`.
- Public network health returns 200 with `{"ok":true}`; Fly smoke and health checks passed.
- Focused platform standalone tests: two passed. New-game standalone, pinned snapshot and immutable
  revision build passed independently.
- Full Zirbel verification passed standards, formatting, quality and all type checks, then stopped
  at the unrelated existing `td01` snapshot/history mismatch. TD01 catalogue files were not modified.
  This result does not represent a passing complete platform gate.

## Durable catalogue source

Only the new folder was added at
`/Users/user/code/zirbel.gg/catalog/previews/dungeoncrawler01/`:
manifest, cover metadata, two screenshots, pinned solo archive and the required immutable revision.
The archive equals the deployed archive byte-for-byte:
SHA-256 `77041c24b9c493a65dd242012ad5d473c660f5463d1d6c3e0e0cf9dc52cf1f6a`, 3,023,498 bytes.
Normalized revision identity:
`d9123871bd0c19b6f851cc02d426e0649582f29944e3f8b49ac0764c241dbe04`, 3,041,195 bytes.
Both archives contain the same 16 game files byte-for-byte; archive ordering/header/compression
encoding explains the different identities. The revision supports future normal website builds;
this release preserves the existing live website code.

## Baseline and recovery

The preceding live homepage hash was
`41287d003e4adf8f0aeb80e2426f03e6174472e3aa5d7da59269936b330fbc91`.
Its image was `sha256:e78925e2921850061bf8390b464345dcbc8668fbae07ecfe7e87d91e095e673b`.
That older image alone lacks subsequent live static patches. Recovery must restore the captured
live website/server baseline, rather than blindly deploy that image. The ignored staging folder
keeps the live snapshot, reviewed preparation, captured configuration and deployment report.
