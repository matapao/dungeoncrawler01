import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isCommand } from '../src/game/commands.ts';
import {
  ARRIVAL,
  WALK_SPEED,
  canStand,
  FIXED_STEP,
  HERO_RADIUS,
  HUB_RADIUS,
  MONUMENT_RADIUS,
  nearbyTunnel,
} from '../src/game/hub.ts';
import { HubSimulation } from '../src/game/simulation.ts';

test('untrusted movement rejects invalid shapes and non-finite or oversized values', () => {
  for (const command of [
    null,
    [],
    {},
    { type: 'enter' },
    { type: 'move', x: NaN, z: 0 },
    { type: 'move', x: Infinity, z: 0 },
    { type: 'move', x: 2, z: 0 },
    { type: 'move', x: '0', z: 0 },
  ]) {
    assert.equal(isCommand(command), false);
    assert.equal(new HubSimulation().apply(command), false);
  }
  assert.equal(isCommand({ type: 'move', x: 1, z: -1 }), true);
});

test('equal elapsed simulation time gives equal straight and diagonal speed', () => {
  const straight = new HubSimulation();
  const diagonal = new HubSimulation();
  straight.apply({ type: 'move', x: 1, z: 0 });
  diagonal.apply({ type: 'move', x: 1, z: 1 });
  for (let i = 0; i < 30; i++) {
    straight.step();
    diagonal.step();
  }
  const distance = (sim: HubSimulation) => Math.hypot(sim.hero.x - ARRIVAL.x, sim.hero.z - ARRIVAL.z);
  assert.ok(Math.abs(distance(straight) - WALK_SPEED * 30 * FIXED_STEP) < 1e-8);
  assert.ok(Math.abs(distance(straight) - distance(diagonal)) < 1e-8);
});

test('the monument, outer rim and tunnel backs cannot be crossed', () => {
  const sim = new HubSimulation();
  sim.apply({ type: 'move', x: 0, z: -1 });
  for (let i = 0; i < 600; i++) sim.step();
  assert.ok(Math.hypot(sim.hero.x, sim.hero.z) >= MONUMENT_RADIUS + HERO_RADIUS);
  assert.ok(sim.hero.z < ARRIVAL.z);
  sim.apply({ type: 'move', x: 1, z: 0 });
  for (let i = 0; i < 600; i++) sim.step();
  assert.ok(Math.hypot(sim.hero.x, sim.hero.z) <= HUB_RADIUS - HERO_RADIUS);
  assert.equal(canStand(-8.5, -5.6), false);
  assert.equal(canStand(-8.5, -4.4), true);
  assert.equal(canStand(NaN, 0), false);
});

test('stopping movement holds position and identical commands replay identically', () => {
  const a = new HubSimulation();
  const b = new HubSimulation();
  for (const sim of [a, b]) {
    sim.apply({ type: 'move', x: -1, z: 0 });
    for (let i = 0; i < 194; i++) sim.step();
    sim.apply({ type: 'move', x: 0, z: -1 });
    for (let i = 0; i < 194; i++) sim.step();
    sim.apply({ type: 'move', x: 0, z: 0 });
    const before = { ...sim.hero };
    for (let i = 0; i < 60; i++) sim.step();
    assert.equal(sim.hero.x, before.x);
    assert.equal(sim.hero.z, before.z);
    assert.equal(sim.hero.moving, false);
  }
  assert.deepEqual(a.hero, b.hero);
  assert.equal(nearbyTunnel(a.hero)?.id, 'friends');
});
