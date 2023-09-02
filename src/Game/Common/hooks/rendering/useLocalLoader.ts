import { useCallback } from "react";
import * as THREE from "three";
import * as hooks from "..";
import * as types from "src/types";

export const useLocalLoader = (scene: THREE.Scene) => {
  const { loadBackground, loadBullet } = hooks.useMeshes();

  const loadMesh = useCallback(
    async (meshLoadFn: () => Promise<THREE.Mesh>) => {
      const mesh = await meshLoadFn();
      scene.add(mesh);
      return mesh;
    },
    [scene]
  );

  const load = useCallback(
    (meshName: types.Meshes) => {
      switch (meshName) {
        case "bullet":
          return loadMesh(loadBullet);
        case "background":
          return loadMesh(loadBackground);
        default:
          break;
      }
    },
    [loadMesh, loadBullet, loadBackground]
  );

  return load;
};
