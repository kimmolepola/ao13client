import { RefObject } from "react";
import * as THREE from "three";

import * as types from "src/types";
import * as utils from "src/utils";
import * as parameters from "src/parameters";
import * as globals from "src/globals";
import * as debug from "../../debug/debug";
import * as gameLogic from "../gameLogic";

import { gatherControlsDataBinary } from "../../netcode/controls";

const positionAlpha = parameters.objectPositionInterpolationAlpha;
const rotationAlpha = parameters.objectRotationInterpolationAlpha;
const cameraPositionAlpha = parameters.cameraPositionInterpolationAlpha;
const cameraRotationAlpha = parameters.cameraRotationInterpolationAlpha;

const cameraTarget = new THREE.Vector3(0, 0, parameters.cameraDefaultZ);

let deltaCumulative = 0;
const localObjectsRemoveIndexes: number[] = [];

const normalizeAngle = (a: number) => {
  a %= Math.PI * 2;
  if (a <= -Math.PI) a += Math.PI * 2;
  else if (a > Math.PI) a -= Math.PI * 2;
  return a;
};

const previousCameraPosition = new THREE.Vector3();
let previousCameraRotation = NaN;
const handleCamera = (
  camPosAlpha: number,
  camRotAlpha: number,
  camera: THREE.Camera,
  o: types.SharedGameObject,
  object3d: THREE.Mesh
) => {
  previousCameraPosition.copy(camera.position);
  previousCameraRotation = camera.rotation.z;

  debug.handleDebugGui(camera);
  if (!debug.debugOn.value) {
    cameraTarget.x = object3d.position.x;
    cameraTarget.y = object3d.position.y;
    camera.position.lerp(cameraTarget, camPosAlpha);

    const current = normalizeAngle(camera.rotation.z);
    const target = normalizeAngle(object3d.rotation.z);
    const diff = normalizeAngle(target - current);

    camera.rotation.z = current + diff * camRotAlpha;
    // camera.translateX(1);
    // camera.translateY(1);
  }
};

const handleRadarBoxItem = (
  o: types.SharedGameObject,
  object3d: THREE.Mesh,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>
) => {
  if (
    o.previousPosition[0] === object3d.position.x.toFixed(0) &&
    o.previousPosition[1] === object3d.position.y.toFixed(0)
  ) {
    return;
  }
  const radarItemStyle = radarBoxRef.current?.[o.id]?.current?.style;
  const objectPosition = object3d?.position;
  if (radarItemStyle && objectPosition) {
    radarItemStyle.transform = `translate3d(${
      objectPosition.x * globals.dimensions.worldToRadarPositionRatio +
      globals.dimensions.radarBoxHalfWidth
    }px, ${
      -objectPosition.y * globals.dimensions.worldToRadarPositionRatio +
      globals.dimensions.radarBoxHalfWidth
    }px, 0)`;
  }
};

const handleInfoBox = (
  o: types.SharedGameObject,
  object3d: THREE.Mesh,
  infoBoxRef: RefObject<HTMLDivElement>
) => {
  if (infoBoxRef.current) {
    const degree = Math.round(utils.radiansToDegrees(-object3d.rotation.z));
    const heading = degree < 0 ? degree + 360 : degree;
    infoBoxRef.current.textContent = `
    x: ${object3d.position.x.toFixed()} ${(object3d.position.x * 20).toFixed()}
    y: ${object3d.position.y.toFixed()} ${(object3d.position.y * 20).toFixed()}
    z: ${o.positionZ.toFixed(0)}
    heading: ${heading}
    speed: ${o.speed.toFixed(1)}
    health: ${o.health.toFixed(0)}
    fuel: ${o.fuel.toFixed(2)}
    ammo: ${o.bullets}
    ${
      debug.debugOn.value
        ? `
      bytes: ${debug.statistics.bytes}
      objects: ${debug.statistics.objects}
      perObjMean: ${Math.ceil(
        debug.statistics.bytes / debug.statistics.objects
      )}
      outOfSequence: ${debug.statistics.outOfSequence}
      `
        : ""
    }
    `;
  }
};

const handleLocalObject = (
  delta: number,
  gameObject: types.LocalGameObject,
  object3d: THREE.Mesh
) => {
  const o = gameObject;
  object3d.translateY(o.speed * parameters.speedFactor * delta);
  o.speed *= parameters.bulletSpeedReductionFactor;
  o.timeToLive -= delta;
  return o.timeToLive < 0;
};

const handleMovement = (
  delta: number,
  o: types.SharedGameObject,
  object3d: THREE.Mesh
) => {
  const p = parameters;

  //
  // 1. INPUT → VELOCITY
  //
  const up = Math.min(o.controlsUp, delta);
  const down = Math.min(o.controlsDown, delta);
  const left = Math.min(o.controlsLeft, delta);
  const right = Math.min(o.controlsRight, delta);
  const d = Math.min(o.controlsD, delta);
  const f = Math.min(o.controlsF, delta);

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
    const decay = Math.exp(-p.rotationDecay * delta);
    o.rotationSpeed *= decay;
    if (Math.abs(o.rotationSpeed) < 0.00001) o.rotationSpeed = 0;
  }

  if (!d && !f) {
    const decay = Math.exp(-p.verticalDecay * delta);
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
  object3d.rotateZ(o.rotationSpeed * p.rotationFactor * delta);
  object3d.translateY(o.speed * p.speedFactor * delta);
  o.positionZ += o.verticalSpeed * p.verticalSpeedFactor * delta;
};

// const down = new THREE.Vector3(0, -1, 0);
const dataBlockPosition = new THREE.Vector3();
const handleDataBlock = (
  o: types.SharedGameObject,
  object3d: THREE.Mesh,
  camera: THREE.Camera,
  width: number,
  height: number
) => {
  const position = object3d.position;
  if (
    camera.position.x === previousCameraPosition.x &&
    camera.position.y === previousCameraPosition.y &&
    camera.position.z === previousCameraPosition.z &&
    camera.rotation.z === previousCameraRotation &&
    o.previousPosition[0] === position.x.toFixed(0) &&
    o.previousPosition[1] === position.y.toFixed(0) &&
    o.previousRotation === object3d.rotation.z
  ) {
    return;
  }

  const container = o.infoElement.containerRef?.current;
  const row1 = o.infoElement.row1Ref?.current;
  const row2 = o.infoElement.row2Ref?.current;

  if (container && row1 && row2) {
    // down.set(0, -1, 0);
    // down.applyQuaternion(camera.quaternion); // rotate into world space
    // const offsetPosition = position
    //   .clone()
    //   .setZ(object3d.position.z + o.halfHeight)
    //   .add(down.multiplyScalar(o.radius * 1.5));
    // offsetPosition.project(camera);
    dataBlockPosition.copy(position);
    dataBlockPosition.project(camera);

    const halfWidth = container.clientWidth * 0.5;
    const x = (dataBlockPosition.x + 1) * 0.5 * width - halfWidth;
    const y = (1 - dataBlockPosition.y) * 0.5 * height;
    const username = o.username;
    const healthText = o.health.toFixed(0);
    container.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (row1.textContent !== username) row1.textContent = username;
    if (row2.textContent !== healthText) row2.textContent = healthText;
  }
};

const interpolatePositionAndRotaion = (
  posAlpha: number,
  rotAlpha: number,
  o: types.SharedGameObject,
  object3d: THREE.Mesh
) => {
  // position interpolation
  object3d.position.lerp(o.backendPosition, posAlpha);
  o.positionZ += (o.backendPositionZ - o.positionZ) * posAlpha;

  // rotation interpolation
  const current = normalizeAngle(object3d.rotation.z);
  const target = normalizeAngle(o.backendRotationZ);
  const diff = normalizeAngle(target - current);
  object3d.rotation.z = current + diff * rotAlpha;
};

const handleLocalObjects = (
  delta: number,
  scene: THREE.Scene,
  gameEventHandler: types.GameEventHandler
) => {
  for (let i = globals.localObjects.length - 1; i > -1; i--) {
    const o = globals.localObjects[i];
    if (o && o.object3d) {
      const remove = handleLocalObject(delta, o, o.object3d);
      remove && localObjectsRemoveIndexes.push(i);
    }
  }
  gameEventHandler(scene, {
    type: types.EventType.RemoveLocalObjectIndexes,
    data: localObjectsRemoveIndexes,
  });
  localObjectsRemoveIndexes.splice(0, localObjectsRemoveIndexes.length);
};

const handleObjects = (
  delta: number,
  camera: THREE.Camera,
  scene: THREE.Scene,
  width: number,
  height: number,
  infoBoxRef: RefObject<HTMLDivElement>,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
  gameEventHandler: types.GameEventHandler,
  sendControlsData: (data: ArrayBuffer) => void
) => {
  deltaCumulative += delta;
  const posAlpha = 1 - Math.exp(-positionAlpha * delta);
  const rotAlpha = 1 - Math.exp(-rotationAlpha * delta);
  const camPosAlpha = 1 - Math.exp(-cameraPositionAlpha * delta);
  const camRotAlpha = 1 - Math.exp(-cameraRotationAlpha * delta);

  for (let i = globals.sharedObjects.length - 1; i > -1; i--) {
    const o = globals.sharedObjects[i];
    if (o && o.object3d) {
      if (o.object3d.visible) {
        gameLogic.checkHealth(scene, o, gameEventHandler);
        if (o.isMe) {
          gameLogic.handleKeys(delta, o);
          handleInfoBox(o, o.object3d, infoBoxRef);
          if (deltaCumulative > parameters.clientSendInterval) {
            const controlsData = gatherControlsDataBinary(o, deltaCumulative);
            deltaCumulative = 0;
            if (controlsData) {
              sendControlsData(controlsData);
            }
          }
        }
        handleMovement(delta, o, o.object3d);
        gameLogic.handleShot(scene, delta, o, gameEventHandler);
      }
      interpolatePositionAndRotaion(posAlpha, rotAlpha, o, o.object3d);
      o.isMe && handleCamera(camPosAlpha, camRotAlpha, camera, o, o.object3d);
      !o.isMe && handleDataBlock(o, o.object3d, camera, width, height);
      handleRadarBoxItem(o, o.object3d, radarBoxRef);
    }
  }
};

export const runFrame = (
  delta: number,
  camera: THREE.Camera,
  scene: THREE.Scene,
  width: number,
  height: number,
  infoBoxRef: RefObject<HTMLDivElement>,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
  gameEventHandler: types.GameEventHandler,
  sendControlsData: (data: ArrayBuffer) => void
) => {
  handleLocalObjects(delta, scene, gameEventHandler);
  handleObjects(
    delta,
    camera,
    scene,
    width,
    height,
    infoBoxRef,
    radarBoxRef,
    gameEventHandler,
    sendControlsData
  );
};
