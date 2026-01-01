import * as THREE from "three";
import * as types from "src/types";
import { loadBackground, loadPlane, loadBox } from "./meshes";
import * as globals from "src/globals";

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
    case types.GameObjectType.EXPLOSION:
      return loadMesh(scene, loadPlane, "explosion.png");
    case types.GameObjectType.BULLET:
      return loadMesh(scene, loadBox, "bullet.png", [0.1, 0.1, 1]);
    case types.GameObjectType.BACKGROUND:
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
