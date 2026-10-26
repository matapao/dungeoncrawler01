import assert from 'node:assert/strict';
import { TimeoutError } from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { arch, cpus, totalmem } from 'node:os';
import { launchBrowser } from '../scripts/browser.ts';
import { generateDungeon } from '../src/game/generated-dungeon.ts';
import { FRAME_CLOCK_KEY, installFrameClock } from './frame-clock.ts';

const browser = await launchBrowser();
const page = await browser.newPage();
// Software rendering can batch six movement ticks per frame. Keep precision input at one tick
// per frame near a waypoint; long approaches retain the normal catch-up and real input.
await page.evaluateOnNewDocument(installFrameClock, 100, FRAME_CLOCK_KEY);
const errors = [];
const models = [];
const measurements = [];
const output = process.argv[3] ?? 'test-output';
page.on('pageerror', (error) => errors.push(String(error)));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('response', (response) => {
  if (response.url().endsWith('.glb')) models.push({ ok: response.ok(), url: response.url() });
});
async function frames(count = 5) {
  await page.evaluate(async (count) => {
    for (let i = 0; i < count; i++) await new Promise(requestAnimationFrame);
  }, count);
}
async function pose() {
  return page.$eval('#game', (element) => ({
    x: Number(element.dataset.heroX),
    z: Number(element.dataset.heroZ),
    y: Number(element.dataset.heroY),
    floor: Number(element.dataset.floor),
  }));
}
async function turnTo(yaw) {
  const current = await page.$eval('#game', (element) => Number(element.dataset.cameraYaw));
  const difference = Math.atan2(Math.sin(yaw - current), Math.cos(yaw - current));
  await page.mouse.move(700, 450);
  // Chrome scales dispatched wheel deltas by the emulated device pixel ratio.
  const pixelRatio = await page.evaluate(() => window.devicePixelRatio);
  await page.mouse.wheel({ deltaX: (-difference * pixelRatio) / 0.004, deltaY: 0 });
  await frames(3);
  const actual = await page.$eval('#game', (element) => Number(element.dataset.cameraYaw));
  assert.ok(
    Math.abs(Math.atan2(Math.sin(actual - yaw), Math.cos(actual - yaw))) < 1e-4,
    'camera faces route',
  );
}
async function walkTo(x, z) {
  for (const [axis, target, forward, back] of [
    ['heroX', x, 'KeyD', 'KeyA'],
    ['heroZ', z, 'KeyS', 'KeyW'],
  ]) {
    let deadline = 0;
    // A busy rendered frame may contain several fixed ticks. Correct any overshoot using real input.
    for (let correction = 0; correction < 8; correction++) {
      const current = await pose();
      const value = axis === 'heroX' ? current.x : current.z;
      if (Math.abs(value - target) < 0.05) break;
      const code = target > value ? forward : back;
      const below = target < value;
      // Software WebGL may render only a few frames per second. Allow bounded transit time
      // proportional to the leg while keeping the same exact arrival assertions.
      if (deadline === 0)
        deadline = Date.now() + Math.min(120000, Math.max(30000, Math.abs(value - target) * 6000));
      await page.evaluate(
        ({ key, distance }) => Reflect.set(globalThis, key, distance < 0.5 ? 1000 / 60 : 100),
        { key: FRAME_CLOCK_KEY, distance: Math.abs(value - target) },
      );
      await page.keyboard.down(code);
      // Each protocol wait stays below the shared adapter's 30-second command bound.
      // A long transit gets several bounded observation windows within its one leg deadline.
      try {
        for (;;) {
          try {
            await page.waitForFunction(
              ({ code, axis, target, below, clockKey }) => {
                const value = Number(document.querySelector('#game').dataset[axis]);
                Reflect.set(globalThis, clockKey, Math.abs(value - target) < 0.5 ? 1000 / 60 : 100);
                if (below ? value > target + 0.025 : value < target - 0.025) return false;
                window.dispatchEvent(new KeyboardEvent('keyup', { code }));
                return true;
              },
              { timeout: Math.min(20000, Math.max(1, deadline - Date.now())) },
              { code, axis, target, below, clockKey: FRAME_CLOCK_KEY },
            );
            break;
          } catch (error) {
            if (!(error instanceof TimeoutError) || Date.now() >= deadline) throw error;
          }
        }
      } finally {
        await page.keyboard.up(code);
      }
    }
  }
  const actual = await pose();
  assert.ok(Math.hypot(actual.x - x, actual.z - z) < 0.08, `reach ${x},${z}: ${JSON.stringify(actual)}`);
}
async function enter() {
  await turnTo(0);
  await walkTo(-8.4, 4.5);
  await walkTo(-8.4, -3.8);
  await page.keyboard.press('KeyF');
  await page.waitForFunction(() => {
    const data = document.querySelector('#game').dataset;
    return data.location === 'chamber' && data.travelling === 'false';
  });
  await turnTo(0);
}
async function selectView(view) {
  const before = await pose();
  const yaw = await page.$eval('#game', (element) => element.dataset.cameraYaw);
  await page.select('.camera-select', view);
  await page.waitForFunction((view) => document.querySelector('#game').dataset.cameraView === view, {}, view);
  await frames();
  assert.deepEqual(await pose(), before, `choosing ${view} preserves the pose`);
  assert.equal(await page.$eval('#game', (element) => element.dataset.cameraYaw), yaw);
}
try {
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: process.env.CI ? 0.5 : 1 });
  const started = performance.now();
  await page.goto(process.argv[2] ?? 'http://127.0.0.1:5184/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#game[data-ready="true"]', { timeout: 60000 });
  const rendering = await page.evaluate(() => {
    const gl = document.querySelector('canvas')?.getContext('webgl2');
    const debug = gl?.getExtension('WEBGL_debug_renderer_info');
    return {
      devicePixelRatio: window.devicePixelRatio,
      cssWidth: window.innerWidth,
      cssHeight: window.innerHeight,
      drawingWidth: gl?.drawingBufferWidth,
      drawingHeight: gl?.drawingBufferHeight,
      renderer: gl?.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
    };
  });
  console.log('Browser rendering environment', rendering);
  const navigationToReadyMs = performance.now() - started;
  const startupMetrics = await page.metrics();
  assert.ok(Number.isFinite(startupMetrics.JSHeapUsedSize), 'Chrome provides a measured startup JS heap');
  assert.equal(models.length, 3);
  const modelBase = new URL('./', page.url()).href;
  assert.ok(
    models.every((model) => model.ok && model.url.startsWith(modelBase)),
    'all inherited models load inside this version route',
  );
  assert.equal(await page.$eval('.layout-select', (element) => element.value), 'generated');
  assert.equal(await page.$eval('.seed-input', (element) => element.value), '17031');
  await mkdir(output, { recursive: true });
  await page.screenshot({ path: `${output}/phase3-hub.png` });
  await enter();
  const world = generateDungeon(17031);
  assert.deepEqual(await pose(), { x: world.spawn.x, z: world.spawn.z, y: 0, floor: 0 });
  const disabledSeed = await page.$eval(
    '.seed-input',
    (element) => element.disabled || element.closest('[hidden]') !== null,
  );
  assert.equal(disabledSeed, true, 'seed is chosen before entry');
  await walkTo(0, 14.75);
  for (const view of ['wow', 'diablo', 'zelda', 'topdown']) {
    await selectView(view);
    await walkTo(0, 17.5);
    assert.deepEqual({ y: (await pose()).y, floor: (await pose()).floor }, { y: 2, floor: 1 });
    await page.screenshot({ path: `${output}/phase3-${view}-stairs.png` });
    measurements.push(
      await page.evaluate(async (view) => {
        const start = performance.now();
        for (let frame = 0; frame < 30; frame++) await new Promise(requestAnimationFrame);
        return {
          view,
          elapsedMs: performance.now() - start,
          frames: 30,
          ...document.querySelector('#game').dataset,
        };
      }, view),
    );
    await walkTo(0, 14.75);
    assert.deepEqual({ y: (await pose()).y, floor: (await pose()).floor }, { y: 0, floor: 0 });
  }
  await selectView('diablo');
  await walkTo(0, 16.05);
  assert.ok((await pose()).y > 0 && (await pose()).y < 2, 'the hero physically occupies a middle tread');
  await page.screenshot({ path: `${output}/phase3-mid-stair.png` });
  for (const point of world.routeWaypoints.slice(3)) await walkTo(point.x, point.z);
  assert.equal(await page.$eval('#game', (element) => element.dataset.atGoal), 'true');
  await page.screenshot({ path: `${output}/phase3-upper-goal.png` });
  await selectView('slice');
  const beforeSlice = await pose();
  const beforeSliceCamera = await page.$eval('#game', (element) => ({
    yaw: element.dataset.cameraYaw,
    goal: element.dataset.cameraGoal,
  }));
  await page.mouse.wheel({ deltaX: 160, deltaY: 200 });
  await frames(8);
  assert.deepEqual(
    await page.$eval('#game', (element) => ({
      yaw: element.dataset.cameraYaw,
      goal: element.dataset.cameraGoal,
    })),
    beforeSliceCamera,
    'inspection locks wheel turning and zoom',
  );
  await page.keyboard.down('KeyW');
  await frames(12);
  await page.keyboard.press('KeyF');
  await page.keyboard.up('KeyW');
  assert.deepEqual(
    await pose(),
    beforeSlice,
    'slice is an inspection with movement and doorway actions paused',
  );
  await page.screenshot({ path: `${output}/phase3-building-slice.png` });
  await selectView('zelda');
  await frames(8);
  assert.deepEqual(await pose(), beforeSlice, 'resuming play does not leak held slice input');
  for (const point of world.routeWaypoints.slice().reverse()) await walkTo(point.x, point.z);
  await walkTo(world.returnDoor.x, world.returnDoor.z);
  await page.keyboard.press('KeyF');
  await page.waitForFunction(() => {
    const data = document.querySelector('#game').dataset;
    return data.location === 'hub' && data.travelling === 'false';
  });
  assert.deepEqual(await pose(), { x: 0, z: 4.5, y: 0, floor: 0 });
  await page.click('.next-seed');
  await page.waitForFunction(() => document.querySelector('#game').dataset.dungeonSeed !== '17031');
  const nextSeed = await page.$eval('#game', (element) => Number(element.dataset.dungeonSeed));
  assert.notEqual(nextSeed, 17031);
  const next = generateDungeon(nextSeed);
  await enter();
  assert.deepEqual(await pose(), { x: next.spawn.x, z: next.spawn.z, y: 0, floor: 0 });
  for (const point of next.routeWaypoints) await walkTo(point.x, point.z);
  assert.equal(await page.$eval('#game', (element) => element.dataset.atGoal), 'true');
  assert.deepEqual(errors, []);
  await writeFile(
    `${output}/phase3-measurements.json`,
    JSON.stringify(
      {
        machine: { arch: arch(), cpu: cpus()[0]?.model, memoryBytes: totalmem() },
        browser: await browser.version(),
        target: process.argv[2] ?? 'http://127.0.0.1:5184/',
        startup: {
          navigationToReadyMs,
          jsHeapUsedBytes: startupMetrics.JSHeapUsedSize,
          jsHeapTotalBytes: startupMetrics.JSHeapTotalSize,
        },
        rendering,
        measurements,
        note: 'Chrome, 1440 by 900 CSS pixels, headless WebGL on this machine; devicePixelRatio and actual renderer are recorded separately; acceptance caps animation-clock advancement to one fixed step per rendered frame near waypoints; long approaches retain normal catch-up. Render samples use wall time; concurrent workspace checks can affect them. Machine memoryBytes is physical RAM, not JavaScript heap.',
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    'PASS: generated two-floor dungeon, bidirectional physical stairs in four play views, slice pause/resume, upper goal, exact hub return, next-seed regeneration and zero browser errors',
  );
} catch (error) {
  console.error('Phase 3 failure state', await page.$eval('#game', (element) => ({ ...element.dataset })));
  console.error(
    'Phase 3 clock step limit',
    await page.evaluate((key) => Reflect.get(globalThis, key), FRAME_CLOCK_KEY),
  );
  throw error;
} finally {
  await browser.close();
}
