import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HeroCamera, verticalFov } from '../src/view/camera.ts';
import * as THREE from 'three';
import { HubSimulation } from '../src/game/simulation.ts';
import { ARRIVAL, FIXED_STEP, HERO_RADIUS, WALK_SPEED } from '../src/game/hub.ts';
import { interpolateHero } from '../src/view/interpolate.ts';

test('model and camera pose can blend within a tick and reset without travel interpolation', () => {
  const sim = new HubSimulation();
  const previous = { ...sim.hero };
  sim.apply({ type: 'move', x: 1, z: 0 });
  sim.step();
  const halfway = interpolateHero(previous, sim.hero, 0.5);
  assert.ok(halfway.x > previous.x && halfway.x < sim.hero.x);
  assert.equal(halfway.x, (previous.x + sim.hero.x) / 2);
  assert.deepEqual(
    interpolateHero(sim.hero, sim.hero, 0.5),
    sim.hero,
    'arrival reset never blends between rooms',
  );
});

function run(command: unknown) {
  const sim = new HubSimulation();
  assert.equal(sim.apply(command), true);
  for (let i = 0; i < 30; i++) sim.step();
  return sim.hero;
}

test('TD01 on-foot scale, backward pace and camera-facing strafes are preserved', () => {
  assert.equal(WALK_SPEED, 2.6);
  assert.equal(HERO_RADIUS, 0.13);
  const forward = run({ type: 'move', x: 0, z: -1, look: 0, gait: 'fwd' });
  const backward = run({ type: 'move', x: 0, z: 1, look: 0, gait: 'back' });
  const strafe = run({ type: 'move', x: 1, z: 0, look: 0, gait: 'right' });
  assert.ok(Math.abs((backward.z - ARRIVAL.z) / (ARRIVAL.z - forward.z) - 0.62) < 1e-8);
  assert.equal(backward.facing, 0, 'backpedaling does not turn the body away from camera look');
  assert.equal(strafe.facing, 0, 'strafing does not turn the body sideways');
  assert.ok(Math.abs(strafe.x - WALK_SPEED * 30 * FIXED_STEP) < 1e-8);
  const turning = run({ type: 'move', x: 0, z: 0, look: 1, gait: 'idle' });
  assert.equal(turning.facing, 1);
  assert.equal(turning.x, ARRIVAL.x);
  assert.equal(turning.z, ARRIVAL.z);
  assert.equal(turning.moving, false);
});

test('new facing and gait fields reject malformed or unbounded commands', () => {
  for (const fields of [
    { look: Infinity },
    { look: NaN },
    { look: 10 },
    { look: '0' },
    { gait: 'fly' },
    { gait: {} },
  ]) {
    assert.equal(new HubSimulation().apply({ type: 'move', x: 0, z: 1, ...fields }), false);
  }
});

test('the extracted TD01 camera retains orbit sensitivity, zoom limits, following and collision', () => {
  const view = new THREE.PerspectiveCamera();
  const cam = new HeroCamera(view);
  assert.equal(cam.goal, 4.2);
  cam.yaw = 0;
  cam.orbit(100, 100);
  assert.ok(Math.abs(cam.yaw + 0.45) < 1e-10);
  assert.ok(Math.abs(cam.pitch - 0.75) < 1e-10);
  cam.zoom(100000);
  assert.equal(cam.goal, 26);
  cam.zoom(-100000);
  assert.equal(cam.goal, 0.7);
  cam.yaw = 0;
  cam.pitch = 0.4;
  cam.zoomTo(4.2, true);
  cam.follow = () => ({ x: 1, y: 0, z: 2 });
  cam.blockers = () => [new THREE.Box3(new THREE.Vector3(0, 0, 3), new THREE.Vector3(2, 4, 4))];
  cam.update(1 / 60);
  assert.equal(cam.target.x, 1);
  assert.equal(cam.target.z, 2);
  assert.ok(view.position.distanceTo(cam.target) < 2, 'camera pulls in before a solid wall');
  assert.ok(Math.abs(verticalFov(1) - 90) < 1e-10);
});
