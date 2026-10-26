import * as THREE from 'three';
import type { GeneratedDungeon } from '../game/generated-dungeon.ts';
import type { BoundaryWall, Cardinal } from '../game/sections.ts';
import { WALL_THICKNESS } from '../game/sections.ts';
import type { CameraView } from './camera-views.ts';
import { cameraViewYaw, sliceFraming } from './camera-views.ts';
import { createSectionBatches } from './section-batches.ts';
import { labelSprite } from './labels.ts';

type PieceFactory = (name: string, scale?: number) => THREE.Group;
type Subject = { readonly x: number; readonly y: number; readonly z: number; readonly floor: 0 | 1 };

const DIRECTIONS: Record<Cardinal, { x: number; z: number; rotation: number }> = {
  north: { x: 0, z: -1, rotation: 0 },
  east: { x: 1, z: 0, rotation: Math.PI / 2 },
  south: { x: 0, z: 1, rotation: Math.PI },
  west: { x: -1, z: 0, rotation: -Math.PI / 2 },
};

/** Both storeys consume authoritative floor cells and open landing boundaries, never a second layout. */
export function buildGeneratedScene(root: THREE.Group, piece: PieceFactory, world: GeneratedDungeon) {
  const labels: THREE.Sprite[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const floorLabels: { floor: 0 | 1; label: THREE.Sprite }[] = [];
  const foundations: THREE.InstancedMesh[] = [];
  const foundationGeometry = new THREE.BoxGeometry(1, 0.18, 1);
  const foundationMaterial = new THREE.MeshStandardMaterial({ color: '#504459', roughness: 1 });
  geometries.push(foundationGeometry);
  materials.push(foundationMaterial);

  function label(text: string, x: number, y: number, z: number, color = '#e5cfb3') {
    const sprite = labelSprite(text, color);
    sprite.position.set(x, y, z);
    sprite.scale.set(2.6, 0.542, 1);
    root.add(sprite);
    labels.push(sprite);
    return sprite;
  }

  const floors = world.floors.map((floor) => {
    const group = new THREE.Group();
    group.position.y = floor.height;
    root.add(group);
    const kit = createSectionBatches(group, piece);
    const foundation = new THREE.InstancedMesh(
      foundationGeometry,
      foundationMaterial,
      floor.layout.floorCells.length,
    );
    const matrix = new THREE.Matrix4();
    floor.layout.floorCells.forEach((cell, index) => {
      kit.add('floor_tile_large', cell.x, cell.z, 0, -0.0125);
      foundation.setMatrixAt(index, matrix.makeTranslation(cell.x, -0.105, cell.z));
    });
    foundation.receiveShadow = true;
    foundation.computeBoundingSphere();
    group.add(foundation);
    foundations.push(foundation);
    const walls = floor.layout.walls.map((wall: BoundaryWall) => {
      const normal = DIRECTIONS[wall.side];
      const model = kit.add(
        'wall',
        wall.x + (normal.x * WALL_THICKNESS) / 2,
        wall.z + (normal.z * WALL_THICKNESS) / 2,
        normal.rotation,
      );
      const fixture =
        Math.abs(wall.x % 4) === 0.5 && wall.side === 'north'
          ? kit.add('torch_mounted', wall.x, wall.z + 0.035, 0, 0.7)
          : undefined;
      return { wall, normal, model, fixture };
    });
    for (const prop of floor.layout.props) kit.add(prop.kind, prop.x, prop.z, prop.rotation);
    kit.flush();
    const floorLabel = label(
      `Floor ${floor.id + 1}`,
      floor.layout.bounds.minX - 1.8,
      floor.height + 0.45,
      floor.layout.bounds.minZ,
      '#9bd6bd',
    );
    floorLabels.push({ floor: floor.id, label: floorLabel });
    return { floor, group, kit, walls };
  });

  const stairGroup = new THREE.Group();
  root.add(stairGroup);
  const stairs = createSectionBatches(stairGroup, piece);
  for (const stair of world.stairs) {
    // The native stair rises one metre toward local -z over a one-metre run.
    // Two intact models meet at the same one-metre landing: no stretched mesh or teleport.
    const angle = (stair.rotation * Math.PI) / 2;
    const forwardX = -Math.sin(angle);
    const forwardZ = Math.cos(angle);
    for (let segment = 0; segment < 2; segment += 1) {
      stairs.add(
        'stairs_wide',
        stair.x + forwardX * (segment + 1),
        stair.z + forwardZ * (segment + 1),
        Math.PI - angle,
        segment,
      );
    }
  }
  stairs.flush();

  const ringGeometry = new THREE.RingGeometry(0.3, 0.39, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: '#9bd6bd', side: THREE.DoubleSide });
  geometries.push(ringGeometry);
  materials.push(ringMaterial);
  const markers = [
    { ...world.returnDoor, y: 0, title: 'Return to hub' },
    { ...world.exit, title: 'Upper lookout' },
  ].map((point) => {
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(point.x, point.y + 0.025, point.z);
    root.add(ring);
    const sprite = label(point.title, point.x, point.y + 1.2, point.z, '#9bd6bd');
    const light = new THREE.PointLight('#ffc178', 0.65, 2.8, 2);
    light.position.set(point.x, point.y + 0.9, point.z);
    root.add(light);
    return { ring, sprite, light, floor: point.y === 0 ? 0 : 1 };
  });
  const activeMaterial = new THREE.MeshBasicMaterial({
    color: '#baf9d5',
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
  });
  materials.push(activeMaterial);
  const activeMarker = new THREE.Mesh(ringGeometry, activeMaterial);
  activeMarker.renderOrder = 1000;
  const activeGeometry = new THREE.SphereGeometry(0.1, 12, 8);
  geometries.push(activeGeometry);
  const activePoint = new THREE.Mesh(activeGeometry, activeMaterial);
  activePoint.renderOrder = 1000;
  root.add(activePoint);
  const activeLabel = label('You', 0, 0, 0, '#baf9d5');
  activeLabel.material.depthWrite = false;
  activeLabel.renderOrder = 1001;
  activeMarker.rotation.x = -Math.PI / 2;
  root.add(activeMarker);

  return {
    updateView(view: CameraView, hero: Subject, yaw: number) {
      const slice = view === 'slice';
      const azimuth = cameraViewYaw(view, yaw, world.rotation);
      const cameraX = Math.sin(azimuth);
      const cameraZ = Math.cos(azimuth);
      // Ordinary traversal never sees an upper floor covering the active lower storey.
      for (const entry of floors) {
        entry.group.visible = slice || entry.floor.id <= hero.floor;
        for (const wall of entry.walls) {
          const alignment = wall.normal.x * cameraX + wall.normal.z * cameraZ;
          const towardCamera = slice ? Math.abs(alignment) > 0.2 : alignment > 0.2;
          const dx = wall.wall.x - hero.x;
          const dz = wall.wall.z - hero.z;
          const ahead = dx * cameraX + dz * cameraZ;
          const across = Math.abs(dx * cameraZ - dz * cameraX);
          const occludes = slice || (ahead > -0.2 && across < 2.5);
          const visible = !(towardCamera && occludes);
          wall.model.setVisible(visible);
          wall.fixture?.setVisible(visible);
        }
      }
      if (slice) {
        const aspect = window.innerWidth / Math.max(1, window.innerHeight);
        const verticalFov = (2 * Math.atan(1 / aspect) * 180) / Math.PI;
        const frame = sliceFraming(world.bounds, azimuth, aspect, verticalFov);
        const left = -frame.halfWidth * 0.8;
        const labelWidth = frame.halfWidth * 0.32;
        for (const entry of floorLabels) {
          entry.label.position.set(
            frame.centerX + cameraZ * left,
            world.floors[entry.floor].height + 0.55,
            frame.centerZ - cameraX * left,
          );
          entry.label.scale.set(labelWidth, labelWidth * (80 / 384), 1);
          entry.label.renderOrder = 1000;
          entry.label.material.depthWrite = false;
        }
        const dx = hero.x - frame.centerX;
        const dz = hero.z - frame.centerZ;
        const depth = dx * cameraX + dz * cameraZ;
        const heroLabelWidth = (frame.distance - depth) * 0.19;
        activeLabel.scale.set(heroLabelWidth, heroLabelWidth * (80 / 384), 1);
        activeLabel.position.set(hero.x, hero.y + 0.85, hero.z);
      }
      for (const entry of floorLabels) entry.label.visible = slice;
      for (const marker of markers) {
        const visible = !slice && marker.floor === hero.floor;
        marker.ring.visible = visible;
        marker.sprite.visible = visible;
        marker.light.visible = visible;
      }
      activeMarker.visible = slice;
      activeLabel.visible = slice;
      activePoint.visible = slice;
      activePoint.position.set(hero.x, hero.y + 0.25, hero.z);
      activeMarker.position.set(hero.x, hero.y + 0.035, hero.z);
    },
    dispose() {
      for (const floor of floors) floor.kit.dispose();
      stairs.dispose();
      for (const foundation of foundations) foundation.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const sprite of labels) {
        sprite.material.map?.dispose();
        sprite.material.dispose();
      }
      root.clear();
    },
  };
}
