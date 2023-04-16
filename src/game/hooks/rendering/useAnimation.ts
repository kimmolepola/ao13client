import { useCallback } from "react";
import * as THREE from "three";
import * as renderingHooks from ".";

let running = false;
let previousTimestamp = 0;

export const useAnimation = (
  camera: THREE.Camera,
  scene: THREE.Scene,
  renderer: THREE.Renderer
) => {
  const { run } = renderingHooks.useFrame(camera);

  const animate = (timestamp: number) => {
    running && requestAnimationFrame(animate);
    const delta = timestamp - previousTimestamp;
    previousTimestamp = timestamp;
    renderer.render(scene, camera);
  };

  const startAnimation = () => {
    running = true;
    const time = performance.now();
    previousTimestamp = time;
    animate(time);
  };

  const stopAnimation = useCallback(() => {
    running = false;
  }, []);

  return { startAnimation, stopAnimation };
};
