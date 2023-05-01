import { useCallback, useEffect } from "react";
import { useRecoilValue } from "recoil";
import * as THREE from "three";
import * as atoms from "src/atoms";
import * as hooks from "..";
import * as globals from "src/globals";

export const useLoader = (scene: THREE.Scene) => {
  const objectIds = useRecoilValue(atoms.objectIds);
  const { loadFighter, loadBackground } = hooks.useMeshes();

  const load = useCallback(
    async (meshLoadFn: () => Promise<THREE.Mesh>, id?: string) => {
      const mesh = await meshLoadFn();
      if (id) {
        const obj = globals.objects.find((x) => x.id === id);
        if (obj && !obj.object3D) {
          scene.add(mesh);
          obj.object3D = mesh;
        }
      } else {
        scene.add(mesh);
      }
    },
    [scene]
  );

  useEffect(() => {
    load(loadBackground);
  }, [load, loadBackground]);

  const updateRenderedObjects = useCallback(() => {
    const os = globals.objects;
    for (let i = os.length - 1; i >= 0; i--) {
      const o = os[i];
      if (objectIds.includes(o.id)) {
        if (!o.object3D) {
          load(loadFighter, o.id);
        }
      } else {
        if (o.object3D) {
          scene.remove(o.object3D);
        }
        os.splice(i, 1);
      }
    }
  }, [scene, objectIds, load, loadFighter]);

  useEffect(() => {
    updateRenderedObjects();
  }, [objectIds, updateRenderedObjects]);
};
