import { RefObject } from "react";
import * as THREE from "three";

import * as types from "src/types";
import * as utils from "src/utils";
import * as parameters from "src/parameters";
import * as globals from "src/globals";
import * as debug from "../../netcode/debug";
import * as gameLogic from "../gameLogic";

import { gatherControlsDataBinary } from "../../netcode/controls";

const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v3 = new THREE.Vector3();
const m1 = new THREE.Matrix4();

let deltaCumulative = 0;
const localObjectsRemoveIndexes: number[] = [];

const handleCamera = (camera: THREE.Camera, object3d: THREE.Mesh) => {
  camera.position.x = object3d.position.x;
  camera.position.y = object3d.position.y;
  camera.rotation.z = object3d.rotation.z;
};

const handleRadarBoxItem = (
  o: types.RemoteGameObject,
  object3d: THREE.Mesh,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>
) => {
  const radarItemStyle = radarBoxRef.current?.[o.id]?.current?.style;
  const objectPosition = object3d?.position;
  if (radarItemStyle && objectPosition) {
    radarItemStyle.transform = `translate(${
      objectPosition.x / 100000 + 50
    }px, ${-objectPosition.y / 100000 + 50}px)`;
  }
};

const handleInfoBox = (
  o: types.RemoteGameObject,
  object3d: THREE.Mesh,
  infoBoxRef: RefObject<HTMLDivElement>
) => {
  if (infoBoxRef.current) {
    const degree = Math.round(utils.radiansToDegrees(-object3d.rotation.z));
    const heading = degree < 0 ? degree + 360 : degree;
    infoBoxRef.current.textContent = `
    x: ${(object3d.position.x / 100).toFixed(0)}
    y: ${(object3d.position.y / 100).toFixed(0)}
    z: ${o.positionZ.toFixed(0)}
    heading: ${heading}
    speed: ${o.speed.toFixed(1)}
    health: ${o.health.toFixed(0)}
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
  gameObject: types.RemoteGameObject,
  object3d: THREE.Mesh
) => {
  const o = gameObject;
  const forceUp = Math.min(o.controlsUp, delta);
  const forceDown = Math.min(o.controlsDown, delta);
  const forceLeft = Math.min(o.controlsLeft, delta);
  const forceRight = Math.min(o.controlsRight, delta);
  const forceD = Math.min(o.controlsD, delta);
  const forceF = Math.min(o.controlsF, delta);
  const p = parameters;
  o.controlsUp -= forceUp;
  o.controlsDown -= forceDown;
  o.controlsLeft -= forceLeft;
  o.controlsRight -= forceRight;
  o.controlsF -= forceF;
  o.controlsD -= forceD;
  o.speed += forceUp * p.forceUpToSpeedFactor;
  o.speed -= forceDown * p.forceDownToSpeedFactor;
  o.rotationSpeed += forceLeft * p.forceLeftOrRightToRotationFactor;
  o.rotationSpeed -= forceRight * p.forceLeftOrRightToRotationFactor;
  o.verticalSpeed -= forceD * p.forceAscOrDescToVerticalSpeedFactor;
  o.verticalSpeed += forceF * p.forceAscOrDescToVerticalSpeedFactor;
  if (o.speed > p.maxSpeed) {
    o.speed = p.maxSpeed;
  }
  if (o.speed < p.minSpeed) {
    o.speed = p.minSpeed;
  }
  if (o.rotationSpeed > p.maxRotationSpeedAbsolute) {
    o.rotationSpeed = p.maxRotationSpeedAbsolute;
  } else if (o.rotationSpeed < -p.maxRotationSpeedAbsolute) {
    o.rotationSpeed = -p.maxRotationSpeedAbsolute;
  }
  if (o.verticalSpeed > p.maxVerticalSpeedAbsolute) {
    o.verticalSpeed = p.maxVerticalSpeedAbsolute;
  } else if (o.verticalSpeed < -p.maxVerticalSpeedAbsolute) {
    o.verticalSpeed = -p.maxVerticalSpeedAbsolute;
  }
  object3d.rotateZ(o.rotationSpeed * p.rotationFactor * delta);
  object3d.translateY(o.speed * p.speedFactor * delta);
  o.positionZ += o.verticalSpeed * p.verticalSpeedFactor * delta;
  if (!forceLeft && !forceRight) {
    const rs = o.rotationSpeed;
    if (rs !== 0) {
      const decayed = rs * 0.99;
      o.rotationSpeed = Math.abs(decayed) < 0.00001 ? 0 : decayed;
    }
  }
  if (!forceD && !forceF) {
    const vs = o.verticalSpeed;
    if (vs !== 0) {
      const decayed = vs * 0.99;
      o.verticalSpeed = Math.abs(decayed) < 0.00001 ? 0 : decayed;
    }
  }
};

const handleDataBlock = (
  gameObject: types.RemoteGameObject,
  object3d: THREE.Mesh,
  camera: THREE.Camera,
  viewProjection: THREE.Matrix4
) => {
  const o = gameObject;
  if (!o.infoElement || !gameObject.dimensions) return;

  //
  // PREPARE VALUES
  //
  const infoElementPosition = v1.copy(object3d.position);
  const infoElementDirection = v2.set(0, -1, 0);
  const infoElementVector = v3.copy(gameObject.dimensions);

  //
  // ROTATION ANGLES (Z-axis only)
  //
  const objAngle = object3d.rotation.z;
  const camAngle = camera.rotation.z;

  //
  // INVERTED OBJECT ROTATION
  //
  const invObjAngle = -objAngle;

  //
  // STEP 1:
  // infoElementDirection = (cameraRotation - objectRotation) applied to (0, -1, 0)
  //
  const combinedAngle = camAngle + invObjAngle;
  let cosA = Math.cos(combinedAngle);
  let sinA = Math.sin(combinedAngle);

  infoElementDirection.set(
    infoElementDirection.x * cosA - infoElementDirection.y * sinA,
    infoElementDirection.x * sinA + infoElementDirection.y * cosA,
    infoElementDirection.z
  );

  //
  // STEP 2:
  // Multiply dimensions by direction
  //
  infoElementVector.multiply(infoElementDirection);

  //
  // STEP 3:
  // Divide by 2
  //
  infoElementVector.divideScalar(2);

  //
  // STEP 4:
  // Apply object rotation to the vector
  //
  cosA = Math.cos(objAngle);
  sinA = Math.sin(objAngle);

  infoElementVector.set(
    infoElementVector.x * cosA - infoElementVector.y * sinA,
    infoElementVector.x * sinA + infoElementVector.y * cosA,
    infoElementVector.z
  );

  //
  // STEP 5:
  // Add to object position
  //
  infoElementPosition.add(infoElementVector);

  //
  // STEP 6:
  // Project to clip space
  //
  infoElementPosition.applyMatrix4(viewProjection);

  //
  // STEP 7:
  // Update DOM
  //
  const container = o.infoElement.containerRef?.current;
  const row1 = o.infoElement.row1Ref?.current;
  const row2 = o.infoElement.row2Ref?.current;

  if (container && row1 && row2) {
    row1.textContent = gameObject.username;
    row2.textContent = gameObject.health.toFixed(0);

    container.style.transform = `translate(calc(${
      globals.dimensions.canvasHalfWidth * infoElementPosition.x +
      globals.dimensions.canvasHalfWidth
    }px - 50%), ${
      globals.dimensions.canvasHalfHeight * -infoElementPosition.y +
      globals.dimensions.canvasHalfHeight +
      parameters.infoTextOffsetValue
    }px)`;
  }
};

const interpolatePosition = (
  o: types.RemoteGameObject,
  object3d: THREE.Mesh
) => {
  const alpha = parameters.interpolationAlpha;
  object3d.position.lerp(o.backendPosition, alpha);
  o.positionZ = (o.positionZ + o.backendPositionZ) * 0.5;
  // object3d.quaternion.slerp(o.backendQuaternion, parameters.interpolationAlpha);
  const rotationZ = object3d.rotation.z;
  object3d.rotation.z = rotationZ + (o.backendRotationZ - rotationZ) * alpha;
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
  infoBoxRef: RefObject<HTMLDivElement>,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
  gameEventHandler: types.GameEventHandler,
  sendControlsData: (data: ArrayBuffer) => void
) => {
  deltaCumulative += delta;

  camera.updateMatrixWorld();
  (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  const viewProjection = m1.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  );

  for (let i = globals.remoteObjects.length - 1; i > -1; i--) {
    const o = globals.remoteObjects[i];
    if (o && o.object3d) {
      if (o.object3d.visible) {
        gameLogic.checkHealth(scene, o, gameEventHandler);
        if (o.isMe) {
          gameLogic.handleKeys(delta, o);
          handleCamera(camera, o.object3d);
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
        gameLogic.handleShot(scene, delta, o, o.object3d, gameEventHandler);
      }
      interpolatePosition(o, o.object3d);
      handleDataBlock(o, o.object3d, camera, viewProjection);
      handleRadarBoxItem(o, o.object3d, radarBoxRef);
    }
  }
};

export const runFrame = (
  delta: number,
  camera: THREE.Camera,
  scene: THREE.Scene,
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
    infoBoxRef,
    radarBoxRef,
    gameEventHandler,
    sendControlsData
  );
};

// const handleDataBlock = (
//   gameObject: types.RemoteGameObject,
//   object3d: THREE.Mesh,
//   camera: THREE.Camera,
//   viewProjection: THREE.Matrix4
// ) => {
//   const o = gameObject;
//   if (o.infoElement && gameObject.dimensions) {
//     v1.copy(object3d.position);
//     v2.set(0, -1, 0);
//     v3.copy(gameObject.dimensions);
//     q1.copy(object3d.quaternion);
//     q2.copy(object3d.quaternion);
//     q2.invert();
//     q3.copy(camera.quaternion);

//     const infoElementPosition = v1;
//     const infoElementDirection = v2;
//     const gameObjectDimensions = v3;
//     const gameObjectRotation = q1;
//     const gameObjectRotationInverted = q2;
//     const cameraRotation = q3;

//     // let's calculate the position for the info text

//     // we want the text to show below the object by a certain offset
//     // let's first find the distance from the object center to the edge of the object
//     // this needs to be in the opposite direction of where camera is rotated

//     // we need to take into account the rotation of the object and the rotation of the camera
//     // we apply camera rotation and inverse object rotation to a downwards pointing vector

//     // old ->
//     // infoElementDirection.applyQuaternion(gameObjectRotationInverted);
//     // infoElementDirection.applyQuaternion(cameraRotation);
//     // <-
//     // new ->
//     infoElementDirection.applyQuaternion(
//       gameObjectRotationInverted.multiply(cameraRotation)
//     );
//     // <-

//     // we now have the direction where we want to calculate the distance
//     // from the center of the object to the edge of the object
//     // let's multiply the object dimensions with that direction vector
//     gameObjectDimensions.multiply(infoElementDirection);

//     // now we have the width of the object in that direction
//     const infoElementVector = gameObjectDimensions;

//     // let's divide it and have the distance from the center to the edge
//     infoElementVector.divideScalar(2);

//     // now we need to remove the object rotation from the vector
//     // and only regard the camera rotation for it to point to correct direction
//     infoElementVector.applyQuaternion(gameObjectRotation);

//     // let's add this vector to the position of the object
//     infoElementPosition.add(infoElementVector);

//     // now we have it positioned correctly on the bottom edge of the object
//     // when viewing from the direction of the camera
//     // let's project this position from the world space to the screen space
//     // old ->
//     // infoElementPosition.project(camera);
//     // <-
//     // new ->
//     infoElementPosition.applyMatrix4(viewProjection);
//     // <-

//     const container = o.infoElement.containerRef?.current;
//     const row1 = o.infoElement.row1Ref?.current;
//     const row2 = o.infoElement.row2Ref?.current;
//     if (container && row1 && row2) {
//       row1.textContent = gameObject.username;

//       row2.textContent = gameObject.health.toFixed(0);
//       // row2.textContent = gameObject.health.toFixed(0);

//       // let's put the info element on the screen to that position
//       // with some offset to have it slightly below the object

//       // old ->
//       // container.style.left = `${
//       //   globals.dimensions.canvasHalfWidth * infoElementPosition.x +
//       //   globals.dimensions.canvasHalfWidth
//       // }px`;
//       // container.style.top = `${
//       //   globals.dimensions.canvasHalfHeight * -infoElementPosition.y +
//       //   globals.dimensions.canvasHalfHeight +
//       //   parameters.infoTextOffsetValue
//       // }px`;
//       // <-
//       // new ->
//       container.style.transform = `translate(calc(${
//         globals.dimensions.canvasHalfWidth * infoElementPosition.x +
//         globals.dimensions.canvasHalfWidth
//       }px - 50%), ${
//         globals.dimensions.canvasHalfHeight * -infoElementPosition.y +
//         globals.dimensions.canvasHalfHeight +
//         parameters.infoTextOffsetValue
//       }px)`;
//       // <-
//     }
//   }
// };
