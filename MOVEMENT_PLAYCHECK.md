# Movement playcheck — TD01 controls before the next asset phase

Open http://127.0.0.1:5184 and reload if the old fixed camera remains visible.

| Input                          | Behaviour inherited from TD01                                 |
| ------------------------------ | ------------------------------------------------------------- |
| W / Up arrow                   | Forward relative to camera                                    |
| S / Down arrow                 | Backpedal at 62% pace; keep facing camera look                |
| A / D                          | Strafe left/right; keep body facing camera look               |
| Q / E or Left / Right arrows   | Turn the camera                                               |
| Drag either mouse button       | Orbit and tilt; cursor captures while dragging when permitted |
| Right drag                     | Also turn the idle hero to camera look                        |
| Hold both mouse buttons        | Walk forward                                                  |
| Hold right button on macOS/iOS | Walk forward after 200 ms, like TD01's trackpad path          |
| Wheel / pinch                  | Zoom; horizontal trackpad motion turns                        |
| Space                          | Same short cosmetic hop; no obstacle bypass                   |
| F at a doorway                 | Keep Block 02's Friends enter/return interaction              |

The actual parent `HeroCamera` is reused. On-foot speed, body/character scale, backward pace,
directional clip selection/cadence, facing blend, mouse thresholds, orbit/zoom sensitivity and
camera FOV follow the parent. The hero and camera share interpolated fixed-step positions.
Entering a chamber eases to the parent room framing; leaving restores the player's zoom/pitch.
Near room walls cut away without changing collision. New multiplayer or asset phases are absent.

Try walking and strafing while orbiting. Keep W held, release the mouse, and check walking
continues. Then enter Friends, explore, return, lose focus while moving, and resume deliberately.
The flat hub/chamber collision remains owned by the dungeon simulation.

## Verification record

The main source references are `../src/view/controls/movement.ts`, `../src/view/camera.ts`,
`../src/view/entity/hero.ts` and `../src/game/systems/hero-movement.ts`. Read-only parallel review
found and verified fixes for pointer-unlock key cancellation and missing render interpolation.

- Portable/browser types, formatting, architecture, 12 rule tests and production build pass.
- Chrome development and production playchecks pass actual movement, turning, orbit, zoom, both-button walking,
  hop, room transfer, focus release and holding W through a confirmed pointer-lock drag/release.
- Parent `npm run check` passes, including 27 tests and its production build.
- Parent `npm run test:lan` passes.
- Parent browser acceptance did not complete: its failure-handler screenshot timed out and
  masked the initial error. No parent assertions or source files were changed by this task.
- The production build retains Vite's default chunk-size warning; no threshold was raised.

Earlier Block 02 evidence remains in `PLAYCHECK_02.md`; it describes the earlier movement prototype.

## Asset planning remains separate

[KAYKIT_ASSET_PLAN.md](KAYKIT_ASSET_PLAN.md) is the researched collection context and next three
asset phases. It and [the selected-import index](KAYKIT_IMPORTED_INDEX.md) are documents only;
no planned modular gallery, additional camera mode or multilevel dungeon has been implemented.
Stop here for feedback before starting Phase 1 of that plan.
