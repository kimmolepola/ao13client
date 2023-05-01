import { useEffect, useMemo } from "react";
import { useRecoilValue } from "recoil";
import * as THREE from "three";

import * as atoms from "src/atoms";
import * as types from "src/types";
import * as globals from "src/globals";
import * as parameters from "src/parameters";

export const useSetup = () => {
  const sidepanelGeometry = useRecoilValue(atoms.sidepanelGeometry);
  const windowSize = useRecoilValue(atoms.windowSize);

  const size = useMemo(() => {
    switch (sidepanelGeometry.position) {
      case types.Position.LEFT:
      case types.Position.RIGHT:
        return {
          width: windowSize.width - sidepanelGeometry.size,
          height: windowSize.height,
        };
      case types.Position.BOTTOM:
      case types.Position.TOP:
        return {
          width: windowSize.width,
          height: windowSize.height - sidepanelGeometry.size,
        };
      default:
        return {
          width: windowSize.width,
          height: windowSize.height,
        };
    }
  }, [sidepanelGeometry, windowSize]);

  useEffect(() => {
    globals.dimensions.windowWidth = windowSize.width;
    globals.dimensions.windowHeight = windowSize.height;
    globals.dimensions.canvasHalfWidth = size.width / 2;
    globals.dimensions.canvasHalfHeight = size.height / 2;
  }, [size, windowSize]);

  const camera = useMemo(() => {
    const c = new THREE.PerspectiveCamera(70, size.width / size.height, 1, 200);
    if (size.width < size.height) {
      c.position.setZ(parameters.cameraDefaultZ);
    } else {
      c.position.setZ(parameters.cameraDefaultZ * (size.height / size.width));
    }
    return c;
  }, [size]);

  const { scene, renderer } = useMemo(() => {
    return {
      scene: new THREE.Scene(),
      renderer: new THREE.WebGLRenderer({ antialias: true }),
    };
  }, []);

  useEffect(() => {
    renderer.setSize(size.width, size.height);
  }, [renderer, size]);

  return { camera, scene, renderer };
};
