import * as THREE from "three";

const textureLoader = new THREE.TextureLoader();

const load = async <
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
};

export const loadBox = (fileName?: string, size?: [number, number, number]) => {
  const width = size?.[0] || 10000;
  const height = size?.[1] || 10000;
  const depth = size?.[2] || 10000;
  const createGeometry = () => new THREE.BoxGeometry(width, height, depth);
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
      }),
      empty,
    ];
  };
  return load<THREE.BoxGeometry, THREE.Material[]>(
    fileName || "default.png",
    createGeometry,
    createMaterial
  );
};

export const loadPlane = (
  fileName?: string,
  size?: [number, number, number]
) => {
  const width = size?.[0] || 10000;
  const height = size?.[1] || 10000;
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
};

export const loadBackground = () => {
  const createGeometry = (x: THREE.Texture) =>
    new THREE.PlaneGeometry(x.image.width * 10000, x.image.height * 10000);
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
};

export const loadFighter = (color?: string) => {
  const createGeometry = (x: THREE.Texture) => {
    const width = Math.min(5000, (x.image.width / x.image.height) * 5000);
    const height = Math.min(5000, (x.image.height / x.image.width) * 5000);
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
  return load<THREE.BoxGeometry, THREE.Material[]>(
    "fighter.png",
    createGeometry,
    createMaterial
  );
};
