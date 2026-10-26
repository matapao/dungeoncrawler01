import { getLayout, isLayoutId, LAYOUTS } from './section-layouts.ts';
import type { LayoutId } from './sections.ts';

export type DungeonChoice = LayoutId | 'reference' | 'generated';
export const DEFAULT_DUNGEON: DungeonChoice = 'generated';
export const DUNGEON_CHOICES: readonly { readonly id: DungeonChoice; readonly title: string }[] = [
  { id: 'generated', title: 'Generated · two floors' },
  ...LAYOUTS.map((layout) => ({ id: layout.id, title: layout.title })),
  { id: 'reference', title: 'Reference pieces' },
];

export function isDungeonChoice(value: unknown): value is DungeonChoice {
  return value === 'generated' || value === 'reference' || isLayoutId(value);
}

export function dungeonTitle(choice: DungeonChoice): string {
  return choice === 'generated'
    ? 'Two-floor expedition'
    : choice === 'reference'
      ? 'The Reference Room'
      : getLayout(choice).title;
}
