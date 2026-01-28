import * as THREE from "three";
import * as parameters from "src/parameters";
import * as types from "src/types";
import * as globals from "src/globals";
import { gatherControlsDataBinary } from "../netcode/controls";

const tickDuration = 50;

const handleMovement = (o: types.SharedGameObject, object3d: THREE.Mesh) => {
  const p = parameters;

  //
  // 1. INPUT → VELOCITY
  //
  const up = Math.min(o.controlsUp, tickDuration);
  const down = Math.min(o.controlsDown, tickDuration);
  const left = Math.min(o.controlsLeft, tickDuration);
  const right = Math.min(o.controlsRight, tickDuration);
  const d = Math.min(o.controlsD, tickDuration);
  const f = Math.min(o.controlsF, tickDuration);

  o.controlsUp -= up;
  o.controlsDown -= down;
  o.controlsLeft -= left;
  o.controlsRight -= right;
  o.controlsD -= d;
  o.controlsF -= f;

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
  sendControlsData: (data: ArrayBuffer) => void
) => {
  const controlsData = gatherControlsDataBinary(o);
  if (controlsData) {
    sendControlsData(controlsData);
  }
};

// outer array index is tickNumber
// inner array index is idOverNetwork
const ticks: types.TickStateObject[][] = [];

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
        controlsUp: 0,
        controlsDown: 0,
        controlsLeft: 0,
        controlsRight: 0,
        controlsSpace: 0,
        controlsF: 0,
        controlsD: 0,
        controlsOverChannelsUp: 0,
        controlsOverChannelsDown: 0,
        controlsOverChannelsLeft: 0,
        controlsOverChannelsRight: 0,
        controlsOverChannelsSpace: 0,
        controlsOverChannelsD: 0,
        controlsOverChannelsF: 0,
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
        bullets: 0,
      };
    }
  }
};

export const handleTick = (
  tickNumber: number,
  sendControlsData: (data: ArrayBuffer) => void
) => {
  for (let i = globals.sharedObjects.length - 1; i > -1; i--) {
    const o = globals.sharedObjects[i];
    if (o && o.object3d) {
      if (o.object3d.visible) {
        if (o.isMe) {
          handleControlsData(o, sendControlsData);
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
      oo.controlsUp = o.controlsUp;
      oo.controlsDown = o.controlsDown;
      oo.controlsLeft = o.controlsLeft;
      oo.controlsRight = o.controlsRight;
      oo.controlsSpace = o.controlsSpace;
      oo.controlsF = o.controlsF;
      oo.controlsD = o.controlsD;
      oo.controlsOverChannelsUp = o.controlsOverChannelsUp;
      oo.controlsOverChannelsDown = o.controlsOverChannelsDown;
      oo.controlsOverChannelsLeft = o.controlsOverChannelsLeft;
      oo.controlsOverChannelsRight = o.controlsOverChannelsRight;
      oo.controlsOverChannelsSpace = o.controlsOverChannelsSpace;
      oo.controlsOverChannelsD = o.controlsOverChannelsD;
      oo.controlsOverChannelsF = o.controlsOverChannelsF;
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
      oo.bullets = o.bullets;
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

let previousAuthoritativeStateTick = 0;
export const handleReceiveAuthoritativeState = (
  receivedState: types.ReceivedState
) => {
  const isHigher = isSeqHigher(
    previousAuthoritativeStateTick,
    receivedState.tick
  );
  if (isHigher) {
    previousAuthoritativeStateTick = receivedState.tick;
  }
};
