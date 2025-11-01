import { decodeAngle } from "../../utils";
import { debugOn } from "../components/UserInterface/Sidepanel/Header";
import * as types from "../../types";
import * as parameters from "../../parameters";

import * as netcodeGlobals from "./globals";

let currentReliableStateSequenceNumber = 0;
let currentUnreliableStateIdsInOrderMaxIndex = 0;

export const handleReceiveUnreliableStateDataBinary = (dataView: DataView) => {
  const reliableStateSequenceNumber = dataView.getUint8(2);

  const associatedState =
    netcodeGlobals.recentStates[reliableStateSequenceNumber]?.data;
  if (!associatedState) {
    console.warn(
      "Received update data for unknown state version:",
      reliableStateSequenceNumber
    );
    return;
  }
  let offset = 3;
  let idsInOrderIndex = 0;
  const updateObjects: { [id: string]: types.UpdateObject } = {};

  while (offset < dataView.byteLength) {
    const associatedObject = associatedState[idsInOrderIndex];
    const providedValues1to8 = dataView.getUint8(offset);
    const providedValues9to16 = dataView.getUint8(offset + 1);
    offset += 2;
    const p: types.UpdateObject = {
      uScore: 0,
      uHealth: 0,
      uControlsUp: 0,
      uControlsDown: 0,
      uControlsLeft: 0,
      uControlsRight: 0,
      uControlsSpace: 0,
      uControlsD: 0,
      uControlsF: 0,
      uRotationSpeed: 0,
      uVerticalSpeed: 0,
      uSpeed: 0,
      uPositionX: 0,
      uPositionY: 0,
      uPositionZ: 0,
      uAngleZ: 0,
      // uQuaternionX: 0,
      // uQuaternionY: 0,
      // uQuaternionZ: 0,
      // uQuaternionW: 0,
    };

    if (providedValues1to8 & 0b00000001) {
      p.uScore = dataView.getUint32(offset);
      offset += 4;
    } else {
      p.uScore = associatedObject.score;
    }

    if (providedValues1to8 & 0b00000010) {
      p.uHealth = dataView.getUint8(offset);
      offset += 1;
    } else {
      p.uHealth = associatedObject.health;
    }

    if (providedValues1to8 & 0b00000100) {
      p.uControlsUp = dataView.getUint8(offset);
      offset += 1;
    }

    if (providedValues1to8 & 0b00001000) {
      p.uControlsDown = dataView.getUint8(offset);
      offset += 1;
    }

    if (providedValues1to8 & 0b00010000) {
      p.uControlsLeft = dataView.getUint8(offset);
      offset += 1;
    }

    if (providedValues1to8 & 0b00100000) {
      p.uControlsRight = dataView.getUint8(offset);
      offset += 1;
    }

    if (providedValues1to8 & 0b01000000) {
      p.uControlsSpace = dataView.getUint8(offset);
      offset += 1;
    }

    if (providedValues1to8 & 0b10000000) {
      p.uControlsD = dataView.getUint8(offset);
      offset += 1;
    }

    if (providedValues9to16 & 0b00000001) {
      p.uControlsF = dataView.getUint8(offset);
      offset += 1;
    }

    if (providedValues9to16 & 0b00000010) {
      p.uRotationSpeed = dataView.getInt8(offset);
      offset += 1;
    } else {
      p.uRotationSpeed = associatedObject.rotationSpeed;
    }

    if (providedValues9to16 & 0b00000100) {
      p.uVerticalSpeed = dataView.getInt8(offset);
      offset += 1;
    } else {
      p.uVerticalSpeed = associatedObject.verticalSpeed;
    }

    if (providedValues9to16 & 0b00001000) {
      p.uSpeed = dataView.getUint16(offset) * parameters.networkToSpeedFactor;
      offset += 2;
    } else {
      p.uSpeed = associatedObject.speed;
    }

    if (providedValues9to16 & 0b00010000) {
      p.uPositionX =
        dataView.getInt32(offset) * parameters.networkToPositionFactor;
      offset += 4;
    } else {
      p.uPositionX = associatedObject.positionX;
    }

    if (providedValues9to16 & 0b00100000) {
      p.uPositionY =
        dataView.getInt32(offset) * parameters.networkToPositionFactor;
      offset += 4;
    } else {
      p.uPositionY = associatedObject.positionY;
    }

    if (providedValues9to16 & 0b01000000) {
      p.uPositionZ = dataView.getFloat32(offset);
      offset += 4;
    } else {
      p.uPositionZ = associatedObject.positionZ;
    }

    if (providedValues9to16 & 0b10000000) {
      p.uAngleZ = decodeAngle(dataView.getUint16(offset));
      offset += 2;
    } else {
      p.uAngleZ = associatedObject.angleZ;
    }

    // if (providedValues9to16 & 0b00010000) {
    //   p.uQuaternionX = dataView.getFloat32(offset);
    //   offset += 4;
    // } else {
    //   p.uQuaternionX = associatedObject.quaternionX;
    // }

    // if (providedValues9to16 & 0b00100000) {
    //   p.uQuaternionY = dataView.getFloat32(offset);
    //   offset += 4;
    // } else {
    //   p.uQuaternionY = associatedObject.quaternionY;
    // }

    // if (providedValues9to16 & 0b01000000) {
    //   p.uQuaternionZ = dataView.getFloat32(offset);
    //   offset += 4;
    // } else {
    //   p.uQuaternionZ = associatedObject.quaternionZ;
    // }

    // if (providedValues9to16 & 0b10000000) {
    //   p.uQuaternionW = dataView.getFloat32(offset);
    //   offset += 4;
    // } else {
    //   p.uQuaternionW = associatedObject.quaternionW;
    // }

    updateObjects[associatedObject.id] = p;
    idsInOrderIndex++;
  }

  if (
    debugOn.value &&
    reliableStateSequenceNumber !== currentReliableStateSequenceNumber
  ) {
    currentReliableStateSequenceNumber = reliableStateSequenceNumber;
    console.log("reliableStateSequenceNumber:", reliableStateSequenceNumber);
    console.log("updateObjects:", updateObjects);
  }
  if (
    debugOn.value &&
    idsInOrderIndex !== currentUnreliableStateIdsInOrderMaxIndex
  ) {
    currentUnreliableStateIdsInOrderMaxIndex = idsInOrderIndex;
    console.log(
      "unreliableStateIdsInOrderMaxIndex:",
      currentUnreliableStateIdsInOrderMaxIndex
    );
  }
  return updateObjects;
};
