import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canStandInChamber, SPAWNS, TRAVEL_TICKS } from '../src/game/locations.ts';
import { HubSimulation } from '../src/game/simulation.ts';

function walk(sim: HubSimulation, x: number, z: number, ticks: number) {
  assert.equal(sim.apply({ type: 'move', x, z }), true);
  for (let i = 0; i < ticks; i++) sim.step();
  sim.apply({ type: 'move', x: 0, z: 0 });
}

function enterRoom() {
  const sim = new HubSimulation();
  assert.equal(sim.apply({ type: 'choose-layout', layoutId: 'reference' }), true);
  walk(sim, -1, 0, 194);
  walk(sim, 0, -1, 194);
  assert.equal(sim.apply({ type: 'interact' }), true);
  for (let i = 0; i < TRAVEL_TICKS; i++) sim.step();
  assert.equal(sim.location, 'chamber');
  return sim;
}

test('the measured room contains the hero on every side and rejects nonfinite positions', () => {
  for (const point of [
    [0, 0],
    [-4.8, 0],
    [4.8, 0],
    [0, -4.8],
    [0, 4.8],
  ]) {
    assert.equal(canStandInChamber(point[0] ?? NaN, point[1] ?? NaN), true);
  }
  for (const point of [
    [-4.9, 0],
    [4.9, 0],
    [0, -4.9],
    [0, 4.9],
    [Infinity, 0],
    [0, NaN],
  ]) {
    assert.equal(canStandInChamber(point[0] ?? NaN, point[1] ?? NaN), false);
  }
  assert.equal(canStandInChamber(SPAWNS.chamber.x, SPAWNS.chamber.z), true);
});

test('wall, corner, pillar and chest specimens block walking while the open doorway stays clear', () => {
  const blocked: readonly (readonly [number, number])[] = [
    [-4, -0.8],
    [-3, -0.8],
    [-2, -0.8],
    [-3.5, 1.5],
    [-2.5, 1.5],
    [-2.5, 3],
    [2.5, 3],
    [2.5, 1.5],
    [2.05, -0.8],
    [2.95, -0.8],
  ];
  for (const [x, z] of blocked) {
    assert.equal(canStandInChamber(x, z), false, `specimen at ${x}, ${z} has authored collision`);
  }
  assert.equal(canStandInChamber(2.5, -0.8), true, 'the doorway leaf is open');
  assert.equal(canStandInChamber(2.5, -1.3), true, 'the doorway approach is clear');
  assert.equal(canStandInChamber(2.5, -0.3), true, 'the doorway exit is clear');
  assert.equal(canStandInChamber(3.5, 4.5), true, 'floor variants remain walkable decoration');
});

test('the narrow passage allows the hero body while keeping its sides clear of stone', () => {
  assert.equal(canStandInChamber(2.36, -0.8), false, 'left edge accounts for the hero radius');
  assert.equal(canStandInChamber(2.39, -0.8), true, 'left side of the centre lane fits the hero');
  assert.equal(canStandInChamber(2.61, -0.8), true, 'right side of the centre lane fits the hero');
  assert.equal(canStandInChamber(2.64, -0.8), false, 'right edge accounts for the hero radius');
  assert.equal(canStandInChamber(2.33, -1.005), false, 'the hero cannot clip a doorway corner');
  assert.equal(canStandInChamber(2.35, -1.025), true, 'rounded body clearance permits turning past a corner');
});

test('the actual hero can cross the specimen doorway and cannot cross a solid specimen wall', () => {
  const open = enterRoom();
  walk(open, 1, 0, 58);
  walk(open, 0, 1, 80);
  assert.ok(open.hero.z > 0.3, 'the hero travels through the measured half-metre passage');
  assert.ok(Math.abs(open.hero.x - 2.5) < 0.05);

  const solid = enterRoom();
  walk(solid, -1, 0, 69);
  walk(solid, 0, 1, 120);
  assert.ok(solid.hero.z < -0.92, 'wall collision remains even when the view cuts away walls');
  assert.ok(solid.hero.z > -1.2, 'the hero reaches the wall instead of an oversized hidden blocker');
});
