import { useCallback, RefObject, useEffect, useMemo } from "react";
import { useRecoilValue } from "recoil";
import * as THREE from "three";

import * as renderingHooks from ".";
import * as atoms from "../../../atoms";
import * as types from "../../../types";

export const useRendering = (ref: RefObject<HTMLDivElement>) => {
  const windowSize = useRecoilValue(atoms.windowSize);
  const sidepanelGeometry = useRecoilValue(atoms.sidepanelGeometry);

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

  const camera = useMemo(
    () => new THREE.PerspectiveCamera(70, size.width / size.height, 0.01, 11),
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
    renderer
  );

  const setCamera = useCallback(() => {
    camera.position.z = Math.min(10, 10 / (size.width / size.height));
  }, [camera, size]);

  useEffect(() => {
    renderer.setSize(size.width, size.height);
  }, [renderer, size]);

  useEffect(() => {
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
