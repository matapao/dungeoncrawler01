import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isCommand } from '../src/game/commands.ts';
import { DEFAULT_DUNGEON_SEED, generateDungeon } from '../src/game/generated-dungeon.ts';
import type { DungeonPose } from '../src/game/generated-dungeon.ts';
import { ARRIVAL, FIXED_STEP, WALK_SPEED } from '../src/game/hub.ts';
import { TRAVEL_TICKS } from '../src/game/locations.ts';
import { HubSimulation } from '../src/game/simulation.ts';

function step(sim: HubSimulation, ticks: number) {
  for (let tick = 0; tick < ticks; tick++) sim.step();
}
function moveTo(sim: HubSimulation, x: number, z: number) {
  let remaining = Math.hypot(x - sim.hero.x, z - sim.hero.z);
  let ticks = 0;
  while (remaining > 1e-7) {
    assert.ok(ticks++ < 2000, `movement reaches ${x},${z}; actual ${sim.hero.x},${sim.hero.z}`);
    const scale = Math.min(1, remaining / (FIXED_STEP * WALK_SPEED));
    assert.equal(
      sim.apply({
        type: 'move',
        x: ((x - sim.hero.x) / remaining) * scale,
        z: ((z - sim.hero.z) / remaining) * scale,
      }),
      true,
    );
    sim.step();
    remaining = Math.hypot(x - sim.hero.x, z - sim.hero.z);
  }
  sim.apply({ type: 'move', x: 0, z: 0 });
}
function enter(sim: HubSimulation) {
  moveTo(sim, -8.4, ARRIVAL.z);
  moveTo(sim, -8.4, -3.8);
  assert.equal(sim.apply({ type: 'interact' }), true);
  assert.equal(sim.apply({ type: 'choose-seed', seed: 45 }), false, 'travel locks seed selection');
  step(sim, TRAVEL_TICKS);
  assert.equal(sim.location, 'chamber');
}
function tour(sim: HubSimulation, route: readonly DungeonPose[]) {
  for (const point of route) moveTo(sim, point.x, point.z);
}

test('seed choice rejects malformed input and changes a generated dungeon only in the hub', () => {
  const sim = new HubSimulation();
  assert.equal(sim.layoutId, 'generated');
  assert.equal(sim.seed, DEFAULT_DUNGEON_SEED);
  for (const seed of [-1, 0x100000000, 1.5, Infinity, NaN, '17', null, undefined]) {
    assert.equal(isCommand({ type: 'choose-seed', seed }), false);
    assert.equal(sim.apply({ type: 'choose-seed', seed }), false);
    assert.equal(sim.seed, DEFAULT_DUNGEON_SEED);
  }
  assert.equal(isCommand({ type: 'choose-seed' }), false);
  assert.equal(sim.apply({ type: 'choose-seed', seed: 0xffffffff }), true);
  assert.equal(sim.seed, 0xffffffff);
  assert.deepEqual(sim.dungeon, generateDungeon(0xffffffff));
  sim.apply({ type: 'move', x: 1, z: 0 });
  sim.step();
  const beforeSeed = { ...sim.hero };
  assert.equal(sim.apply({ type: 'choose-seed', seed: 0 }), true);
  assert.equal(sim.hero.moving, false);
  step(sim, 60);
  assert.equal(sim.hero.x, beforeSeed.x, 'changing the seed releases held movement');
  assert.equal(sim.hero.z, beforeSeed.z);
  assert.equal(sim.hero.y, 0);
  assert.equal(sim.hero.floor, 0);
  enter(sim);
  const dungeon = sim.dungeon;
  assert.equal(sim.apply({ type: 'choose-seed', seed: 17 }), false);
  assert.equal(sim.seed, 0);
  assert.deepEqual(sim.dungeon, dungeon);
  assert.equal(sim.apply({ type: 'interact' }), false, 'spawn is clear of the return trigger');
});

test('authoritative movement walks both floors and goal, returns, and replays the same physical journey', () => {
  const orientations = new Map<number, number>();
  for (let seed = 0; seed < 100 && orientations.size < 4; seed++)
    orientations.set(generateDungeon(seed).rotation, seed);
  assert.equal(orientations.size, 4);
  for (const seed of [...orientations.values(), DEFAULT_DUNGEON_SEED]) {
    const outcomes = [];
    for (let replay = 0; replay < 2; replay++) {
      const sim = new HubSimulation();
      assert.equal(sim.apply({ type: 'choose-seed', seed }), true);
      enter(sim);
      assert.equal(sim.atGoal, false);
      tour(sim, sim.dungeon.routeWaypoints);
      assert.equal(sim.hero.floor, 1);
      assert.equal(sim.hero.y, 2);
      assert.equal(sim.atGoal, true, 'upper goal requires the physically reached upper floor');
      assert.equal(
        sim.apply({ type: 'interact' }),
        false,
        'the goal does not automatically leave the dungeon',
      );
      tour(sim, sim.dungeon.routeWaypoints.slice().reverse());
      assert.equal(sim.hero.floor, 0);
      assert.equal(sim.hero.y, 0);
      assert.equal(sim.atGoal, false);
      moveTo(sim, sim.dungeon.returnDoor.x, sim.dungeon.returnDoor.z);
      assert.equal(sim.apply({ type: 'interact' }), true);
      step(sim, TRAVEL_TICKS);
      assert.equal(sim.location, 'hub');
      assert.deepEqual(
        { x: sim.hero.x, z: sim.hero.z, y: sim.hero.y, floor: sim.hero.floor },
        { ...ARRIVAL, y: 0, floor: 0 },
      );
      assert.equal(sim.seed, seed, 'return retains the dungeon seed');
      outcomes.push({ hero: { ...sim.hero }, world: sim.dungeon, atGoal: sim.atGoal });
    }
    assert.deepEqual(outcomes[0], outcomes[1]);
  }
});
