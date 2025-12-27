import { RefObject } from "react";
import * as THREE from "three";
import * as types from "src/types";

type RunFrame = (
  delta: number,
  camera: THREE.Camera,
  scene: THREE.Scene,
  infoBoxRef: RefObject<HTMLDivElement>,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
  gameEventHandler: types.GameEventHandler,
  sendControlsData: (data: ArrayBuffer) => void
) => void;

let loopId: number | undefined;
let previousTimestamp = 0;

const animate = (
  timestamp: number,
  xLoopId: number,
  camera: THREE.Camera,
  scene: THREE.Scene,
  renderer: THREE.Renderer,
  infoBoxRef: RefObject<HTMLDivElement>,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
  gameEventHandler: types.GameEventHandler,
  sendControlsData: (data: ArrayBuffer) => void,
  runFrame: RunFrame
) => {
  loopId === xLoopId &&
    requestAnimationFrame((x) =>
      animate(
        x,
        xLoopId,
        camera,
        scene,
        renderer,
        infoBoxRef,
        radarBoxRef,
        gameEventHandler,
        sendControlsData,
        runFrame
      )
    );
  const delta = timestamp - previousTimestamp;
  runFrame(
    delta,
    camera,
    scene,
    infoBoxRef,
    radarBoxRef,
    gameEventHandler,
    sendControlsData
  );
  previousTimestamp = timestamp;
  renderer.render(scene, camera);
};

export const startAnimation = (
  camera: THREE.Camera,
  scene: THREE.Scene,
  renderer: THREE.Renderer,
  infoBoxRef: RefObject<HTMLDivElement>,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
  gameEventHandler: types.GameEventHandler,
  sendControlsData: (data: ArrayBuffer) => void,
  runFrame: RunFrame
) => {
  const time = performance.now();
  previousTimestamp = time;
  loopId = time;
  animate(
    time,
    time,
    camera,
    scene,
    renderer,
    infoBoxRef,
    radarBoxRef,
    gameEventHandler,
    sendControlsData,
    runFrame
  );
};

export const stopAnimation = () => {
  loopId = undefined;
};
