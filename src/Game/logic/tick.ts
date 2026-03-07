import * as THREE from "three";
import * as parameters from "src/parameters";
import * as types from "src/types";
import * as globals from "src/globals";
import { gatherControlsDataBinary } from "../netcode/controls";
import { gameEventHandler } from "./gameLogic";

const tickDuration = 50;

// outer array index is tickNumber
// inner array index is idOverNetwork
const ticks: types.TickStateObject[][] = [];

let latestReceivedState: types.ReceivedState | undefined;

const handleMovement = (o: types.SharedGameObject, object3d: THREE.Mesh) => {
  const p = parameters;

  //
  // 1. INPUT → VELOCITY
  //
  const up = Math.min(o.inputsUp, tickDuration);
  const down = Math.min(o.inputsDown, tickDuration);
  const left = Math.min(o.inputsLeft, tickDuration);
  const right = Math.min(o.inputsRight, tickDuration);
  const d = Math.min(o.inputsD, tickDuration);
  const f = Math.min(o.inputsF, tickDuration);

  o.inputsUp -= up;
  o.inputsDown -= down;
  o.inputsLeft -= left;
  o.inputsRight -= right;
  o.inputsD -= d;
  o.inputsF -= f;

  o.speed += up * p.forceUpToSpeedFactor;
  o.speed -= down * p.forceDownToSpeedFactor;

  o.rotationSpeed += left * p.forceLeftOrRightToRotationFactor;
  o.rotationSpeed -= right * p.forceLeftOrRightToRotationFactor;

  o.verticalSpeed -= d * p.forceAscOrDescToVerticalSpeedFactor;
  o.verticalSpeed += f * p.forceAscOrDescToVerticalSpeedFactor;

  //
  // 2. CLAMP VELOCITIES
  //
  o.speed = Math.min(Math.max(o.speed, p.minSpeed), p.maxSpeed);
  o.rotationSpeed = Math.min(
    Math.max(o.rotationSpeed, -p.maxRotationSpeedAbsolute),
    p.maxRotationSpeedAbsolute
  );
  o.verticalSpeed = Math.min(
    Math.max(o.verticalSpeed, -p.maxVerticalSpeedAbsolute),
    p.maxVerticalSpeedAbsolute
  );

  //
  // 3. APPLY DAMPING (time‑based exponential)
  //
  if (!left && !right) {
    const decay = Math.exp(-p.rotationDecay * tickDuration);
    o.rotationSpeed *= decay;
    if (Math.abs(o.rotationSpeed) < 0.00001) o.rotationSpeed = 0;
  }

  if (!d && !f) {
    const decay = Math.exp(-p.verticalDecay * tickDuration);
    o.verticalSpeed *= decay;
    if (Math.abs(o.verticalSpeed) < 0.00001) o.verticalSpeed = 0;
  }

  //
  // 4. INTEGRATE VELOCITIES → TRANSFORM
  //
  o.previousPosition = [
    object3d.position.x.toFixed(0),
    object3d.position.y.toFixed(0),
    o.positionZ,
  ];
  o.previousRotation = object3d.rotation.z;
  object3d.rotateZ(o.rotationSpeed * p.rotationFactor * tickDuration);
  object3d.translateY(o.speed * p.speedFactor * tickDuration);
  o.positionZ += o.verticalSpeed * p.verticalSpeedFactor * tickDuration;
};

const handleControlsData = (
  o: types.SharedGameObject,
  sendControlsData: (data: ArrayBuffer) => void,
  tickNumber: number
) => {
  const controlsData = gatherControlsDataBinary(o, tickNumber);
  if (controlsData) {
    sendControlsData(controlsData);
  }
};

export const initializeTicks = () => {
  ticks.length = 0;
  for (let i = 0; i < parameters.stateMaxSequenceNumber + 1; i++) {
    ticks[i] = [];
    for (let ii = 0; i < parameters.maxRemoteObjects; i++) {
      ticks[i][ii] = {
        id: "",
        idOverNetwork: ii,
        health: 255,
        type: types.GameObjectType.Fighter,
        x: 0,
        y: 0,
        score: 0,
        speed: 0,
        inputsUp: 0,
        inputsDown: 0,
        inputsLeft: 0,
        inputsRight: 0,
        inputsSpace: 0,
        inputsF: 0,
        inputsD: 0,
        inputsE: 0,
        rotationSpeed: 0,
        verticalSpeed: 0,
        backendX: 0,
        backendY: 0,
        backendRotationZ: 0,
        keyDowns: [],
        shotDelay: 0,
        positionZ: 0,
        backendPositionZ: 0,
        previousPosition: ["0", "0", 0],
        previousRotation: 0,
        fuel: 0,
        bulletCount: 0,
        eventsEncoded: 0,
        bullets: [],
      };
    }
  }
};

// const ticksAreDifferent = (receivedState: types.ReceivedState) => {
//   const localTick = ticks[receivedState.tick];

//   for (let i = 0; i < parameters.maxRemoteObjects; i++) {
//     const r = receivedState.state[i];
//     const l = localTick[i];
//     if (r.exists) {
//       // if (r.ctrlsD !== l.controlsOverChannelsD)
//     }
//   }
// };

const getBit = (value: number, bitPosition: number) =>
  !!((value >> bitPosition) & 1);

const eventDifferenceDepthFor: number[] = [];

const rollbackSimulate = (
  receivedState: types.ReceivedState,
  seq: number,
  eventDepth: number, // 1 | 2 | 3 | 4
  handleGameEvent: (e: types.GameEvent) => void
) => {
  const tick = ticks[seq];
  for (let i = 0; i < parameters.maxRemoteObjects; i++) {
    if (eventDifferenceDepthFor[i] >= eventDepth) {
      const o = tick[i];
      const r = receivedState.state[i];
      const ordnance1 = getBit(r.eventsEncoded, eventDepth - 1);
      const ordnance2 = getBit(r.eventsEncoded, eventDepth - 1 + 4);
      ordnance1 && handleGameEvent({ type: types.EventType.Shot, data: o });
      ordnance2 && handleGameEvent({ type: types.EventType.Shot2, data: o });
    }
  }
};

const handleEventsRollback = (
  tick: types.TickStateObject[],
  receivedState: types.ReceivedState,
  pTick: types.TickStateObject[],
  ppTick: types.TickStateObject[],
  pppTick: types.TickStateObject[],
  ppppTick: types.TickStateObject[],
  handleGameEvent: (e: types.GameEvent) => void
) => {
  for (let i = 0; i < parameters.maxRemoteObjects; i++) {
    const o = tick[i];
    const r = receivedState.state[i];
    if (r.eventsEncoded !== o.eventsEncoded) {
      const o1Ordnance1 = getBit(o.eventsEncoded, 0);
      const o2Ordnance1 = getBit(o.eventsEncoded, 1);
      const o3Ordnance1 = getBit(o.eventsEncoded, 2);
      const o4Ordnance1 = getBit(o.eventsEncoded, 3);
      const o1Ordnance2 = getBit(o.eventsEncoded, 4);
      const o2Ordnance2 = getBit(o.eventsEncoded, 5);
      const o3Ordnance2 = getBit(o.eventsEncoded, 6);
      const o4Ordnance2 = getBit(o.eventsEncoded, 7);
      const r1Ordnance1 = getBit(r.eventsEncoded, 0);
      const r2Ordnance1 = getBit(r.eventsEncoded, 1);
      const r3Ordnance1 = getBit(r.eventsEncoded, 2);
      const r4Ordnance1 = getBit(r.eventsEncoded, 3);
      const r1Ordnance2 = getBit(r.eventsEncoded, 4);
      const r2Ordnance2 = getBit(r.eventsEncoded, 5);
      const r3Ordnance2 = getBit(r.eventsEncoded, 6);
      const r4Ordnance2 = getBit(r.eventsEncoded, 7);

      o4Ordnance1 !== r4Ordnance1 &&
        handleGameEvent({ type: types.EventType.Shot, data: ppppTick[i] });
      o4Ordnance2 !== r4Ordnance2 &&
        handleGameEvent({ type: types.EventType.Shot2, data: ppppTick[i] });

      o3Ordnance1 !== r3Ordnance1 &&
        handleGameEvent({ type: types.EventType.Shot, data: pppTick[i] });
      o3Ordnance2 !== r3Ordnance2 &&
        handleGameEvent({ type: types.EventType.Shot2, data: pppTick[i] });

      o2Ordnance1 !== r2Ordnance1 &&
        handleGameEvent({ type: types.EventType.Shot, data: ppTick[i] });
      o2Ordnance2 !== r2Ordnance2 &&
        handleGameEvent({ type: types.EventType.Shot2, data: ppTick[i] });

      o1Ordnance1 !== r1Ordnance1 &&
        handleGameEvent({ type: types.EventType.Shot, data: pTick[i] });
      o1Ordnance2 !== r1Ordnance2 &&
        handleGameEvent({ type: types.EventType.Shot2, data: pTick[i] });

      o.eventsEncoded = r.eventsEncoded;
    }
  }
};

const getPrevSeq = (seq: number) => {
  return (seq - 1) & 0xff;
};

function seq8Subtract(a: number, b: number) {
  return (a - b + 256) & 0xff;
}

const doPossibleRollback = (handleGameEvent: (e: types.GameEvent) => void) => {
  if (latestReceivedState) {
    const seq = latestReceivedState.tick;
    const pSeq = getPrevSeq(seq);
    const ppSeq = getPrevSeq(pSeq);
    const pppSeq = getPrevSeq(ppSeq);
    const ppppSeq = getPrevSeq(pppSeq);
    const tick = ticks[seq];
    const pTick = ticks[pSeq];
    const ppTick = ticks[ppSeq];
    const pppTick = ticks[pppSeq];
    const ppppTick = ticks[ppppSeq];
    handleEventsRollback(
      tick,
      latestReceivedState,
      pTick,
      ppTick,
      pppTick,
      ppppTick,
      handleGameEvent
    );
    for (let i = highest; highest > 0; i--) {
      rollbackSimulate(
        latestReceivedState,
        seq8Subtract(latestReceivedState.tick, i),
        i,
        handleGameEvent
      );
    }
  }
};

export const handleTick = (
  tickNumber: number,
  handleGameEvent: (e: types.GameEvent) => void,
  sendControlsData: (data: ArrayBuffer) => void
) => {
  doPossibleRollback(handleGameEvent);
  for (let i = globals.sharedObjects.length - 1; i > -1; i--) {
    const o = globals.sharedObjects[i];
    if (o && o.object3d) {
      if (o.object3d.visible) {
        if (o.isMe) {
          handleControlsData(o, sendControlsData, tickNumber);
        }
        handleMovement(o, o.object3d);
      }
      const oo = ticks[tickNumber][o.idOverNetwork];
      oo.id = o.id;
      oo.idOverNetwork = o.idOverNetwork;
      oo.health = o.health;
      oo.type = o.type;
      oo.x = o.object3d.position.x;
      oo.y = o.object3d.position.y;
      oo.score = o.score;
      oo.speed = o.speed;
      oo.inputsUp = o.inputsUp;
      oo.inputsDown = o.inputsDown;
      oo.inputsLeft = o.inputsLeft;
      oo.inputsRight = o.inputsRight;
      oo.inputsSpace = o.inputsSpace;
      oo.inputsF = o.inputsF;
      oo.inputsD = o.inputsD;
      oo.inputsE = o.inputsE;
      oo.rotationSpeed = o.rotationSpeed;
      oo.verticalSpeed = o.verticalSpeed;
      oo.backendX = o.backendPosition.x;
      oo.backendY = o.backendPosition.y;
      oo.backendRotationZ = o.backendRotationZ;
      oo.keyDowns = [...o.keyDowns];
      oo.shotDelay = o.shotDelay;
      oo.positionZ = o.positionZ;
      oo.backendPositionZ = o.backendPositionZ;
      oo.previousPosition[0] = o.previousPosition[0];
      oo.previousPosition[1] = o.previousPosition[1];
      oo.previousPosition[2] = o.previousPosition[2];
      oo.previousRotation = o.previousRotation;
      oo.fuel = o.fuel;
      oo.bulletCount = o.bullets;
    }
  }
};

export function isSeqHigher(oldSeq: number, newSeq: number): boolean {
  // Normalize to 0–255
  const A = oldSeq & 0xff;
  const B = newSeq & 0xff;

  // Compute forward distance in modulo-256 space
  const diff = (B - A) & 0xff;

  // If diff is 1..127, B is newer; if 128..255, A is newer or equal
  return diff !== 0 && diff < 128;
}

export const handleReceiveAuthoritativeState = (
  receivedState: types.ReceivedState
) => {
  const isHigher = latestReceivedState
    ? isSeqHigher(latestReceivedState.tick, receivedState.tick)
    : true;
  if (isHigher) {
    latestReceivedState = receivedState;
  }
};
