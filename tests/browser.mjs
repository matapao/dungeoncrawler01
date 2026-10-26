import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { launchBrowser } from '../scripts/browser.ts';

const browser = await launchBrowser();
const page = await browser.newPage();
const errors = [];
const responses = [];
page.on('pageerror', (error) => errors.push(String(error)));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('response', (response) => {
  if (response.url().endsWith('.glb')) responses.push({ url: response.url(), ok: response.ok() });
});
async function frames(count = 12) {
  await page.evaluate(async (count) => {
    for (let i = 0; i < count; i++) await new Promise(requestAnimationFrame);
  }, count);
}
async function position() {
  return page.$eval('#game', (element) => ({
    x: Number(element.dataset.heroX),
    z: Number(element.dataset.heroZ),
  }));
}
async function walkUntil(code, axis, target, below) {
  await page.keyboard.down(code);
  await page.waitForFunction(
    ({ code, axis, target, below }) => {
      const value = Number(document.querySelector('#game').dataset[axis]);
      if (below ? value >= target : value <= target) return false;
      // Release in the observed browser frame so a slow automation round trip cannot overshoot a doorway.
      window.dispatchEvent(new KeyboardEvent('keyup', { code }));
      return true;
    },
    {},
    { code, axis, target, below },
  );
  await page.keyboard.up(code);
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
  let current = await position();
  console.log('Tour waypoint', { from: current, to: { x, z } });
  if (Math.abs(current.x - x) > 0.04)
    await walkUntil(
      x > current.x ? 'KeyD' : 'KeyA',
      'heroX',
      x > current.x ? x - 0.015 : x + 0.015,
      x < current.x,
    );
  current = await position();
  if (Math.abs(current.z - z) > 0.04)
    await walkUntil(
      z > current.z ? 'KeyS' : 'KeyW',
      'heroZ',
      z > current.z ? z - 0.015 : z + 0.015,
      z < current.z,
    );
  console.log('Reached waypoint', await position());
}
async function enterFriends(layoutId) {
  await page.select('.layout-select', layoutId);
  await turnTo(0);
  await walkUntil('KeyA', 'heroX', -8.45, true);
  await walkUntil('KeyW', 'heroZ', -5.05, true);
  await page.keyboard.press('KeyF');
  await page.waitForFunction(() => {
    const data = document.querySelector('#game').dataset;
    return data.location === 'chamber' && data.travelling === 'false';
  });
  await turnTo(0);
  assert.deepEqual(await position(), { x: 0, z: -1 });
  assert.equal(
    await page.$eval('.layout-select', (element) => element.hidden || element.closest('[hidden]') !== null),
    true,
    'layout can only be chosen in the hub',
  );
}
async function returnToHub() {
  await walkTo(0, -2);
  await page.keyboard.press('KeyF');
  await page.waitForFunction(() => {
    const data = document.querySelector('#game').dataset;
    return data.location === 'hub' && data.travelling === 'false';
  });
  assert.deepEqual(await position(), { x: 0, z: 4.5 });
}
try {
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: process.env.CI ? 0.5 : 1 });
  await page.goto(process.argv[2] ?? 'http://127.0.0.1:5184', { waitUntil: 'domcontentloaded' });
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
  assert.equal(responses.length, 3, 'actual inherited models and animations loaded');
  assert.ok(responses.every((response) => response.ok));
  assert.equal(await page.$eval('canvas', (canvas) => canvas.width > 0 && canvas.height > 0), true);
  assert.deepEqual(await position(), { x: 0, z: 4.5 });
  assert.equal(
    await page.$eval('.layout-select', (element) => element.value),
    'generated',
    'the generated dungeon is the default',
  );
  await page.select('.layout-select', 'reference');
  await page.keyboard.press('KeyF');
  await frames();
  assert.equal(await page.$eval('#game', (element) => element.dataset.location), 'hub');
  await mkdir('test-output', { recursive: true });
  await page.screenshot({ path: 'test-output/hub-desktop.png' });
  await page.keyboard.down('KeyW');
  await page.waitForFunction(() => Number(document.querySelector('#game').dataset.heroZ) < 1.7);
  await frames();
  await page.keyboard.up('KeyW');
  const monument = await position();
  assert.ok(monument.z >= 1.63 && monument.z < 1.7, 'monument collision');
  await walkUntil('KeyA', 'heroX', -8.45, true);
  await page.keyboard.up('KeyA');
  await page.keyboard.down('KeyW');
  await page.waitForFunction(() => Number(document.querySelector('#game').dataset.heroZ) < -5.05);
  await frames();
  await page.keyboard.up('KeyW');
  assert.ok((await position()).z >= -5.37, 'tunnel threshold collision');
  assert.match(
    await page.$eval('.prompt', (element) => element.textContent),
    /Press F.*Enter the Friends chamber/,
  );
  await page.screenshot({ path: 'test-output/hub-tunnel.png' });
  await page.keyboard.down('KeyW');
  await page.keyboard.down('KeyF');
  await page.waitForFunction(() => document.querySelector('#game').dataset.location === 'chamber');
  await page.keyboard.down('KeyF');
  await page.waitForFunction(() => document.querySelector('#game').dataset.travelling === 'false');
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', repeat: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF', repeat: true }));
  });
  await frames();
  assert.deepEqual(await position(), { x: 0, z: -3 }, 'travel clears held movement and ignores repeats');
  await page.keyboard.up('KeyF');
  await page.keyboard.up('KeyW');
  assert.equal(await page.$eval('h1', (element) => element.textContent), 'The Reference Room');
  await page.screenshot({ path: 'test-output/chamber-desktop.png' });
  const beforeInspect = await position();
  const beforeInspectYaw = await page.$eval('#game', (element) => Number(element.dataset.cameraYaw));
  await page.locator('::-p-aria(Inspect room)').click();
  await page.waitForFunction(() => document.querySelector('#game').dataset.cameraMode === 'overview');
  assert.deepEqual(await position(), beforeInspect, 'inspection does not move the hero');
  assert.equal(
    await page.$eval('#game', (element) => Number(element.dataset.cameraYaw)),
    beforeInspectYaw,
    'inspection preserves camera-relative control orientation',
  );
  await page.screenshot({ path: 'test-output/reference-room-overview.png' });
  await page.locator('::-p-aria(Follow hero)').click();
  await page.waitForFunction(() => document.querySelector('#game').dataset.cameraMode === 'follow');
  assert.deepEqual(await position(), beforeInspect, 'returning to follow preserves position');
  await page.locator('::-p-aria(Inspect room)').click();
  await page.keyboard.down('KeyQ');
  await frames(3);
  await page.keyboard.up('KeyQ');
  assert.equal(
    await page.$eval('#game', (element) => element.dataset.cameraMode),
    'follow',
    'TD01 camera control resumes following from inspection',
  );
  await turnTo(0);
  await page.keyboard.press('KeyF');
  await frames();
  assert.equal(
    await page.$eval('#game', (element) => element.dataset.location),
    'chamber',
    'return requires proximity',
  );
  await walkUntil('KeyD', 'heroX', 4.8, false);
  await frames();
  await page.keyboard.up('KeyD');
  assert.ok((await position()).x <= 4.87, 'measured room wall collision');
  await walkUntil('KeyA', 'heroX', 0.08, true);
  await page.keyboard.up('KeyA');
  await page.keyboard.down('KeyW');
  await page.waitForFunction(() => Number(document.querySelector('#game').dataset.heroZ) < -4.8);
  await frames();
  await page.keyboard.up('KeyW');
  assert.ok((await position()).z >= -4.87, 'return threshold blocks automatic walking');
  assert.match(await page.$eval('.prompt', (element) => element.textContent), /Press F.*Return to the hub/);
  await page.setViewport({ width: 1024, height: 768 });
  await frames();
  await page.screenshot({ path: 'test-output/chamber-laptop.png' });
  await page.keyboard.press('KeyF');
  await page.waitForFunction(
    () =>
      document.querySelector('#game').dataset.location === 'hub' &&
      document.querySelector('#game').dataset.travelling === 'false',
  );
  assert.deepEqual(await position(), { x: 0, z: 4.5 }, 'return restores hub arrival');
  assert.equal(await page.$eval('h1', (element) => element.textContent), 'The Gathering');
  await enterFriends('crossroads');
  assert.equal(await page.$eval('h1', (element) => element.textContent), 'Crossroads walk');
  await page.click('.inspect-room');
  await page.waitForFunction(() => document.querySelector('#game').dataset.cameraMode === 'overview');
  await page.screenshot({ path: 'test-output/phase2-crossroads-overview.png' });
  await page.click('.inspect-room');
  await turnTo(0);
  await walkTo(0, 12);
  await walkTo(-14, 12);
  await page.screenshot({ path: 'test-output/phase2-great-hall-follow.png' });
  for (const [x, z] of [
    [0, 12],
    [6, 12],
    [6, 7],
    [6, 12],
    [0, 12],
    [0, 18],
    [-5, 18],
    [5, 18],
    [0, 18],
    [0, 0],
  ])
    await walkTo(x, z);
  assert.equal(await page.$eval('#game', (element) => element.dataset.cameraMode), 'follow');
  await returnToHub();
  await enterFriends('long-hall');
  assert.equal(await page.$eval('h1', (element) => element.textContent), 'Hall & corners');
  await page.click('.inspect-room');
  await page.waitForFunction(() => document.querySelector('#game').dataset.cameraMode === 'overview');
  await page.screenshot({ path: 'test-output/phase2-long-hall-overview.png' });
  await page.click('.inspect-room');
  await turnTo(0);
  for (const [x, z] of [
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
  ])
    await walkTo(x, z);
  await returnToHub();
  await turnTo(0);
  await page.keyboard.down('KeyD');
  await frames();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await frames(2);
  const blurred = await position();
  await frames();
  assert.deepEqual(await position(), blurred, 'focus loss releases movement');
  await page.keyboard.up('KeyD');
  await page.keyboard.down('ArrowDown');
  await frames();
  await page.keyboard.up('ArrowDown');
  assert.ok((await position()).z > blurred.z, 'arrow keys move');
  await page.setViewport({ width: 1024, height: 768 });
  await frames();
  await page.screenshot({ path: 'test-output/hub-laptop.png' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const beforeTurn = await position();
  const priorYaw = await page.$eval('#game', (element) => Number(element.dataset.cameraYaw));
  await page.keyboard.down('KeyQ');
  await frames(15);
  await page.keyboard.up('KeyQ');
  await frames(2);
  const afterYaw = await page.$eval('#game', (element) => Number(element.dataset.cameraYaw));
  assert.ok(afterYaw > priorYaw + 0.2, 'Q turns the camera');
  assert.deepEqual(await position(), beforeTurn, 'turning keys do not strafe');
  await turnTo(Math.PI / 2);
  const beforeRelative = await position();
  await page.keyboard.down('KeyW');
  await frames(15);
  await page.keyboard.up('KeyW');
  await frames(2);
  assert.ok((await position()).x < beforeRelative.x - 0.1, 'W follows rotated camera');
  const oldGoal = await page.$eval('#game', (element) => Number(element.dataset.cameraGoal));
  await page.mouse.wheel({ deltaY: 180 });
  await frames(4);
  assert.ok(
    (await page.$eval('#game', (element) => Number(element.dataset.cameraGoal))) > oldGoal,
    'wheel zooms',
  );
  await page.keyboard.press('Space');
  await page.waitForFunction(() => Number(document.querySelector('#game').dataset.jumpLift) > 0.05);
  await page.waitForFunction(() => Number(document.querySelector('#game').dataset.jumpLift) === 0);
  await page.mouse.move(650, 400);
  const beforeMouse = await position();
  await page.mouse.down({ button: 'left' });
  await page.mouse.down({ button: 'right' });
  await frames(15);
  await page.mouse.up({ button: 'left' });
  await page.mouse.up({ button: 'right' });
  await frames(2);
  assert.ok(
    Math.hypot((await position()).x - beforeMouse.x, (await position()).z - beforeMouse.z) > 0.1,
    'both buttons walk forward',
  );
  const beforeOrbit = await page.$eval('#game', (element) => Number(element.dataset.cameraYaw));
  await page.keyboard.down('KeyW');
  await page.mouse.down({ button: 'left' });
  await page.mouse.move(710, 420, { steps: 8 });
  await frames(3);
  await page.waitForFunction(() => document.pointerLockElement === document.querySelector('canvas'), {
    timeout: 5000,
  });
  await page.mouse.up({ button: 'left' });
  await frames(3);
  const releasedMouse = await position();
  await frames(12);
  assert.ok(
    Math.hypot((await position()).x - releasedMouse.x, (await position()).z - releasedMouse.z) > 0.08,
    'normal mouse release preserves held keyboard movement',
  );
  await page.keyboard.up('KeyW');
  const afterOrbit = await page.$eval('#game', (element) => Number(element.dataset.cameraYaw));
  assert.ok(Math.abs(afterOrbit - beforeOrbit) > 0.05, 'mouse drag orbits');
  await page.screenshot({ path: 'test-output/movement-camera.png' });
  assert.deepEqual(errors, []);
  console.log(
    'PASS: real WebGL reference room and both modular dungeons, all seven section types, repeated two-way travel, camera-relative movement, turning, orbit, zoom, mouse walking, jump and focus release',
  );
} catch (error) {
  console.error(
    'Dungeon movement failure state',
    await page.$eval('#game', (element) => ({ ...element.dataset })),
  );
  throw error;
} finally {
  await browser.close();
}
