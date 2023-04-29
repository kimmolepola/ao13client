import { useCallback, RefObject, useEffect, useMemo } from "react";
import { useRecoilValue } from "recoil";
import * as THREE from "three";

import * as renderingHooks from ".";
import * as atoms from "src/atoms";
import * as types from "src/types";
import * as globals from "src/globals";

export const useRendering = (ref: RefObject<HTMLDivElement>) => {
  const sidepanelGeometry = useRecoilValue(atoms.sidepanelGeometry);
  const main = useRecoilValue(atoms.main);
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
    globals.canvasSize.halfWidth = size.width / 2;
    globals.canvasSize.halfHeight = size.height / 2;
  }, [size]);

  const camera = useMemo(
    () => new THREE.PerspectiveCamera(70, size.width / size.height, 1, 20),
    [size]
  );

  const { scene, renderer } = useMemo(() => {
    return {
      scene: new THREE.Scene(),
      renderer: new THREE.WebGLRenderer({ antialias: true }),
    };
  }, []);

  renderingHooks.useObjects(scene);
  const { startAnimation, stopAnimation } = renderingHooks.useAnimation(
    camera,
    scene,
    renderer,
    main
  );

  const setCamera = useCallback(() => {
    if (size.width > size.height) {
      camera.position.z = 13 * (size.height / size.width);
    } else {
      camera.position.z = 13 * (size.width / size.height);
    }
  }, [camera, size]);

  useEffect(() => {
    renderer.setSize(size.width, size.height);
  }, [renderer, size]);

  useEffect(() => {
    // Do not set useState-state here.
    // startAnimation is not wrapped in useCallback.
    // It would cause an infinite loop.
    const node = ref.current;
    node?.appendChild(renderer.domElement);
    setCamera();
    startAnimation();
    return () => {
      node?.removeChild(renderer.domElement);
      stopAnimation();
    };
  }, [ref, renderer, startAnimation, stopAnimation, setCamera]);
};
