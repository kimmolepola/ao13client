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
    o.previous2DecimalTruncatedPositionX === (x | 0) &&
    o.previous2DecimalTruncatedPositionY === (y | 0)
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

export const handleInfoBox = (
  o: types.SharedGameObject,
  object3d: THREE.Mesh,
  infoBoxRef: RefObject<HTMLDivElement>
) => {
  if (infoBoxRef.current) {
    const degree = Math.round(utils.radiansToDegrees(-object3d.rotation.z));
    const heading = degree < 0 ? degree + 360 : degree;
    infoBoxRef.current.textContent = `
    x: ${(object3d.position.x * 0.02).toFixed(1)} km
    y: ${(object3d.position.y * 0.02).toFixed(1)} km
    alt: ${(o.positionZ * 65.617) | 0} ft
    heading: ${heading}°
    speed: ${(o.speed * 0.539957).toFixed(1)} kts
    health: ${o.health | 0}%
    fuel: ${(o.fuel * 2.20462) | 0} lbs
    ammo: ${o.bulletCount} rds
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
  const frameScale = delta / (1000 / 60);
  const left = globals.keys.ArrowLeft ? frameScale : 0;
  const right = globals.keys.ArrowRight ? frameScale : 0;

  const dt = delta / 1000;
  const throttle = globals.keys.ArrowUp ? types.inputFull : 0;
  const brake = globals.keys.ArrowDown ? types.inputFull : 0;
  const hasFuel = o.fuel > 0;
  const thrustFactor =
    p.thrustMinFactor +
    (1 - p.thrustMinFactor) * Math.min(o.speed / p.thrustRampSpeed, 1);
  const thrust = hasFuel ? throttle * p.thrustForce * thrustFactor : 0;
  const drag = hasFuel ? 0 : p.dragCoefficient * o.speed * o.speed;
  o.speed += (thrust - drag - brake * p.brakeForce) * dt;

  const leftBrake = left > 0 && o.rotationSpeed < 0 ? 4 : 1;
  const rightBrake = right > 0 && o.rotationSpeed > 0 ? 4 : 1;
  o.rotationSpeed += left * p.forceLeftOrRightToRotationFactor * leftBrake;
  o.rotationSpeed -= right * p.forceLeftOrRightToRotationFactor * rightBrake;

  // Vertical speed: piecewise by speed (knots)
  const kts = o.speed / 1.852;
  if (kts < p.glideSlopeMinSpeedKts) {
    o.verticalSpeed = p.glideSlopeVerticalSpeed - (p.glideSlopeMinSpeedKts - kts) * p.lowSpeedDescentFactor;
  } else if (kts < p.glideSlopeMaxSpeedKts) {
    o.verticalSpeed = p.glideSlopeVerticalSpeed;
  } else if (kts < p.neutralMaxSpeedKts) {
    o.verticalSpeed = 0;
  } else {
    o.verticalSpeed = (kts - p.neutralMaxSpeedKts) * p.ascentFactor;
  }

  //
  // 2. CLAMP VELOCITIES
  //
  const effectiveMinSpeed = o.positionZ > 0 ? p.minAirborneSpeedKmh : p.minSpeed;
  o.speed = Math.min(Math.max(o.speed, effectiveMinSpeed), p.maxSpeed);
  o.rotationSpeed = Math.min(
    Math.max(o.rotationSpeed, -p.maxRotationSpeedAbsolute),
    p.maxRotationSpeedAbsolute
  );

  //
  // 3. APPLY DAMPING (time‑based exponential)
  //
  if (!left && !right) {
    const decay = p.rotationDecay ** (delta / (1000 / 60));
    o.rotationSpeed *= decay;
    if (Math.abs(o.rotationSpeed) < 0.00001) o.rotationSpeed = 0;
  }

  //
  // 4. INTEGRATE VELOCITIES → TRANSFORM
  //
  o.previous2DecimalTruncatedPositionX =
    ((object3d.position.x * 100) | 0) / 100;
  o.previous2DecimalTruncatedPositionY =
    ((object3d.position.y * 100) | 0) / 100;
  o.previous2DecimalTruncatedPositionZ = ((o.positionZ * 100) | 0) / 100;
  o.previous3DecimalTruncatedRotationZ =
    ((object3d.rotation.z * 1000) | 0) / 1000;

  object3d.rotateZ(o.rotationSpeed * p.rotationFactor * delta);
  object3d.translateY(o.speed * p.speedFactor * delta);
  o.positionZ += o.verticalSpeed * p.verticalSpeedFactor * delta;
  if (o.positionZ > p.maxAltitude) o.positionZ = p.maxAltitude;
  if (o.positionZ < 0) o.positionZ = 0;
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
    o.previous2DecimalTruncatedPositionX === ((position.x * 100) | 0) / 100 &&
    o.previous2DecimalTruncatedPositionY === ((position.y * 100) | 0) / 100 &&
    o.previous3DecimalTruncatedRotationZ ===
      ((object3d.rotation.z * 1000) | 0) / 1000
  ) {
    return;
  }

  const container = o.infoElement.containerRef?.current;
  const row1 = o.infoElement.row1Ref?.current;
  const row2 = o.infoElement.row2Ref?.current;
  const row3 = o.infoElement.row3Ref?.current;

  if (container && row1 && row2 && row3) {
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
    const healthVal = o.health | 0;
    const healthBar = healthVal < 100
      ? `<div style="width:calc(${healthVal}% - 6px);height:4px;background:rgba(255,255,255,0.8);margin:0 3px"></div>`
      : "";
    const altFt = Math.floor(o.positionZ * 65.617 / 100) * 100;
    const altText = altFt < 3000 ? `alt ${altFt}` : "";
    container.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (row1.textContent !== username) row1.textContent = username;
    if (row2.innerHTML !== healthBar) row2.innerHTML = healthBar;
    if (row3.textContent !== altText) row3.textContent = altText;
    const row2Padding = healthBar && !altText ? "2px" : "";
    if (row2.style.paddingBottom !== row2Padding) row2.style.paddingBottom = row2Padding;
  }
};

const handleLocalObject = (
  delta: number,
  gameObject: types.LocalGameObject,
  object3d: THREE.Mesh
) => {
  const o = gameObject;
  object3d.translateY(o.speed * parameters.speedFactor * delta);
  o.speed *=
    parameters.bulletSpeedReductionFactor ** (delta / parameters.tickInterval);
  o.timeToLive -= delta;
  return o.timeToLive < 0;
};

const handleLocalObjects = (
  delta: number,
  onGameEvent: (e: types.GameEvent) => void
) => {
  for (let i = 0; i < globals.localObjects.length; i++) {
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
};

const getPrevSeq = (seq: number) => {
  return (seq - 1) & 0xff;
};

const interpolateRemoteObjectPositionAndRotation = (
  o: types.SharedGameObject,
  alpha: number,
  state: types.AuthoritativeState[],
  prevState: types.AuthoritativeState[]
) => {
  const a = state[o.idOverNetwork];
  const pa = prevState[o.idOverNetwork];
  const o3d = o.object3d;
  if (o3d) {
    o3d.position.x = pa.x + (a.x - pa.x) * alpha;
    o3d.position.y = pa.y + (a.y - pa.y) * alpha;
    o3d.rotation.z =
      pa.rotationZ + normalizeAngle(a.rotationZ - pa.rotationZ) * alpha;
    o.positionZ = pa.z + (a.z - pa.z) * alpha;
  }
};

let nextInfoUpdate = Date.now();

function subtractSeq8(a: number, b: number) {
  return (a - b) & 0xff;
}

const handleSharedObjects = (
  isTickFrame: boolean,
  delta: number,
  accumulator: number,
  tickNumber: number,
  offset: number,
  camera: THREE.Camera,
  width: number,
  height: number,
  infoBoxRef: RefObject<HTMLDivElement>,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
  debugContentRef: RefObject<HTMLDivElement>,
  onGameEvent: (e: types.GameEvent) => void
) => {
  const serverTickNumber = subtractSeq8(tickNumber, offset);
  // const serverTickNumber = getPrevSeq(getPrevSeq(getPrevSeq(tickNumber)));
  const authState = authoritativeStates[serverTickNumber];
  const prevAuthState = authoritativeStates[getPrevSeq(serverTickNumber)];
  const alpha = accumulator / parameters.tickInterval;

  if (debug.debugOn.value && debugContentRef.current) {
    debugContentRef.current.textContent =
      "offset: " +
      (tickNumber - serverTickNumber) +
      ", server rotationZ: " +
      authState.state[0].rotationZ.toFixed(2) +
      ", local rotationZ: " +
      globals.sharedObjects[0]?.object3d?.rotation.z.toFixed(2) +
      ", x: " +
      (globals.sharedObjects[0]?.object3d?.position.x.toFixed(2) || 0) +
      ", y: " +
      (globals.sharedObjects[0]?.object3d?.position.y.toFixed(2) || 0);
  }

  const isPortrait = window.matchMedia("(orientation: portrait)").matches;
  if (!prevAuthState.isStale && !authState.isStale) {
    for (let i = 0; i < parameters.maxRemoteObjects; i++) {
      const o = globals.sharedObjects[i];
      if (o) {
        const object3d = o.object3d;
        if (object3d) {
          if (!authState.state[i].exists) {
            if (object3d.visible && prevAuthState.state[i].exists) {
              object3d.visible = false;
            }
          } else {
            if (!object3d.visible) object3d.visible = true;
            if (i === globals.state.ownRemoteObjectIndex) {
              const deltaOrAccumulator = isTickFrame ? accumulator : delta;
              handleLocalPlayerMovement(deltaOrAccumulator, o, object3d);
              if (nextInfoUpdate < Date.now()) {
                nextInfoUpdate = Date.now() + 1000;
                handleInfoBox(o, object3d, infoBoxRef);
                handleRadarBoxItem(o, object3d, radarBoxRef);
              }
              handleCamera(delta, camera, object3d);
              if (!isPortrait) {
                handleDataBlock(o, object3d, camera, width, height);
              }
            } else {
              interpolateRemoteObjectPositionAndRotation(
                o,
                alpha,
                authState.state,
                prevAuthState.state
              );
              o.health = authState.state[i].health;
              handleDataBlock(o, object3d, camera, width, height);
            }
          }
        }
      }
    }
  }
};

export const handleFrame = (
  isTickFrame: boolean,
  delta: number,
  accumulator: number,
  tickNumber: number,
  offset: number,
  camera: THREE.Camera,
  width: number,
  height: number,
  infoBoxRef: RefObject<HTMLDivElement>,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
  debugContentRef: RefObject<HTMLDivElement>,
  onGameEvent: (e: types.GameEvent) => void
) => {
  handleSharedObjects(
    isTickFrame,
    delta,
    accumulator,
    tickNumber,
    offset,
    camera,
    width,
    height,
    infoBoxRef,
    radarBoxRef,
    debugContentRef,
    onGameEvent
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
