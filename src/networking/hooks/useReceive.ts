import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useCallback,
} from "react";

import { chatMessageTimeToLive } from "src/parameters";
import { remoteObjects } from "src/globals";
import * as types from "src/types";
import * as clientHooks from "src/Game/hooks";
import {
  handleReceiveStateData,
  initializeState,
} from "../../Game/netcode/state";
import * as networkingHooks from "src/networking/hooks";
import * as debug from "../../Game/netcode/debug";

const sequenceNumberIsNewer = (newSeq: number, recentSeq: number | null) => {
  return recentSeq === null
    ? true
    : ((newSeq - recentSeq + 0x100) & 0xff) < 0x80;
};

const toRecent = (seq: number) => seq % 32 === 0;

const ackView = new Uint8Array(new ArrayBuffer(1));

export const useReceive = (
  onChangeObjectIds: (value: string[]) => void,
  setChatMessages: Dispatch<SetStateAction<types.ChatMessage[]>>
) => {
  const { sendAck } = networkingHooks.useSend();
  const mostRecentSequenceNumber = useRef<number | null>(null);

  useEffect(() => {
    initializeState();
  }, []);

  const { handleReceiveBaseState, handleReceiveState } =
    clientHooks.useObjects(onChangeObjectIds);

  const onReceiveStringData = useCallback(
    (data: types.StringData) => {
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

  const onReceiveState = useCallback(
    (data: ArrayBuffer) => {
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
        mostRecentSequenceNumber.current
      );

      if (isNewer || save) {
        mostRecentSequenceNumber.current = sequenceNumber;
        const updateObjects = handleReceiveStateData(dataView, save);
        isNewer && updateObjects && handleReceiveState(updateObjects);
      }
      if (!isNewer) {
        debug.statistics.outOfSequence++;
      }
    },
    [handleReceiveState, sendAck]
  );

  return {
    onReceiveStringData,
    onReceiveState,
  };
};
