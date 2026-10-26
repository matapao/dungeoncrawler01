import { RNG } from '../core/rng.ts';
import { assembleSectionLayout } from './section-layouts.ts';
import { canStandInSectionLayout } from './section-collision.ts';
import { getSection, rotateCell, rotateSide } from './sections.ts';
import type { Footprint, QuarterTurn, SectionLayout, SectionPlacement } from './sections.ts';

export type DungeonFloorId = 0 | 1;

export interface DungeonPose {
  readonly x: number;
  readonly z: number;
  readonly y: number;
  /** Retained while on a staircase; changes only after crossing the opposite landing. */
  readonly floor: DungeonFloorId;
}

export interface DungeonStair {
  readonly id: string;
  /** Lower landing. Rotation 0 ascends towards +z. */
  readonly x: number;
  readonly z: number;
  readonly rotation: QuarterTurn;
  readonly width: number;
  readonly run: number;
  readonly rise: number;
  readonly lowerFloor: 0;
  readonly upperFloor: 1;
}

export interface DungeonFloor {
  readonly id: DungeonFloorId;
  readonly height: number;
  readonly layout: SectionLayout;
}

export interface GeneratedDungeon {
  readonly seed: number;
  readonly title: string;
  readonly rotation: QuarterTurn;
  readonly recipe: string;
  readonly floors: readonly [DungeonFloor, DungeonFloor];
  readonly stairs: readonly DungeonStair[];
  readonly spawn: DungeonPose & { readonly facing: number };
  readonly returnDoor: { readonly x: number; readonly z: number; readonly floor: 0; readonly reach: number };
  readonly exit: DungeonPose & { readonly floor: 1; readonly reach: number };
  readonly bounds: Footprint;
  readonly routeWaypoints: readonly DungeonPose[];
  readonly branchWaypoints: readonly DungeonPose[];
}

export const DEFAULT_DUNGEON_SEED = 17031;

export function isDungeonSeed(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xffffffff;
}

function placement(
  id: string,
  kind: SectionPlacement['kind'],
  x: number,
  z: number,
  rotation: QuarterTurn,
  openSides: readonly SectionPlacement['sealed'][number][],
): SectionPlacement {
  return {
    id,
    kind,
    x,
    z,
    rotation,
    sealed: getSection(kind)
      .sockets.filter((socket) => !openSides.includes(rotateSide(socket.side, rotation)))
      .map((socket) => socket.side),
  };
}

function rotatePlacement(value: SectionPlacement, rotation: QuarterTurn): SectionPlacement {
  const center = rotateCell(value, rotation);
  const combined = (value.rotation + rotation) % 4;
  if (combined !== 0 && combined !== 1 && combined !== 2 && combined !== 3)
    throw new Error('Invalid generated rotation');
  return { ...value, ...center, rotation: combined };
}

/** Stair openings are explicit connectors between floors, rather than unpaired room sockets. */
function openStairLanding(layout: SectionLayout, x: number, z: number): SectionLayout {
  const walls = layout.walls.filter((wall) => Math.hypot(wall.x - x, wall.z - z) > 0.51);
  if (layout.walls.length - walls.length !== 2) throw new Error('A stair landing needs one 2 m opening');
  return { ...layout, walls };
}

/** Assembly validates each floor graph; these are the explicit connections between both graphs. */
function validateConnections(world: GeneratedDungeon): void {
  for (const stair of world.stairs) {
    const axis = rotateCell({ x: 0, z: 1 }, stair.rotation);
    const lower = world.floors[stair.lowerFloor];
    const upper = world.floors[stair.upperFloor];
    if (upper.height - lower.height !== stair.rise || stair.rise !== 2 || stair.run !== 2)
      throw new Error('The native two-segment stair must meet both floor heights');
    if (
      !canStandInSectionLayout(lower.layout, stair.x - axis.x * 0.25, stair.z - axis.z * 0.25) ||
      !canStandInSectionLayout(
        upper.layout,
        stair.x + axis.x * (stair.run + 0.25),
        stair.z + axis.z * (stair.run + 0.25),
      )
    )
      throw new Error('Stair landings must connect to walkable floor on both ends');
  }
  if (
    !canStandInSectionLayout(world.floors[0].layout, world.spawn.x, world.spawn.z) ||
    !canStandInSectionLayout(world.floors[1].layout, world.exit.x, world.exit.z)
  )
    throw new Error('Generated start and goal must belong to their connected floor graphs');
}

/** Bounded grammar: every seed chooses actual branches, room footprints and global orientation. */
export function generateDungeon(seed: number): GeneratedDungeon {
  if (!isDungeonSeed(seed)) throw new RangeError('Dungeon seed must be an unsigned 32-bit integer');
  const random = new RNG(seed);
  const rotation = random.pick<QuarterTurn>([0, 1, 2, 3]);
  const crossroads = random.chance(0.5);
  const eastHall = random.chance(0.5);
  const goalHall = random.chance(0.5);
  const roomRotation = random.pick<QuarterTurn>([0, 2]);
  const lower: SectionPlacement[] = [
    placement('arrival', 'small-room', 0, 0, 0, ['south']),
    placement('entry-corridor', 'straight', 0, 6, 0, ['north', 'south']),
    placement(
      'junction',
      crossroads ? 'cross' : 'tee',
      0,
      12,
      crossroads ? 0 : 1,
      crossroads ? ['north', 'east', 'west'] : ['north', 'east'],
    ),
    placement('east-corridor', 'straight', 6, 12, 1, ['east', 'west']),
    placement('branch-room', eastHall ? 'great-hall' : 'small-room', eastHall ? 14 : 12, 12, roomRotation, [
      'west',
    ]),
  ];
  // The tee's south port is sealed here and replaced by the explicit stair opening below.
  if (crossroads) lower.push(placement('west-alcove', 'dead-end', -4, 12, 1, ['east']));
  const upper = [
    placement('upper-landing', 'great-hall', 4, 20, 0, ['north']),
    placement('upper-corridor', 'straight', 4, 14, 0, ['north', 'south']),
    placement('goal-room', goalHall ? 'great-hall' : 'small-room', 4, 8, roomRotation, ['south']),
  ];
  const point = (x: number, z: number) => rotateCell({ x, z }, rotation);
  const lowerEntry = point(0, 15);
  const upperEntry = point(0, 17);
  const lowerLayout = openStairLanding(
    assembleSectionLayout({
      id: 'crossroads',
      title: 'Lower floor',
      placements: lower.map((value) => rotatePlacement(value, rotation)),
    }),
    lowerEntry.x,
    lowerEntry.z,
  );
  const upperLayout = openStairLanding(
    assembleSectionLayout({
      id: 'long-hall',
      title: 'Upper floor',
      placements: upper.map((value) => rotatePlacement(value, rotation)),
    }),
    upperEntry.x,
    upperEntry.z,
  );
  const pose = (x: number, z: number, y: number, floor: DungeonFloorId): DungeonPose => ({
    ...point(x, z),
    y,
    floor,
  });
  const bounds = [lowerLayout.bounds, upperLayout.bounds];
  const facing = Math.atan2(point(0, 1).x, point(0, 1).z);
  const world: GeneratedDungeon = {
    seed,
    title: 'Two-floor expedition',
    rotation,
    recipe: `${crossroads ? 'cross' : 'tee'}-${eastHall ? 'hall' : 'room'}-${goalHall ? 'hall' : 'room'}-${rotation}-${roomRotation}`,
    floors: [
      { id: 0, height: 0, layout: lowerLayout },
      { id: 1, height: 2, layout: upperLayout },
    ],
    stairs: [
      {
        id: 'main-stairs',
        ...lowerEntry,
        rotation,
        width: 1.375,
        run: 2,
        rise: 2,
        lowerFloor: 0,
        upperFloor: 1,
      },
    ],
    spawn: { ...pose(0, -1, 0, 0), facing },
    returnDoor: { ...point(0, -2.5), floor: 0, reach: 1.1 },
    exit: { ...point(4, 8), y: 2, floor: 1, reach: 0.9 },
    bounds: {
      minX: Math.min(...bounds.map((value) => value.minX)),
      maxX: Math.max(...bounds.map((value) => value.maxX)),
      minZ: Math.min(...bounds.map((value) => value.minZ)),
      maxZ: Math.max(...bounds.map((value) => value.maxZ)),
    },
    routeWaypoints: [
      pose(0, -1, 0, 0),
      pose(0, 12, 0, 0),
      pose(0, 15, 0, 0),
      pose(0, 16, 1, 0),
      pose(0, 17.5, 2, 1),
      pose(4, 17.5, 2, 1),
      pose(4, 8, 2, 1),
    ],
    branchWaypoints: [pose(eastHall ? 14 : 12, 12, 0, 0), ...(crossroads ? [pose(-5, 12, 0, 0)] : [])],
  };
  validateConnections(world);
  return world;
}
