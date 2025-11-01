import { useCallback } from "react";
import { useSetRecoilState } from "recoil";
import * as THREE from "three";

import * as globals from "src/globals";
import * as atoms from "src/atoms";
import * as types from "src/types";

const axis = new THREE.Vector3(0, 0, 1);

export const useObjects = () => {
  const setObjectIds = useSetRecoilState(atoms.objectIds);

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
            r.username = b.username;
            r.isPlayer = b.isPlayer;
          } else {
            objectIdsChanged = true;
            globals.remoteObjects.push({
              id: b.id,
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
          setObjectIds(ids);
        }
      };

      removeNonExistent();
      addNewOrUpdate();
      updateObjectIds();
    },
    [setObjectIds]
  );

  const handleQuit = useCallback(() => {
    globals.remoteObjects.splice(0, globals.remoteObjects.length);
    setObjectIds([]);
  }, [setObjectIds]);

  const handleReceiveState = useCallback(
    (updateObjects: { [id: string]: types.UpdateObject }) => {
      for (let i = globals.remoteObjects.length - 1; i > -1; i--) {
        const o = globals.remoteObjects[i];
        const u = o && updateObjects[o.id];
        if (u) {
          o.score = u.uScore;
          o.health = u.uHealth;
          o.rotationSpeed = u.uRotationSpeed || 0;
          o.speed = u.uSpeed || 0;
          o.backendPosition.set(u.uPositionX, u.uPositionY, 1);
          o.backendQuaternion.setFromAxisAngle(axis, u.uAngleZ);
          o.backendPositionZ = u.uPositionZ;
          // o.backendQuaternion.set(
          //   u.uQuaternionX,
          //   u.uQuaternionY,
          //   u.uQuaternionZ,
          //   u.uQuaternionW
          // );
          if (!o.isMe) {
            o.controlsUp += u.uControlsUp || 0;
            o.controlsDown += u.uControlsDown || 0;
            o.controlsLeft += u.uControlsLeft || 0;
            o.controlsUp += u.uControlsUp || 0;
            o.controlsSpace += u.uControlsSpace || 0;
            o.controlsD += u.uControlsD || 0;
            o.controlsF += u.uControlsF || 0;
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
