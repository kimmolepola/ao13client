import { useCallback, useEffect } from "react";
import { useRecoilValue } from "recoil";
import * as THREE from "three";
import * as atoms from "src/atoms";
import * as hooks from "..";
import * as globals from "src/globals";
import * as types from "src/types";

export const useLoader = (scene: THREE.Scene) => {
  const objectIds = useRecoilValue(atoms.objectIds);
  const { loadFighter } = hooks.useMeshes();

  console.log("--objectIds:", objectIds);

  const load = useCallback(
    async (
      meshLoadFn: (
        color?: string
      ) => Promise<THREE.Mesh<THREE.BoxGeometry, THREE.Material[]>>,
      o: types.RemoteGameObject
    ) => {
      const mesh = await meshLoadFn(o?.isMe ? "#FFD700" : undefined);
      scene.add(mesh);
      o.object3d = mesh;
      mesh.geometry.computeBoundingBox();
      const size = new THREE.Vector3();
      mesh.geometry.boundingBox?.getSize(size);
      o.dimensions = size;
      mesh.position.x = Math.random() * 500;
      mesh.position.y = Math.random() * 500;
    },
    [scene]
  );

  const remove = useCallback(
    (objectsIndex: number) => {
      const os = globals.remoteObjects;
      const o = os[objectsIndex];
      if (o.object3d) {
        scene.remove(o.object3d);
      }
      os.splice(objectsIndex, 1);
    },
    [scene]
  );

  const updateRenderedObjects = useCallback(() => {
    const os = globals.remoteObjects;
    for (let i = os.length - 1; i >= 0; i--) {
      const o = os[i];
      if (objectIds.includes(o.id)) {
        !o.object3d && load(loadFighter, o);
      } else {
        remove(i);
      }
    }
  }, [objectIds, load, loadFighter, remove]);

  useEffect(() => {
    updateRenderedObjects();
  }, [objectIds, updateRenderedObjects]);
};
