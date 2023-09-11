import * as THREE from "three";

import * as networkingHooks from "src/networking/hooks";
import * as parameters from "src/parameters";
import * as globals from "src/globals";
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

export const useFrame = (
  camera: THREE.PerspectiveCamera,
  infoBoxRef: RefObject<HTMLDivElement>,
  gameEventHandler: types.GameEventHandler
) => {
  const { sendUnordered } = networkingHooks.useSendFromClient();

  const runFrame = (delta: number) => {
    for (let i = globals.objects.length - 1; i > -1; i--) {
      const o = globals.objects[i];
      if (o && o.object3D) {
        if (o.isMe) {
          commonLogic.handleKeys(delta, o);
          commonLogic.handleCamera(camera, o, o.object3D);
          commonLogic.handleInfoBoxElement(o, o.object3D, infoBoxRef);
          if (Date.now() > nextSendTime) {
            nextSendTime = Date.now() + parameters.sendIntervalClient;
            sendUnordered({
              type: types.NetDataType.CONTROLS,
              data: logic.gatherControlsData(o),
            });
            commonLogic.resetControlValues(o);
          }
        }
        commonLogic.handleMovement(delta, o, o.object3D);
        commonLogic.handleShot(delta, o, gameEventHandler);

        logic.interpolatePosition(o, o.object3D);
        commonLogic.handleInfoElement(
          o,
          v1,
          v2,
          v3,
          q1,
          q2,
          q3,
          o.object3D,
          camera
        );
      }
    }
  };
  return { runFrame };
};
