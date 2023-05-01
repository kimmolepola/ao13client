import { RefObject, useEffect } from "react";
import * as hooks from "..";
import * as commonHooks from "src/Game/Common/hooks";

export const useRendering = (ref: RefObject<HTMLDivElement>) => {
  const { scene, renderer, camera } = commonHooks.useSetup();
  commonHooks.useLoader(scene);
  const { runFrame } = hooks.useFrame(camera);
  const { startAnimation, stopAnimation } = commonHooks.useAnimation(
    camera,
    scene,
    renderer,
    runFrame
  );

  useEffect(() => {
    // Do not set useState-state here.
    // startAnimation is not wrapped in useCallback.
    // Would cause an infinite loop.
    const node = ref.current;
    node?.appendChild(renderer.domElement);
    startAnimation();
    return () => {
      node?.removeChild(renderer.domElement);
      stopAnimation();
    };
  }, [ref, renderer, startAnimation, stopAnimation]);
};
