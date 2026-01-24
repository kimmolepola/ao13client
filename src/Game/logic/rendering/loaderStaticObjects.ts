import * as THREE from "three";
import * as globals from "src/globals";
import * as types from "src/types";
import { loadRunway } from "./meshes";

type MeshLoadFn = () => Promise<
  THREE.Mesh<THREE.PlaneGeometry, THREE.Material>
>;

const load = async (
  scene: THREE.Scene,
  meshLoadFn: MeshLoadFn,
  baseStateStaticObject: types.BaseStateStaticObject,
  o: types.StaticGameObject
) => {
  const bo = baseStateStaticObject;
  const mesh = await meshLoadFn();
  mesh.position.x = bo.x;
  mesh.position.y = bo.y;
  console.log("--xy:", bo.x, bo.y);
  mesh.position.z = 0;
  mesh.rotation.setFromVector3(new THREE.Vector3(0, 0, bo.rotation));
  o.object3d = mesh;
  scene.add(mesh);
};

const removeStaticObject = (scene: THREE.Scene, objectsIndex: number) => {
  const os = globals.staticObjects;
  const o = os[objectsIndex];
  if (o.object3d) {
    scene.remove(o.object3d);
  }
  os.splice(objectsIndex, 1);
};

export const updateRenderedStaticObjects = (
  staticObjects: types.BaseStateStaticObject[],
  scene: THREE.Scene
) => {
  const os = globals.staticObjects;
  for (let i = os.length - 1; i >= 0; i--) {
    const o = os[i];
    const baseStateStaticObject = staticObjects.find((x) => x.id === o.id);
    if (baseStateStaticObject) {
      const isFound = o.object3d && scene.children.includes(o.object3d);
      !isFound && load(scene, loadRunway, baseStateStaticObject, o);
    } else {
      removeStaticObject(scene, i);
    }
  }
};
