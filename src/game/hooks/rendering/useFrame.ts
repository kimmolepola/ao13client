import * as THREE from "three";
import { useSetRecoilState } from "recoil";

import * as networkingHooks from "src/networking/hooks";
import { radiansToDegrees } from "src/utils";
import {
  interpolationAlpha,
  sendIntervalClient,
  sendIntervalMain,
  maxSpeed,
  minSpeed,
} from "src/parameters";
import { objects } from "src/globals";
import * as atoms from "src/atoms";
import * as types from "src/types";
import * as globals from "src/globals";

const handleKeys = (delta: number, gameObject: types.GameObject) => {
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

const handleCamera = (
  camera: THREE.PerspectiveCamera,
  gameObject: types.GameObject,
  object3D: THREE.Object3D
) => {
  const c = camera;
  c.position.x = gameObject.object3D?.position.x || 0;
  c.position.y = gameObject.object3D?.position.y || 0;
  c.rotation.z = object3D.rotation.z;
};

const handleInfoBoxElement = (
  gameObject: types.GameObject,
  object3D: THREE.Object3D
) => {
  const o = gameObject;
  if (o.infoBoxElement) {
    const degree = Math.round(radiansToDegrees(-object3D.rotation.z));
    const heading = degree < 0 ? degree + 360 : degree;
    o.infoBoxElement.textContent = `x: ${object3D.position.x.toFixed(0)}
    y: ${object3D.position.y.toFixed(0)}
    z: ${object3D.position.z.toFixed(0)}
    heading: ${heading}
    speed: ${gameObject.speed.toFixed(1)}`;
  }
};

const handleMovement = (
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
  if (o.speed > maxSpeed) o.speed = maxSpeed;
  if (o.speed < minSpeed) o.speed = minSpeed;
  object3D.rotateZ(forceLeft * o.rotationSpeed);
  object3D.rotateZ(-1 * forceRight * o.rotationSpeed);
  object3D.translateY((o.speed * delta) / 100);
};

const gatherUpdateData = (
  updateData: { [id: string]: types.UpdateObject },
  o: types.GameObject
) => {
  const data = updateData;
  data[o.id] = {
    uScore: o.score,
    uControlsUp: o.controlsOverChannelsUp,
    uControlsDown: o.controlsOverChannelsDown,
    uControlsLeft: o.controlsOverChannelsLeft,
    uControlsRight: o.controlsOverChannelsRight,
    uRotationSpeed: o.rotationSpeed,
    uSpeed: o.speed,
    uPositionX: o.object3D?.position.x || 0,
    uPositionY: o.object3D?.position.y || 0,
    uPositionZ: o.object3D?.position.z || 0,
    uQuaternionX: o.object3D?.quaternion.x || 0,
    uQuaternionY: o.object3D?.quaternion.y || 0,
    uQuaternionZ: o.object3D?.quaternion.z || 0,
    uQuaternionW: o.object3D?.quaternion.w || 0,
  };
};

const resetControlValues = (gameObject: types.GameObject) => {
  const o = gameObject;
  o.controlsOverChannelsUp = 0;
  o.controlsOverChannelsDown = 0;
  o.controlsOverChannelsLeft = 0;
  o.controlsOverChannelsRight = 0;
};

const handleInfoElement = (
  gameObject: types.GameObject,
  v: THREE.Vector3,
  object3D: THREE.Object3D,
  camera: THREE.PerspectiveCamera
) => {
  const o = gameObject;
  const resolutionRelativeAddend =
    ((globals.canvasSize.halfHeight * 2) / 25) *
    (globals.canvasSize.halfWidth / globals.canvasSize.halfHeight);
  if (o.infoElement) {
    o.infoElement.textContent = o.username;
    v.copy(object3D.position);
    v.project(camera);
    o.infoElement.style.left = `${
      globals.canvasSize.halfWidth * v.x + globals.canvasSize.halfWidth
    }px`;
    o.infoElement.style.top = `${
      globals.canvasSize.halfHeight * -v.y +
      globals.canvasSize.halfHeight +
      resolutionRelativeAddend
    }px`;
  }
};

const gatherControlsData = (o: types.GameObject) => ({
  up: o.controlsOverChannelsUp,
  down: o.controlsOverChannelsDown,
  left: o.controlsOverChannelsLeft,
  right: o.controlsOverChannelsRight,
});

const interpolatePosition = (o: types.GameObject, object3D: THREE.Object3D) => {
  object3D.position.lerp(o.backendPosition, interpolationAlpha);
  object3D.quaternion.slerp(o.backendQuaternion, interpolationAlpha);
};

const v = new THREE.Vector3();
let nextSendTime = Date.now();
let nextScoreTime = Date.now();
const scoreTimeInteval = 9875;

export const useFrame = (camera: THREE.PerspectiveCamera, main: boolean) => {
  const setScore = useSetRecoilState(atoms.score);
  const { sendUnordered: sendUnorderedFromClient } =
    networkingHooks.useSendFromClient();
  const { sendUnordered: sendUnorderedFromMain } =
    networkingHooks.useSendFromMain();

  const run = (delta: number) => {
    if (main) {
      // main
      const updateData: { [id: string]: types.UpdateObject } = {};
      for (let i = objects.length - 1; i > -1; i--) {
        const o = objects[i];
        if (o && o.object3D) {
          if (o.isMe) {
            handleKeys(delta, o);
            handleCamera(camera, o, o.object3D);
            handleInfoBoxElement(o, o.object3D);
          }
          handleMovement(delta, o, o.object3D);
          if (Date.now() > nextSendTime) {
            gatherUpdateData(updateData, o);
            resetControlValues(o);
          }
          handleInfoElement(o, v, o.object3D, camera);
          // mock
          if (Date.now() > nextScoreTime) {
            nextScoreTime = Date.now() + scoreTimeInteval;
            o.score += 1;
            setScore(o.score);
          }
        }
      }
      if (Date.now() > nextSendTime) {
        nextSendTime = Date.now() + sendIntervalMain;
        sendUnorderedFromMain({
          timestamp: Date.now(),
          type: types.NetDataType.UPDATE,
          data: updateData,
        });
      }
    } else {
      // client
      for (let i = objects.length - 1; i > -1; i--) {
        const o = objects[i];
        if (o && o.object3D) {
          if (o.isMe) {
            handleKeys(delta, o);
            handleCamera(camera, o, o.object3D);
            handleInfoBoxElement(o, o.object3D);
            if (Date.now() > nextSendTime) {
              nextSendTime = Date.now() + sendIntervalClient;
              sendUnorderedFromClient({
                type: types.NetDataType.CONTROLS,
                data: gatherControlsData(o),
              });
              resetControlValues(o);
            }
          }
          handleMovement(delta, o, o.object3D);
          interpolatePosition(o, o.object3D);
          handleInfoElement(o, v, o.object3D, camera);
        }
      }
    }
  };
  return { run };
};
