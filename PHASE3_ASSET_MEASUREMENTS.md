# Phase 3 — native stair geometry and camera presentation

Measured 24 October 2026 from the same imported `../public/assets/kits/dungeon.glb`
identified in `PHASE1_ASSET_MEASUREMENTS.md`. Measurements use its actual vertex positions
at the established uniform 0.25 scale. No new asset download or stretched model is involved.

| Identifier    | Outer width | Native run | Tread rise | Clear tread width | Highest rail point |
| ------------- | ----------: | ---------: | ---------: | ----------------: | -----------------: |
| `stairs_wide` |      1.75 m |        1 m |        1 m |           1.375 m |            1.275 m |

The native pivot is at the high end: local z=0 has a tread at y=1; local z=1 is the
lower approach. Eight nominal 0.125 m treads rise toward local -z. Each flat tread
occupies approximately 0.1 m of a 0.125 m step interval; small bevels fill the remainder.
The outer rails extend beyond the clear walking width. Navigation uses the clear width,
with the inherited 0.13 m hero radius inset on each side.

Two intact models make the generated connector: a two-metre run and a two-metre rise,
with sixteen nominal treads. At canonical lower entry (0,15), the first model is rotated
180 degrees and placed at (0,0,16); the second at (0,1,17). Both model placements and
navigation rotate together with the generated specification. Quarter-turn coordinates
use x'=-z, z'=x; three.js model rotations therefore use 180 degrees minus that turn.
The upper floor starts at y=2, with an explicit opening at the upper landing. Traversal
follows nominal tread heights; the bevel detail does not create a second navigation surface.

The existing warm reference lighting remains the single preset. Play views hide the upper
storey while walking below it. The deliberate building-slice inspection reveals both
storeys, labels them and marks the active player position without changing collision. Its
lens looks across the generated stair axis so the climb reads in profile at every quarter turn;
this inspection azimuth does not change the walking yaw.
Camera presets read the same world and hero pose. WoW uses the unchanged inherited follow
controller; oblique and high views track that pose; top-down is genuinely vertical with
an explicit screen-up vector tied to the existing yaw.
