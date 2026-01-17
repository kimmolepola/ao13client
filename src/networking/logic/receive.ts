import { Dispatch, SetStateAction } from "react";

import { chatMessageTimeToLive } from "src/parameters";
import { sharedObjects } from "src/globals";
import * as types from "src/types";
import { handleReceiveStateData } from "../../Game/netcode/state";

import * as debug from "../../Game/debug/debug";
import { sendAck } from "./send";

const sequenceNumberIsNewer = (newSeq: number, recentSeq: number | null) => {
  return recentSeq === null
    ? true
    : ((newSeq - recentSeq + 0x100) & 0xff) < 0x80;
};

const toRecent = (seq: number) => seq % 32 === 0;

const ackView = new Uint8Array(new ArrayBuffer(1));
let mostRecentSequenceNumber: number | null = null;

export const onReceiveStringData = (
  data: types.StringData,
  handleReceiveBaseState: (
    baseState: types.BaseState,
    onChangeObjectIds: (value: string[]) => void,
    onChangeStaticObjects: (value: types.BaseStateStaticObject[]) => void
  ) => void,
  onChangeObjectIds: (value: string[]) => void,
  setChatMessages: Dispatch<SetStateAction<types.ChatMessage[]>>,
  onChangeStaticObjects: (value: types.BaseStateStaticObject[]) => void
) => {
  switch (data.type) {
    case types.ServerDataType.BaseState: {
      handleReceiveBaseState(data, onChangeObjectIds, onChangeStaticObjects);
      break;
    }
    case types.ServerDataType.ChatMessage_Server: {
      const message = {
        ...data,
        username:
          sharedObjects.find((x) => x.id === data.userId)?.username || "",
      };
      setChatMessages((x) => [message, ...x]);
      setTimeout(
        () => setChatMessages((x) => x.filter((xx) => xx !== message)),
        chatMessageTimeToLive
      );
      break;
    }
    default:
      break;
  }
};

export const onReceiveState = (
  data: ArrayBuffer,
  handleReceiveState: (updateObjects: types.UpdateObject[]) => void
) => {
  debug.receiveState(data);
  const dataView = new DataView(data);
  const sequenceNumber = dataView.getUint8(0);
  const save = toRecent(sequenceNumber);

  if (save) {
    ackView[0] = sequenceNumber;
    sendAck(ackView.buffer);
    debug.debug(sequenceNumber);
  }

  const isNewer = sequenceNumberIsNewer(
    sequenceNumber,
    mostRecentSequenceNumber
  );

  if (isNewer || save) {
    mostRecentSequenceNumber = sequenceNumber;
    const updateObjects = handleReceiveStateData(dataView, save);
    isNewer && updateObjects && handleReceiveState(updateObjects);
  }
  if (!isNewer) {
    debug.statistics.outOfSequence++;
  }
};

export const resetMostRecentSequenceNumber = () => {
  mostRecentSequenceNumber = null;
};
