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
  v: THREE.Vector3,
  object3D: THREE.Object3D,
  camera: THREE.PerspectiveCamera
) => {
  const o = gameObject;
  const offset =
    // maintain same (scaled) offset to object
    // regardless of canvas or window size change
    (screen.height / parameters.infoTextOffsetValue) *
    ((Math.max(
      globals.dimensions.canvasHalfWidth,
      globals.dimensions.canvasHalfHeight
    ) *
      2) /
      screen.width);
  if (o.infoElement) {
    //    o.infoElement.textContent = o.username;
    o.infoElement.textContent = "" + screen.height;
    v.copy(object3D.position);
    v.project(camera);

    o.infoElement.style.left = `${
      globals.dimensions.canvasHalfWidth * v.x +
      globals.dimensions.canvasHalfWidth
    }px`;
    o.infoElement.style.top = `${
      globals.dimensions.canvasHalfHeight * -v.y +
      globals.dimensions.canvasHalfHeight +
      offset
    }px`;
  }
};
