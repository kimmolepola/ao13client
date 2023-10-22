import { useEffect, useCallback } from "react";
import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";
import * as types from "src/types";
import * as hooks from ".";
import * as globals from "src/globals";

export const useGameLogic = (scene: THREE.Scene) => {
  hooks.useLoader(scene);
  const { load, remove } = hooks.useLocalLoader(scene);

  useEffect(() => {
    load(types.Mesh.BACKGROUND);
  }, [load]);

  const gameEventHandler = useCallback(
    async (gameEvent: types.GameEvent) => {
      switch (gameEvent.type) {
        case types.Event.REMOVE_LOCAL_OBJECT_INDEXES: {
          gameEvent.data.forEach((x) => remove(x));
          break;
        }
        case types.Event.SHOT: {
          const id = uuidv4();
          const speed = gameEvent.data.speed + 2.5;
          const type = types.GameObjectType
            .BULLET as types.GameObjectType.BULLET;
          const object3d = await load(types.Mesh.BULLET);
          const dimensions = new THREE.Vector3();
          const timeToLive = 1500;
          const collisions = {};
          object3d?.geometry.computeBoundingBox();
          object3d?.geometry.boundingBox?.getSize(dimensions);
          object3d?.position.copy(gameEvent.data.object3d.position);
          object3d?.quaternion.copy(gameEvent.data.object3d.quaternion);
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
