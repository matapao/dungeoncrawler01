# DungeonCrawler01 — KayKit asset context and three-phase plan

Reviewed 24 October 2026. **Phases 1–3 now implement the structural traversal slice: small pieces,
rooms/intersections, a seeded two-floor dungeon, actual stairs and five camera views. Themed
additions and the end goal remain plans.** See `PHASE3_PLAYCHECK.md`, `CONTRACT.md` and the
phase-specific asset measurement documents.
Keep a player checkpoint between every subsequent building block.

## 1. Direction and priorities

Build a small fantasy crawler from the collection we already own: **small compatible pieces →
complete rooms and intersections → connected floors → a multilevel dungeon**. Assemble approved
room sections, not thousands of unrelated props. The same world must remain readable from a
WoW-style follow camera, Diablo-style oblique camera, Zelda-style high camera, true top-down,
and a side cutaway showing the building's floors. Those are camera/presentation choices over
one simulation, not five separate games.

Prioritize, in order: familiar movement; floor/wall/door proportions; the KayKit reference look;
passage and stair compatibility; room composition; camera readability; reliable generation;
then combat and social/race systems. Owning an asset is a reason to reuse art, not a reason to
add its associated crafting, cooking, mining, city-building or sci-fi game system.

The long-term loop is: shared gathering hub → friends party or assigned group → selected/random
fantasy theme → seeded dungeon → encounters, keys and exit → result and useful loot → upgrades
and new skills → another run. Parties contain **one to five** players. Race parties get identical
immutable dungeon specifications and isolated progress. No talent tree is planned.

## 2. What was actually reviewed

- Navigated the creator's [official catalogue](https://kaylousberg.itch.io/) and
  [Complete KayKit page](https://kaylousberg.itch.io/kaykit-complete), then read every one of the
  23 individual pack pages linked from that collection. Also checked Bits Bundles 1 and 2.
- The complete collection advertises SOURCE-tier access. The listed download is Collection v7;
  bundles overlap the individual packs and must not be counted as additional unique assets.
- Visually inspected the [Dungeon Pack page](https://kaylousberg.itch.io/kaykit-dungeon-pack)
  and its promotional presentation. That page is the primary lighting and material reference.
- Read the repository's earlier full-collection audit in `../docs/KAYKIT_COLLECTION.md`, the
  SHA-pinned import manifest at `../scripts/assets/collection-manifest.json`, and actual
  runtime names in `../public/assets/kits/index.json`.
- The manifest contains **2,249 hashed files**, including **1,104 model/animation files across
  19 source-pack folders**. These are selected imports, not a fresh total for the whole collection.
- macOS denied reading the original Downloads collection folder even outside the sandbox.
  Consequently, this is a complete **pack-level website review**, plus verified imported names;
  it is not a claim that every unimported mesh, texture or Blender scene was freshly inspected.
- The older collection audit reports 23 packs and roughly 4,500 models. Treat that as historical
  inventory, not a newly verified unique-model count. Recolours, formats and alternate rigs can
  inflate totals. Availability in the archive, in parent-game bundles and in this game are distinct.

Recommendations below are our design judgments. Descriptions of what a pack supplies are linked
at the point of use. No additional purchase is needed for the plan.

## 3. Entire collection: what to use for what

Priority: **P0** foundation; **P1** first useful content; **P2** after the first loop; **P3** reserve.
Phase numbers refer to the three planned asset phases later in this document.

| Pack and official source                                                        | Useful asset families                                                                                   | Proposed role in this crawler                                                                                                                      | Priority / first use                                | Keep out of the first build                                                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [Dungeon Pack 1.1](https://kaylousberg.itch.io/kaykit-dungeon-pack)             | Stone and wood floors; wall variants; doors; ceilings; modular stairs; furnishings; containers; banners | Primary architectural language. Pieces become corridors, intersections, rooms and vertical connectors. Extras support tavern and library dressing. | P0 / Phase 1                                        | Dense decorative clutter and every texture variant at once                                   |
| [Adventurers](https://kaylousberg.itch.io/kaykit-adventurers)                   | Rigged fantasy characters and handheld equipment                                                        | Consistent scale reference and initial class silhouettes. Knight, Ranger, Mage and Rogue are candidates, not four newly implemented classes.       | P0 / movement and Phase 1                           | Importing every class before gameplay roles exist                                            |
| [Character Animations](https://kaylousberg.itch.io/kaykit-character-animations) | Separate Medium/Large movement, combat, interaction and emote libraries                                 | Reuse the original game's gait/turn/hop flow; later attack, hit, death and interaction feedback.                                                   | P0 / movement                                       | Treating a climbing, dodge or tool clip as a finished mechanic                               |
| [Skeletons](https://kaylousberg.itch.io/kaykit-skeletons)                       | Regular skeleton roles; Necromancer and Golem extras; equipment                                         | One coherent first enemy family, then an elite and boss with matching weapons.                                                                     | P1 / after traversal, Phase 3 dressing preview only | Simultaneous rollout of all enemy behaviours                                                 |
| [Fantasy Weapons Bits](https://kaylousberg.itch.io/fantasy-weapons-bits)        | Melee/ranged weapons, shields, magical and elemental equipment                                          | Recognizable class equipment and later visible loot tiers. Rack/display props can establish an armoury early.                                      | P1 / Phase 2 display; later gameplay                | A new combat system for each weapon model                                                    |
| [Resource Bits](https://kaylousberg.itch.io/resource-bits)                      | Metals, wood, stone, textiles; extra gems, money, containers and food                                   | Treasure-room dressing, readable loot rewards and later a tightly scoped upgrade currency.                                                         | P1 / Phase 2                                        | A mining/crafting economy or collectible every decorative pile                               |
| [RPG Tools Bits](https://kaylousberg.itch.io/rpg-tools-bits)                    | Lanterns, hand tools, plans; extra lockpicking/fishing equipment                                        | Expedition props, key/lock visual language, map table and scholar's desk. Use compatible interaction clips later.                                  | P1 / Phase 2                                        | Fishing, building, excavation or lockpicking minigames merely because props exist            |
| [Forest Nature](https://kaylousberg.itch.io/kaykit-forest)                      | Trees, bushes, grass, rocks; extra modular terrain and palettes                                         | Rooted ruins, grotto edges and hub backdrop. Preserve the pack's cone-tree language where trees are used.                                          | P1 / selective Phase 2                              | All season palettes, large forests or a terrain generator before room connections work       |
| [Platformer](https://kaylousberg.itch.io/kaykit-platformer)                     | Platforms, ramps, supports, rails, switches; extra mechanical traps                                     | Select neutral supports, chains and trap silhouettes for traversal rooms. Re-skin approved pieces to the fantasy palette.                          | P1 / Phase 2 compatibility study; Phase 3 connector | Toy-coloured obstacle courses, conveyors or gameplay traps before their simulation exists    |
| [Halloween Bits](https://kaylousberg.itch.io/halloween-bits)                    | Cemetery props and spooky environmental dressing                                                        | Crypt threshold, burial chamber, coffins, graves and lantern accents. Strong fit with the skeleton family.                                         | P1 / Phase 2                                        | Candy, tractors and holiday jokes in the baseline dungeon                                    |
| [Furniture Bits](https://kaylousberg.itch.io/furniture-bits)                    | Furnishings, room equipment and alternate textures                                                      | Select period-compatible desks, storage and seating for inhabited rooms; prefer Dungeon's matching furniture first.                                | P1 / Phase 2                                        | Modern office electronics and upholstered domestic clutter that breaks the setting           |
| [Restaurant Bits](https://kaylousberg.itch.io/restaurant-bits)                  | Food and kitchen props in several preparation states                                                    | Sparse pantry, mess hall or tavern dressing; select containers and ingredients with a fantasy silhouette.                                          | P2 / Phase 2 sample only                            | Cooking simulation, modern appliances, pizza/ice-cream themes                                |
| [Mystery Monthly 4](https://kaylousberg.itch.io/kaykit-series-4)                | Orc Raider, Werewolf, Paladin, Ninja and others; character accessories                                  | Later orc/wolf encounters and paladin hub character; compatible current-style rigs.                                                                | P2 / Phase 3 art shortlist                          | Driver/car, robots, Space Ranger, clown and costume roster                                   |
| [Mystery Monthly 5](https://kaylousberg.itch.io/kaykit-series-5)                | Black Knight, Vampire, Witch, Frost Golem, Tiefling and others                                          | Later boss and themed-room identity: throne chamber, ritual study, frost vault.                                                                    | P2 / Phase 2 prop shortlist; later actors           | Mech, superhero and modern protagonist systems                                               |
| [Mystery Monthly 6](https://kaylousberg.itch.io/kaykit-series-6)                | Lorekeeper, Cleric, Orc Brute, Monstrosity, Plant Warrior, Farmers and others                           | Scholar/shrine hub roles, later brute/boss silhouettes and overgrown-ruin family.                                                                  | P2 / Phase 2 prop shortlist; later actors           | Toy Soldier, 4-GTN and unrelated character subclasses                                        |
| [Medieval Hexagon](https://kaylousberg.itch.io/kaykit-medieval-hexagon)         | Small village buildings, landscape tiles, walls and units                                               | Hub skyline and remote approach landmarks; selected flags, carts or props after scale checks.                                                      | P2 / Phase 2 hub backdrop only                      | Using miniature hex buildings as human-scale room geometry; tower defence or village economy |
| [Mixed Bag 1](https://kaylousberg.itch.io/mixed-bag-1)                          | Dungeon chains, golden idols, wood stove and many unrelated props                                       | Chains for a vault/cell and an idol as a memorable objective silhouette. Import only selected fantasy-compatible pieces.                           | P1 / Phase 2 selective                              | Bikes, arcade machines, hydrants and random novelty dressing                                 |
| [Board Game Bits](https://kaylousberg.itch.io/board-game-bits)                  | Tokens, dice, figurines, chess pieces, cards and portraits                                              | Optional physical planning table or tiny decorative board in the hub; UI studies, not the main item-art system.                                    | P2 / later hub polish                               | A card game, talent board or dice-driven combat system                                       |
| [Block Bits](https://kaylousberg.itch.io/block-bits)                            | Block-shaped environment elements                                                                       | Temporary footprint, headroom and stair-clearance studies if Dungeon pieces cannot answer a geometry question.                                     | P3 / internal Phase 1 only                          | Voxel mining or visible block-world art in the finished crawler                              |
| [Prototype Bits](https://kaylousberg.itch.io/prototype-bits)                    | Greybox/test assets and a rigged prototype character                                                    | Internal scale probes, socket markers and collision debugging; replace visible proxies before player art approval.                                 | P3 / internal Phase 1 only                          | Shipping a second visual style alongside the fantasy kit                                     |
| [Holiday Bits](https://kaylousberg.itch.io/holiday-bits)                        | Festive props, snow and gingerbread modular pieces                                                      | Possible much-later optional seasonal dressing with the existing room grammar.                                                                     | P3 / end-goal reserve                               | Seasonal mechanics, trains and gingerbread baseline rooms                                    |
| [Space Base Bits](https://kaylousberg.itch.io/space-base-bits)                  | Modular sci-fi structures and equipment                                                                 | Reserve art inventory; at most inspect a neutral support shape when the fantasy packs lack it.                                                     | P3 / no initial content                             | Space dungeons, sci-fi machinery, colony or resource-management loop                         |
| [City Builder Bits](https://kaylousberg.itch.io/city-builder-bits)              | City/environment assets and extra park dressing                                                         | Reserve inventory. No necessary first-crawler use.                                                                                                 | P3 / no initial content                             | Modern streets, traffic, utilities and city simulation                                       |

[Bits Bundle 1](https://kaylousberg.itch.io/bits-bundle-1) and
[Bits Bundle 2](https://kaylousberg.itch.io/bits-bundle-2) repackage the individual Bits packs.
Do not duplicate their imports. The Complete collection excludes legacy content; the creator
also warns that the [legacy packs](https://itch.io/c/6539942/kaykit-legacy-content) differ from
current textured/rigged assets. Keep the current style and rigs.

## 4. Exact imported names to reach for first

These identifiers exist in the inspected runtime index or pinned source manifest. A pinned
source file can exist without being exposed through the current DungeonCrawler01 loader.
Resolve pack, object name, material and rig during import; do not assume a short name is global.

| Job                     | Verified candidates                                                                                         | Composition rule                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Walkable base           | `floor_tile_small`, `floor_tile_large`, `floor_tile_small_decorated`, `floor_wood_large`                    | Repeated structural grid; decorations never alter collision secretly                              |
| Wear and nature seams   | `floor_tile_small_broken_A`, `floor_tile_small_weeds_A`, `floor_dirt_large`                                 | Sparse edge/variant dressing after the plain section works                                        |
| Walls and intersections | `wall`, `wall_corner`, `wall_Tsplit`, `wall_crossing`, `wall_endcap`, `wall_half`                           | Build complete corner/T/cross sections with matching collision, not individual generator choices  |
| Working thresholds      | `wall_doorway`, `wall_doorway_sides`, `wall_doorway_Tsplit`                                                 | Door model, frame, interaction reach and blocked/open state must agree                            |
| Windows and niches      | `wall_archedwindow_open`, `wall_inset_candles`, `wall_inset_shelves`                                        | Visibility/dressing; not an accidental walkable doorway                                           |
| Supports                | `pillar`, `column`, `pillar_decorated`, `scaffold_beam_wall`, `scaffold_pillar_wall`                        | Keep the full five-player passage clear                                                           |
| Vertical pieces         | `stairs`, `stairs_wide`, `stairs_long`, `stairs_modular_center`, `stairs_long_modular_left`, `ceiling_tile` | One complete lower landing + climb + upper landing section with tested headroom                   |
| Light landmarks         | `torch_lit`, `torch_mounted`, `candle_lit`, `candle_triple`, `lantern`                                      | Visual fixtures feed a bounded lighting budget; not one expensive shadow light per prop           |
| Loot silhouettes        | `chest`, `chest_gold`, `coin_stack_large`, `Gems_Chest`, `Gems_Pile_Small`, `Gold_Bars`                     | Decoration is visibly distinct from interactable/awarded loot                                     |
| Inhabited areas         | `table_long`, `table_small`, `barrel_large`, `crates_stacked`, `shelf_small_candles`, `bed_frame`           | Compose a meaningful wall-side cluster with a reserved walkable footprint                         |
| Keys and expedition     | `key`, `keyring`, `lock_A`, `lockpick_set`, `map_rolled`, `lantern`                                         | Use one readable lock/key family before variants or minigames                                     |
| Signature rooms         | `Vampire_Throne`, `Cauldron`, `Cleric_Font`, `Lorekeeper_Tome`                                              | Prop identity first; the related NPC or special mechanic can arrive later                         |
| First actors            | `Knight`, `Mage`, `Ranger`, `Rogue`, `Skeleton_Warrior`, `Skeleton_Rogue`, `Skeleton_Mage`                  | One Medium rig and deliberate loadouts; large enemies need their Large animation coverage checked |

Important example: `wall_arched` is a wall treatment, not proof of an open passage. Verify
geometry and silhouette visually instead of inferring collision or gameplay from an asset name.
Likewise a grate, spike tile, chain or stair model does not implement a trap, ladder or path.

## 5. Lighting and material reference

Use the Dungeon promotional renders as the baseline: readable neutral stone, warm wood and
metal highlights, a broad soft key, enough fill to read the shaded side, contact shadows and
restrained warm practical lights. The dark violet backdrop gives the diorama separation.
These are observations and proposed matching criteria, not extracted numerical light settings.

| Reference decision                 | Proposed method                                                                        | Approval evidence                                                           |
| ---------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| One coherent baseline look         | Start with one neutral Dungeon material palette and one light rig shared across views  | Identical fixture room rendered from all supported views                    |
| Keep the authored gradient texture | Preserve atlas colour space, UVs and intended material response                        | Neutral stone, timber, hero armour and coloured banners remain recognizable |
| Soft shapes and clear contact      | Broad key/fill balance and contact shadows with stable exposure                        | Pillar edges and floor contacts read without crushing shadow detail         |
| Torch/candle warmth                | A small number of bounded practical light pools plus emissive fixture materials        | No washed-out faces or excessive bloom, including five-player rooms         |
| Reference backdrop                 | Dark violet/near-black outside room geometry; avoid showing a daylight sky underground | Clean room silhouette in oblique and sliced views                           |
| Theme variants                     | Change approved materials, dressing and restrained light accents as one theme recipe   | Same neutral test room stays legible across selected themes                 |
| Consistent gameplay visibility     | Check targets, telegraphs, doors, keys and loot in every theme and camera              | Human playcheck plus screenshots, not just a nice beauty render             |

The SOURCE tier supplies editable Blender files, but the public pages do **not** establish that
those files contain the original promotional lighting/camera scenes. Inspect them when accessible.
If a reference scene exists, record its renderer, colour management, lights, exposure and camera;
translate those into three.js and compare a matching frame. Otherwise match the visible reference
iteratively and label the result an approximation. Do not invent an “exact” lux, temperature or
exposure value from a screenshot. The numerical settings in the existing game are a starting
implementation, not evidence that we reproduced KayKit's authoring rig.

## 6. The next three building phases

These are future asset/traversal phases, not a commitment to implement all three in one turn.
Each ends in a player check. They expand existing Block 03A/03B; they do not silently mark
combat, matchmaking, loot or race logic complete.

### Phase 1 — measured small pieces and a reference room

**Outcome:** a small walkable kit gallery using the reference look, with correct scale and
interchangeable architectural pieces. Focus on Dungeon, Adventurers and Character Animations;
inspect neutral Platformer/Prototype pieces only when a concrete measurement needs them.

1. Record the source archive/version, license and each selected asset's actual source path.
2. Inventory the full owned archive once macOS allows access; compare against the selected imports.
3. Make one scale specimen: hero, floor tile, doorway, wall, pillar and chest.
4. Measure the pack's native dimensions rather than stretching pieces to fit arbitrary constants.
5. Agree one section grid, floor height, wall thickness and passage clearance for one to five players.
6. Define semantic families: structure, decoration, interactable, blocker and traversal connector.
7. Keep decorative props out of navigation unless their collision is explicitly authored.
8. Assemble a straight wall, corner, door threshold, pillar bay and floor patch from actual pack parts.
9. Verify joints in both 90-degree orientations, including texture edges and camera collision.
10. Set up the neutral reference room and match key/fill, exposure, materials and backdrop.
11. Compare a matched reference view before adding a new palette or lighting feature.
12. Preserve the requested TD01 controls and verify the smaller hero's scale against passages.
13. Reserve separate wall, roof and floor groups for cutaways; do not erase gameplay colliders.
14. Test the gallery with the WoW follow camera and a static high/oblique inspection view.
15. Record screenshots, measured dimensions and selected asset identifiers for reuse.

**Stop:** approve scale, seams, lighting and walking before authored room modules multiply.
No generated dungeon, trap gameplay, loot awards or multiplayer in this phase.

### Phase 2 — complete rooms, intersections and themed area blocks

**Outcome:** a small library of larger mix-and-match sections, authored from the Phase 1 pieces.
Prioritize Dungeon. Add selective Halloween, Nature, Resources, RPG Tools, Mixed Bag and weapon
props; use matching Dungeon furnishings before Furniture/Restaurant alternatives.

| Section to author       | Main pieces / related packs                       | Connection requirement                 | Purpose                                             |
| ----------------------- | ------------------------------------------------- | -------------------------------------- | --------------------------------------------------- |
| Straight corridor       | Plain Dungeon floor, wall, torch bays             | Two aligned opposite passages          | Basic travel unit                                   |
| Corner                  | Matching corner walls and floor                   | Two perpendicular passages             | Turn without a pinched inner corner                 |
| T-junction              | Wall ends, pillars and clear floor                | Three matching passages                | Readable route choice                               |
| Crossroads              | Pillar bays with no central clutter               | Four matching passages                 | Group gathering and branching                       |
| Dead end                | End wall, niche or sealed door                    | One passage                            | Close unused sockets deliberately                   |
| Small chamber           | Floor patch, doorway, sparse furniture            | Two passages                           | First ordinary room                                 |
| Larger encounter area   | Pillars, wall bays, banner focal point            | Two to four passages                   | Five-player combat clearance later                  |
| Treasure vault          | Chest, coins/gems, lock family                    | One or two passages                    | Later reward/lock placement                         |
| Crypt                   | Dungeon stone + selective Halloween               | Two passages                           | Skeleton-themed area                                |
| Library / shrine        | Shelves/tomes/font/candles                        | Two passages                           | Landmark and future interaction area                |
| Rooted ruin             | Dungeon wear + sparse Nature rocks/roots/greenery | Two passages                           | Material/dressing variation with the same structure |
| Stair and landing block | Modular Dungeon stairs, rails/supports, ceiling   | Explicit lower and upper floor sockets | First complete vertical connection                  |

1. Give every section an identity, footprint, floor level, ceiling/headroom and approved rotations.
2. Mark passage positions, widths, orientations and vertical offsets in owning section data.
3. Keep visual meshes, colliders, walkable surfaces and interaction anchors in agreement.
4. Reserve encounter, player arrival, loot and key-placement zones before adding decoration.
5. Author the plain straight, bend, T, cross and dead-end sections first.
6. Add the small room and larger area with the same passage contract.
7. Build the full stair block and verify both landings before allowing floors to connect.
8. Walk every connection with one player; stage five hero bodies to check clearance without
   pretending that local stand-ins are multiplayer.
9. Create small, deliberate prop clusters: one treasure wall, one desk niche, one crypt corner.
10. Check the neutral Dungeon, crypt and rooted-ruin recipes share the same structural sockets.
11. Keep texture recolours and decoration seeds separate from layout choices.
12. Verify collisions after rotating each section; reject unsupported mirror/scale transforms.
13. Preview top-down, WoW, Diablo-style and Zelda-style views over these exact sections.
14. Hide only the necessary near wall/roof per view; preserve silhouettes and visible doors.
15. Record approved and rejected combinations, with screenshots and the reason for rejection.

**Stop:** play the room/intersection gallery and one stair block before procedural assembly.
The stair is traversal, not a cosmetic staircase leading into a teleporter without disclosure.

### Phase 3 — a small connected dungeon, two floors and view comparisons

**Implemented traversal scope:** the neutral Dungeon theme, a bounded seeded grammar, an upper
lookout goal and branch, native two-segment stairs, floor-aware walking, four traversal cameras
and side inspection. Discovery/fog, crypt/rooted dressing, enemies and rewards remain planned.
The 1024-seed regression corpus covers all 64 current recipes; it does not test every uint32 seed.

**Outcome:** one short replayable two-floor dungeon made only from approved sections, with
all requested viewpoints demonstrating the same geometry and state. This is an initial traversal
slice; meaningful difficulty scaling and multiplayer follow the relevant combat/hosting blocks.

1. Build a room graph with a start, a goal, a branch and one explicit stair connection.
2. Pick approved complete sections for graph nodes and fit compatible passages together.
3. Reject overlaps, mismatched floor heights, headroom failures and unsealed unused passages.
4. Associate walkable surfaces with an explicit floor/section identity, not just horizontal position.
5. Implement the actual vertical collision/traversal model before enabling stacked playable rooms.
6. Validate continuous lower landing, stair surface and upper landing travel in both directions.
7. Ensure the same horizontal coordinate on different floors cannot cause interactions through ceilings.
8. Verify the start-to-goal path and each optional branch after assembly.
9. Keep the generated specification immutable: layout, theme, decoration, later encounter/loot slots.
10. Replay a visible seed exactly; resolve a random theme once from a declared approved catalogue.
11. Start with neutral Dungeon; use crypt and rooted ruins as compatible, tested dressing recipes.
12. Add one clearly marked inert enemy/treasure placement preview only if needed to judge scale;
    do not suggest that combat, loot or rewards have been implemented.
13. Compare WoW, high oblique/Diablo, Zelda high view and true top-down during actual traversal.
14. Add the side building cutaway, with readable floor labels, vertical links and an active-floor marker.
15. Hide front walls/ceilings/floors for that view without changing collision, discovery or run state.
16. Keep unexplored content hidden in play; reserve reveal-all slicing for a deliberate inspection mode.
17. Ensure camera switching does not teleport, rotate movement unexpectedly or change the random seed.
18. Check stairs, occlusion, selection and interaction reach in every supported view.
19. Run a declared seed corpus and failed-layout regressions; do not claim all seeds were tested.
20. Measure draw calls, load time, frame time and memory on the actual test machine; name the machine.
21. Playcheck a solo traversal and record which parts still need an actual five-player test.

**Stop:** approve room flow, vertical travel, camera comfort and reference lighting before adding
more floors, all character families, matchmaking or large procedural runs.

## 7. Multilevel and multiview decisions that must come first

The old architecture explicitly states its world is horizontal-position based. It cannot be reused
unchanged for arbitrary vertically stacked dungeons. Floor identity, vertical traversal, collision,
line of sight and interactions must be designed together. A side-view rendering trick is not proof
that the simulation supports one playable room above another.

| View                  | Intended role                           | Presentation requirement                                        | Gameplay/input requirement                                                                      |
| --------------------- | --------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| WoW follow            | Default direct exploration              | Orbit, zoom, collision and room cutaways; head-height pivot     | Preserve the imported TD01 keyboard/mouse flow                                                  |
| Diablo-style oblique  | Group combat readability                | High oblique frame with nearer walls cut away                   | Initially retain the same camera-relative controls; click-to-move is a separate future decision |
| Zelda-style high view | Room navigation and landmarks           | Higher, stable framing with readable doors and stairs           | Explicitly test room-boundary framing; do not silently change axis conventions                  |
| True top-down         | Layout and route inspection             | Floor separation, ceiling hiding and readable actor silhouettes | Keep the active floor explicit; avoid selecting an entity on another floor                      |
| Side building slice   | Understand the stack and vertical links | Cut plane, floor labels and active-player emphasis              | View-only inspection first; no cross-floor interaction or reveal advantage in races             |

Proposed technical rule: author wall/ceiling groups and section bounds once; camera views consume
that metadata. Every camera reads the same simulation. Do not build separate copies of the dungeon
for different views, and do not make a render-hidden wall walkable.

## 8. End goal and ordering beyond these phases

| Priority | Player outcome                                  | Assets to add when needed                                    | Dependency / evidence                                                                |
| -------- | ----------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| First    | Comfortable walking and clear routes            | Existing hero, animation and Dungeon structure               | Player approval of movement and the three traversal phases                           |
| Next     | One enemy and satisfying first fight            | Skeleton Warrior, one weapon, combat/hit/death clips         | Actual damage, telegraph, cooldown and victory/defeat rules                          |
| Next     | A small class roster viable alone               | Selected Adventurers; Cleric/Paladin only when needed        | Solo tests per class; no class exists solely because a model exists                  |
| Next     | Keys, an exit, timer and result                 | Dungeon key/door/chest and RPG lock shapes                   | Reach, ownership and exact timer/finish rules                                        |
| Next     | One useful loot item, suffix, upgrade and skill | Resource gems/coins; one visible weapon step                 | One authoritative reward/payment path; repeat collection rejected                    |
| Next     | Measured solo-to-five difficulty                | Same approved encounters, classes and starting presets       | Complete finite composition matrix and declared seed coverage; see `BALANCE_PLAN.md` |
| Then     | Meet and descend with friends                   | One shared hub, selected NPC silhouettes                     | Authoritative hosting; real multi-client snapshot/delta and rejoin tests             |
| Then     | Join by chosen class or be assigned class/group | Same class models, clear role presentation                   | Optional role hint; groups of 1–5; lock roster and scaling before starting           |
| Then     | Fair same-dungeon time trials                   | Reused tunnel presentation and approved dungeon recipes      | Same seed/rules/theme/opportunities; isolated progress; synchronized host start      |
| Later    | More themed encounters and bosses               | Necromancer, Golem, Orc/Werewolf, Black Knight/Vampire/Witch | Distinct tested mechanics and animation coverage, not just reskinned health bars     |
| Later    | Richer places and seasonal variations           | Selected Furniture, Restaurant, Board Game, Holiday          | Add only after the first complete loop and its performance targets pass              |
| Reserve  | Off-theme experiments                           | Space, City, robots and novelty items                        | Separate explicit product choice; outside the supported fantasy crawler              |

Difficulty tuning must examine every supported finite party composition for sizes 1–5, including
same-class and missing-role groups, and finite rules/loadout presets. Use actual validated simulation
commands with repeatable policies and hold-out seeds. No finite experiment exhausts all human
strategies or the entire dungeon-seed space. Real playchecks remain necessary, especially five-player
camera and doorway behaviour. Mixed party sizes do not automatically belong on one fair leaderboard.

## 9. Implementation handoff and selection checklist

Before importing an asset, answer: which near-term player outcome does it support, which phase
owns it, is it already bundled, and can an existing Dungeon piece do the same job more coherently?

For every selected item, record source pack/version/path, runtime identifier, SHA, license, material
palette, measured bounds, pivot, attachment/rig, collision category and first actual consumer.
For a section also record connections, allowed rotations, clearances, floor/ceiling groups and
arrival/encounter/key/loot zones. Model geometry never decides gameplay authorization by itself.

Load the selected theme's minimum structural set first. Stream optional props/actors on demand;
share geometry/materials, instance repeated pieces, and bound light/shadow counts. Do not add a
startup download of the entire collection. Re-check Medium/Large clip support before adding a boss.

Update the relevant contract when a phase is implemented. Maintain strict portable game ownership,
seeded generation, validated commands and module budgets. For fields that later persist or replicate,
check full snapshots, incremental updates and deterministic continuation. Run the existing required
checks and each affected real-browser path. Keep plans separate from implemented behaviour.

## 10. Next-session starting point

1. Read this document, `BUILDING_BLOCKS.md`, `CONTRACT.md` and `BALANCE_PLAN.md`.
2. Obtain the Phase 3 traversal and camera player check before continuing.
3. Reuse the approved section/socket data and measured, floor-aware native stair traversal.
4. Use the pack table to keep first-crawler choices coherent; save P2/P3 ideas for later.
5. Prioritize feedback on room flow, stairs and camera comfort before expanding gameplay.

An accompanying `KAYKIT_IMPORTED_INDEX.md` lists every exact identifier in the inspected runtime
kit index and every pinned model-file path, so later work can search verified names without
repeating the website review. It is an index of selected imports, not the full unread local archive.
