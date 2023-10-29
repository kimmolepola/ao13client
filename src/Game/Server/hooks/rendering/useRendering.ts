import { RefObject, useEffect } from "react";
import * as THREE from "three";
import * as hooks from "..";
import * as commonHooks from "src/Game/Common/hooks";
import * as types from "src/types";

export const useRendering = (
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
  renderer: THREE.Renderer,
  ref: RefObject<HTMLDivElement>,
  infoBoxRef: RefObject<HTMLDivElement>,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
  gameEventHandler: types.ServerGameEventHandler,
  commonGameEventHandler: types.CommonGameEventHandler
) => {
  const { runFrame } = hooks.useFrame(
    camera,
    infoBoxRef,
    radarBoxRef,
    gameEventHandler,
    commonGameEventHandler
  );
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
