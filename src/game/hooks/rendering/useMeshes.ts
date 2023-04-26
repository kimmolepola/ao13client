import { useCallback, useMemo } from "react";
import * as THREE from "three";

export const useMeshes = () => {
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);

  const load = useCallback(
    async (
      filename: string,
      createGeometry: (x: THREE.Texture) => THREE.BufferGeometry,
      createMaterial: (x: THREE.Texture) => THREE.Material | THREE.Material[]
    ) => {
      const result = await new Promise((resolve, reject) => {
        const onLoad = (x: THREE.Texture) => {
          resolve(new THREE.Mesh(createGeometry(x), createMaterial(x)));
        };
        const onError = () => reject(new Error("Load error"));
        textureLoader.load(filename, onLoad, undefined, onError);
      });
      return result as THREE.Mesh;
    },
    [textureLoader]
  );

  const loadBackground = useCallback(async () => {
    const createGeometry = (x: THREE.Texture) =>
      new THREE.PlaneGeometry(x.image.width, x.image.height);
    const createMaterial = (x: THREE.Texture) => {
      x.wrapS = THREE.MirroredRepeatWrapping;
      x.wrapT = THREE.MirroredRepeatWrapping;
      x.repeat.set(120, 120);
      return new THREE.MeshBasicMaterial({
        map: x,
      });
    };
    return load("image1.jpeg", createGeometry, createMaterial);
  }, [load]);

  const loadFighter = useCallback(
    async (color?: string) => {
      const createGeometry = (x: THREE.Texture) => {
        const width = Math.min(1, x.image.width / x.image.height);
        const height = Math.min(1, x.image.height / x.image.width);
        const depth = 1;
        return new THREE.BoxGeometry(width, height, depth);
      };
      const createMaterial = (x: THREE.Texture) => {
        const empty = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
        });
        return [
          empty,
          empty,
          empty,
          empty,
          new THREE.MeshBasicMaterial({
            map: x,
            transparent: true,
            color,
          }),
          empty,
        ];
      };
      return load("fighter.png", createGeometry, createMaterial);
    },
    [load]
  );

  return { loadBackground, loadFighter };
};
