import { RefObject } from "react";
import * as THREE from "three";
import * as types from "src/types";
import { handleAnimationFrame } from "./rendering/frame";
import { handleTick, initializeTicks } from "./tick";
import * as parameters from "src/parameters";

let loopId: number | undefined;
let previousTimestamp = 0;
let cumulativeDelta = 0;
const tickBuffer = new Uint8Array(1);

const loop = (
  timestamp: number,
  xLoopId: number,
  camera: THREE.Camera,
  scene: THREE.Scene,
  renderer: THREE.Renderer,
  width: number,
  height: number,
  infoBoxRef: RefObject<HTMLDivElement>,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
  gameEventHandler: types.GameEventHandler,
  sendControlsData: (data: ArrayBuffer) => void
) => {
  const delta = timestamp - previousTimestamp;
  cumulativeDelta += delta;
  if (cumulativeDelta >= parameters.tickInterval) {
    cumulativeDelta -= parameters.tickInterval;
    handleTick(tickBuffer[0], sendControlsData);
    tickBuffer[0]++;
  }
  handleAnimationFrame(
    delta,
    camera,
    scene,
    width,
    height,
    infoBoxRef,
    radarBoxRef,
    gameEventHandler
  );
  renderer.render(scene, camera);
  previousTimestamp = timestamp;
  loopId === xLoopId &&
    requestAnimationFrame((x) =>
      loop(
        x,
        xLoopId,
        camera,
        scene,
        renderer,
        width,
        height,
        infoBoxRef,
        radarBoxRef,
        gameEventHandler,
        sendControlsData
      )
    );
};

export const startGameLoop = (
  camera: THREE.Camera,
  scene: THREE.Scene,
  renderer: THREE.Renderer,
  width: number,
  height: number,
  infoBoxRef: RefObject<HTMLDivElement>,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
  gameEventHandler: types.GameEventHandler,
  sendControlsData: (data: ArrayBuffer) => void
) => {
  initializeTicks();
  const time = performance.now();
  previousTimestamp = time;
  loopId = time;
  loop(
    time,
    time,
    camera,
    scene,
    renderer,
    width,
    height,
    infoBoxRef,
    radarBoxRef,
    gameEventHandler,
    sendControlsData
  );
};

export const stopGameLoop = () => {
  loopId = undefined;
};
