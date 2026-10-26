import type { Gait } from './hub.ts';
import { isDungeonChoice } from './dungeon-choice.ts';
import type { DungeonChoice } from './dungeon-choice.ts';
import { isDungeonSeed } from './generated-dungeon.ts';

export type Command =
  | {
      readonly type: 'move';
      readonly x: number;
      readonly z: number;
      readonly look?: number;
      readonly gait?: Gait;
    }
  | { readonly type: 'interact' }
  | { readonly type: 'choose-layout'; readonly layoutId: DungeonChoice }
  | { readonly type: 'choose-seed'; readonly seed: number };

export function isCommand(value: unknown): value is Command {
  if (!value || typeof value !== 'object') return false;
  if (!('type' in value)) return false;
  if (value.type === 'interact') return true;
  if (value.type === 'choose-layout') return 'layoutId' in value && isDungeonChoice(value.layoutId);
  if (value.type === 'choose-seed') return 'seed' in value && isDungeonSeed(value.seed);
  if (value.type !== 'move') return false;
  if (
    'look' in value &&
    (typeof value.look !== 'number' || !Number.isFinite(value.look) || Math.abs(value.look) > Math.PI)
  )
    return false;
  if (
    'gait' in value &&
    (typeof value.gait !== 'string' || !['idle', 'fwd', 'back', 'left', 'right'].includes(value.gait))
  )
    return false;
  return (
    'x' in value &&
    typeof value.x === 'number' &&
    Number.isFinite(value.x) &&
    Math.abs(value.x) <= 1 &&
    'z' in value &&
    typeof value.z === 'number' &&
    Number.isFinite(value.z) &&
    Math.abs(value.z) <= 1
  );
}
