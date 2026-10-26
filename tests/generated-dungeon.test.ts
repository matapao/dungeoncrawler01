import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { generateDungeon, isDungeonSeed } from '../src/game/generated-dungeon.ts';
import type { DungeonPose, GeneratedDungeon } from '../src/game/generated-dungeon.ts';
import { navStep, stairCoordinates, stairHeightAt } from '../src/game/dungeon-navigation.ts';
import { FIXED_STEP, HERO_RADIUS, WALK_SPEED } from '../src/game/hub.ts';
import { canStandInSectionLayout } from '../src/game/section-collision.ts';
import { rotateCell } from '../src/game/sections.ts';

const corpus = Array.from({ length: 1024 }, (_, seed) => seed);
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function followRoute(world: GeneratedDungeon, start: DungeonPose, points: readonly DungeonPose[]) {
  let current = start;
  const visited: DungeonPose[] = [current];
  for (const point of points) {
    let remaining = Math.hypot(point.x - current.x, point.z - current.z);
    let moves = 0;
    while (remaining > 1e-8) {
      assert.ok(moves++ < 2000, 'each waypoint is bounded');
      const distance = Math.min(WALK_SPEED * FIXED_STEP, remaining);
      const next = navStep(
        world,
        current,
        current.x + ((point.x - current.x) / remaining) * distance,
        current.z + ((point.z - current.z) / remaining) * distance,
      );
      assert.ok(
        next,
        `seed ${world.seed}: blocked at ${JSON.stringify(current)} towards ${JSON.stringify(point)}`,
      );
      assert.ok(Math.abs(next.y - current.y) <= 0.125 + 1e-7, 'no jump between floor heights');
      visited.push(next);
      current = next;
      remaining = Math.hypot(point.x - current.x, point.z - current.z);
    }
    assert.ok(Math.abs(current.y - point.y) < 1e-7, 'the waypoint reaches its physical height');
    assert.equal(current.floor, point.floor);
  }
  return { current, visited };
}

test('seed validation is bounded and repeated/interleaved generation has identical complete output', () => {
  for (const seed of [0, 1, 17031, 0xffffffff]) {
    assert.equal(isDungeonSeed(seed), true);
    const first = generateDungeon(seed);
    generateDungeon((seed + 17) >>> 0);
    assert.deepEqual(generateDungeon(seed), first);
  }
  for (const seed of [-1, 0x100000000, 1.5, NaN, Infinity, '17031', null, undefined]) {
    assert.equal(isDungeonSeed(seed), false);
    if (typeof seed === 'number') assert.throws(() => generateDungeon(seed), RangeError);
  }
  assert.notEqual(digest(generateDungeon(1)), digest(generateDungeon(2)));
  assert.equal(
    digest(generateDungeon(17031)),
    '2d93a6df97e72e3d65fe193674f9b6fde9997e061ae3454d59ba1daefe010721',
    'the published default seed retains its complete geometry and route identity',
  );
});

test('1,024 seeds cover every orientation and grammar choice with connected, distinct two-floor rooms', () => {
  const recipes = new Set<string>();
  const orientations = new Set<number>();
  for (const seed of corpus) {
    const world = generateDungeon(seed);
    recipes.add(world.recipe);
    orientations.add(world.rotation);
    assert.deepEqual(
      world.floors.map((floor) => [floor.id, floor.height]),
      [
        [0, 0],
        [1, 2],
      ],
    );
    assert.equal(world.stairs.length, 1);
    assert.equal(world.spawn.floor, 0);
    assert.equal(world.exit.floor, 1);
    assert.ok(
      Math.hypot(world.spawn.x - world.returnDoor.x, world.spawn.z - world.returnDoor.z) >
        world.returnDoor.reach,
    );
    for (const floor of world.floors) {
      assert.equal(
        new Set(floor.layout.floorCells.map((cell) => `${cell.x},${cell.z}`)).size,
        floor.layout.floorCells.length,
      );
      const reached = new Set([floor.layout.sections[0]?.id]);
      for (let pass = 0; pass < floor.layout.sections.length; pass++) {
        for (const socket of floor.layout.sockets) {
          if (socket.sealed || !reached.has(socket.sectionId)) continue;
          for (const peer of floor.layout.sockets)
            if (!peer.sealed && peer.x === socket.x && peer.z === socket.z) reached.add(peer.sectionId);
        }
      }
      assert.equal(reached.size, floor.layout.sections.length, `seed ${seed}: every floor section joins`);
      for (const prop of floor.layout.props)
        assert.equal(canStandInSectionLayout(floor.layout, prop.x, prop.z), false);
      for (const wall of floor.layout.walls)
        assert.equal(canStandInSectionLayout(floor.layout, wall.x, wall.z), false);
    }
  }
  assert.deepEqual([...orientations].sort(), [0, 1, 2, 3]);
  assert.equal(recipes.size, 64, 'all bounded room/branch/orientation recipes occur in the corpus');
});

test('every generated recipe has a reversible physical route across all sixteen native stair risers', () => {
  const recipes = new Set<string>();
  for (const seed of corpus) {
    const world = generateDungeon(seed);
    if (recipes.has(world.recipe)) continue;
    recipes.add(world.recipe);
    const outward = followRoute(world, world.spawn, world.routeWaypoints);
    assert.deepEqual(outward.current, { x: world.exit.x, z: world.exit.z, y: world.exit.y, floor: 1 });
    const reverse = world.routeWaypoints
      .slice()
      .reverse()
      .map((point) => ({ ...point, floor: point.y > 0 && point.y < 2 ? (1 as const) : point.floor }));
    const home = followRoute(world, outward.current, reverse);
    assert.ok(Math.hypot(home.current.x - world.spawn.x, home.current.z - world.spawn.z) < 1e-7);
    assert.equal(home.current.y, 0);
    assert.equal(home.current.floor, 0);
    const junction = world.routeWaypoints[1];
    assert.ok(junction);
    for (const branch of world.branchWaypoints) {
      const branchTour = followRoute(world, home.current, [junction, branch, junction, world.spawn]);
      assert.ok(
        Math.hypot(branchTour.current.x - world.spawn.x, branchTour.current.z - world.spawn.z) < 1e-7,
      );
    }
    const heights = new Set(outward.visited.map((pose) => pose.y));
    for (let tread = 0; tread <= 16; tread++)
      assert.ok(heights.has(tread / 8), `native tread ${tread} is traversed`);
    for (const pose of outward.visited) {
      if (pose.y > 0 && pose.y < 2)
        assert.equal(pose.floor, 0, 'ascent retains the lower floor until the landing');
    }
    for (const pose of home.visited) {
      if (pose.y > 0 && pose.y < 2)
        assert.equal(pose.floor, 1, 'descent retains the upper floor until the landing');
    }
  }
  assert.equal(recipes.size, 64);
});

test('stair sides, invalid surfaces, long steps and floor overlap cannot teleport the player', () => {
  for (const seed of [0, 1, 2, 3, 17031, 0xffffffff]) {
    const world = generateDungeon(seed);
    const stair = world.stairs[0];
    assert.ok(stair);
    const local = (across: number, along: number) => {
      const rotated = rotateCell({ x: across, z: along }, stair.rotation);
      return { x: stair.x + rotated.x, z: stair.z + rotated.z };
    };
    const edge = stair.width / 2 - HERO_RADIUS;
    const atEdge = local(edge - 0.01, 1);
    const outside = local(edge + 0.01, 1);
    assert.equal(navStep(world, { ...atEdge, y: 1, floor: 0 }, outside.x, outside.z), undefined);
    const middle = local(0, 1);
    assert.equal(stairCoordinates(stair, middle.x, middle.z).along, 1);
    assert.ok(stairCoordinates(stair, middle.x, middle.z).across === 0);
    assert.equal(
      navStep(world, world.spawn, world.exit.x, world.exit.z),
      undefined,
      'long movement is rejected',
    );
    assert.equal(navStep(world, { ...world.spawn, y: 2 }, world.spawn.x, world.spawn.z), undefined);
    assert.equal(navStep(world, world.spawn, Infinity, 0), undefined);
    assert.equal(navStep(world, { ...world.spawn, y: NaN }, 0, 0), undefined);
    const overlap = world.floors[0].layout.floorCells.find(
      (cell) =>
        canStandInSectionLayout(world.floors[0].layout, cell.x, cell.z) &&
        canStandInSectionLayout(world.floors[1].layout, cell.x, cell.z),
    );
    assert.ok(overlap, 'the fixture includes actual stacked walkable floor');
    for (const floor of world.floors) {
      const pose: DungeonPose = { x: overlap.x, z: overlap.z, y: floor.height, floor: floor.id };
      assert.deepEqual(navStep(world, pose, pose.x, pose.z), pose, 'overlap stays on its own floor');
    }
    for (let tread = 1; tread <= 16; tread++) {
      assert.equal(stairHeightAt(stair, (tread - 0.5) / 8), tread / 8);
      assert.equal(stairHeightAt(stair, tread / 8), tread / 8);
    }
  }
});
