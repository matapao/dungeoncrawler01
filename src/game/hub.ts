export const FIXED_STEP = 1 / 60;
// TD01's on-foot speed and body radius; retained as the dungeon movement contract.
export const WALK_SPEED = 2.6;
export const HERO_RADIUS = 0.13;
export const HUB_RADIUS = 12.5;
export const MONUMENT_RADIUS = 1.5;
export const ARRIVAL = { x: 0, z: 4.5 } as const;

export const TUNNELS = [
  { id: 'friends', name: 'Friends', x: -8.5, z: -5.5, color: '#8cd3b9' },
  { id: 'race-1', name: 'Race I', x: -4.6, z: -8.4, color: '#d8b479' },
  { id: 'race-2', name: 'Race II', x: 0, z: -9.6, color: '#9fbce6' },
  { id: 'race-3', name: 'Race III', x: 4.6, z: -8.4, color: '#c7a5de' },
  { id: 'race-4', name: 'Race IV', x: 8.5, z: -5.5, color: '#e0a28e' },
] as const;

export interface HeroPosition {
  readonly x: number;
  readonly z: number;
  readonly y: number;
  readonly floor: 0 | 1;
  readonly facing: number;
  readonly moving: boolean;
  readonly gait: Gait;
}

export type Gait = 'idle' | 'fwd' | 'back' | 'left' | 'right';

export function canStand(x: number, z: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  const distance = Math.hypot(x, z);
  if (distance > HUB_RADIUS - HERO_RADIUS || distance < MONUMENT_RADIUS + HERO_RADIUS) return false;
  // Thresholds stop walking; the Friends doorway transfers only on deliberate interaction.
  return !TUNNELS.some((t) => Math.abs(x - t.x) < 1.65 + HERO_RADIUS && z < t.z + HERO_RADIUS);
}

export function nearbyTunnel(hero: HeroPosition): (typeof TUNNELS)[number] | undefined {
  return TUNNELS.find((t) => Math.hypot(hero.x - t.x, hero.z - (t.z + 1.1)) < 2.1);
}
