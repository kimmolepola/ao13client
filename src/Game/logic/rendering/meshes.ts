import * as THREE from "three";
import * as types from "../../../types";
import * as parameters from "../../../parameters";

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
  const width = size?.[0] || 1;
  const height = size?.[1] || 1;
  const depth = size?.[2] || 1;
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
};

const pixelsToDistanceUnits = (pixels: number, oneMeterInPixels: number) => {
  const onePixelInMeters = 1 / oneMeterInPixels;
  const oneMeterInDistanceUnits = 1 / parameters.oneDistanceUnitInMeters;
  const onePixelInDistanceUnits = onePixelInMeters * oneMeterInDistanceUnits;
  const distance = pixels * onePixelInDistanceUnits;
  return distance;
};

export const loadBackground = () => {
  const metersInPixel = 16;
  const oneMeterInPixels = 1 / metersInPixel;
  const createGeometry = (x: THREE.Texture) => {
    const width = pixelsToDistanceUnits(x.image.width, oneMeterInPixels);
    const height = pixelsToDistanceUnits(x.image.height, oneMeterInPixels);
    return new THREE.PlaneGeometry(width, height);
  };
  const createMaterial = (x: THREE.Texture) => {
    // x.wrapS = THREE.MirroredRepeatWrapping;
    // x.wrapT = THREE.MirroredRepeatWrapping;
    // x.repeat.set(1, 1);
    return new THREE.MeshBasicMaterial({
      map: x,
    });
  };
  return load<THREE.PlaneGeometry, THREE.Material>(
    "image1-1px4_5m.jpeg",
    createGeometry,
    createMaterial
  );
};

export const loadRunway = () => {
  // const metersInPixel = 4.5;
  // const qoneMeterInPixels = 1 / metersInPixel;
  const xMeters = 45;
  const xPixels = 10;
  const oneMeterInPixels = xPixels / xMeters;
  console.log("--oneMeterInPixels:", oneMeterInPixels);
  const createGeometry = (x: THREE.Texture) => {
    const width = pixelsToDistanceUnits(x.image.width, oneMeterInPixels);
    const height = pixelsToDistanceUnits(x.image.height, oneMeterInPixels);
    console.log("--runway width:", width);
    return new THREE.PlaneGeometry(width, height);
  };
  const createMaterial = (x: THREE.Texture) => {
    return new THREE.MeshBasicMaterial({
      map: x,
      color: "yellow",
    });
  };
  return load<THREE.PlaneGeometry, THREE.Material>(
    "image2-1px4_5m.jpeg",
    createGeometry,
    createMaterial
  );
};

export const loadFighter = (color?: string) => {
  const xMeters = 13.6;
  const xPixels = 330;
  const oneMeterInPixels = xPixels / xMeters;
  console.log("--fighter oneMeterInPixels:", oneMeterInPixels);
  const createGeometry = (x: THREE.Texture) => {
    const width = pixelsToDistanceUnits(x.image.width, oneMeterInPixels);
    const height = pixelsToDistanceUnits(x.image.height, oneMeterInPixels);
    const depth = types.fighterHalfHeight * 2;
    console.log("--width:", width);
    console.log("--height:", height);
    return new THREE.BoxGeometry(width, height, depth);
  };

  const createMaterial = (x: THREE.Texture) => {
    const empty = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      // wireframe: true,
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
