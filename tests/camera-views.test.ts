import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { HeroCamera, verticalFov } from '../src/view/camera.ts';
import { CAMERA_VIEWS, createCameraViews } from '../src/view/camera-views.ts';
import { rotateCell } from '../src/game/sections.ts';

const bounds = { minX: -7, maxX: 22, minZ: -3, maxZ: 23 };

test('all five camera views retain the authoritative pose, movement yaw and finite framing on both floors', () => {
  assert.deepEqual(
    CAMERA_VIEWS.map((view) => view.id),
    ['wow', 'diablo', 'zelda', 'topdown', 'slice'],
  );
  for (const height of [0, 1.125, 2]) {
    const hero = Object.freeze({ x: 4, y: height, z: 8 });
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.05, 800);
    const controller = new HeroCamera(camera);
    controller.yaw = 0.7;
    controller.follow = () => hero;
    controller.indoors = true;
    const views = createCameraViews(camera, controller);
    for (const { id } of CAMERA_VIEWS) {
      views.select(id);
      views.update(hero, bounds);
      controller.update(1 / 60);
      assert.equal(views.view, id);
      assert.equal(controller.yaw, 0.7, 'view changes retain the camera-relative movement basis');
      assert.deepEqual(hero, { x: 4, y: height, z: 8 });
      assert.ok([...camera.position, ...camera.quaternion].every(Number.isFinite));
      const look = camera.getWorldDirection(new THREE.Vector3());
      if (id === 'topdown') {
        assert.equal(camera.position.x, hero.x);
        assert.equal(camera.position.z, hero.z);
        assert.ok(camera.position.y > hero.y + 5);
        assert.ok(Math.abs(look.x) < 1e-10 && Math.abs(look.z) < 1e-10 && look.y < -0.999999);
        assert.ok(Math.abs(camera.up.x + Math.sin(controller.yaw)) < 1e-10);
        assert.ok(Math.abs(camera.up.z + Math.cos(controller.yaw)) < 1e-10);
      }
      if (id === 'slice') {
        assert.ok(Math.abs(look.y) < 1e-10, 'the building view looks straight at both storeys');
        assert.equal(camera.position.y, 1.5, 'the level slice centers the two-storey building height');
      }
    }
    views.reset();
    assert.equal(views.view, 'wow');
    assert.equal(controller.photo, null);
    assert.deepEqual(camera.up.toArray(), [0, 1, 0]);
  }
});

test('slice projection keeps both storeys inside landscape and portrait frames in every dungeon orientation', () => {
  for (const rotation of [0, 1, 2, 3] as const) {
    const corners = [
      rotateCell({ x: bounds.minX, z: bounds.minZ }, rotation),
      rotateCell({ x: bounds.minX, z: bounds.maxZ }, rotation),
      rotateCell({ x: bounds.maxX, z: bounds.minZ }, rotation),
      rotateCell({ x: bounds.maxX, z: bounds.maxZ }, rotation),
    ];
    const rotated = {
      minX: Math.min(...corners.map((point) => point.x)),
      maxX: Math.max(...corners.map((point) => point.x)),
      minZ: Math.min(...corners.map((point) => point.z)),
      maxZ: Math.max(...corners.map((point) => point.z)),
    };
    for (const aspect of [16 / 9, 4 / 3, 9 / 16]) {
      const camera = new THREE.PerspectiveCamera(verticalFov(aspect), aspect, 0.05, 800);
      const controller = new HeroCamera(camera);
      const views = createCameraViews(camera, controller);
      controller.yaw = 0.7;
      views.select('slice');
      views.update({ x: 4, z: 8, y: 2 }, rotated, rotation);
      controller.update(1 / 60);
      camera.updateMatrixWorld();
      for (const corner of corners) {
        for (const y of [0, 3.2]) {
          const projected = new THREE.Vector3(corner.x, y, corner.z).project(camera);
          assert.ok(
            Math.abs(projected.x) < 0.95 && Math.abs(projected.y) < 0.8,
            `rotation ${rotation}, aspect ${aspect}: ${projected.toArray()}`,
          );
          assert.ok(projected.z > -1 && projected.z < 1);
        }
      }
      assert.equal(controller.yaw, 0.7);
    }
  }
});
