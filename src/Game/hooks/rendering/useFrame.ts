import * as THREE from "three";

import * as networkingHooks from "src/networking/hooks";
import * as parameters from "src/parameters";
import * as globals from "src/globals";
import * as types from "src/types";
import * as logic from "../../logic";
import { RefObject } from "react";

const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v3 = new THREE.Vector3();
const q1 = new THREE.Quaternion();
const q2 = new THREE.Quaternion();
const q3 = new THREE.Quaternion();
let nextSendTime = Date.now();

export const useFrame = (
  camera: THREE.PerspectiveCamera,
  infoBoxRef: RefObject<HTMLDivElement>,
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>,
  gameEventHandler: types.GameEventHandler
) => {
  const { sendUnordered } = networkingHooks.useSend();

  const handleLocalObjects = (delta: number) => {
    const localObjectsRemoveIndexes = [];
    for (let i = globals.localObjects.length - 1; i > -1; i--) {
      const o = globals.localObjects[i];
      if (o && o.object3d) {
        const remove = logic.handleLocalObject(delta, o, o.object3d);
        remove && localObjectsRemoveIndexes.push(i);
      }
    }
    gameEventHandler({
      type: types.EventType.REMOVE_LOCAL_OBJECT_INDEXES,
      data: localObjectsRemoveIndexes,
    });
    localObjectsRemoveIndexes.splice(0, localObjectsRemoveIndexes.length);
  };

  const handleObjects = (delta: number) => {
    for (let i = globals.remoteObjects.length - 1; i > -1; i--) {
      const o = globals.remoteObjects[i];
      if (o && o.object3d) {
        if (o.object3d.visible) {
          logic.checkHealth(o, gameEventHandler);
          if (o.isMe) {
            logic.handleKeys(delta, o);
            logic.handleCamera(camera, o, o.object3d);
            logic.handleInfoBox(o, o.object3d, infoBoxRef);
            if (Date.now() > nextSendTime) {
              nextSendTime = Date.now() + parameters.sendIntervalClient;
              const controlsData = logic.gatherControlsData(o);
              if (controlsData) {
                sendUnordered({
                  type: types.ClientDataType.Controls,
                  data: controlsData,
                });
                logic.resetControlValues(o);
              }
            }
          }
          logic.handleMovement(delta, o, o.object3d);
          logic.handleShot(delta, o, gameEventHandler);
        }
        logic.interpolatePosition(o, o.object3d);
        logic.handleDataBlock(o, v1, v2, v3, q1, q2, q3, o.object3d, camera);
      }
    }
  };

  const runFrame = (delta: number) => {
    handleLocalObjects(delta);
    handleObjects(delta);
    logic.handleRadarBox(radarBoxRef);
  };
  return { runFrame };
};
