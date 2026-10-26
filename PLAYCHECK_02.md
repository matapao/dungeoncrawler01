# Playcheck 02 — Friends entrance and return

Historical checkpoint. The later TD01 controls and camera flow are described in
[the current movement playcheck](MOVEMENT_PLAYCHECK.md).

Open http://127.0.0.1:5184. If an older build remains visible, reload once.
Move with WASD or the arrow keys. Press F to use a nearby doorway.

1. Walk to Friends, the green entrance on the left side of the hub.
2. Wait for “Press F · Enter the Friends chamber”, then press F.
3. Walk around the stone chamber and check its size, walls and camera framing.
4. Approach its green “Return to hub” doorway and press F.
5. Check that you arrive beside the central stone, safely stopped.
6. Try holding movement or F during a transfer. Travel must not repeat automatically or carry
   held movement into the destination. Release and press a direction again to resume walking.

Only the local hub and one fixed chamber are playable. The chamber now uses the dungeon pack's
floor tiles, walls and arch as well as its pillars and torches. Race entrances remain previews.
There is no multiplayer, generated dungeon, class selection, combat or progression yet.

## New requirements recorded

Future parties support one to five players, not a mandatory group of three or five. Planned
setup includes predefined/random themes, chosen-class grouping, and automatic class/group
assignment with an optional role hint. Premade friends stay together. The updated building
blocks and [scaling experiment plan](BALANCE_PLAN.md) separate those features from this build.

Scaling simulations cannot measure difficulty until combat, classes and encounters exist.
The plan enumerates every supported finite composition and preset, and declares seed coverage
instead of claiming to exhaust all possible generated dungeons or human strategies.

## Verification

- Node 24.19.0 and the existing locked workspace tools; no dependency changes.
- New-game `npm run check`: passed strict portable/browser types, formatting, architecture,
  eight rule/architecture tests and production build.
- New-game Chrome playtests: passed against development and production previews, covering
  actual models/WebGL, out-of-reach rejection, two-way travel, held-key and repeat suppression,
  room and doorway collision, prompts, focus loss and resizing.
- Three repeated round trips also pass at the game-rule boundary.
- Desktop and 1024 × 768 chamber screenshots were visually inspected.
- Parent `npm run check`: initially passed; a final rerun stopped on seven formatting differences
  in parent-game files outside DungeonCrawler01. Those unrelated files were preserved.
- Parent `npm run test:lan`: passed.
- Parent `npm run test:browser`: did not pass; its mine scenario could not click
  “Understood — enable placement”. No parent game or test assertions were changed.
- The production build retains Vite's default bundle-size warning; no threshold was changed.

Pause here. The next block authors and playchecks larger mix-and-match room, corridor,
intersection and area sections using the dungeon and compatible related packs. Seeded assembly
comes after those pieces are approved. Class, grouping and scaling changes remain planned stages.
