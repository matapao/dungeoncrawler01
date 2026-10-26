# DungeonCrawler01 contract

## Implemented: Blocks 01–02 and KayKit Phases 1–3

One local player arrives beside a central stone in a small, walkable gathering hub. Five labeled
tunnel mouths illustrate the friends and future race paths. Friends enters the generated dungeon, a selected authored layout or the original reference room.
Movement now follows TD01: WASD moves/strafe relative to the follow camera; Q/E and left/right
arrows turn, while up/down arrows move forward/back. Straight and diagonal speeds match. The
hub rim, central stone and tunnel thresholds block movement. Focus loss releases held controls.
The MIT TD01 `HeroCamera` is retained locally in `src/view/camera.ts`, preserving orbit sensitivity,
zoom, head-height follow, collision and FOV behavior. Mouse drag with either button orbits; the
right drag also turns the idle hero. Both mouse buttons walk forward. On macOS/iOS a right hold
walks after 200 ms. Wheel zoom, pinch zoom and horizontal trackpad turning match TD01. On-foot
speed is 2.6, backward movement uses 0.62 pace, and the hero/body scale is 0.5/0.13. Directional
run/backpedal/strafe clips and Space's cosmetic half-second hop use the same cadence. Models
and camera share a previous/current fixed-tick interpolation pose. Near room walls cut away
without changing collision. Entering a chamber eases to TD01's room pitch/distance and leaving
restores the player's outdoor pitch and zoom, preserving camera turn relative to the hero.

One painted fantasy preset uses the original KayKit dungeon art and knight, existing animations,
warm light, purple backdrop and Cinzel/Alegreya typography. There are no decorative players
pretending to be real multiplayer participants. Nothing is saved yet.

Choose a layout in the hub, then press F within reach of Friends to enter. Each layout has a green
return marker: press F nearby to return to the exact original hub arrival position. Other tunnels
remain previews. Layout choice is a validated, hub-only command; transitions reject it. Selection
stops movement without relocating the hero and persists through trips until reload.
The simulation owns the 30-tick transfer and changes location halfway through the visual fade.
Movement and interaction are rejected during transfer. The old movement direction and held keys
are cleared, and keyboard auto-repeat cannot carry a held action across arrival. A fresh keypress
is required to resume movement. Walking alone never triggers travel; room walls block movement.
The 10 × 10 m reference room uses native KayKit pieces at uniform 0.25 scale: 1 m floor tiles,
0.5 m floor variants, joined walls, a corner, pillars, an open doorway, a chest and warm fixtures.
Measured solid footprints block the 0.13 m hero body independently of camera cutaways; the open
0.5 m specimen passage is traversable. The chest and lights are inert. A clear central lane joins
the safe spawn and green return marker. See `PHASE1_ASSET_MEASUREMENTS.md` for provenance.

Inspect room gives a static elevated view of the same room and hero. Follow hero, walking, camera
input or travel returns to normal TD01 following. Inspection does not change position or gameplay.
The light preset approximates the pack promotional look; the source Blender rig was unavailable.

## Phase 2 — authored section library

Seven reusable families retain the same native 0.25 KayKit scale: a straight, L bend, T intersection,
crossroads, dead-end alcove, 6 × 6 m chamber and 10 × 6 m great hall. Shared floor cells, exterior
wall segments and measured prop footprints define navigation and rendering. Two-metre cardinal
sockets declare floor zero and whether they are deliberately sealed. Only quarter turns on the
two-metre placement grid are supported; no mirror or stretch transforms.

Crossroads walk and Hall & corners are two fixed arrangements. Crossroads walk includes a real
three-way T branch. The assembler rejects overlap, mismatched or unsealed sockets, accidental
side contact, disconnected sections and unsupported transforms. The same 0.13 m hero body crosses
every join. Pillars block walking; camera cutaways never change solids. Floors remain at y=0.

The hub Layout menu retains Reference pieces; the default is now Two-floor expedition. Larger layouts start
at (0,-1), facing into the room; return is (0,-2.5), outside spawn reach. Inspect layout frames the
same entire arrangement. Walking or camera input resumes following. Section names identify the
current area. Repeated pieces use view-owned instances sharing loaded geometry and materials.
The approved light colours, intensity and exposure remain unchanged; shadow coverage fits the
larger layout bounds while preserving light direction.

The retained Phase 2 arrangements remain horizontal. Five-body clearance checks measure geometry
only; they do not establish group gameplay or difficulty.

## Phase 3 — generated two-floor expedition

A visible unsigned 32-bit seed selects a small, bounded assembly of the approved rooms, corridors,
intersections and a branch. The grammar has 64 recipe combinations (32 distinct footprints),
including four whole-layout rotations. This is a constrained generator, not arbitrary room packing.
The hub seed field and Next seed command regenerate before entry; invalid values, changes inside
the dungeon and changes during travel are rejected. A seed repeats the same geometry and spawn.
The default seed is 17031. Nothing is saved between reloads.

The generated specification connects floor zero at y=0 to floor one at y=2. Each floor has its own
validated room graph and collision identity. Two intact native KayKit stair segments provide a
2 m run and rise, with sixteen measured 0.125 m treads. Horizontal movement advances over those
authoritative tread heights; rendering interpolates the pose. Side entry onto a raised tread is
blocked. Floor identity changes only at the opposite landing. Stairs work in both directions with
the same speed, body radius, sliding and input cadence as TD01. Cosmetic hopping never changes
the authoritative walking surface. The upper lookout is a traversal goal without a reward.

The green return doorway works only on the lower floor. Sharing horizontal coordinates across
floors cannot trigger a return. Reach, height and floor checks belong to the simulation. The exact
hub return position and transfer rules are retained. See `PHASE3_ASSET_MEASUREMENTS.md`.

The Camera menu switches between the imported TD01 WoW follow, Diablo-style oblique, Zelda high
view and true top-down traversal. The same hero, floor, seed and camera-relative movement heading
are retained. Fixed-view presets keep their elevation; normal play views retain yaw and zoom.
Side slice is a deliberate inspection mode showing both floors, their labels and the active hero.
Walking and interaction pause there; selecting a play view resumes at the same pose. It reveals
the whole small dungeon; discovery and fog of war are not implemented.

Near walls cut away without changing collision. The upper floor hides while exploring below it;
both floors are visible from above and in side inspection. Native instancing retains the approved
light colours, intensity, exposure, backdrop and model scale. Shadow coverage fits the generated
bounds without changing the light direction. The promotional lighting remains an approximation
of the reference, rather than a recovered Blender light rig.

Neutral Dungeon dressing is the implemented theme. Crypt/rooted variants, enemies, loot, keys,
timers, combat, classes, scaling, multiplayer and additional floors remain planned.

## Ownership

This is an independently installable repository extracted from td01.
The mirrored shared engineering standard applies. The tower-defense product loop does not apply
to this new dungeon game. Keep all new application modules under 600 lines.

Portable rules and commands live in `src/game`; only they mutate hero position. They have a
separate compiler gate with ES2022, no DOM/Node types, checked indexing and exact optional fields.
`game/locations.ts` owns travel reach and spawn selection; `sections.ts` owns section/socket data;
`section-layouts.ts` validates authored arrangements; `section-collision.ts` owns walk boundaries.
`generated-dungeon.ts` owns the seeded world; `dungeon-navigation.ts` owns floor and stair travel.
Generation uses the extracted portable `src/core/rng.ts`. The architecture check rejects
imports outside the repository and keeps portable rules dependent only on game/core modules.
The fixed step is 60 Hz. Rendering and UI submit validated direction commands. Rendering time
only selects the number of fixed steps; suspension catch-up is bounded for this local practice hub.
Future competitive clocks need explicit host timing semantics before implementation.

The view owns models, animation, renderer, input and their disposal. The UI observes state and
owns text. The composition root owns startup, failure messaging and shutdown. No transport,
persistence or progression system is borrowed from tower defense. Selected immutable model assets are included locally. Chrome uses the vendored public
`@zirbel/engineering/browser` adapter.

Vite is retained from td01. Exact tool versions and the repository's npm lockfile provide a standalone
install; no sibling checkout is required. Only the selected model/font asset set is under `public/`.
The production build retains creator credits and all applicable licenses.

## Planned, not implemented

The building-block plan describes friends parties, expanded generated dungeons, keys, rules switches,
suffixes, loot, upgrades, skills and isolated identical time trials. No talent tree is planned.
Parties will support one to five players. Themes can be predefined or randomly chosen. Queue modes
will preserve a selected class or assign class and group using an optional role hint. Premade friends
stay together. [Scaling experiments](BALANCE_PLAN.md) must cover every supported finite composition
and setup, with a declared seed corpus and later human playchecks. No scaling numbers are measured yet.
The visible doorways do not imply a fixed maximum instance count or a separate OS process per tunnel.

## Asset planning reference

[KAYKIT_ASSET_PLAN.md](KAYKIT_ASSET_PLAN.md) covers all 23 official collection packs, their uses,
lighting reference, the three asset phases and the end goal. Phases 1–3 now provide the structural
traversal slice; themed additions and gameplay systems remain plans. Its selected import index
is not a claim that every asset in the original Downloads archive was freshly read.

## Current playcheck

Phase 3 is ready for a player check: replay a seed, explore both floors and the branch, climb and
descend in the four play views, inspect the side slice, then return to the hub. See
`PHASE3_PLAYCHECK.md`. Pause for player feedback before adding more gameplay or dungeon scope.

The public Alpha is a one-player browser preview, separate from TD01. It supports no network
party, accounts, save data, combat or progression. The game build uses relative asset paths so
it can run at its versioned shelf address without replacing another game.
