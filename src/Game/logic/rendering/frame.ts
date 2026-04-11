import { RefObject } from "react";
import * as THREE from "three";

import * as types from "src/types";
import * as utils from "src/utils";
import * as parameters from "src/parameters";
import * as globals from "src/globals";
import * as debug from "../../debug/debug";
import { authoritativeStates } from "../tick";

const cameraPositionAlpha = parameters.cameraPositionInterpolationAlpha;
const cameraRotationAlpha = parameters.cameraRotationInterpolationAlpha;
const cameraTarget = new THREE.Vector3(0, 0, parameters.cameraDefaultZ);
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
  delta: number,
  camera: THREE.Camera,
  object3d: THREE.Mesh
) => {
  const camPosAlpha = 1 - Math.exp(-cameraPositionAlpha * delta);
  const camRotAlpha = 1 - Math.exp(-cameraRotationAlpha * delta);

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
  const x = object3d.position.x;
  const y = object3d.position.y;
  if (
    o.previousTruncatedPositionX === (x | 0) &&
    o.previousTruncatedPositionY === (y | 0)
  ) {
    return;
  }
  const wrr = globals.dimensions.worldToRadarPositionRatio;
  const rhw = globals.dimensions.radarBoxHalfWidth;
  const style = radarBoxRef.current?.[o.id]?.current?.style;
  if (style) {
    style.transform = `translate3d(${x * wrr + rhw}px, ${-y * wrr + rhw}px, 0)`;
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
    x: ${object3d.position.x | 0} ${(object3d.position.x * 20) | 0}
    y: ${object3d.position.y | 0} ${(object3d.position.y * 20) | 0}
    z: ${o.positionZ | 0}
    heading: ${heading}
    speed: ${o.speed.toFixed(1)}
    health: ${o.health | 0}
    fuel: ${o.fuel.toFixed(2)}
    ammo: ${o.bulletCount}
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

const handleLocalPlayerMovement = (
  delta: number,
  o: types.SharedGameObject,
  object3d: THREE.Object3D
) => {
  const p = parameters;

  //
  // 1. INPUT → VELOCITY
  //
  // const up = Math.min(o.inputsUp, delta);
  // const down = Math.min(o.inputsDown, delta);
  // const left = Math.min(o.inputsLeft, delta);
  // const right = Math.min(o.inputsRight, delta);
  // const d = Math.min(o.inputsD, delta);
  // const f = Math.min(o.inputsF, delta);

  // o.inputsUp -= up;
  // o.inputsDown -= down;
  // o.inputsLeft -= left;
  // o.inputsRight -= right;
  // o.inputsD -= d;
  // o.inputsF -= f;

  const up = globals.keys.ArrowUp ? delta : 0;
  const down = globals.keys.ArrowDown ? delta : 0;
  const left = globals.keys.ArrowLeft ? delta : 0;
  const right = globals.keys.ArrowRight ? delta : 0;
  const d = globals.keys.KeyD ? delta : 0;
  const f = globals.keys.KeyF ? delta : 0;

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
  o.previousTruncatedPositionX = object3d.position.x | 0;
  o.previousTruncatedPositionY = object3d.position.y | 0;
  o.previousTruncatedPositionZ = o.positionZ | 0;
  o.previous2DecimalTruncatedRotationZ =
    ((object3d.rotation.z * 100) | 0) / 100;

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
    o.previousTruncatedPositionX === (position.x | 0) &&
    o.previousTruncatedPositionY === (position.y | 0) &&
    o.previous2DecimalTruncatedRotationZ ===
      ((object3d.rotation.z * 100) | 0) / 100
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

const handleLocalObjects = (
  delta: number,
  onGameEvent: (e: types.GameEvent) => void
) => {
  for (let i = globals.localObjects.length - 1; i > -1; i--) {
    const o = globals.localObjects[i];
    if (o && o.object3d) {
      const remove = handleLocalObject(delta, o, o.object3d);
      remove && localObjectsRemoveIndexes.push(i);
    }
  }
  onGameEvent({
    type: types.EventType.RemoveLocalObjectIndexes,
    data: localObjectsRemoveIndexes,
  });
  localObjectsRemoveIndexes.splice(0, localObjectsRemoveIndexes.length);
};

const Key = types.Key;
const keys = globals.keys;
const curTickKeyValues = globals.curTickKeyValues;

const handleKey = (key: types.Key, delta: number) => {
  if (keys[key]) {
    curTickKeyValues[key] += delta;
  }
};

export const handleKeys = (delta: number) => {
  handleKey(Key.ArrowUp, delta);
  handleKey(Key.ArrowDown, delta);
  handleKey(Key.ArrowLeft, delta);
  handleKey(Key.ArrowRight, delta);
  handleKey(Key.Space, delta);
  handleKey(Key.KeyD, delta);
  handleKey(Key.KeyF, delta);
  handleKey(Key.KeyE, delta);
};

const getPrevSeq = (seq: number) => {
  return (seq - 1) & 0xff;
};

const interpolateRemoteObjectPositionAndRotation = (
  idOverNetwork: number,
  alpha: number,
  state: types.AuthoritativeState[],
  prevState: types.AuthoritativeState[]
) => {
  const o = globals.sharedObjects[idOverNetwork];
  const a = state[idOverNetwork];
  const pa = prevState[idOverNetwork];
  const o3d = o.object3d;
  if (o3d) {
    o3d.position.x = pa.x + (a.x - pa.x) * alpha;
    o3d.position.y = pa.y + (a.y - pa.y) * alpha;
    o3d.rotation.z = pa.rotationZ + (a.rotationZ - pa.rotationZ) * alpha;
    o.positionZ = pa.z + (a.z - pa.z) * alpha;
  }
};

let nextInfoUpdate = Date.now();

const handleSharedObjects = (
  isTickFrame: boolean,
  delta: number,
  accumulator: number,
  tickNumber: number,
  camera: THREE.Camera,
  width: number,
  height: number,
  infoBoxRef: RefObject<HTMLDivElement>,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>
) => {
  const serverTickNumber = getPrevSeq(getPrevSeq(getPrevSeq(tickNumber)));
  const authState = authoritativeStates[serverTickNumber];
  const prevAuthState = authoritativeStates[getPrevSeq(serverTickNumber)];
  const alpha = accumulator / parameters.tickInterval;

  if (!prevAuthState.isStale && !authState.isStale) {
    for (let i = 0; i < parameters.maxRemoteObjects; i++) {
      const o = globals.sharedObjects[i];
      const object3d = o?.object3d;
      if (!object3d) {
        continue; // eslint-disable-line
      }
      if (i === globals.state.ownRemoteObjectIndex) {
        const deltaOrAccumulator = isTickFrame ? accumulator : delta;
        handleLocalPlayerMovement(deltaOrAccumulator, o, object3d);
        if (nextInfoUpdate > Date.now()) {
          nextInfoUpdate = Date.now() + 1000;
          handleInfoBox(o, object3d, infoBoxRef);
          handleRadarBoxItem(o, object3d, radarBoxRef);
          handleCamera(delta, camera, object3d);
        }
      } else {
        interpolateRemoteObjectPositionAndRotation(
          i,
          alpha,
          authState.state,
          prevAuthState.state
        );
      }
      handleDataBlock(o, object3d, camera, width, height);
    }
  }
};

export const handleFrame = (
  isTickFrame: boolean,
  delta: number,
  accumulator: number,
  tickNumber: number,
  camera: THREE.Camera,
  width: number,
  height: number,
  infoBoxRef: RefObject<HTMLDivElement>,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
  onGameEvent: (e: types.GameEvent) => void
) => {
  handleSharedObjects(
    isTickFrame,
    delta,
    accumulator,
    tickNumber,
    camera,
    width,
    height,
    infoBoxRef,
    radarBoxRef
  );
  handleLocalObjects(delta, onGameEvent);
};

// const handleObjects = (
//   delta: number,
//   camera: THREE.Camera,
//   scene: THREE.Scene,
//   width: number,
//   height: number,
//   infoBoxRef: RefObject<HTMLDivElement>,
//   radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
//   gameEventHandler: types.GameEventHandler,
//   sendControlsData: (data: ArrayBuffer) => void
// ) => {
//   deltaCumulative += delta;
//   const posAlpha = 1 - Math.exp(-positionAlpha * delta);
//   const rotAlpha = 1 - Math.exp(-rotationAlpha * delta);
//   const camPosAlpha = 1 - Math.exp(-cameraPositionAlpha * delta);
//   const camRotAlpha = 1 - Math.exp(-cameraRotationAlpha * delta);

//   for (let i = globals.sharedObjects.length - 1; i > -1; i--) {
//     const o = globals.sharedObjects[i];
//     if (o && o.object3d) {
//       if (o.object3d.visible) {
//         gameLogic.checkHealth(scene, o, gameEventHandler);
//         if (o.isMe) {
//           gameLogic.handleKeys(delta, o);
//           handleInfoBox(o, o.object3d, infoBoxRef);
//           if (deltaCumulative > parameters.clientSendInterval) {
//             const controlsData = gatherControlsDataBinary(o, deltaCumulative);
//             deltaCumulative = 0;
//             if (controlsData) {
//               sendControlsData(controlsData);
//             }
//           }
//         }
//         handleMovement(delta, o, o.object3d);
//         gameLogic.handleShot(scene, delta, o, gameEventHandler);
//       }
//       interpolatePositionAndRotaion(posAlpha, rotAlpha, o, o.object3d);
//       o.isMe && handleCamera(camPosAlpha, camRotAlpha, camera, o, o.object3d);
//       !o.isMe && handleDataBlock(o, o.object3d, camera, width, height);
//       handleRadarBoxItem(o, o.object3d, radarBoxRef);
//     }
//   }
// // };

// export const deadReckon = (delta: number) => {
//   for (let i = 0; i < parameters.maxRemoteObjects; i++) {
//     const positionObject = globals.positionObjects[i];
//     const sharedObject = globals.sharedObjects[i];
//     const p = positionObject;

//     const up = Math.min(sharedObject.inputsUp, delta);
//     const down = Math.min(sharedObject.inputsDown, delta);
//     const left = Math.min(sharedObject.inputsLeft, delta);
//     const right = Math.min(sharedObject.inputsRight, delta);
//     const d = Math.min(sharedObject.inputsD, delta);
//     const f = Math.min(sharedObject.inputsF, delta);

//     sharedObject.inputsUp -= up;
//     sharedObject.inputsDown -= down;
//     sharedObject.inputsLeft -= left;
//     sharedObject.inputsRight -= right;
//     sharedObject.inputsD -= d;
//     sharedObject.inputsF -= f;

//     p.speed += up * parameters.forceUpToSpeedFactor;
//     p.speed -= down * parameters.forceDownToSpeedFactor;

//     p.rotationSpeed += left * parameters.forceLeftOrRightToRotationFactor;
//     p.rotationSpeed -= right * parameters.forceLeftOrRightToRotationFactor;

//     p.verticalSpeed -= d * parameters.forceAscOrDescToVerticalSpeedFactor;
//     p.verticalSpeed += f * parameters.forceAscOrDescToVerticalSpeedFactor;

//     //
//     // 2. CLAMP VELOCITIES
//     //
//     p.speed = Math.min(
//       Math.max(p.speed, parameters.minSpeed),
//       parameters.maxSpeed
//     );
//     p.rotationSpeed = Math.min(
//       Math.max(p.rotationSpeed, -parameters.maxRotationSpeedAbsolute),
//       parameters.maxRotationSpeedAbsolute
//     );
//     p.verticalSpeed = Math.min(
//       Math.max(p.verticalSpeed, -parameters.maxVerticalSpeedAbsolute),
//       parameters.maxVerticalSpeedAbsolute
//     );

//     //
//     // 3. APPLY DAMPING (time‑based exponential)
//     //
//     if (!left && !right) {
//       const decay = Math.exp(-parameters.rotationDecay * delta);
//       p.rotationSpeed *= decay;
//       if (Math.abs(p.rotationSpeed) < 0.00001) p.rotationSpeed = 0;
//     }

//     if (!d && !f) {
//       const decay = Math.exp(-parameters.verticalDecay * delta);
//       p.verticalSpeed *= decay;
//       if (Math.abs(p.verticalSpeed) < 0.00001) p.verticalSpeed = 0;
//     }
//   }
// };

// export const handleAnimationFrame = (
//   isTickFrame: boolean,
//   delta: number,
//   camera: THREE.Camera,
//   scene: THREE.Scene,
//   width: number,
//   height: number,
//   infoBoxRef: RefObject<HTMLDivElement>,
//   radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
//   handleGameEvent: (e: types.GameEvent) => void
// ) => {
//   handleKeys(delta);
//   handleLocalObjects(isTickFrame, delta, handleGameEvent);
//   handleObjects(
//     isTickFrame,
//     delta,
//     camera,
//     scene,
//     width,
//     height,
//     infoBoxRef,
//     radarBoxRef,
//     handleGameEvent
//   );
// };

// const handleObjects = (
//   isTickFrame: boolean,
//   delta: number,
//   camera: THREE.Camera,
//   scene: THREE.Scene,
//   width: number,
//   height: number,
//   infoBoxRef: RefObject<HTMLDivElement>,
//   radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
//   handleGameEvent: (e: types.GameEvent) => void
// ) => {
//   deltaCumulative += delta;
//   const posAlpha = 1 - Math.exp(-positionAlpha * delta);
//   const rotAlpha = 1 - Math.exp(-rotationAlpha * delta);
//   const camPosAlpha = 1 - Math.exp(-cameraPositionAlpha * delta);
//   const camRotAlpha = 1 - Math.exp(-cameraRotationAlpha * delta);

//   for (let i = globals.sharedObjects.length - 1; i > -1; i--) {
//     const o = globals.sharedObjects[i];
//     if (o && o.object3d) {
//       if (o.object3d.visible) {
//         // gameLogic.checkHealth(o, handleGameEvent);
//         if (o.isMe) {
//           gameLogic.handleKeys(delta, o);
//           handleInfoBox(o, o.object3d, infoBoxRef);
//         }
//         handleLocalPlayerMovement(delta, o, o.object3d);
//         // gameLogic.handleShot(delta, o, handleGameEvent);
//       }
//       interpolatePositionAndRotaion(posAlpha, rotAlpha, o, o.object3d);
//       o.isMe && handleCamera(camPosAlpha, camRotAlpha, camera, o, o.object3d);
//       !o.isMe && handleDataBlock(o, o.object3d, camera, width, height);
//       handleRadarBoxItem(o, o.object3d, radarBoxRef);
//     }
//   }
// };

// const interpolatePositionAndRotaion = (
//   posAlpha: number,
//   rotAlpha: number,
//   o: types.SharedGameObject,
//   object3d: THREE.Mesh
// ) => {
//   // position interpolation
//   object3d.position.lerp(o.backendPosition, posAlpha);
//   o.positionZ += (o.backendPositionZ - o.positionZ) * posAlpha;

//   // rotation interpolation
//   const current = normalizeAngle(object3d.rotation.z);
//   const target = normalizeAngle(o.backendRotationZ);
//   const diff = normalizeAngle(target - current);
//   object3d.rotation.z = current + diff * rotAlpha;
// };

// const positionAlpha = parameters.objectPositionInterpolationAlpha;
// const rotationAlpha = parameters.objectRotationInterpolationAlpha;
// let deltaCumulative = 0;
