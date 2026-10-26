import * as THREE from 'three';
import type { HeroCamera } from './camera.ts';
import type { Footprint, QuarterTurn } from '../game/sections.ts';

export type CameraView = 'wow' | 'diablo' | 'zelda' | 'topdown' | 'slice';

export const CAMERA_VIEWS: readonly { readonly id: CameraView; readonly label: string }[] = [
  { id: 'wow', label: 'WoW · follow' },
  { id: 'diablo', label: 'Diablo · oblique' },
  { id: 'zelda', label: 'Zelda · high' },
  { id: 'topdown', label: 'Top-down' },
  { id: 'slice', label: 'Building slice · inspect' },
];

/** A generated slice looks across the stair axis while leaving the player's walking yaw intact. */
export function cameraViewYaw(view: CameraView, yaw: number, rotation?: QuarterTurn): number {
  return view === 'slice' && rotation !== undefined ? Math.PI / 2 - (rotation * Math.PI) / 2 : yaw;
}

/** Fit the actual side projection, including near-side depth, rather than the whole ground diagonal. */
export function sliceFraming(bounds: Footprint, azimuth: number, aspect: number, verticalFov: number) {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const tangentVertical = Math.tan(THREE.MathUtils.degToRad(verticalFov) / 2);
  const tangentHorizontal = tangentVertical * aspect;
  const sine = Math.sin(azimuth);
  const cosine = Math.cos(azimuth);
  let distance = 6;
  for (const x of [bounds.minX - 0.25, bounds.maxX + 0.25]) {
    for (const z of [bounds.minZ - 0.25, bounds.maxZ + 0.25]) {
      const dx = x - centerX;
      const dz = z - centerZ;
      const depth = dx * sine + dz * cosine;
      const across = dx * cosine - dz * sine;
      distance = Math.max(
        distance,
        depth + Math.abs(across) / (tangentHorizontal * 0.86),
        depth + 1.8 / (tangentVertical * 0.55),
      );
    }
  }
  return { centerX, centerZ, distance, halfWidth: distance * tangentHorizontal };
}

interface CameraSubject {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Presets change only the lens. The inherited yaw remains the movement basis in every play view. */
export function createCameraViews(camera: THREE.PerspectiveCamera, controller: HeroCamera) {
  let selected: CameraView = 'wow';
  const from = new THREE.Vector3();
  const to = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0, 1, 0);

  function reset() {
    selected = 'wow';
    controller.photo = null;
    camera.up.copy(worldUp);
  }

  return {
    get view(): CameraView {
      return selected;
    },
    select(view: CameraView) {
      selected = view;
      controller.photo = null;
      camera.up.copy(worldUp);
    },
    update(hero: CameraSubject, bounds: Footprint, worldRotation?: QuarterTurn) {
      if (selected === 'wow') {
        controller.photo = null;
        camera.up.copy(worldUp);
        return;
      }
      const azimuth = cameraViewYaw(selected, controller.yaw, worldRotation);
      const sine = Math.sin(azimuth);
      const cosine = Math.cos(azimuth);
      const zoom = Math.max(0.45, Math.min(2.5, controller.goal / 4.6));
      to.set(hero.x, hero.y + 0.25, hero.z);
      camera.up.copy(worldUp);
      if (selected === 'topdown') {
        // A genuinely vertical lens needs an explicit screen-up direction to avoid lookAt's singularity.
        camera.up.set(-sine, 0, -cosine);
        from.copy(to).add(new THREE.Vector3(0, 12 * zoom, 0));
      } else if (selected === 'slice') {
        const frame = sliceFraming(bounds, azimuth, camera.aspect, camera.fov);
        to.set(frame.centerX, 1.5, frame.centerZ);
        // This inspection view is deliberately level: both storeys and the continuous stairs are visible.
        from.set(frame.centerX + sine * frame.distance, 1.5, frame.centerZ + cosine * frame.distance);
      } else {
        const elevation = selected === 'diablo' ? 0.84 : 1.22;
        const distance = (selected === 'diablo' ? 8 : 10) * zoom;
        from.set(
          hero.x + sine * Math.cos(elevation) * distance,
          to.y + Math.sin(elevation) * distance,
          hero.z + cosine * Math.cos(elevation) * distance,
        );
      }
      controller.photo = { from, to };
    },
    reset,
  };
}
