import { useCallback } from "react";
import * as THREE from "three";

import * as globals from "src/globals";
import * as types from "src/types";
import * as parameters from "src/parameters";

const uInterval = parameters.unreliableStateInterval;

export const useObjects = (onChangeObjectIds: (value: string[]) => void) => {
  const handleReceiveBaseState = useCallback(
    (baseStateObjects: types.BaseStateObject[]) => {
      let objectIdsChanged = false;

      const removeNonExistent = () => {
        for (let i = 0; i < globals.remoteObjects.length; i++) {
          const r = globals.remoteObjects[i];
          const b = baseStateObjects.find((x) => x.id === r.id);
          if (!b) {
            objectIdsChanged = true;
            globals.remoteObjects.splice(i, 1);
          }
        }
      };

      const addNewOrUpdate = () => {
        for (let i = 0; i < baseStateObjects.length; i++) {
          const b = baseStateObjects[i];
          const r = globals.remoteObjects.find((x) => x.id === b.id);
          if (r) {
            r.idOverNetwork = b.idOverNetwork;
            r.username = b.username;
            r.isPlayer = b.isPlayer;
          } else {
            objectIdsChanged = true;
            globals.remoteObjects.push({
              id: b.id,
              idOverNetwork: b.idOverNetwork,
              isMe: b.id === globals.state.ownId,
              type: types.GameObjectType.FIGHTER,
              isPlayer: b.isPlayer,
              username: b.username,
              score: 0,
              controlsUp: 0,
              controlsDown: 0,
              controlsLeft: 0,
              controlsRight: 0,
              controlsSpace: 0,
              controlsD: 0,
              controlsF: 0,
              controlsOverChannelsUp: 0,
              controlsOverChannelsDown: 0,
              controlsOverChannelsLeft: 0,
              controlsOverChannelsRight: 0,
              controlsOverChannelsSpace: 0,
              controlsOverChannelsD: 0,
              controlsOverChannelsF: 0,
              rotationSpeed: 0,
              verticalSpeed: 0,
              speed: 0,
              backendPosition: new THREE.Vector3(0, 0, 1),
              backendQuaternion: new THREE.Quaternion(0, 0, 0, 0),
              keyDowns: [],
              infoElement: {
                containerRef: undefined,
                row1Ref: undefined,
                row2Ref: undefined,
              },
              object3d: undefined,
              dimensions: undefined,
              shotDelay: 0,
              collisions: {},
              health: 100,
              positionZ: 1000,
              backendPositionZ: 1000,
            });
          }
        }
      };

      const updateObjectIds = () => {
        if (objectIdsChanged) {
          const ids = baseStateObjects.map((x) => x.id);
          onChangeObjectIds(ids);
          globals.state.ownRemoteObjectIndex = globals.remoteObjects.findIndex(
            (x) => x.isMe
          );
        }
      };

      removeNonExistent();
      addNewOrUpdate();
      updateObjectIds();
    },
    [onChangeObjectIds]
  );

  const handleQuit = useCallback(() => {
    globals.remoteObjects.splice(0, globals.remoteObjects.length);
    onChangeObjectIds([]);
  }, [onChangeObjectIds]);

  const handleReceiveState = useCallback(
    (updateObjects: types.UpdateObject[]) => {
      for (let i = globals.remoteObjects.length - 1; i > -1; i--) {
        const o = globals.remoteObjects[i];
        const u = o && updateObjects[o.idOverNetwork];
        if (u) {
          o.health = u.health;
          o.backendPosition.setX(u.xDecoded);
          o.backendPosition.setY(u.yDecoded);
          o.backendPositionZ = u.z;
          o.backendQuaternion.set(
            u.quaternion.x,
            u.quaternion.y,
            u.quaternion.z,
            u.quaternion.w
          );
          if (!o.isMe) {
            o.controlsUp += u.ctrlsUp ? uInterval : 0;
            o.controlsDown += u.ctrlsDown ? uInterval : 0;
            o.controlsLeft += u.ctrlsLeft ? uInterval : 0;
            o.controlsRight += u.ctrlsRight ? uInterval : 0;
            o.controlsSpace += u.ctrlsSpace ? uInterval : 0;
            o.controlsD += u.ctrlsD ? uInterval : 0;
            o.controlsF += u.ctrlsF ? uInterval : 0;
          }
        }
      }
    },
    []
  );

  return {
    handleQuit,
    handleReceiveBaseState,
    handleReceiveState,
  };
};
