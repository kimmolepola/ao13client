import { useCallback } from "react";
import * as THREE from "three";
import * as hooks from "..";
import * as types from "src/types";
import * as globals from "src/globals";

export const useLocalLoader = (scene: THREE.Scene) => {
  const { loadBackground, loadPlane, loadBox } = hooks.useMeshes();

  const loadMesh = useCallback(
    async (
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
    },
    [scene]
  );

  const load = useCallback(
    (meshName: types.GameObjectType) => {
      switch (meshName) {
        case types.GameObjectType.EXPLOSION:
          return loadMesh(loadPlane, "explosion.png");
        case types.GameObjectType.BULLET:
          return loadMesh(loadBox, "bullet.png", [600, 600, 1]);
        case types.GameObjectType.BACKGROUND:
          return loadMesh(loadBackground);
        default:
          break;
      }
    },
    [loadMesh, loadBackground, loadPlane, loadBox]
  );

  const remove = useCallback(
    (objectsIndex: number) => {
      const os = globals.localObjects;
      const o = os[objectsIndex];
      if (o.object3d) {
        scene.remove(o.object3d);
      }
      os.splice(objectsIndex, 1);
    },
    [scene]
  );

  return { load, remove };
};
