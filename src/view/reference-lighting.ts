import * as THREE from 'three';

/** Visual match to the Dungeon promo; the original Blender light rig is unavailable. */
export function configureReferenceLighting(
  scene: THREE.Scene,
  sun: THREE.DirectionalLight,
  fill: THREE.HemisphereLight,
  renderer: THREE.WebGLRenderer,
): void {
  scene.background = new THREE.Color('#241a30');
  scene.fog = new THREE.Fog('#241a30', 35, 70);
  sun.color.set('#ffe4c2');
  sun.intensity = 3;
  sun.position.set(-7, 12, 8);
  sun.shadow.radius = 3;
  sun.shadow.normalBias = 0.025;
  fill.color.set('#e9e8fa');
  fill.groundColor.set('#776477');
  fill.intensity = 2;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
}
