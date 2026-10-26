import { HERO_RADIUS } from './hub.ts';
import type { Footprint, PlacedSection, SectionLayout } from './sections.ts';

function circleTouchesBox(x: number, z: number, box: Footprint): boolean {
  const nearestX = Math.max(box.minX, Math.min(box.maxX, x));
  const nearestZ = Math.max(box.minZ, Math.min(box.maxZ, z));
  return Math.hypot(x - nearestX, z - nearestZ) < HERO_RADIUS - 1e-8;
}

export function sectionAt(layout: SectionLayout, x: number, z: number): PlacedSection | undefined {
  const cell = layout.floorCells.find(
    (candidate) => Math.abs(candidate.x - x) <= 0.5 && Math.abs(candidate.z - z) <= 0.5,
  );
  return cell ? layout.sections.find((section) => section.id === cell.sectionId) : undefined;
}

/** Hidden cutaway walls remain authoritative; open joins have no boundary segment. */
export function canStandInSectionLayout(layout: SectionLayout, x: number, z: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(z) || !sectionAt(layout, x, z)) return false;
  for (const wall of layout.walls) {
    const vertical = wall.side === 'east' || wall.side === 'west';
    const nearestX = vertical ? wall.x : Math.max(wall.x - 0.5, Math.min(wall.x + 0.5, x));
    const nearestZ = vertical ? Math.max(wall.z - 0.5, Math.min(wall.z + 0.5, z)) : wall.z;
    if (Math.hypot(x - nearestX, z - nearestZ) < HERO_RADIUS - 1e-8) return false;
  }
  return !layout.props.some((prop) => circleTouchesBox(x, z, prop.footprint));
}
