import { RefObject } from "react";
import * as THREE from "three";
import * as globals from "src/globals";
import * as types from "src/types";
import { loadFighter } from "./meshes";
import { handleInfoBox } from "./frame";

type MeshLoadFn = (
  color?: string
) => Promise<THREE.Mesh<THREE.BoxGeometry, THREE.Material[]>>;

const box = new THREE.Box3();
const size = new THREE.Vector3();
const load = async (
  scene: THREE.Scene,
  meshLoadFn: MeshLoadFn,
  o: types.SharedGameObject
) => {
  const mesh = await meshLoadFn(o?.isMe ? "#FFD700" : undefined);
  mesh.geometry.computeBoundingBox();
  mesh.position.x = Math.random() * 1;
  mesh.position.y = Math.random() * 1;
  box.setFromObject(mesh);
  box.getSize(size);
  o.radius = Math.sqrt(size.x * size.x + size.y * size.y) / 2;
  o.object3d = mesh;
  mesh.visible = false;
  scene.add(mesh);
};

const removeSharedObject = (scene: THREE.Scene, objectsIndex: number) => {
  const os = globals.sharedObjects;
  const o = os[objectsIndex];
  if (o?.object3d) {
    scene.remove(o.object3d);
  }
  os[objectsIndex] = undefined;
};

export const updateRenderedSharedObjects = (
  objectIds: string[],
  scene: THREE.Scene,
  onGameEvent?: (e: types.GameEvent) => void,
  infoBoxRef?: RefObject<HTMLDivElement>
) => {
  const os = globals.sharedObjects;
  for (let i = os.length - 1; i >= 0; i--) {
    const o = os[i];
    if (o) {
      if (objectIds.includes(o.id)) {
        const isFound = o.object3d && scene.children.includes(o.object3d);
        !isFound && load(scene, loadFighter, o);
      } else {
        o.health = 0;
        o.speed = 0;
        o.positionZ = 0;
        const row2 = o.infoElement.row2Ref?.current;
        if (row2) row2.textContent = "0";
        if (o.isMe && infoBoxRef && o.object3d) handleInfoBox(o, o.object3d, infoBoxRef);
        if (o.object3d && onGameEvent) {
          onGameEvent({ type: types.EventType.HealthZero, o, sequenceNumber: 0 });
        }
        removeSharedObject(scene, i);
      }
    }
  }
};
