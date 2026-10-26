import { direction, getSection, rotateCell, rotateSide, SIDES } from './sections.ts';
import type {
  FloorCell,
  LayoutId,
  PlacedSection,
  SectionLayout,
  SectionPlacement,
  SectionProp,
  SectionSocket,
} from './sections.ts';

export interface SectionLayoutDefinition {
  readonly id: LayoutId;
  readonly title: string;
  readonly placements: readonly SectionPlacement[];
  readonly props?: readonly SectionProp[];
}

function key(x: number, z: number): string {
  return `${x},${z}`;
}

function opposite(a: SectionSocket, b: SectionSocket): boolean {
  return a.side === rotateSide(b.side, 2) && a.width === b.width && a.floor === b.floor;
}

/** Authored sections are validated before either movement or rendering consumes them. */
export function assembleSectionLayout(definition: SectionLayoutDefinition): SectionLayout {
  if (definition.placements.length === 0) throw new Error('A layout needs at least one section');
  const sections: PlacedSection[] = [];
  const coarseCells = new Map<string, FloorCell>();
  const sockets: SectionSocket[] = [];
  const ids = new Set<string>();
  for (const placement of definition.placements) {
    if (!placement.id || ids.has(placement.id)) throw new Error('Section IDs must be unique');
    ids.add(placement.id);
    if (!Number.isInteger(placement.x / 2) || !Number.isInteger(placement.z / 2)) {
      throw new Error(`Section ${placement.id} must align to the 2 m grid`);
    }
    if (![0, 1, 2, 3].includes(placement.rotation))
      throw new Error('Only quarter-turn rotations are supported');
    const template = getSection(placement.kind);
    if (new Set(placement.sealed).size !== placement.sealed.length)
      throw new Error('Duplicate sealed socket');
    for (const side of placement.sealed) {
      if (!template.sockets.some((socket) => socket.side === side))
        throw new Error(`Unknown socket: ${side}`);
    }
    sections.push({ ...placement, title: template.title });
    for (const cell of template.cells) {
      const rotated = rotateCell(cell, placement.rotation);
      const x = placement.x + rotated.x * 2;
      const z = placement.z + rotated.z * 2;
      if (coarseCells.has(key(x, z))) throw new Error(`Section overlap at ${x}, ${z}`);
      coarseCells.set(key(x, z), { x, z, sectionId: placement.id });
    }
    for (const socket of template.sockets) {
      const rotated = rotateCell(socket.cell, placement.rotation);
      const side = rotateSide(socket.side, placement.rotation);
      const normal = direction(side);
      sockets.push({
        x: placement.x + rotated.x * 2 + normal.x,
        z: placement.z + rotated.z * 2 + normal.z,
        side,
        width: 2,
        floor: 0,
        sectionId: placement.id,
        sealed: placement.sealed.includes(socket.side),
      });
    }
  }

  for (const socket of sockets) {
    const partners = sockets.filter(
      (other) => other !== socket && other.x === socket.x && other.z === socket.z,
    );
    if (socket.sealed) {
      if (partners.length !== 0) throw new Error('A sealed socket cannot touch another opening');
    } else if (
      partners.length !== 1 ||
      !partners[0] ||
      partners[0].sealed ||
      !opposite(socket, partners[0])
    ) {
      throw new Error(`Unsealed or mismatched socket: ${socket.sectionId} ${socket.side}`);
    }
  }

  const joined = new Set(sockets.filter((socket) => !socket.sealed).map((socket) => key(socket.x, socket.z)));
  for (const cell of coarseCells.values()) {
    for (const side of SIDES) {
      const normal = direction(side);
      const neighbor = coarseCells.get(key(cell.x + normal.x * 2, cell.z + normal.z * 2));
      if (
        neighbor &&
        neighbor.sectionId !== cell.sectionId &&
        !joined.has(key(cell.x + normal.x, cell.z + normal.z))
      ) {
        throw new Error('Sections touch outside a compatible socket');
      }
    }
  }

  // Every section must be reachable through approved openings, rather than merely visible nearby.
  const first = sections[0];
  if (!first) throw new Error('Missing first section');
  const reachable = new Set([first.id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const socket of sockets) {
      if (socket.sealed || !reachable.has(socket.sectionId)) continue;
      const partner = sockets.find(
        (other) => other.sectionId !== socket.sectionId && other.x === socket.x && other.z === socket.z,
      );
      if (partner && !reachable.has(partner.sectionId)) {
        reachable.add(partner.sectionId);
        changed = true;
      }
    }
  }
  if (reachable.size !== sections.length) throw new Error('Layout contains a disconnected section');

  const floorCells: FloorCell[] = [];
  for (const cell of coarseCells.values()) {
    for (const dx of [-0.5, 0.5]) {
      for (const dz of [-0.5, 0.5])
        floorCells.push({ x: cell.x + dx, z: cell.z + dz, sectionId: cell.sectionId });
    }
  }
  const fineCells = new Set(floorCells.map((cell) => key(cell.x, cell.z)));
  const walls = floorCells.flatMap((cell) =>
    SIDES.flatMap((side) => {
      const normal = direction(side);
      return fineCells.has(key(cell.x + normal.x, cell.z + normal.z))
        ? []
        : [{ x: cell.x + normal.x * 0.5, z: cell.z + normal.z * 0.5, side, sectionId: cell.sectionId }];
    }),
  );
  const props = definition.props ?? [];
  for (const prop of props) {
    const box = prop.footprint;
    if (![prop.x, prop.z, prop.rotation, box.minX, box.maxX, box.minZ, box.maxZ].every(Number.isFinite)) {
      throw new Error('Prop coordinates must be finite');
    }
    if (box.minX >= box.maxX || box.minZ >= box.maxZ)
      throw new Error('Prop footprint must have positive area');
    if (!coarseCells.has(key(Math.floor((prop.x + 1) / 2) * 2, Math.floor((prop.z + 1) / 2) * 2))) {
      throw new Error('Prop must stand on a section floor');
    }
  }
  return {
    id: definition.id,
    title: definition.title,
    sections,
    floorCells,
    walls,
    sockets,
    props,
    spawn: { x: 0, z: -1, facing: 0 },
    returnDoor: { x: 0, z: -2.5, reach: 1.1 },
    bounds: {
      minX: Math.min(...floorCells.map((cell) => cell.x)) - 0.5,
      maxX: Math.max(...floorCells.map((cell) => cell.x)) + 0.5,
      minZ: Math.min(...floorCells.map((cell) => cell.z)) - 0.5,
      maxZ: Math.max(...floorCells.map((cell) => cell.z)) + 0.5,
    },
  };
}

function pillar(id: string, x: number, z: number): SectionProp {
  return {
    id,
    kind: 'pillar',
    x,
    z,
    rotation: 0,
    footprint: { minX: x - 0.1875, maxX: x + 0.1875, minZ: z - 0.1875, maxZ: z + 0.1875 },
  };
}

export const LAYOUTS: readonly SectionLayout[] = [
  assembleSectionLayout({
    id: 'crossroads',
    title: 'Crossroads walk',
    placements: [
      { id: 'arrival', kind: 'small-room', x: 0, z: 0, rotation: 0, sealed: ['north', 'east', 'west'] },
      { id: 'entry-corridor', kind: 'straight', x: 0, z: 6, rotation: 0, sealed: [] },
      { id: 'crossroads', kind: 'cross', x: 0, z: 12, rotation: 0, sealed: [] },
      { id: 'west-corridor', kind: 'straight', x: -6, z: 12, rotation: 1, sealed: [] },
      {
        id: 'great-hall',
        kind: 'great-hall',
        x: -14,
        z: 12,
        rotation: 0,
        sealed: ['north', 'south', 'west'],
      },
      { id: 'east-bend', kind: 'bend', x: 6, z: 12, rotation: 3, sealed: [] },
      { id: 'east-alcove', kind: 'dead-end', x: 6, z: 8, rotation: 2, sealed: [] },
      { id: 'south-tee', kind: 'tee', x: 0, z: 18, rotation: 0, sealed: [] },
      { id: 'west-alcove', kind: 'dead-end', x: -4, z: 18, rotation: 1, sealed: [] },
      { id: 'east-branch', kind: 'dead-end', x: 4, z: 18, rotation: 3, sealed: [] },
    ],
    props: [pillar('arrival-pillar', -2, 1), pillar('hall-pillar', -17, 13)],
  }),
  assembleSectionLayout({
    id: 'long-hall',
    title: 'Hall & corners',
    placements: [
      { id: 'arrival', kind: 'small-room', x: 0, z: 0, rotation: 0, sealed: ['north', 'south', 'west'] },
      { id: 'entry-corridor', kind: 'straight', x: 6, z: 0, rotation: 1, sealed: [] },
      { id: 'great-hall', kind: 'great-hall', x: 14, z: 0, rotation: 0, sealed: ['north', 'east'] },
      { id: 'crossroads', kind: 'cross', x: 14, z: 6, rotation: 0, sealed: [] },
      { id: 'south-corridor', kind: 'straight', x: 14, z: 12, rotation: 0, sealed: [] },
      { id: 'south-alcove', kind: 'dead-end', x: 14, z: 16, rotation: 0, sealed: [] },
      { id: 'west-bend', kind: 'bend', x: 8, z: 6, rotation: 0, sealed: ['north'] },
      { id: 'east-tee', kind: 'tee', x: 20, z: 6, rotation: 0, sealed: ['north', 'east'] },
    ],
    props: [pillar('arrival-pillar', -2, 1), pillar('hall-pillar', 17, -1)],
  }),
];

export function isLayoutId(value: unknown): value is LayoutId {
  return value === 'crossroads' || value === 'long-hall';
}

export function getLayout(id: LayoutId): SectionLayout {
  const layout = LAYOUTS.find((candidate) => candidate.id === id);
  if (!layout) throw new Error(`Unknown layout: ${id}`);
  return layout;
}
