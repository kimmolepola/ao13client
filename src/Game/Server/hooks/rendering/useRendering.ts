import { RefObject, useEffect } from "react";
import * as hooks from "..";
import * as commonHooks from "src/Game/Common/hooks";
import * as types from "src/types";

export const useRendering = (
  ref: RefObject<HTMLDivElement>,
  gameEventHandler: types.GameEventHandler
) => {
  const { scene, renderer, camera } = commonHooks.useSetup();
  commonHooks.useLoader(scene);
  const load = commonHooks.useLocalLoader(scene);
  const { runFrame } = hooks.useFrame(camera, gameEventHandler);
  const { startAnimation, stopAnimation } = commonHooks.useAnimation(
    camera,
    scene,
    renderer,
    runFrame
  );

  useEffect(() => {
    console.log("--load back");
    load("background");
  }, [load]);

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
