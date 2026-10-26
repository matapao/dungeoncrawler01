import type { HeroPosition } from '../game/hub.ts';

/** TD01's previous/current presentation blend; both the model and camera use this pose. */
export function interpolateHero(
  previous: { x: number; z: number; y: number },
  hero: HeroPosition,
  alpha: number,
): HeroPosition {
  return {
    ...hero,
    x: previous.x + (hero.x - previous.x) * alpha,
    z: previous.z + (hero.z - previous.z) * alpha,
    y: previous.y + (hero.y - previous.y) * alpha,
  };
}
