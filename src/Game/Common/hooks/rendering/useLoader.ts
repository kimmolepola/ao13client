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

  const load = useCallback(
    async (
      meshLoadFn: (color?: string) => Promise<THREE.Mesh>,
      o: types.GameObject
    ) => {
      const mesh = await meshLoadFn(o?.isMe ? "#FFD700" : undefined);
      o.object3D && scene.remove(o.object3D);
      scene.add(mesh);
      o.object3D = mesh;
      mesh.geometry.computeBoundingBox();
      const size = new THREE.Vector3();
      mesh.geometry.boundingBox?.getSize(size);
      o.dimensions = size;
    },
    [scene]
  );

  const remove = useCallback(
    (objectsIndex: number) => {
      const os = globals.objects;
      const o = os[objectsIndex];
      if (o.object3D) {
        scene.remove(o.object3D);
      }
      os.splice(objectsIndex, 1);
    },
    [scene]
  );

  const updateRenderedObjects = useCallback(() => {
    const os = globals.objects;
    for (let i = os.length - 1; i >= 0; i--) {
      const o = os[i];
      if (objectIds.includes(o.id)) {
        load(loadFighter, o);
      } else {
        remove(i);
      }
    }
  }, [objectIds, load, loadFighter, remove]);

  useEffect(() => {
    updateRenderedObjects();
  }, [objectIds, updateRenderedObjects]);
};
