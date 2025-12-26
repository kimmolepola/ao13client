import { useEffect, useMemo } from "react";
import * as THREE from "three";

import * as parameters from "src/parameters";

export const useSetup = (width: number, height: number) => {
  const camera = useMemo(() => {
    const c = new THREE.PerspectiveCamera(70, width / height, 49990, 50001);
    if (width < height) {
      c.position.setZ(parameters.cameraDefaultZ);
    } else {
      c.position.setZ(parameters.cameraDefaultZ);
    }
    return c;
  }, [width, height]);

  const { scene, renderer } = useMemo(() => {
    return {
      scene: new THREE.Scene(),
      renderer: new THREE.WebGLRenderer({ antialias: true }),
    };
  }, []);

  useEffect(() => {
    renderer.setSize(width, height);
  }, [renderer, width, height]);

  return { camera, scene, renderer };
};
