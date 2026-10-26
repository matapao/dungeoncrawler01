import { ARRIVAL, HERO_RADIUS, nearbyTunnel } from './hub.ts';
import type { HeroPosition } from './hub.ts';
import { overlapsReferencePiece } from './reference-layout.ts';
import type { DungeonChoice } from './dungeon-choice.ts';
import { getLayout } from './section-layouts.ts';
import { canStandInSectionLayout } from './section-collision.ts';
import type { GeneratedDungeon } from './generated-dungeon.ts';

export type LocationId = 'hub' | 'chamber';
export const TRAVEL_TICKS = 30;
export const CHAMBER = { halfWidth: 5, halfDepth: 5 } as const;
export const RETURN_DOOR = { x: 0, z: -4.5, reach: 1.1 } as const;
export const SPAWNS = {
  hub: { ...ARRIVAL, facing: Math.PI },
  chamber: { x: 0, z: -3, facing: 0 },
} as const;

export interface Travel {
  readonly destination: LocationId;
  readonly elapsedTicks: number;
}

export function doorDestination(
  location: LocationId,
  hero: HeroPosition,
  choice: DungeonChoice = 'reference',
  dungeon?: GeneratedDungeon,
): LocationId | undefined {
  if (location === 'hub') return nearbyTunnel(hero)?.id === 'friends' ? 'chamber' : undefined;
  if (hero.floor !== 0 || Math.abs(hero.y) > 1e-7) return undefined;
  const door = returnDoorFor(choice, dungeon);
  return Math.hypot(hero.x - door.x, hero.z - door.z) <= door.reach ? 'hub' : undefined;
}

export function spawnFor(location: LocationId, choice: DungeonChoice, dungeon?: GeneratedDungeon) {
  if (location === 'hub') return { ...SPAWNS.hub, y: 0, floor: 0 as const };
  if (choice === 'generated') {
    if (!dungeon) throw new Error('Generated spawn needs its dungeon specification');
    return dungeon.spawn;
  }
  const spawn = choice === 'reference' ? SPAWNS.chamber : getLayout(choice).spawn;
  return { ...spawn, y: 0, floor: 0 as const };
}

export function returnDoorFor(choice: DungeonChoice, dungeon?: GeneratedDungeon) {
  if (choice === 'generated') {
    if (!dungeon) throw new Error('Generated return needs its dungeon specification');
    return dungeon.returnDoor;
  }
  return choice === 'reference' ? RETURN_DOOR : getLayout(choice).returnDoor;
}

export function canStandInDungeon(
  choice: Exclude<DungeonChoice, 'generated'>,
  x: number,
  z: number,
): boolean {
  return choice === 'reference' ? canStandInChamber(x, z) : canStandInSectionLayout(getLayout(choice), x, z);
}

export function canStandInChamber(x: number, z: number): boolean {
  return (
    Number.isFinite(x) &&
    Number.isFinite(z) &&
    Math.abs(x) <= CHAMBER.halfWidth - HERO_RADIUS &&
    Math.abs(z) <= CHAMBER.halfDepth - HERO_RADIUS &&
    !overlapsReferencePiece(x, z)
  );
}
