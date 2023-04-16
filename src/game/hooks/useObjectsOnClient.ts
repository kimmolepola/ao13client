import { useCallback } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import * as THREE from "three";

import { objects } from "src/globals";
import * as atoms from "src/atoms";
import * as types from "src/types";

export const useObjectsOnClient = () => {
  const ownId = useRecoilValue(atoms.ownId);
  const setObjectIds = useSetRecoilState(atoms.objectIds);

  const handleUpdateData = useCallback((data: types.Update) => {
    for (let i = objects.length - 1; i > -1; i--) {
      const o = objects[i];
      const u = o && data.data[o.id];
      if (u) {
        o.score = u.uScore;
        o.controlsUp += u.uControlsUp || 0;
        o.controlsDown += u.uControlsDown || 0;
        o.controlsLeft += u.uControlsLeft || 0;
        o.controlsUp += u.uControlsUp || 0;
        o.rotationSpeed = u.uRotationSpeed || 0;
        o.speed = u.uSpeed || 0;
        o.backendPosition.set(u.uPositionX, u.uPositionY, u.uPositionZ);
        o.backendQuaternion.set(
          u.uQuaternionX,
          u.uQuaternionY,
          u.uQuaternionZ,
          u.uQuaternionW
        );
      }
    }
  }, []);

  const handleStateData = useCallback(
    (data: types.State) => {
      let objectIdsChanged = false;
      for (let i = objects.length - 1; i > -1; i--) {
        const o = objects[i];
        const s = o && data.data[o.id];
        if (!s) {
          objectIdsChanged = true;
          objects.splice(i, 1);
        } else {
          o.username = s.sUsername;
        }
      }
      Object.values(data.data).forEach((s) => {
        if (!objects.some((x) => x.id === s.sId)) {
          objectIdsChanged = true;
          objects.push({
            id: s.sId,
            isMe: s.sId === ownId,
            isPlayer: s.sIsPlayer,
            username: s.sUsername,
            score: s.sScore,
            controlsUp: 0,
            controlsDown: 0,
            controlsLeft: 0,
            controlsRight: 0,
            controlsOverChannelsUp: 0,
            controlsOverChannelsDown: 0,
            controlsOverChannelsLeft: 0,
            controlsOverChannelsRight: 0,
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
            infoBoxElement: undefined,
            object3D: undefined,
          });
        }
      });
      if (objectIdsChanged) {
        const ids = Object.keys(data.data);
        setObjectIds(ids);
      }
    },
    [ownId, setObjectIds]
  );

  const handleQuitForObjectsOnClient = useCallback(() => {
    objects.splice(0, objects.length);
    setObjectIds([]);
  }, [setObjectIds]);

  const handleRemoveIdOnClient = useCallback(
    (remoteId: string) => {
      const indexToRemove = objects.findIndex((x) => x.id === remoteId);
      indexToRemove !== -1 && objects.splice(indexToRemove, 1);
      const newIds = objects.map((x) => x.id);
      setObjectIds(newIds);
    },
    [setObjectIds]
  );

  return {
    handleUpdateData,
    handleStateData,
    handleQuitForObjectsOnClient,
    handleRemoveIdOnClient,
  };
};
