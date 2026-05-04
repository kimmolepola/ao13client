import { RefObject } from "react";
import * as THREE from "three";
import * as types from "src/types";
import { handleKeys, handleFrame } from "./rendering/frame";
import {
  tickState,
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
let tickInterval = parameters.tickInterval;
const targetOffsetTicks = 6;

const seqOffset = (newer: number, older: number) => {
  return (newer - older) & 0xff;
};

const isNewerSeqNum = (a: number, b: number) => {
  return ((a - b) & 0xff) < 128;
};

const getNextSeq = (seq: number) => {
  return (seq + 1) & 0xff;
};

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
  debugContentRef: RefObject<HTMLDivElement>,
  onGameEvent: (e: types.GameEvent) => void,
  onInputData: (data: ArrayBuffer) => void
) => {
  const delta = timestamp - previousTimestamp;
  accumulator += delta;
  const isTickFrame = accumulator >= tickInterval;

  handleKeys(delta);
  const latestAuth = tickState.latestAuthTickNumber;

  while (accumulator >= tickInterval) {
    accumulator -= tickInterval;
    if (isNewerSeqNum(tickBuffer[0], latestAuth)) {
      const offset = seqOffset(tickBuffer[0], latestAuth);
      const differenceToTarget = offset - targetOffsetTicks;
      tickInterval = parameters.tickInterval + differenceToTarget;
      handleTick(ticks, tickBuffer[0], offset, onGameEvent, onInputData);
      tickBuffer[0]++;
    } else {
      // unexpected de-sync
      const ns = getNextSeq;
      tickBuffer[0] = ns(ns(ns(ns(ns(ns(latestAuth))))));
    }
  }

  const offset = seqOffset(tickBuffer[0], latestAuth);
  handleFrame(
    isTickFrame,
    delta,
    accumulator,
    tickBuffer[0],
    offset,
    camera,
    width,
    height,
    infoBoxRef,
    radarBoxRef,
    debugContentRef,
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
        debugContentRef,
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
  debugContentRef: RefObject<HTMLDivElement>,
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
    debugContentRef,
    onGameEvent,
    onInputData
  );
};

export const stopGameLoop = () => {
  loopId && cancelAnimationFrame(loopId);
  loopId = undefined;
};
