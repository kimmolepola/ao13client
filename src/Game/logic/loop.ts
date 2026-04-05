import { RefObject } from "react";
import * as THREE from "three";
import * as types from "src/types";
import { handleKeys, handleFrame } from "./rendering/frame";
import {
  handleTick,
  initializeAuthoritativeState,
  initializeTicks,
} from "./tick";
import * as parameters from "src/parameters";

let loopId: number | undefined;
let previousTimestamp = 0;
let accumulator = 0;
const tickBuffer = new Uint8Array(1);
// TODO: set tick number based on server tick number

const loop = (
  ticks: types.TickStateObject[][],
  timestamp: number,
  xLoopId: number,
  camera: THREE.Camera,
  scene: THREE.Scene,
  renderer: THREE.Renderer,
  width: number,
  height: number,
  infoBoxRef: RefObject<HTMLDivElement>,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
  onGameEvent: (e: types.GameEvent) => void,
  onInputData: (data: ArrayBuffer) => void
) => {
  const delta = timestamp - previousTimestamp;
  accumulator += delta;
  const isTickFrame = accumulator >= parameters.tickInterval;

  handleKeys(delta);

  while (accumulator >= parameters.tickInterval) {
    accumulator -= parameters.tickInterval;
    handleTick(ticks, tickBuffer[0], onGameEvent, onInputData);
    tickBuffer[0]++;
  }

  handleFrame(
    isTickFrame,
    delta,
    accumulator,
    tickBuffer[0],
    camera,
    width,
    height,
    infoBoxRef,
    radarBoxRef,
    onGameEvent
  );

  renderer.render(scene, camera);

  previousTimestamp = timestamp;
  loopId === xLoopId &&
    requestAnimationFrame((x) =>
      loop(
        ticks,
        x,
        xLoopId,
        camera,
        scene,
        renderer,
        width,
        height,
        infoBoxRef,
        radarBoxRef,
        onGameEvent,
        onInputData
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
  onGameEvent: (e: types.GameEvent) => void,
  onInputData: (data: ArrayBuffer) => void
) => {
  const ticks: types.TickStateObject[][] = []; // outer array index is tickNumber, inner array index is idOverNetwork
  initializeTicks(ticks);
  initializeAuthoritativeState();
  const time = performance.now();
  previousTimestamp = time;
  loopId = time;
  loop(
    ticks,
    time,
    time,
    camera,
    scene,
    renderer,
    width,
    height,
    infoBoxRef,
    radarBoxRef,
    onGameEvent,
    onInputData
  );
};

export const stopGameLoop = () => {
  loopId = undefined;
};
