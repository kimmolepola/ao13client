import * as THREE from "three";
import { useSetRecoilState } from "recoil";

import * as networkingHooks from "src/networking/hooks";
import * as parameters from "src/parameters";
import * as globals from "src/globals";
import * as atoms from "src/atoms";
import * as types from "src/types";
import * as commonLogic from "src/Game/Common/logic";
import * as logic from "../../logic";
import { RefObject } from "react";

const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v3 = new THREE.Vector3();
const q1 = new THREE.Quaternion();
const q2 = new THREE.Quaternion();
const q3 = new THREE.Quaternion();
let nextSendTime = Date.now();
let nextScoreTime = Date.now();
const scoreTimeInteval = 9875;

export const useFrame = (
  camera: THREE.PerspectiveCamera,
  infoBoxRef: RefObject<HTMLDivElement>,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
  gameEventHandler: types.ServerGameEventHandler,
  commonGameEventHandler: types.CommonGameEventHandler
) => {
  const setScore = useSetRecoilState(atoms.score);
  const { sendUnordered } = networkingHooks.useSendFromMain();

  const handleLocalObjects = (delta: number) => {
    const localObjectsRemoveIndexes = [];
    for (let i = globals.localObjects.length - 1; i > -1; i--) {
      const o = globals.localObjects[i];
      if (o && o.object3d) {
        const remove = commonLogic.handleLocalObject(delta, o, o.object3d);
        remove && localObjectsRemoveIndexes.push(i);
      }
    }
    commonGameEventHandler({
      type: types.EventType.REMOVE_LOCAL_OBJECT_INDEXES,
      data: localObjectsRemoveIndexes,
    });
    localObjectsRemoveIndexes.splice(0, localObjectsRemoveIndexes.length);
  };

  const handleRemoteObjects = (
    delta: number,
    updateData: { [id: string]: types.UpdateObject },
    time: number
  ) => {
    for (let i = globals.remoteObjects.length - 1; i > -1; i--) {
      const o = globals.remoteObjects[i];
      if (o && o.object3d) {
        if (o.object3d.visible) {
          commonLogic.checkHealth(o, commonGameEventHandler);
          logic.detectCollision(o, time, gameEventHandler);
          if (o.isMe) {
            commonLogic.handleKeys(delta, o);
            commonLogic.handleCamera(camera, o, o.object3d);
            commonLogic.handleInfoBox(o, o.object3d, infoBoxRef);
          }
          commonLogic.handleMovement(delta, o, o.object3d);
          commonLogic.handleShot(delta, o, commonGameEventHandler);
          // mock
          if (Date.now() > nextScoreTime) {
            nextScoreTime = Date.now() + scoreTimeInteval;
            o.score += 1;
            setScore(o.score);
          }
        }
        if (Date.now() > nextSendTime) {
          logic.gatherUpdateData(updateData, o);
          commonLogic.resetControlValues(o);
        }
        commonLogic.handleDataBlock(
          o,
          v1,
          v2,
          v3,
          q1,
          q2,
          q3,
          o.object3d,
          camera
        );
      }
    }
  };

  const runFrame = (delta: number) => {
    const time = Date.now();
    const updateData: { [id: string]: types.UpdateObject } = {};

    handleLocalObjects(delta);
    handleRemoteObjects(delta, updateData, time);
    commonLogic.handleRadarBox(radarBoxRef);

    if (time > nextSendTime) {
      nextSendTime = time + parameters.sendIntervalMain;
      sendUnordered({
        timestamp: time,
        type: types.NetDataType.UPDATE,
        data: updateData,
      });
    }
  };
  return { runFrame };
};
