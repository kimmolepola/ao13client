import * as THREE from "three";
import * as globals from "src/globals";
import * as types from "src/types";
import { loadFighter } from "./meshes";

type MeshLoadFn = (
  color?: string
) => Promise<THREE.Mesh<THREE.BoxGeometry, THREE.Material[]>>;

const load = async (
  scene: THREE.Scene,
  meshLoadFn: MeshLoadFn,
  o: types.RemoteGameObject
) => {
  const mesh = await meshLoadFn(o?.isMe ? "#FFD700" : undefined);
  scene.add(mesh);
  o.object3d = mesh;
  mesh.geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  mesh.geometry.boundingBox?.getSize(size);
  o.dimensions = size;
  mesh.position.x = Math.random() * 1;
  mesh.position.y = Math.random() * 1;
  const bbox = new THREE.Box3().setFromObject(mesh);
  o.corners2D = [
    new THREE.Vector3(bbox.min.x, bbox.min.y, 0),
    new THREE.Vector3(bbox.min.x, bbox.max.y, 0),
    new THREE.Vector3(bbox.max.x, bbox.min.y, 0),
    new THREE.Vector3(bbox.max.x, bbox.max.y, 0),
  ];
};

export const remove = (scene: THREE.Scene, objectsIndex: number) => {
  const os = globals.remoteObjects;
  const o = os[objectsIndex];
  if (o.object3d) {
    scene.remove(o.object3d);
  }
  os.splice(objectsIndex, 1);
};

export const updateRenderedObjects = (
  objectIds: string[],
  scene: THREE.Scene
) => {
  const os = globals.remoteObjects;
  for (let i = os.length - 1; i >= 0; i--) {
    const o = os[i];
    if (objectIds.includes(o.id)) {
      !o.object3d && load(scene, loadFighter, o);
    } else {
      remove(scene, i);
    }
  }
};
