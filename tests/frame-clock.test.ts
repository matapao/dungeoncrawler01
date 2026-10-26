import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FRAME_CLOCK_KEY, installFrameClock } from './frame-clock.ts';
import { HubSimulation } from '../src/game/simulation.ts';
import { FIXED_STEP, WALK_SPEED } from '../src/game/hub.ts';

test('delayed rendering cannot turn a precision key pulse into six movement ticks', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  const settingDescriptor = Object.getOwnPropertyDescriptor(globalThis, FRAME_CLOCK_KEY);
  const pending: ((time: number) => void)[] = [];
  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    writable: true,
    value: (callback: (time: number) => void) => pending.push(callback),
  });
  try {
    installFrameClock(FIXED_STEP * 1000, FRAME_CLOCK_KEY);
    const request: unknown = Reflect.get(globalThis, 'requestAnimationFrame');
    if (typeof request !== 'function') throw new Error('Missing test scheduler');
    const sim = new HubSimulation();
    let prior = 0;
    let accumulated = 0;
    let ticks = 0;
    let raw = 100;
    for (const delay of [0, 100, 180, 17, 250, 70, 100]) {
      raw += delay;
      Reflect.apply(request, globalThis, [
        (time: number) => {
          if (prior === 0) prior = time;
          accumulated += (time - prior) / 1000;
          prior = time;
          sim.apply({ type: 'move', x: 1, z: 0 });
          while (accumulated >= FIXED_STEP) {
            sim.step();
            ticks++;
            accumulated -= FIXED_STEP;
          }
          sim.apply({ type: 'move', x: 0, z: 0 });
        },
      ]);
      const callback = pending.shift();
      assert.ok(callback);
      const before = sim.hero.x;
      callback(raw);
      assert.ok(sim.hero.x - before <= WALK_SPEED * FIXED_STEP + 1e-10, 'at most one movement tick');
    }
    assert.ok(ticks >= 5, 'late frames continue advancing actual simulation');
    assert.ok(sim.hero.x > 0);
    Reflect.set(globalThis, FRAME_CLOCK_KEY, 100);
    const farTimes: number[] = [];
    Reflect.apply(request, globalThis, [(time: number) => farTimes.push(time)]);
    const farCallback = pending.shift();
    assert.ok(farCallback);
    farCallback(raw + 100);
    assert.ok((farTimes[0] ?? 0) - prior >= 99, 'long approach keeps normal catch-up');
    Reflect.set(globalThis, FRAME_CLOCK_KEY, FIXED_STEP * 1000);
    const timestamps: number[] = [];
    for (let callback = 0; callback < 2; callback++)
      Reflect.apply(request, globalThis, [(time: number) => timestamps.push(time)]);
    for (const callback of pending.splice(0)) callback(raw + 100);
    assert.equal(timestamps[0], timestamps[1], 'callbacks in one browser frame share a timestamp');
  } finally {
    if (settingDescriptor) Object.defineProperty(globalThis, FRAME_CLOCK_KEY, settingDescriptor);
    else Reflect.deleteProperty(globalThis, FRAME_CLOCK_KEY);
    if (descriptor) Object.defineProperty(globalThis, 'requestAnimationFrame', descriptor);
    else Reflect.deleteProperty(globalThis, 'requestAnimationFrame');
  }
});
