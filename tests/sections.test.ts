import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isCommand } from '../src/game/commands.ts';
import { ARRIVAL } from '../src/game/hub.ts';
import { TRAVEL_TICKS } from '../src/game/locations.ts';
import { assembleSectionLayout, getLayout, LAYOUTS } from '../src/game/section-layouts.ts';
import { canStandInSectionLayout, sectionAt } from '../src/game/section-collision.ts';
import { direction, rotateCell, rotateSide, SECTION_KINDS } from '../src/game/sections.ts';
import type { QuarterTurn, SectionPlacement } from '../src/game/sections.ts';
import { HubSimulation } from '../src/game/simulation.ts';

const rotations: readonly QuarterTurn[] = [0, 1, 2, 3];

test('every section retains walkable floor and sealed exterior walls in all four orientations', () => {
  for (const template of SECTION_KINDS) {
    for (const rotation of rotations) {
      const layout = assembleSectionLayout({
        id: 'crossroads',
        title: 'Rotated specimen',
        placements: [
          {
            id: 'specimen',
            kind: template.kind,
            x: 0,
            z: 0,
            rotation,
            sealed: template.sockets.map((socket) => socket.side),
          },
        ],
      });
      assert.equal(layout.floorCells.length, template.cells.length * 4);
      assert.equal(
        new Set(layout.floorCells.map((cell) => `${cell.x},${cell.z}`)).size,
        layout.floorCells.length,
      );
      for (const cell of layout.floorCells) assert.ok(canStandInSectionLayout(layout, cell.x, cell.z));
      for (const wall of layout.walls) {
        const normal = direction(wall.side);
        assert.equal(canStandInSectionLayout(layout, wall.x, wall.z), false);
        assert.equal(
          canStandInSectionLayout(layout, wall.x - normal.x * 0.1, wall.z - normal.z * 0.1),
          false,
        );
        assert.equal(
          canStandInSectionLayout(layout, wall.x - normal.x * 0.14, wall.z - normal.z * 0.14),
          true,
        );
        assert.equal(
          canStandInSectionLayout(layout, wall.x + normal.x * 0.14, wall.z + normal.z * 0.14),
          false,
        );
      }
      for (const socket of layout.sockets)
        assert.equal(canStandInSectionLayout(layout, socket.x, socket.z), false);
    }
  }
});

test('rotated corridor sockets join at their exact floor height and leave no invisible seam', () => {
  for (const rotation of rotations) {
    const end = rotateCell({ x: 0, z: 6 }, rotation);
    const seam = rotateCell({ x: 0, z: 3 }, rotation);
    const layout = assembleSectionLayout({
      id: 'crossroads',
      title: 'Two connected corridors',
      placements: [
        { id: 'first', kind: 'straight', x: 0, z: 0, rotation, sealed: ['north'] },
        { id: 'second', kind: 'straight', x: end.x, z: end.z, rotation, sealed: ['south'] },
      ],
    });
    const join = layout.sockets.filter((socket) => !socket.sealed);
    assert.equal(join.length, 2);
    assert.ok(
      join.every(
        (socket) => socket.x === seam.x && socket.z === seam.z && socket.floor === 0 && socket.width === 2,
      ),
    );
    assert.equal(join[0]?.side, rotateSide(join[1]?.side ?? 'north', 2));
    const along = direction(rotateSide('south', rotation));
    for (let distance = -0.4; distance <= 0.4; distance += 0.05) {
      assert.ok(canStandInSectionLayout(layout, seam.x + along.x * distance, seam.z + along.z * distance));
    }
  }
});

test('authored layouts reject overlapping floors, unmatched openings, misalignment and disconnected rooms', () => {
  const room: SectionPlacement = {
    id: 'one',
    kind: 'small-room',
    x: 0,
    z: 0,
    rotation: 0,
    sealed: ['north', 'east', 'south', 'west'],
  };
  const make = (placements: readonly SectionPlacement[]) =>
    assembleSectionLayout({ id: 'crossroads', title: 'Invalid layout', placements });
  assert.throws(() => make([room, { ...room, id: 'two' }]), /overlap/);
  assert.throws(() => make([room, { ...room }]), /unique/);
  assert.throws(() => make([{ ...room, x: 0.5 }]), /align/);
  assert.throws(() => make([{ ...room, sealed: ['north', 'east', 'west'] }]), /socket/);
  assert.throws(() => make([room, { ...room, id: 'two', x: 20 }]), /disconnected/);
  assert.throws(
    () =>
      make([
        room,
        { id: 'off-centre', kind: 'straight', x: 4, z: 2, rotation: 0, sealed: ['north', 'south'] },
      ]),
    /outside a compatible socket/,
  );
  assert.throws(() => make([{ ...room, sealed: ['north', 'north'] }]), /Duplicate/);
  assert.throws(() => make([]), /at least/);
});

test('both arrangements connect every authored section, seal their unused ports and respect prop collision', () => {
  assert.equal(LAYOUTS.length, 2);
  assert.notDeepEqual(getLayout('crossroads').floorCells, getLayout('long-hall').floorCells);
  const used = new Set(LAYOUTS.flatMap((layout) => layout.sections.map((section) => section.kind)));
  for (const template of SECTION_KINDS)
    assert.ok(used.has(template.kind), `${template.kind} is available to play`);
  for (const layout of LAYOUTS) {
    assert.ok(canStandInSectionLayout(layout, layout.spawn.x, layout.spawn.z));
    assert.ok(
      Math.hypot(layout.spawn.x - layout.returnDoor.x, layout.spawn.z - layout.returnDoor.z) >
        layout.returnDoor.reach,
    );
    assert.equal(canStandInSectionLayout(layout, Infinity, 0), false);
    assert.equal(canStandInSectionLayout(layout, 0, NaN), false);
    assert.equal(sectionAt(layout, layout.bounds.maxX + 1, 0), undefined);
    for (const socket of layout.sockets)
      assert.equal(canStandInSectionLayout(layout, socket.x, socket.z), !socket.sealed);
    for (const socket of layout.sockets.filter((candidate) => !candidate.sealed)) {
      const normal = direction(socket.side);
      for (const lateral of [-0.72, -0.36, 0, 0.36, 0.72]) {
        for (const forward of [-0.2, 0, 0.2]) {
          assert.ok(
            canStandInSectionLayout(
              layout,
              socket.x + normal.x * forward - normal.z * lateral,
              socket.z + normal.z * forward + normal.x * lateral,
            ),
            'five separated hero bodies fit across each two-metre joined opening',
          );
        }
      }
    }
    for (const prop of layout.props) assert.equal(canStandInSectionLayout(layout, prop.x, prop.z), false);
    const reached = new Set([layout.sections[0]?.id]);
    for (let pass = 0; pass < layout.sections.length; pass++) {
      for (const socket of layout.sockets) {
        if (socket.sealed || !reached.has(socket.sectionId)) continue;
        for (const peer of layout.sockets)
          if (!peer.sealed && peer.x === socket.x && peer.z === socket.z) reached.add(peer.sectionId);
      }
    }
    assert.equal(reached.size, layout.sections.length);
  }
});

function walk(sim: HubSimulation, x: number, z: number, ticks: number) {
  assert.equal(sim.apply({ type: 'move', x, z }), true);
  for (let tick = 0; tick < ticks; tick++) sim.step();
  sim.apply({ type: 'move', x: 0, z: 0 });
}
function travel(sim: HubSimulation) {
  assert.equal(sim.apply({ type: 'interact' }), true);
  for (let tick = 0; tick < TRAVEL_TICKS; tick++) sim.step();
}

test('layout choice is validated, available only in the hub, and retained through repeated Friends trips', () => {
  assert.equal(isCommand({ type: 'choose-layout', layoutId: 'crossroads' }), true);
  assert.equal(isCommand({ type: 'choose-layout', layoutId: 'long-hall' }), true);
  assert.equal(isCommand({ type: 'choose-layout', layoutId: 'unknown' }), false);
  assert.equal(isCommand({ type: 'choose-layout' }), false);
  const sim = new HubSimulation();
  assert.equal(sim.layoutId, 'generated');
  assert.equal(sim.apply({ type: 'choose-layout', layoutId: 'unknown' }), false);
  sim.apply({ type: 'move', x: 1, z: 0 });
  sim.step();
  const beforeChoice = { x: sim.hero.x, z: sim.hero.z };
  assert.equal(sim.apply({ type: 'choose-layout', layoutId: 'reference' }), true);
  assert.equal(sim.hero.moving, false);
  for (let tick = 0; tick < 10; tick++) sim.step();
  assert.deepEqual(
    { x: sim.hero.x, z: sim.hero.z },
    beforeChoice,
    'choosing releases movement without repositioning the player',
  );
  // Reuse an untouched arrival for repeatable travel distances below.
  const trips = new HubSimulation();
  for (const layout of LAYOUTS) {
    assert.equal(trips.apply({ type: 'choose-layout', layoutId: layout.id }), true);
    for (let trip = 0; trip < 2; trip++) {
      walk(trips, -1, 0, 194);
      walk(trips, 0, -1, 194);
      assert.equal(trips.apply({ type: 'interact' }), true);
      assert.equal(trips.apply({ type: 'choose-layout', layoutId: 'reference' }), false);
      for (let tick = 0; tick < TRAVEL_TICKS; tick++) trips.step();
      assert.equal(trips.layoutId, layout.id);
      assert.equal(trips.hero.x, layout.spawn.x);
      assert.equal(trips.hero.z, layout.spawn.z);
      assert.equal(trips.apply({ type: 'choose-layout', layoutId: 'reference' }), false);
      assert.equal(trips.apply({ type: 'interact' }), false, 'arrival is clear of the return trigger');
      walk(trips, 0, -1, 20);
      travel(trips);
      assert.equal(trips.location, 'hub');
      assert.deepEqual({ x: trips.hero.x, z: trips.hero.z }, ARRIVAL);
    }
  }
});

test('the hero crosses multiple connected modules and returns through the same corridors', () => {
  const sim = new HubSimulation();
  assert.equal(sim.apply({ type: 'choose-layout', layoutId: 'crossroads' }), true);
  walk(sim, -1, 0, 194);
  walk(sim, 0, -1, 194);
  travel(sim);
  walk(sim, 0, 1, 430);
  assert.ok(sim.hero.z > 17.5, 'entry room, corridor, crossroads and T are connected');
  assert.equal(sectionAt(getLayout('crossroads'), sim.hero.x, sim.hero.z)?.kind, 'tee');
  walk(sim, 0, 1, 90);
  assert.ok(sim.hero.z < 18.88, 'the T end remains a solid boundary');
  walk(sim, 0, -1, 485);
  assert.ok(sim.hero.z < -2, 'the complete return route remains traversable');
  travel(sim);
  assert.equal(sim.location, 'hub');
});

test('both complete tours can turn through every corridor, room and side branch', () => {
  const routes = {
    crossroads: [
      [0, 12],
      [-14, 12],
      [0, 12],
      [6, 12],
      [6, 7],
      [6, 12],
      [0, 12],
      [0, 18],
      [-5, 18],
      [5, 18],
      [0, 18],
      [0, -2],
    ],
    'long-hall': [
      [0, 0],
      [14, 0],
      [14, 6],
      [8, 6],
      [14, 6],
      [20, 6],
      [14, 6],
      [14, 17],
      [14, 0],
      [0, 0],
      [0, -2],
    ],
  };
  for (const layout of LAYOUTS) {
    const sim = new HubSimulation();
    sim.apply({ type: 'choose-layout', layoutId: layout.id });
    walk(sim, -1, 0, 194);
    walk(sim, 0, -1, 194);
    travel(sim);
    for (const point of routes[layout.id]) {
      const [x, z] = point;
      assert.ok(typeof x === 'number' && typeof z === 'number');
      for (const [axis, target] of [
        ['x', x],
        ['z', z],
      ] as const) {
        let ticks = 0;
        while (Math.abs(sim.hero[axis] - target) > 0.04 && ticks++ < 1500) {
          sim.apply({
            type: 'move',
            x: axis === 'x' ? Math.sign(target - sim.hero.x) : 0,
            z: axis === 'z' ? Math.sign(target - sim.hero.z) : 0,
          });
          sim.step();
        }
        sim.apply({ type: 'move', x: 0, z: 0 });
        assert.ok(
          Math.abs(sim.hero[axis] - target) <= 0.04,
          `${layout.id}: reach ${axis}=${target} at waypoint ${x},${z}; actual ${sim.hero.x},${sim.hero.z}`,
        );
      }
    }
    travel(sim);
    assert.equal(sim.location, 'hub');
  }
});
