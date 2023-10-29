import { useCallback, useMemo } from "react";
import * as THREE from "three";

export const useMeshes = () => {
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);

  const load = useCallback(
    async <
      G extends THREE.BoxGeometry | THREE.PlaneGeometry,
      M extends THREE.Material | THREE.Material[]
    >(
      filename: string,
      createGeometry: (x: THREE.Texture) => G,
      createMaterial: (x: THREE.Texture) => M
    ) => {
      const result = await new Promise<THREE.Mesh<G, M>>((resolve, reject) => {
        const onLoad = (x: THREE.Texture) => {
          const m = new THREE.Mesh(
            createGeometry(x),
            createMaterial(x)
          ) as THREE.Mesh<G, M>;
          resolve(m);
        };
        const onError = (err: ErrorEvent) => {
          console.error("onLoad error:", err);
          return reject(new Error("Load error"));
        };
        textureLoader.load(filename, onLoad, undefined, onError);
      });
      return result;
    },
    [textureLoader]
  );

  const loadPlane = useCallback(
    async (fileName?: string, size?: [number, number, number]) => {
      const width = size?.[0] || 1;
      const height = size?.[1] || 1;
      const createGeometry = () => new THREE.PlaneGeometry(width, height);
      const createMaterial = (x: THREE.Texture) =>
        new THREE.MeshBasicMaterial({
          map: x,
          transparent: true,
        });
      return load<THREE.PlaneGeometry, THREE.Material>(
        fileName || "default.png",
        createGeometry,
        createMaterial
      );
    },
    [load]
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
    return load<THREE.PlaneGeometry, THREE.Material>(
      "image1.jpeg",
      createGeometry,
      createMaterial
    );
  }, [load]);

  const loadFighter = useCallback(
    async (color?: string) => {
      const createGeometry = (x: THREE.Texture) => {
        const width = Math.min(1, x.image.width / x.image.height);
        const height = Math.min(1, x.image.height / x.image.width);
        const depth = 0.01;
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
      return load<THREE.BoxGeometry, THREE.Material[]>(
        "fighter.png",
        createGeometry,
        createMaterial
      );
    },
    [load]
  );

  return { loadBackground, loadFighter, loadPlane };
};
