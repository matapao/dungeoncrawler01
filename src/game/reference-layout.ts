import { HERO_RADIUS } from './hub.ts';

interface SolidFootprint {
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
}

// Measured native KayKit footprints at uniform .25 scale; metres on the walk plane.
const SOLIDS: readonly SolidFootprint[] = [
  { minX: -4.5, maxX: -1.5, minZ: -0.925, maxZ: -0.675 },
  { minX: -4, maxX: -2.375, minZ: 1.375, maxZ: 1.625 },
  { minX: -2.625, maxX: -2.375, minZ: 1.625, maxZ: 2 },
  { minX: -2.6875, maxX: -2.3125, minZ: 2.8125, maxZ: 3.1875 },
  { minX: 2, maxX: 2.25, minZ: -0.925, maxZ: -0.675 },
  { minX: 2.75, maxX: 3, minZ: -0.925, maxZ: -0.675 },
  { minX: 2.2875, maxX: 2.7125, minZ: 1.325, maxZ: 1.6865 },
  { minX: 2.3125, maxX: 2.6875, minZ: 2.8125, maxZ: 3.1875 },
];

export function overlapsReferencePiece(x: number, z: number): boolean {
  return SOLIDS.some((solid) => {
    const nearestX = Math.max(solid.minX, Math.min(solid.maxX, x));
    const nearestZ = Math.max(solid.minZ, Math.min(solid.maxZ, z));
    return Math.hypot(x - nearestX, z - nearestZ) < HERO_RADIUS;
  });
}
