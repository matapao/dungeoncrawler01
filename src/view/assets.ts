import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

export const DUNGEON_PIECE_SCALE = 0.25;

export interface PieceBounds {
  readonly min: { readonly x: number; readonly y: number; readonly z: number };
  readonly max: { readonly x: number; readonly y: number; readonly z: number };
}

export async function loadHubAssets() {
  const loader = new GLTFLoader();
  const assetBase = `${import.meta.env.BASE_URL}assets/`;
  const [kit, knight, animations] = await Promise.all([
    loader.loadAsync(`${assetBase}kits/dungeon.glb`),
    loader.loadAsync(`${assetBase}characters2/Knight.glb`),
    loader.loadAsync(`${assetBase}characters2/anims_medium.glb`),
  ]);
  const roots = [kit.scene, knight.scene];
  for (const root of roots) {
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }

  function sourceFor(name: string): THREE.Object3D {
    const source = kit.scene.children.find((object) => object.name === name);
    if (!source) throw new Error(`Missing inherited dungeon asset: ${name}`);
    return source;
  }

  function prop(name: string, height: number): THREE.Group {
    return fit(sourceFor(name).clone(true), height);
  }

  // Structural pieces retain the pack's pivots, proportions and shared grid.
  function piece(name: string, scale = DUNGEON_PIECE_SCALE): THREE.Group {
    const wrapper = new THREE.Group();
    wrapper.add(sourceFor(name).clone(true));
    wrapper.scale.setScalar(scale);
    return wrapper;
  }

  function bounds(name: string, scale = DUNGEON_PIECE_SCALE): PieceBounds {
    const measured = new THREE.Box3().setFromObject(sourceFor(name));
    return {
      min: { x: measured.min.x * scale, y: measured.min.y * scale, z: measured.min.z * scale },
      max: { x: measured.max.x * scale, y: measured.max.y * scale, z: measured.max.z * scale },
    };
  }

  return {
    prop,
    piece,
    bounds,
    knight: fit(clone(knight.scene), 0.5),
    clips: animations.animations,
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      const textures = new Set<THREE.Texture>();
      for (const root of roots) {
        root.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          geometries.add(object.geometry);
          const list = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of list) {
            materials.add(material);
            for (const value of Object.values(material))
              if (value instanceof THREE.Texture) textures.add(value);
          }
        });
      }
      textures.forEach((texture) => texture.dispose());
      materials.forEach((material) => material.dispose());
      geometries.forEach((geometry) => geometry.dispose());
    },
  };
}

function fit(object: THREE.Object3D, height: number): THREE.Group {
  object.position.set(0, 0, 0);
  const bounds = new THREE.Box3().setFromObject(object);
  const scale = height / Math.max(0.01, bounds.max.y - bounds.min.y);
  const center = bounds.getCenter(new THREE.Vector3());
  const wrapper = new THREE.Group();
  object.position.set(-center.x, -bounds.min.y, -center.z);
  wrapper.add(object);
  wrapper.scale.setScalar(scale);
  return wrapper;
}
