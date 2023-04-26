import { useCallback } from "react";
import * as THREE from "three";
import * as renderingHooks from ".";

let loopId: number | undefined;
let previousTimestamp = 0;

export const useAnimation = (
  camera: THREE.Camera,
  scene: THREE.Scene,
  renderer: THREE.Renderer,
  main: boolean
) => {
  const { run } = renderingHooks.useFrame(camera, main);

  const animate = (timestamp: number, xLoopId: number) => {
    loopId === xLoopId && requestAnimationFrame((x) => animate(x, xLoopId));
    const delta = timestamp - previousTimestamp;
    run(delta);
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
