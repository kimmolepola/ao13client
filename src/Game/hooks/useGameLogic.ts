import { useEffect, useCallback } from "react";
import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";
import * as types from "src/types";
import * as hooks from ".";
import * as globals from "src/globals";
import * as parameters from "src/parameters";

export const useGameLogic = (scene: THREE.Scene) => {
  hooks.useLoader(scene);
  const { load, remove } = hooks.useLocalLoader(scene);

  useEffect(() => {
    load(types.GameObjectType.BACKGROUND);
  }, [load]);

  const gameEventHandler = useCallback(
    async (gameEvent: types.GameEvent) => {
      switch (gameEvent.type) {
        case types.EventType.HEALTH_ZERO: {
          const id = uuidv4();
          const speed = 0;
          const type = types.GameObjectType.EXPLOSION;
          const object3d = await load(types.GameObjectType.EXPLOSION);
          const timeToLive = 30000;
          const collisions = {};
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
            collisions,
          });
          break;
        }
        case types.EventType.REMOVE_LOCAL_OBJECT_INDEXES: {
          gameEvent.data.forEach((x) => remove(x));
          break;
        }
        case types.EventType.SHOT: {
          const id = uuidv4();
          const speed = gameEvent.data.speed + parameters.bulletSpeed;
          const type = types.GameObjectType
            .BULLET as types.GameObjectType.BULLET;
          const object3d = await load(types.GameObjectType.BULLET);
          const dimensions = new THREE.Vector3();
          const timeToLive = 1500;
          const collisions = {};
          object3d?.geometry.computeBoundingBox();
          object3d?.geometry.boundingBox?.getSize(dimensions);
          object3d?.position.copy(gameEvent.data.object3d.position);
          object3d?.quaternion.copy(gameEvent.data.object3d.quaternion);
          object3d?.translateY(5000);
          globals.localObjects.push({
            id,
            type,
            speed,
            object3d,
            dimensions,
            timeToLive,
            collisions,
          });
          break;
        }
        default:
          break;
      }
    },
    [load, remove]
  );

  return { gameEventHandler };
};
