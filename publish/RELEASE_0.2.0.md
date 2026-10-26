# DungeonCrawler01 · Alpha 0.2.0

Published 2026-10-24 on the existing [zirbel.app shelf](https://zirbel.app/).
Play: [DungeonCrawler01 Alpha 0.2.0](https://zirbel.app/dungeoncrawler01/@0.2.0/).

Phase 2 adds two arrangements of reusable KayKit sections: small rooms, great halls, straight
corridors, bends, T intersections, crossroads and dead ends. Choose **Crossroads walk**, **Hall &
corners** or the original **Reference pieces** in the hub, enter Friends with **F**, explore and
return through the green doorway. Lighting and TD01 walking remain. The Alpha advertises one player.

## Deployed artifact

- Fly app `zirbel`, release **35**, `rel_3d092n5eo6dg2jxm`.
- Existing machine `7817426a6219e8`, region `arn`; deployment smoke and health checks passed.
- Image `registry.fly.io/zirbel@sha256:3b5b0e2a62305d3f31b10661691fc3ad0049fae3e9b4f2157d435fdee24e573a`.
- Tag `dungeoncrawler01-alpha-0-2-0-20261024`.
- Server SHA-256 unchanged: `8b6abbf62910d99adf7a36d02624e6c4c7d255683dc7fd8b6bb5bed97e385925`.
- Homepage SHA-256: `7172e4498e67197e515f562238fb46418e0b731e8e61b1bcece137371f1a12fc`.
- Alpha entry SHA-256: `81b1f7a5efc5a46ed7825197c39d78a49d841c44fef39e9867dfebc5d346ff9e`.

All **507 existing files besides the homepage** remain byte-identical. Only DungeonCrawler01's
embedded shelf record changes within the homepage. Added files are confined to the new immutable
game route, versioned media and DungeonCrawler01 revision pages. The deployed server, environment,
ports, checks, VM and persistent volume configuration remain unchanged. No dirty platform build shipped.

## Verification

- Game `npm run check`: strict portable/browser/publication types, formatting, 26 rule and
  publication tests, and production build passed.
- Rules cover all seven section types in all four rotations, joined ports, seals, overlaps,
  invalid/disconnected arrangements, prop collision, complete tours and repeated hub travel.
  Five separated hero bodies fit across each joined opening; this is a geometry check.
- Full development and frozen staged browser playchecks passed: all three choices, every section
  and side branch in both arrangements, inspection, safe return, and retained TD01 walking,
  strafing, camera turning/orbit/zoom, mouse walking, hop and focus release; zero page errors.
- Frozen shelf/history browser check passed: Alpha/current launch, six licence URLs, both playable
  revision snapshots and Older/Newer navigation under the site's security headers.
- Canonical tar reader accepted 16 files, Alpha 0.2.0 identity and included credits. Focused host
  checks passed eight history cases and two standalone cases; the current snapshot/history build passed.
- Public HTTP checks passed for the homepage, current game/manifest/credits, revision index,
  original Alpha and TD01. Every checked body matched the prepared artifact. Network health returned
  `200 {"ok":true}`; the running server hash and unchanged configuration were independently checked.
- Public browser playchecks passed both arrangements, connecting passages, inspection and exact hub
  returns with all three models loaded from the versioned route and no page errors. A separate public
  check passed the Alpha shelf/current launch, six licences, unchanged original Alpha, both playable
  revision snapshots and Older/Newer navigation. The published UI was visually reviewed.
- Parent TD01 LAN and full browser regressions passed. Its complete check stops at unrelated
  formatting differences in existing work. The host's required `npm run verify`, repeated after
  updating the catalogue, passed standards then stopped at eight unrelated formatting differences.
  DungeonCrawler01 catalogue files were formatted and did not appear in that final failure list.
  These results do not represent passing complete parent/host gates.

## Retained versions and source

Original Alpha entry remains unchanged at `/dungeoncrawler01/@0.1.0/`, SHA-256
`0912dff67e3b0b36d241e33fe10d504cfd259f1689f169401bdde30355a54c8a`.
TD01's entry remains unchanged, SHA-256
`b42b49b55072f118404eb505e930c19d5b84521f9bf148b3b4e5c26504a750b9`.

Only DungeonCrawler01's current catalogue files and its new immutable revision were updated in
`/Users/user/code/zirbel.gg/catalog/previews/dungeoncrawler01/`. The retained 0.1.0 revision archive
`d9123871bd0c19b6f851cc02d426e0649582f29944e3f8b49ac0764c241dbe04` is unchanged.
The 0.2.0 pinned snapshot is 3,027,217 bytes, SHA-256
`68d28422e7b0ec9c3acab2c003b70b1fea92729864827a98adc082653b43e0f5`.
Its normalized immutable revision is 3,045,361 bytes, SHA-256
`9176bdde83e7a8dd38554b0b65b6353bb5da4dc9a270d619742ffa2ff35162a8`.

## Baseline and recovery

The preceding release was **34**, image
`registry.fly.io/zirbel@sha256:c94d754e10c983749027e76bd39822e3313c6d7de6abcb151325dcc2579f5e4a`.
Its captured live homepage SHA-256 was
`6cd545b4081c164c7602b7abc2e75a503f232b7a417cfceaa28df07e8f8a2a31`.
The ignored staging folder retains that live website/server snapshot, tested publication, build
identity, immutable history, pre/post deployment configuration and public HTTP evidence. Recovery
must preserve any subsequent live updates; use the captured baseline rather than an older image
whose website bytes have not been verified.
