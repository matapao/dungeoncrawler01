# Phase 2 playcheck — rooms, corridors and intersections

Choose **Crossroads walk** or **Hall & corners** in the hub's Layout menu, then approach Friends
and press F. Reference pieces remains available for comparison. Both arrangements reuse seven
section families. TD01 walking, turning, orbit, zoom, hop and the approved lighting are retained.

| Section           | Floor footprint     | Openings before deliberate sealing |
| ----------------- | ------------------- | ---------------------------------- |
| Straight corridor | 2 × 6 m             | Two opposite 2 m passages          |
| Corner corridor   | 4 × 4 m L shape     | Two perpendicular 2 m passages     |
| T intersection    | 6 × 4 m T shape     | Three 2 m passages                 |
| Crossroads        | 6 × 6 m cross shape | Four 2 m passages                  |
| Dead-end alcove   | 2 × 4 m             | One 2 m passage                    |
| Small room        | 6 × 6 m             | Four possible 2 m passages         |
| Great hall        | 10 × 6 m            | Four possible 2 m passages         |

Crossroads walk has ten sections: the starting chamber and straight lead to a crossroads, a great
hall to the west, a bend and alcove to the east, and a T with two branches to the south. Hall & corners
rearranges eight sections, with a rotated straight leading east into the hall, then a cross with
corridors, a bend, a T-shaped end and an alcove. Both fit a 26 × 22 m overall footprint.

Inspect layout shows the entire arrangement without moving the hero. Follow hero, walking or
camera input restores following. Section names identify each area. Follow the route back to the
green marker in the starting chamber and press F to return to the hub.

Check before continuing:

- Walk every opening in both directions, especially the bend and all three T branches.
- Compare passage width, room scale and sparse pillar placement around the hero.
- Orbit near walls and zoom by the return doorway; hidden walls must still block walking.
- Inspect both arrangements and compare their reuse of the same pieces.
- Return, change Layout and enter again; held movement must not carry across travel.
- Compare the light and walking against the approved reference room.

## Building-block contract

Floor zero, native 0.25 KayKit scale, 1 m floor/wall pieces, 2 m placement grid and four quarter turns.
Shared owning data supplies cells, boundary segments, prop footprints and cardinal sockets to both
movement and rendering. Unused sockets are sealed. Overlap, unsupported transforms, mismatched or
unsealed joins, accidental side contact and disconnected arrangements are rejected before play.

Spawn is (0,-1), facing inward; return is (0,-2.5) with 1.1 m reach, preventing arrival bounce. Layout
choice is accepted only in the hub and rejected during travel or exploration. Nothing is saved.

All floors are horizontal. Stair traversal, stacked floors, themed variants, procedural assembly,
other traversal cameras, classes, loot, combat and multiplayer remain unimplemented. Five-body
clearance checks measure geometry only, not network play or difficulty.

Pause here for the player's feedback before the next building phase.
