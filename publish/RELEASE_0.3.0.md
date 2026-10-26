# DungeonCrawler01 · Alpha 0.3.0

Published on the existing [zirbel.app shelf](https://zirbel.app/).
Play: [DungeonCrawler01 Alpha 0.3.0](https://zirbel.app/dungeoncrawler01/@0.3.0/).
**Public gameplay, file, Alpha shelf and revision checks passed**, with zero page or console errors
in the final publication browser run. Implementation is paused here for player feedback.

The Friends tunnel now leads to a seeded dungeon assembled from the existing KayKit room,
intersection and corridor sections. Two overlapping floors connect through native KayKit stairs.
Walk to the upper lookout, descend and return through the green doorway. Choose another seed in
the hub. WoW follow, Diablo oblique, Zelda high and true top-down views retain the walking basis;
the side-on building slice shows both floors, floor labels and a visible player marker, pausing
movement, doorway actions, orbit and zoom until a play view is selected. Prior layouts and reference
pieces remain available. Lighting and TD01 walking remain. The Alpha advertises one player.

## Frozen game-only artifact

Final handoff: `DungeonCrawler01/test-output/alpha-0.3.0-reviewed-final/`.
Only that final folder is approved; the earlier 16-file candidate was superseded for missing
publication licence copies. The canonical `scripts/prepare-playable.ts dungeoncrawler01` ran after
the final production build. The final game has **19 files**, including its MIT licence, creator
credits, engine licence, all model/font notices and reviewed credits page. It has no recordings.

- Pinned `solo.tgz`: **3,030,702 bytes**, SHA-256
  `1c5e1238a4b00612270edea408247c10a8c902333b572ad9bf94b359e5d41438`.
- Canonical normalized revision: **3,051,387 bytes**, SHA-256
  `b5bfa46952f618afa1992efe7a40f3b308f6f0b6767d73026685dfaf4164d874`.
- Change title: **Two floors, working stairs and camera views**.
- Source: `https://github.com/matapao/td01`, branch `main`, commit
  `19362261ae99cd8ee282476f8ea74cd48a481312`, dirty working tree, Git author `bjstr`.
- Captured at `2026-10-24T16:56:17.585Z`. The archive identity is distinct from source provenance.
- Runtime bundle: `assets/index-BYIsygHd.js`, SHA-256
  `4b9a9476332e2a11f0b39ff6e41230768742233948fdbe89137273a3c5a3b341`.
- Entry SHA-256: `6da6c856829dbbc0cdbc89bb4a89c66315de42e329ad7f420c3872f2a5b5ccde`.
- Full game-file hashes: the final folder's `artifact.json`.

The handoff catalogue contains only DungeonCrawler01 metadata, screenshots, current solo archive,
and its three captured revisions. The platform publisher shortened one shelf sentence to use generic
camera descriptions, satisfying the shelf's existing naming rule; this is a presentation-only
metadata correction and changes none of the captured game or archive bytes. Both older archives were independently checked against their
retained identities and contain no recording files: 0.1.0 is
`d9123871bd0c19b6f851cc02d426e0649582f29944e3f8b49ac0764c241dbe04`
(3,041,195 bytes); 0.2.0 is
`9176bdde83e7a8dd38554b0b65b6353bb5da4dc9a270d619742ffa2ff35162a8`
(3,045,361 bytes). Each has 16 files. Their immutable gameplay archives remain unchanged; the
platform may update its surrounding revision presentation.

## Completed verification

- Final game `npm run check` passed strict portable, browser, publication and test types,
  formatting, **36 tests**, and production build. No assertion, budget or validation rule was weakened.
- A 1,024-seed corpus covers every orientation and all 64 bounded grammar recipes. Tests check
  deterministic generation and the default seed's complete hash, floor graph connectivity, walls,
  props, every recipe's reversible goal/branch routes, all sixteen native stair risers, floor
  isolation, stair sides, invalid surfaces and long-step rejection. Simulation tests cover hub-only
  seed commands, movement release, travel locking, goal detection, replay and exact hub return.
- Actual camera tests verify all five views preserve pose/yaw, top-down is vertical, the slice is
  level, and both floors fit landscape/portrait frames in every dungeon orientation.
- Real development Chrome passed both stair directions in all four play views, physical middle-tread
  height, the upper goal, slice keyboard/doorway/wheel locking and resumption, exact hub return,
  another seed and zero browser errors. Improved slice and stair screenshots were visually approved.
- The frozen combined production candidate at `http://127.0.0.1:8096/` passed the same complete
  Phase 3 gameplay browser route under its actual security headers. All three models loaded from
  the current version route, with zero game browser errors. Staged screenshots and startup/rendering
  observations are retained under `test-output/phase3-staged/`.
- HTTP checks passed all 19 current game files (18 non-wrapper files byte-identical to the frozen
  artifact) and all 32 files across both older aliases. Older entries retain the same gameplay markup
  after removing only known host-owned presentation. Archive identities remain unchanged.
- The combined staged shelf/history browser passed with no request interception: exact current
  capture launch, Alpha/solo metadata, six linked licence files, both older aliases, all three playable
  revisions and shared history navigation, with zero page or console errors. The platform owner
  disabled its unavailable community listing through the existing feature gate after this strict
  check exposed a real background 404. No game bytes or security policy were changed for that fix.
- The published Alpha passed the full Phase 3 gameplay browser route with zero game errors, including
  stairs in all play views, slice locking, the goal, exact hub return and another seed. All 19 public
  files returned 200 and all 18 non-wrapper hashes match the frozen game. Public Alpha/current launch,
  six licences, all three playable revisions and both older aliases passed their functional checks.
  A separate strict console assertion exposed one blocked host favicon at `/icon.svg`; the publisher
  corrected the host chrome policy by allowing exactly that icon while retaining per-revision image
  isolation. Its historical diagnostic is retained in `test-output/phase3-public-favicon-diagnostic.json`.
  The final live publication browser then passed all three playable captures, history navigation,
  legacy provenance, older aliases and licences with zero page or console errors. No request
  interception, security-policy bypass or assertion filtering was used.
- The earlier full browser regression passed the reference room, both modular layouts, every section
  and side branch, travel, inspection and inherited turning, strafing, orbit, zoom, mouse walking,
  hop and focus release.
- The maintained `test:browser` gate now runs the earlier and Phase 3 scenarios serially through
  a strict TypeScript runner, forwarding an optional target URL to both. Its type/format checks and
  the complete 36-test game check passed; the constituent browser scenarios were run explicitly.
- Publication tests exercise pinned solo hashes, game-only handoff, rejection of recording-bearing
  inputs, immutability and refusal to restore a withdrawn website baseline.
- Parent TD01 `npm run check` passed on its latest source: shared formatting, all strict profiles,
  architecture/module budgets, **55 tests**, production build and startup chunk guard. Its earlier
  missing-lifecycle-import failure was resolved by that subsystem's owner and this fresh complete
  check supersedes it. Parent LAN also passed. No TD01 fix was bundled by this game task.

## Observed rendering sample

Apple M4, arm64, **32 GiB physical machine RAM**, Chrome 155.0.8059.85, headless WebGL,
1440 × 900. Thirty animation frames per play view at the upper landing averaged 17.78 ms (WoW),
16.81 ms (Diablo), 16.57 ms (Zelda), and 19.66 ms (top-down). The observations were 34–36 draw calls,
262,328–262,394 triangles, 72 geometries and 21 textures. These short samples are not a sustained
frame-rate or other-machine claim. Raw observations and screenshots are under `test-output/`;
the frozen local production candidate reached its ready marker in 222.65 ms, with 14,198,660 bytes
of JavaScript heap used (35,389,440 bytes total). This is one local startup observation, not a public
network loading guarantee. Raw staged values remain separate from the earlier development samples.
The public run observed 2,295.51 ms to ready and 14,715,956 bytes of JavaScript heap used
(33,030,144 bytes total), on the same machine/browser. This is one public-network observation.

## Publication status

The coordinating platform owner incorporated the isolated artifact into its recording-free
candidate and owns deployment. The final healthy network image is
`registry.fly.io/zirbel:deployment-01M5QFMJMNC4KNR2R8T61Y3TJG`, immutable digest
`registry.fly.io/zirbel@sha256:e5af4989d2a6e8b3110418996ee49a0a560a74de29d01235d7041a384a52525e`.
Machine `7817426a6219e8` passed the publisher's deployment smoke, health and DNS checks.
The publisher's final atomic game-store generation is
`12b1fd7238800af876160f9ee43e2ce941ecdbb6dcd0f44b9beb9ca387de2b0e`; DungeonCrawler01 remains pinned
to the same `b5bfa469…` revision within it.
No Fly image or mixed website snapshot was published by
this game task. Historical mixed-site captures under `publish/staging/` were withdrawn after audio
recordings were removed and must not be restored. Their old hashes no longer prove an intact website.

Public checks are complete against the final image and unchanged game revision. No next-phase
implementation was started after this playcheck.
