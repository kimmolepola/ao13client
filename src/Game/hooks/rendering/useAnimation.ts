import { useCallback } from "react";
import * as THREE from "three";

let loopId: number | undefined;
let previousTimestamp = 0;

export const useAnimation = (
  camera: THREE.Camera,
  scene: THREE.Scene,
  renderer: THREE.Renderer,
  runFrame: (delta: number) => void
) => {
  const animate = (timestamp: number, xLoopId: number) => {
    loopId === xLoopId && requestAnimationFrame((x) => animate(x, xLoopId));
    const delta = timestamp - previousTimestamp;
    runFrame(delta);
    previousTimestamp = timestamp;
    renderer.render(scene, camera);
  };

  const startAnimation = () => {
    const time = performance.now();
    previousTimestamp = time;
    loopId = time;
    animate(time, time);
  };

  const stopAnimation = useCallback(() => {
    loopId = undefined;
  }, []);

  return { startAnimation, stopAnimation };
};
