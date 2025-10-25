import { useCallback } from "react";
import { useSetRecoilState } from "recoil";

import { chatMessageTimeToLive } from "src/parameters";
import { remoteObjects } from "src/globals";
import * as atoms from "src/atoms";
import * as types from "src/types";
import * as clientHooks from "src/Game/hooks";

let mostRecentSequenceNumber16bits = 0;

const sequenceNumber16bitsIsNewer = (a: number, b: number) => {
  return ((a - b + 0x10000) & 0xffff) < 0x8000;
};

export const useReceive = () => {
  const setChatMessages = useSetRecoilState(atoms.chatMessages);
  const {
    handleReceiveBaseState,
    handleReceiveReliableStateDataBinary,
    handleReceiveUnreliableStateDataBinary,
  } = clientHooks.useObjects();

  const onReceiveReliable = useCallback(
    (data: types.NetData) => {
      switch (data.type) {
        case types.ServerDataType.BaseState: {
          handleReceiveBaseState(data.data);
          break;
        }
        case types.ServerDataType.ChatMessage_Server: {
          const message = {
            ...data,
            username:
              remoteObjects.find((x) => x.id === data.userId)?.username || "",
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
    },
    [setChatMessages, handleReceiveBaseState]
  );

  const onReceiveReliableBinary = useCallback(
    (data: ArrayBuffer) => {
      const dataView = new DataView(data);
      handleReceiveReliableStateDataBinary(dataView);
    },
    [handleReceiveReliableStateDataBinary]
  );

  const onReceiveUnreliableBinary = useCallback(
    (data: ArrayBuffer) => {
      const dataView = new DataView(data);
      const sequenceNumber16bits = dataView.getUint16(0);
      if (
        sequenceNumber16bitsIsNewer(
          sequenceNumber16bits,
          mostRecentSequenceNumber16bits
        )
      ) {
        mostRecentSequenceNumber16bits = sequenceNumber16bits;
        handleReceiveUnreliableStateDataBinary(dataView);
      }
    },
    [handleReceiveUnreliableStateDataBinary]
  );

  return {
    onReceiveReliable,
    onReceiveReliableBinary,
    onReceiveUnreliableBinary,
  };
};
