import { useCallback } from "react";
import { useSetRecoilState } from "recoil";
import * as THREE from "three";

import * as globals from "src/globals";
import * as atoms from "src/atoms";
import * as types from "src/types";

export const useObjects = () => {
  const setObjectIds = useSetRecoilState(atoms.objectIds);

  const handleUpdateData = useCallback((data: types.Update) => {
    for (let i = globals.remoteObjects.length - 1; i > -1; i--) {
      const o = globals.remoteObjects[i];
      const u = o && data.data[o.id];
      if (u) {
        o.score = u.uScore;
        o.rotationSpeed = u.uRotationSpeed || 0;
        o.speed = u.uSpeed || 0;
        o.backendPosition.set(u.uPositionX, u.uPositionY, u.uPositionZ);
        o.backendQuaternion.set(
          u.uQuaternionX,
          u.uQuaternionY,
          u.uQuaternionZ,
          u.uQuaternionW
        );
        if (!o.isMe) {
          o.controlsUp += u.uControlsUp || 0;
          o.controlsDown += u.uControlsDown || 0;
          o.controlsLeft += u.uControlsLeft || 0;
          o.controlsUp += u.uControlsUp || 0;
          o.controlsSpace += u.uControlsSpace || 0;
        }
      }
    }
  }, []);

  const handleStateData = useCallback(
    (data: types.State) => {
      let objectIdsChanged = false;
      for (let i = globals.remoteObjects.length - 1; i > -1; i--) {
        const o = globals.remoteObjects[i];
        const s = o && data.data[o.id];
        if (!s) {
          objectIdsChanged = true;
        } else {
          o.username = s.sUsername;
        }
      }
      Object.values(data.data).forEach((s) => {
        if (!globals.remoteObjects.some((x) => x.id === s.sId)) {
          objectIdsChanged = true;
          globals.remoteObjects.push({
            id: s.sId,
            isMe: s.sId === globals.state.ownId,
            type: types.GameObjectType.VEHICLE,
            isPlayer: s.sIsPlayer,
            username: s.sUsername,
            score: s.sScore,
            controlsUp: 0,
            controlsDown: 0,
            controlsLeft: 0,
            controlsRight: 0,
            controlsSpace: 0,
            controlsOverChannelsUp: 0,
            controlsOverChannelsDown: 0,
            controlsOverChannelsLeft: 0,
            controlsOverChannelsRight: 0,
            controlsOverChannelsSpace: 0,
            rotationSpeed: s.sRotationSpeed,
            speed: s.sSpeed,
            backendPosition: new THREE.Vector3(
              s.sPositionX,
              s.sPositionY,
              s.sPositionZ
            ),
            backendQuaternion: new THREE.Quaternion(
              s.sQuaternionX,
              s.sQuaternionY,
              s.sQuaternionZ,
              s.sQuaternionW
            ),
            keyDowns: [],
            infoElement: undefined,
            object3d: undefined,
            dimensions: undefined,
            shotDelay: 0,
            collisions: {},
          });
        }
      });
      if (objectIdsChanged) {
        const ids = Object.keys(data.data);
        setObjectIds(ids);
      }
    },
    [setObjectIds]
  );

  const handleQuit = useCallback(() => {
    globals.remoteObjects.splice(0, globals.remoteObjects.length);
    setObjectIds([]);
  }, [setObjectIds]);

  const handleRemoveId = useCallback(
    (remoteId: string) => {
      const indexToRemove = globals.remoteObjects.findIndex(
        (x) => x.id === remoteId
      );
      indexToRemove !== -1 && globals.remoteObjects.splice(indexToRemove, 1);
      const newIds = globals.remoteObjects.map((x) => x.id);
      setObjectIds(newIds);
    },
    [setObjectIds]
  );

  return {
    handleUpdateData,
    handleStateData,
    handleQuit,
    handleRemoveId,
  };
};
