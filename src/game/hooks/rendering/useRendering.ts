import { useCallback, RefObject, useEffect, useMemo } from "react";
import * as THREE from "three";

import * as renderingHooks from ".";

export const useRendering = (ref: RefObject<HTMLDivElement>) => {
  const { camera, scene, renderer } = useMemo(() => {
    const aspectRatio = window.innerWidth / window.innerHeight;
    return {
      camera: new THREE.PerspectiveCamera(70, aspectRatio, 0.01, 10),
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
    camera.position.z = 5;
  }, [camera]);

  useEffect(() => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    ref.current?.appendChild(renderer.domElement);
    setCamera();
    startAnimation();
    return () => {
      stopAnimation();
    };
  }, [ref, renderer, startAnimation, stopAnimation, setCamera]);
};
