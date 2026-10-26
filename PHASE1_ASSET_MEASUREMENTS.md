# Phase 1 — measured Dungeon pieces

Measured 24 October 2026 from the imported `../public/assets/kits/dungeon.glb`, using the
installed glTF Transform reader and scene bounds. No original Downloads archive was opened.
Values below are metres after a uniform **0.25** scale; floating-point noise is rounded.
The half-metre hero remains unchanged. This is a traversal gallery, not multiplayer clearance
approval or a generated dungeon.

## Provenance and pivots

- Runtime bundle SHA-256: `420013c1f5a4d5372f3f68b2b8d4cc3fb7487087aa03b02e8b7d05cecf8c91c0`.
- Existing import: Kay Lousberg, **KayKit Dungeon Remastered 1.0**, CC0 1.0.
- Pinned upstream repository: `KayKit-Dungeon-Remastered-1.0`, commit
  `b0ca9bd96a8072ab36a3a5464f00ed1e06a16d07`; see `../scripts/assets/fetch-kaykit.mjs`.
- Upstream asset directory: `addons/kaykit_dungeon_remastered/Assets/gltf/`. The existing
  fetcher normalizes both `.glb` and `.gltf.glb` source suffixes to each identifier below.
- Local bundled source: `../public/assets/kits/dungeon.glb`, top-level node named by each
  runtime identifier. First consumer: `src/view/reference-room.ts`.
- License copy: `../public/assets/licenses/KayKit-Dungeon-Remastered-1.0.txt`.
- The selected pieces retain native pivots and uniform scale. Walls use their base centre;
  `wall_half` starts at x=0; `wall_corner` retains its asymmetric corner pivot. No structure
  is fitted to a target height or stretched along a single axis.
- The original hub still uses its established fitted-prop API. This phase does not silently
  rescale hub landmarks or alter TD01 movement.

## Reusable dimensions

| Runtime identifier           | Width x | Height y | Depth z | Family / note                                                |
| ---------------------------- | ------: | -------: | ------: | ------------------------------------------------------------ |
| `floor_tile_large`           |       1 |   0.0375 |       1 | Walkable structure; native top is y=0.0125                   |
| `floor_tile_small`           |     0.5 |   0.0375 |     0.5 | Walkable structure; same top                                 |
| `floor_tile_small_broken_A`  |     0.5 |   0.0375 |     0.5 | Visual floor variant                                         |
| `floor_tile_small_decorated` |     0.5 |  0.19325 |     0.5 | Decorative detail extends above the base floor               |
| `wall`                       |       1 |        1 |    0.25 | Solid structure                                              |
| `wall_half`                  |     0.5 |        1 |    0.25 | Native x extends from 0 to 0.5                               |
| `wall_corner`                |   0.625 |        1 |   0.625 | L section; native scaled bounds x[-0.5,0.125], z[-0.125,0.5] |
| `wall_doorway`               |       1 |        1 |    0.25 | Includes a separately named door leaf                        |
| `pillar`                     |   0.375 |        1 |   0.375 | Solid support                                                |
| `chest`                      |   0.425 |    0.325 | 0.36145 | Inert blocking specimen; no loot interaction                 |
| `torch_mounted`              | 0.13757 |  0.26562 | 0.15396 | Decorative fixture                                           |
| `candle_lit`                 | 0.08359 |  0.26277 | 0.08232 | Decorative fixture                                           |

The doorway's separate `wall_doorway_door` leaf spans x[-0.25,0.25], height 0.6875.
Hide that leaf in the gallery's passage specimen; retain it on the return threshold.
The straight passage is 0.5 m wide at the lower jambs. A 0.13 m hero radius leaves 0.24 m
of centre-position travel across it. Group flow through this narrow specimen is not approved;
Phase 2 should compare wider authored passages for five-player use.

## Room and authored blocker handoff

The floor is 10 × 10 m, with walk plane y=0 and inner perimeter faces at x/z ±5.
Outer wall centres sit at ±5.125 so their thickness does not encroach into that boundary.
Floor pieces are lowered 0.0125 m so their native top meets the walk plane.
Structure is repeated on a 1 m grid; smaller floor variants use a 0.5 m grid.

These are world-space rectangular obstacle bounds **before** expanding for the hero radius.
Simulation owns collision; hiding a wall for the camera must never change these blockers.

| Station            | Placement                                     | x bounds          | z bounds        |
| ------------------ | --------------------------------------------- | ----------------- | --------------- |
| Straight wall      | Three walls at x=-4,-3,-2; z=-0.8             | [-4.5,-1.5]       | [-0.925,-0.675] |
| Corner horizontal  | Corner at(-2.5,1.5), joined wall at(-3.5,1.5) | [-4,-2.375]       | [1.375,1.625]   |
| Corner vertical    | Remaining corner leg                          | [-2.625,-2.375]   | [1.625,2]       |
| Pillar             | (-2.5,3)                                      | [-2.6875,-2.3125] | [2.8125,3.1875] |
| Doorway left jamb  | Open frame at(2.5,-0.8)                       | [2,2.25]          | [-0.925,-0.675] |
| Doorway right jamb | Same frame                                    | [2.75,3]          | [-0.925,-0.675] |
| Chest              | (2.5,1.5)                                     | [2.2875,2.7125]   | [1.325,1.6865]  |
| Practical support  | Pillar at(2.5,3)                              | [2.3125,2.6875]   | [2.8125,3.1875] |

The central x[-1.5,1.5] lane stays clear. The return frame is centred at(0,-5.125);
its visual interaction marker is at(0,-4.5). The decorative 0.5 m floor patch fills x[3,4],
z[4,5]; it does not introduce additional navigation obstacles. The flame and candle are
decorative, and the fixture support is the authored obstacle.

## Reference look and cutaways

`reference-lighting.ts` establishes a warm key, neutral pale fill, violet backdrop and restrained
amber fixture pool, with the inherited textured materials and soft shadow map. This is a visual
approximation of the official Dungeon promotional look; the original Blender rig, colour
management and exact light values were unavailable. Approval remains a human playcheck.

Four perimeter groups permit camera cutaways. The return frame, leaf, dark backplane and label
belong to the same back-wall group. The floor, blockers and gallery specimens remain independent
of perimeter visibility. A separate roof or second floor is not present in Phase 1.
