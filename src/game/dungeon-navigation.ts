import type { DungeonPose, DungeonStair, GeneratedDungeon } from './generated-dungeon.ts';
import { FIXED_STEP, HERO_RADIUS, WALK_SPEED } from './hub.ts';
import { canStandInSectionLayout } from './section-collision.ts';
import { rotateCell } from './sections.ts';

const EPSILON = 1e-7;

/** Native KayKit wide stairs have eight 0.125 m treads per metre of rise/run. */
export function stairHeightAt(stair: DungeonStair, along: number): number {
  const progress = Math.max(0, Math.min(stair.run, along));
  return Math.ceil(progress * 8 - EPSILON) / 8;
}

export function stairHeight(world: GeneratedDungeon, stair: DungeonStair, along: number): number {
  return world.floors[stair.lowerFloor].height + stairHeightAt(stair, along);
}

/** Coordinates along and across a stair's lower-to-upper travel axis. */
export function stairCoordinates(stair: DungeonStair, x: number, z: number) {
  const axis = rotateCell({ x: 0, z: 1 }, stair.rotation);
  const dx = x - stair.x;
  const dz = z - stair.z;
  return { along: dx * axis.x + dz * axis.z, across: dx * axis.z - dz * axis.x };
}

function matchesSurface(world: GeneratedDungeon, pose: DungeonPose): boolean {
  for (const stair of world.stairs) {
    const local = stairCoordinates(stair, pose.x, pose.z);
    if (local.along < -EPSILON || local.along > stair.run + EPSILON) continue;
    if (Math.abs(local.across) > stair.width / 2 - HERO_RADIUS + EPSILON) continue;
    const surface = stairHeight(world, stair, local.along);
    if (Math.abs(pose.y - surface) < EPSILON) return true;
  }
  const floor = world.floors[pose.floor];
  return Math.abs(pose.y - floor.height) < EPSILON && canStandInSectionLayout(floor.layout, pose.x, pose.z);
}

/** One fixed-step move. Floor identity changes only at a physically reached stair landing. */
export function navStep(
  world: GeneratedDungeon,
  current: DungeonPose,
  candidateX: number,
  candidateZ: number,
): DungeonPose | undefined {
  if (
    ![candidateX, candidateZ, current.x, current.z, current.y].every(Number.isFinite) ||
    (current.floor !== 0 && current.floor !== 1) ||
    Math.hypot(candidateX - current.x, candidateZ - current.z) > WALK_SPEED * FIXED_STEP + EPSILON ||
    !matchesSurface(world, current)
  )
    return undefined;
  for (const stair of world.stairs) {
    const before = stairCoordinates(stair, current.x, current.z);
    const after = stairCoordinates(stair, candidateX, candidateZ);
    const withinRun = after.along >= 0 && after.along <= stair.run;
    const onStair =
      before.along >= -EPSILON &&
      before.along <= stair.run + EPSILON &&
      Math.abs(before.across) <= stair.width / 2 - HERO_RADIUS + EPSILON &&
      Math.abs(current.y - stairHeight(world, stair, before.along)) < EPSILON;
    if (withinRun) {
      if (Math.abs(after.across) > stair.width / 2 - HERO_RADIUS + EPSILON) {
        if (onStair) return undefined;
        continue;
      }
      // Enter from an end; a neighboring floor cannot side-step onto a higher tread.
      const fromLower = current.floor === stair.lowerFloor && before.along <= EPSILON;
      const fromUpper = current.floor === stair.upperFloor && before.along >= stair.run - EPSILON;
      if (!onStair && !fromLower && !fromUpper) return undefined;
      return {
        x: candidateX,
        z: candidateZ,
        y: stairHeight(world, stair, after.along),
        floor:
          after.along >= stair.run ? stair.upperFloor : after.along <= 0 ? stair.lowerFloor : current.floor,
      };
    }
    if (onStair) {
      if (Math.abs(after.across) > stair.width / 2 - HERO_RADIUS + EPSILON) return undefined;
      const floorId = after.along < 0 ? stair.lowerFloor : stair.upperFloor;
      const floor = world.floors[floorId];
      return canStandInSectionLayout(floor.layout, candidateX, candidateZ)
        ? { x: candidateX, z: candidateZ, y: floor.height, floor: floorId }
        : undefined;
    }
  }
  const floor = world.floors[current.floor];
  return canStandInSectionLayout(floor.layout, candidateX, candidateZ)
    ? { x: candidateX, z: candidateZ, y: floor.height, floor: current.floor }
    : undefined;
}
