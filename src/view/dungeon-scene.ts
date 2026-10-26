import type * as THREE from 'three';
import type { DungeonChoice } from '../game/dungeon-choice.ts';
import type { GeneratedDungeon } from '../game/generated-dungeon.ts';
import type { HeroPosition } from '../game/hub.ts';
import { getLayout } from '../game/section-layouts.ts';
import type { CameraView } from './camera-views.ts';
import { buildGeneratedScene } from './generated-scene.ts';
import { buildReferenceRoom } from './reference-room.ts';
import { buildSectionScene } from './section-scene.ts';

export function buildDungeonScene(
  root: THREE.Group,
  piece: (name: string, scale?: number) => THREE.Group,
  choice: DungeonChoice,
  world: GeneratedDungeon,
) {
  if (choice === 'generated') {
    const scene = buildGeneratedScene(root, piece, world);
    return {
      bounds: world.bounds,
      update(yaw: number, hero: HeroPosition, view: CameraView, _inspection: boolean) {
        scene.updateView(view, hero, yaw);
      },
      dispose: scene.dispose,
    };
  }
  const legacy =
    choice === 'reference'
      ? buildReferenceRoom(root, piece)
      : buildSectionScene(root, piece, getLayout(choice));
  return {
    bounds: choice === 'reference' ? { minX: -5, maxX: 5, minZ: -5, maxZ: 5 } : getLayout(choice).bounds,
    update(yaw: number, hero: HeroPosition, _view: CameraView, inspection: boolean) {
      legacy.updateCutaway(yaw, inspection ? undefined : hero);
    },
    dispose: legacy.dispose,
  };
}
