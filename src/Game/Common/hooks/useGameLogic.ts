import { useEffect, useCallback } from "react";
import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";
import * as types from "src/types";
import * as hooks from ".";
import * as globals from "src/globals";

export const useGameLogic = (scene: THREE.Scene) => {
  hooks.useLoader(scene);
  const load = hooks.useLocalLoader(scene);

  useEffect(() => {
    load("background");
  }, [load]);

  const gameEventHandler = useCallback(
    async (gameEvent: types.GameEvent) => {
      switch (gameEvent.type) {
        case types.Event.SHOT: {
          const id = uuidv4();
          const speed = gameEvent.data.speed;
          const object3d = await load("bullet");
          const dimensions = new THREE.Vector3();
          object3d?.geometry.computeBoundingBox();
          object3d?.geometry.boundingBox?.getSize(dimensions);
          object3d?.position.copy(gameEvent.data.object3d.position);
          object3d?.quaternion.copy(gameEvent.data.object3d.quaternion);
          globals.localObjects.push({
            id,
            speed,
            object3d,
            dimensions,
          });
          break;
        }
        default:
          break;
      }
    },
    [load]
  );

  return { gameEventHandler };
};
