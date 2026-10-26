export type Cardinal = 'north' | 'east' | 'south' | 'west';
export type QuarterTurn = 0 | 1 | 2 | 3;
export type LayoutId = 'crossroads' | 'long-hall';
export type SectionKind = 'straight' | 'bend' | 'tee' | 'cross' | 'dead-end' | 'small-room' | 'great-hall';

export interface GridCell {
  readonly x: number;
  readonly z: number;
}

export interface SectionTemplate {
  readonly kind: SectionKind;
  readonly title: string;
  readonly cells: readonly GridCell[];
  readonly sockets: readonly { readonly side: Cardinal; readonly cell: GridCell }[];
}

export interface SectionPlacement {
  readonly id: string;
  readonly kind: SectionKind;
  readonly x: number;
  readonly z: number;
  readonly rotation: QuarterTurn;
  /** Local socket directions deliberately closed with the same native walls. */
  readonly sealed: readonly Cardinal[];
}

export interface PlacedSection extends SectionPlacement {
  readonly title: string;
}

export interface FloorCell extends GridCell {
  readonly sectionId: string;
}

export interface BoundaryWall extends FloorCell {
  /** The floor's outside edge; wall thickness extends outwards from this line. */
  readonly side: Cardinal;
}

export interface SectionSocket extends FloorCell {
  readonly side: Cardinal;
  readonly width: 2;
  readonly floor: 0;
  readonly sealed: boolean;
}

export interface Footprint {
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
}

export interface SectionProp extends GridCell {
  readonly id: string;
  readonly kind: 'pillar' | 'chest';
  readonly rotation: number;
  readonly footprint: Footprint;
}

export interface SectionLayout {
  readonly id: LayoutId;
  readonly title: string;
  readonly sections: readonly PlacedSection[];
  readonly floorCells: readonly FloorCell[];
  readonly walls: readonly BoundaryWall[];
  readonly sockets: readonly SectionSocket[];
  readonly props: readonly SectionProp[];
  readonly spawn: { readonly x: number; readonly z: number; readonly facing: number };
  readonly returnDoor: { readonly x: number; readonly z: number; readonly reach: number };
  readonly bounds: Footprint;
}

export const SIDES: readonly Cardinal[] = ['north', 'east', 'south', 'west'];
export const SECTION_CELL_SIZE = 2;
export const WALL_THICKNESS = 0.25;

export function direction(side: Cardinal): GridCell {
  switch (side) {
    case 'north':
      return { x: 0, z: -1 };
    case 'east':
      return { x: 1, z: 0 };
    case 'south':
      return { x: 0, z: 1 };
    case 'west':
      return { x: -1, z: 0 };
  }
}

export function rotateCell(cell: GridCell, rotation: QuarterTurn): GridCell {
  switch (rotation) {
    case 0:
      return { x: cell.x, z: cell.z };
    case 1:
      return { x: -cell.z, z: cell.x };
    case 2:
      return { x: -cell.x, z: -cell.z };
    case 3:
      return { x: cell.z, z: -cell.x };
  }
}

export function rotateSide(side: Cardinal, rotation: QuarterTurn): Cardinal {
  const result = SIDES[(SIDES.indexOf(side) + rotation) % 4];
  if (!result) throw new Error('Invalid section direction');
  return result;
}

function rectangle(halfX: number, halfZ: number): GridCell[] {
  const cells: GridCell[] = [];
  for (let z = -halfZ; z <= halfZ; z += 1) {
    for (let x = -halfX; x <= halfX; x += 1) cells.push({ x, z });
  }
  return cells;
}

export const SECTION_KINDS: readonly SectionTemplate[] = [
  {
    kind: 'straight',
    title: 'Straight corridor',
    cells: [
      { x: 0, z: -1 },
      { x: 0, z: 0 },
      { x: 0, z: 1 },
    ],
    sockets: [
      { side: 'north', cell: { x: 0, z: -1 } },
      { side: 'south', cell: { x: 0, z: 1 } },
    ],
  },
  {
    kind: 'bend',
    title: 'Corner corridor',
    cells: [
      { x: 0, z: -1 },
      { x: 0, z: 0 },
      { x: 1, z: 0 },
    ],
    sockets: [
      { side: 'north', cell: { x: 0, z: -1 } },
      { side: 'east', cell: { x: 1, z: 0 } },
    ],
  },
  {
    kind: 'tee',
    title: 'T intersection',
    cells: [
      { x: 0, z: -1 },
      { x: 0, z: 0 },
      { x: -1, z: 0 },
      { x: 1, z: 0 },
    ],
    sockets: [
      { side: 'north', cell: { x: 0, z: -1 } },
      { side: 'east', cell: { x: 1, z: 0 } },
      { side: 'west', cell: { x: -1, z: 0 } },
    ],
  },
  {
    kind: 'cross',
    title: 'Crossroads',
    cells: [
      { x: 0, z: -1 },
      { x: 0, z: 0 },
      { x: -1, z: 0 },
      { x: 1, z: 0 },
      { x: 0, z: 1 },
    ],
    sockets: [
      { side: 'north', cell: { x: 0, z: -1 } },
      { side: 'east', cell: { x: 1, z: 0 } },
      { side: 'south', cell: { x: 0, z: 1 } },
      { side: 'west', cell: { x: -1, z: 0 } },
    ],
  },
  {
    kind: 'dead-end',
    title: 'Dead-end alcove',
    cells: [
      { x: 0, z: 0 },
      { x: 0, z: 1 },
    ],
    sockets: [{ side: 'north', cell: { x: 0, z: 0 } }],
  },
  {
    kind: 'small-room',
    title: 'Small room · 6 × 6 m',
    cells: rectangle(1, 1),
    sockets: [
      { side: 'north', cell: { x: 0, z: -1 } },
      { side: 'east', cell: { x: 1, z: 0 } },
      { side: 'south', cell: { x: 0, z: 1 } },
      { side: 'west', cell: { x: -1, z: 0 } },
    ],
  },
  {
    kind: 'great-hall',
    title: 'Great hall · 10 × 6 m',
    cells: rectangle(2, 1),
    sockets: [
      { side: 'north', cell: { x: 0, z: -1 } },
      { side: 'east', cell: { x: 2, z: 0 } },
      { side: 'south', cell: { x: 0, z: 1 } },
      { side: 'west', cell: { x: -2, z: 0 } },
    ],
  },
];

export function getSection(kind: SectionKind): SectionTemplate {
  const section = SECTION_KINDS.find((candidate) => candidate.kind === kind);
  if (!section) throw new Error(`Unknown section: ${kind}`);
  return section;
}
