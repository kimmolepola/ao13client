import * as THREE from "three";

import * as types from "src/types";
import * as parameters from "src/parameters";
import * as globals from "src/globals";
import { localLoad, localRemove } from "./rendering/loaderLocalObjects";
import * as utils from "src/utils";
import { authoritativeStates } from "./tick";

const bulletTickToLive = parameters.bulletTimeToLive / parameters.tickInterval;

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

function next8bit(n: number): number {
  return (n + 1) & 0xff;
}

const getNextSeq = (seq: number) => {
  return (seq + 1) & 0xff;
};

export const gameEventHandler = async (
  scene: THREE.Scene,
  gameEvent: types.GameEvent
) => {
  switch (gameEvent.type) {
    case types.EventType.HealthZero: {
      const speed = 0;
      const type = types.GameObjectType.Explosion;
      const object3d = await localLoad(scene, types.GameObjectType.Explosion);
      const timeToLive = 30000;

      if (gameEvent.o.object3d) {
        object3d?.position.copy(gameEvent.o.object3d.position);
        gameEvent.o.object3d.visible = false;
      }
      globals.localObjects.push({
        id: "explosion" + gameEvent.o.idOverNetwork + gameEvent.sequenceNumber,
        type,
        speed,
        object3d,
        timeToLive,
        originId: gameEvent.o.idOverNetwork,
        positionZ: gameEvent.o.positionZ,
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
      console.log("--shot");
      const o = gameEvent.tickStateObject;

      const speed = o.speed + parameters.bulletSpeed;
      const type = types.GameObjectType.Bullet as const;
      const object3d = await localLoad(scene, types.GameObjectType.Bullet);
      object3d?.position.set(o.x, o.y, 1);
      object3d?.setRotationFromAxisAngle(utils.AXIS_Z, o.rotationZ);
      object3d?.translateY(1);
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
      const dst = parameters.collisionMaxDistanceLocalObject;
      const seq = gameEvent.sequenceNumber;
      const localTickNumber = gameEvent.localTickNumber;
      console.log("--shot rollback", seq, localTickNumber);

      const originId = gameEvent.originId;
      const ticks = gameEvent.ticks;
      // Use authoritative state for position: ticks only tracks positions for the local player,
      // so remote player entries always have stale/zero values.
      const o = authoritativeStates[seq].state[originId];

      const type = types.GameObjectType.Bullet as const;
      const z = o.z;
      const rotationZ = o.rotationZ;
      let speed = o.speed + parameters.bulletSpeed;
      let tickToLive = bulletTickToLive;

      o3d.position.set(o.x, o.y, 0);
      o3d.setRotationFromAxisAngle(utils.AXIS_Z, rotationZ);
      o3d.translateY(1);

      let curSeq = seq;
      const nextLocalTickNumber = getNextSeq(localTickNumber);
      while (tickToLive > 0 && curSeq !== nextLocalTickNumber) {
        for (let i = 0; i < parameters.maxRemoteObjects; i++) {
          const obj = ticks[curSeq][i];
          if (
            isColliding(
              o3d.position.x,
              o3d.position.y,
              z,
              obj.x,
              obj.y,
              obj.z,
              dst
            )
          ) {
            tickToLive = 0;
            break;
          }
        }
        if (tickToLive) {
          o3d.translateY(speed * parameters.speedFactor * parameters.tickInterval);
          speed *= parameters.bulletSpeedReductionFactor;
          tickToLive--;
          curSeq = next8bit(curSeq);
        }
      }

      // Capture position before awaiting: handleMovement in handleSimulationRollback
      // runs synchronously while this handler is suspended and overwrites o3d.
      const bulletX = o3d.position.x;
      const bulletY = o3d.position.y;

      if (tickToLive) {
        const object3d = await localLoad(scene, types.GameObjectType.Bullet);
        object3d?.position.set(bulletX, bulletY, 0);
        object3d?.setRotationFromAxisAngle(utils.AXIS_Z, rotationZ);
        // console.log("--push");
        globals.localObjects.push({
          type,
          object3d,
          positionZ: z,
          speed,
          timeToLive: tickToLive * parameters.tickInterval,
          originId,
          id: "bullet" + originId + seq,
        });
      }
      break;
    }
    default:
      break;
  }
};
