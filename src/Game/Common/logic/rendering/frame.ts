import * as THREE from "three";

import * as utils from "src/utils";
import * as parameters from "src/parameters";
import * as types from "src/types";
import * as globals from "src/globals";

export const handleKeys = (delta: number, gameObject: types.GameObject) => {
  const o = gameObject;
  o.keyDowns.forEach((key) => {
    switch (key) {
      case types.Keys.UP:
        o.controlsUp += delta;
        o.controlsOverChannelsUp += delta;
        break;
      case types.Keys.DOWN:
        o.controlsDown += delta;
        o.controlsOverChannelsDown += delta;
        break;
      case types.Keys.LEFT:
        o.controlsLeft += delta;
        o.controlsOverChannelsLeft += delta;
        break;
      case types.Keys.RIGHT:
        o.controlsRight += delta;
        o.controlsOverChannelsRight += delta;
        break;
      default:
        break;
    }
  });
};

export const handleCamera = (
  camera: THREE.PerspectiveCamera,
  gameObject: types.GameObject,
  object3D: THREE.Object3D
) => {
  const c = camera;
  c.position.x = gameObject.object3D?.position.x || 0;
  c.position.y = gameObject.object3D?.position.y || 0;
  c.rotation.z = object3D.rotation.z;
};

export const handleInfoBoxElement = (
  gameObject: types.GameObject,
  object3D: THREE.Object3D
) => {
  const o = gameObject;
  if (o.infoBoxElement) {
    const degree = Math.round(utils.radiansToDegrees(-object3D.rotation.z));
    const heading = degree < 0 ? degree + 360 : degree;
    o.infoBoxElement.textContent = `x: ${object3D.position.x.toFixed(0)}
    y: ${object3D.position.y.toFixed(0)}
    z: ${object3D.position.z.toFixed(0)}
    heading: ${heading}
    speed: ${gameObject.speed.toFixed(1)}`;
  }
};

export const handleMovement = (
  delta: number,
  gameObject: types.GameObject,
  object3D: THREE.Object3D
) => {
  const o = gameObject;
  const forceUp = o.controlsUp > delta ? delta : o.controlsUp;
  const forceDown = o.controlsDown > delta ? delta : o.controlsDown;
  const forceLeft = o.controlsLeft > delta ? delta : o.controlsLeft;
  const forceRight = o.controlsRight > delta ? delta : o.controlsRight;
  o.controlsUp -= forceUp;
  o.controlsDown -= forceDown;
  o.controlsLeft -= forceLeft;
  o.controlsRight -= forceRight;
  o.speed += forceUp * o.acceleration;
  o.speed -= forceDown * o.acceleration;
  if (o.speed > parameters.maxSpeed) o.speed = parameters.maxSpeed;
  if (o.speed < parameters.minSpeed) o.speed = parameters.minSpeed;
  object3D.rotateZ(forceLeft * o.rotationSpeed);
  object3D.rotateZ(-1 * forceRight * o.rotationSpeed);
  object3D.translateY((o.speed * delta) / 100);
};

export const resetControlValues = (gameObject: types.GameObject) => {
  const o = gameObject;
  o.controlsOverChannelsUp = 0;
  o.controlsOverChannelsDown = 0;
  o.controlsOverChannelsLeft = 0;
  o.controlsOverChannelsRight = 0;
};

export const handleInfoElement = (
  gameObject: types.GameObject,
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

    o.infoElement.textContent = gameObject.username;

    // let's put the info element on the screen to that position
    // with some offset to have it slightly below the object
    o.infoElement.style.left = `${
      globals.dimensions.canvasHalfWidth * infoElementPosition.x +
      globals.dimensions.canvasHalfWidth
    }px`;
    o.infoElement.style.top = `${
      globals.dimensions.canvasHalfHeight * -infoElementPosition.y +
      globals.dimensions.canvasHalfHeight +
      parameters.infoTextOffsetValue
    }px`;
  }
};
