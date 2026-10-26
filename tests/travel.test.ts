import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isCommand } from '../src/game/commands.ts';
import { ARRIVAL, HERO_RADIUS } from '../src/game/hub.ts';
import { CHAMBER, canStandInChamber, SPAWNS, TRAVEL_TICKS } from '../src/game/locations.ts';
import { HubSimulation } from '../src/game/simulation.ts';

function steps(sim: HubSimulation, count: number) {
  for (let i = 0; i < count; i++) sim.step();
}

function walk(sim: HubSimulation, x: number, z: number, ticks: number) {
  assert.equal(sim.apply({ type: 'move', x, z }), true);
  steps(sim, ticks);
  sim.apply({ type: 'move', x: 0, z: 0 });
}

function crossToReturnLane(sim: HubSimulation) {
  assert.equal(sim.apply({ type: 'move', x: -1, z: 0 }), true);
  for (let i = 0; i < 600 && sim.hero.x > 0.04; i++) sim.step();
  sim.apply({ type: 'move', x: 0, z: 0 });
  assert.ok(Math.abs(sim.hero.x) < 0.05, 'the return doorway lane remains reachable');
}

function approachFriends(sim: HubSimulation) {
  walk(sim, -1, 0, 194);
  walk(sim, 0, -1, 194);
}

test('interaction is validated and only the nearby Friends entrance is usable', () => {
  const sim = new HubSimulation();
  assert.equal(sim.apply({ type: 'choose-layout', layoutId: 'reference' }), true);
  assert.equal(isCommand({ type: 'interact' }), true);
  assert.equal(isCommand({ type: 'teleport', destination: 'chamber' }), false);
  assert.equal(sim.apply({ type: 'interact' }), false, 'arrival is outside doorway reach');
  walk(sim, 1, 0, 107);
  walk(sim, 0, -1, 325);
  assert.equal(sim.apply({ type: 'interact' }), false, 'race entrances remain previews');
  assert.equal(sim.location, 'hub');
  const friends = new HubSimulation();
  approachFriends(friends);
  assert.equal(friends.apply({ type: 'interact' }), true);
  assert.equal(friends.transition?.destination, 'chamber');
});

test('travel swaps at the fade midpoint, locks repeated actions and clears old movement', () => {
  const sim = new HubSimulation();
  assert.equal(sim.apply({ type: 'choose-layout', layoutId: 'reference' }), true);
  approachFriends(sim);
  sim.apply({ type: 'move', x: 0, z: -1 });
  assert.equal(sim.apply({ type: 'interact' }), true);
  const departure = { ...sim.hero };
  for (let i = 0; i < TRAVEL_TICKS / 2 - 1; i++) {
    assert.equal(sim.apply({ type: 'interact' }), false);
    assert.equal(sim.apply({ type: 'move', x: 1, z: 0 }), false);
    sim.step();
  }
  assert.equal(sim.location, 'hub');
  assert.deepEqual(sim.hero, departure);
  sim.step();
  assert.equal(sim.location, 'chamber');
  assert.equal(sim.hero.x, SPAWNS.chamber.x);
  assert.equal(sim.hero.z, SPAWNS.chamber.z);
  assert.equal(sim.apply({ type: 'interact' }), false);
  steps(sim, TRAVEL_TICKS / 2);
  assert.equal(sim.transition, undefined);
  const arrived = { ...sim.hero };
  steps(sim, 120);
  assert.deepEqual(sim.hero, arrived, 'held departure direction cannot leak into the chamber');
  assert.equal(sim.apply({ type: 'interact' }), false, 'chamber spawn is outside return reach');
});

test('the chamber contains movement and returns to the exact safe hub arrival on repeated trips', () => {
  const sim = new HubSimulation();
  assert.equal(sim.apply({ type: 'choose-layout', layoutId: 'reference' }), true);
  for (let trip = 0; trip < 3; trip++) {
    approachFriends(sim);
    assert.equal(sim.apply({ type: 'interact' }), true);
    steps(sim, TRAVEL_TICKS);
    walk(sim, 1, 0, 600);
    assert.ok(sim.hero.x <= CHAMBER.halfWidth - HERO_RADIUS);
    assert.ok(sim.hero.x > 4.8);
    crossToReturnLane(sim);
    walk(sim, 0, -1, 600);
    assert.ok(sim.hero.z >= -CHAMBER.halfDepth + HERO_RADIUS);
    assert.equal(sim.apply({ type: 'interact' }), true);
    steps(sim, TRAVEL_TICKS);
    assert.equal(sim.location, 'hub');
    assert.equal(sim.hero.x, ARRIVAL.x);
    assert.equal(sim.hero.z, ARRIVAL.z);
    assert.equal(sim.hero.moving, false);
    assert.equal(sim.apply({ type: 'interact' }), false, 'no automatic bounce back into Friends');
  }
  assert.equal(canStandInChamber(Infinity, 0), false);
  assert.equal(canStandInChamber(0, -5), false);
});
