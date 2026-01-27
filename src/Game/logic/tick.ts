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
    }
  }
};
