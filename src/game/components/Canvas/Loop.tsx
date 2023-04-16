import { memo } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { useSetRecoilState, useRecoilValue } from "recoil";

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
  camera: THREE.Camera,
  gameObject: types.GameObject,
  object3D: THREE.Object3D
) => {
  const c = camera;
  c.position.x = gameObject.object3D?.position.x || 0;
  c.position.y = gameObject.object3D?.position.y || 0;
  c.rotation.z = object3D.rotation.z;
  c.translateY(2);
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
  const forceUp = delta > 1 ? o.controlsUp : delta * o.controlsUp;
  const forceDown = delta > 1 ? o.controlsDown : delta * o.controlsDown;
  const forceLeft = delta > 1 ? o.controlsLeft : delta * o.controlsLeft;
  const forceRight = delta > 1 ? o.controlsRight : delta * o.controlsRight;
  o.speed += forceUp;
  if (o.speed > maxSpeed) o.speed = maxSpeed;
  o.speed -= forceDown;
  if (o.speed < minSpeed) o.speed = minSpeed;
  object3D.rotateZ(o.rotationSpeed * forceLeft);
  object3D.rotateZ(-1 * o.rotationSpeed * forceRight);
  o.controlsUp -= forceUp;
  o.controlsDown -= forceDown;
  o.controlsLeft -= forceLeft;
  o.controlsRight -= forceRight;
  object3D.translateY(o.speed * delta);
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
  h: number,
  w: number,
  object3D: THREE.Object3D,
  camera: THREE.Camera
) => {
  const o = gameObject;
  if (o.infoElement) {
    o.infoElement.textContent = o.username;
    v.copy(object3D.position);
    v.project(camera);
    o.infoElement.style.top = `calc(${h * -v.y + h}px + 5%)`;
    o.infoElement.style.left = `${w * v.x + w}px`;
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

const Loop = ({ three }: { three: types.Three | undefined }) => {
  console.log("--Loop");
  const main = useRecoilValue(atoms.main);
  const setScore = useSetRecoilState(atoms.score);

  const { sendUnordered: sendUnorderedFromClient } =
    networkingHooks.useSendFromClient();
  const { sendUnordered: sendUnorderedFromMain } =
    networkingHooks.useSendFromMain();
  const { size, camera } = useThree();

  const v = new THREE.Vector3();
  const h = size.height / 2;
  const w = size.width / 2;

  let nextSendTime = Date.now();

  let nextScoreTime = Date.now();
  const scoreTimeInteval = 9875;

  useFrame((state, delta) => {
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
          handleInfoElement(o, v, h, w, o.object3D, camera);
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
          handleInfoElement(o, v, h, w, o.object3D, camera);
        }
      }
    }
  });
  return <></>; // eslint-disable-line
};
export default memo(Loop);
