import { RefObject } from "react";
import * as THREE from "three";

import * as types from "src/types";
import * as utils from "src/utils";
import * as parameters from "src/parameters";
import * as globals from "src/globals";

export const handleCamera = (
  camera: THREE.PerspectiveCamera,
  gameObject: types.RemoteGameObject,
  object3D: THREE.Object3D
) => {
  const c = camera;
  c.position.x = gameObject.object3d?.position.x || 0;
  c.position.y = gameObject.object3d?.position.y || 0;
  c.rotation.z = object3D.rotation.z;
};

export const handleRadarBox = (
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>
) => {
  if (radarBoxRef.current) {
    globals.remoteObjects.forEach((x) => {
      const radarItemStyle = radarBoxRef.current?.[x.id]?.current?.style;
      const objectPosition = x.object3d?.position;
      if (radarItemStyle && objectPosition) {
        radarItemStyle.left = `${objectPosition.x / 20 + 50}px`;
        radarItemStyle.bottom = `${objectPosition.y / 20 + 50}px`;
        if (x.isMe && radarItemStyle.backgroundColor !== "orange") {
          radarItemStyle.backgroundColor = "orange";
        } else if (!x.isMe && radarItemStyle.zIndex !== "2") {
          radarItemStyle.zIndex = "2";
        }
      }
    });
  }
};

export const handleInfoBox = (
  o: types.RemoteGameObject,
  infoBoxRef: RefObject<HTMLDivElement>
) => {
  if (infoBoxRef.current && o.object3d) {
    const degree = Math.round(utils.radiansToDegrees(-o.object3d.rotation.z));
    const heading = degree < 0 ? degree + 360 : degree;
    infoBoxRef.current.textContent = `x: ${o.object3d.position.x.toFixed(0)}
    y: ${o.object3d.position.y.toFixed(0)}
    z: ${o.positionZ.toFixed(0)}
    heading: ${heading}
    speed: ${o.speed.toFixed(1)}
    health: ${o.health.toFixed(0)}`;
  }
};

export const handleLocalObject = (
  delta: number,
  gameObject: types.LocalGameObject,
  object3D: THREE.Object3D
) => {
  const o = gameObject;
  object3D.translateY(o.speed * parameters.speedFactor * delta);
  o.speed *= parameters.bulletSpeedReductionFactor;
  o.timeToLive -= delta;
  return o.timeToLive < 0;
};

export const handleMovement = (
  delta: number,
  gameObject: types.RemoteGameObject
) => {
  const o = gameObject;
  const forceUp = o.controlsUp > delta ? delta : o.controlsUp;
  const forceDown = o.controlsDown > delta ? delta : o.controlsDown;
  const forceLeft = o.controlsLeft > delta ? delta : o.controlsLeft;
  const forceRight = o.controlsRight > delta ? delta : o.controlsRight;
  const forceD = o.controlsD > delta ? delta : o.controlsD;
  const forceF = o.controlsF > delta ? delta : o.controlsF;
  o.controlsUp -= forceUp;
  o.controlsDown -= forceDown;
  o.controlsLeft -= forceLeft;
  o.controlsRight -= forceRight;
  o.controlsF -= forceF;
  o.controlsD -= forceD;
  o.speed += forceUp * parameters.forceUpToSpeedFactor;
  o.speed -= forceDown * parameters.forceDownToSpeedFactor;
  o.rotationSpeed += forceLeft * parameters.forceLeftOrRightToRotationFactor;
  o.rotationSpeed -= forceRight * parameters.forceLeftOrRightToRotationFactor;
  o.verticalSpeed -= forceD * parameters.forceAscOrDescToVerticalSpeedFactor;
  o.verticalSpeed += forceF * parameters.forceAscOrDescToVerticalSpeedFactor;
  if (o.speed > parameters.maxSpeed) {
    o.speed = parameters.maxSpeed;
  }
  if (o.speed < parameters.minSpeed) {
    o.speed = parameters.minSpeed;
  }
  if (o.rotationSpeed > parameters.maxRotationSpeedAbsolute) {
    o.rotationSpeed = parameters.maxRotationSpeedAbsolute;
  } else if (o.rotationSpeed < -parameters.maxRotationSpeedAbsolute) {
    o.rotationSpeed = -parameters.maxRotationSpeedAbsolute;
  }
  if (o.verticalSpeed > parameters.maxVerticalSpeedAbsolute) {
    o.verticalSpeed = parameters.maxVerticalSpeedAbsolute;
  } else if (o.verticalSpeed < -parameters.maxVerticalSpeedAbsolute) {
    o.verticalSpeed = -parameters.maxVerticalSpeedAbsolute;
  }
  o.object3d?.rotateZ(o.rotationSpeed * parameters.rotationFactor * delta);
  o.object3d?.translateY(o.speed * parameters.speedFactor * delta);
  o.positionZ += o.verticalSpeed * parameters.verticalSpeedFactor * delta;
  if (!forceLeft && !forceRight && o.rotationSpeed) {
    if (Math.abs(o.rotationSpeed) < 0.00001) {
      o.rotationSpeed = 0;
    }
    o.rotationSpeed *= 0.99;
  }
  if (!forceD && !forceF && o.verticalSpeed) {
    if (Math.abs(o.verticalSpeed) < 0.00001) {
      o.verticalSpeed = 0;
    }
    o.verticalSpeed *= 0.99;
  }
};

export const handleDataBlock = (
  gameObject: types.RemoteGameObject,
  v1: THREE.Vector3,
  v2: THREE.Vector3,
  v3: THREE.Vector3,
  q1: THREE.Quaternion,
  q2: THREE.Quaternion,
  q3: THREE.Quaternion,
  object3D: THREE.Object3D,
  camera: THREE.PerspectiveCamera
) => {
  const o = gameObject;
  if (o.infoElement && gameObject.dimensions) {
    v1.copy(object3D.position);
    v2.set(0, -1, 0);
    v3.copy(gameObject.dimensions);
    q1.copy((object3D as THREE.Mesh).quaternion);
    q2.copy((object3D as THREE.Mesh).quaternion);
    q2.invert();
    q3.copy(camera.quaternion);

    const infoElementPosition = v1;
    const infoElementDirection = v2;
    const gameObjectDimensions = v3;
    const gameObjectRotation = q1;
    const gameObjectRotationInverted = q2;
    const cameraRotation = q3;

    // let's calculate the position for the info text

    // we want the text to show below the object by a certain offset
    // let's first find the distance from the object center to the edge of the object
    // this needs to be in the opposite direction of where camera is rotated

    // we need to take into account the rotation of the object and the rotation of the camera
    // we apply camera rotation and inverse object rotation to a downwards pointing vector
    infoElementDirection.applyQuaternion(gameObjectRotationInverted);
    infoElementDirection.applyQuaternion(cameraRotation);

    // we now have the direction where we want to calculate the distance
    // from the center of the object to the edge of the object
    // let's multiply the object dimensions with that direction vector
    gameObjectDimensions.multiply(infoElementDirection);

    // now we have the width of the object in that direction
    const infoElementVector = gameObjectDimensions;

    // let's divide it and have the distance from the center to the edge
    infoElementVector.divideScalar(2);

    // now we need to remove the object rotation from the vector
    // and only regard the camera rotation for it to point to correct direction
    infoElementVector.applyQuaternion(gameObjectRotation);

    // let's add this vector to the position of the object
    infoElementPosition.add(infoElementVector);

    // now we have it positioned correctly on the bottom edge of the object
    // when viewing from the direction of the camera
    // let's project this position from the world space to the screen space
    infoElementPosition.project(camera);

    const container = o.infoElement.containerRef?.current;
    const row1 = o.infoElement.row1Ref?.current;
    const row2 = o.infoElement.row2Ref?.current;
    if (container && row1 && row2) {
      row1.textContent = gameObject.username;

      row2.textContent = gameObject.health.toFixed(0);
      // row2.textContent = gameObject.health.toFixed(0);

      // let's put the info element on the screen to that position
      // with some offset to have it slightly below the object
      container.style.left = `${
        globals.dimensions.canvasHalfWidth * infoElementPosition.x +
        globals.dimensions.canvasHalfWidth
      }px`;
      container.style.top = `${
        globals.dimensions.canvasHalfHeight * -infoElementPosition.y +
        globals.dimensions.canvasHalfHeight +
        parameters.infoTextOffsetValue
      }px`;
    }
  }
};

export const interpolatePosition = (o: types.RemoteGameObject) => {
  o.object3d?.position.lerp(o.backendPosition, parameters.interpolationAlpha);
  o.object3d?.quaternion.slerp(
    o.backendQuaternion,
    parameters.interpolationAlpha
  );
  o.positionZ -= (o.positionZ - o.backendPositionZ) / 2;
};
