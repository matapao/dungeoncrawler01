import * as THREE from 'three';
import type { BoundaryWall, Cardinal, SectionLayout } from '../game/sections.ts';
import { WALL_THICKNESS } from '../game/sections.ts';
import { labelSprite } from './labels.ts';
import { createSectionBatches } from './section-batches.ts';

type PieceFactory = (name: string, scale?: number) => THREE.Group;
type Position = { readonly x: number; readonly z: number };

const DIRECTIONS: Record<Cardinal, { x: number; z: number; rotation: number }> = {
  north: { x: 0, z: -1, rotation: 0 },
  east: { x: 1, z: 0, rotation: Math.PI / 2 },
  south: { x: 0, z: 1, rotation: Math.PI },
  west: { x: -1, z: 0, rotation: -Math.PI / 2 },
};

/** Presentation consumes the same assembled cells, walls and props as navigation. */
export function buildSectionScene(root: THREE.Group, piece: PieceFactory, layout: SectionLayout) {
  const kit = createSectionBatches(root, piece);
  const labels: THREE.Sprite[] = [];
  const sectionLabels: THREE.Sprite[] = [];
  const ownedGeometries: THREE.BufferGeometry[] = [];
  const ownedMaterials: THREE.Material[] = [];
  const walls: {
    wall: BoundaryWall;
    setVisible(visible: boolean): void;
    fixtures: { setVisible(visible: boolean): void }[];
  }[] = [];

  function label(text: string, x: number, y: number, z: number, color = '#d9c5a9') {
    const sprite = labelSprite(text, color);
    sprite.position.set(x, y, z);
    sprite.scale.set(2.15, 0.448, 1);
    root.add(sprite);
    labels.push(sprite);
    return sprite;
  }

  const foundationGeometry = new THREE.BoxGeometry(1, 0.18, 1);
  const foundationMaterial = new THREE.MeshStandardMaterial({ color: '#504459', roughness: 1 });
  ownedGeometries.push(foundationGeometry);
  ownedMaterials.push(foundationMaterial);
  const foundation = new THREE.InstancedMesh(
    foundationGeometry,
    foundationMaterial,
    layout.floorCells.length,
  );
  const transform = new THREE.Matrix4();
  layout.floorCells.forEach((cell, index) => {
    // The inherited floor top is .0125m above its pivot at native .25 scale.
    kit.add('floor_tile_large', cell.x, cell.z, 0, -0.0125);
    foundation.setMatrixAt(index, transform.makeTranslation(cell.x, -0.105, cell.z));
  });
  foundation.receiveShadow = true;
  foundation.computeBoundingSphere();
  root.add(foundation);

  const nearest = layout.walls.reduce<BoundaryWall | undefined>((best, wall) => {
    const distance = Math.hypot(wall.x - layout.returnDoor.x, wall.z - layout.returnDoor.z);
    if (!best) return wall;
    const bestDistance = Math.hypot(best.x - layout.returnDoor.x, best.z - layout.returnDoor.z);
    return distance < bestDistance ? wall : best;
  }, undefined);
  if (!nearest) throw new Error('An authored section layout needs a closed return boundary');
  const returnWall = nearest;
  const portalDirection = DIRECTIONS[returnWall.side];
  const horizontal = returnWall.side === 'north' || returnWall.side === 'south';
  const portal = {
    x: horizontal ? layout.returnDoor.x : returnWall.x,
    z: horizontal ? returnWall.z : layout.returnDoor.z,
  };

  // Replace two one-metre boundary segments with the native doorway plus half walls.
  // Its closed leaf preserves the same solid return boundary owned by the simulation.
  function belongsToPortal(wall: BoundaryWall) {
    return (
      wall.side === returnWall.side &&
      (horizontal ? Math.abs(wall.z - portal.z) < 0.001 : Math.abs(wall.x - portal.x) < 0.001) &&
      (horizontal ? Math.abs(wall.x - portal.x) < 0.99 : Math.abs(wall.z - portal.z) < 0.99)
    );
  }
  for (const wall of layout.walls) {
    if (belongsToPortal(wall)) continue;
    const direction = DIRECTIONS[wall.side];
    const model = kit.add(
      'wall',
      wall.x + (direction.x * WALL_THICKNESS) / 2,
      wall.z + (direction.z * WALL_THICKNESS) / 2,
      direction.rotation,
    );
    const fixtures: { setVisible(visible: boolean): void }[] = [];
    // Mounted decoration never introduces a second source of solid prop footprints.
    if (Math.abs(wall.x % 4) === 0.5 && wall.side === 'north') {
      fixtures.push(
        kit.add('torch_mounted', wall.x - direction.x * 0.035, wall.z - direction.z * 0.035, 0, 0.7),
      );
    }
    walls.push({ wall, setVisible: model.setVisible, fixtures });
  }
  const portalX = portal.x + (portalDirection.x * WALL_THICKNESS) / 2;
  const portalZ = portal.z + (portalDirection.z * WALL_THICKNESS) / 2;
  const portalModel = kit.add('wall_doorway', portalX, portalZ, portalDirection.rotation);
  const portalSides: { setVisible(visible: boolean): void }[] = [];
  const tangentX = Math.cos(portalDirection.rotation);
  const tangentZ = -Math.sin(portalDirection.rotation);
  for (const distance of [-1, 0.5]) {
    portalSides.push(
      kit.add(
        'wall_half',
        portalX + tangentX * distance,
        portalZ + tangentZ * distance,
        portalDirection.rotation,
      ),
    );
  }
  walls.push({
    wall: { ...returnWall, x: portal.x, z: portal.z },
    setVisible: portalModel.setVisible,
    fixtures: portalSides,
  });

  for (const prop of layout.props) kit.add(prop.kind, prop.x, prop.z, prop.rotation);
  kit.flush();

  const cellsPerSection = new Map<string, number>();
  for (const cell of layout.floorCells)
    cellsPerSection.set(cell.sectionId, (cellsPerSection.get(cell.sectionId) ?? 0) + 1);
  for (const section of layout.sections) {
    if ((cellsPerSection.get(section.id) ?? 0) < 36 && !section.kind.includes('cross')) continue;
    const sprite = label(section.title.split(' · ')[0] ?? section.title, section.x, 1.35, section.z);
    sprite.visible = false;
    sectionLabels.push(sprite);
  }

  const markerGeometry = new THREE.RingGeometry(0.3, 0.39, 32);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: '#9bd6bd', side: THREE.DoubleSide });
  ownedGeometries.push(markerGeometry);
  ownedMaterials.push(markerMaterial);
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.rotation.x = -Math.PI / 2;
  marker.position.set(layout.returnDoor.x, 0.025, layout.returnDoor.z);
  root.add(marker);
  label('Return to hub', portal.x, 1.3, portal.z, '#9bd6bd');
  const practical = new THREE.PointLight('#ffc178', 0.65, 2.8, 2);
  practical.position.set(portal.x - portalDirection.x * 0.3, 0.9, portal.z - portalDirection.z * 0.3);
  root.add(practical);

  return {
    updateCutaway(yaw: number, hero?: Position) {
      for (const sprite of sectionLabels) sprite.visible = hero === undefined;
      const cameraX = Math.sin(yaw);
      const cameraZ = Math.cos(yaw);
      for (const entry of walls) {
        const normal = DIRECTIONS[entry.wall.side];
        const facingCamera = normal.x * cameraX + normal.z * cameraZ > 0.2;
        const dx = hero ? entry.wall.x - hero.x : 0;
        const dz = hero ? entry.wall.z - hero.z : 0;
        const ahead = dx * cameraX + dz * cameraZ;
        const across = Math.abs(dx * cameraZ - dz * cameraX);
        const obstructs = !hero || (ahead > -0.2 && across < 2.5);
        const visible = !(facingCamera && obstructs);
        entry.setVisible(visible);
        for (const fixture of entry.fixtures) fixture.setVisible(visible);
      }
    },
    dispose() {
      kit.dispose();
      foundation.dispose();
      for (const geometry of ownedGeometries) geometry.dispose();
      for (const material of ownedMaterials) material.dispose();
      for (const sprite of labels) {
        sprite.material.map?.dispose();
        sprite.material.dispose();
      }
      root.clear();
    },
  };
}
