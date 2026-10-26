import * as THREE from 'three';
import { HUB_RADIUS, TUNNELS } from '../game/hub.ts';
import { labelSprite } from './labels.ts';

type PropFactory = (name: string, height: number) => THREE.Group;

export function buildHub(scene: THREE.Group, prop: PropFactory): () => void {
  const owned: THREE.Object3D[] = [];
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  function material(color: string) {
    let value = materials.get(color);
    if (!value) {
      value = new THREE.MeshStandardMaterial({ color, roughness: 0.95, flatShading: true });
      materials.set(color, value);
    }
    return value;
  }
  function shape(geometry: THREE.BufferGeometry, color: string, x: number, y: number, z: number) {
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    owned.push(mesh);
    return mesh;
  }
  function place(name: string, height: number, x: number, z: number, rotation = 0) {
    const model = prop(name, height);
    model.position.set(x, 0, z);
    model.rotation.y = rotation;
    scene.add(model);
    return model;
  }

  shape(new THREE.CylinderGeometry(HUB_RADIUS + 0.4, HUB_RADIUS - 0.2, 1, 64), '#544958', 0, -0.6, 0);
  shape(new THREE.CylinderGeometry(HUB_RADIUS, HUB_RADIUS, 0.12, 64), '#a29892', 0, -0.04, 0);
  const rim = shape(new THREE.TorusGeometry(HUB_RADIUS - 0.15, 0.14, 6, 80), '#c4ad8c', 0, 0.03, 0);
  rim.rotation.x = Math.PI / 2;
  const ring = shape(new THREE.RingGeometry(3.0, 3.14, 64), '#c7b58d', 0, 0.03, 0);
  ring.rotation.x = -Math.PI / 2;

  // Low, flat inlays keep all paths open and make the hub feel intentionally built.
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    const tile = shape(
      new THREE.BoxGeometry(0.6, 0.025, 0.18),
      '#c7bca4',
      Math.sin(angle) * 6.2,
      0.03,
      Math.cos(angle) * 6.2,
    );
    tile.rotation.y = angle;
  }
  shape(new THREE.CylinderGeometry(1.5, 1.5, 0.25, 12), '#c3ad8e', 0, 0.14, 0);
  shape(new THREE.CylinderGeometry(1.1, 1.3, 0.42, 8), '#7d7585', 0, 0.45, 0);
  const crystal = shape(new THREE.OctahedronGeometry(0.75), '#98d9d0', 0, 1.65, 0);
  crystal.rotation.z = 0.18;
  const arrivalLight = new THREE.PointLight('#8edfd5', 5, 5);
  arrivalLight.position.set(0, 2, 0);
  scene.add(arrivalLight);

  for (const tunnel of TUNNELS) {
    shape(new THREE.BoxGeometry(3.25, 2.6, 0.5), '#221d30', tunnel.x, 1.3, tunnel.z - 0.4);
    shape(new THREE.BoxGeometry(3.2, 0.05, 1.2), tunnel.color, tunnel.x, 0.04, tunnel.z + 0.5);
    for (const side of [-1, 1]) {
      place('pillar', 2.7, tunnel.x + side * 1.6, tunnel.z);
      place('torch_lit', 1.2, tunnel.x + side * 1.6, tunnel.z + 0.6);
    }
    shape(new THREE.BoxGeometry(3.75, 0.5, 0.85), '#b9aa94', tunnel.x, 2.8, tunnel.z);
    const label = labelSprite(tunnel.name, tunnel.color);
    label.position.set(tunnel.x, 3.65, tunnel.z);
    scene.add(label);
    owned.push(label);
  }

  return () => {
    for (const object of owned) {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
      if (object instanceof THREE.Sprite) {
        object.material.map?.dispose();
        object.material.dispose();
      }
    }
    materials.forEach((value) => value.dispose());
  };
}
