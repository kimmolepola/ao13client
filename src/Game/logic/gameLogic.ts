import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";

import * as types from "src/types";
import * as parameters from "src/parameters";
import * as globals from "src/globals";
import { localLoad, localRemove } from "./rendering/loaderLocalObjects";

export const checkHealth = (
  remoteGameObject: types.SharedGameObject,
  handleGameEvent: (e: types.GameEvent) => void
) => {
  if (remoteGameObject.health <= 0) {
    handleGameEvent({
      type: types.EventType.HealthZero,
      data: remoteGameObject,
    });
  }
};

export const handleKeys = (
  delta: number,
  gameObject: types.SharedGameObject
) => {
  const o = gameObject;
  for (let i = 0; i < o.keyDowns.length; i++) {
    const key = o.keyDowns[i];
    switch (key) {
      case types.Keys.Up:
        o.inputsUp += delta;
        o.controlsOverChannelsUp += delta;
        break;
      case types.Keys.Down:
        o.inputsDown += delta;
        o.controlsOverChannelsDown += delta;
        break;
      case types.Keys.Left:
        o.inputsLeft += delta;
        o.controlsOverChannelsLeft += delta;
        break;
      case types.Keys.Right:
        o.inputsRight += delta;
        o.controlsOverChannelsRight += delta;
        break;
      case types.Keys.Space:
        o.inputsSpace += delta;
        o.controlsOverChannelsSpace += delta;
        break;
      case types.Keys.D:
        o.inputsD += delta;
        o.controlsOverChannelsD += delta;
        break;
      case types.Keys.F:
        o.inputsF += delta;
        o.controlsOverChannelsF += delta;
        break;
      case types.Keys.E:
        o.inputsE += delta;
        o.controlsOverChannelsE += delta;
        break;

      default:
        break;
    }
  }
};

export const handleShot = (
  delta: number,
  gameObject: types.SharedGameObject,
  handleGameEvent: (e: types.GameEvent) => void
) => {
  const o = gameObject;
  if (o.inputsSpace) {
    const timeQuantity = o.inputsSpace > delta ? delta : o.inputsSpace;
    o.inputsSpace -= timeQuantity;

    //shooting
    if (o.shotDelay - timeQuantity <= 0) {
      // shoot
      o.shotDelay += parameters.shotDelay;
      handleGameEvent({
        type: types.EventType.Shot,
        data: gameObject,
      });
    }
  }
  o.shotDelay -= Math.min(delta, o.shotDelay);
};

export const gameEventHandler = async (
  scene: THREE.Scene,
  gameEvent: types.GameEvent
) => {
  switch (gameEvent.type) {
    case types.EventType.HealthZero: {
      const id = uuidv4();
      const speed = 0;
      const type = types.GameObjectType.Explosion;
      const object3d = await localLoad(scene, types.GameObjectType.Explosion);
      const timeToLive = 30000;

      if (gameEvent.data.object3d) {
        object3d?.position.copy(gameEvent.data.object3d.position);
        gameEvent.data.object3d.visible = false;
      }
      globals.localObjects.push({
        id,
        type,
        speed,
        object3d,
        timeToLive,
      });
      break;
    }
    case types.EventType.RemoveLocalObjectIndexes: {
      gameEvent.data.forEach((x) => localRemove(scene, x));
      break;
    }
    case types.EventType.Shot: {
      const o = gameEvent.data;
      if (o.bulletCount >= 1 && o.object3d) {
        const id = uuidv4();
        const speed = o.speed + parameters.bulletSpeed;
        const type = types.GameObjectType.Bullet as types.GameObjectType.Bullet;
        const object3d = await localLoad(scene, types.GameObjectType.Bullet);
        const timeToLive = 1500;
        object3d?.geometry.computeBoundingBox();
        object3d?.position.copy(o.object3d.position);
        // object3d?.quaternion.copy(gameEvent.data.object3d.quaternion);
        object3d?.rotation.copy(o.object3d.rotation);
        object3d?.translateY(0.5);
        globals.localObjects.push({
          id,
          type,
          speed,
          object3d,
          timeToLive,
        });
      }
      break;
    }
    default:
      break;
  }
};
