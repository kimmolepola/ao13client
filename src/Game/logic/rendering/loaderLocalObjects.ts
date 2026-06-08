import * as THREE from "three";
import * as types from "src/types";
import { loadBackground, loadPlane } from "./meshes";
import * as globals from "src/globals";

export const loadBullet = (scene: THREE.Scene) => {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.06, 1.2),
    new THREE.MeshBasicMaterial({
      color: 0xffdd44,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    })
  );
  scene.add(mesh);
  return mesh;
};

const loadMesh = async (
  scene: THREE.Scene,
  meshLoadFn: (
    fileName?: string,
    size?: [number, number, number]
  ) => Promise<
    THREE.Mesh<THREE.PlaneGeometry, THREE.Material | THREE.Material[]>
  >,
  fileName?: string,
  size?: [number, number, number]
) => {
  const mesh = await meshLoadFn(fileName, size);
  scene.add(mesh);
  return mesh;
};

export const localLoad = (
  scene: THREE.Scene,
  meshName: types.GameObjectType
) => {
  switch (meshName) {
    case types.GameObjectType.Explosion:
      return loadMesh(scene, loadPlane, "explosion.png");
    case types.GameObjectType.Background:
      return loadMesh(scene, loadBackground);
    default:
      break;
  }
};

export const localRemove = (scene: THREE.Scene, objectsIndex: number) => {
  const os = globals.localObjects;
  const o = os[objectsIndex];
  if (o.object3d) {
    scene.remove(o.object3d);
  }
  os.splice(objectsIndex, 1);
};
