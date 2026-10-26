import * as THREE from 'three';
import { FIXED_STEP, TUNNELS } from '../game/hub.ts';
import { HubSimulation } from '../game/simulation.ts';
import { createHud } from '../ui/hud.ts';
import { loadHubAssets } from './assets.ts';
import { buildHub } from './hub-scene.ts';
import { MovementInput } from './input.ts';
import { HeroCamera, verticalFov } from './camera.ts';
import { HeroMotion } from './hero-motion.ts';
import { interpolateHero } from './interpolate.ts';
import { wrapAngle } from '../core/math.ts';
import type { LocationId } from '../game/locations.ts';
import { configureReferenceLighting } from './reference-lighting.ts';
import { getLayout } from '../game/section-layouts.ts';
import { sectionAt } from '../game/section-collision.ts';
import { buildDungeonScene } from './dungeon-scene.ts';
import { createCameraViews } from './camera-views.ts';

export async function startHub(host: HTMLElement): Promise<() => void> {
  await document.fonts.ready;
  const assets = await loadHubAssets();
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  } catch (error) {
    assets.dispose();
    throw error;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.setAttribute('aria-label', 'Painted fantasy gathering hub');
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#21182f');
  scene.fog = new THREE.Fog('#21182f', 40, 75);
  const fill = new THREE.HemisphereLight('#e8e4f5', '#76615c', 2.3);
  scene.add(fill);
  const sun = new THREE.DirectionalLight('#ffe1b5', 3);
  sun.position.set(-10, 18, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, far: 60 });
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  configureReferenceLighting(scene, sun, fill, renderer);
  const hub = new THREE.Group();
  const chamber = new THREE.Group();
  scene.add(hub, chamber);
  const disposeHub = buildHub(hub, assets.prop);
  const sim = new HubSimulation();
  let shownLayout = sim.layoutId;
  let shownSeed = sim.seed;
  let chamberView = buildDungeonScene(chamber, assets.piece, shownLayout, sim.dungeon);
  scene.add(assets.knight);
  let previous = { x: sim.hero.x, z: sim.hero.z, y: sim.hero.y };
  let rendered = sim.hero;
  const motion = new HeroMotion(assets.knight, assets.clips);
  motion.reset(sim.hero);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 800);
  const cam = new HeroCamera(camera);
  const views = createCameraViews(camera, cam);
  // Start behind the arrival pose, looking towards the hub entrances.
  cam.snapBehind(sim.hero.facing);
  cam.follow = () => ({ x: rendered.x, y: rendered.y + motion.lift, z: rendered.z });
  const hubBlockers = [new THREE.Box3(new THREE.Vector3(-1.5, 0, -1.5), new THREE.Vector3(1.5, 2.4, 1.5))];
  for (const tunnel of TUNNELS) {
    hubBlockers.push(
      new THREE.Box3(
        new THREE.Vector3(tunnel.x - 1.9, 0, tunnel.z - 0.7),
        new THREE.Vector3(tunnel.x + 1.9, 3.1, tunnel.z + 0.1),
      ),
    );
  }
  cam.blockers = () => hubBlockers;
  let outsideView: { pitch: number; distance: number } | undefined;
  let location: LocationId = sim.location;
  let previousFacing = sim.hero.facing;
  let inspection: { yaw: number; pitch: number; distance: number } | undefined;
  function followHero() {
    cam.photo = null;
    inspection = undefined;
  }
  function resize() {
    camera.aspect = host.clientWidth / Math.max(1, host.clientHeight);
    camera.fov = verticalFov(camera.aspect);
    camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth, host.clientHeight);
  }
  resize();
  window.addEventListener('resize', resize);
  const hud = createHud(host, {
    inspect() {
      if (sim.location !== 'chamber' || sim.transition || sim.layoutId === 'generated') return;
      if (inspection) {
        followHero();
        return;
      }
      input.clear();
      inspection = { yaw: cam.yaw, pitch: cam.pitch, distance: cam.goal };
      const bounds = chamberView.bounds;
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerZ = (bounds.minZ + bounds.maxZ) / 2;
      const span = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ);
      const distance = Math.max(12, span * 0.78);
      cam.photo = {
        from: new THREE.Vector3(
          centerX + Math.sin(cam.yaw) * distance,
          distance,
          centerZ + Math.cos(cam.yaw) * distance,
        ),
        to: new THREE.Vector3(centerX, 0.2, centerZ),
      };
    },
    chooseLayout(choice) {
      input.clear();
      sim.apply({ type: 'choose-layout', layoutId: choice });
    },
    focusLayout() {
      input.clear();
    },
    chooseSeed(seed) {
      input.clear();
      sim.apply({ type: 'choose-seed', seed });
    },
    nextSeed() {
      input.clear();
      sim.apply({ type: 'choose-seed', seed: (sim.seed + 1) >>> 0 });
    },
    chooseView(view) {
      if (sim.location !== 'chamber' || sim.layoutId !== 'generated' || sim.transition) return;
      input.clear();
      followHero();
      views.select(view);
    },
  });
  const input = new MovementInput({
    dom: renderer.domElement,
    camera: cam,
    hero: () => sim.hero,
    send: (command) => sim.apply(command),
    isLocked: () =>
      sim.transition !== undefined ||
      (sim.location === 'chamber' && sim.layoutId === 'generated' && views.view === 'slice'),
    jump: () => motion.jump(),
  });
  let priorTime = performance.now();
  let accumulated = 0;
  let animation = 0;
  let disposed = false;
  function frame(now: number) {
    if (disposed) return;
    // Bound catch-up after suspension; all actual gameplay steps remain fixed.
    const elapsed = Math.min((now - priorTime) / 1000, 0.1);
    priorTime = now;
    accumulated += elapsed;
    while (accumulated >= FIXED_STEP) {
      previous = { x: sim.hero.x, z: sim.hero.z, y: sim.hero.y };
      input.update(FIXED_STEP);
      sim.step();
      accumulated -= FIXED_STEP;
    }
    const hero = sim.hero;
    const layoutChanged =
      shownLayout !== sim.layoutId || (sim.layoutId === 'generated' && shownSeed !== sim.seed);
    if (layoutChanged) {
      followHero();
      views.reset();
      chamberView.dispose();
      shownLayout = sim.layoutId;
      shownSeed = sim.seed;
      chamberView = buildDungeonScene(chamber, assets.piece, shownLayout, sim.dungeon);
    }
    hub.visible = sim.location === 'hub';
    chamber.visible = sim.location === 'chamber';
    if (sim.location !== location || layoutChanged) {
      const bounds =
        sim.location === 'chamber'
          ? chamberView.bounds
          : { minX: -12.5, maxX: 12.5, minZ: -12.5, maxZ: 12.5 };
      const x = (bounds.minX + bounds.maxX) / 2;
      const z = (bounds.minZ + bounds.maxZ) / 2;
      const span =
        sim.location === 'chamber' && sim.layoutId !== 'reference'
          ? Math.hypot(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) / 2 + 2
          : 17;
      sun.position.set(x - 7, 12, z + 8);
      sun.target.position.set(x, 0, z);
      Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span });
      sun.shadow.camera.updateProjectionMatrix();
    }
    if (sim.location !== location) {
      followHero();
      views.reset();
      location = sim.location;
      input.clear();
      motion.reset(hero);
      previous = { x: hero.x, z: hero.z, y: hero.y };
      cam.turn(wrapAngle(hero.facing - previousFacing));
      cam.indoors = location === 'chamber';
      if (cam.indoors) {
        outsideView = { pitch: cam.pitch, distance: cam.goal };
        cam.easeTo(0.92, 4.6);
      } else if (outsideView) {
        cam.easeTo(outsideView.pitch, outsideView.distance);
        outsideView = undefined;
      }
    }
    previousFacing = hero.facing;
    if (
      inspection &&
      (hero.moving ||
        sim.transition ||
        cam.yaw !== inspection.yaw ||
        cam.pitch !== inspection.pitch ||
        cam.goal !== inspection.distance)
    )
      followHero();
    rendered = interpolateHero(previous, hero, accumulated / FIXED_STEP);
    motion.update(rendered, elapsed, sim.transition !== undefined);
    chamberView.update(cam.yaw, hero, views.view, inspection !== undefined);
    if (sim.location === 'chamber' && sim.layoutId === 'generated') {
      views.update(
        { x: rendered.x, y: rendered.y + motion.lift, z: rendered.z },
        chamberView.bounds,
        sim.dungeon.rotation,
      );
    }
    cam.update(elapsed);
    host.dataset['cameraYaw'] = String(cam.yaw);
    host.dataset['cameraPitch'] = String(cam.pitch);
    host.dataset['cameraGoal'] = String(cam.goal);
    host.dataset['cameraDistance'] = String(camera.position.distanceTo(cam.target));
    host.dataset['jumpLift'] = String(motion.lift);
    host.dataset['cameraMode'] = views.view === 'slice' ? 'slice' : inspection ? 'overview' : 'follow';
    host.dataset['heroModelY'] = String(assets.knight.position.y);
    host.dataset['cameraY'] = String(camera.position.y);
    const sectionName =
      sim.layoutId === 'generated'
        ? (sectionAt(sim.dungeon.floors[hero.floor].layout, hero.x, hero.z)?.title ?? 'Stairs')
        : sim.layoutId === 'reference'
          ? 'Reference pieces'
          : (sectionAt(getLayout(sim.layoutId), hero.x, hero.z)?.title ?? 'Connecting passage');
    hud.update(hero, sim.location, sim.transition, inspection !== undefined, sim.layoutId, sectionName, {
      seed: sim.seed,
      dungeon: sim.dungeon,
      cameraView: views.view,
      atGoal: sim.atGoal,
    });
    renderer.render(scene, camera);
    host.dataset['drawCalls'] = String(renderer.info.render.calls);
    host.dataset['triangles'] = String(renderer.info.render.triangles);
    host.dataset['geometries'] = String(renderer.info.memory.geometries);
    host.dataset['textures'] = String(renderer.info.memory.textures);
    host.dataset['ready'] = 'true';
    animation = requestAnimationFrame(frame);
  }
  animation = requestAnimationFrame(frame);
  return () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(animation);
    input.dispose();
    window.removeEventListener('resize', resize);
    hud.dispose();
    motion.dispose();
    disposeHub();
    chamberView.dispose();
    assets.dispose();
    sun.shadow.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    scene.clear();
    delete host.dataset['ready'];
  };
}
