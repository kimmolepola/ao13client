import { useRef, useCallback } from "react";
import { useSetRecoilState } from "recoil";

import { chatMessageTimeToLive } from "src/parameters";
import { remoteObjects } from "src/globals";
import * as atoms from "src/atoms";
import * as types from "src/types";
import * as clientHooks from "src/Game/hooks";
import { handleReceiveUnreliableStateDataBinary } from "../../Game/netcode/unreliableState";
import { handleReceiveReliableStateDataBinary } from "../../Game/netcode/reliableState";

const sequenceNumber16bitsIsNewer = (
  newSeq: number,
  recentSeq: number | null
) => {
  return recentSeq === null
    ? true
    : ((newSeq - recentSeq + 0x10000) & 0xffff) < 0x8000;
};

export const useReceive = () => {
  const mostRecentSequenceNumber16bits = useRef<number | null>(null);

  const setChatMessages = useSetRecoilState(atoms.chatMessages);
  const { handleReceiveBaseState, handleReceiveState } =
    clientHooks.useObjects();

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

  const onReceiveReliableBinary = useCallback((data: ArrayBuffer) => {
    const dataView = new DataView(data);
    handleReceiveReliableStateDataBinary(dataView);
  }, []);

  const onReceiveUnreliableBinary = useCallback(
    (data: ArrayBuffer) => {
      const dataView = new DataView(data);
      const sequenceNumber16bits = dataView.getUint16(0);

      if (
        sequenceNumber16bitsIsNewer(
          sequenceNumber16bits,
          mostRecentSequenceNumber16bits.current
        )
      ) {
        mostRecentSequenceNumber16bits.current = sequenceNumber16bits;
        const updateObjects = handleReceiveUnreliableStateDataBinary(dataView);
        updateObjects && handleReceiveState(updateObjects);
      }
    },
    [handleReceiveState]
  );

  return {
    onReceiveReliable,
    onReceiveReliableBinary,
    onReceiveUnreliableBinary,
  };
};
