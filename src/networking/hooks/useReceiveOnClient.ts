import { useCallback } from "react";
import { useSetRecoilState } from "recoil";

import { chatMessageTimeToLive } from "src/parameters";
import { remoteObjects } from "src/globals";
import * as atoms from "src/atoms";
import * as types from "src/types";
import * as clientHooks from "src/Game/Client/hooks";

let mostRecentTimestamp = 0;

export const useReceiveOnClient = () => {
  const setChatMessages = useSetRecoilState(atoms.chatMessages);
  const { handleUpdateData, handleStateData } = clientHooks.useObjects();

  const onReceive = useCallback(
    (data: types.NetData) => {
      console.log("--receive:", data);
      switch (data.type) {
        case types.ServerDataType.State: {
          handleStateData(data);
          break;
        }
        case types.ServerDataType.Update: {
          if (data.timestamp > mostRecentTimestamp) {
            mostRecentTimestamp = data.timestamp;
            handleUpdateData(data);
          }
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
    [handleStateData, handleUpdateData, setChatMessages]
  );
  return { onReceive };
};
