import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";

import * as types from "src/types";
import * as parameters from "src/parameters";
import * as globals from "src/globals";
import { localLoad, localRemove } from "./rendering/localLoader";

export const checkHealth = (
  scene: THREE.Scene,
  remoteGameObject: types.RemoteGameObject,
  gameEventHandler: types.GameEventHandler
) => {
  if (remoteGameObject.health <= 0) {
    gameEventHandler(scene, {
      type: types.EventType.HealthZero,
      data: remoteGameObject,
    });
  }
};

export const handleKeys = (
  delta: number,
  gameObject: types.RemoteGameObject
) => {
  const o = gameObject;
  for (let i = 0; i < o.keyDowns.length; i++) {
    const key = o.keyDowns[i];
    switch (key) {
      case types.Keys.Up:
        o.controlsUp += delta;
        o.controlsOverChannelsUp += delta;
        break;
      case types.Keys.Down:
        o.controlsDown += delta;
        o.controlsOverChannelsDown += delta;
        break;
      case types.Keys.Left:
        o.controlsLeft += delta;
        o.controlsOverChannelsLeft += delta;
        break;
      case types.Keys.Right:
        o.controlsRight += delta;
        o.controlsOverChannelsRight += delta;
        break;
      case types.Keys.Space:
        o.controlsSpace += delta;
        o.controlsOverChannelsSpace += delta;
        break;
      case types.Keys.D:
        o.controlsD += delta;
        o.controlsOverChannelsD += delta;
        break;
      case types.Keys.F:
        o.controlsF += delta;
        o.controlsOverChannelsF += delta;
        break;
      default:
        break;
    }
  }
};

export const handleShot = (
  scene: THREE.Scene,
  delta: number,
  gameObject: types.RemoteGameObject,
  object3d: THREE.Mesh,
  gameEventHandler: types.GameEventHandler
) => {
  const o = gameObject;
  if (o.controlsSpace) {
    const timeQuantity = o.controlsSpace > delta ? delta : o.controlsSpace;
    o.controlsSpace -= timeQuantity;

    //shooting
    if (o.shotDelay - timeQuantity <= 0) {
      // shoot
      o.shotDelay += parameters.shotDelay;
      gameEventHandler(scene, {
        type: types.EventType.Shot,
        data: { object3d, speed: o.speed },
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
      const type = types.GameObjectType.EXPLOSION;
      const object3d = await localLoad(scene, types.GameObjectType.EXPLOSION);
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
      const id = uuidv4();
      const speed = gameEvent.data.speed + parameters.bulletSpeed;
      const type = types.GameObjectType.BULLET as types.GameObjectType.BULLET;
      const object3d = await localLoad(scene, types.GameObjectType.BULLET);
      const dimensions = new THREE.Vector3();
      const timeToLive = 1500;
      object3d?.geometry.computeBoundingBox();
      object3d?.geometry.boundingBox?.getSize(dimensions);
      object3d?.position.copy(gameEvent.data.object3d.position);
      // object3d?.quaternion.copy(gameEvent.data.object3d.quaternion);
      object3d?.rotation.copy(gameEvent.data.object3d.rotation);
      object3d?.translateY(5000);
      globals.localObjects.push({
        id,
        type,
        speed,
        object3d,
        dimensions,
        timeToLive,
      });
      break;
    }
    default:
      break;
  }
};
