# Playcheck 01 — ready for player feedback

Open http://127.0.0.1:5184. Move with WASD or the arrow keys.

1. Circle the arrival stone. Check movement speed and character scale.
2. Approach Friends and a race entrance. Check labels and the nearby prompt.
3. Walk against the arrival stone and outer rim. Check collision and sliding.
4. Switch windows while holding movement. Return and check the hero has stopped.
5. Resize the window. Judge the fixed camera and floor readability.

Only the local hub exists. Tunnel mouths are previews. There is no multiplayer, generated
dungeon, combat, loot, progression or persistence yet. Those are separate planned blocks.
Next proposed block: enter one fixed chamber through Friends and return to the hub.
Wait for the player's feedback before implementing it.

## Verification

- Node 24.19.0; the workspace's existing pinned dependencies; no dependency changes.
- New package `npm run check`: passed portable and browser type checking, formatting,
  architecture boundaries, five rule/architecture tests and the production build.
- New package `npm run test:browser`: passed in actual Chrome, including loaded models,
  rendered WebGL, WASD and arrows, monument/tunnel collision, prompts, focus release and resizing.
- The same Chrome scenario also passed against the packaged production preview.
- Screenshots inspected at desktop and 1024 × 768 sizes. No laptop performance claim is made.
- Parent `npm run test:lan`: passed.
- Parent `npm run check`: stopped at 231 pre-existing formatting differences before application
  code was added. The unrelated files were preserved.
- Parent `npm run test:browser`: reached the starter-charge scenario, then failed because
  its browser execution context was destroyed by navigation. This parent-game check did not pass.
- Vite reports the default warning for a 641 kB JavaScript bundle containing three.js; build
  succeeds. The warning threshold was not changed.

Player feel and the interpretation of five players per group remain unconfirmed.
