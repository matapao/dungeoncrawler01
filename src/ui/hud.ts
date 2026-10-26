import { nearbyTunnel } from '../game/hub.ts';
import type { HeroPosition } from '../game/hub.ts';
import { doorDestination, TRAVEL_TICKS } from '../game/locations.ts';
import type { LocationId, Travel } from '../game/locations.ts';
import { DUNGEON_CHOICES, dungeonTitle, isDungeonChoice } from '../game/dungeon-choice.ts';
import type { DungeonChoice } from '../game/dungeon-choice.ts';
import { isDungeonSeed } from '../game/generated-dungeon.ts';
import type { GeneratedDungeon } from '../game/generated-dungeon.ts';
import { CAMERA_VIEWS } from '../view/camera-views.ts';
import type { CameraView } from '../view/camera-views.ts';

export function createHud(
  host: HTMLElement,
  actions: {
    inspect(): void;
    chooseLayout(choice: DungeonChoice): void;
    focusLayout(): void;
    chooseSeed(seed: number): void;
    nextSeed(): void;
    chooseView(view: CameraView): void;
  },
) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <header>
      <div class="eyebrow">DungeonCrawler01 <span>Alpha · Phase 3</span></div>
      <h1>The Gathering</h1>
      <p>Every adventure begins together.</p>
    </header>
    <aside aria-label="Build scope" class="build-note">
      <span class="status-dot"></span> Two floors · 1 player
    </aside>
    <section class="arrival-note" aria-label="Current objective">
      <div class="eyebrow">Welcome, adventurer</div>
      <h2>A place to meet.</h2>
      <p>Choose a seed, then find Friends. Press F nearby to enter the two-floor dungeon.</p>
      <p class="future">Walk upstairs to the upper lookout, then find your way back. Earlier rooms remain available.</p>
    </section>
    <label class="layout-picker">Layout <select class="layout-select" aria-label="Layout"></select></label>
    <div class="seed-picker"><label>Seed <input class="seed-input" type="number" min="0" max="4294967295" step="1" aria-label="Dungeon seed" /></label><button class="next-seed" type="button">Next seed</button></div>
    <label class="camera-picker" hidden>View <select class="camera-select" aria-label="Camera view"></select></label>
    <button class="inspect-room" type="button" hidden aria-pressed="false" title="Walking or moving the camera returns to following your hero">Inspect room</button>
    <footer>
      <div class="prompt" role="status" aria-live="polite"></div>
      <div class="controls"><span><kbd>W A S D</kbd> move / strafe</span><span><kbd>Q E</kbd> or <kbd>← →</kbd> turn</span><span><kbd>Space</kbd> hop</span><span><kbd>F</kbd> use doorway</span></div>
      <div class="mouse-controls">Drag either mouse button to look · Scroll to zoom · Hold both buttons to walk</div>
      <p class="scope">The same dungeon in every view · Walk the stairs to change floors</p>
    </footer>
    <div class="travel-fade" aria-hidden="true"></div>
  `;
  host.append(overlay);
  const prompt = overlay.querySelector('.prompt');
  const title = overlay.querySelector('h1');
  const subtitle = overlay.querySelector('header p');
  const note = overlay.querySelector('.arrival-note');
  const fade = overlay.querySelector('.travel-fade');
  const inspect = overlay.querySelector('.inspect-room');
  const layout = overlay.querySelector('.layout-select');
  const picker = overlay.querySelector('.layout-picker');
  const seedPicker = overlay.querySelector('.seed-picker');
  const seedInput = overlay.querySelector('.seed-input');
  const nextSeed = overlay.querySelector('.next-seed');
  const cameraPicker = overlay.querySelector('.camera-picker');
  const cameraSelect = overlay.querySelector('.camera-select');
  if (
    !(prompt instanceof HTMLElement) ||
    !(title instanceof HTMLElement) ||
    !(subtitle instanceof HTMLElement) ||
    !(note instanceof HTMLElement) ||
    !(fade instanceof HTMLElement) ||
    !(inspect instanceof HTMLButtonElement) ||
    !(layout instanceof HTMLSelectElement) ||
    !(picker instanceof HTMLElement) ||
    !(seedPicker instanceof HTMLElement) ||
    !(seedInput instanceof HTMLInputElement) ||
    !(nextSeed instanceof HTMLButtonElement) ||
    !(cameraPicker instanceof HTMLElement) ||
    !(cameraSelect instanceof HTMLSelectElement)
  ) {
    throw new Error('Missing location HUD');
  }
  inspect.addEventListener('click', actions.inspect);
  for (const choice of DUNGEON_CHOICES) {
    const option = document.createElement('option');
    option.value = choice.id;
    option.textContent = choice.title;
    layout.append(option);
  }
  layout.addEventListener('focus', actions.focusLayout);
  layout.addEventListener('change', () => {
    if (isDungeonChoice(layout.value)) actions.chooseLayout(layout.value);
    layout.blur();
  });
  seedInput.addEventListener('focus', actions.focusLayout);
  seedInput.addEventListener('change', () => {
    if (isDungeonSeed(seedInput.valueAsNumber)) actions.chooseSeed(seedInput.valueAsNumber);
    else seedInput.reportValidity();
  });
  nextSeed.addEventListener('click', actions.nextSeed);
  for (const preset of CAMERA_VIEWS) {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.label;
    cameraSelect.append(option);
  }
  cameraSelect.addEventListener('focus', actions.focusLayout);
  cameraSelect.addEventListener('change', () => {
    const preset = CAMERA_VIEWS.find((candidate) => candidate.id === cameraSelect.value);
    if (preset) actions.chooseView(preset.id);
    cameraSelect.blur();
  });
  let previous = '';
  return {
    update(
      hero: HeroPosition,
      location: LocationId,
      travel: Travel | undefined,
      overview: boolean,
      choice: DungeonChoice,
      sectionName: string,
      info: { seed: number; dungeon: GeneratedDungeon; cameraView: CameraView; atGoal: boolean },
    ) {
      const tunnel = location === 'hub' ? nearbyTunnel(hero) : undefined;
      const generated = choice === 'generated';
      const destination = doorDestination(location, hero, choice, info.dungeon);
      const text = travel
        ? `Travelling to ${travel.destination === 'hub' ? 'the gathering hub' : 'the Friends chamber'}…`
        : generated && location === 'chamber' && info.cameraView === 'slice'
          ? 'Building slice · Inspect both floors · Choose a play view to walk'
          : destination
            ? `Press F · ${destination === 'hub' ? 'Return to the hub' : 'Enter the Friends chamber'}`
            : generated && location === 'chamber'
              ? info.atGoal
                ? 'Upper lookout reached · Walk back down the stairs to return'
                : hero.floor === 0
                  ? 'Find the stairs and explore the upper floor'
                  : 'Explore the upper floor · Return by the stairs'
              : location === 'chamber'
                ? `${sectionName} · Return to the green doorway to reach the hub`
                : tunnel
                  ? `${tunnel.name} · Race entrance preview. Racing comes in a later block.`
                  : 'Find Friends · Press F at its doorway to enter';
      if (text !== previous) {
        prompt.textContent = text;
        previous = text;
      }
      title.textContent = location === 'hub' ? 'The Gathering' : dungeonTitle(choice);
      const floorText = hero.y > 0 && hero.y < 2 ? 'On the stairs' : `Floor ${hero.floor + 1} of 2`;
      subtitle.textContent =
        location === 'hub'
          ? 'Every adventure begins together.'
          : generated
            ? `${floorText} · ${sectionName} · Seed ${info.seed}`
            : sectionName;
      note.hidden = location !== 'hub';
      picker.hidden = location !== 'hub';
      layout.disabled = travel !== undefined;
      layout.value = choice;
      seedPicker.hidden = location !== 'hub' || !generated;
      seedInput.disabled = travel !== undefined;
      nextSeed.disabled = travel !== undefined;
      if (document.activeElement !== seedInput) seedInput.value = String(info.seed);
      cameraPicker.hidden = location !== 'chamber' || !generated;
      cameraSelect.disabled = travel !== undefined;
      cameraSelect.value = info.cameraView;
      inspect.hidden = location !== 'chamber' || generated;
      inspect.disabled = travel !== undefined;
      inspect.textContent = overview
        ? 'Follow hero'
        : choice === 'reference'
          ? 'Inspect room'
          : 'Inspect layout';
      inspect.setAttribute('aria-pressed', String(overview));
      fade.style.opacity = travel ? String(Math.sin((Math.PI * travel.elapsedTicks) / TRAVEL_TICKS)) : '0';
      // A read-only observation surface for browser checks; it cannot change gameplay.
      host.dataset['heroX'] = hero.x.toFixed(4);
      host.dataset['heroZ'] = hero.z.toFixed(4);
      host.dataset['location'] = location;
      host.dataset['gait'] = hero.gait;
      host.dataset['facing'] = String(hero.facing);
      host.dataset['travelling'] = String(travel !== undefined);
      host.dataset['layoutId'] = choice;
      host.dataset['section'] = sectionName;
      host.dataset['heroY'] = String(hero.y);
      host.dataset['floor'] = String(hero.floor);
      host.dataset['dungeonSeed'] = String(info.seed);
      host.dataset['dungeonRecipe'] = info.dungeon.recipe;
      host.dataset['cameraView'] = info.cameraView;
      host.dataset['atGoal'] = String(info.atGoal);
    },
    dispose() {
      overlay.remove();
    },
  };
}
