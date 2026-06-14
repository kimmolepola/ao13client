import * as THREE from "three";

import * as types from "src/types";
import * as parameters from "src/parameters";
import * as globals from "src/globals";
import {
  localLoad,
  localRemove,
  loadBullet,
} from "./rendering/loaderLocalObjects";
import * as utils from "src/utils";
import { authoritativeStates } from "./tick";

const o3d = utils.object3d;

export const isColliding = (
  a_x: number,
  a_y: number,
  a_z: number,
  b_x: number,
  b_y: number,
  b_z: number,
  maxDistance: number
) => {
  const dx = a_x - b_x;
  const dy = a_y - b_y;
  const dz = a_z - b_z;

  const distSq = dx * dx + dy * dy + dz * dz;
  const maxDistSq = maxDistance * maxDistance;

  return distSq < maxDistSq;
};

export const checkHealth = (
  sequenceNumber: number,
  remoteGameObject: types.SharedGameObject,
  handleGameEvent: (e: types.GameEvent) => void
) => {
  if (remoteGameObject.health <= 0) {
    handleGameEvent({
      type: types.EventType.HealthZero,
      o: remoteGameObject,
      sequenceNumber,
    });
  }
};

// export const handleKeys = (
//   delta: number,
//   gameObject: types.SharedGameObject
// ) => {
//   const o = gameObject;
//   for (let i = 0; i < o.keyDowns.length; i++) {
//     const key = o.keyDowns[i];
//     switch (key) {
//       case types.Key.ArrowUp:
//         o.inputsUp += delta;
//         // o.controlsOverChannelsUp += delta;
//         break;
//       case types.Key.ArrowDown:
//         o.inputsDown += delta;
//         // o.controlsOverChannelsDown += delta;
//         break;
//       case types.Key.ArrowLeft:
//         o.inputsLeft += delta;
//         // o.controlsOverChannelsLeft += delta;
//         break;
//       case types.Key.ArrowRight:
//         o.inputsRight += delta;
//         // o.controlsOverChannelsRight += delta;
//         break;
//       case types.Key.Space:
//         o.inputsSpace += delta;
//         // o.controlsOverChannelsSpace += delta;
//         break;
//       case types.Key.KeyD:
//         o.inputsD += delta;
//         // o.controlsOverChannelsD += delta;
//         break;
//       case types.Key.KeyF:
//         o.inputsF += delta;
//         // o.controlsOverChannelsF += delta;
//         break;
//       case types.Key.KeyE:
//         o.inputsE += delta;
//         // o.controlsOverChannelsE += delta;
//         break;

//       default:
//         break;
//     }
//   }
// };

// export const handleShot = (
//   sequenceNumber: number,
//   delta: number,
//   gameObject: types.SharedGameObject,
//   handleGameEvent: (e: types.GameEvent) => void
// ) => {
//   const o = gameObject;
//   if (o.inputsSpace) {
//     const timeQuantity = o.inputsSpace > delta ? delta : o.inputsSpace;
//     o.inputsSpace -= timeQuantity;

//     //shooting
//     if (o.shotDelay - timeQuantity <= 0) {
//       // shoot
//       o.shotDelay += parameters.shotDelay;
//       handleGameEvent({
//         type: types.EventType.Shot,
//         o: gameObject,
//         sequenceNumber,
//       });
//     }
//   }
//   o.shotDelay -= Math.min(delta, o.shotDelay);
// };

export const gameEventHandler = async (
  scene: THREE.Scene,
  gameEvent: types.GameEvent
) => {
  switch (gameEvent.type) {
    case types.EventType.HealthZero: {
      const pos = gameEvent.o.object3d?.position.clone();
      const positionZ = gameEvent.o.positionZ;
      const object3d = await localLoad(scene, types.GameObjectType.Explosion);
      if (object3d && pos) {
        object3d.position.copy(pos);
      }
      globals.localObjects.push({
        id: "explosion" + gameEvent.o.idOverNetwork + gameEvent.sequenceNumber,
        type: types.GameObjectType.Explosion,
        speed: 0,
        object3d,
        timeToLive: 30000,
        originId: gameEvent.o.idOverNetwork,
        positionZ,
      });
      break;
    }
    case types.EventType.RemoveLocalObjectIndexes: {
      for (let i = gameEvent.data.length - 1; i >= 0; i--) {
        localRemove(scene, gameEvent.data[i]);
      }
      break;
    }
    case types.EventType.Shot: {
      const o = gameEvent.tickStateObject;

      const speed = o.speed + parameters.bulletSpeed;
      const type = types.GameObjectType.Bullet as const;
      const object3d = loadBullet(scene);
      object3d.position.set(o.x, o.y, 1);
      object3d.setRotationFromAxisAngle(utils.AXIS_Z, o.rotationZ);
      object3d.translateY(0.25);
      const originId = o.idOverNetwork;
      globals.localObjects.push({
        type,
        object3d,
        positionZ: o.z,
        speed,
        timeToLive: parameters.bulletTimeToLive,
        originId,
        id: "bullet" + originId + gameEvent.sequenceNumber,
      });
      break;
    }
    case types.EventType.ShotRollback: {
      const seq = gameEvent.sequenceNumber;
      const originId = gameEvent.originId;
      const bulletId = "bullet" + originId + seq;
      if (globals.localObjects.some((o) => o.id === bulletId)) break;
      const o = authoritativeStates[seq].state[originId];

      const type = types.GameObjectType.Bullet as const;
      const rotationZ = o.rotationZ;
      const speed = o.speed + parameters.bulletSpeed;

      o3d.position.set(o.x, o.y, 0);
      o3d.setRotationFromAxisAngle(utils.AXIS_Z, rotationZ);
      o3d.translateY(0.25);
      const bulletX = o3d.position.x;
      const bulletY = o3d.position.y;

      const object3d = loadBullet(scene);
      object3d.position.set(bulletX, bulletY, 0);
      object3d.setRotationFromAxisAngle(utils.AXIS_Z, rotationZ);
      globals.localObjects.push({
        type,
        object3d,
        positionZ: o.z,
        speed,
        timeToLive: parameters.bulletTimeToLive,
        originId,
        id: "bullet" + originId + seq,
      });
      break;
    }
    default:
      break;
  }
};
