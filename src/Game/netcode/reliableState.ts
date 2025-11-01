import * as types from "../../types";
import * as parameters from "../../parameters";
import { debugOn } from "../components/UserInterface/Sidepanel/Header";
import * as netcodeGlobals from "./globals";
import { debug } from "./debug";

type RecentState = {
  sequenceNumber: number;
  stateDataInOrder: types.ReliableState[];
};

const updateRecentStates = (state: RecentState) => {
  netcodeGlobals.recentStates[state.sequenceNumber] = {
    timestamp: Date.now(),
    data: state.stateDataInOrder,
  };

  if (Object.keys(netcodeGlobals.recentStates).length > 10) {
    const oldest: {
      timestamp: number;
      sequenceNumber: number | undefined;
    } = {
      timestamp: Date.now(),
      sequenceNumber: undefined,
    };
    Object.entries(netcodeGlobals.recentStates).forEach(([key, value]) => {
      if (value?.timestamp && value.timestamp < oldest.timestamp) {
        oldest.timestamp = value.timestamp;
        oldest.sequenceNumber = Number(key);
      }
    });
    oldest.sequenceNumber &&
      delete netcodeGlobals.recentStates[oldest.sequenceNumber];
  }
  debugOn.value && debug(state.sequenceNumber);
};

export const handleReceiveReliableStateDataBinary = (dataView: DataView) => {
  const state: RecentState = {
    sequenceNumber: dataView.getUint8(0),
    stateDataInOrder: [],
  };
  const byteLength = dataView.byteLength;
  let offset = 1;
  while (offset + types.reliableStateSingleObjectBytes <= byteLength) {
    const stateData: types.ReliableState = {
      id:
        "" +
        dataView.getUint32(offset).toString(16).padStart(8, "0") +
        dataView
          .getUint32(offset + 4)
          .toString(16)
          .padStart(8, "0") +
        dataView
          .getUint32(offset + 8)
          .toString(16)
          .padStart(8, "0") +
        dataView
          .getUint32(offset + 12)
          .toString(16)
          .padStart(8, "0"),
      score: dataView.getUint32(offset + 16),
      health: dataView.getUint8(offset + 20),
      rotationSpeed: dataView.getInt8(offset + 21),
      verticalSpeed: dataView.getInt8(offset + 22),
      speed: dataView.getUint16(offset + 23) * parameters.networkToSpeedFactor,
      positionX: dataView.getFloat32(offset + 25),
      positionY: dataView.getFloat32(offset + 29),
      positionZ: dataView.getFloat32(offset + 33),
      angleZ: dataView.getFloat32(offset + 37),
      // quaternionX: dataView.getFloat32(offset + 36),
      // quaternionY: dataView.getFloat32(offset + 40),
      // quaternionZ: dataView.getFloat32(offset + 44),
      // quaternionW: dataView.getFloat32(offset + 48),
    };
    state.stateDataInOrder.push(stateData);
    offset += types.reliableStateSingleObjectBytes;
  }
  updateRecentStates(state);
};
