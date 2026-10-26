import * as THREE from 'three';
import { labelSprite } from './labels.ts';

type PieceFactory = (name: string, scale?: number) => THREE.Group;

/** A measured gallery, not a generated room or a source of gameplay collision. */
export function buildReferenceRoom(
  root: THREE.Group,
  piece: PieceFactory,
): { updateCutaway(yaw: number): void; dispose(): void } {
  const back = new THREE.Group();
  const front = new THREE.Group();
  const left = new THREE.Group();
  const right = new THREE.Group();
  root.add(back, front, left, right);
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const labels: THREE.Sprite[] = [];

  function place(name: string, x: number, z: number, parent = root, rotation = 0, y = 0): THREE.Group {
    const model = piece(name);
    model.position.set(x, y, z);
    model.rotation.y = rotation;
    parent.add(model);
    return model;
  }

  function box(
    width: number,
    height: number,
    depth: number,
    color: string,
    x: number,
    y: number,
    z: number,
    parent = root,
  ) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color, roughness: 1 });
    geometries.add(geometry);
    materials.add(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
  }

  function label(text: string, x: number, y: number, z: number, color = '#e5cfb3', parent = root) {
    const sprite = labelSprite(text, color);
    sprite.position.set(x, y, z);
    sprite.scale.set(1.55, 0.323, 1);
    parent.add(sprite);
    labels.push(sprite);
  }

  // Native large tiles are 4 units square. At .25 each cell is exactly one metre.
  // Their top is .05 native units; this offset keeps the walk plane at y=0.
  box(10.4, 0.2, 10.4, '#504459', 0, -0.12, 0);
  for (let x = -4.5; x <= 4.5; x += 1) {
    for (let z = -4.5; z <= 4.5; z += 1) {
      if (x === 3.5 && z === 4.5) continue;
      place('floor_tile_large', x, z, root, 0, -0.0125);
    }
  }
  const smallFloorPatch = [
    { name: 'floor_tile_small', x: 3.25, z: 4.25 },
    { name: 'floor_tile_small_broken_A', x: 3.75, z: 4.25 },
    { name: 'floor_tile_small_decorated', x: 3.25, z: 4.75 },
    { name: 'floor_tile_small_weeds_A', x: 3.75, z: 4.75 },
  ];
  for (const tile of smallFloorPatch) place(tile.name, tile.x, tile.z, root, 0, -0.0125);
  label('0.5 m tiles', 3.5, 0.55, 4.25);

  // Perimeter inner faces align with the gameplay room boundary at +/-5 metres.
  for (let offset = -4.5; offset <= 4.5; offset += 1) {
    place('wall', offset, 5.125, front);
    place('wall', -5.125, offset, left, Math.PI / 2);
    place('wall', 5.125, offset, right, Math.PI / 2);
    if (Math.abs(offset) > 1) place('wall', offset, -5.125, back);
  }
  place('wall_half', -1, -5.125, back);
  place('wall_half', 0.5, -5.125, back);
  place('wall_doorway', 0, -5.125, back);
  // The threshold remains an explicit F interaction; the leaf is deliberately closed.
  box(0.5, 0.6875, 0.02, '#241b30', 0, 0.34375, -5.24, back);
  box(0.7, 0.015, 0.55, '#88b9a5', 0, 0.025, -4.5);
  label('Return to hub', 0, 1.3, -5.125, '#9bd6bd', back);

  for (const x of [-4, -3, -2]) place('wall', x, -0.8);
  label('1 m walls', -3, 1.3, -0.8);

  place('wall_corner', -2.5, 1.5);
  place('wall', -3.5, 1.5);
  label('Corner joint', -3.1, 1.3, 1.5);

  place('pillar', -2.5, 3);
  label('1 m pillar', -2.5, 1.3, 3);

  const doorway = place('wall_doorway', 2.5, -0.8);
  doorway.traverse((object) => {
    if (object.name === 'wall_doorway_door') object.visible = false;
  });
  label('0.5 m passage', 2.5, 1.3, -0.8);

  place('chest', 2.5, 1.5);
  label('Chest', 2.5, 0.65, 1.5);

  place('pillar', 2.5, 3);
  place('torch_mounted', 2.5, 2.82, root, Math.PI, 0.7);
  place('candle_lit', 3.2, 3);
  label('Warm fixtures', 2.7, 1.3, 3);
  const practical = new THREE.PointLight('#ffc178', 0.9, 2.8, 2);
  practical.position.set(2.5, 0.95, 2.55);
  root.add(practical);

  return {
    updateCutaway(yaw: number) {
      back.visible = Math.cos(yaw) >= -0.2;
      front.visible = Math.cos(yaw) <= 0.2;
      left.visible = Math.sin(yaw) >= -0.2;
      right.visible = Math.sin(yaw) <= 0.2;
    },
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      for (const sprite of labels) {
        sprite.material.map?.dispose();
        sprite.material.dispose();
      }
      root.clear();
    },
  };
}
