import * as THREE from 'three';

type PieceFactory = (name: string, scale?: number) => THREE.Group;

interface Batch {
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.Material | THREE.Material[];
  readonly transforms: THREE.Matrix4[];
  mesh?: THREE.InstancedMesh;
}

/** Instances share the loaded kit's geometry/materials; only instance buffers are owned here. */
export function createSectionBatches(root: THREE.Group, piece: PieceFactory) {
  const batches = new Map<string, Batch>();
  const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  let flushed = false;

  function add(name: string, x: number, z: number, rotation = 0, y = 0) {
    if (flushed) throw new Error('Cannot append to a finished section batch');
    const model = piece(name);
    model.position.set(x, y, z);
    model.rotation.y = rotation;
    model.updateMatrixWorld(true);
    const slots: { batch: Batch; index: number; matrix: THREE.Matrix4 }[] = [];
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const key = `${object.geometry.uuid}:${materials.map((material) => material.uuid).join(':')}`;
      let batch = batches.get(key);
      if (!batch) {
        batch = { geometry: object.geometry, material: object.material, transforms: [] };
        batches.set(key, batch);
      }
      const matrix = object.matrixWorld.clone();
      slots.push({ batch, index: batch.transforms.length, matrix });
      batch.transforms.push(matrix);
    });
    let visible = true;
    return {
      setVisible(next: boolean) {
        if (next === visible) return;
        visible = next;
        for (const slot of slots) {
          const mesh = slot.batch.mesh;
          if (!mesh) throw new Error('Flush section batches before changing visibility');
          mesh.setMatrixAt(slot.index, next ? slot.matrix : hidden);
          mesh.instanceMatrix.needsUpdate = true;
        }
      },
    };
  }

  return {
    add,
    flush() {
      if (flushed) throw new Error('Section batches already finished');
      flushed = true;
      for (const batch of batches.values()) {
        const mesh = new THREE.InstancedMesh(batch.geometry, batch.material, batch.transforms.length);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        batch.transforms.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.computeBoundingSphere();
        root.add(mesh);
        batch.mesh = mesh;
      }
    },
    dispose() {
      for (const batch of batches.values()) batch.mesh?.dispose();
      batches.clear();
    },
  };
}
